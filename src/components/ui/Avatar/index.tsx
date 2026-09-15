import { Image, View } from 'react-native';
import { Text } from '@/components/ui/Text';

export interface AvatarProps {
  uri?: string | null;
  fallbackLabel: string;
  size?: number;
}

export function Avatar({ uri, fallbackLabel, size = 40 }: AvatarProps) {
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={dimensionStyle}
        className="overflow-hidden"
        accessibilityLabel={fallbackLabel}
      />
    );
  }

  const initial = fallbackLabel.trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      style={dimensionStyle}
      className="items-center justify-center overflow-hidden rounded-full bg-accent"
      accessibilityLabel={fallbackLabel}
    >
      <Text variant="bodyStrong" color="textInverse">
        {initial}
      </Text>
    </View>
  );
}
