import { useState } from 'react';
import { View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const MAX_COMMENT_LENGTH = 280;

export interface CommentComposerProps {
  onSubmit: (body: string) => void;
  isSubmitting: boolean;
}

/** Fixed-position footer under the comments list — see
 * `PostDetailScreen`'s `KeyboardAvoidingView` for why the input stays
 * reachable above the keyboard. Send is disabled for empty/whitespace-
 * only content and while a submission is in flight. */
export function CommentComposer({ onSubmit, isSubmitting }: CommentComposerProps) {
  const [body, setBody] = useState('');
  const trimmed = body.trim();
  const canSend = trimmed.length > 0 && body.length <= MAX_COMMENT_LENGTH && !isSubmitting;

  function handleSend() {
    if (!canSend) return;
    onSubmit(trimmed);
    setBody('');
  }

  return (
    <View className="flex-row items-end gap-2 border-t border-border px-4 py-3">
      <Input
        value={body}
        onChangeText={setBody}
        placeholder="Add a comment..."
        multiline
        className="flex-1"
        accessibilityLabel="Add a comment"
      />
      <Button
        label="Send"
        onPress={handleSend}
        disabled={!canSend}
        loading={isSubmitting}
        className="min-h-12"
        accessibilityLabel="Send comment"
      />
    </View>
  );
}
