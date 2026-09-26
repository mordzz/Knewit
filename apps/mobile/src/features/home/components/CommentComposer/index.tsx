import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';

const MAX_COMMENT_LENGTH = 280;

export interface CommentComposerProps {
  onSubmit: (body: string) => void;
  isSubmitting: boolean;
  /** Set while replying to a specific comment  shows a "Replying to
   * @handle" chip above the input and includes `parentCommentId` in the
   * submitted comment (see `PostDetailScreen`). `null` for an ordinary
   * top-level comment. */
  replyingToHandle?: string | null;
  onCancelReply?: () => void;
}

/** Fixed-position footer under the comments list  see
 * `PostDetailScreen`'s `KeyboardAvoidingView` for why the input stays
 * reachable above the keyboard. Send is disabled for empty/whitespace-
 * only content and while a submission is in flight. Clears the reply
 * target after a successful send (`replyingToHandle` becoming `null`
 * from the parent) as well as after cancel, so the chip never lingers
 * past the comment it was for. */
export function CommentComposer({
  onSubmit,
  isSubmitting,
  replyingToHandle,
  onCancelReply,
}: CommentComposerProps) {
  const [body, setBody] = useState('');
  const trimmed = body.trim();
  const canSend = trimmed.length > 0 && body.length <= MAX_COMMENT_LENGTH && !isSubmitting;

  // "Adjusting state during render" (React's own recommended pattern,
  // not an effect  see react.dev/learn/you-might-not-need-an-effect):
  // once the reply target changes, drop whatever was mid-typed for the
  // previous target/top-level comment rather than attaching it to the
  // new one.
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
    <View className="border-t border-border">
      {replyingToHandle ? (
        <View className="flex-row items-center justify-between px-4 pt-2">
          <Text variant="caption" color="textSecondary">
            Replying to @{replyingToHandle}
          </Text>
          <Pressable
            onPress={onCancelReply}
            accessibilityRole="button"
            accessibilityLabel="Cancel reply"
            hitSlop={8}
          >
            <Icon name="close" size={16} color="textTertiary" />
          </Pressable>
        </View>
      ) : null}
      <View className="flex-row items-end gap-2 px-4 py-3">
        <Input
          value={body}
          onChangeText={setBody}
          placeholder={replyingToHandle ? 'Add a reply...' : 'Add a comment...'}
          multiline
          className="flex-1"
          accessibilityLabel={replyingToHandle ? 'Add a reply' : 'Add a comment'}
        />
        <Button
          label={replyingToHandle ? 'Reply' : 'Send'}
          onPress={handleSend}
          disabled={!canSend}
          loading={isSubmitting}
          className="min-h-12"
          accessibilityLabel={replyingToHandle ? 'Send reply' : 'Send comment'}
        />
      </View>
    </View>
  );
}
