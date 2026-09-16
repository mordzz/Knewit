import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { PositionPickerSheet } from '@/features/home/components/PositionPickerSheet';
import { useCreatePost } from '@/features/home/hooks/useCreatePost';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, formatUsd } from '@/utils/formatCurrency';
import type { ColorToken } from '@/theme/colors';
import type { UserPosition } from '@/types/social';
import type { AppParamList } from '@/types/navigation';

const MAX_POST_LENGTH = 280;

/**
 * The one composer for both a normal Post and a position-backed Call —
 * they're the same content model, distinguished only by whether a
 * position is attached (see docs/SOCIAL-FEATURE.md). `route.params.intent`
 * only changes the heading/copy emphasis; publishing works identically
 * either way. Never fabricates a successful publish: `useCreatePost`
 * has no dev-mock fallback (see docs/DECISIONS.md, "No Fake Publish
 * Success"), and the "✓ Verified Position" badge only ever appears on a
 * Call once the backend has actually returned one (rendered by
 * `MarketAttachment` on the feed after this screen closes) — this
 * screen itself never shows that badge speculatively.
 */
export function CreateCallScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppParamList, 'CreateCall'>>();
  const intent = route.params?.intent ?? 'post';
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<UserPosition | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const mutation = useCreatePost();

  const trimmed = content.trim();
  const isContentValid = trimmed.length > 0 && content.length <= MAX_POST_LENGTH;
  const canPublish = isContentValid && isAuthenticated && !mutation.isPending;
  const hasPosition = selectedPosition !== null;

  async function handlePublish() {
    if (!canPublish) return;
    mutation.mutate(
      { body: trimmed, positionId: selectedPosition?.id },
      {
        onSuccess: () => navigation.goBack(),
      }
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen scroll contentContainerClassName="gap-3 px-4 pb-8 pt-4">
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            hitSlop={8}
          >
            <Icon name="close" size={24} />
          </Pressable>
          <Text variant="heading">{intent === 'call' ? 'Create Call' : 'Create Post'}</Text>
          <View style={{ width: 24 }} />
        </View>

        {!isAuthenticated ? (
          <Card contentClassName="gap-1">
            <Text variant="bodyStrong">Sign in to post</Text>
            <Text variant="caption" color="textSecondary">
              You need to be signed in to publish a Post or Call.
            </Text>
            <Button
              label="Connect Wallet"
              variant="secondary"
              onPress={() => navigation.navigate('Auth')}
              className="mt-2"
            />
          </Card>
        ) : null}

        <Input
          label="What's your take?"
          placeholder={
            intent === 'call' ? "What's your take on this position?" : "What's on your mind?"
          }
          multiline
          numberOfLines={4}
          value={content}
          onChangeText={setContent}
          className="min-h-24"
          style={{ textAlignVertical: 'top' }}
          accessibilityLabel="Post content"
        />
        <Text
          variant="micro"
          color={content.length > MAX_POST_LENGTH ? 'danger' : 'textTertiary'}
          className="text-right"
        >
          {content.length}/{MAX_POST_LENGTH}
        </Text>

        {hasPosition && selectedPosition ? (
          <SelectedPositionCard
            position={selectedPosition}
            onRemove={() => setSelectedPosition(null)}
          />
        ) : (
          <Card contentClassName="flex-row items-center gap-3">
            <Icon name="trending-up-outline" color="textTertiary" />
            <View className="flex-1 gap-0.5">
              <Text variant="bodyStrong">No position attached</Text>
              <Text variant="caption" color="textSecondary">
                Attach a market position to earn a Verified badge
              </Text>
            </View>
          </Card>
        )}

        <Button
          label={hasPosition ? 'Change Position' : 'Attach Position'}
          variant="secondary"
          onPress={() => setPickerVisible(true)}
        />

        {mutation.isError ? (
          <Text variant="caption" color="danger">
            {friendlyPublishError(mutation.error?.message ?? null)}
          </Text>
        ) : null}

        <Button
          label={
            mutation.isPending
              ? hasPosition
                ? 'Publishing Call...'
                : 'Publishing...'
              : hasPosition
                ? 'Publish Call'
                : 'Publish Post'
          }
          onPress={handlePublish}
          disabled={!canPublish}
          loading={mutation.isPending}
          className="mt-1"
          accessibilityLabel={hasPosition ? 'Publish Call' : 'Publish Post'}
        />
      </Screen>

      <PositionPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={setSelectedPosition}
      />
    </KeyboardAvoidingView>
  );
}

/**
 * Preview only — never claims "Verified" here. The badge that matters
 * is `MarketAttachment`'s, rendered on the feed from the backend's own
 * response after a successful publish, not this pre-publish preview.
 */
function SelectedPositionCard({
  position,
  onRemove,
}: {
  position: UserPosition;
  onRemove: () => void;
}) {
  const outcomeColor: ColorToken = position.outcome === 'YES' ? 'yes' : 'no';
  const costBasis = (position.entryPrice / 100) * position.size;

  return (
    <Card contentClassName="gap-2">
      <View className="flex-row items-center justify-between">
        <Text variant="bodyStrong" color={outcomeColor}>
          {position.outcome}
        </Text>
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel="Remove attached position"
          hitSlop={8}
        >
          <Icon name="close" size={18} color="textTertiary" />
        </Pressable>
      </View>
      <Text variant="body" numberOfLines={2}>
        {position.marketQuestion}
      </Text>
      <View className="flex-row gap-4">
        <Text variant="caption" color="textSecondary">
          Entry {formatPrice(position.entryPrice)}
        </Text>
        <Text variant="caption" color="textSecondary">
          Size {formatUsd(costBasis)}
        </Text>
      </View>
    </Card>
  );
}

/** Never surfaces a raw backend error — maps known cases to honest,
 * specific copy and anything else to one generic message. */
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
