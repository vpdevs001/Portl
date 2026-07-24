import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import { useCreateAmenity } from '@/features/amenities/hooks/use-amenities';

export default function CreateAmenityScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createAmenity = useCreateAmenity();

  async function handleSubmit() {
    setError(null);

    if (!name.trim()) {
      setError('Amenity name is required.');
      return;
    }

    const capacityNum = capacity.trim() ? parseInt(capacity.trim(), 10) : undefined;
    if (capacity.trim() && (isNaN(capacityNum!) || capacityNum! <= 0)) {
      setError('Capacity must be a positive number.');
      return;
    }

    try {
      await createAmenity.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        capacity: capacityNum
      });

      router.replace('/(app)/admin/amenities/logs');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create amenity.');
    }
  }

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-4" contentContainerClassName="pb-16">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Add Amenity</Text>
          <DrawerButton />
        </View>

        {/* Info banner */}
        <View className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-6 flex-row items-start gap-3">
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={theme.primary}
            style={{ marginTop: 1 }}
          />
          <Text className="text-xs font-sans text-foreground-secondary flex-1 leading-5">
            Once created, residents can browse and book this amenity from their dashboard. You can
            view all bookings from the Amenity Bookings screen.
          </Text>
        </View>

        {/* Name */}
        <Field label="Amenity Name *">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Swimming Pool, Clubhouse, Tennis Court"
            placeholderTextColor={theme.muted}
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans"
          />
        </Field>

        {/* Description */}
        <Field label="Description (optional)">
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Opening hours, usage rules, facilities available…"
            placeholderTextColor={theme.muted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans min-h-[100px]"
          />
        </Field>

        {/* Capacity */}
        <Field label="Capacity (optional)">
          <TextInput
            value={capacity}
            onChangeText={setCapacity}
            placeholder="Maximum number of people at one time"
            placeholderTextColor={theme.muted}
            keyboardType="number-pad"
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans"
          />
        </Field>

        {error ? <Text className="text-sm font-sans text-danger mb-4 mt-2">{error}</Text> : null}

        <Pressable
          onPress={handleSubmit}
          disabled={createAmenity.isPending}
          className="rounded-xl bg-primary px-4 py-4 items-center mt-4"
        >
          {createAmenity.isPending ? (
            <ActivityIndicator size="small" color={theme.primaryForeground} />
          ) : (
            <Text className="text-sm font-sans-bold text-primary-foreground">Create Amenity</Text>
          )}
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
        {label}
      </Text>
      {children}
    </View>
  );
}
