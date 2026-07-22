import { useFlats, useTowers } from '@/features/society/services/use-society';
import {
  useCancelInvite,
  useCreateInvite,
  useSearchUsers,
  useSentInvites
} from '@/features/invite/services/use-invite';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

export function InviteMembersScreen() {
  const router = useRouter();
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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

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
    } catch (e: any) {
      setError(e.message ?? 'Failed to send invitation');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await cancelInviteMutation.mutateAsync(inviteId);
    } catch (e: any) {
      console.error('Failed to cancel invite:', e);
    }
  };

  const handleFinish = () => {
    router.replace('/(app)/home');
  };

  return (
    <ScrollView className="flex-1 bg-background px-6 py-12">
      {/* Hero */}
      <View className="mb-8 mt-4">
        <Text className="text-3xl font-serif-bold text-foreground mb-3">Invite Members</Text>
        <Text className="text-sm font-sans text-foreground-secondary leading-5">
          Search for residents or security guards by name or email, assign their roles, and issue
          join requests.
        </Text>
      </View>

      {/* Lookup box */}
      <View className="gap-4 mb-8">
        <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase">
          Search Member
        </Text>
        <TextInput
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (!text.trim()) setSelectedUser(null);
          }}
          placeholder="Enter name or email..."
          placeholderTextColor="#93a08d"
          className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground font-sans text-sm"
        />

        {/* Search Results */}
        {searchQuery.trim().length > 0 && (
          <View className="bg-card border border-border rounded-xl max-h-60 overflow-hidden">
            {isSearching ? (
              <View className="p-4 items-center">
                <ActivityIndicator size="small" color="#a9832e" />
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
                      <Text className="text-sm font-sans-semibold text-foreground">{res.name}</Text>
                      <Text className="text-xs font-sans text-muted">{res.email}</Text>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
                  </Pressable>
                );
              })
            ) : (
              <View className="p-4 items-center">
                <Text className="text-xs font-sans text-muted">No unassigned users found</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Invite Configuration Panel */}
      {selectedUser && (
        <View className="p-5 bg-card border border-primary/30 rounded-xl gap-4 mb-8">
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
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setSelectedRole('resident')}
                className={`flex-1 py-2 border rounded-lg items-center ${
                  selectedRole === 'resident'
                    ? 'bg-primary/10 border-primary'
                    : 'bg-surface border-border'
                }`}
              >
                <Text
                  className={`text-xs font-sans-medium ${
                    selectedRole === 'resident' ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  Resident
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedRole('security_guard')}
                className={`flex-1 py-2 border rounded-lg items-center ${
                  selectedRole === 'security_guard'
                    ? 'bg-primary/10 border-primary'
                    : 'bg-surface border-border'
                }`}
              >
                <Text
                  className={`text-xs font-sans-medium ${
                    selectedRole === 'security_guard' ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  Security Guard
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Flat selector (only for residents) */}
          {selectedRole === 'resident' && (
            <View className="gap-2">
              <Text className="text-xs font-sans-semibold text-muted uppercase">Assign Flat</Text>
              {flats && flats.length > 0 ? (
                <View className="border border-border rounded-lg max-h-40 overflow-hidden bg-surface">
                  <ScrollView className="divide-y divide-border">
                    {flats.map((flat) => {
                      const active = selectedFlatId === flat.id;
                      const towerName = towers?.find((t) => t.id === flat.towerId)?.name ?? 'Tower';
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

          {/* Submit invite */}
          <Pressable
            onPress={handleSendInvite}
            disabled={createInviteMutation.isPending}
            className="w-full py-3 bg-primary rounded-lg justify-center items-center flex-row gap-2"
          >
            {createInviteMutation.isPending ? (
              <ActivityIndicator size="small" color="#1a1409" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={16} color={theme.primaryForeground} />
                <Text className="text-primary-foreground font-sans-bold text-sm">
                  Send Invitation
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* Success notification */}
      {success && (
        <View className="p-3.5 bg-success/15 border border-success/30 rounded-xl mb-8">
          <Text className="text-success font-sans-semibold text-center text-xs">{success}</Text>
        </View>
      )}

      {/* Sent Invites list */}
      <View className="mb-10">
        <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase mb-3">
          Sent Invites
        </Text>

        {isLoadingInvites ? (
          <ActivityIndicator size="small" color="#a9832e" />
        ) : sentInvites && sentInvites.length > 0 ? (
          <View className="gap-3">
            {sentInvites.map((invite) => {
              let statusColor = 'text-warning';
              if (invite.status === 'accepted') statusColor = 'text-success';
              if (invite.status === 'rejected') statusColor = 'text-danger';
              if (invite.status === 'cancelled') statusColor = 'text-muted';

              const isCancelling =
                cancelInviteMutation.isPending && cancelInviteMutation.variables === invite.id;

              return (
                <View key={invite.id} className="p-4 bg-card border border-border rounded-xl gap-3">
                  <View className="flex-row justify-between items-start">
                    <View>
                      <Text className="text-sm font-sans-semibold text-foreground">
                        {invite.invitedUser?.name ?? 'Unknown User'}
                      </Text>
                      <Text className="text-xs font-sans text-muted">
                        {invite.invitedUser?.email}
                      </Text>
                    </View>
                    <Text className={`text-xs font-sans-bold capitalize ${statusColor}`}>
                      {invite.status}
                    </Text>
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
                    <Pressable
                      onPress={() => handleCancelInvite(invite.id)}
                      disabled={isCancelling}
                      className="w-full py-2 bg-danger/5 active:bg-danger/10 border border-danger/15 rounded-lg items-center justify-center"
                    >
                      <Text className="text-danger font-sans-medium text-xs">
                        {isCancelling ? 'Cancelling...' : 'Cancel Invitation'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View className="p-6 bg-card border border-border border-dashed rounded-xl items-center justify-center">
            <Text className="text-xs font-sans text-muted">No invitations issued yet</Text>
          </View>
        )}
      </View>

      {/* Done Button */}
      <Pressable
        onPress={handleFinish}
        className="w-full py-4 rounded-xl bg-primary active:opacity-90 items-center justify-center flex-row gap-2 mb-16"
      >
        <Ionicons name="checkmark-done" size={18} color={theme.primaryForeground} />
        <Text className="text-primary-foreground font-sans-bold text-base">Finish Setup</Text>
      </Pressable>
    </ScrollView>
  );
}
