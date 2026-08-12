import { Screen } from '@/components/Screen';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FadeIn } from '@/components/ui/FadeIn';
import { LoadingScreen } from '@/components/ui/Spinner';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useLeaveSociety, useSocietyDetails } from '@/features/society/services/use-society';
import { useUnregisterPushToken } from '@/features/notifications/hooks/use-notifications';
import { authClient, useAppSession } from '@/lib/auth-client';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useTheme, useThemePreference, type ThemePreference } from '@/hooks/useColorScheme';
import { useAppLock } from '@/hooks/useAppLock';
import { DrawerButton } from '@/components/DrawerButton';
import { ResidentEntryHistoryCard } from '@/features/logs/components/ResidentEntryHistoryCard';
import * as LocalAuthentication from 'expo-local-authentication';
import { getErrorMessage } from '@/lib/errors';

const APPEARANCE_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' }
];

export function ProfileScreen() {
  const { data: session, isPending: isSessionPending, refetch: refetchSession } = useAppSession();
  const { data: society, isLoading: isSocietyLoading } = useSocietyDetails();
  const theme = useTheme();
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
    } catch (e) {
      setLeaveError(getErrorMessage(e));
    }
  };

  if (isSessionPending || isSocietyLoading) {
    return <LoadingScreen />;
  }

  const user = session?.user;
  const roleLabel = (user?.role ?? 'resident').replace('_', ' ');

  return (
    <Screen>
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Header Bar with Drawer Button */}
        <View className="pt-4 pb-4 mb-4 flex-row items-center gap-3 border-b border-border/50">
          <DrawerButton />
          <View>
            <Text className="text-2xl font-serif-bold text-foreground">Profile</Text>
            <Text className="text-xs font-sans text-muted">Your account & estate details</Text>
          </View>
        </View>

        {/* Avatar + Identity Card */}
        <FadeIn>
          <Card className="p-6 mb-4 items-center gap-4">
            <Avatar name={user?.name} image={user?.image} size={84} />

            <View className="items-center gap-2.5">
              <Text className="text-xl font-serif-semibold text-foreground text-center">
                {user?.name ?? 'Unknown User'}
              </Text>
              <Badge label={roleLabel} tone="primary" className="capitalize" />
            </View>

            <View className="w-full border-t border-border/60 pt-4">
              <Text className="text-[10px] font-sans-semibold text-muted uppercase tracking-wider text-center mb-1">
                Email
              </Text>
              <Text className="text-sm font-sans text-foreground-secondary text-center">
                {user?.email ?? '—'}
              </Text>
            </View>
          </Card>
        </FadeIn>

        {/* Society Card */}
        <FadeIn index={1}>
          <Card className="p-5 mb-4 gap-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="business-outline" size={14} color={theme.primary} />
              <SectionLabel>Active Estate</SectionLabel>
            </View>

            {society ? (
              <>
                <Text className="text-lg font-serif-semibold text-foreground">{society.name}</Text>
                <Text className="text-xs font-sans text-muted leading-5">
                  {society.address}, {society.city}, {society.state} {society.pincode}
                </Text>

                {/* Stats row */}
                <View className="flex-row gap-3 pt-2">
                  {[
                    { value: society.flatCount ?? 0, label: 'Flats' },
                    { value: society.towers?.length ?? 0, label: 'Towers' },
                    { value: society.memberCount ?? 0, label: 'Members' }
                  ].map((stat) => (
                    <View
                      key={stat.label}
                      className="flex-1 bg-surface border border-border/50 p-3 rounded-xl items-center"
                    >
                      <Text className="text-xl font-mono-semibold text-primary">{stat.value}</Text>
                      <Text className="text-[10px] font-sans-medium text-foreground-secondary uppercase mt-0.5">
                        {stat.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text className="text-sm font-sans text-muted">No society data available</Text>
            )}
          </Card>
        </FadeIn>

        {user?.role === 'resident' ? (
          <FadeIn index={2}>
            <ResidentEntryHistoryCard />
          </FadeIn>
        ) : null}

        {/* Appearance */}
        <FadeIn index={3}>
          <Card className="p-5 mb-4 gap-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="contrast-outline" size={14} color={theme.primary} />
              <SectionLabel>Appearance</SectionLabel>
            </View>

            <SegmentedControl
              options={APPEARANCE_OPTIONS}
              value={preference}
              onChange={setPreference}
            />
          </Card>
        </FadeIn>

        {/* Security */}
        <FadeIn index={4}>
          <Card className="p-5 mb-4 gap-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="finger-print-outline" size={14} color={theme.primary} />
              <SectionLabel>Security</SectionLabel>
            </View>

            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="text-sm font-sans-semibold text-foreground">App Lock</Text>
                <Text className="text-xs font-sans text-muted mt-0.5 leading-4">
                  {biometricAvailable === false
                    ? 'Set up Face ID, fingerprint, or a passcode on this device to enable.'
                    : 'Require Face ID, fingerprint, or your passcode to open Portl.'}
                </Text>
              </View>
              <Pressable
                onPress={() => setAppLockEnabled(!appLockEnabled)}
                disabled={biometricAvailable === false}
                accessibilityRole="switch"
                accessibilityLabel="App Lock"
                accessibilityState={{
                  checked: appLockEnabled,
                  disabled: biometricAvailable === false
                }}
                className={`w-12 h-7 rounded-full justify-center px-0.5 ${
                  appLockEnabled ? 'bg-primary' : 'bg-surface border border-border/60'
                } ${biometricAvailable === false ? 'opacity-40' : ''}`}
              >
                <View
                  className={`w-6 h-6 rounded-full bg-card shadow ${appLockEnabled ? 'ml-auto' : ''}`}
                />
              </Pressable>
            </View>
          </Card>
        </FadeIn>

        {leaveError ? (
          <View className="p-3 bg-danger/10 border border-danger/20 rounded-xl mb-4">
            <Text className="text-danger font-sans text-xs">{leaveError}</Text>
          </View>
        ) : null}

        {/* Leave Society */}
        <FadeIn index={5}>
          <Button
            label="Leave Society"
            icon="exit-outline"
            variant="dangerSoft"
            size="lg"
            loading={leaveSocietyMutation.isPending}
            onPress={() => setConfirmingLeave(true)}
            className="w-full mb-3"
          />

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
          <Button
            label="Sign Out of Account"
            icon="log-out-outline"
            variant="dangerSoft"
            size="lg"
            onPress={handleSignOut}
            className="w-full"
          />
        </FadeIn>
      </ScrollView>
    </Screen>
  );
}
