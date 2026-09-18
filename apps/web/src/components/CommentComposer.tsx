'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';

const MAX_COMMENT_LENGTH = 280;

export interface CommentComposerProps {
  onSubmit: (body: string) => void;
  isSubmitting: boolean;
  replyingToHandle?: string | null;
  onCancelReply?: () => void;
}

/**
 * Web equivalent of `apps/mobile/src/features/home/components/CommentComposer`
 * — fixed-position footer under the comments list. Send is disabled
 * for empty/whitespace-only content and while a submission is in
 * flight; clears the reply target after a successful send or cancel.
 */
export function CommentComposer({ onSubmit, isSubmitting, replyingToHandle, onCancelReply }: CommentComposerProps) {
  const [body, setBody] = useState('');
  const trimmed = body.trim();
  const canSend = trimmed.length > 0 && body.length <= MAX_COMMENT_LENGTH && !isSubmitting;

  const [trackedReplyTarget, setTrackedReplyTarget] = useState(replyingToHandle ?? null);
  if ((replyingToHandle ?? null) !== trackedReplyTarget) {
    setTrackedReplyTarget(replyingToHandle ?? null);
    setBody('');
  }

  function handleSend() {
    if (!canSend) return;
    onSubmit(trimmed);
    setBody('');
  }

  return (
    <div className="border-t border-border">
      {replyingToHandle ? (
        <div className="flex items-center justify-between px-4 pt-2">
          <Text variant="caption" color="textSecondary">
            Replying to @{replyingToHandle}
          </Text>
          <button type="button" onClick={onCancelReply} aria-label="Cancel reply">
            <Icon name="close" size={16} color="textTertiary" />
          </button>
        </div>
      ) : null}
      <div className="flex items-end gap-2 px-4 py-3">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={replyingToHandle ? 'Add a reply...' : 'Add a comment...'}
          className="flex-1"
        />
        <Button
          label={replyingToHandle ? 'Reply' : 'Send'}
          onClick={handleSend}
          disabled={!canSend}
          loading={isSubmitting}
          className="min-h-12"
        />
      </div>
    </div>
  );
}
