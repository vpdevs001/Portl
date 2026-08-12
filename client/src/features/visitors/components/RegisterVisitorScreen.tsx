import { useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Field, Input } from '@/components/ui/Input';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Spinner } from '@/components/ui/Spinner';
import { useFlats } from '@/features/society/services/use-society';
import {
  useCreateVisitorRequest,
  useUploadVisitorPhoto
} from '@/features/visitors/hooks/use-visitors';
import { getErrorMessage } from '@/lib/errors';

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
  const theme = useTheme();

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
      setError(getErrorMessage(e));
    }
  }

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-4" contentContainerClassName="pb-16">
        <ScreenHeader title="Register visitor" showBack drawer />

        {/* Visitor type */}
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

        {/* Photo capture */}
        <SectionLabel className="mb-3">Photo</SectionLabel>
        <View className="flex-row items-center gap-3 mb-6">
          {photoUri ? (
            <Image source={{ uri: photoUri }} className="w-16 h-16 rounded-xl" />
          ) : (
            <View className="w-16 h-16 rounded-xl bg-surface border border-dashed border-border items-center justify-center">
              <Ionicons name="camera-outline" size={22} color={theme.muted} />
            </View>
          )}
          <Button
            label="Take photo"
            variant="secondary"
            size="sm"
            onPress={() => handlePickPhoto('camera')}
          />
          <Button
            label="Choose"
            variant="secondary"
            size="sm"
            onPress={() => handlePickPhoto('library')}
          />
          {uploadPhoto.isPending ? <Spinner /> : null}
        </View>

        {/* Core details */}
        <Field label="Name">
          <Input value={name} onChangeText={setName} placeholder="Visitor's full name" />
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
          <Input value={purpose} onChangeText={setPurpose} placeholder="e.g. Meeting, drop-off" />
        </Field>

        {visitorType !== 'cab' ? (
          <Field label="Vehicle number (optional)">
            <Input
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              placeholder="e.g. bike/scooter plate"
              autoCapitalize="characters"
            />
          </Field>
        ) : null}

        {/* Type-specific fields */}
        {visitorType === 'delivery' ? (
          <>
            <Field label="Company">
              <Input
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="Amazon, Swiggy, Zomato…"
              />
            </Field>
            <Field label="Order ID (optional)">
              <Input value={orderId} onChangeText={setOrderId} />
            </Field>
          </>
        ) : null}

        {visitorType === 'cab' ? (
          <>
            <Field label="Provider">
              <Input value={providerName} onChangeText={setProviderName} placeholder="Uber, Ola…" />
            </Field>
            <Field label="Cab plate number (optional)">
              <Input
                value={cabVehicleNumber}
                onChangeText={setCabVehicleNumber}
                autoCapitalize="characters"
              />
            </Field>
            <Field label="Driver name (optional)">
              <Input value={driverName} onChangeText={setDriverName} />
            </Field>
          </>
        ) : null}

        {visitorType === 'service_staff' ? (
          <>
            <Field label="Service type">
              <Input
                value={serviceType}
                onChangeText={setServiceType}
                placeholder="Plumber, electrician…"
              />
            </Field>
            <Field label="Company (optional)">
              <Input value={companyName} onChangeText={setCompanyName} />
            </Field>
          </>
        ) : null}

        {/* Flat picker — not needed for admin-routed visitors */}
        {!isAdminRouted ? (
          <View className="mb-4">
            <SectionLabel className="mb-2">Flat</SectionLabel>
            <Input
              value={flatQuery}
              onChangeText={setFlatQuery}
              placeholder="Search flat number"
              className="mb-2"
            />
            {isLoadingFlats ? (
              <Spinner />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2"
              >
                {filteredFlats.slice(0, 20).map((flat) => (
                  <Chip
                    key={flat.id}
                    label={flat.flatNumber}
                    selected={flatId === flat.id}
                    onPress={() => setFlatId(flat.id)}
                  />
                ))}
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

        {error ? <Text className="text-sm font-sans text-danger mb-4">{error}</Text> : null}

        <Button
          label="Send for approval"
          size="lg"
          loading={createRequest.isPending}
          onPress={handleSubmit}
          className="mt-2"
        />
      </ScrollView>
    </Screen>
  );
}
