import { Button, type ButtonVariant } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { MarketChoice } from '@/types/market';

export interface MarketOutcomeButtonsProps {
  /** The market's own choices, in API order  label + live price each. */
  choices: MarketChoice[];
  onPress: () => void;
  className?: string;
}

function buttonVariant(choice: MarketChoice): ButtonVariant {
  return choice.index % 2 === 0 ? 'primary' : 'secondary';
}

/**
 * Web equivalent of `apps/mobile/src/components/ui/MarketOutcomeButtons`
 *  two choices keep the two large solid buttons (labels from the API's
 * own outcome names), three or more render as a compact stacked list.
 * Tone follows `choiceTone` (Yes/Up green, No/Down red, anything else
 * accent/neutral  never green/red). A choice only ever shows an image
 * if the API provides one for that choice itself  never the market's
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
            label={choice.label}
            onClick={onPress}
            className="flex-1"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {choices.map((choice) => (
        <Button
          key={choice.index}
          variant={buttonVariant(choice)}
          label={choice.label}
          onClick={onPress}
          className="min-w-0"
        />
      ))}
    </div>
  );
}
