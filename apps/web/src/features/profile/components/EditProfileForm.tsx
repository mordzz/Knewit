'use client';

import { useRef, useState } from 'react';
import { Text } from '@/components/ui/Text';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingState } from '@/components/feedback/LoadingState';
import { SOLID_PANEL_CLASS } from '@/components/ui/solidPanel';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile';
import { useUploadProfileImage } from '@/features/profile/hooks/useUploadProfileImage';
import { useRemoveProfileImage } from '@/features/profile/hooks/useRemoveProfileImage';
import { prepareProfileImage } from '@/features/profile/lib/prepareProfileImage';
import { ApiRequestError } from '@/lib/apiClient';
import type { ProfileImageKind } from '@/features/profile/lib/userService';

const MAX_BIO_LENGTH = 160;
const MAX_DISPLAY_NAME_LENGTH = 50;
const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
// Any image the browser can decode — it's re-encoded to JPEG before upload.
const IMAGE_ACCEPT = 'image/*';

/**
 * Edit Profile, laid out like the Callout composer (same solid-panel
 * cards, same close + title + primary-action header): banner and avatar
 * uploads (tap to change), then name, username (lowercase, unique), and
 * bio. Images upload immediately through
 * `POST /users/me/images`; Save sends the text fields via
 * `PATCH /users/me` (docs/API.md).
 */
export function EditProfileForm({ onSaved }: { onSaved: () => void }) {
  const profile = useProfile();
  const mutation = useUpdateProfile();
  const upload = useUploadProfileImage();
  const remove = useRemoveProfileImage();
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
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
  const imageBusy = upload.isPending || remove.isPending;
  const canSave = isNameValid && isHandleValid && isBioValid && !mutation.isPending && !imageBusy;

  async function handleFile(kind: ProfileImageKind, file: File | undefined) {
    if (!file || imageBusy) return;
    setImageError(null);
    let prepared: File;
    try {
      prepared = await prepareProfileImage(file, kind);
    } catch {
      setImageError("Couldn't read that image. Please pick a PNG, JPEG, or WebP photo.");
      return;
    }
    upload.mutate(
      { kind, file: prepared },
      {
        onSuccess: (updated) => {
          setAvatarUrl(updated.avatarUrl);
          setBannerUrl(updated.bannerUrl);
        },
        onError: (error) => setImageError(friendlyImageError(error, 'upload')),
      }
    );
  }

  /** Removes the image on the server immediately, like an upload. */
  function handleRemove(kind: ProfileImageKind) {
    if (imageBusy) return;
    setImageError(null);
    remove.mutate(kind, {
      onSuccess: (updated) => {
        setAvatarUrl(updated.avatarUrl);
        setBannerUrl(updated.bannerUrl);
      },
      onError: (error) => setImageError(friendlyImageError(error, 'remove')),
    });
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
      {profile.status === 'pending' ? <LoadingState rows={4} /> : null}

      {profile.status === 'error' ? (
        <Text variant="caption" color="danger">
          Couldn&apos;t load your profile. Please go back and try again.
        </Text>
      ) : null}

      {profile.status === 'success' ? (
        <>
          <div className={`${SOLID_PANEL_CLASS} flex flex-col gap-3 rounded-2xl p-3.5`}>
            <div className="relative h-32 w-full overflow-hidden rounded-xl">
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={imageBusy}
                aria-label="Change cover"
                className="block h-full w-full"
              >
                {bannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- uploaded storage URL, not a bundled asset
                  <img src={bannerUrl} alt="Profile banner" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-accent-muted via-surface to-surface-elevated" />
                )}
              </button>
              {(upload.isPending && upload.variables?.kind === 'banner') ||
              (remove.isPending && remove.variables === 'banner') ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : (
                <div className="absolute bottom-2 right-2 flex gap-2">
                  {bannerUrl ? (
                    <button
                      type="button"
                      onClick={() => handleRemove('banner')}
                      disabled={imageBusy}
                      aria-label="Remove cover"
                      className={`${IMAGE_PILL_CLASS} text-danger`}
                    >
                      Remove
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={imageBusy}
                    className={`${IMAGE_PILL_CLASS} text-white`}
                  >
                    {bannerUrl ? 'Change cover' : 'Add cover'}
                  </button>
                </div>
              )}
            </div>

            <div className="border-b border-white/10" />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={imageBusy}
                aria-label="Change photo"
                className="relative shrink-0 rounded-full"
              >
                <Avatar uri={avatarUrl} fallbackLabel={trimmedName || '?'} size={56} />
                {(upload.isPending && upload.variables?.kind === 'avatar') ||
                (remove.isPending && remove.variables === 'avatar') ? (
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  </span>
                ) : null}
              </button>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={imageBusy}
                  className={`${IMAGE_BUTTON_CLASS} border-border bg-surface-elevated text-text-primary hover:bg-white/10`}
                >
                  {avatarUrl ? 'Change photo' : 'Add photo'}
                </button>
                {avatarUrl ? (
                  <button
                    type="button"
                    onClick={() => handleRemove('avatar')}
                    disabled={imageBusy}
                    aria-label="Remove photo"
                    className={`${IMAGE_BUTTON_CLASS} border-danger/30 bg-danger/5 text-danger hover:bg-danger/15`}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
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

      {profile.status === 'success' ? (
        <div className="flex flex-col gap-2">
          <Button
            label={mutation.isPending ? 'Saving…' : 'Save'}
            onClick={handleSave}
            disabled={!canSave}
            loading={mutation.isPending}
            className="min-h-12 w-full rounded-xl"
          />
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="w-full rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger transition-colors hover:bg-danger/15 focus-visible:outline-2 focus-visible:outline-danger focus-visible:outline-offset-2 active:bg-danger/20"
          >
            Delete Account
          </button>
        </div>
      ) : null}

      <Modal visible={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <Text variant="heading" className="block">Delete account?</Text>
        <Text variant="body" color="textSecondary" className="mt-2 block">
          This requests deletion of your Knewit account. Blockchain, Privy, and Polymarket records cannot be deleted by Knewit.
        </Text>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setDeleteOpen(false)} className="rounded-md px-4 py-2 text-sm text-text-secondary">Cancel</button>
          <button type="button" onClick={() => setDeleteOpen(false)} className="rounded-md bg-danger px-4 py-2 text-sm font-semibold text-white">Request deletion</button>
        </div>
      </Modal>

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

/** Pills over the banner: dark glass so they read on any image. */
const IMAGE_PILL_CLASS =
  'rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-colors hover:bg-black/75 disabled:opacity-50';
/** Avatar actions: one size, so Change and Remove line up as a pair. */
const IMAGE_BUTTON_CLASS =
  'min-h-9 rounded-xl border px-3.5 text-sm font-semibold transition-colors disabled:opacity-50';

/** The backend's own 4xx messages (format, size, invalid image) are
 * already user-facing; anything else becomes one generic line. */
function friendlyImageError(error: unknown, action: 'upload' | 'remove'): string {
  if (error instanceof ApiRequestError && error.status >= 400 && error.status < 500) {
    return error.body.message;
  }
  return action === 'upload'
    ? "Couldn't upload that image. Please try again."
    : "Couldn't remove that image. Please try again.";
}

function friendlyEditError(message: string | null): string {
  if (!message) return "Couldn't save your changes right now. Please try again.";
  if (/network/i.test(message)) {
    return 'Network error - check your connection and try again.';
  }
  if (/username is already taken|already used by a polymarket trader|couldn't verify username with polymarket/i.test(message)) {
    return message;
  }
  return "Couldn't save your changes right now. Please try again.";
}
