import { Screen } from '@/components/Screen';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Colors } from '@/constants/colors';
import { useLeaveSociety, useSocietyDetails } from '@/features/society/services/use-society';
import { useUnregisterPushToken } from '@/features/notifications/hooks/use-notifications';
import { authClient, useAppSession } from '@/lib/auth-client';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useColorScheme, useThemePreference, type ThemePreference } from '@/hooks/useColorScheme';
import { useAppLock } from '@/hooks/useAppLock';
import { DrawerButton } from '@/components/DrawerButton';
import { ResidentEntryHistoryCard } from '@/features/logs/components/ResidentEntryHistoryCard';
import * as LocalAuthentication from 'expo-local-authentication';

const APPEARANCE_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' }
];

export function ProfileScreen() {
  const { data: session, isPending: isSessionPending, refetch: refetchSession } = useAppSession();
  const { data: society, isLoading: isSocietyLoading } = useSocietyDetails();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { preference, setPreference } = useThemePreference();
  const { enabled: appLockEnabled, setEnabled: setAppLockEnabled } = useAppLock();
  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(null);
  const leaveSocietyMutation = useLeaveSociety();
  const unregisterPushToken = useUnregisterPushToken();
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  useEffect(() => {
    Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()])
      .then(([hasHardware, isEnrolled]) => setBiometricAvailable(hasHardware && isEnrolled))
      .catch(() => setBiometricAvailable(false));
  }, []);

  const handleSignOut = async () => {
    try {
      WebBrowser.dismissAuthSession();
    } catch {}

    // Best-effort — remove this device's token so it stops receiving pushes
    // for a session that's about to end. Never blocks sign-out on failure.
    try {
      if (Device.isDevice) {
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        const { data: token } = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        await unregisterPushToken.mutateAsync(token);
      }
    } catch {}

    await authClient.signOut();
  };

  const performLeaveSociety = async () => {
    setConfirmingLeave(false);
    setLeaveError(null);
    try {
      await leaveSocietyMutation.mutateAsync();
      // Session's societyId/role are now stale on the client — refetch so
      // app/_layout.tsx's navigation gate sees the change and redirects to
      // onboarding automatically.
      await refetchSession();
    } catch (e: any) {
      setLeaveError(e.message ?? 'Failed to leave society');
    }
  };

  if (isSessionPending || isSocietyLoading) {
    return (
      <Screen className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#a9832e" />
      </Screen>
    );
  }

  const user = session?.user;
  const roleLabel = (user?.role ?? 'resident').replace('_', ' ');

  return (
    <Screen>
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Header Bar with Drawer Button */}
        <View className="pt-4 pb-4 mb-2 flex-row items-center gap-3 border-b border-border/50">
          <DrawerButton />
          <View>
            <Text className="text-2xl font-serif-bold text-foreground">Profile</Text>
            <Text className="text-xs font-sans text-muted">Your account &amp; estate details</Text>
          </View>
        </View>

        {/* Avatar + Identity Card */}
        <View className="bg-card border border-border rounded-2xl p-6 mb-5 items-center gap-4 mt-2">
          {/* Avatar */}
          <View className="w-20 h-20 rounded-full overflow-hidden bg-surface border border-border/60">
            {user?.image ? (
              <Image
                source={{ uri: user.image }}
                style={{ width: 80, height: 80 }}
                contentFit="cover"
              />
            ) : (
              <View className="w-20 h-20 items-center justify-center bg-primary/10">
                <Text className="text-primary font-serif-bold text-3xl">
                  {(user?.name ?? 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Name + Role badge */}
          <View className="items-center gap-2">
            <Text className="text-xl font-serif-semibold text-foreground text-center">
              {user?.name ?? 'Unknown User'}
            </Text>
            <View className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Text className="text-xs font-sans-bold text-primary capitalize">{roleLabel}</Text>
            </View>
          </View>

          {/* Email */}
          <View className="w-full border-t border-border/60 pt-4">
            <Text className="text-[10px] font-sans-semibold text-muted uppercase tracking-wider text-center mb-1">
              Email
            </Text>
            <Text className="text-sm font-sans text-foreground-secondary text-center">
              {user?.email ?? '—'}
            </Text>
          </View>
        </View>

        {/* Society Card */}
        <View className="bg-card border border-border rounded-2xl p-6 mb-5 gap-3">
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name="business-outline" size={14} color={theme.primary} />
            <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase">
              Active Estate
            </Text>
          </View>

          {society ? (
            <>
              <Text className="text-lg font-serif-semibold text-foreground">{society.name}</Text>
              <Text className="text-xs font-sans text-muted leading-5">
                {society.address}, {society.city}, {society.state} {society.pincode}
              </Text>

              {/* Stats row */}
              <View className="flex-row gap-3 pt-2">
                <View className="flex-1 bg-surface border border-border/50 p-3 rounded-xl items-center">
                  <Text className="text-xl font-mono-semibold text-primary">
                    {society.flatCount ?? 0}
                  </Text>
                  <Text className="text-[10px] font-sans-medium text-foreground-secondary uppercase mt-0.5">
                    Flats
                  </Text>
                </View>
                <View className="flex-1 bg-surface border border-border/50 p-3 rounded-xl items-center">
                  <Text className="text-xl font-mono-semibold text-primary">
                    {society.towers?.length ?? 0}
                  </Text>
                  <Text className="text-[10px] font-sans-medium text-foreground-secondary uppercase mt-0.5">
                    Towers
                  </Text>
                </View>
                <View className="flex-1 bg-surface border border-border/50 p-3 rounded-xl items-center">
                  <Text className="text-xl font-mono-semibold text-primary">
                    {society.memberCount ?? 0}
                  </Text>
                  <Text className="text-[10px] font-sans-medium text-foreground-secondary uppercase mt-0.5">
                    Members
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <Text className="text-sm font-sans text-muted">No society data available</Text>
          )}
        </View>

        {user?.role === 'resident' ? <ResidentEntryHistoryCard /> : null}

        {/* Appearance */}
        <View className="bg-card border border-border rounded-2xl p-6 mb-5 gap-3">
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name="contrast-outline" size={14} color={theme.primary} />
            <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase">
              Appearance
            </Text>
          </View>

          <View className="flex-row bg-surface border border-border/50 rounded-xl p-1 gap-1">
            {APPEARANCE_OPTIONS.map((option) => {
              const active = preference === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setPreference(option.value)}
                  className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg ${
                    active ? 'bg-primary' : ''
                  }`}
                >
                  <Ionicons
                    name={option.icon as never}
                    size={14}
                    color={active ? theme.primaryForeground : theme.foregroundSecondary}
                  />
                  <Text
                    className={`text-xs font-sans-bold ${
                      active ? 'text-primary-foreground' : 'text-foreground-secondary'
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Security */}
        <View className="bg-card border border-border rounded-2xl p-6 mb-5 gap-3">
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name="finger-print-outline" size={14} color={theme.primary} />
            <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase">
              Security
            </Text>
          </View>

          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="text-sm font-sans-semibold text-foreground">App Lock</Text>
              <Text className="text-xs font-sans text-muted mt-0.5">
                {biometricAvailable === false
                  ? 'Set up Face ID, fingerprint, or a passcode on this device to enable.'
                  : 'Require Face ID, fingerprint, or your passcode to open Portl.'}
              </Text>
            </View>
            <Pressable
              onPress={() => setAppLockEnabled(!appLockEnabled)}
              disabled={biometricAvailable === false}
              className={`w-12 h-7 rounded-full justify-center px-0.5 ${
                appLockEnabled ? 'bg-primary' : 'bg-surface border border-border/60'
              } ${biometricAvailable === false ? 'opacity-40' : ''}`}
            >
              <View
                className={`w-6 h-6 rounded-full bg-card shadow ${appLockEnabled ? 'ml-auto' : ''}`}
              />
            </Pressable>
          </View>
        </View>

        {leaveError ? (
          <View className="p-3 bg-danger/10 border border-danger/20 rounded-xl mb-4">
            <Text className="text-danger font-sans text-xs">{leaveError}</Text>
          </View>
        ) : null}

        {/* Leave Society */}
        <Pressable
          onPress={() => setConfirmingLeave(true)}
          disabled={leaveSocietyMutation.isPending}
          className="w-full py-4 rounded-xl bg-danger/10 border border-danger/20 active:bg-danger/20 items-center justify-center flex-row gap-2 mb-3"
        >
          {leaveSocietyMutation.isPending ? (
            <ActivityIndicator size="small" color={theme.danger} />
          ) : (
            <>
              <Ionicons name="exit-outline" size={18} color={theme.danger} />
              <Text className="text-danger font-sans-semibold text-base">Leave Society</Text>
            </>
          )}
        </Pressable>

        <ConfirmDialog
          visible={confirmingLeave}
          title="Leave Society"
          message={`Are you sure you want to leave ${society?.name ?? 'this society'}? You'll lose access to your flat, visitor history, and society features until you're invited again.`}
          confirmLabel="Leave"
          destructive
          onConfirm={performLeaveSociety}
          onCancel={() => setConfirmingLeave(false)}
        />

        {/* Sign Out */}
        <Pressable
          onPress={handleSignOut}
          className="w-full py-4 rounded-xl bg-danger/10 border border-danger/20 active:bg-danger/20 items-center justify-center flex-row gap-2"
        >
          <Ionicons name="log-out-outline" size={18} color={theme.danger} />
          <Text className="text-danger font-sans-semibold text-base">Sign Out of Account</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
