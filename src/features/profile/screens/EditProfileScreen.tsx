import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile';

const MAX_BIO_LENGTH = 160;
const MAX_DISPLAY_NAME_LENGTH = 50;

/**
 * Only `displayName`/`bio` are editable — see docs/DECISIONS.md
 * ("Edit Profile Scope: Display Name and Bio Only"). Username/avatar
 * editing are deliberately not built: no rename flow or uniqueness
 * check exists for `handle` anywhere in this codebase, and no image
 * upload/storage mechanism is installed, so both would need real
 * infrastructure this sprint doesn't need to invent.
 */
export function EditProfileScreen() {
  const navigation = useNavigation();
  const profile = useProfile();
  const mutation = useUpdateProfile();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  // Tracks which profile id the form was last seeded from — the
  // documented React pattern for "reset derived state when an input
  // changes" (https://react.dev/learn/you-might-not-need-an-effect),
  // called during render rather than in a `useEffect` so it re-renders
  // before paint instead of after. Guarding on the id (not a boolean)
  // means it seeds exactly once per profile and never re-clobbers an
  // in-progress edit if `profile.data` changes reference from a
  // background refetch.
  const [seededFor, setSeededFor] = useState<string | null>(null);

  if (profile.status === 'success' && seededFor !== profile.data.id) {
    setDisplayName(profile.data.displayName);
    setBio(profile.data.bio ?? '');
    setSeededFor(profile.data.id);
  }

  const trimmedName = displayName.trim();
  const isValid =
    trimmedName.length > 0 &&
    displayName.length <= MAX_DISPLAY_NAME_LENGTH &&
    bio.length <= MAX_BIO_LENGTH;
  const canSave = isValid && !mutation.isPending;

  function handleSave() {
    if (!canSave) return;
    mutation.mutate(
      { displayName: trimmedName, bio: bio.trim() },
      { onSuccess: () => navigation.goBack() }
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
          <Text variant="heading">Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <Input
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          accessibilityLabel="Display name"
        />
        <Text variant="micro" color="textTertiary" className="-mt-2 text-right">
          {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
        </Text>

        <Input
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Tell people about yourself"
          multiline
          numberOfLines={3}
          className="min-h-20"
          style={{ textAlignVertical: 'top' }}
          accessibilityLabel="Bio"
        />
        <Text variant="micro" color="textTertiary" className="-mt-2 text-right">
          {bio.length}/{MAX_BIO_LENGTH}
        </Text>

        {mutation.isError ? (
          <Text variant="caption" color="danger">
            {friendlyEditError(mutation.error?.message ?? null)}
          </Text>
        ) : null}

        <Button
          label="Save"
          onPress={handleSave}
          disabled={!canSave}
          loading={mutation.isPending}
          className="mt-1"
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

function friendlyEditError(message: string | null): string {
  if (!message) return "Couldn't save your changes right now. Please try again.";
  if (/network/i.test(message)) {
    return 'Network error — check your connection and try again.';
  }
  return "Couldn't save your changes right now. Please try again.";
}
