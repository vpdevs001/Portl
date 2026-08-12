import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Screen } from '@/components/Screen';
import { RoleGate } from '@/components/RoleGate';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Field, Input } from '@/components/ui/Input';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Spinner } from '@/components/ui/Spinner';
import {
  useTowers,
  useFlats,
  useCreateTower,
  useCreateFlat,
  useUpdateFlat,
  useSocietyDetails,
  type Flat,
  type FlatType
} from '@/features/society/services/use-society';
import { useTheme } from '@/hooks/useColorScheme';
import { getErrorMessage } from '@/lib/errors';

const FLAT_TYPES: { value: FlatType; label: string }[] = [
  { value: '1bhk', label: '1BHK' },
  { value: '2bhk', label: '2BHK' },
  { value: '3bhk', label: '3BHK' },
  { value: '4bhk', label: '4BHK' },
  { value: '5bhk', label: '5BHK' },
  { value: 'other', label: 'Other' }
];

export default function TowersFlatsRoute() {
  return (
    <RoleGate roles={['society_admin']}>
      <TowersFlatsScreen />
    </RoleGate>
  );
}

function TowersFlatsScreen() {
  const theme = useTheme();

  const { data: society } = useSocietyDetails();
  const { data: towers, isLoading: isLoadingTowers } = useTowers();
  const { data: flats, isLoading: isLoadingFlats } = useFlats();

  const createTowerMutation = useCreateTower();
  const createFlatMutation = useCreateFlat();
  const updateFlatMutation = useUpdateFlat();

  const [newTowerName, setNewTowerName] = useState('');
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [newFlatNumber, setNewFlatNumber] = useState('');
  const [newFlatType, setNewFlatType] = useState<FlatType>('1bhk');
  const [newFlatAmount, setNewFlatAmount] = useState('');

  const [showAddTower, setShowAddTower] = useState(false);
  const [showAddFlat, setShowAddFlat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingFlat, setEditingFlat] = useState<Flat | null>(null);
  const [editFlatType, setEditFlatType] = useState<FlatType>('1bhk');
  const [editFlatAmount, setEditFlatAmount] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const openEditFlat = (flat: Flat) => {
    setEditingFlat(flat);
    setEditFlatType(flat.flatType);
    setEditFlatAmount(flat.monthlyAmount);
    setEditError(null);
  };

  const handleUpdateFlat = async () => {
    if (!editingFlat) return;
    const parsedAmount = Number(editFlatAmount.trim());
    if (!editFlatAmount.trim() || isNaN(parsedAmount) || parsedAmount < 0) {
      setEditError('Enter a valid monthly amount');
      return;
    }
    try {
      setEditError(null);
      await updateFlatMutation.mutateAsync({
        id: editingFlat.id,
        flatType: editFlatType,
        monthlyAmount: parsedAmount
      });
      setEditingFlat(null);
    } catch (err) {
      setEditError(getErrorMessage(err));
    }
  };

  const handleCreateTower = async () => {
    if (!newTowerName.trim()) return;
    try {
      setError(null);
      await createTowerMutation.mutateAsync({ name: newTowerName.trim() });
      setNewTowerName('');
      setShowAddTower(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleCreateFlat = async () => {
    if (!newFlatNumber.trim() || !selectedTowerId) return;
    const parsedAmount = newFlatAmount.trim() ? Number(newFlatAmount.trim()) : 0;
    if (newFlatAmount.trim() && (isNaN(parsedAmount) || parsedAmount < 0)) {
      setError('Enter a valid monthly amount');
      return;
    }
    try {
      setError(null);
      await createFlatMutation.mutateAsync({
        towerId: selectedTowerId,
        flatNumber: newFlatNumber.trim(),
        flatType: newFlatType,
        monthlyAmount: parsedAmount
      });
      setNewFlatNumber('');
      setNewFlatType('1bhk');
      setNewFlatAmount('');
      setShowAddFlat(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <ScreenHeader title="Estate Structure" showBack drawer />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Subheader */}
          <View className="mb-6">
            <Text className="text-2xl font-serif-bold text-foreground">Towers & Flats</Text>
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
            <Card className="flex-1 p-4">
              <Text className="text-xs font-sans-medium text-muted uppercase">Towers</Text>
              <Text className="text-2xl font-mono-semibold text-primary mt-1">
                {towers?.length ?? 0}
              </Text>
            </Card>
            <Card className="flex-1 p-4">
              <Text className="text-xs font-sans-medium text-muted uppercase">
                Flats Registered
              </Text>
              <Text className="text-2xl font-mono-semibold text-primary mt-1">
                {flats?.length ?? 0}
              </Text>
            </Card>
          </View>

          {/* Towers List Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <SectionLabel>Towers List</SectionLabel>
              <Button
                label="Add Tower"
                icon="add-circle-outline"
                variant="outline"
                size="sm"
                onPress={() => setShowAddTower(!showAddTower)}
              />
            </View>

            {showAddTower && (
              <Card className="p-4 mb-4 gap-3">
                <Text className="text-xs font-sans-semibold text-foreground">New Tower Name</Text>
                <Input
                  value={newTowerName}
                  onChangeText={setNewTowerName}
                  placeholder="e.g. Tower A, Block B, West Wing"
                  className="bg-surface"
                />
                <View className="flex-row justify-end gap-2 mt-1">
                  <Button
                    label="Cancel"
                    variant="secondary"
                    size="sm"
                    haptic={false}
                    onPress={() => setShowAddTower(false)}
                  />
                  <Button
                    label="Save Tower"
                    size="sm"
                    loading={createTowerMutation.isPending}
                    onPress={handleCreateTower}
                  />
                </View>
              </Card>
            )}

            {isLoadingTowers ? (
              <Spinner className="my-4" />
            ) : !towers || towers.length === 0 ? (
              <View className="p-6 rounded-2xl border border-dashed border-border items-center">
                <Text className="text-sm font-sans text-muted">No towers created yet</Text>
              </View>
            ) : (
              <View className="gap-2">
                {towers.map((tower) => {
                  const towerFlats = flats?.filter((f) => f.towerId === tower.id) ?? [];
                  return (
                    <Card key={tower.id} className="p-4 gap-2">
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
                    </Card>
                  );
                })}
              </View>
            )}
          </View>

          {/* Add Flat Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <SectionLabel>Flats Register</SectionLabel>
              {towers && towers.length > 0 && (
                <Button
                  label="Add Flat"
                  icon="key-outline"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    if (!selectedTowerId && towers.length > 0) {
                      setSelectedTowerId(towers[0].id);
                    }
                    setShowAddFlat(!showAddFlat);
                  }}
                />
              )}
            </View>

            {showAddFlat && (
              <Card className="p-4 mb-4 gap-3">
                <Text className="text-xs font-sans-semibold text-foreground">Select Tower</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2"
                >
                  {towers?.map((t) => (
                    <Chip
                      key={t.id}
                      label={t.name}
                      selected={selectedTowerId === t.id}
                      onPress={() => setSelectedTowerId(t.id)}
                    />
                  ))}
                </ScrollView>

                <Text className="text-xs font-sans-semibold text-foreground mt-2">Flat Number</Text>
                <Input
                  value={newFlatNumber}
                  onChangeText={setNewFlatNumber}
                  placeholder="e.g. 101, 402, B-305"
                  className="bg-surface"
                />

                <Text className="text-xs font-sans-semibold text-foreground mt-2">Flat Type</Text>
                <View className="flex-row flex-wrap gap-2">
                  {FLAT_TYPES.map((t) => (
                    <Chip
                      key={t.value}
                      label={t.label}
                      selected={newFlatType === t.value}
                      onPress={() => setNewFlatType(t.value)}
                    />
                  ))}
                </View>

                <Text className="text-xs font-sans-semibold text-foreground mt-2">
                  Monthly Amount (₹)
                </Text>
                <Input
                  value={newFlatAmount}
                  onChangeText={setNewFlatAmount}
                  placeholder="e.g. 2500"
                  keyboardType="numeric"
                  className="bg-surface"
                />

                <View className="flex-row justify-end gap-2 mt-1">
                  <Button
                    label="Cancel"
                    variant="secondary"
                    size="sm"
                    haptic={false}
                    onPress={() => setShowAddFlat(false)}
                  />
                  <Button
                    label="Save Flat"
                    size="sm"
                    loading={createFlatMutation.isPending}
                    onPress={handleCreateFlat}
                  />
                </View>
              </Card>
            )}

            {isLoadingFlats ? (
              <Spinner className="my-4" />
            ) : !flats || flats.length === 0 ? (
              <View className="p-6 rounded-2xl border border-dashed border-border items-center">
                <Text className="text-sm font-sans text-muted">No flats created yet</Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {flats.map((flat) => (
                  <Pressable
                    key={flat.id}
                    onPress={() => openEditFlat(flat)}
                    className="px-3.5 py-2.5 bg-card border border-border rounded-xl flex-row items-center gap-2 active:bg-surface"
                  >
                    <Ionicons name="home-outline" size={14} color={theme.primary} />
                    <Text className="text-xs font-mono-semibold text-foreground">
                      {flat.flatNumber}
                    </Text>
                    <View className="px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                      <Text className="text-[9px] font-sans-bold text-primary uppercase">
                        {FLAT_TYPES.find((t) => t.value === flat.flatType)?.label ?? flat.flatType}
                      </Text>
                    </View>
                    <Text className="text-[10px] font-sans-bold text-muted">
                      ₹{flat.monthlyAmount}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Edit flat bottom sheet */}
      <Modal
        visible={!!editingFlat}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingFlat(null)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl px-6 pt-5 pb-8">
            <View className="items-center mb-4">
              <View className="w-10 h-1 rounded-full bg-border" />
            </View>

            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-serif-semibold text-foreground">
                Edit flat {editingFlat?.flatNumber}
              </Text>
              <Pressable onPress={() => setEditingFlat(null)} hitSlop={12}>
                <Ionicons name="close" size={22} color={theme.foreground} />
              </Pressable>
            </View>

            <SectionLabel className="mb-2">Flat Type</SectionLabel>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {FLAT_TYPES.map((t) => (
                <Chip
                  key={t.value}
                  label={t.label}
                  selected={editFlatType === t.value}
                  onPress={() => setEditFlatType(t.value)}
                />
              ))}
            </View>

            <Field label="Monthly Amount (₹)">
              <Input
                value={editFlatAmount}
                onChangeText={setEditFlatAmount}
                placeholder="e.g. 2500"
                keyboardType="numeric"
                className="mb-4"
              />
            </Field>

            {editError ? (
              <Text className="text-sm font-sans text-danger mb-4">{editError}</Text>
            ) : null}

            <Button
              label="Save changes"
              size="lg"
              loading={updateFlatMutation.isPending}
              onPress={handleUpdateFlat}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
