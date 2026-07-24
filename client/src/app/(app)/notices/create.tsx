import { useState } from 'react';
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
import { DrawerButton } from '@/components/DrawerButton';
import { useCreateNotice } from '@/features/notices/hooks/use-notices';
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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<NoticeCategory>('general');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState(() => new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNotice = useCreateNotice();

  function handleDateChange(_event: unknown, selected?: Date) {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selected) {
      setExpiresAt(selected);
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
      await createNotice.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category,
        expiresAt: hasExpiry ? endOfDay(expiresAt).toISOString() : undefined
      });

      router.replace('/(app)/notices');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create notice');
    }
  }

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-4" contentContainerClassName="pb-16">
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Create notice</Text>
          <DrawerButton />
        </View>

        <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-3">
          Category
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6"
          contentContainerClassName="gap-2"
        >
          {CATEGORIES.map((c) => {
            const active = category === c.value;
            return (
              <Pressable
                key={c.value}
                onPress={() => setCategory(c.value)}
                className={`flex-row items-center gap-2 px-4 py-2.5 rounded-full border mr-2 ${
                  active ? 'bg-primary border-primary' : 'bg-card border-border'
                }`}
              >
                <Ionicons
                  name={c.icon as never}
                  size={16}
                  color={active ? theme.primaryForeground : theme.foregroundSecondary}
                />
                <Text
                  className={`text-xs font-sans-bold ${
                    active ? 'text-primary-foreground' : 'text-foreground-secondary'
                  }`}
                >
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Field label="Title">
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Water supply maintenance"
            placeholderTextColor={theme.muted}
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans"
          />
        </Field>

        <Field label="Description">
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Details residents and guards need to know"
            placeholderTextColor={theme.muted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans min-h-[120px]"
          />
        </Field>

        <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-3">
          Expiry
        </Text>

        <Pressable
          onPress={toggleExpiry}
          className={`flex-row items-center justify-between rounded-xl px-4 py-3 mb-2 border ${
            hasExpiry ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'
          }`}
        >
          <View>
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
            <View>
              <Text className="text-[11px] font-sans text-muted">Expires on</Text>
              <Text className="text-sm font-sans-semibold text-foreground mt-0.5">
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
            onChange={handleDateChange}
          />
        ) : null}

        {error ? <Text className="text-sm font-sans text-danger mb-4 mt-2">{error}</Text> : null}

        <Pressable
          onPress={handleSubmit}
          disabled={createNotice.isPending}
          className="rounded-xl bg-primary px-4 py-4 items-center mt-4"
        >
          {createNotice.isPending ? (
            <ActivityIndicator size="small" color={theme.primaryForeground} />
          ) : (
            <Text className="text-sm font-sans-bold text-primary-foreground">Publish notice</Text>
          )}
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
        {label}
      </Text>
      {children}
    </View>
  );
}
