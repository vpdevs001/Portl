import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Spinner } from '@/components/ui/Spinner';
import {
  useLogVisitorEntry,
  useLogVisitorExit,
  useVerifyPass
} from '@/features/visitors/hooks/use-visitors';
import type { PreApproval } from '@/features/visitors/services/visitors';
import { getErrorMessage } from '@/lib/errors';

type Mode = 'scan' | 'manual';

const MODE_OPTIONS: { value: Mode; label: string; icon: string }[] = [
  { value: 'scan', label: 'Scan QR', icon: 'qr-code-outline' },
  { value: 'manual', label: 'Enter code', icon: 'keypad-outline' }
];

export default function VerifyPassScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>('scan');
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
        <ScreenHeader title="Verify pass" showBack drawer />

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
            <SegmentedControl
              options={MODE_OPTIONS}
              value={mode}
              onChange={setMode}
              className="mb-4"
            />

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
                <SectionLabel className="mb-3 self-start">6-character pass code</SectionLabel>
                <Input
                  value={manualCode}
                  onChangeText={(t) => setManualCode(t.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={6}
                  placeholder="ABC123"
                  className="w-full py-4 font-sans-bold text-2xl text-center tracking-[8px] mb-4"
                />
                <Button
                  label="Verify"
                  size="lg"
                  loading={verifyPass.isPending}
                  disabled={manualCode.trim().length !== 6}
                  onPress={handleManualSubmit}
                  className="w-full"
                />
              </View>
            )}

            {verifyPass.isError ? (
              <View className="mt-4 rounded-xl bg-danger/10 border border-danger/20 p-3">
                <Text className="text-sm font-sans text-danger">
                  {getErrorMessage(verifyPass.error)}
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
  const theme = useTheme();

  if (!permission) {
    return (
      <View className="items-center justify-center py-16">
        <Spinner />
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
          Portl needs the camera to scan a resident’s QR pass.
        </Text>
        <Button label="Grant access" size="sm" onPress={requestPermission} />
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
      {/* Viewfinder frame */}
      <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
        <View className="w-48 h-48 rounded-2xl border-2 border-white/70" />
      </View>
      {isVerifying ? (
        <View className="absolute inset-0 bg-black/40 items-center justify-center">
          <Spinner size="large" color="#fff" />
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
  const theme = useTheme();
  const isInside = Boolean(result.isInside);
  const isLogging = isLoggingEntry || isLoggingExit;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Animated.View entering={ZoomIn.duration(350).springify().damping(16)}>
        <View className="rounded-2xl bg-success/10 border border-success/30 p-4 mb-4 items-center">
          <Ionicons name="checkmark-circle" size={32} color={theme.success} />
          <Text className="text-base font-serif-semibold text-foreground mt-2">Pass verified</Text>
        </View>
      </Animated.View>

      <Card className="p-4 mb-4">
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
          Flat {result.flat?.flatNumber ?? '—'}
        </Text>
        {result.validUntil ? (
          <Text className="text-xs font-sans text-muted mt-2">
            Valid until {new Date(result.validUntil).toLocaleString()}
          </Text>
        ) : null}
      </Card>

      <Badge
        label={isInside ? 'Currently inside' : 'Currently outside'}
        tone={isInside ? 'success' : 'muted'}
        className="mb-3"
      />

      <Button
        label={isInside ? 'Log exit' : 'Log entry'}
        variant={isInside ? 'dangerSoft' : 'primary'}
        size="lg"
        loading={isLogging}
        onPress={isInside ? onLogExit : onLogEntry}
        className="mb-3"
      />

      <Button label="Verify another pass" variant="ghost" size="sm" onPress={onScanAnother} />
    </ScrollView>
  );
}
