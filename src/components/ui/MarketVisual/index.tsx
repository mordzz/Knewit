import { useState } from 'react';
import { View, Image } from 'react-native';
import { Icon, type IconName } from '@/components/ui/Icon';
import { getCategoryIcon } from '@/utils/categoryIcon';

export interface MarketVisualProps {
  imageUrl?: string | null;
  category: string;
  /** Overrides the default category-derived fallback icon with a fixed
   * one — for contexts that shouldn't visually signal category at all
   * (see `MarketCard`, which deliberately doesn't). `category` is still
   * required either way, since it's kept for callers that do want the
   * default category icon (e.g. `MarketAttachment`). */
  fallbackIcon?: IconName;
  size?: number;
}

/**
 * A market's own image when available, with a graceful fallback to a
 * category-derived icon on a tinted swatch — both when no image is
 * present at all, and when the image fails to load. Fixed square
 * footprint either way, so the fallback occupies the exact same slot a
 * real image would (no layout shift, no broken-image glyph). Shared by
 * every market card (`MarketAttachment`, `MarketCard`) — promoted here
 * once a second feature needed the identical logic, per this project's
 * "evidence before promoting to global" convention — see
 * docs/DECISIONS.md.
 */
export function MarketVisual({ imageUrl, category, fallbackIcon, size = 40 }: MarketVisualProps) {
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
      <Icon
        name={fallbackIcon ?? getCategoryIcon(category)}
        size={Math.round(size * 0.5)}
        color="accent"
      />
    </View>
  );
}
