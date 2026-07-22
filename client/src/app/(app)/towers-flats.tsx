import { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Screen } from '@/components/Screen';
import {
  useTowers,
  useFlats,
  useCreateTower,
  useCreateFlat,
  useSocietyDetails
} from '@/features/society/services/use-society';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TowersFlatsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const { data: society } = useSocietyDetails();
  const { data: towers, isLoading: isLoadingTowers } = useTowers();
  const { data: flats, isLoading: isLoadingFlats } = useFlats();

  const createTowerMutation = useCreateTower();
  const createFlatMutation = useCreateFlat();

  const [newTowerName, setNewTowerName] = useState('');
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [newFlatNumber, setNewFlatNumber] = useState('');

  const [showAddTower, setShowAddTower] = useState(false);
  const [showAddFlat, setShowAddFlat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTower = async () => {
    if (!newTowerName.trim()) return;
    try {
      setError(null);
      await createTowerMutation.mutateAsync({ name: newTowerName.trim() });
      setNewTowerName('');
      setShowAddTower(false);
    } catch (err: any) {
      setError(err.message ?? 'Failed to create tower');
    }
  };

  const handleCreateFlat = async () => {
    if (!newFlatNumber.trim() || !selectedTowerId) return;
    try {
      setError(null);
      await createFlatMutation.mutateAsync({
        towerId: selectedTowerId,
        flatNumber: newFlatNumber.trim()
      });
      setNewFlatNumber('');
      setShowAddFlat(false);
    } catch (err: any) {
      setError(err.message ?? 'Failed to create flat');
    }
  };

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        {/* Header Bar */}
        <View className="flex-row items-center justify-between py-4 border-b border-border/60 mb-4">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border active:bg-surface"
          >
            <Ionicons name="arrow-back" size={18} color={theme.foreground} />
            <Text className="text-xs font-sans-semibold text-foreground">Back</Text>
          </Pressable>
          <Text className="text-base font-serif-bold text-foreground">Estate Structure</Text>
          <View className="w-16" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Subheader */}
          <View className="mb-6">
            <Text className="text-2xl font-serif-bold text-foreground">Towers &amp; Flats</Text>
            <Text className="text-xs font-sans text-muted mt-1">
              {society?.name ?? 'Estate Directory'} • Structure overview
            </Text>
          </View>

          {error && (
            <View className="p-3 mb-4 rounded-xl bg-danger/10 border border-danger/20">
              <Text className="text-xs font-sans text-danger">{error}</Text>
            </View>
          )}

          {/* Quick Stats */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-card border border-border/80 p-4 rounded-2xl">
              <Text className="text-xs font-sans-medium text-muted uppercase">Towers</Text>
              <Text className="text-2xl font-mono-bold text-primary mt-1">
                {towers?.length ?? 0}
              </Text>
            </View>
            <View className="flex-1 bg-card border border-border/80 p-4 rounded-2xl">
              <Text className="text-xs font-sans-medium text-muted uppercase">
                Flats Registered
              </Text>
              <Text className="text-2xl font-mono-bold text-primary mt-1">
                {flats?.length ?? 0}
              </Text>
            </View>
          </View>

          {/* Towers List Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider">
                Towers List
              </Text>
              <Pressable
                onPress={() => setShowAddTower(!showAddTower)}
                className="flex-row items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 active:bg-primary/20"
              >
                <Ionicons name="add-circle-outline" size={14} color={theme.primary} />
                <Text className="text-xs font-sans-bold text-primary">Add Tower</Text>
              </Pressable>
            </View>

            {showAddTower && (
              <View className="p-4 mb-4 bg-card border border-border rounded-xl gap-3">
                <Text className="text-xs font-sans-semibold text-foreground">New Tower Name</Text>
                <TextInput
                  value={newTowerName}
                  onChangeText={setNewTowerName}
                  placeholder="e.g. Tower A, Block B, West Wing"
                  placeholderTextColor={theme.muted}
                  className="p-3 bg-surface border border-border rounded-xl font-sans text-foreground text-sm"
                />
                <View className="flex-row justify-end gap-2 mt-1">
                  <Pressable
                    onPress={() => setShowAddTower(false)}
                    className="px-4 py-2 rounded-xl bg-surface border border-border"
                  >
                    <Text className="text-xs font-sans text-foreground">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCreateTower}
                    disabled={createTowerMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-primary active:opacity-90"
                  >
                    <Text className="text-xs font-sans-bold text-primary-foreground">
                      {createTowerMutation.isPending ? 'Saving...' : 'Save Tower'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {isLoadingTowers ? (
              <ActivityIndicator color={theme.primary} className="my-4" />
            ) : !towers || towers.length === 0 ? (
              <View className="p-6 rounded-2xl border border-dashed border-border items-center">
                <Text className="text-sm font-sans text-muted">No towers created yet</Text>
              </View>
            ) : (
              <View className="gap-2">
                {towers.map((tower) => {
                  const towerFlats = flats?.filter((f) => f.towerId === tower.id) ?? [];
                  return (
                    <View
                      key={tower.id}
                      className="p-4 bg-card border border-border rounded-2xl gap-2"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <Ionicons name="business" size={18} color={theme.primary} />
                          <Text className="text-base font-serif-semibold text-foreground">
                            {tower.name}
                          </Text>
                        </View>
                        <View className="px-2.5 py-1 rounded-full bg-surface border border-border">
                          <Text className="text-xs font-sans-bold text-muted">
                            {towerFlats.length} flats
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Add Flat Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider">
                Flats Register
              </Text>
              {towers && towers.length > 0 && (
                <Pressable
                  onPress={() => {
                    if (!selectedTowerId && towers.length > 0) {
                      setSelectedTowerId(towers[0].id);
                    }
                    setShowAddFlat(!showAddFlat);
                  }}
                  className="flex-row items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 active:bg-primary/20"
                >
                  <Ionicons name="key-outline" size={14} color={theme.primary} />
                  <Text className="text-xs font-sans-bold text-primary">Add Flat</Text>
                </Pressable>
              )}
            </View>

            {showAddFlat && (
              <View className="p-4 mb-4 bg-card border border-border rounded-xl gap-3">
                <Text className="text-xs font-sans-semibold text-foreground">Select Tower</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row gap-2"
                >
                  {towers?.map((t) => (
                    <Pressable
                      key={t.id}
                      onPress={() => setSelectedTowerId(t.id)}
                      className={`px-3 py-2 rounded-xl border ${
                        selectedTowerId === t.id
                          ? 'bg-primary border-primary'
                          : 'bg-surface border-border'
                      }`}
                    >
                      <Text
                        className={`text-xs font-sans-bold ${
                          selectedTowerId === t.id ? 'text-primary-foreground' : 'text-foreground'
                        }`}
                      >
                        {t.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text className="text-xs font-sans-semibold text-foreground mt-2">Flat Number</Text>
                <TextInput
                  value={newFlatNumber}
                  onChangeText={setNewFlatNumber}
                  placeholder="e.g. 101, 402, B-305"
                  placeholderTextColor={theme.muted}
                  className="p-3 bg-surface border border-border rounded-xl font-sans text-foreground text-sm"
                />

                <View className="flex-row justify-end gap-2 mt-1">
                  <Pressable
                    onPress={() => setShowAddFlat(false)}
                    className="px-4 py-2 rounded-xl bg-surface border border-border"
                  >
                    <Text className="text-xs font-sans text-foreground">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCreateFlat}
                    disabled={createFlatMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-primary active:opacity-90"
                  >
                    <Text className="text-xs font-sans-bold text-primary-foreground">
                      {createFlatMutation.isPending ? 'Saving...' : 'Save Flat'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {isLoadingFlats ? (
              <ActivityIndicator color={theme.primary} className="my-4" />
            ) : !flats || flats.length === 0 ? (
              <View className="p-6 rounded-2xl border border-dashed border-border items-center">
                <Text className="text-sm font-sans text-muted">No flats created yet</Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {flats.map((flat) => (
                  <View
                    key={flat.id}
                    className="px-3.5 py-2.5 bg-card border border-border rounded-xl flex-row items-center gap-2"
                  >
                    <Ionicons name="home-outline" size={14} color={theme.primary} />
                    <Text className="text-xs font-mono-bold text-foreground">
                      {flat.flatNumber}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}
