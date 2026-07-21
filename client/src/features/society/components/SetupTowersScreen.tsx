import { useCreateTower, useTowers } from '@/features/society/services/use-society';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

export function SetupTowersScreen() {
  const router = useRouter();
  const { data: towers, isLoading } = useTowers();
  const createTowerMutation = useCreateTower();

  const [towerName, setTowerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const handleAddTower = async () => {
    if (!towerName.trim()) {
      setError('Tower name cannot be empty');
      return;
    }

    setError(null);
    try {
      await createTowerMutation.mutateAsync({ name: towerName.trim() });
      setTowerName('');
    } catch (e: any) {
      setError(e.message ?? 'Failed to add tower');
    }
  };

  const handleNext = () => {
    if (!towers || towers.length === 0) {
      setError('Please add at least one tower first');
      return;
    }
    router.push('/(onboarding)/setup-flats');
  };

  return (
    <ScrollView className="flex-1 bg-background px-6 py-12">
      {/* Hero */}
      <View className="mb-8 mt-4">
        <Text className="text-3xl font-serif-bold text-foreground mb-3">Setup Towers</Text>
        <Text className="text-sm font-sans text-foreground-secondary leading-5">
          Add the individual buildings, wings, or blocks that make up your estate. You need at least
          one tower to assign flats.
        </Text>
      </View>

      {/* Input Form */}
      <View className="p-5 bg-card border border-border rounded-xl gap-4 mb-8">
        <Text className="text-sm font-sans-bold text-foreground">Add New Tower / Wing</Text>
        {error ? (
          <View className="p-2.5 bg-danger/10 border border-danger/20 rounded-lg">
            <Text className="text-danger font-sans text-xs">{error}</Text>
          </View>
        ) : null}

        <View className="flex-row gap-3">
          <TextInput
            value={towerName}
            onChangeText={setTowerName}
            placeholder="e.g. Tower A or East Wing"
            placeholderTextColor="#93a08d"
            className="flex-1 bg-surface border border-border rounded-lg px-3.5 py-2.5 text-foreground font-sans text-sm"
          />
          <Pressable
            onPress={handleAddTower}
            disabled={createTowerMutation.isPending}
            className="px-4 py-2.5 bg-primary rounded-lg justify-center items-center"
          >
            {createTowerMutation.isPending ? (
              <ActivityIndicator size="small" color="#1a1409" />
            ) : (
              <Ionicons name="add" size={20} color={theme.primaryForeground} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Towers List */}
      <View className="mb-10">
        <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase mb-3">
          Current Towers ({towers?.length ?? 0})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color="#a9832e" />
        ) : towers && towers.length > 0 ? (
          <View className="gap-2">
            {towers.map((tower) => (
              <View
                key={tower.id}
                className="p-4 bg-card border border-border rounded-xl flex-row justify-between items-center"
              >
                <Text className="text-sm font-sans-medium text-foreground">{tower.name}</Text>
                <Text className="text-xs font-sans text-muted">ID: {tower.id.slice(0, 8)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="p-6 bg-card border border-border border-dashed rounded-xl items-center justify-center">
            <Text className="text-xs font-sans text-muted">No towers registered yet</Text>
          </View>
        )}
      </View>

      {/* Next Step */}
      <Pressable
        onPress={handleNext}
        className="w-full py-4 rounded-xl bg-primary active:opacity-90 items-center justify-center flex-row gap-2 mb-16"
      >
        <Text className="text-primary-foreground font-sans-bold text-base">Next: Setup Flats</Text>
        <Ionicons name="arrow-forward" size={18} color={theme.primaryForeground} />
      </Pressable>
    </ScrollView>
  );
}
