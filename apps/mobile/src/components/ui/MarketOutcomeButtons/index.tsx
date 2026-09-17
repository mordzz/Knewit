import { View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { formatProbability } from '@/utils/formatCurrency';
import { cn } from '@/utils/cn';

export interface MarketOutcomeButtonsProps {
  yesPrice: number;
  noPrice: number;
  /** Overrides "Yes"/"No" — e.g. "Up"/"Down" for a crypto price market.
   * Same underlying binary model either way. */
  labels?: { yes: string; no: string };
  onPress: () => void;
  className?: string;
}

/**
 * Two large solid buttons showing each outcome's label + live
 * percentage (e.g. "Yes 68%"), reusing `Button`'s existing `yes`/`no`
 * variants — the same accessible contrast choice used everywhere else
 * in the app, not re-decided here. Shared by `MarketCard` (Markets tab)
 * and `MarketAttachment` (Home feed/social post) so a binary market
 * without a position reads identically wherever it's shown — see
 * docs/DECISIONS.md.
 *
 * No buy/sell action: `onPress` is the same "open Market Detail"
 * handler the rest of the card uses, not a trade — these look
 * tappable-for-trading on purpose (matching the reference UX this is
 * modeled on) but Sprint 3 is discovery-only, see docs/PRD.md.
 */
export function MarketOutcomeButtons({
  yesPrice,
  noPrice,
  labels,
  onPress,
  className,
}: MarketOutcomeButtonsProps) {
  const { yes, no } = labels ?? { yes: 'Yes', no: 'No' };

  return (
    <View className={cn('flex-row gap-2', className)}>
      <Button
        variant="yes"
        label={`${yes} ${formatProbability(yesPrice)}`}
        onPress={onPress}
        className="flex-1"
      />
      <Button
        variant="no"
        label={`${no} ${formatProbability(noPrice)}`}
        onPress={onPress}
        className="flex-1"
      />
    </View>
  );
}
