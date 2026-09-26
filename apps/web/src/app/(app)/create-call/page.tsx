'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { choiceTextColor, choiceTone } from '@/lib/choiceTone';
import { Avatar } from '@/components/ui/Avatar';
import { SOLID_PANEL_CLASS } from '@/components/ui/solidPanel';
import { PositionPickerSheet } from '@/components/PositionPickerSheet';
import { useCreateCall } from '@/hooks/useCreateCall';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useSession } from '@/hooks/useSession';
import { formatPrice, formatUsd } from '@/lib/formatters';
import type { UserPosition } from '@/types/social';

const MAX_POST_LENGTH = 280;

/**
 * Direct conversion of `apps/mobile`'s `CreateCallScreen`  a callout
 * always requires an attached market position (docs/DECISIONS.md,
 * "Callouts Require a Held Position"): Publish stays disabled until one
 * is selected from `PositionPickerSheet`. No dev-mock fallback on
 * publish (`useCreateCall`  "No Fake Publish Success").
 */
export default function CreateCallPage() {
  const router = useRouter();
  const { canUseApp } = useSession();
  const profile = useProfile(undefined, canUseApp);
  const [content, setContent] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<UserPosition | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const mutation = useCreateCall();

  const trimmed = content.trim();
  const isContentValid = trimmed.length > 0 && content.length <= MAX_POST_LENGTH;
  const hasPosition = selectedPosition !== null;
  const canPublish = isContentValid && canUseApp && hasPosition && !mutation.isPending;

  function handlePublish() {
    if (!canPublish || !selectedPosition) return;
    mutation.mutate(
      { body: trimmed, positionId: selectedPosition.id },
      { onSuccess: () => router.push('/callouts') }
    );
  }

  return (
    <main className="flex w-full flex-col gap-3 px-4 pb-8 pt-4 lg:mx-auto lg:max-w-3xl lg:px-0">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <button type="button" onClick={() => router.back()} aria-label="Cancel">
            <Icon name="close" size={24} />
          </button>
          <Text variant="heading" className="block text-2xl">
            New Callout
          </Text>
        </div>
        <Button
          label={mutation.isPending ? 'Publishing…' : 'Publish Callout'}
          onClick={handlePublish}
          disabled={!canPublish}
          loading={mutation.isPending}
          className="min-h-0 px-5 py-2"
        />
      </div>

      {!canUseApp ? (
        <div className={`${SOLID_PANEL_CLASS} flex flex-col gap-1 rounded-2xl p-3.5`}>
          <Text variant="bodyStrong">Sign in to publish</Text>
          <Text variant="caption" color="textSecondary">
            You need to be signed in to publish a Callout.
          </Text>
          <Button label="Connect Wallet" variant="secondary" onClick={() => router.push('/sign-in')} className="mt-2" />
        </div>
      ) : null}

      <div className={`${SOLID_PANEL_CLASS} flex flex-col gap-3 rounded-2xl p-3.5`}>
        <div className="flex items-center gap-3">
          <Avatar
            uri={profile.data?.avatarUrl ?? null}
            fallbackLabel={profile.data?.displayName ?? '?'}
            size={40}
          />
          {profile.data?.displayName ? (
            <Text variant="bodyStrong" className="block">
              {profile.data.displayName}
            </Text>
          ) : null}
        </div>

        <div className="border-b border-white/10" />

        {/* Auto-growing textarea: content starts at the top edge and the
            box keeps extending downward as the text grows (no internal
            scroll)  the one card is split in two by the divider above. */}
        <textarea
          placeholder="What's your call?"
          value={content}
          rows={4}
          onChange={(e) => setContent(e.target.value)}
          onInput={(e) => {
            const element = e.currentTarget;
            element.style.height = 'auto';
            element.style.height = `${element.scrollHeight}px`;
          }}
          className="min-h-24 w-full resize-none border-0 bg-transparent px-0 py-0 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none"
        />
        <Text variant="micro" color={content.length > MAX_POST_LENGTH ? 'danger' : 'textTertiary'} className="block text-right">
          {content.length}/{MAX_POST_LENGTH}
        </Text>
      </div>

      {hasPosition && selectedPosition ? (
        <SelectedPositionCard position={selectedPosition} onChange={() => setPickerVisible(true)} onRemove={() => setSelectedPosition(null)} />
      ) : (
        <button type="button" onClick={() => setPickerVisible(true)} aria-label="Attach your market position" className="text-left">
          <div className={`${SOLID_PANEL_CLASS} flex items-center gap-3 rounded-2xl p-3.5`}>
            <Icon name="trending-up-outline" color="accent" />
            <div className="flex-1">
              <Text variant="bodyStrong" className="block">
                Attach your position
              </Text>
              <Text variant="caption" color="textSecondary">
                Only a position you hold can become a Callout  pick one to continue.
              </Text>
            </div>
            <Icon name="chevron-forward" size={18} color="textTertiary" />
          </div>
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
  const outcomeColor = choiceTextColor(choiceTone({ index: position.choiceIndex, label: position.outcome }));
  const costBasis = (position.entryPrice / 100) * position.size;

  return (
    <button type="button" onClick={onChange} aria-label="Change attached position" className="text-left">
      <div className={`${SOLID_PANEL_CLASS} flex flex-col gap-2 rounded-2xl p-3.5`}>
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
      </div>
    </button>
  );
}

function friendlyPublishError(message: string | null): string {
  if (!message) return "Couldn't publish this right now. Please try again.";
  if (/network/i.test(message)) {
    return 'Network error  check your connection and try again.';
  }
  if (/position/i.test(message)) {
    return "We couldn't verify this position. Please try again.";
  }
  return "Couldn't publish this right now. Please try again.";
}
