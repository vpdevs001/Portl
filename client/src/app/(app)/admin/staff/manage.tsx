import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import { useCreateStaff, useUpdateStaff } from '@/features/staff/hooks/use-staff';

const COMMON_ROLES = [
  'Cook',
  'Driver',
  'Maid',
  'Gardener',
  'Plumber',
  'Electrician',
  'Security Guard'
];

export default function AdminManageStaffScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    roleTitle?: string;
    phone?: string;
  }>();
  const isEditing = Boolean(params.id);

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [name, setName] = useState(params.name ?? '');
  const [roleTitle, setRoleTitle] = useState(params.roleTitle ?? '');
  const [phone, setPhone] = useState(params.phone ?? '');
  const [error, setError] = useState<string | null>(null);

  const createStaffMutation = useCreateStaff();
  const updateStaffMutation = useUpdateStaff();

  const isPending = createStaffMutation.isPending || updateStaffMutation.isPending;

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Staff name is required');
      return;
    }
    if (!roleTitle.trim()) {
      setError('Role title is required');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    setError(null);

    try {
      if (isEditing && params.id) {
        await updateStaffMutation.mutateAsync({
          id: params.id,
          payload: {
            name: name.trim(),
            roleTitle: roleTitle.trim(),
            phone: phone.trim()
          }
        });
      } else {
        await createStaffMutation.mutateAsync({
          name: name.trim(),
          roleTitle: roleTitle.trim(),
          phone: phone.trim()
        });
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save staff member');
    }
  }

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-4" contentContainerClassName="pb-24">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">
            {isEditing ? 'Edit Staff Member' : 'Add Staff Member'}
          </Text>
          <DrawerButton />
        </View>

        {/* Input Form */}
        <View className="gap-5">
          <View>
            <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
              Full Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Ramesh Kumar"
              placeholderTextColor={theme.muted}
              className="bg-card border border-border rounded-xl px-4 py-3 text-sm font-sans text-foreground"
            />
          </View>

          <View>
            <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
              Role / Designation
            </Text>
            <TextInput
              value={roleTitle}
              onChangeText={setRoleTitle}
              placeholder="e.g. Electrician, Cook"
              placeholderTextColor={theme.muted}
              className="bg-card border border-border rounded-xl px-4 py-3 text-sm font-sans text-foreground mb-3"
            />
            {/* Common role chips */}
            <View className="flex-row flex-wrap gap-2">
              {COMMON_ROLES.map((role) => {
                const isSelected = roleTitle.trim().toLowerCase() === role.toLowerCase();
                return (
                  <Pressable
                    key={role}
                    onPress={() => setRoleTitle(role)}
                    className={`rounded-lg border px-2.5 py-1.5 ${
                      isSelected ? 'bg-primary border-primary' : 'bg-card border-border'
                    }`}
                  >
                    <Text
                      className={`text-xs font-sans-bold ${
                        isSelected ? 'text-primary-foreground' : 'text-foreground-secondary'
                      }`}
                    >
                      {role}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
              Phone Number
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor={theme.muted}
              className="bg-card border border-border rounded-xl px-4 py-3 text-sm font-sans text-foreground"
            />
          </View>

          {error ? <Text className="text-sm font-sans text-danger">{error}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={isPending}
            className="rounded-xl bg-primary px-4 py-4 items-center mt-4"
          >
            {isPending ? (
              <ActivityIndicator size="small" color={theme.primaryForeground} />
            ) : (
              <Text className="text-sm font-sans-bold text-primary-foreground">
                {isEditing ? 'Update Staff Member' : 'Save Staff Member'}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
