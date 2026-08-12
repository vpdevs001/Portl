import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/errors';
import { useCreateAmenity } from '@/features/amenities/hooks/use-amenities';

export default function CreateAmenityScreen() {
  const router = useRouter();
  const theme = useTheme();

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
      setError(getErrorMessage(e));
    }
  }

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-4" contentContainerClassName="pb-16">
        <ScreenHeader title="Add Amenity" showBack drawer />

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

        <Field label="Amenity Name *">
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Swimming Pool, Clubhouse, Tennis Court"
          />
        </Field>

        <Field label="Description (optional)">
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Opening hours, usage rules, facilities available…"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="min-h-[100px]"
          />
        </Field>

        <Field label="Capacity (optional)">
          <Input
            value={capacity}
            onChangeText={setCapacity}
            placeholder="Maximum number of people at one time"
            keyboardType="number-pad"
          />
        </Field>

        {error ? <Text className="text-sm font-sans text-danger mb-4 mt-2">{error}</Text> : null}

        <Button
          label="Create Amenity"
          size="lg"
          loading={createAmenity.isPending}
          onPress={handleSubmit}
          className="mt-4"
        />
      </ScrollView>
    </Screen>
  );
}
