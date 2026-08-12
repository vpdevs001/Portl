import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Spinner } from '@/components/ui/Spinner';
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
  const theme = useTheme();

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
        <ScreenHeader title="Log a complaint" showBack drawer />

        <SectionLabel className="mb-3">Category</SectionLabel>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => {
            const active = category === c.value;
            return (
              <Pressable
                key={c.value}
                onPress={() => setCategory(c.value)}
                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-lg border ${
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
          <Input value={title} onChangeText={setTitle} placeholder="e.g. Kitchen tap leaking" />
        </Field>

        <Field label="Description">
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue in detail"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            className="min-h-[120px]"
          />
        </Field>

        <SectionLabel className="mb-3">Photo (optional)</SectionLabel>
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
          <Button
            label="Take photo"
            icon="camera-outline"
            variant="secondary"
            size="sm"
            onPress={() => handlePickPhoto('camera')}
          />
          <Button
            label="Choose"
            icon="image-outline"
            variant="secondary"
            size="sm"
            onPress={() => handlePickPhoto('library')}
          />
          {uploadPhoto.isPending ? <Spinner /> : null}
        </View>

        {error ? <Text className="text-sm font-sans text-danger mb-4 mt-2">{error}</Text> : null}

        <Button
          label="Submit complaint"
          size="lg"
          loading={createComplaint.isPending}
          onPress={handleSubmit}
          className="mt-2"
        />
      </ScrollView>
    </Screen>
  );
}
