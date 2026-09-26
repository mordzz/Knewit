import { Text } from '@/components/ui/Text';

export interface AvatarProps {
  uri?: string | null;
  fallbackLabel: string;
  size?: number;
}

/** Web equivalent of `apps/mobile/src/components/ui/Avatar`. */
export function Avatar({ uri, fallbackLabel, size = 40 }: AvatarProps) {
  const dimensionStyle = { width: size, height: size };

  if (uri) {
    return (
      // Arbitrary external avatar host  not worth a next.config
      // remotePatterns entry for a URL this backend doesn't control.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={uri}
        alt={fallbackLabel}
        style={dimensionStyle}
        className="overflow-hidden rounded-full object-cover"
      />
    );
  }

  const initial = fallbackLabel.trim().charAt(0).toUpperCase() || '?';

  return (
    <div
      style={dimensionStyle}
      className="flex items-center justify-center overflow-hidden rounded-full bg-accent"
      aria-label={fallbackLabel}
    >
      <Text variant="bodyStrong" color="textInverse">
        {initial}
      </Text>
    </div>
  );
}
