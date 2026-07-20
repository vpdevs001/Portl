import { useCreateFlat, useFlats, useTowers } from '@/hooks/use-society';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

export default function SetupFlats() {
  const router = useRouter();
  const { data: towers, isLoading: isLoadingTowers } = useTowers();
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);

  // Defaults to the first tower until the user explicitly picks one —
  // derived during render rather than synced via a useEffect+setState pair,
  // which avoids an extra render pass for what's really just a fallback.
  const effectiveTowerId = selectedTowerId ?? towers?.[0]?.id ?? null;

  const { data: flats, isLoading: isLoadingFlats } = useFlats(effectiveTowerId ?? undefined);
  const createFlatMutation = useCreateFlat();

  const [flatNumber, setFlatNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddFlat = async () => {
    if (!effectiveTowerId) {
      setError('Please select or add a tower first');
      return;
    }
    if (!flatNumber.trim()) {
      setError('Flat number cannot be empty');
      return;
    }

    setError(null);
    const parsedFloor = floor.trim() ? parseInt(floor.trim(), 10) : undefined;
    if (floor.trim() && isNaN(parsedFloor as number)) {
      setError('Floor must be a valid number');
      return;
    }

    try {
      await createFlatMutation.mutateAsync({
        towerId: effectiveTowerId,
        flatNumber: flatNumber.trim(),
        floor: parsedFloor
      });
      setFlatNumber('');
      setFloor('');
    } catch (e: any) {
      setError(e.message ?? 'Failed to add flat');
    }
  };

  const handleNext = () => {
    router.push('/(onboarding)/invite-members');
  };

  return (
    <ScrollView className="flex-1 bg-background px-6 py-12">
      {/* Hero */}
      <View className="mb-8 mt-4">
        <Text className="text-3xl font-serif-bold text-foreground mb-3">Setup Flats</Text>
        <Text className="text-sm font-sans text-foreground-secondary leading-5">
          Map out the apartments or office units in each tower. You can switch towers to view and configure their respective units.
        </Text>
      </View>

      {/* Tower Selector */}
      <View className="mb-6">
        <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase mb-3">Select Tower</Text>
        {isLoadingTowers ? (
          <ActivityIndicator size="small" color="#a9832e" />
        ) : towers && towers.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {towers.map((t) => {
              const active = effectiveTowerId === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setSelectedTowerId(t.id)}
                  className={`px-4 py-2.5 rounded-lg border mr-2 ${
                    active
                      ? 'bg-primary border-primary'
                      : 'bg-card border-border'
                  }`}
                >
                  <Text
                    className={`text-xs font-sans-medium ${
                      active ? 'text-primary-foreground' : 'text-foreground'
                    }`}
                  >
                    {t.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <Text className="text-xs font-sans text-muted">No towers registered. Go back to add towers.</Text>
        )}
      </View>

      {/* Add Flat Form */}
      <View className="p-5 bg-card border border-border rounded-xl gap-4 mb-8">
        <Text className="text-sm font-sans-bold text-foreground">Add New Flat</Text>
        {error ? (
          <View className="p-2.5 bg-danger/10 border border-danger/20 rounded-lg">
            <Text className="text-danger font-sans text-xs">{error}</Text>
          </View>
        ) : null}

        <View className="flex-row gap-3">
          <View className="flex-[2] gap-1">
            <Text className="text-[10px] font-sans-semibold text-muted uppercase">Flat No.</Text>
            <TextInput
              value={flatNumber}
              onChangeText={setFlatNumber}
              placeholder="e.g. 101"
              placeholderTextColor="#93a08d"
              className="bg-surface border border-border rounded-lg px-3.5 py-2 text-foreground font-sans text-xs"
            />
          </View>

          <View className="flex-1 gap-1">
            <Text className="text-[10px] font-sans-semibold text-muted uppercase">Floor (Opt)</Text>
            <TextInput
              value={floor}
              onChangeText={setFloor}
              placeholder="e.g. 1"
              placeholderTextColor="#93a08d"
              keyboardType="numeric"
              className="bg-surface border border-border rounded-lg px-3.5 py-2 text-foreground font-sans text-xs"
            />
          </View>

          <View className="justify-end">
            <Pressable
              onPress={handleAddFlat}
              disabled={createFlatMutation.isPending}
              className="px-4 py-2 bg-primary rounded-lg items-center justify-center h-10"
            >
              {createFlatMutation.isPending ? (
                <ActivityIndicator size="small" color="#1a1409" />
              ) : (
                <Text className="text-primary-foreground font-sans-semibold text-xs">Add</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Flats List */}
      <View className="mb-10">
        <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase mb-3">
          Units registered in {towers?.find((t) => t.id === effectiveTowerId)?.name ?? 'Tower'} ({flats?.length ?? 0})
        </Text>

        {isLoadingFlats ? (
          <ActivityIndicator size="small" color="#a9832e" />
        ) : flats && flats.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {flats.map((flat) => (
              <View
                key={flat.id}
                className="px-3.5 py-2 bg-card border border-border rounded-lg flex-row items-center gap-1.5"
              >
                <Text className="text-xs font-sans-medium text-foreground">{flat.flatNumber}</Text>
                <Text className="text-[10px] font-sans text-muted">
                  (Fl: {flat.floor ?? 'G'})
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="p-6 bg-card border border-border border-dashed rounded-xl items-center justify-center">
            <Text className="text-xs font-sans text-muted">No units registered in this tower yet</Text>
          </View>
        )}
      </View>

      {/* Next Step */}
      <Pressable
        onPress={handleNext}
        className="w-full py-4 rounded-xl bg-primary active:opacity-90 items-center justify-center mb-16"
      >
        <Text className="text-primary-foreground font-sans-bold text-base">Next: Invite Members</Text>
      </Pressable>
    </ScrollView>
  );
}
