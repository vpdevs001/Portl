import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { getErrorMessage } from '@/lib/errors';
import { useCreatePoll } from '@/features/polls/hooks/use-polls';

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// End-of-day for the picked date, same pattern as notices' expiresAt
// (Chapter 10) — a poll ending "today" stays open through today rather than
// closing the instant it's picked.
function endOfDay(date: Date) {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

export default function CreatePollScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [endsAt, setEndsAt] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPoll = useCreatePoll();

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function addOption() {
    setOptions((prev) => (prev.length >= 10 ? prev : [...prev, '']));
  }

  function removeOption(index: number) {
    setOptions((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  }

  function handleDateValueChange(_event: unknown, selected: Date) {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    setEndsAt(selected);
  }

  function handleDatePickerDismiss() {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
  }

  async function handleSubmit() {
    setError(null);

    const trimmedQuestion = question.trim();
    const trimmedOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);

    if (!trimmedQuestion) {
      setError('Question is required');
      return;
    }
    if (trimmedOptions.length < 2) {
      setError('Add at least 2 options');
      return;
    }
    if (endOfDay(endsAt) <= new Date()) {
      setError('End date must be in the future');
      return;
    }

    try {
      await createPoll.mutateAsync({
        question: trimmedQuestion,
        endsAt: endOfDay(endsAt).toISOString(),
        options: trimmedOptions
      });

      router.replace('/(app)/polls');
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-4" contentContainerClassName="pb-16">
        <ScreenHeader title="Create poll" showBack drawer />

        <Field label="Question">
          <Input
            value={question}
            onChangeText={setQuestion}
            placeholder="e.g. Should we install EV chargers?"
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            className="min-h-[60px]"
          />
        </Field>

        <SectionLabel className="mb-3">Options</SectionLabel>
        <View className="gap-2 mb-2">
          {options.map((option, index) => (
            <View key={index} className="flex-row items-center gap-2">
              <Input
                value={option}
                onChangeText={(value) => updateOption(index, value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1"
              />
              {options.length > 2 ? (
                <Pressable
                  onPress={() => removeOption(index)}
                  hitSlop={10}
                  className="w-10 h-10 rounded-xl bg-card border border-border items-center justify-center"
                >
                  <Ionicons name="close" size={16} color={theme.muted} />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>

        {options.length < 10 ? (
          <Pressable
            onPress={addOption}
            className="flex-row items-center gap-2 rounded-xl border border-dashed border-primary/40 px-4 py-3 mb-6"
          >
            <Ionicons name="add" size={16} color={theme.primary} />
            <Text className="text-xs font-sans-bold text-primary">Add option</Text>
          </Pressable>
        ) : (
          <View className="mb-6" />
        )}

        <SectionLabel className="mb-3">Voting window</SectionLabel>

        <Pressable
          onPress={() => setShowPicker(true)}
          className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 mb-4"
        >
          <View className="flex-1 pr-3">
            <Text className="text-[11px] font-sans text-muted">Poll ends on</Text>
            <Text className="text-sm font-sans-semibold text-foreground mt-0.5" numberOfLines={1}>
              {formatDate(endsAt)}
            </Text>
          </View>
          <Ionicons name="calendar-outline" size={18} color={theme.primary} />
        </Pressable>

        {showPicker ? (
          <DateTimePicker
            value={endsAt}
            mode="date"
            minimumDate={new Date()}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onValueChange={handleDateValueChange}
            onDismiss={handleDatePickerDismiss}
          />
        ) : null}

        {error ? <Text className="text-sm font-sans text-danger mb-4 mt-2">{error}</Text> : null}

        <Button
          label="Publish poll"
          size="lg"
          loading={createPoll.isPending}
          onPress={handleSubmit}
          className="mt-4"
        />
      </ScrollView>
    </Screen>
  );
}
