import { useFlats, useTowers } from '@/features/society/services/use-society';
import {
  useCancelInvite,
  useCreateInvite,
  useSearchUsers,
  useSentInvites
} from '@/features/invite/services/use-invite';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useColorScheme';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FadeIn } from '@/components/ui/FadeIn';
import { Input } from '@/components/ui/Input';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Spinner } from '@/components/ui/Spinner';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { getErrorMessage } from '@/lib/errors';

const ROLE_OPTIONS: { value: 'resident' | 'security_guard'; label: string }[] = [
  { value: 'resident', label: 'Resident' },
  { value: 'security_guard', label: 'Security Guard' }
];

const INVITE_STATUS_TONE: Record<string, BadgeTone> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
  cancelled: 'muted'
};

type InviteMembersScreenProps = {
  /**
   * 'onboarding' — step 4/4 hero + Finish Setup CTA (the (onboarding) flow).
   * 'app' — compact back/drawer header (the (app)/add-resident route).
   */
  variant?: 'onboarding' | 'app';
};

export function InviteMembersScreen({ variant = 'onboarding' }: InviteMembersScreenProps) {
  const router = useRouter();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults, isFetching: isSearching } = useSearchUsers(searchQuery);

  const { data: towers } = useTowers();
  const { data: flats } = useFlats();
  const { data: sentInvites, isLoading: isLoadingInvites } = useSentInvites();

  const createInviteMutation = useCreateInvite();
  const cancelInviteMutation = useCancelInvite();

  // Selection states
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [selectedRole, setSelectedRole] = useState<'resident' | 'security_guard'>('resident');
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendInvite = async () => {
    if (!selectedUser) {
      setError('Please select a user to invite');
      return;
    }
    if (selectedRole === 'resident' && !selectedFlatId) {
      setError('Please select a flat for the resident');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await createInviteMutation.mutateAsync({
        userId: selectedUser.id,
        role: selectedRole,
        flatId: selectedRole === 'resident' ? (selectedFlatId ?? undefined) : undefined
      });

      setSuccess(`Successfully invited ${selectedUser.name}!`);
      setSelectedUser(null);
      setSelectedFlatId(null);
      setSearchQuery('');
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await cancelInviteMutation.mutateAsync(inviteId);
    } catch (e) {
      console.error('Failed to cancel invite:', e);
    }
  };

  const handleFinish = () => {
    router.replace('/(app)/home');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-background px-6 pt-4 pb-12">
        {variant === 'onboarding' ? (
          <View className="mt-8">
            <OnboardingHeader
              title="Invite Members"
              subtitle="Search for residents or security guards by name or email, assign their roles, and issue join requests."
              step={4}
              totalSteps={4}
              showBack
            />
          </View>
        ) : (
          <>
            <ScreenHeader title="Invite Management" showBack drawer />
            <Text className="text-sm font-sans text-foreground-secondary leading-5 mb-6 mt-1">
              Search for residents or security guards by name or email, assign their roles, and
              issue join requests.
            </Text>
          </>
        )}

        {/* Lookup box */}
        <View className="gap-4 mb-8">
          <SectionLabel>Search Member</SectionLabel>
          <Input
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (!text.trim()) setSelectedUser(null);
            }}
            placeholder="Enter name or email..."
          />

          {/* Search Results */}
          {searchQuery.trim().length > 0 && (
            <Card className="max-h-60 overflow-hidden p-0">
              {isSearching ? (
                <View className="p-4 items-center">
                  <Spinner />
                </View>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((res) => {
                  const active = selectedUser?.id === res.id;
                  return (
                    <Pressable
                      key={res.id}
                      onPress={() => {
                        setSelectedUser(res);
                        setError(null);
                        setSuccess(null);
                      }}
                      className={`p-4 border-b border-border flex-row justify-between items-center ${
                        active ? 'bg-surface' : ''
                      }`}
                    >
                      <View>
                        <Text className="text-sm font-sans-semibold text-foreground">
                          {res.name}
                        </Text>
                        <Text className="text-xs font-sans text-muted">{res.email}</Text>
                      </View>
                      {active && (
                        <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                      )}
                    </Pressable>
                  );
                })
              ) : (
                <View className="p-4 items-center">
                  <Text className="text-xs font-sans text-muted">No unassigned users found</Text>
                </View>
              )}
            </Card>
          )}
        </View>

        {/* Invite Configuration Panel */}
        {selectedUser && (
          <FadeIn>
            <Card className="p-5 border-primary/30 gap-4 mb-8">
              <Text className="text-sm font-sans-bold text-foreground">
                Configure Invite for{' '}
                <Text className="text-primary font-serif-semibold">{selectedUser.name}</Text>
              </Text>

              {error ? (
                <View className="p-2.5 bg-danger/10 border border-danger/20 rounded-lg">
                  <Text className="text-danger font-sans text-xs">{error}</Text>
                </View>
              ) : null}

              {/* Role selector */}
              <View className="gap-2">
                <Text className="text-xs font-sans-semibold text-muted uppercase">Select Role</Text>
                <SegmentedControl
                  options={ROLE_OPTIONS}
                  value={selectedRole}
                  onChange={setSelectedRole}
                />
              </View>

              {/* Flat selector (only for residents) */}
              {selectedRole === 'resident' && (
                <View className="gap-2">
                  <Text className="text-xs font-sans-semibold text-muted uppercase">
                    Assign Flat
                  </Text>
                  {flats && flats.length > 0 ? (
                    <View className="border border-border rounded-lg max-h-40 overflow-hidden bg-surface">
                      <ScrollView className="divide-y divide-border">
                        {flats.map((flat) => {
                          const active = selectedFlatId === flat.id;
                          const towerName =
                            towers?.find((t) => t.id === flat.towerId)?.name ?? 'Tower';
                          return (
                            <Pressable
                              key={flat.id}
                              onPress={() => {
                                setSelectedFlatId(flat.id);
                                setError(null);
                              }}
                              className={`p-3 flex-row justify-between items-center ${active ? 'bg-primary/5' : ''}`}
                            >
                              <Text className="text-xs font-sans-medium text-foreground">
                                {flat.flatNumber} ({towerName})
                              </Text>
                              {active && (
                                <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                              )}
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  ) : (
                    <Text className="text-xs font-sans text-muted">No flats registered yet.</Text>
                  )}
                </View>
              )}

              <Button
                label="Send Invitation"
                icon="paper-plane"
                loading={createInviteMutation.isPending}
                onPress={handleSendInvite}
              />
            </Card>
          </FadeIn>
        )}

        {/* Success notification */}
        {success && (
          <View className="p-3.5 bg-success/15 border border-success/30 rounded-xl mb-8">
            <Text className="text-success font-sans-semibold text-center text-xs">{success}</Text>
          </View>
        )}

        {/* Sent Invites list */}
        <View className="mb-10">
          <SectionLabel className="mb-3">Sent Invites</SectionLabel>

          {isLoadingInvites ? (
            <Spinner />
          ) : sentInvites && sentInvites.length > 0 ? (
            <View className="gap-3">
              {sentInvites.map((invite, index) => {
                const isCancelling =
                  cancelInviteMutation.isPending && cancelInviteMutation.variables === invite.id;

                return (
                  <FadeIn key={invite.id} index={index}>
                    <Card className="p-4 gap-3">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1 pr-3">
                          <Text className="text-sm font-sans-semibold text-foreground">
                            {invite.invitedUser?.name ?? 'Unknown User'}
                          </Text>
                          <Text className="text-xs font-sans text-muted">
                            {invite.invitedUser?.email}
                          </Text>
                        </View>
                        <Badge
                          label={invite.status}
                          tone={INVITE_STATUS_TONE[invite.status] ?? 'muted'}
                        />
                      </View>

                      <View className="flex-row justify-between items-center bg-surface/60 px-3 py-2 rounded-lg">
                        <Text className="text-[10px] font-sans text-foreground-secondary uppercase">
                          Role:{' '}
                          <Text className="text-primary font-sans-bold">
                            {invite.role.replace('_', ' ')}
                          </Text>
                        </Text>
                        {invite.role === 'resident' && invite.flat && (
                          <Text className="text-[10px] font-sans text-foreground-secondary uppercase">
                            Flat:{' '}
                            <Text className="text-primary font-sans-bold">
                              {invite.flat.flatNumber}
                            </Text>
                          </Text>
                        )}
                      </View>

                      {invite.status === 'pending' && (
                        <Button
                          label={isCancelling ? 'Cancelling…' : 'Cancel Invitation'}
                          variant="dangerSoft"
                          size="sm"
                          disabled={isCancelling}
                          onPress={() => handleCancelInvite(invite.id)}
                        />
                      )}
                    </Card>
                  </FadeIn>
                );
              })}
            </View>
          ) : (
            <View className="p-6 bg-card border border-border border-dashed rounded-xl items-center justify-center">
              <Text className="text-xs font-sans text-muted">No invitations issued yet</Text>
            </View>
          )}
        </View>

        {variant === 'onboarding' ? (
          <Button
            label="Finish Setup"
            icon="checkmark-done"
            size="lg"
            onPress={handleFinish}
            className="mb-16"
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
