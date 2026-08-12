import { useState } from 'react';
import { FlatList, Linking, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { Input } from '@/components/ui/Input';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useStaff, useRemoveStaff } from '@/features/staff/hooks/use-staff';
import { useAppSession } from '@/lib/auth-client';
import type { StaffMember } from '@/features/staff/services/staff';

const ROLE_FILTERS = [
  'All',
  'Cook',
  'Driver',
  'Maid',
  'Gardener',
  'Plumber',
  'Electrician',
  'Security'
];

export default function StaffDirectoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { data: session } = useAppSession();
  const isAdmin = session?.user?.role === 'society_admin';

  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data: staffList, isLoading } = useStaff({
    search: search.trim() || undefined,
    roleTitle: selectedRole !== 'All' ? selectedRole : undefined
  });

  const removeStaffMutation = useRemoveStaff();

  function handleCall(phone: string) {
    Linking.openURL(`tel:${phone}`);
  }

  function confirmRemove() {
    if (pendingDeleteId) {
      removeStaffMutation.mutate(pendingDeleteId);
    }
    setPendingDeleteId(null);
  }

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <ScreenHeader title="Staff Directory" showBack drawer />

        {/* Admin Action Button */}
        {isAdmin && (
          <Button
            label="Add New Staff Member"
            icon="person-add-outline"
            onPress={() => router.push('/(app)/admin/staff/manage')}
            className="mb-5"
          />
        )}

        {/* Search input */}
        <View className="flex-row items-center bg-card border border-border rounded-xl px-3 mb-4">
          <Ionicons name="search-outline" size={18} color={theme.muted} />
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search staff by name, role or phone..."
            className="flex-1 ml-2 border-0 bg-transparent px-0"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={theme.muted} />
            </Pressable>
          ) : null}
        </View>

        {/* Category Pills */}
        <View className="mb-4">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={ROLE_FILTERS}
            keyExtractor={(item) => item}
            contentContainerClassName="gap-2"
            renderItem={({ item }) => (
              <Chip
                label={item}
                selected={selectedRole === item}
                onPress={() => setSelectedRole(item)}
              />
            )}
          />
        </View>

        {/* Staff List */}
        {isLoading ? (
          <ListSkeleton rows={5} />
        ) : !staffList || staffList.length === 0 ? (
          <View className="flex-1 justify-center pb-20">
            <EmptyState
              icon="people-outline"
              title="No staff found"
              subtitle="No staff members match your search."
            />
          </View>
        ) : (
          <FlatList
            data={staffList}
            keyExtractor={(item) => item.id}
            contentContainerClassName="pb-24 gap-3"
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }: { item: StaffMember; index: number }) => (
              <FadeIn index={index}>
                <View className="bg-card border border-border rounded-2xl p-4 flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1 mr-3">
                    <Avatar name={item.name} image={item.photo} size={48} className="mr-3" />
                    <View className="flex-1">
                      <Text
                        className="text-sm font-serif-semibold text-foreground"
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text className="text-xs font-sans-bold text-primary mt-0.5">
                        {item.roleTitle}
                      </Text>
                      <Text className="text-xs font-sans text-muted mt-0.5">{item.phone}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <Pressable
                      onPress={() => handleCall(item.phone)}
                      className="w-10 h-10 rounded-full bg-primary/15 items-center justify-center active:opacity-70"
                    >
                      <Ionicons name="call-outline" size={20} color={theme.primary} />
                    </Pressable>
                    {isAdmin && (
                      <>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/(app)/admin/staff/manage',
                              params: {
                                id: item.id,
                                name: item.name,
                                roleTitle: item.roleTitle,
                                phone: item.phone
                              }
                            })
                          }
                          className="w-10 h-10 rounded-full bg-primary/15 items-center justify-center active:opacity-70"
                        >
                          <Ionicons name="create-outline" size={18} color={theme.primary} />
                        </Pressable>
                        <Pressable
                          onPress={() => setPendingDeleteId(item.id)}
                          disabled={removeStaffMutation.isPending}
                          className="w-10 h-10 rounded-full bg-danger/15 items-center justify-center active:opacity-70"
                        >
                          <Ionicons name="trash-outline" size={18} color={theme.danger} />
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              </FadeIn>
            )}
          />
        )}
      </View>

      <ConfirmDialog
        visible={pendingDeleteId !== null}
        title="Remove Staff Member"
        message="Are you sure you want to remove this staff member from the society directory?"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmRemove}
        onCancel={() => setPendingDeleteId(null)}
      />
    </Screen>
  );
}
