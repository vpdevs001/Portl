import { useMyInvites, useRespondInvite } from '@/features/invite/services/use-invite';
import { Colors } from '@/constants/colors';
import { authClient } from '@/lib/auth-client';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';

export function OnboardingInviteList() {
  const router = useRouter();
  const { data: invites, isLoading } = useMyInvites();
  const respondInviteMutation = useRespondInvite();
  const session = authClient.useSession();
  const [actingInviteId, setActingInviteId] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

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
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#a9832e" />
      </View>
    );
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
      <View className="mb-8">
        <Text className="text-3xl font-serif-bold text-foreground mb-3">Estates & Societies</Text>
        <Text className="text-sm font-sans text-foreground-secondary leading-6">
          To enter, you need to accept an invitation from your society administrator or register a
          new society if you are an administrator.
        </Text>
      </View>

      {/* Invites Box */}
      <View className="mb-10">
        <Text className="text-sm font-sans-bold text-primary tracking-wider uppercase mb-4">
          Pending Invitations ({invites?.length ?? 0})
        </Text>

        {invites && invites.length > 0 ? (
          <View className="gap-4">
            {invites.map((invite) => {
              const isActing = actingInviteId === invite.id;
              return (
                <View key={invite.id} className="p-5 bg-card border border-border rounded-xl gap-4">
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
                  <View className="flex-row gap-3 pt-2">
                    <Pressable
                      disabled={isActing}
                      onPress={() => handleRespond(invite.id, 'reject')}
                      className="flex-1 py-2.5 rounded-lg border border-danger/30 bg-danger/5 active:bg-danger/10 items-center flex-row justify-center gap-1.5"
                    >
                      <Ionicons name="close" size={16} color={theme.danger} />
                      <Text className="text-danger font-sans-medium text-sm">
                        {isActing ? '...' : 'Reject'}
                      </Text>
                    </Pressable>
                    <Pressable
                      disabled={isActing}
                      onPress={() => handleRespond(invite.id, 'accept')}
                      className="flex-1 py-2.5 rounded-lg bg-primary active:opacity-90 items-center flex-row justify-center gap-1.5"
                    >
                      <Ionicons name="checkmark" size={16} color={theme.primaryForeground} />
                      <Text className="text-primary-foreground font-sans-bold text-sm">
                        {isActing ? '...' : 'Accept'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
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
      <View className="p-6 bg-surface border border-border rounded-2xl gap-4 mb-16">
        <View className="gap-1">
          <Text className="text-lg font-serif-semibold text-foreground">Are you a manager?</Text>
          <Text className="text-xs font-sans text-foreground-secondary leading-5">
            If you are developing a new estate or setting up administrative controls for your tower,
            start here.
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/(onboarding)/create-society')}
          className="w-full py-3.5 rounded-xl border border-primary bg-card active:bg-surface items-center justify-center flex-row gap-2"
        >
          <Ionicons name="add-circle-outline" size={18} color={theme.primary} />
          <Text className="text-primary font-sans-semibold text-sm">Register a New Society</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
