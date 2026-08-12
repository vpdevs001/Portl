import {
  useCreateFlat,
  useFlats,
  useTowers,
  type FlatType
} from '@/features/society/services/use-society';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { FadeIn } from '@/components/ui/FadeIn';
import { Input } from '@/components/ui/Input';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Spinner } from '@/components/ui/Spinner';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { getErrorMessage } from '@/lib/errors';

const FLAT_TYPES: { value: FlatType; label: string }[] = [
  { value: '1bhk', label: '1BHK' },
  { value: '2bhk', label: '2BHK' },
  { value: '3bhk', label: '3BHK' },
  { value: '4bhk', label: '4BHK' },
  { value: '5bhk', label: '5BHK' },
  { value: 'other', label: 'Other' }
];

export function SetupFlatsScreen() {
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
  const [flatType, setFlatType] = useState<FlatType>('1bhk');
  const [monthlyAmount, setMonthlyAmount] = useState('');
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

    const parsedAmount = monthlyAmount.trim() ? Number(monthlyAmount.trim()) : 0;
    if (monthlyAmount.trim() && (isNaN(parsedAmount) || parsedAmount < 0)) {
      setError('Monthly amount must be a valid number');
      return;
    }

    try {
      await createFlatMutation.mutateAsync({
        towerId: effectiveTowerId,
        flatNumber: flatNumber.trim(),
        floor: parsedFloor,
        flatType,
        monthlyAmount: parsedAmount
      });
      setFlatNumber('');
      setFloor('');
      setFlatType('1bhk');
      setMonthlyAmount('');
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const handleNext = () => {
    router.push('/(onboarding)/invite-members');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-background px-6 py-12">
        <OnboardingHeader
          title="Setup Flats"
          subtitle="Map out the apartments or office units in each tower. You can switch towers to view and configure their respective units."
          step={3}
          totalSteps={4}
          showBack
        />

        {/* Tower Selector */}
        <View className="mb-6">
          <SectionLabel className="mb-3">Select Tower</SectionLabel>
          {isLoadingTowers ? (
            <Spinner />
          ) : towers && towers.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2"
            >
              {towers.map((t) => (
                <Chip
                  key={t.id}
                  label={t.name}
                  selected={effectiveTowerId === t.id}
                  onPress={() => setSelectedTowerId(t.id)}
                />
              ))}
            </ScrollView>
          ) : (
            <Text className="text-xs font-sans text-muted">
              No towers registered. Go back to add towers.
            </Text>
          )}
        </View>

        {/* Add Flat Form */}
        <Card className="p-5 gap-4 mb-8">
          <Text className="text-sm font-sans-bold text-foreground">Add New Flat</Text>
          {error ? (
            <View className="p-2.5 bg-danger/10 border border-danger/20 rounded-lg">
              <Text className="text-danger font-sans text-xs">{error}</Text>
            </View>
          ) : null}

          <View className="flex-row gap-3 items-end">
            <View className="flex-[2] gap-1">
              <Text className="text-[10px] font-sans-semibold text-muted uppercase">Flat No.</Text>
              <Input
                value={flatNumber}
                onChangeText={setFlatNumber}
                placeholder="e.g. 101"
                className="bg-surface"
              />
            </View>

            <View className="flex-1 gap-1">
              <Text className="text-[10px] font-sans-semibold text-muted uppercase">
                Floor (Opt)
              </Text>
              <Input
                value={floor}
                onChangeText={setFloor}
                placeholder="e.g. 1"
                keyboardType="numeric"
                className="bg-surface"
              />
            </View>
          </View>

          <View className="gap-1">
            <Text className="text-[10px] font-sans-semibold text-muted uppercase">Flat Type</Text>
            <View className="flex-row flex-wrap gap-2">
              {FLAT_TYPES.map((t) => (
                <Chip
                  key={t.value}
                  label={t.label}
                  selected={flatType === t.value}
                  onPress={() => setFlatType(t.value)}
                />
              ))}
            </View>
          </View>

          <View className="gap-1">
            <Text className="text-[10px] font-sans-semibold text-muted uppercase">
              Monthly Amount (₹)
            </Text>
            <Input
              value={monthlyAmount}
              onChangeText={setMonthlyAmount}
              placeholder="e.g. 2500"
              keyboardType="numeric"
              className="bg-surface"
            />
          </View>

          <Button
            label="Add Flat"
            icon="add"
            size="sm"
            loading={createFlatMutation.isPending}
            onPress={handleAddFlat}
            className="self-end"
          />
        </Card>

        {/* Flats List */}
        <View className="mb-10">
          <SectionLabel className="mb-3">
            Units in {towers?.find((t) => t.id === effectiveTowerId)?.name ?? 'Tower'} (
            {flats?.length ?? 0})
          </SectionLabel>

          {isLoadingFlats ? (
            <Spinner />
          ) : flats && flats.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {flats.map((flat, index) => (
                <FadeIn key={flat.id} index={index}>
                  <View className="px-3.5 py-2 bg-card border border-border rounded-lg flex-row items-center gap-1.5">
                    <Text className="text-xs font-sans-medium text-foreground">
                      {flat.flatNumber}
                    </Text>
                    <Text className="text-[10px] font-sans text-muted">
                      (Fl: {flat.floor ?? 'G'})
                    </Text>
                    <View className="px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                      <Text className="text-[9px] font-sans-bold text-primary uppercase">
                        {FLAT_TYPES.find((t) => t.value === flat.flatType)?.label ?? flat.flatType}
                      </Text>
                    </View>
                    <Text className="text-[10px] font-sans-bold text-muted">
                      ₹{flat.monthlyAmount}
                    </Text>
                  </View>
                </FadeIn>
              ))}
            </View>
          ) : (
            <View className="p-6 bg-card border border-border border-dashed rounded-xl items-center justify-center">
              <Text className="text-xs font-sans text-muted">
                No units registered in this tower yet
              </Text>
            </View>
          )}
        </View>

        <Button
          label="Next: Invite Members"
          icon="arrow-forward"
          size="lg"
          onPress={handleNext}
          className="mb-16"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
