'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { PositionPickerSheet } from '@/components/PositionPickerSheet';
import { useCreatePost } from '@/hooks/useCreatePost';
import { formatPrice, formatUsd } from '@/lib/formatters';
import type { UserPosition } from '@/types/social';

const MAX_POST_LENGTH = 280;

/**
 * Direct conversion of `apps/mobile`'s `CreateCallScreen` — a callout
 * always requires an attached market position (docs/DECISIONS.md,
 * "Callouts Require a Held Position"): Publish stays disabled until one
 * is selected from `PositionPickerSheet`. No dev-mock fallback on
 * publish (`useCreatePost` — "No Fake Publish Success").
 */
export default function CreateCallPage() {
  const router = useRouter();
  const { authenticated } = usePrivy();
  const [content, setContent] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<UserPosition | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const mutation = useCreatePost();

  const trimmed = content.trim();
  const isContentValid = trimmed.length > 0 && content.length <= MAX_POST_LENGTH;
  const hasPosition = selectedPosition !== null;
  const canPublish = isContentValid && authenticated && hasPosition && !mutation.isPending;

  function handlePublish() {
    if (!canPublish || !selectedPosition) return;
    mutation.mutate(
      { body: trimmed, positionId: selectedPosition.id },
      { onSuccess: () => router.push('/') }
    );
  }

  return (
    <main className="flex w-full flex-col gap-3 px-4 pb-8 pt-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.back()} aria-label="Cancel">
          <Icon name="close" size={24} />
        </button>
        <Button
          label={mutation.isPending ? 'Publishing...' : 'Publish Callout'}
          onClick={handlePublish}
          disabled={!canPublish}
          loading={mutation.isPending}
          className="min-h-0 px-5 py-2"
        />
      </div>

      {!authenticated ? (
        <Card contentClassName="gap-1">
          <Text variant="bodyStrong">Sign in to post</Text>
          <Text variant="caption" color="textSecondary">
            You need to be signed in to publish a Callout.
          </Text>
          <Button label="Connect Wallet" variant="secondary" onClick={() => router.push('/sign-in')} className="mt-2" />
        </Card>
      ) : null}

      <div className="flex gap-3">
        <Avatar uri={null} fallbackLabel="?" size={44} />
        <div className="flex-1">
          <Input
            placeholder="What's your call?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-24 border-0 bg-transparent px-0"
          />
          <Text variant="micro" color={content.length > MAX_POST_LENGTH ? 'danger' : 'textTertiary'} className="block text-right">
            {content.length}/{MAX_POST_LENGTH}
          </Text>
        </div>
      </div>

      {hasPosition && selectedPosition ? (
        <SelectedPositionCard position={selectedPosition} onChange={() => setPickerVisible(true)} onRemove={() => setSelectedPosition(null)} />
      ) : (
        <button type="button" onClick={() => setPickerVisible(true)} aria-label="Attach your market position" className="text-left">
          <GlassSurface tone="dark" blur={false} radius={16} contentClassName="flex items-center gap-3 p-3.5">
            <Icon name="trending-up-outline" color="accent" />
            <div className="flex-1">
              <Text variant="bodyStrong" className="block">
                Attach your position
              </Text>
              <Text variant="caption" color="textSecondary">
                Only a position you hold can become a Callout — pick one to continue.
              </Text>
            </div>
            <Icon name="chevron-forward" size={18} color="textTertiary" />
          </GlassSurface>
        </button>
      )}

      {mutation.isError ? (
        <Text variant="caption" color="danger">
          {friendlyPublishError(mutation.error?.message ?? null)}
        </Text>
      ) : null}

      <PositionPickerSheet visible={pickerVisible} onClose={() => setPickerVisible(false)} onSelect={setSelectedPosition} />
    </main>
  );
}

function SelectedPositionCard({
  position,
  onChange,
  onRemove,
}: {
  position: UserPosition;
  onChange: () => void;
  onRemove: () => void;
}) {
  const outcomeColor = position.outcome === 'YES' ? 'yes' : 'no';
  const costBasis = (position.entryPrice / 100) * position.size;

  return (
    <button type="button" onClick={onChange} aria-label="Change attached position" className="text-left">
      <GlassSurface tone="dark" blur={false} radius={16} contentClassName="flex flex-col gap-2 p-3.5">
        <div className="flex items-center justify-between">
          <Text variant="bodyStrong" color={outcomeColor}>
            {position.outcome}
          </Text>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remove attached position"
          >
            <Icon name="close" size={18} color="textTertiary" />
          </span>
        </div>
        <Text variant="body" numberOfLines={2}>
          {position.marketQuestion}
        </Text>
        <div className="flex gap-4">
          <Text variant="caption" color="textSecondary">
            Entry {formatPrice(position.entryPrice)}
          </Text>
          <Text variant="caption" color="textSecondary">
            Size {formatUsd(costBasis)}
          </Text>
        </div>
      </GlassSurface>
    </button>
  );
}

function friendlyPublishError(message: string | null): string {
  if (!message) return "Couldn't publish this right now. Please try again.";
  if (/network/i.test(message)) {
    return 'Network error — check your connection and try again.';
  }
  if (/position/i.test(message)) {
    return "We couldn't verify this position. Please try again.";
  }
  return "Couldn't publish this right now. Please try again.";
}
