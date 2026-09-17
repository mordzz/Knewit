'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useProfile } from '@/hooks/useProfile';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';

const MAX_BIO_LENGTH = 160;
const MAX_DISPLAY_NAME_LENGTH = 50;

/**
 * Direct conversion of `apps/mobile`'s `EditProfileScreen` — only
 * `displayName`/`bio` are editable (docs/DECISIONS.md, "Edit Profile
 * Scope"). Seeds the form from the fetched profile the same "derived
 * state during render, guarded by id" way mobile does.
 */
export default function EditProfilePage() {
  const router = useRouter();
  const profile = useProfile();
  const mutation = useUpdateProfile();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [seededFor, setSeededFor] = useState<string | null>(null);

  if (profile.status === 'success' && seededFor !== profile.data.id) {
    setDisplayName(profile.data.displayName);
    setBio(profile.data.bio ?? '');
    setSeededFor(profile.data.id);
  }

  const trimmedName = displayName.trim();
  const isValid = trimmedName.length > 0 && displayName.length <= MAX_DISPLAY_NAME_LENGTH && bio.length <= MAX_BIO_LENGTH;
  const canSave = isValid && !mutation.isPending;

  function handleSave() {
    if (!canSave) return;
    mutation.mutate(
      { displayName: trimmedName, bio: bio.trim() },
      { onSuccess: () => router.push('/profile') }
    );
  }

  return (
    <main className="flex w-full flex-col gap-3 px-4 pb-8 pt-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.back()} aria-label="Cancel">
          <Icon name="close" size={24} />
        </button>
        <Text variant="heading">Edit Profile</Text>
        <span className="w-6" />
      </div>

      <div>
        <Input
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
        />
        <Text variant="micro" color="textTertiary" className="-mt-2 block text-right">
          {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
        </Text>
      </div>

      <div>
        <div className="flex flex-col gap-1">
          <Text variant="caption" color="textSecondary" className="ml-1">
            Bio
          </Text>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people about yourself"
            rows={3}
            className="min-h-20 rounded-md border border-border bg-surface-elevated px-3 py-3 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
        </div>
        <Text variant="micro" color="textTertiary" className="-mt-2 block text-right">
          {bio.length}/{MAX_BIO_LENGTH}
        </Text>
      </div>

      {mutation.isError ? (
        <Text variant="caption" color="danger">
          {friendlyEditError(mutation.error?.message ?? null)}
        </Text>
      ) : null}

      <Button label="Save" onClick={handleSave} disabled={!canSave} loading={mutation.isPending} className="mt-1" />
    </main>
  );
}

function friendlyEditError(message: string | null): string {
  if (!message) return "Couldn't save your changes right now. Please try again.";
  if (/network/i.test(message)) {
    return 'Network error — check your connection and try again.';
  }
  return "Couldn't save your changes right now. Please try again.";
}
