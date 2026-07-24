import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import { useUploadVisitorPhoto } from '@/features/visitors/hooks/use-visitors';
import { useCreateComplaint } from '@/features/complaints/hooks/use-complaints';
import type { ComplaintCategory } from '@/features/complaints/services/complaints';

const CATEGORIES: { value: ComplaintCategory; label: string; icon: string }[] = [
  { value: 'plumbing', label: 'Plumbing', icon: 'water-outline' },
  { value: 'electrical', label: 'Electrical', icon: 'flash-outline' },
  { value: 'security', label: 'Security', icon: 'shield-outline' },
  { value: 'cleanliness', label: 'Cleanliness', icon: 'sparkles-outline' },
  { value: 'general', label: 'General', icon: 'build-outline' }
];

export default function CreateComplaintScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [category, setCategory] = useState<ComplaintCategory>('general');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = useUploadVisitorPhoto();
  const createComplaint = useCreateComplaint();

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
          fileName: `complaint-${Date.now()}.jpg`,
          contentType: 'image/jpeg',
          base64: asset.base64
        });
        setUploadedPhotoUrl(uploaded.url);
      } catch {
        // Non-fatal — the resident can still submit the complaint without a
        // photo attached if the upload fails.
      }
    }
  }

  function removePhoto() {
    setPhotoUri(null);
    setUploadedPhotoUrl(undefined);
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

    try {
      await createComplaint.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category,
        photoUrl: uploadedPhotoUrl
      });

      router.replace('/(app)/complaints');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit complaint');
    }
  }

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-4" contentContainerClassName="pb-16">
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Log a complaint</Text>
          <DrawerButton />
        </View>

        <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-3">
          Category
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => {
            const active = category === c.value;
            return (
              <Pressable
                key={c.value}
                onPress={() => setCategory(c.value)}
                className={`flex-row items-center gap-2 px-4 py-2.5 rounded-full border ${
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
        </View>

        <Field label="Title">
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Kitchen tap leaking"
            placeholderTextColor={theme.muted}
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans"
          />
        </Field>

        <Field label="Description">
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue in detail"
            placeholderTextColor={theme.muted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans min-h-[120px]"
          />
        </Field>

        <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-3">
          Photo (optional)
        </Text>
        <View className="flex-row items-center gap-3 mb-6">
          {photoUri ? (
            <View className="relative">
              <Image source={{ uri: photoUri }} className="w-16 h-16 rounded-xl" />
              <Pressable
                onPress={removePhoto}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-danger items-center justify-center"
              >
                <Ionicons name="close" size={12} color="#fff" />
              </Pressable>
            </View>
          ) : null}
          <Pressable
            onPress={() => handlePickPhoto('camera')}
            className="flex-row items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5"
          >
            <Ionicons name="camera-outline" size={16} color={theme.foreground} />
            <Text className="text-xs font-sans-bold text-foreground">Take photo</Text>
          </Pressable>
          <Pressable
            onPress={() => handlePickPhoto('library')}
            className="flex-row items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5"
          >
            <Ionicons name="image-outline" size={16} color={theme.foreground} />
            <Text className="text-xs font-sans-bold text-foreground">Choose photo</Text>
          </Pressable>
          {uploadPhoto.isPending ? <ActivityIndicator size="small" color={theme.primary} /> : null}
        </View>

        {error ? <Text className="text-sm font-sans text-danger mb-4 mt-2">{error}</Text> : null}

        <Pressable
          onPress={handleSubmit}
          disabled={createComplaint.isPending}
          className="rounded-xl bg-primary px-4 py-4 items-center mt-4"
        >
          {createComplaint.isPending ? (
            <ActivityIndicator size="small" color={theme.primaryForeground} />
          ) : (
            <Text className="text-sm font-sans-bold text-primary-foreground">Submit complaint</Text>
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
