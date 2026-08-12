import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Field, Input } from '@/components/ui/Input';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { getErrorMessage } from '@/lib/errors';
import { useCreateNotice, useUpdateNotice } from '@/features/notices/hooks/use-notices';
import type { NoticeCategory } from '@/features/notices/services/notices';

const CATEGORIES: { value: NoticeCategory; label: string; icon: string }[] = [
  { value: 'general', label: 'General', icon: 'megaphone-outline' },
  { value: 'event', label: 'Event', icon: 'calendar-outline' },
  { value: 'maintenance', label: 'Maintenance', icon: 'construct-outline' },
  { value: 'emergency', label: 'Emergency', icon: 'warning-outline' }
];

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// End-of-day for the picked date, so a notice expiring "today" stays up
// through today rather than vanishing at midnight the moment it's picked.
function endOfDay(date: Date) {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

export default function CreateNoticeScreen() {
  const router = useRouter();
  const theme = useTheme();

  // Edit mode — the notices board passes the whole notice as params.
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    description?: string;
    category?: NoticeCategory;
    expiresAt?: string;
  }>();
  const isEditing = Boolean(params.id);

  const [title, setTitle] = useState(params.title ?? '');
  const [description, setDescription] = useState(params.description ?? '');
  const [category, setCategory] = useState<NoticeCategory>(params.category ?? 'general');
  const [hasExpiry, setHasExpiry] = useState(Boolean(params.expiresAt));
  const [expiresAt, setExpiresAt] = useState(() =>
    params.expiresAt ? new Date(params.expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000)
  );
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNotice = useCreateNotice();
  const updateNotice = useUpdateNotice();
  const isPending = createNotice.isPending || updateNotice.isPending;

  function handleDateValueChange(_event: unknown, selected: Date) {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    setExpiresAt(selected);
  }

  function handleDatePickerDismiss() {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
  }

  function toggleExpiry() {
    setHasExpiry((prev) => {
      const next = !prev;
      if (next) setShowPicker(true);
      return next;
    });
  }

  async function handleSubmit() {
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (hasExpiry && endOfDay(expiresAt) <= new Date()) {
      setError('Expiry date must be in the future');
      return;
    }

    try {
      if (isEditing && params.id) {
        await updateNotice.mutateAsync({
          id: params.id,
          payload: {
            title: title.trim(),
            description: description.trim(),
            category,
            // null clears the expiry — that's how an expiring notice becomes permanent.
            expiresAt: hasExpiry ? endOfDay(expiresAt).toISOString() : null
          }
        });
      } else {
        await createNotice.mutateAsync({
          title: title.trim(),
          description: description.trim(),
          category,
          expiresAt: hasExpiry ? endOfDay(expiresAt).toISOString() : undefined
        });
      }

      router.replace('/(app)/notices');
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-4" contentContainerClassName="pb-16">
        <ScreenHeader title={isEditing ? 'Edit notice' : 'Create notice'} showBack drawer />

        <SectionLabel className="mb-3">Category</SectionLabel>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <Chip
              key={c.value}
              label={c.label}
              icon={c.icon}
              selected={category === c.value}
              onPress={() => setCategory(c.value)}
            />
          ))}
        </View>

        <Field label="Title">
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Water supply maintenance"
          />
        </Field>

        <Field label="Description">
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Details residents and guards need to know"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            className="min-h-[120px]"
          />
        </Field>

        <SectionLabel className="mb-3">Expiry</SectionLabel>

        <Pressable
          onPress={toggleExpiry}
          className={`flex-row items-center justify-between rounded-xl px-4 py-3 mb-2 border ${
            hasExpiry ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'
          }`}
        >
          <View className="flex-1 pr-3">
            <Text className="text-sm font-sans-semibold text-foreground">
              {hasExpiry ? 'Notice will expire' : 'No expiry — stays up indefinitely'}
            </Text>
            {hasExpiry ? (
              <Text className="text-[11px] font-sans text-muted mt-0.5">
                Automatically removed from the notice board after this date
              </Text>
            ) : null}
          </View>
          <Ionicons
            name={hasExpiry ? 'checkbox' : 'square-outline'}
            size={20}
            color={hasExpiry ? theme.primary : theme.muted}
          />
        </Pressable>

        {hasExpiry ? (
          <Pressable
            onPress={() => setShowPicker(true)}
            className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 mb-4"
          >
            <View className="flex-1 pr-3">
              <Text className="text-[11px] font-sans text-muted">Expires on</Text>
              <Text className="text-sm font-sans-semibold text-foreground mt-0.5" numberOfLines={1}>
                {formatDate(expiresAt)}
              </Text>
            </View>
            <Ionicons name="calendar-outline" size={18} color={theme.primary} />
          </Pressable>
        ) : null}

        {hasExpiry && showPicker ? (
          <DateTimePicker
            value={expiresAt}
            mode="date"
            minimumDate={new Date()}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onValueChange={handleDateValueChange}
            onDismiss={handleDatePickerDismiss}
          />
        ) : null}

        {error ? <Text className="text-sm font-sans text-danger mb-4 mt-2">{error}</Text> : null}

        <Button
          label={isEditing ? 'Save changes' : 'Publish notice'}
          size="lg"
          loading={isPending}
          onPress={handleSubmit}
          className="mt-4"
        />
      </ScrollView>
    </Screen>
  );
}
