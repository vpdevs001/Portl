import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
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
  const theme = useTheme();

  const [visitorType, setVisitorType] = useState<VisitorType>('guest');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [validFrom, setValidFrom] = useState(() => new Date());
  const [validUntil, setValidUntil] = useState(() => new Date(Date.now() + FOUR_HOURS_MS));
  const [activePicker, setActivePicker] = useState<'from' | 'until' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createPreApproval = useCreatePreApproval();

  function handlePickerChange(field: 'from' | 'until', selected: Date) {
    // Android's dialog is modal and self-dismisses; iOS's inline spinner
    // stays open until the person taps the field again — closing it here
    // unconditionally would fight the iOS spinner mid-scroll.
    if (Platform.OS === 'android') {
      setActivePicker(null);
    }

    if (field === 'from') {
      setValidFrom(selected);
      if (selected >= validUntil) {
        setValidUntil(new Date(selected.getTime() + FOUR_HOURS_MS));
      }
    } else {
      setValidUntil(selected);
    }
  }

  function handlePickerDismiss() {
    if (Platform.OS === 'android') {
      setActivePicker(null);
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
      setError(getErrorMessage(e));
    }
  }

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-4" contentContainerClassName="pb-16">
        <ScreenHeader title="Pre-approve visitor" showBack drawer />

        <SectionLabel className="mb-3">Visitor type</SectionLabel>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {VISITOR_TYPES.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              icon={t.icon}
              selected={visitorType === t.value}
              onPress={() => setVisitorType(t.value)}
            />
          ))}
        </View>

        <Field label="Guest name">
          <Input value={name} onChangeText={setName} placeholder="Who's coming?" />
        </Field>

        <Field label="Phone (optional)">
          <Input
            value={phone}
            onChangeText={setPhone}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
          />
        </Field>

        <Field label="Purpose (optional)">
          <Input
            value={purpose}
            onChangeText={setPurpose}
            placeholder="e.g. Housewarming, weekend visit"
          />
        </Field>

        <SectionLabel className="mb-3">Validity window</SectionLabel>

        <Pressable
          onPress={() => setActivePicker(activePicker === 'from' ? null : 'from')}
          className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 mb-2"
        >
          <View className="flex-1 pr-3">
            <Text className="text-[11px] font-sans text-muted">Valid from</Text>
            <Text className="text-sm font-sans-semibold text-foreground mt-0.5" numberOfLines={1}>
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
            onValueChange={(_event, selected) => handlePickerChange('from', selected)}
            onDismiss={handlePickerDismiss}
          />
        ) : null}

        <Pressable
          onPress={() => setActivePicker(activePicker === 'until' ? null : 'until')}
          className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 mb-4"
        >
          <View className="flex-1 pr-3">
            <Text className="text-[11px] font-sans text-muted">Valid until</Text>
            <Text className="text-sm font-sans-semibold text-foreground mt-0.5" numberOfLines={1}>
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
            onValueChange={(_event, selected) => handlePickerChange('until', selected)}
            onDismiss={handlePickerDismiss}
          />
        ) : null}

        {error ? <Text className="text-sm font-sans text-danger mb-4">{error}</Text> : null}

        <Button
          label="Generate pass"
          size="lg"
          loading={createPreApproval.isPending}
          onPress={handleSubmit}
          className="mt-2"
        />
      </ScrollView>
    </Screen>
  );
}
