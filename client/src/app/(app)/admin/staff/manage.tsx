import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Field, Input } from '@/components/ui/Input';
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
        <ScreenHeader
          title={isEditing ? 'Edit Staff Member' : 'Add Staff Member'}
          showBack
          drawer
        />

        <View className="gap-1">
          <Field label="Full Name">
            <Input value={name} onChangeText={setName} placeholder="e.g. Ramesh Kumar" />
          </Field>

          <Field label="Role / Designation">
            <Input
              value={roleTitle}
              onChangeText={setRoleTitle}
              placeholder="e.g. Electrician, Cook"
              className="mb-3"
            />
            {/* Common role chips */}
            <View className="flex-row flex-wrap gap-2">
              {COMMON_ROLES.map((role) => (
                <Chip
                  key={role}
                  label={role}
                  selected={roleTitle.trim().toLowerCase() === role.toLowerCase()}
                  onPress={() => setRoleTitle(role)}
                />
              ))}
            </View>
          </Field>

          <Field label="Phone Number">
            <Input
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="e.g. +91 98765 43210"
            />
          </Field>

          {error ? <Text className="text-sm font-sans text-danger mb-2">{error}</Text> : null}

          <Button
            label={isEditing ? 'Update Staff Member' : 'Save Staff Member'}
            size="lg"
            loading={isPending}
            onPress={handleSubmit}
            className="mt-4"
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
