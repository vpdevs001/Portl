import { useMyInvites, useRespondInvite } from '@/features/invite/services/use-invite';
import { authClient } from '@/lib/auth-client';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useColorScheme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FadeIn } from '@/components/ui/FadeIn';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { LoadingScreen } from '@/components/ui/Spinner';

export function OnboardingInviteList() {
  const router = useRouter();
  const { data: invites, isLoading } = useMyInvites();
  const respondInviteMutation = useRespondInvite();
  const session = authClient.useSession();
  const [actingInviteId, setActingInviteId] = useState<string | null>(null);
  const theme = useTheme();

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  const handleRespond = async (inviteId: string, action: 'accept' | 'reject') => {
    setActingInviteId(inviteId);
    try {
      await respondInviteMutation.mutateAsync({ inviteId, action });
      if (action === 'accept') {
        // Server updates user.societyId/role directly via a raw DB write —
        // Better Auth's client-side session cache doesn't know about that
        // change until explicitly refetched. Without this, the root
        // layout's gate keeps showing onboarding even though the DB is
        // already correct.
        await session.refetch();
      }
    } catch (e) {
      console.error('Failed to respond to invite:', e);
    } finally {
      setActingInviteId(null);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ScrollView className="flex-1 bg-background px-6 py-12">
      {/* Top Header */}
      <View className="flex-row justify-between items-center mb-8">
        <Text className="text-sm font-sans-medium text-muted">Welcome to Portl</Text>
        <Pressable
          onPress={handleSignOut}
          className="px-3 py-1.5 rounded-lg bg-surface border border-border flex-row items-center gap-1.5"
        >
          <Ionicons name="log-out-outline" size={14} color={theme.foregroundSecondary} />
          <Text className="text-xs font-sans-medium text-foreground">Sign out</Text>
        </Pressable>
      </View>

      {/* Main Intro */}
      <FadeIn className="mb-8">
        <Text className="text-3xl font-serif-bold text-foreground mb-3">Estates & Societies</Text>
        <Text className="text-sm font-sans text-foreground-secondary leading-6">
          To enter, you need to accept an invitation from your society administrator or register a
          new society if you are an administrator.
        </Text>
      </FadeIn>

      {/* Invites Box */}
      <View className="mb-10">
        <SectionLabel className="mb-4">Pending Invitations ({invites?.length ?? 0})</SectionLabel>

        {invites && invites.length > 0 ? (
          <View className="gap-4">
            {invites.map((invite, index) => {
              const isActing = actingInviteId === invite.id;
              return (
                <FadeIn key={invite.id} index={index}>
                  <Card className="p-5 gap-4">
                    <View className="gap-1">
                      <Text className="text-lg font-serif-semibold text-foreground">
                        {invite.society?.name ?? 'Unknown Society'}
                      </Text>
                      <Text className="text-xs font-sans text-muted">
                        {invite.society?.city}, {invite.society?.state}
                      </Text>
                    </View>

                    <View className="bg-surface/50 p-3 rounded-lg border border-border/50">
                      <Text className="text-xs font-sans-medium text-foreground-secondary">
                        Role Requested:{' '}
                        <Text className="text-primary font-sans-semibold capitalize">
                          {invite.role.replace('_', ' ')}
                        </Text>
                      </Text>
                      {invite.role === 'resident' && invite.flat && (
                        <Text className="text-xs font-sans-medium text-foreground-secondary mt-1">
                          Assigned Flat:{' '}
                          <Text className="text-primary font-sans-semibold">
                            {invite.flat.flatNumber} (Floor {invite.flat.floor ?? 'G'})
                          </Text>
                        </Text>
                      )}
                    </View>

                    {/* Accept/Reject CTA */}
                    <View className="flex-row gap-3 pt-1">
                      <Button
                        label="Reject"
                        icon="close"
                        variant="dangerSoft"
                        size="sm"
                        disabled={isActing}
                        onPress={() => handleRespond(invite.id, 'reject')}
                        className="flex-1"
                      />
                      <Button
                        label="Accept"
                        icon="checkmark"
                        size="sm"
                        loading={isActing}
                        onPress={() => handleRespond(invite.id, 'accept')}
                        className="flex-1"
                      />
                    </View>
                  </Card>
                </FadeIn>
              );
            })}
          </View>
        ) : (
          <View className="p-8 bg-card border border-border border-dashed rounded-xl items-center justify-center gap-2 mb-4">
            <Text className="text-sm font-sans-semibold text-foreground">No pending invites</Text>
            <Text className="text-xs font-sans text-muted text-center leading-5 px-4">
              Your society admin must search for your name or email in their portal to invite you.
            </Text>
          </View>
        )}
      </View>

      {/* Admin Creator Option */}
      <FadeIn index={2}>
        <Card className="p-6 bg-surface gap-4 mb-16">
          <View className="gap-1">
            <Text className="text-lg font-serif-semibold text-foreground">Are you a manager?</Text>
            <Text className="text-xs font-sans text-foreground-secondary leading-5">
              If you are developing a new estate or setting up administrative controls for your
              tower, start here.
            </Text>
          </View>

          <Button
            label="Register a New Society"
            icon="add-circle-outline"
            variant="outline"
            onPress={() => router.push('/(onboarding)/create-society')}
          />
        </Card>
      </FadeIn>
    </ScrollView>
  );
}
