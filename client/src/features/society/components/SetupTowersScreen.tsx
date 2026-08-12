import { useCreateTower, useTowers } from '@/features/society/services/use-society';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useColorScheme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FadeIn } from '@/components/ui/FadeIn';
import { Input } from '@/components/ui/Input';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Spinner } from '@/components/ui/Spinner';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { getErrorMessage } from '@/lib/errors';

export function SetupTowersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { data: towers, isLoading } = useTowers();
  const createTowerMutation = useCreateTower();

  const [towerName, setTowerName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddTower = async () => {
    if (!towerName.trim()) {
      setError('Tower name cannot be empty');
      return;
    }

    setError(null);
    try {
      await createTowerMutation.mutateAsync({ name: towerName.trim() });
      setTowerName('');
    } catch (e) {
      setError(getErrorMessage(e));
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-background px-6 py-12">
        <OnboardingHeader
          title="Setup Towers"
          subtitle="Add the individual buildings, wings, or blocks that make up your estate. You need at least one tower to assign flats."
          step={2}
          totalSteps={4}
          showBack
        />

        {/* Input Form */}
        <Card className="p-5 gap-4 mb-8">
          <Text className="text-sm font-sans-bold text-foreground">Add New Tower / Wing</Text>
          {error ? (
            <View className="p-2.5 bg-danger/10 border border-danger/20 rounded-lg">
              <Text className="text-danger font-sans text-xs">{error}</Text>
            </View>
          ) : null}

          <View className="flex-row gap-3 items-center">
            <Input
              value={towerName}
              onChangeText={setTowerName}
              placeholder="e.g. Tower A or East Wing"
              className="flex-1 bg-surface"
            />
            <Button
              label="Add"
              icon="add"
              size="sm"
              loading={createTowerMutation.isPending}
              onPress={handleAddTower}
            />
          </View>
        </Card>

        {/* Towers List */}
        <View className="mb-10">
          <SectionLabel className="mb-3">Current Towers ({towers?.length ?? 0})</SectionLabel>

          {isLoading ? (
            <Spinner />
          ) : towers && towers.length > 0 ? (
            <View className="gap-2">
              {towers.map((tower, index) => (
                <FadeIn key={tower.id} index={index}>
                  <Card className="p-4 flex-row items-center gap-3">
                    <View className="w-9 h-9 rounded-lg bg-primary/10 items-center justify-center">
                      <Ionicons name="business-outline" size={16} color={theme.primary} />
                    </View>
                    <Text className="text-sm font-sans-semibold text-foreground flex-1">
                      {tower.name}
                    </Text>
                  </Card>
                </FadeIn>
              ))}
            </View>
          ) : (
            <View className="p-6 bg-card border border-border border-dashed rounded-xl items-center justify-center">
              <Text className="text-xs font-sans text-muted">No towers registered yet</Text>
            </View>
          )}
        </View>

        <Button
          label="Next: Setup Flats"
          icon="arrow-forward"
          size="lg"
          onPress={handleNext}
          className="mb-16"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
