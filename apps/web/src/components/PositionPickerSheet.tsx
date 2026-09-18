'use client';

import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { choiceTextColor, choiceTone } from '@/lib/choiceTone';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { usePositions } from '@/hooks/usePositions';
import { useSession } from '@/hooks/useSession';
import { formatPrice, formatUsd } from '@/lib/formatters';
import type { UserPosition } from '@/types/social';

export interface PositionPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (position: UserPosition) => void;
}

/**
 * Direct conversion of `apps/mobile`'s `PositionPickerSheet` — lists
 * the user's real positions so a Call's snapshot always starts from
 * something the user actually holds. Also the ownership gate: only
 * someone who has actually bought (holds >=1 position) can publish a
 * Call, enforced by the composer's Publish button staying disabled
 * until one is picked here.
 */
export function PositionPickerSheet({ visible, onClose, onSelect }: PositionPickerSheetProps) {
  const router = useRouter();
  const { walletConnected: isConnected } = useSession();
  const positions = usePositions();

  if (!isConnected) {
    return (
      <BottomSheet visible={visible} onClose={onClose}>
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <Icon name="wallet-outline" size={32} color="textTertiary" />
          <Text variant="bodyStrong">Connect your wallet before creating a verified Call.</Text>
          <Button
            label="Connect Wallet"
            onClick={() => {
              onClose();
              router.push('/wallet');
            }}
            className="mt-2 w-full"
          />
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text variant="heading" className="mb-3 block">
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
            router.push('/markets');
          }}
        />
      ) : null}

      {positions.status === 'success' && positions.data.length > 0 ? (
        <div className="flex flex-col gap-2">
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
        </div>
      ) : null}
    </BottomSheet>
  );
}

function PositionRow({ position, onPress }: { position: UserPosition; onPress: () => void }) {
  const outcomeColor = choiceTextColor(choiceTone({ index: position.choiceIndex, label: position.outcome }));
  const costBasis = (position.entryPrice / 100) * position.size;

  return (
    <button
      type="button"
      onClick={onPress}
      className="flex flex-col gap-1 rounded-xl border border-border bg-surface-elevated p-3 text-left hover:opacity-90"
    >
      <div className="flex items-center justify-between">
        <Text variant="bodyStrong" color={outcomeColor}>
          {position.outcome}
        </Text>
        <Icon name="chevron-forward" size={16} color="textTertiary" />
      </div>
      <Text variant="body" numberOfLines={2}>
        {position.marketQuestion}
      </Text>
      <div className="flex gap-4">
        <Text variant="caption" color="textSecondary">
          Entry {formatPrice(position.entryPrice)}
        </Text>
        <Text variant="caption" color="textSecondary">
          Current {position.currentPrice != null ? formatPrice(position.currentPrice) : 'unavailable'}
        </Text>
        <Text variant="caption" color="textSecondary">
          Size {formatUsd(costBasis)}
        </Text>
      </div>
    </button>
  );
}
