import { useState } from 'react';
import { View, Image } from 'react-native';
import { Icon, type IconName } from '@/components/ui/Icon';

export interface MarketVisualProps {
  imageUrl?: string | null;
  /** The fixed fallback icon shown when no image is present or it
   * fails to load. Deliberately never derived from the market's
   * category  category no longer signals anything visually on market
   * cards (by request  see docs/DECISIONS.md). */
  fallbackIcon: IconName;
  size?: number;
}

/**
 * A market's own image when available, with a graceful fallback to a
 * fixed icon on a tinted swatch  both when no image is present at
 * all, and when the image fails to load. Fixed square footprint either
 * way, so the fallback occupies the exact same slot a real image would
 * (no layout shift, no broken-image glyph). Shared by every market
 * card (`MarketAttachment`, `MarketCard`) and Market Detail's hero
 * see docs/DECISIONS.md.
 */
export function MarketVisual({ imageUrl, fallbackIcon, size = 40 }: MarketVisualProps) {
  const [failed, setFailed] = useState(false);
  const dimension = { width: size, height: size };

  if (imageUrl && !failed) {
    return (
      <Image
        source={{ uri: imageUrl }}
        onError={() => setFailed(true)}
        style={dimension}
        className="rounded-xl"
      />
    );
  }

  return (
    <View style={dimension} className="items-center justify-center rounded-xl bg-accent-muted">
      <Icon name={fallbackIcon} size={Math.round(size * 0.5)} color="accent" />
    </View>
  );
}
