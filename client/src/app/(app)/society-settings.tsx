import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import {
  useSocietyDetails,
  useUpdateSocietyDetails
} from '@/features/society/services/use-society';

export default function SocietySettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

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
    } catch (e: any) {
      setError(e.message ?? 'Failed to update society details');
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 48 }}>
          {/* Header Bar */}
          <View className="flex-row items-center justify-between pb-4 mb-2 border-b border-border/60">
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border active:bg-surface"
            >
              <Ionicons name="arrow-back" size={16} color={theme.foreground} />
              <Text className="text-xs font-sans-semibold text-foreground">Back</Text>
            </Pressable>
            <Text className="text-base font-serif-bold text-foreground">Society Settings</Text>
            <DrawerButton />
          </View>

          {/* Hero */}
          <View className="mb-8 mt-2">
            <Text className="text-3xl font-serif-bold text-foreground mb-3">Society Details</Text>
            <Text className="text-sm font-sans text-foreground-secondary leading-5">
              Update your society&apos;s name and registered address. These details appear across
              notices, receipts, and member-facing screens.
            </Text>
          </View>

          {isLoading ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : (
            <View className="gap-5 mb-8">
              {error ? (
                <View className="p-2.5 bg-danger/10 border border-danger/20 rounded-lg">
                  <Text className="text-danger font-sans text-xs">{error}</Text>
                </View>
              ) : null}

              <View className="gap-2">
                <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase">
                  Society Name
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Green Meadows Society"
                  placeholderTextColor="#93a08d"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground font-sans text-sm"
                />
              </View>

              <View className="gap-2">
                <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase">
                  Address
                </Text>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Street / locality"
                  placeholderTextColor="#93a08d"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground font-sans text-sm"
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 gap-2">
                  <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase">
                    City
                  </Text>
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="City"
                    placeholderTextColor="#93a08d"
                    className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground font-sans text-sm"
                  />
                </View>
                <View className="flex-1 gap-2">
                  <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase">
                    State
                  </Text>
                  <TextInput
                    value={state}
                    onChangeText={setState}
                    placeholder="State"
                    placeholderTextColor="#93a08d"
                    className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground font-sans text-sm"
                  />
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase">
                  Pincode
                </Text>
                <TextInput
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="e.g. 226001"
                  placeholderTextColor="#93a08d"
                  keyboardType="number-pad"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground font-sans text-sm"
                />
              </View>

              {success ? (
                <View className="p-3.5 bg-success/15 border border-success/30 rounded-xl">
                  <Text className="text-success font-sans-semibold text-center text-xs">
                    Society details updated!
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleSave}
                disabled={updateSociety.isPending}
                className="w-full py-4 rounded-xl bg-primary active:opacity-90 items-center justify-center flex-row gap-2 mt-2"
              >
                {updateSociety.isPending ? (
                  <ActivityIndicator size="small" color={theme.primaryForeground} />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={18} color={theme.primaryForeground} />
                    <Text className="text-primary-foreground font-sans-bold text-base">
                      Save Changes
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {/* Pointer to Maintenance & Dues for UPI ID, so it isn't duplicated here */}
          <Pressable
            onPress={() => router.push('/(app)/admin/payments/review' as any)}
            className="p-4 bg-card border border-border rounded-xl flex-row items-center gap-3"
          >
            <View className="w-9 h-9 rounded-lg bg-primary/10 items-center justify-center">
              <Ionicons name="card-outline" size={18} color={theme.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-sans-semibold text-foreground">
                Looking for the UPI ID?
              </Text>
              <Text className="text-[11px] font-sans text-muted" numberOfLines={2}>
                That&apos;s managed from Maintenance &amp; Dues, not here.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={theme.muted} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
