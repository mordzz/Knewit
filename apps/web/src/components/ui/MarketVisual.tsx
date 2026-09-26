'use client';

import { useState } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';

export interface MarketVisualProps {
  imageUrl?: string | null;
  fallbackIcon: IconName;
  size?: number;
}

/**
 * Web equivalent of `apps/mobile/src/components/ui/MarketVisual`  a
 * market's own image when available, graceful fallback to a fixed icon
 * on a tinted swatch otherwise (no image, or the image failed to load).
 */
export function MarketVisual({ imageUrl, fallbackIcon, size = 40 }: MarketVisualProps) {
  const [failed, setFailed] = useState(false);
  const dimension = { width: size, height: size };

  if (imageUrl && !failed) {
    return (
      // Arbitrary external market image host  not worth a next.config
      // remotePatterns entry for URLs this backend doesn't control.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        onError={() => setFailed(true)}
        style={dimension}
        className="flex-shrink-0 rounded-xl object-cover"
      />
    );
  }

  return (
    <div
      style={dimension}
      className="flex flex-shrink-0 items-center justify-center rounded-xl bg-accent-muted"
    >
      <Icon name={fallbackIcon} size={Math.round(size * 0.5)} color="accent" />
    </div>
  );
}
