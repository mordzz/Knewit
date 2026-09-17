import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { usePositions } from '@/features/portfolio/hooks/usePositions';
import { useWallet } from '@/hooks/useWallet';
import { formatPrice, formatUsd } from '@/utils/formatCurrency';
import { choiceTextColor, choiceTone } from '@/utils/choiceTone';
import type { UserPosition } from '@/types/social';

export interface PositionPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (position: UserPosition) => void;
}

/**
 * "Attach Position" — lists the user's real positions (Sprint 7's
 * `usePositions`, unchanged here) so a Call's snapshot always starts
 * from something the user actually holds client-side too. This sheet is
 * also the ownership gate: only someone who has actually bought (holds
 * ≥1 position) can publish a Call — the composer's publish button stays
 * disabled until a position is picked, and this sheet's honest "No
 * positions yet" state (with a shortcut to the Markets tab) is what a
 * non-holder sees instead of a picker. The backend still independently
 * re-verifies ownership and re-fetches the position itself before
 * writing the snapshot — this list is for selection UX only, never
 * trusted as the snapshot's source of truth — see docs/DECISIONS.md.
 */
export function PositionPickerSheet({ visible, onClose, onSelect }: PositionPickerSheetProps) {
  const navigation = useNavigation();
  const { isConnected } = useWallet();
  const positions = usePositions();

  if (!isConnected) {
    return (
      <BottomSheet visible={visible} onClose={onClose}>
        <View className="items-center gap-2 py-2">
          <Icon name="wallet-outline" size={32} color="textTertiary" />
          <Text variant="bodyStrong" className="text-center">
            Connect your wallet before creating a verified Call.
          </Text>
          <Button
            label="Connect Wallet"
            onPress={() => {
              onClose();
              navigation.navigate('Auth');
            }}
            className="mt-2 w-full"
          />
        </View>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text variant="heading" className="mb-3">
        My Positions
      </Text>

      {positions.status === 'pending' ? <LoadingState rows={3} /> : null}

      {positions.status === 'error' ? (
        <ErrorState message="Couldn't load your positions." onRetry={() => positions.refetch()} />
      ) : null}

      {positions.status === 'success' && positions.data.length === 0 ? (
        <EmptyState
          icon="trending-up-outline"
          title="No positions yet"
          message="Trade a market first, then share your position with the community."
          actionLabel="Explore Markets"
          onAction={() => {
            onClose();
            navigation.navigate('Main', { screen: 'MarketsTab' });
          }}
        />
      ) : null}

      {positions.status === 'success' && positions.data.length > 0 ? (
        <View className="gap-2">
          {positions.data.map((position) => (
            <PositionRow
              key={position.id}
              position={position}
              onPress={() => {
                onSelect(position);
                onClose();
              }}
            />
          ))}
        </View>
      ) : null}
    </BottomSheet>
  );
}

function PositionRow({ position, onPress }: { position: UserPosition; onPress: () => void }) {
  const outcomeColor = choiceTextColor(choiceTone({ index: position.choiceIndex, label: position.outcome }));
  const costBasis = (position.entryPrice / 100) * position.size;

  return (
    <Pressable
      onPress={onPress}
      className="gap-1 rounded-xl border border-border bg-surface-elevated p-3 active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={`${position.outcome} position in ${position.marketQuestion}, entry ${formatPrice(position.entryPrice)}, size ${formatUsd(costBasis)}`}
    >
      <View className="flex-row items-center justify-between">
        <Text variant="bodyStrong" color={outcomeColor}>
          {position.outcome}
        </Text>
        <Icon name="chevron-forward" size={16} color="textTertiary" />
      </View>
      <Text variant="body" numberOfLines={2}>
        {position.marketQuestion}
      </Text>
      <View className="flex-row gap-4">
        <Text variant="caption" color="textSecondary">
          Entry {formatPrice(position.entryPrice)}
        </Text>
        <Text variant="caption" color="textSecondary">
          Current{' '}
          {position.currentPrice != null ? formatPrice(position.currentPrice) : 'unavailable'}
        </Text>
        <Text variant="caption" color="textSecondary">
          Size {formatUsd(costBasis)}
        </Text>
      </View>
    </Pressable>
  );
}
