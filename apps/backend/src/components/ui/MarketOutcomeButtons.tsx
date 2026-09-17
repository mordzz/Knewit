import { Button } from '@/components/ui/Button';
import { formatProbability } from '@/lib/formatters';
import { cn } from '@/lib/cn';

export interface MarketOutcomeButtonsProps {
  yesPrice: number;
  noPrice: number;
  labels?: { yes: string; no: string };
  onPress: () => void;
  className?: string;
}

/**
 * Web equivalent of `apps/mobile/src/components/ui/MarketOutcomeButtons`
 * — two large solid buttons showing each outcome's label + live
 * percentage, shared by `MarketCard` and `MarketAttachment` so a binary
 * market without a position reads identically wherever it's shown.
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
    <div className={cn('flex gap-2', className)}>
      <Button variant="yes" label={`${yes} ${formatProbability(yesPrice)}`} onClick={onPress} className="flex-1" />
      <Button variant="no" label={`${no} ${formatProbability(noPrice)}`} onClick={onPress} className="flex-1" />
    </div>
  );
}
