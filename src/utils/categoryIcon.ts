import type { IconName } from '@/components/ui/Icon';

/**
 * Categories come from Polymarket's live taxonomy, not a closed enum
 * (see `types/common.ts`), so this is a best-effort lookup with a
 * generic fallback for anything unrecognized — not an exhaustive switch
 * that needs updating every time a new category shows up.
 */
const CATEGORY_ICON: Record<string, IconName> = {
  Crypto: 'logo-bitcoin',
  Politics: 'flag-outline',
  Sports: 'trophy-outline',
  'Pop Culture': 'film-outline',
  Business: 'briefcase-outline',
  Economics: 'stats-chart-outline',
  Technology: 'hardware-chip-outline',
  'World Events': 'earth-outline',
};

const FALLBACK_ICON: IconName = 'apps-outline';

export function getCategoryIcon(category: string): IconName {
  return CATEGORY_ICON[category] ?? FALLBACK_ICON;
}
