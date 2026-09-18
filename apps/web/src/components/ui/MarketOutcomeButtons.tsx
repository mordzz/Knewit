import { Button, type ButtonVariant } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { formatProbability } from '@/lib/formatters';
import { choiceTextColor, choiceTone } from '@/lib/choiceTone';
import { cn } from '@/lib/cn';
import type { MarketChoice } from '@/types/market';

export interface MarketOutcomeButtonsProps {
  /** The market's own choices, in API order — label + live price each. */
  choices: MarketChoice[];
  onPress: () => void;
  className?: string;
}

function buttonVariant(choice: MarketChoice): ButtonVariant {
  const tone = choiceTone(choice);
  if (tone === 'accent') return 'primary';
  if (tone === 'neutral') return 'secondary';
  return tone;
}

/**
 * Web equivalent of `apps/mobile/src/components/ui/MarketOutcomeButtons`
 * — two choices keep the two large solid buttons (labels from the API's
 * own outcome names), three or more render as a compact stacked list.
 * Tone follows `choiceTone` (Yes/Up green, No/Down red, anything else
 * accent/neutral — never green/red). A choice only ever shows an image
 * if the API provides one for that choice itself — never the market's
 * own image.
 */
export function MarketOutcomeButtons({ choices, onPress, className }: MarketOutcomeButtonsProps) {
  if (choices.length === 0) return null;

  if (choices.length === 2) {
    return (
      <div className={cn('flex gap-2', className)}>
        {choices.map((choice) => (
          <Button
            key={choice.index}
            variant={buttonVariant(choice)}
            label={`${choice.label} ${formatProbability(choice.price)}`}
            onClick={onPress}
            className="flex-1"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2 rounded-xl bg-surface-elevated p-2.5', className)}>
      {choices.map((choice) => (
        <div key={choice.index} className="flex items-center gap-2">
          {choice.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={choice.imageUrl} alt="" className="h-5 w-5 flex-shrink-0 rounded-full object-cover" />
          ) : null}
          <Text variant="caption" numberOfLines={1} className="flex-1">
            {choice.label}
          </Text>
          <Text variant="caption" color={choiceTextColor(choiceTone(choice))}>
            {formatProbability(choice.price)}
          </Text>
        </div>
      ))}
    </div>
  );
}
