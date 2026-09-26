'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { CARD_SURFACE_CLASS } from '@/components/ui/cardSurface';
import { PositionPickerSheet } from '@/components/PositionPickerSheet';
import { choiceTextColor, choiceTone } from '@/lib/choiceTone';
import { useCreateCall } from '@/hooks/useCreateCall';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useSession } from '@/hooks/useSession';
import { formatPrice, formatUsd } from '@/lib/formatters';
import type { UserPosition } from '@/types/social';

const MAX_POST_LENGTH = 280;

/**
 * Desktop-only inline composer shown beside the Callouts feed  the same
 * flow as the `/create-call` page (a Callout always needs an attached
 * position; Publish stays disabled until one is picked), but it stays on
 * the page: after publishing, the form clears and the feed on the left
 * refreshes through `useCreateCall`'s `['feed']` invalidation.
 */
export function CalloutComposerPanel() {
  const router = useRouter();
  const { canUseApp } = useSession();
  const profile = useProfile(undefined, canUseApp);
  const mutation = useCreateCall();
  const [content, setContent] = useState('');
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const trimmed = content.trim();
  const canPublish =
    trimmed.length > 0 && content.length <= MAX_POST_LENGTH && canUseApp && position !== null && !mutation.isPending;

  const handlePublish = () => {
    if (!canPublish || !position) return;
    mutation.mutate(
      { body: trimmed, positionId: position.id },
      {
        onSuccess: () => {
          setContent('');
          setPosition(null);
        },
      }
    );
  };

  return (
    <aside className={`${CARD_SURFACE_CLASS} flex flex-col gap-4 p-5`} aria-label="New Callout">
      <Text variant="title" className="block font-inter-bold">
        New Callout
      </Text>

      {!canUseApp ? (
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3.5">
          <Text variant="bodyStrong">Sign in to publish</Text>
          <Text variant="caption" color="textSecondary">
            You need to be signed in to publish a Callout.
          </Text>
          <Button label="Connect Wallet" variant="secondary" onClick={() => router.push('/sign-in')} className="mt-1" />
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Avatar uri={profile.data?.avatarUrl ?? null} fallbackLabel={profile.data?.displayName ?? '?'} size={40} />
        {profile.data?.displayName ? (
          <Text variant="bodyStrong" className="block">
            {profile.data.displayName}
          </Text>
        ) : null}
      </div>

      <div className="border-b border-white/10" />

      <textarea
        placeholder="What's your call?"
        value={content}
        rows={4}
        onChange={(event) => setContent(event.target.value)}
        onInput={(event) => {
          const element = event.currentTarget;
          element.style.height = 'auto';
          element.style.height = `${element.scrollHeight}px`;
        }}
        className="min-h-28 w-full resize-none border-0 bg-transparent p-0 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none"
      />
      <Text variant="micro" color={content.length > MAX_POST_LENGTH ? 'danger' : 'textTertiary'} className="block text-right">
        {content.length}/{MAX_POST_LENGTH}
      </Text>

      {position ? (
        <SelectedPosition position={position} onChange={() => setPickerVisible(true)} onRemove={() => setPosition(null)} />
      ) : (
        <button
          type="button"
          onClick={() => setPickerVisible(true)}
          aria-label="Attach your market position"
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 text-left transition-colors hover:bg-white/10"
        >
          <Icon name="trending-up-outline" color="accent" />
          <div className="flex-1">
            <Text variant="bodyStrong" className="block">
              Attach your position
            </Text>
            <Text variant="caption" color="textSecondary">
              Only a position you hold can become a Callout.
            </Text>
          </div>
          <Icon name="chevron-forward" size={18} color="textTertiary" />
        </button>
      )}

      {mutation.isError ? (
        <Text variant="caption" color="danger">
          {friendlyPublishError(mutation.error?.message ?? null)}
        </Text>
      ) : null}

      <Button
        label={mutation.isPending ? 'Publishing…' : 'Publish Callout'}
        onClick={handlePublish}
        disabled={!canPublish}
        loading={mutation.isPending}
      />

      <PositionPickerSheet visible={pickerVisible} onClose={() => setPickerVisible(false)} onSelect={setPosition} />
    </aside>
  );
}

function SelectedPosition({
  position,
  onChange,
  onRemove,
}: {
  position: UserPosition;
  onChange: () => void;
  onRemove: () => void;
}) {
  const outcomeColor = choiceTextColor(choiceTone({ index: position.choiceIndex, label: position.outcome }));
  const costBasis = (position.entryPrice / 100) * position.size;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onChange();
      }}
      aria-label="Change attached position"
      className="flex cursor-pointer flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3.5 transition-colors hover:bg-white/10"
    >
      <div className="flex items-center justify-between">
        <Text variant="bodyStrong" color={outcomeColor}>
          {position.outcome}
        </Text>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          aria-label="Remove attached position"
        >
          <Icon name="close" size={18} color="textTertiary" />
        </button>
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
    </div>
  );
}

function friendlyPublishError(message: string | null): string {
  if (!message) return "Couldn't publish this right now. Please try again.";
  if (/network/i.test(message)) return 'Network error  check your connection and try again.';
  if (/position/i.test(message)) return "We couldn't verify this position. Please try again.";
  return "Couldn't publish this right now. Please try again.";
}
