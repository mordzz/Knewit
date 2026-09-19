'use client';

import { useRef, useState } from 'react';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingState } from '@/components/feedback/LoadingState';
import { SOLID_PANEL_CLASS } from '@/components/ui/solidPanel';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile';
import { useUploadProfileImage } from '@/features/profile/hooks/useUploadProfileImage';
import type { ProfileImageKind } from '@/features/profile/lib/userService';

const MAX_BIO_LENGTH = 160;
const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp';

/**
 * Edit Profile, laid out like the Callout composer (same solid-panel
 * cards, same close + title + primary-action header): banner and avatar
 * uploads (tap to change), then name, username (lowercase, unique), and
 * bio. Images upload immediately through
 * `POST /users/me/images`; Save sends the text fields via
 * `PATCH /users/me` (docs/API.md).
 */
export function EditProfileForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const profile = useProfile();
  const mutation = useUpdateProfile();
  const upload = useUploadProfileImage();
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

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
  const canSave = isNameValid && isHandleValid && isBioValid && !mutation.isPending && !upload.isPending;

  function handleFile(kind: ProfileImageKind, file: File | undefined) {
    if (!file) return;
    setImageError(null);
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image must be 2MB or smaller.');
      return;
    }
    if (!IMAGE_ACCEPT.split(',').includes(file.type)) {
      setImageError('Only PNG, JPEG, or WebP images are supported.');
      return;
    }
    upload.mutate(
      { kind, file },
      {
        onSuccess: (updated) => {
          setAvatarUrl(updated.avatarUrl);
          setBannerUrl(updated.bannerUrl);
        },
        onError: () => setImageError("Couldn't upload that image. Please try again."),
      }
    );
  }

  function handleSave() {
    if (!canSave) return;
    mutation.mutate(
      { displayName: trimmedName, handle: normalizedHandle, bio: bio.trim(), avatarUrl, bannerUrl },
      { onSuccess: onSaved }
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <button type="button" onClick={onClose} aria-label="Cancel">
            <Icon name="close" size={24} />
          </button>
          <Text variant="heading" className="block text-2xl">
            Edit Profile
          </Text>
        </div>
        <Button
          label={mutation.isPending ? 'Saving…' : 'Save'}
          onClick={handleSave}
          disabled={!canSave}
          loading={mutation.isPending}
          className="min-h-0 px-5 py-2"
        />
      </div>

      {profile.status === 'pending' ? <LoadingState rows={4} /> : null}

      {profile.status === 'error' ? (
        <Text variant="caption" color="danger">
          Couldn&apos;t load your profile. Please go back and try again.
        </Text>
      ) : null}

      {profile.status === 'success' ? (
        <>
          <div className={`${SOLID_PANEL_CLASS} flex flex-col gap-3 rounded-2xl p-3.5`}>
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              aria-label="Change cover"
              className="relative block h-32 w-full overflow-hidden rounded-xl"
            >
              {bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- uploaded storage URL, not a bundled asset
                <img src={bannerUrl} alt="Profile banner" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-accent-muted via-surface to-surface-elevated" />
              )}
              {upload.isPending && upload.variables?.kind === 'banner' ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : (
                <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                  Change cover
                </span>
              )}
            </button>

            <div className="border-b border-white/10" />

            <div className="flex items-center gap-3">
              <Avatar uri={avatarUrl} fallbackLabel={trimmedName || '?'} size={56} />
              <Button
                label="Change photo"
                variant="secondary"
                onClick={() => avatarInputRef.current?.click()}
                loading={upload.isPending && upload.variables?.kind === 'avatar'}
                className="min-h-0 px-4 py-2"
              />
              {avatarUrl ? (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  className="text-xs font-semibold text-text-secondary hover:opacity-80"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>

          <div className={`${SOLID_PANEL_CLASS} flex flex-col gap-3 rounded-2xl p-3.5`}>
            <div>
              <Input
                label="Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="border-0 bg-transparent px-0"
              />
              <Text
                variant="micro"
                color={displayName.length > MAX_DISPLAY_NAME_LENGTH ? 'danger' : 'textTertiary'}
                className="block text-right"
              >
                {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
              </Text>
            </div>

            <div className="border-b border-white/10" />

            <div>
              <Text variant="caption" color="textSecondary" className="mb-1 block">
                Username
              </Text>
              <div className="flex items-center gap-1">
                <Text variant="body" color="textTertiary">
                  @
                </Text>
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase())}
                  placeholder="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="min-h-12 flex-1 border-0 bg-transparent px-0 py-3 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none"
                />
              </div>
              <Text
                variant="micro"
                color={normalizedHandle.length > 0 && !isHandleValid ? 'danger' : 'textTertiary'}
                className="block"
              >
                3-20 lowercase letters, numbers, or underscores.
              </Text>
            </div>

            <div className="border-b border-white/10" />

            <div>
              <Text variant="caption" color="textSecondary" className="mb-1 block">
                Bio
              </Text>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself"
                rows={3}
                className="min-h-20 w-full resize-none border-0 bg-transparent px-0 py-0 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none"
              />
              <Text
                variant="micro"
                color={bio.length > MAX_BIO_LENGTH ? 'danger' : 'textTertiary'}
                className="block text-right"
              >
                {bio.length}/{MAX_BIO_LENGTH}
              </Text>
            </div>
          </div>

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

      <input
        ref={bannerInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFile('banner', e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={avatarInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFile('avatar', e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function friendlyEditError(message: string | null): string {
  if (!message) return "Couldn't save your changes right now. Please try again.";
  if (/network/i.test(message)) {
    return 'Network error - check your connection and try again.';
  }
  if (/username is already taken/i.test(message)) return message;
  return "Couldn't save your changes right now. Please try again.";
}
