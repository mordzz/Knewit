import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/layout/Screen';
import { useKeyboardPadding } from '@/hooks/useKeyboardPadding';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingState } from '@/components/feedback/LoadingState';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile';
import { useUploadProfileImage } from '@/features/profile/hooks/useUploadProfileImage';
import { UsernameSheet } from '@/features/profile/components/UsernameSheet';
import { solidPanel } from '@/theme';

const MAX_BIO_LENGTH = 160;
const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

/**
 * Edit Profile, laid out like the Callout composer (same solid-panel
 * cards, same close + title + primary-action header): banner and avatar
 * pickers, then name, username (lowercase, unique), and bio. Images
 * upload immediately through `POST /users/me/images`; Save sends the
 * text fields via `PATCH /users/me` (docs/API.md). Client-side
 * validation is UX only — the backend independently validates format,
 * length, and uniqueness.
 */
export function EditProfileScreen() {
  const navigation = useNavigation();
  // Always rendered inside a tab stack, so the tab bar already fills the
  // bottom of the screen under this content.
  const keyboardPadding = useKeyboardPadding(useBottomTabBarHeight());
  const profile = useProfile();
  const mutation = useUpdateProfile();
  const upload = useUploadProfileImage();
  // Its own mutation so the username panel's saving/error state never
  // mixes with the main Save button's.
  const usernameMutation = useUpdateProfile();
  const [usernameOpen, setUsernameOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  // Tracks which profile id the form was last seeded from — the
  // documented React pattern for "reset derived state when an input
  // changes" (https://react.dev/learn/you-might-not-need-an-effect),
  // called during render rather than in a `useEffect` so it re-renders
  // before paint instead of after. Guarding on the id (not a boolean)
  // means it seeds exactly once per profile and never re-clobbers an
  // in-progress edit if `profile.data` changes reference from a
  // background refetch.
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (profile.status === 'success' && seededFor !== profile.data.id) {
    setDisplayName(profile.data.displayName);
    setHandle(profile.data.handle);
    setBio(profile.data.bio ?? '');
    setAvatarUrl(profile.data.avatarUrl);
    setBannerUrl(profile.data.bannerUrl);
    setSeededFor(profile.data.id);
  }

  const trimmedName = displayName.trim();
  const normalizedHandle = handle.trim().toLowerCase();
  const isNameValid = trimmedName.length > 0 && displayName.length <= MAX_DISPLAY_NAME_LENGTH;
  const isHandleValid = HANDLE_RE.test(normalizedHandle);
  const isBioValid = bio.length <= MAX_BIO_LENGTH;
  const canSave =
    isNameValid && isHandleValid && isBioValid && !mutation.isPending && !upload.isPending;

  async function handlePickImage(kind: 'avatar' | 'banner') {
    setImageError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setImageError('Allow photo library access in Settings to change your profile image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: kind === 'banner' ? [3, 1] : [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      setImageError('Image must be 2MB or smaller.');
      return;
    }
    const extension = asset.mimeType?.split('/')[1] ?? 'jpg';
    upload.mutate(
      {
        kind,
        file: {
          uri: asset.uri,
          name: asset.fileName ?? `${kind}.${extension}`,
          type: asset.mimeType ?? 'image/jpeg',
        },
      },
      {
        onSuccess: (updated) => {
          setAvatarUrl(updated.avatarUrl);
          setBannerUrl(updated.bannerUrl);
        },
        onError: () => setImageError("Couldn't upload that image. Please try again."),
      }
    );
  }

  /** Saves only the new username — name/bio are sent as they are on the
   * server, so unsaved edits in the form stay unsaved until Save. */
  function saveUsername(newHandle: string) {
    if (profile.status !== 'success') return;
    usernameMutation.mutate(
      {
        displayName: profile.data.displayName,
        handle: newHandle,
        bio: profile.data.bio ?? '',
        avatarUrl,
        bannerUrl,
      },
      {
        onSuccess: () => {
          setHandle(newHandle);
          setUsernameOpen(false);
        },
      }
    );
  }

  function handleSave() {
    if (!canSave) return;
    mutation.mutate(
      { displayName: trimmedName, handle: normalizedHandle, bio: bio.trim(), avatarUrl, bannerUrl },
      { onSuccess: () => navigation.goBack() }
    );
  }

  return (
    // Shrinks the scroll area above the keyboard so lower fields (bio)
    // can be scrolled into view instead of staying covered.
    <View className="flex-1 bg-background" style={{ paddingBottom: keyboardPadding }}>
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
              Profile &amp; Account
            </Text>
          </View>
        </View>

        {profile.status === 'pending' ? (
          <View style={[solidPanel, { borderRadius: 16 }]} className="gap-3 p-3.5">
            <LoadingState rows={4} />
          </View>
        ) : null}

        {profile.status === 'error' ? (
          <Text variant="caption" color="danger">
            Couldn&apos;t load your profile. Please go back and try again.
          </Text>
        ) : null}

        {profile.status === 'success' ? (
          <>
            <View style={[solidPanel, { borderRadius: 16 }]} className="gap-3 p-3.5">
              <Pressable
                onPress={() => handlePickImage('banner')}
                accessibilityRole="button"
                accessibilityLabel="Change cover"
              >
                <View className="h-32 w-full overflow-hidden rounded-xl bg-surface">
                  {bannerUrl ? (
                    <Image
                      source={{ uri: bannerUrl }}
                      className="h-full w-full"
                      resizeMode="cover"
                      accessibilityLabel="Profile banner"
                    />
                  ) : (
                    <>
                      <View
                        className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-accent"
                        style={{ opacity: 0.12 }}
                      />
                      <View
                        className="absolute -bottom-12 right-0 h-44 w-44 rounded-full bg-accent"
                        style={{ opacity: 0.08 }}
                      />
                    </>
                  )}
                  {upload.isPending && upload.variables?.kind === 'banner' ? (
                    <View className="absolute inset-0 items-center justify-center bg-black/50">
                      <ActivityIndicator color="#FFFFFF" />
                    </View>
                  ) : (
                    <View className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1">
                      <Text variant="micro" className="font-semibold text-white">
                        Change cover
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>

              <View className="border-b border-white/10" />

              <View className="flex-row items-center gap-3">
                <Avatar uri={avatarUrl} fallbackLabel={trimmedName || '?'} size={56} />
                <Button
                  label="Change photo"
                  variant="secondary"
                  onPress={() => handlePickImage('avatar')}
                  loading={upload.isPending && upload.variables?.kind === 'avatar'}
                  className="min-h-0 rounded-xl px-3 py-1.5"
                  accessibilityLabel="Change photo"
                />
                {avatarUrl ? (
                  <Pressable
                    onPress={() => setAvatarUrl(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Remove photo"
                    hitSlop={8}
                  >
                    <Text variant="caption" color="textSecondary">
                      Remove
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={[solidPanel, { borderRadius: 16 }]} className="gap-3 p-3.5">
              <View>
                <Input
                  label="Name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  className="border-0 bg-transparent px-0"
                  accessibilityLabel="Name"
                />
                <Text
                  variant="micro"
                  color={displayName.length > MAX_DISPLAY_NAME_LENGTH ? 'danger' : 'textTertiary'}
                  className="text-right"
                >
                  {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
                </Text>
              </View>

              <View className="border-b border-white/10" />

              {/* A large, clearly labelled row — the actual editing happens in
                  UsernameSheet, docked above the keyboard. */}
              <Pressable
                onPress={() => {
                  usernameMutation.reset();
                  setUsernameOpen(true);
                }}
                className="min-h-14 flex-row items-center gap-3 py-1 active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel={`Username @${handle}. Change username`}
              >
                <View className="flex-1 gap-0.5">
                  <Text variant="caption" color="textSecondary">
                    Username
                  </Text>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    @{handle}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1 rounded-full bg-white/10 px-3.5 py-2">
                  <Text variant="caption" color="textPrimary">
                    Change
                  </Text>
                  <Icon name="chevron-forward" size={14} color="textSecondary" />
                </View>
              </Pressable>

              <View className="border-b border-white/10" />

              <View>
                <Input
                  label="Bio"
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell people about yourself"
                  multiline
                  numberOfLines={3}
                  className="min-h-20 border-0 bg-transparent px-0"
                  style={{ textAlignVertical: 'top' }}
                  accessibilityLabel="Bio"
                />
                <Text
                  variant="micro"
                  color={bio.length > MAX_BIO_LENGTH ? 'danger' : 'textTertiary'}
                  className="text-right"
                >
                  {bio.length}/{MAX_BIO_LENGTH}
                </Text>
              </View>
            </View>

            {imageError ? (
              <Text variant="caption" color="danger">
                {imageError}
              </Text>
            ) : null}

            {mutation.isError ? (
              <Text variant="caption" color="danger">
                {friendlyEditError(mutation.error?.message ?? null)}
              </Text>
            ) : null}
          </>
        ) : null}

        {profile.status === 'success' ? (
          <>
            <Button
              label={mutation.isPending ? 'Saving…' : 'Save'}
              onPress={handleSave}
              disabled={!canSave}
              loading={mutation.isPending}
              className="mt-2 min-h-12 w-full rounded-xl"
              accessibilityLabel="Save profile"
            />
            <Pressable
              onPress={() => setDeleteOpen(true)}
              className="w-full rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 active:bg-danger/15"
              accessibilityRole="button"
            >
              <Text variant="body" color="danger" className="text-center">
                Delete Account
              </Text>
            </Pressable>
          </>
        ) : null}
        <Modal visible={deleteOpen} onClose={() => setDeleteOpen(false)}>
          <Text variant="heading">Delete account?</Text>
          <Text variant="body" color="textSecondary" className="mt-2">
            This requests deletion of your Knewit account. Blockchain, Privy, and Polymarket records
            cannot be deleted by Knewit.
          </Text>
          <View className="mt-6 flex-row justify-end gap-3">
            <Pressable onPress={() => setDeleteOpen(false)} className="px-4 py-2">
              <Text variant="body" color="textSecondary">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setDeleteOpen(false)}
              className="rounded-lg bg-danger px-4 py-2"
            >
              <Text variant="bodyStrong" className="text-white">
                Request deletion
              </Text>
            </Pressable>
          </View>
        </Modal>
      </Screen>

      {usernameOpen ? (
        <UsernameSheet
          currentHandle={handle}
          saving={usernameMutation.isPending}
          errorMessage={
            usernameMutation.isError
              ? friendlyEditError(usernameMutation.error?.message ?? null)
              : null
          }
          bottomOffset={keyboardPadding}
          onSave={saveUsername}
          onClose={() => setUsernameOpen(false)}
        />
      ) : null}
    </View>
  );
}

/** Never surfaces a raw backend error — maps known cases to honest,
 * specific copy and anything else to one generic message. */
function friendlyEditError(message: string | null): string {
  if (!message) return "Couldn't save your changes right now. Please try again.";
  if (/network/i.test(message)) {
    return 'Network error — check your connection and try again.';
  }
  if (
    /username is already taken|already used by a polymarket trader|couldn't verify username with polymarket/i.test(
      message
    )
  ) {
    return message;
  }
  return "Couldn't save your changes right now. Please try again.";
}
