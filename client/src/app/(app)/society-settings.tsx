import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { RoleGate } from '@/components/RoleGate';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { getErrorMessage } from '@/lib/errors';
import {
  useSocietyDetails,
  useUpdateSocietyDetails
} from '@/features/society/services/use-society';

export default function SocietySettingsRoute() {
  return (
    <RoleGate roles={['society_admin']}>
      <SocietySettingsScreen />
    </RoleGate>
  );
}

function SocietySettingsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const { data: society, isLoading } = useSocietyDetails();
  const updateSociety = useUpdateSocietyDetails();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Prefill once details load. Adjusting state directly during render (guarded
  // by the id so it only fires the one time the data actually arrives) is the
  // pattern React recommends over an effect here — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  const [prefilledSocietyId, setPrefilledSocietyId] = useState<string | null>(null);
  if (society && society.id !== prefilledSocietyId) {
    setPrefilledSocietyId(society.id);
    setName(society.name ?? '');
    setAddress(society.address ?? '');
    setCity(society.city ?? '');
    setState(society.state ?? '');
    setPincode(society.pincode ?? '');
  }

  const handleSave = async () => {
    if (!name.trim() || !address.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      setError('Please fill in every field before saving');
      return;
    }

    setError(null);
    setSuccess(false);

    try {
      await updateSociety.mutateAsync({
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim()
      });
      setSuccess(true);
      setTimeout(() => router.back(), 700);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 48 }}>
        <ScreenHeader title="Society Settings" showBack drawer />

        {/* Hero */}
        <View className="mb-6 mt-2">
          <Text className="text-2xl font-serif-bold text-foreground mb-2">Society Details</Text>
          <Text className="text-sm font-sans text-foreground-secondary leading-5">
            Update your society’s name and registered address. These details appear across notices,
            receipts, and member-facing screens.
          </Text>
        </View>

        {isLoading ? (
          <View className="py-16 items-center">
            <Spinner />
          </View>
        ) : (
          <View className="mb-8">
            {error ? (
              <View className="p-2.5 bg-danger/10 border border-danger/20 rounded-lg mb-4">
                <Text className="text-danger font-sans text-xs">{error}</Text>
              </View>
            ) : null}

            <Field label="Society Name">
              <Input value={name} onChangeText={setName} placeholder="e.g. Green Meadows Society" />
            </Field>

            <Field label="Address">
              <Input value={address} onChangeText={setAddress} placeholder="Street / locality" />
            </Field>

            <View className="flex-row gap-3">
              <Field label="City" className="flex-1">
                <Input value={city} onChangeText={setCity} placeholder="City" />
              </Field>
              <Field label="State" className="flex-1">
                <Input value={state} onChangeText={setState} placeholder="State" />
              </Field>
            </View>

            <Field label="Pincode">
              <Input
                value={pincode}
                onChangeText={setPincode}
                placeholder="e.g. 226001"
                keyboardType="number-pad"
              />
            </Field>

            {success ? (
              <View className="p-3.5 bg-success/15 border border-success/30 rounded-xl mb-4">
                <Text className="text-success font-sans-semibold text-center text-xs">
                  Society details updated!
                </Text>
              </View>
            ) : null}

            <Button
              label="Save Changes"
              icon="checkmark-done"
              size="lg"
              loading={updateSociety.isPending}
              onPress={handleSave}
              className="mt-2"
            />
          </View>
        )}

        {/* Pointer to Maintenance & Dues for UPI ID, so it isn't duplicated here */}
        <Pressable onPress={() => router.push('/(app)/admin/payments/review')}>
          <Card className="p-4 flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-lg bg-primary/10 items-center justify-center">
              <Ionicons name="card-outline" size={18} color={theme.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-sans-semibold text-foreground">
                Looking for the UPI ID?
              </Text>
              <Text className="text-[11px] font-sans text-muted" numberOfLines={2}>
                That’s managed from Maintenance & Dues, not here.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={theme.muted} />
          </Card>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
