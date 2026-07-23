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
import { useCreatePreApproval } from '@/features/visitors/hooks/use-visitors';

type VisitorType = 'guest' | 'delivery' | 'cab' | 'service_staff';

const VISITOR_TYPES: { value: VisitorType; label: string; icon: string }[] = [
  { value: 'guest', label: 'Guest', icon: 'person-outline' },
  { value: 'delivery', label: 'Delivery', icon: 'bicycle-outline' },
  { value: 'cab', label: 'Cab', icon: 'car-outline' },
  { value: 'service_staff', label: 'Service staff', icon: 'construct-outline' }
];

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

function formatDateTime(date: Date) {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function CreatePreApprovalScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [visitorType, setVisitorType] = useState<VisitorType>('guest');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [validFrom, setValidFrom] = useState(() => new Date());
  const [validUntil, setValidUntil] = useState(() => new Date(Date.now() + FOUR_HOURS_MS));
  const [activePicker, setActivePicker] = useState<'from' | 'until' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createPreApproval = useCreatePreApproval();

  function handlePickerChange(field: 'from' | 'until', selected?: Date) {
    // Android's dialog is modal and self-dismisses; iOS's inline spinner
    // stays open until the person taps the field again — closing it here
    // unconditionally would fight the iOS spinner mid-scroll.
    if (Platform.OS === 'android') {
      setActivePicker(null);
    }
    if (!selected) return;

    if (field === 'from') {
      setValidFrom(selected);
      if (selected >= validUntil) {
        setValidUntil(new Date(selected.getTime() + FOUR_HOURS_MS));
      }
    } else {
      setValidUntil(selected);
    }
  }

  async function handleSubmit() {
    setError(null);

    if (!name.trim()) {
      setError('Guest name is required');
      return;
    }
    if (validUntil <= validFrom) {
      setError('Valid until must be after valid from');
      return;
    }

    try {
      await createPreApproval.mutateAsync({
        name: name.trim(),
        phone: phone.trim() || undefined,
        purpose: purpose.trim() || undefined,
        visitorType,
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString()
      });

      router.replace('/(app)/pre-approvals');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create pre-approval');
    }
  }

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-4" contentContainerClassName="pb-16">
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Pre-approve visitor</Text>
          <DrawerButton />
        </View>

        <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-3">
          Visitor type
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6"
          contentContainerClassName="gap-2"
        >
          {VISITOR_TYPES.map((t) => {
            const active = visitorType === t.value;
            return (
              <Pressable
                key={t.value}
                onPress={() => setVisitorType(t.value)}
                className={`flex-row items-center gap-2 px-4 py-2.5 rounded-full border mr-2 ${
                  active ? 'bg-primary border-primary' : 'bg-card border-border'
                }`}
              >
                <Ionicons
                  name={t.icon as never}
                  size={16}
                  color={active ? theme.primaryForeground : theme.foregroundSecondary}
                />
                <Text
                  className={`text-xs font-sans-bold ${
                    active ? 'text-primary-foreground' : 'text-foreground-secondary'
                  }`}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Field label="Guest name">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Who's coming?"
            placeholderTextColor={theme.muted}
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans"
          />
        </Field>

        <Field label="Phone (optional)">
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="10-digit mobile number"
            placeholderTextColor={theme.muted}
            keyboardType="phone-pad"
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans"
          />
        </Field>

        <Field label="Purpose (optional)">
          <TextInput
            value={purpose}
            onChangeText={setPurpose}
            placeholder="e.g. Housewarming, weekend visit"
            placeholderTextColor={theme.muted}
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans"
          />
        </Field>

        <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-3">
          Validity window
        </Text>

        <Pressable
          onPress={() => setActivePicker(activePicker === 'from' ? null : 'from')}
          className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 mb-2"
        >
          <View>
            <Text className="text-[11px] font-sans text-muted">Valid from</Text>
            <Text className="text-sm font-sans-semibold text-foreground mt-0.5">
              {formatDateTime(validFrom)}
            </Text>
          </View>
          <Ionicons name="calendar-outline" size={18} color={theme.primary} />
        </Pressable>
        {activePicker === 'from' ? (
          <DateTimePicker
            value={validFrom}
            mode="datetime"
            minimumDate={new Date()}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_event, selected) => handlePickerChange('from', selected)}
          />
        ) : null}

        <Pressable
          onPress={() => setActivePicker(activePicker === 'until' ? null : 'until')}
          className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 mb-4"
        >
          <View>
            <Text className="text-[11px] font-sans text-muted">Valid until</Text>
            <Text className="text-sm font-sans-semibold text-foreground mt-0.5">
              {formatDateTime(validUntil)}
            </Text>
          </View>
          <Ionicons name="calendar-outline" size={18} color={theme.primary} />
        </Pressable>
        {activePicker === 'until' ? (
          <DateTimePicker
            value={validUntil}
            mode="datetime"
            minimumDate={validFrom}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_event, selected) => handlePickerChange('until', selected)}
          />
        ) : null}

        {error ? <Text className="text-sm font-sans text-danger mb-4">{error}</Text> : null}

        <Pressable
          onPress={handleSubmit}
          disabled={createPreApproval.isPending}
          className="rounded-xl bg-primary px-4 py-4 items-center mt-2"
        >
          {createPreApproval.isPending ? (
            <ActivityIndicator size="small" color={theme.primaryForeground} />
          ) : (
            <Text className="text-sm font-sans-bold text-primary-foreground">Generate pass</Text>
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
