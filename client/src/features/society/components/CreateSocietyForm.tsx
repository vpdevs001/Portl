import { useCreateSociety } from '@/features/society/services/use-society';
import { authClient } from '@/lib/auth-client';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

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
    } catch (e: any) {
      setError(e.message ?? 'Failed to register society');
    }
  };

  const isPending = createSocietyMutation.isPending;

  return (
    <ScrollView className="flex-1 bg-background px-6 py-12">
      {/* Back Button */}
      <View className="mb-6">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 py-1">
          <Ionicons name="chevron-back" size={18} color="#a9832e" />
          <Text className="text-primary font-sans-medium text-sm">Back</Text>
        </Pressable>
      </View>

      {/* Hero */}
      <View className="mb-8">
        <Text className="text-3xl font-serif-bold text-foreground mb-3">Register Estate</Text>
        <Text className="text-sm font-sans text-foreground-secondary leading-5">
          Establish the identity of your residential estate or commercial building to manage towers,
          flats, and members.
        </Text>
      </View>

      {/* Form Fields */}
      <View className="gap-5 mb-8">
        {error ? (
          <View className="p-3 bg-danger/10 border border-danger/20 rounded-xl">
            <Text className="text-danger font-sans text-sm">{error}</Text>
          </View>
        ) : null}

        <View className="gap-2">
          <Text className="text-xs font-sans-semibold text-foreground-secondary uppercase tracking-wider">
            Estate Name
          </Text>
          <TextInput
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            placeholder="e.g. Portl Heights"
            placeholderTextColor="#93a08d"
            className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground font-sans text-sm"
          />
        </View>

        <View className="gap-2">
          <Text className="text-xs font-sans-semibold text-foreground-secondary uppercase tracking-wider">
            Street Address
          </Text>
          <TextInput
            value={form.address}
            onChangeText={(text) => setForm({ ...form, address: text })}
            placeholder="e.g. 123 Luxury Road, Sector 5"
            placeholderTextColor="#93a08d"
            className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground font-sans text-sm"
          />
        </View>

        <View className="flex-row gap-4">
          <View className="flex-1 gap-2">
            <Text className="text-xs font-sans-semibold text-foreground-secondary uppercase tracking-wider">
              City
            </Text>
            <TextInput
              value={form.city}
              onChangeText={(text) => setForm({ ...form, city: text })}
              placeholder="Mumbai"
              placeholderTextColor="#93a08d"
              className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground font-sans text-sm"
            />
          </View>
          <View className="flex-1 gap-2">
            <Text className="text-xs font-sans-semibold text-foreground-secondary uppercase tracking-wider">
              State
            </Text>
            <TextInput
              value={form.state}
              onChangeText={(text) => setForm({ ...form, state: text })}
              placeholder="Maharashtra"
              placeholderTextColor="#93a08d"
              className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground font-sans text-sm"
            />
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs font-sans-semibold text-foreground-secondary uppercase tracking-wider">
            Pincode / Postal Code
          </Text>
          <TextInput
            value={form.pincode}
            onChangeText={(text) => setForm({ ...form, pincode: text })}
            placeholder="400001"
            placeholderTextColor="#93a08d"
            keyboardType="numeric"
            className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground font-sans text-sm"
          />
        </View>
      </View>

      {/* Submit */}
      <Pressable
        onPress={handleSubmit}
        disabled={isPending}
        className="w-full py-4 rounded-xl bg-primary active:opacity-90 items-center justify-center flex-row gap-2 mb-16"
      >
        {isPending ? (
          <ActivityIndicator size="small" color="#1a1409" />
        ) : (
          <Text className="text-primary-foreground font-sans-bold text-base">
            Create & Continue
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
