import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { PositionPickerSheet } from '@/features/home/components/PositionPickerSheet';
import { useCreateCall } from '@/features/home/hooks/useCreateCall';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { solidPanel } from '@/theme';
import { formatPrice, formatUsd } from '@/utils/formatCurrency';
import { choiceTextColor, choiceTone } from '@/utils/choiceTone';
import type { UserPosition } from '@/types/social';

const MAX_POST_LENGTH = 280;

/**
 * The Callout composer — X/Twitter-style layout (avatar + inline input,
 * Cancel/Publish in the top bar rather than a full-width bottom button).
 * There is no longer a Post/Call choice (see docs/DECISIONS.md,
 * superseding the earlier unified Post/Call composer): a callout
 * **always** requires an attached market position — only someone who has
 * actually bought a position can publish one, enforced here by keeping
 * Publish disabled until one is selected from `PositionPickerSheet`
 * (which itself gates on wallet connection and an honest "no positions
 * yet" empty state). Never fabricates a successful publish:
 * `useCreateCall` has no dev-mock fallback (see docs/DECISIONS.md, "No
 * Fake Publish Success"), and the "✓ Verified Position" badge only ever
 * appears on a callout once the backend has actually returned one
 * (rendered by `MarketAttachment` on the feed after this screen closes)
 * — this screen itself never shows that badge speculatively.
 */
export function CreateCallScreen() {
  const navigation = useNavigation();
  const { canUseApp } = useAuth();
  const profile = useProfile(undefined, canUseApp);
  const [content, setContent] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<UserPosition | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const mutation = useCreateCall();

  const trimmed = content.trim();
  const isContentValid = trimmed.length > 0 && content.length <= MAX_POST_LENGTH;
  const hasPosition = selectedPosition !== null;
  const canPublish = isContentValid && canUseApp && hasPosition && !mutation.isPending;

  async function handlePublish() {
    if (!canPublish || !selectedPosition) return;
    mutation.mutate(
      { body: trimmed, positionId: selectedPosition.id },
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
          <View className="flex-1 flex-row items-center gap-2">
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              hitSlop={8}
            >
              <Icon name="close" size={24} />
            </Pressable>
            <Text variant="heading" className="text-2xl">
              New Callout
            </Text>
          </View>
          <Button
            label={mutation.isPending ? 'Publishing…' : 'Publish Callout'}
            onPress={handlePublish}
            disabled={!canPublish}
            loading={mutation.isPending}
            className="min-h-0 px-5 py-2"
            accessibilityLabel="Publish Callout"
          />
        </View>

        {!canUseApp ? (
          <View style={[solidPanel, { borderRadius: 16 }]} className="gap-1 p-3.5">
            <Text variant="bodyStrong">Sign in to publish</Text>
            <Text variant="caption" color="textSecondary">
              You need to be signed in to publish a Callout.
            </Text>
            <Button
              label="Connect Wallet"
              variant="secondary"
              onPress={() => navigation.navigate('Auth')}
              className="mt-2"
            />
          </View>
        ) : null}

        <View style={[solidPanel, { borderRadius: 16 }]} className="gap-3 p-3.5">
          <View className="flex-row items-center gap-3">
            <Avatar
              uri={profile.data?.avatarUrl ?? null}
              fallbackLabel={profile.data?.displayName ?? '?'}
              size={40}
            />
            {profile.data?.displayName ? (
              <Text variant="bodyStrong">{profile.data.displayName}</Text>
            ) : null}
          </View>

          <View className="border-b border-white/10" />

          <Input
            placeholder="What's your call?"
            multiline
            value={content}
            onChangeText={setContent}
            className="min-h-24 border-0 bg-transparent px-0"
            style={{ textAlignVertical: 'top' }}
            accessibilityLabel="Callout content"
          />
          <Text
            variant="micro"
            color={content.length > MAX_POST_LENGTH ? 'danger' : 'textTertiary'}
            className="text-right"
          >
            {content.length}/{MAX_POST_LENGTH}
          </Text>
        </View>

        {hasPosition && selectedPosition ? (
          <SelectedPositionCard
            position={selectedPosition}
            onChange={() => setPickerVisible(true)}
            onRemove={() => setSelectedPosition(null)}
          />
        ) : (
          <Pressable
            onPress={() => setPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Attach your market position"
          >
            <View
              style={[solidPanel, { borderRadius: 16 }]}
              className="flex-row items-center gap-3 p-3.5"
            >
              <Icon name="trending-up-outline" color="accent" />
              <View className="flex-1 gap-0.5">
                <Text variant="bodyStrong">Attach your position</Text>
                <Text variant="caption" color="textSecondary">
                  Only a position you hold can become a Callout — pick one to continue.
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} color="textTertiary" />
            </View>
          </Pressable>
        )}

        {mutation.isError ? (
          <Text variant="caption" color="danger">
            {friendlyPublishError(mutation.error?.message ?? null)}
          </Text>
        ) : null}
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
  onChange,
  onRemove,
}: {
  position: UserPosition;
  onChange: () => void;
  onRemove: () => void;
}) {
  const outcomeColor = choiceTextColor(
    choiceTone({ index: position.choiceIndex, label: position.outcome })
  );
  const costBasis = (position.entryPrice / 100) * position.size;

  return (
    <Pressable
      onPress={onChange}
      accessibilityRole="button"
      accessibilityLabel="Change attached position"
    >
      <View style={[solidPanel, { borderRadius: 16 }]} className="gap-2 p-3.5">
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
      </View>
    </Pressable>
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
