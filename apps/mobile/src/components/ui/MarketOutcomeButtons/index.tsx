import { Image, View } from 'react-native';
import { Button, type ButtonVariant } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { formatProbability } from '@/utils/formatCurrency';
import { choiceTextColor, choiceTone } from '@/utils/choiceTone';
import { cn } from '@/utils/cn';
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
            label={`${choice.label} ${formatProbability(choice.price)}`}
            onPress={onPress}
            className="flex-1"
          />
        ))}
      </View>
    );
  }

  return (
    <View className={cn('gap-2 rounded-xl bg-surface-elevated p-2.5', className)}>
      {choices.map((choice) => (
        <View key={choice.index} className="flex-row items-center gap-2">
          {choice.imageUrl ? (
            <Image source={{ uri: choice.imageUrl }} className="h-5 w-5 rounded-full" />
          ) : null}
          <Text variant="caption" numberOfLines={1} className="flex-1">
            {choice.label}
          </Text>
          <Text variant="caption" color={choiceTextColor(choiceTone(choice))}>
            {formatProbability(choice.price)}
          </Text>
        </View>
      ))}
    </View>
  );
}
