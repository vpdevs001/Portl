import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
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

  function handleRemove(id: string) {
    setPendingDeleteId(id);
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
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Staff Directory</Text>
          <DrawerButton />
        </View>

        {/* Admin Action Button */}
        {isAdmin && (
          <Pressable
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.push('/(app)/admin/staff/manage' as any)}
            className="flex-row items-center justify-center bg-primary rounded-xl py-3.5 px-4 mb-5"
          >
            <Ionicons name="person-add-outline" size={18} color={theme.primaryForeground} />
            <Text className="text-sm font-sans-bold text-primary-foreground ml-2">
              Add New Staff Member
            </Text>
          </Pressable>
        )}

        {/* Search input */}
        <View className="flex-row items-center bg-card border border-border rounded-xl px-3 py-2.5 mb-4">
          <Ionicons name="search-outline" size={18} color={theme.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search staff by name, role or phone..."
            placeholderTextColor={theme.muted}
            className="flex-1 ml-2 text-sm font-sans text-foreground"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
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
            renderItem={({ item }) => {
              const active = selectedRole === item;
              return (
                <Pressable
                  onPress={() => setSelectedRole(item)}
                  className={`rounded-full border px-3.5 py-1.5 ${
                    active ? 'bg-primary border-primary' : 'bg-card border-border'
                  }`}
                >
                  <Text
                    className={`text-xs font-sans-bold ${
                      active ? 'text-primary-foreground' : 'text-foreground-secondary'
                    }`}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {/* Staff List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : !staffList || staffList.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <Ionicons name="people-outline" size={48} color={theme.muted} />
            <Text className="text-sm font-sans text-muted mt-3 text-center">
              No staff members found matching your search.
            </Text>
          </View>
        ) : (
          <FlatList
            data={staffList}
            keyExtractor={(item) => item.id}
            contentContainerClassName="pb-24 gap-3"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }: { item: StaffMember }) => (
              <View className="bg-card border border-border rounded-2xl p-4 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-3">
                  <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-3">
                    <Ionicons name="person-outline" size={24} color={theme.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-serif-semibold text-foreground" numberOfLines={1}>
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
                    className="w-10 h-10 rounded-full bg-primary/15 items-center justify-center"
                  >
                    <Ionicons name="call-outline" size={20} color={theme.primary} />
                  </Pressable>
                  {isAdmin && (
                    <>
                      <Pressable
                        onPress={() =>
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          (router.push as any)({
                            pathname: '/(app)/admin/staff/manage',
                            params: {
                              id: item.id,
                              name: item.name,
                              roleTitle: item.roleTitle,
                              phone: item.phone
                            }
                          })
                        }
                        className="w-10 h-10 rounded-full bg-primary/15 items-center justify-center"
                      >
                        <Ionicons name="create-outline" size={18} color={theme.primary} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleRemove(item.id)}
                        disabled={removeStaffMutation.isPending}
                        className="w-10 h-10 rounded-full bg-danger/15 items-center justify-center"
                      >
                        <Ionicons name="trash-outline" size={18} color={theme.danger} />
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
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
