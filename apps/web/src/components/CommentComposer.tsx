'use client';

import { useState } from 'react';
import { IoSend } from 'react-icons/io5';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';

const MAX_COMMENT_LENGTH = 280;

export interface CommentComposerProps {
  onSubmit: (body: string) => void;
  onClose: () => void;
  isSubmitting: boolean;
  replyingToHandle?: string | null;
}

/**
 * Inline comment/reply input — rendered only after the viewer taps a
 * comment button, directly under the post's action bar (a top-level
 * comment) or under the comment being replied to. Send is a round icon
 * button, disabled for empty/whitespace-only content, over the length
 * limit, or while a submission is in flight; the X closes the composer.
 */
export function CommentComposer({ onSubmit, onClose, isSubmitting, replyingToHandle }: CommentComposerProps) {
  const [body, setBody] = useState('');
  const trimmed = body.trim();
  const canSend = trimmed.length > 0 && body.length <= MAX_COMMENT_LENGTH && !isSubmitting;

  function handleSend() {
    if (!canSend) return;
    onSubmit(trimmed);
    setBody('');
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <div className="min-w-0 flex-1">
      <Input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSend();
          if (e.key === 'Escape') onClose();
        }}
        placeholder={replyingToHandle ? `Reply to @${replyingToHandle}…` : 'Add a comment…'}
        autoFocus
        className="w-full"
      />
      </div>
      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        aria-label={replyingToHandle ? 'Send reply' : 'Send comment'}
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-text-inverse transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {isSubmitting ? (
          <span className="size-4 animate-spin rounded-full border-2 border-text-inverse border-t-transparent" />
        ) : (
          <IoSend size={18} />
        )}
      </button>
      <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 p-1">
        <Icon name="close" size={18} color="textTertiary" />
      </button>
    </div>
  );
}
