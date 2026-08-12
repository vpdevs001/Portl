import { useCreateSociety } from '@/features/society/services/use-society';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { getErrorMessage } from '@/lib/errors';

export function CreateSocietyForm() {
  const router = useRouter();
  const createSocietyMutation = useCreateSociety();
  const session = authClient.useSession();

  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.city || !form.state || !form.pincode) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    try {
      await createSocietyMutation.mutateAsync(form);
      // The server updates user.societyId/role directly via a raw DB write,
      // bypassing Better Auth's own client-side session cache entirely — so
      // it has to be refetched explicitly here, or the navigation gate in
      // _layout.tsx would keep showing onboarding forever despite the DB
      // being correct.
      await session.refetch();
      router.push('/(onboarding)/setup-towers');
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-background px-6 py-12">
        <OnboardingHeader
          title="Register Estate"
          subtitle="Establish the identity of your residential estate or commercial building to manage towers, flats, and members."
          step={1}
          totalSteps={4}
          showBack
        />

        {/* Form Fields */}
        <View className="mb-8">
          {error ? (
            <View className="p-3 bg-danger/10 border border-danger/20 rounded-xl mb-4">
              <Text className="text-danger font-sans text-sm">{error}</Text>
            </View>
          ) : null}

          <Field label="Estate Name">
            <Input
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              placeholder="e.g. Portl Heights"
            />
          </Field>

          <Field label="Street Address">
            <Input
              value={form.address}
              onChangeText={(text) => setForm({ ...form, address: text })}
              placeholder="e.g. 123 Luxury Road, Sector 5"
            />
          </Field>

          <View className="flex-row gap-4">
            <Field label="City" className="flex-1">
              <Input
                value={form.city}
                onChangeText={(text) => setForm({ ...form, city: text })}
                placeholder="Mumbai"
              />
            </Field>
            <Field label="State" className="flex-1">
              <Input
                value={form.state}
                onChangeText={(text) => setForm({ ...form, state: text })}
                placeholder="Maharashtra"
              />
            </Field>
          </View>

          <Field label="Pincode / Postal Code">
            <Input
              value={form.pincode}
              onChangeText={(text) => setForm({ ...form, pincode: text })}
              placeholder="400001"
              keyboardType="numeric"
            />
          </Field>
        </View>

        <Button
          label="Create & Continue"
          size="lg"
          loading={createSocietyMutation.isPending}
          onPress={handleSubmit}
          className="mb-16"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
