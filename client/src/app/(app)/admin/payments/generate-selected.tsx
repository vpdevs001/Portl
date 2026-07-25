import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { useFlats, useTowers } from '@/features/society/services/use-society';
import { useGenerateDues } from '@/features/payments/hooks/use-payments';

export default function GenerateSelectedDuesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const { data: towers, isLoading: towersLoading } = useTowers();
  const { data: flats, isLoading: flatsLoading } = useFlats();
  const generateDues = useGenerateDues();

  const [selectedFlatIds, setSelectedFlatIds] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatsByTower = useMemo(() => {
    const list = flats ?? [];
    const towerList = towers ?? [];
    return towerList
      .map((tower) => ({
        tower,
        flats: list.filter((flat) => flat.towerId === tower.id)
      }))
      .filter((group) => group.flats.length > 0);
  }, [flats, towers]);

  function toggleFlat(id: string) {
    setSelectedFlatIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTower(towerFlatIds: string[]) {
    const allSelected = towerFlatIds.every((id) => selectedFlatIds.has(id));
    setSelectedFlatIds((prev) => {
      const next = new Set(prev);
      towerFlatIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  function handleDateValueChange(_event: unknown, selected: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    setDueDate(selected);
  }

  function handleDatePickerDismiss() {
    if (Platform.OS === 'android') setShowPicker(false);
  }

  async function handleSubmit() {
    setError(null);

    const trimmedPeriod = period.trim();
    const parsedAmount = Number(amount);

    if (selectedFlatIds.size === 0) {
      setError('Select at least one flat');
      return;
    }
    if (!trimmedPeriod) {
      setError('Billing period is required, e.g. "July 2026"');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }

    try {
      await generateDues.mutateAsync({
        period: trimmedPeriod,
        amount: parsedAmount,
        dueDate: dueDate.toISOString().slice(0, 10),
        flatIds: Array.from(selectedFlatIds)
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate dues');
    }
  }

  const isLoading = towersLoading || flatsLoading;

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Bill specific flats</Text>
          <View style={{ width: 24 }} />
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-24">
            <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
              Billing period
            </Text>
            <TextInput
              value={period}
              onChangeText={setPeriod}
              placeholder="e.g. July 2026"
              placeholderTextColor={theme.muted}
              className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans mb-4"
            />

            <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
              Amount per flat (₹)
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 2500"
              placeholderTextColor={theme.muted}
              keyboardType="numeric"
              className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans mb-4"
            />

            <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
              Due date
            </Text>
            <Pressable
              onPress={() => setShowPicker(true)}
              className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 mb-2"
            >
              <Text className="text-sm font-sans-semibold text-foreground">
                {dueDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
              <Ionicons name="calendar-outline" size={18} color={theme.primary} />
            </Pressable>

            {showPicker ? (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onValueChange={handleDateValueChange}
                onDismiss={handleDatePickerDismiss}
              />
            ) : null}

            <View className="flex-row items-center justify-between mt-6 mb-3">
              <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider">
                Select flats ({selectedFlatIds.size} selected)
              </Text>
              {flats && flats.length > 0 ? (
                <Pressable
                  onPress={() =>
                    setSelectedFlatIds(
                      selectedFlatIds.size === flats.length ? new Set() : new Set(flats.map((f) => f.id))
                    )
                  }
                >
                  <Text className="text-xs font-sans-bold text-primary">
                    {selectedFlatIds.size === flats.length ? 'Clear all' : 'Select all'}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {flatsByTower.length === 0 ? (
              <Text className="text-sm font-sans text-foreground-secondary">
                No flats found for this society yet.
              </Text>
            ) : (
              flatsByTower.map(({ tower, flats: towerFlats }) => {
                const towerFlatIds = towerFlats.map((f) => f.id);
                const allSelected = towerFlatIds.every((id) => selectedFlatIds.has(id));

                return (
                  <View key={tower.id} className="bg-card border border-border rounded-2xl p-4 mb-3">
                    <Pressable
                      onPress={() => toggleTower(towerFlatIds)}
                      className="flex-row items-center justify-between mb-3"
                    >
                      <Text className="text-sm font-serif-semibold text-foreground">{tower.name}</Text>
                      <Text className="text-xs font-sans-bold text-primary">
                        {allSelected ? 'Deselect all' : 'Select all'}
                      </Text>
                    </Pressable>

                    <View className="flex-row flex-wrap gap-2">
                      {towerFlats.map((flat) => {
                        const selected = selectedFlatIds.has(flat.id);
                        return (
                          <Pressable
                            key={flat.id}
                            onPress={() => toggleFlat(flat.id)}
                            className={`flex-row items-center gap-1.5 rounded-xl border px-3 py-2 ${
                              selected ? 'bg-primary border-primary' : 'bg-surface border-border'
                            }`}
                          >
                            <Ionicons
                              name={selected ? 'checkbox' : 'square-outline'}
                              size={14}
                              color={selected ? theme.primaryForeground : theme.muted}
                            />
                            <Text
                              className={`text-xs font-sans-bold ${
                                selected ? 'text-primary-foreground' : 'text-foreground-secondary'
                              }`}
                            >
                              {flat.flatNumber}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            )}

            {error ? <Text className="text-sm font-sans text-danger mt-2 mb-2">{error}</Text> : null}

            <Pressable
              onPress={handleSubmit}
              disabled={generateDues.isPending}
              className="rounded-xl bg-primary px-4 py-4 items-center mt-4"
            >
              {generateDues.isPending ? (
                <ActivityIndicator size="small" color={theme.primaryForeground} />
              ) : (
                <Text className="text-sm font-sans-bold text-primary-foreground">
                  Generate for {selectedFlatIds.size || ''} flat{selectedFlatIds.size === 1 ? '' : 's'}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}
