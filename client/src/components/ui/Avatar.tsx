import { Text, View } from 'react-native';
import { Image } from 'expo-image';

type AvatarProps = {
  name?: string | null;
  image?: string | null;
  /** Diameter in pixels — 44 default. */
  size?: number;
  className?: string;
};

/** Round avatar — Google profile photo when present, serif initial otherwise. */
export function Avatar({ name, image, size = 44, className }: AvatarProps) {
  const initial = (name ?? 'U').charAt(0).toUpperCase();
  const innerClass = 'w-full h-full items-center justify-center bg-primary/10';

  return (
    <View
      className={`rounded-full overflow-hidden bg-surface border border-border/60 ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      {image ? (
        <Image source={{ uri: image }} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <View className={innerClass}>
          <Text className="text-primary font-serif-bold" style={{ fontSize: size * 0.4 }}>
            {initial}
          </Text>
        </View>
      )}
    </View>
  );
}
