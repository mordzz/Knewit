import { View } from 'react-native';
import { Button, type ButtonVariant } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import type { MarketChoice } from '@/types/market';

export interface MarketOutcomeButtonsProps {
  /** The market's own choices, in API order — label + live price each. */
  choices: MarketChoice[];
  onPress: () => void;
  className?: string;
}

function buttonVariant(choice: MarketChoice): ButtonVariant {
  return choice.index % 2 === 0 ? 'primary' : 'secondary';
}

/**
 * The market's choices, rendered with the same two treatments the app
 * already had for a binary pair: **two choices** keep the two large
 * solid buttons ("Yes 68%"), now labeled from the API's own outcome
 * names; **three or more** render as a compact stacked list in the
 * existing `rounded-xl bg-surface-elevated` panel. Tone follows
 * `choiceTone` (Yes/Up green, No/Down red, anything else accent/neutral
 * — never green/red). A choice only ever shows an image if the API
 * provides one for that choice itself — never the market's own image.
 *
 * No buy/sell action: `onPress` is the same "open Market Detail"
 * handler the rest of the card uses, not a trade.
 */
export function MarketOutcomeButtons({ choices, onPress, className }: MarketOutcomeButtonsProps) {
  if (choices.length === 0) return null;

  if (choices.length === 2) {
    return (
      <View className={cn('flex-row gap-2', className)}>
        {choices.map((choice) => (
          <Button
            key={choice.index}
            variant={buttonVariant(choice)}
            label={choice.label}
            onPress={onPress}
            className="flex-1"
          />
        ))}
      </View>
    );
  }

  return (
    <View className={cn('flex-row flex-wrap gap-2', className)}>
      {choices.map((choice) => (
        <Button key={choice.index} variant={buttonVariant(choice)} label={choice.label} onPress={onPress} className="min-w-[48%] flex-1" />
      ))}
    </View>
  );
}
