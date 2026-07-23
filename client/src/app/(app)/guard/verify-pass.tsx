import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import {
  useLogVisitorEntry,
  useLogVisitorExit,
  useVerifyPass
} from '@/features/visitors/hooks/use-visitors';
import type { PreApproval } from '@/features/visitors/services/visitors';

export default function VerifyPassScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [manualCode, setManualCode] = useState('');
  const [scanLocked, setScanLocked] = useState(false);
  const [result, setResult] = useState<PreApproval | null>(null);

  const verifyPass = useVerifyPass();
  const logEntry = useLogVisitorEntry();
  const logExit = useLogVisitorExit();

  function handleReset() {
    setResult(null);
    setManualCode('');
    setScanLocked(false);
    verifyPass.reset();
  }

  function handleScanned(data: string) {
    if (scanLocked) return;
    setScanLocked(true);
    // A QR encodes the raw pass code — same value the guard could type by
    // hand, so both paths hit the same verify call.
    verifyPass.mutate(
      { passCode: data.trim() },
      {
        onSuccess: (data) => setResult(data),
        onError: () => setScanLocked(false)
      }
    );
  }

  function handleManualSubmit() {
    if (manualCode.trim().length !== 6) return;
    verifyPass.mutate(
      { passCode: manualCode.trim().toUpperCase() },
      { onSuccess: (data) => setResult(data) }
    );
  }

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Verify pass</Text>
          <DrawerButton />
        </View>

        {result ? (
          <ResultCard
            result={result}
            onLogEntry={() =>
              logEntry.mutate(result.id, {
                onSuccess: () => setResult((current) => current && { ...current, isInside: true })
              })
            }
            onLogExit={() =>
              logExit.mutate(result.id, {
                onSuccess: () => setResult((current) => current && { ...current, isInside: false })
              })
            }
            isLoggingEntry={logEntry.isPending}
            isLoggingExit={logExit.isPending}
            onScanAnother={handleReset}
          />
        ) : (
          <>
            <View className="flex-row bg-surface rounded-xl p-1 mb-4">
              <Pressable
                onPress={() => setMode('scan')}
                className={`flex-1 items-center py-2.5 rounded-lg ${mode === 'scan' ? 'bg-card' : ''}`}
              >
                <Text
                  className={`text-xs font-sans-bold ${mode === 'scan' ? 'text-primary' : 'text-muted'}`}
                >
                  Scan QR
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('manual')}
                className={`flex-1 items-center py-2.5 rounded-lg ${mode === 'manual' ? 'bg-card' : ''}`}
              >
                <Text
                  className={`text-xs font-sans-bold ${mode === 'manual' ? 'text-primary' : 'text-muted'}`}
                >
                  Enter code
                </Text>
              </Pressable>
            </View>

            {mode === 'scan' ? (
              <ScanPanel
                permission={permission}
                requestPermission={requestPermission}
                scanLocked={scanLocked}
                onScanned={handleScanned}
                isVerifying={verifyPass.isPending}
              />
            ) : (
              <View className="items-center pt-8">
                <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-3 self-start">
                  6-character pass code
                </Text>
                <TextInput
                  value={manualCode}
                  onChangeText={(t) => setManualCode(t.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={6}
                  placeholder="ABC123"
                  placeholderTextColor={theme.muted}
                  className="w-full bg-card border border-border rounded-xl px-4 py-4 text-foreground font-sans-bold text-2xl text-center tracking-[8px] mb-4"
                />
                <Pressable
                  onPress={handleManualSubmit}
                  disabled={manualCode.trim().length !== 6 || verifyPass.isPending}
                  className="w-full rounded-xl bg-primary px-4 py-4 items-center"
                >
                  {verifyPass.isPending ? (
                    <ActivityIndicator size="small" color={theme.primaryForeground} />
                  ) : (
                    <Text className="text-sm font-sans-bold text-primary-foreground">Verify</Text>
                  )}
                </Pressable>
              </View>
            )}

            {verifyPass.isError ? (
              <View className="mt-4 rounded-xl bg-danger/10 border border-danger/20 p-3">
                <Text className="text-sm font-sans text-danger">
                  {verifyPass.error instanceof Error
                    ? verifyPass.error.message
                    : 'Could not verify this pass'}
                </Text>
                <Pressable onPress={handleReset} className="mt-2">
                  <Text className="text-xs font-sans-bold text-primary">Try again</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}

function ScanPanel({
  permission,
  requestPermission,
  scanLocked,
  onScanned,
  isVerifying
}: {
  permission: ReturnType<typeof useCameraPermissions>[0];
  requestPermission: ReturnType<typeof useCameraPermissions>[1];
  scanLocked: boolean;
  onScanned: (data: string) => void;
  isVerifying: boolean;
}) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  if (!permission) {
    return (
      <View className="items-center justify-center py-16">
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="items-center justify-center rounded-2xl border border-dashed border-border p-6 py-16">
        <Ionicons name="camera-outline" size={28} color={theme.muted} />
        <Text className="text-base font-serif-semibold text-foreground mt-3">
          Camera access needed
        </Text>
        <Text className="text-sm font-sans text-foreground-secondary text-center mt-2 mb-4">
          Portl needs the camera to scan a resident&apos;s QR pass.
        </Text>
        <Pressable onPress={requestPermission} className="rounded-xl bg-primary px-4 py-3">
          <Text className="text-xs font-sans-bold text-primary-foreground">Grant access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="rounded-2xl overflow-hidden border border-border" style={{ height: 340 }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanLocked ? undefined : (event) => onScanned(event.data)}
      />
      {isVerifying ? (
        <View className="absolute inset-0 bg-black/40 items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : null}
    </View>
  );
}

function ResultCard({
  result,
  onLogEntry,
  onLogExit,
  isLoggingEntry,
  isLoggingExit,
  onScanAnother
}: {
  result: PreApproval;
  onLogEntry: () => void;
  onLogExit: () => void;
  isLoggingEntry: boolean;
  isLoggingExit: boolean;
  onScanAnother: () => void;
}) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const isInside = Boolean(result.isInside);
  const isLogging = isLoggingEntry || isLoggingExit;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View className="rounded-2xl bg-success/10 border border-success/30 p-4 mb-4 items-center">
        <Ionicons name="checkmark-circle" size={32} color={theme.success} />
        <Text className="text-base font-serif-semibold text-foreground mt-2">Pass verified</Text>
      </View>

      <View className="bg-card border border-border rounded-2xl p-4 mb-4">
        <Text className="text-lg font-serif-semibold text-foreground">{result.name}</Text>
        <Text className="text-sm font-sans text-foreground-secondary mt-1 capitalize">
          {result.visitorType?.replace('_', ' ')}
        </Text>
        {result.phone ? (
          <Text className="text-sm font-sans text-foreground-secondary mt-1">{result.phone}</Text>
        ) : null}
        {result.purpose ? (
          <Text className="text-sm font-sans text-foreground-secondary mt-1">{result.purpose}</Text>
        ) : null}
        <Text className="text-sm font-sans text-foreground-secondary mt-2">
          Flat {result.flat?.flatNumber ?? result.flat?.number ?? result.flat?.name ?? '—'}
        </Text>
        {result.validUntil ? (
          <Text className="text-xs font-sans text-muted mt-2">
            Valid until {new Date(result.validUntil).toLocaleString()}
          </Text>
        ) : null}
      </View>

      <View
        className={`rounded-xl px-3 py-2 mb-3 self-start ${
          isInside ? 'bg-success/10' : 'bg-muted/10'
        }`}
      >
        <Text
          className={`text-[10px] font-sans-bold uppercase ${
            isInside ? 'text-success' : 'text-muted'
          }`}
        >
          {isInside ? 'Currently inside' : 'Currently outside'}
        </Text>
      </View>

      <Pressable
        onPress={isInside ? onLogExit : onLogEntry}
        disabled={isLogging}
        className={`rounded-xl px-4 py-4 items-center mb-3 ${
          isInside ? 'bg-danger/10 border border-danger/20' : 'bg-primary'
        }`}
      >
        {isLogging ? (
          <ActivityIndicator
            size="small"
            color={isInside ? theme.danger : theme.primaryForeground}
          />
        ) : (
          <Text
            className={`text-sm font-sans-bold ${
              isInside ? 'text-danger' : 'text-primary-foreground'
            }`}
          >
            {isInside ? 'Log exit' : 'Log entry'}
          </Text>
        )}
      </Pressable>

      <Pressable onPress={onScanAnother} className="items-center py-3">
        <Text className="text-xs font-sans-bold text-primary">Verify another pass</Text>
      </Pressable>
    </ScrollView>
  );
}
