import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { Screen } from '@/components/Screen';
import { useFlats } from '@/features/society/services/use-society';
import {
  useCreateVisitorRequest,
  useUploadVisitorPhoto
} from '@/features/visitors/hooks/use-visitors';

type VisitorType = 'guest' | 'delivery' | 'cab' | 'service_staff' | 'admin_visitor';

const VISITOR_TYPES: { value: VisitorType; label: string; icon: string }[] = [
  { value: 'guest', label: 'Guest', icon: 'person-outline' },
  { value: 'delivery', label: 'Delivery', icon: 'bicycle-outline' },
  { value: 'cab', label: 'Cab', icon: 'car-outline' },
  { value: 'service_staff', label: 'Service staff', icon: 'construct-outline' },
  { value: 'admin_visitor', label: 'Admin visitor', icon: 'business-outline' }
];

export function RegisterVisitorScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [visitorType, setVisitorType] = useState<VisitorType>('guest');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [flatId, setFlatId] = useState<string | null>(null);
  const [flatQuery, setFlatQuery] = useState('');

  // Type-specific fields
  const [companyName, setCompanyName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [providerName, setProviderName] = useState('');
  const [cabVehicleNumber, setCabVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [serviceType, setServiceType] = useState('');

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const { data: flats, isLoading: isLoadingFlats } = useFlats();
  const uploadPhoto = useUploadVisitorPhoto();
  const createRequest = useCreateVisitorRequest();

  // admin_visitor always routes to the admin, never a specific flat.
  const isAdminRouted = visitorType === 'admin_visitor';
  const filteredFlats = (flats ?? []).filter((f) =>
    flatQuery.trim() ? f.flatNumber.toLowerCase().includes(flatQuery.trim().toLowerCase()) : true
  );

  async function handlePickPhoto(source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Portl needs access to take or choose a photo.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, base64: true });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setPhotoUri(asset.uri);

    if (asset.base64) {
      try {
        const uploaded = await uploadPhoto.mutateAsync({
          fileName: `visitor-${Date.now()}.jpg`,
          contentType: 'image/jpeg',
          base64: asset.base64
        });
        setUploadedPhotoUrl(uploaded.url);
      } catch {
        // Non-fatal — the guard can still register the visitor without a
        // photo attached if the upload fails.
      }
    }
  }

  function resetForm() {
    setName('');
    setPhone('');
    setPurpose('');
    setVehicleNumber('');
    setFlatId(null);
    setFlatQuery('');
    setCompanyName('');
    setOrderId('');
    setProviderName('');
    setCabVehicleNumber('');
    setDriverName('');
    setServiceType('');
    setPhotoUri(null);
    setUploadedPhotoUrl(undefined);
  }

  async function handleSubmit() {
    setError(null);

    if (!name.trim()) {
      setError('Visitor name is required');
      return;
    }
    if (!isAdminRouted && !flatId) {
      setError('Select the flat this visitor is here for');
      return;
    }

    const details =
      visitorType === 'delivery'
        ? { companyName: companyName || 'Unknown', orderId: orderId || undefined }
        : visitorType === 'cab'
          ? {
              providerName: providerName || 'Unknown',
              vehicleNumber: cabVehicleNumber || undefined,
              driverName: driverName || undefined
            }
          : visitorType === 'service_staff'
            ? { serviceType: serviceType || 'Service', companyName: companyName || undefined }
            : undefined;

    try {
      await createRequest.mutateAsync({
        visitorType,
        name: name.trim(),
        phone: phone.trim() || undefined,
        purpose: purpose.trim() || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        flatId: isAdminRouted ? undefined : (flatId ?? undefined),
        approverType: isAdminRouted ? 'admin' : 'resident',
        source: 'guard_request',
        photo: uploadedPhotoUrl,
        details
      });

      resetForm();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to register visitor');
    }
  }

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-4" contentContainerClassName="pb-16">
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Register visitor</Text>
          <View className="w-6" />
        </View>

        {/* Visitor type */}
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

        {/* Photo capture */}
        <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-3">
          Photo
        </Text>
        <View className="flex-row items-center gap-3 mb-6">
          {photoUri ? (
            <Image source={{ uri: photoUri }} className="w-16 h-16 rounded-xl" />
          ) : (
            <View className="w-16 h-16 rounded-xl bg-surface border border-dashed border-border items-center justify-center">
              <Ionicons name="camera-outline" size={22} color={theme.muted} />
            </View>
          )}
          <Pressable
            onPress={() => handlePickPhoto('camera')}
            className="rounded-xl border border-border px-3 py-2.5"
          >
            <Text className="text-xs font-sans-bold text-foreground">Take photo</Text>
          </Pressable>
          <Pressable
            onPress={() => handlePickPhoto('library')}
            className="rounded-xl border border-border px-3 py-2.5"
          >
            <Text className="text-xs font-sans-bold text-foreground">Choose photo</Text>
          </Pressable>
          {uploadPhoto.isPending ? <ActivityIndicator size="small" color={theme.primary} /> : null}
        </View>

        {/* Core details */}
        <Field label="Name">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Visitor's full name"
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
            placeholder="e.g. Meeting, drop-off"
            placeholderTextColor={theme.muted}
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans"
          />
        </Field>

        {visitorType !== 'cab' ? (
          <Field label="Vehicle number (optional)">
            <TextInput
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              placeholder="e.g. bike/scooter plate"
              placeholderTextColor={theme.muted}
              autoCapitalize="characters"
              className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans"
            />
          </Field>
        ) : null}

        {/* Type-specific fields */}
        {visitorType === 'delivery' ? (
          <>
            <Field label="Company">
              <TextInput
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="Amazon, Swiggy, Zomato…"
                placeholderTextColor={theme.muted}
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans"
              />
            </Field>
            <Field label="Order ID (optional)">
              <TextInput
                value={orderId}
                onChangeText={setOrderId}
                placeholderTextColor={theme.muted}
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans"
              />
            </Field>
          </>
        ) : null}

        {visitorType === 'cab' ? (
          <>
            <Field label="Provider">
              <TextInput
                value={providerName}
                onChangeText={setProviderName}
                placeholder="Uber, Ola…"
                placeholderTextColor={theme.muted}
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans"
              />
            </Field>
            <Field label="Cab plate number (optional)">
              <TextInput
                value={cabVehicleNumber}
                onChangeText={setCabVehicleNumber}
                autoCapitalize="characters"
                placeholderTextColor={theme.muted}
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans"
              />
            </Field>
            <Field label="Driver name (optional)">
              <TextInput
                value={driverName}
                onChangeText={setDriverName}
                placeholderTextColor={theme.muted}
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans"
              />
            </Field>
          </>
        ) : null}

        {visitorType === 'service_staff' ? (
          <>
            <Field label="Service type">
              <TextInput
                value={serviceType}
                onChangeText={setServiceType}
                placeholder="Plumber, electrician…"
                placeholderTextColor={theme.muted}
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans"
              />
            </Field>
            <Field label="Company (optional)">
              <TextInput
                value={companyName}
                onChangeText={setCompanyName}
                placeholderTextColor={theme.muted}
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans"
              />
            </Field>
          </>
        ) : null}

        {/* Flat picker — not needed for admin-routed visitors */}
        {!isAdminRouted ? (
          <View className="mb-4">
            <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
              Flat
            </Text>
            <TextInput
              value={flatQuery}
              onChangeText={setFlatQuery}
              placeholder="Search flat number"
              placeholderTextColor={theme.muted}
              className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans mb-2"
            />
            {isLoadingFlats ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2"
              >
                {filteredFlats.slice(0, 20).map((flat) => {
                  const active = flatId === flat.id;
                  return (
                    <Pressable
                      key={flat.id}
                      onPress={() => setFlatId(flat.id)}
                      className={`px-4 py-2.5 rounded-lg border mr-2 ${
                        active ? 'bg-primary border-primary' : 'bg-card border-border'
                      }`}
                    >
                      <Text
                        className={`text-xs font-sans-bold ${
                          active ? 'text-primary-foreground' : 'text-foreground'
                        }`}
                      >
                        {flat.flatNumber}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        ) : (
          <View className="mb-4 rounded-xl bg-primary/5 border border-primary/20 p-3">
            <Text className="text-xs font-sans text-foreground-secondary">
              This visitor routes directly to the admin — no flat needed.
            </Text>
          </View>
        )}

        {error ? (
          <Text className="text-sm font-sans text-danger mb-4">{error}</Text>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={createRequest.isPending}
          className="rounded-xl bg-primary px-4 py-4 items-center mt-2"
        >
          {createRequest.isPending ? (
            <ActivityIndicator size="small" color={theme.primaryForeground} />
          ) : (
            <Text className="text-sm font-sans-bold text-primary-foreground">Send for approval</Text>
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
