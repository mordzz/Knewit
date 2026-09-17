'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IoClose } from 'react-icons/io5';
import { apiRequest } from '@/lib/apiClient';
import type { UpdateProfileInput, UserProfile } from '@/types/social';

const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_BIO_LENGTH = 160;

/**
 * Web port of `apps/frontend`'s `EditProfileScreen` — only
 * `displayName`/`bio` are editable (docs/DECISIONS.md, "Edit Profile
 * Scope"): no username rename or avatar upload anywhere in this
 * codebase yet. Seeds the form from the fetched profile the same
 * "derived state during render, guarded by id" way the mobile screen
 * does (see its own comment) rather than a `useEffect` + `setState`,
 * which this project's lint config specifically discourages anyway.
 */
export default function EditProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => apiRequest<UserProfile>('/api/users/me'),
  });

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [seededFor, setSeededFor] = useState<string | null>(null);

  if (profileQuery.data && seededFor !== profileQuery.data.id) {
    setDisplayName(profileQuery.data.displayName);
    setBio(profileQuery.data.bio ?? '');
    setSeededFor(profileQuery.data.id);
  }

  const mutation = useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      apiRequest<UserProfile>('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile', 'me'], updated);
      router.push('/profile');
    },
  });

  const trimmedName = displayName.trim();
  const isValid =
    trimmedName.length > 0 &&
    displayName.length <= MAX_DISPLAY_NAME_LENGTH &&
    bio.length <= MAX_BIO_LENGTH;
  const canSave = isValid && !mutation.isPending;

  return (
    <main className="w-full px-4 pb-8 pt-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.back()} aria-label="Cancel">
          <IoClose size={24} />
        </button>
        <h1 className="text-xl font-bold">Edit Profile</h1>
        <span className="w-6" />
      </div>

      <div className="mt-6 flex flex-col gap-1">
        <label className="text-sm text-text-secondary" htmlFor="displayName">
          Display name
        </label>
        <input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          className="min-h-12 rounded-md border border-border bg-surface-elevated px-3 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <p className="text-right text-xs text-text-tertiary">
          {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
        </p>
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <label className="text-sm text-text-secondary" htmlFor="bio">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell people about yourself"
          rows={3}
          className="min-h-20 rounded-md border border-border bg-surface-elevated px-3 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <p className="text-right text-xs text-text-tertiary">
          {bio.length}/{MAX_BIO_LENGTH}
        </p>
      </div>

      {mutation.isError ? (
        <p className="mt-2 text-sm text-danger">
          Couldn&apos;t save your changes right now. Please try again.
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => mutation.mutate({ displayName: trimmedName, bio: bio.trim() })}
        disabled={!canSave}
        className="mt-4 w-full rounded-md border border-white/15 bg-accent py-3 font-semibold text-text-inverse disabled:opacity-50"
      >
        {mutation.isPending ? 'Saving…' : 'Save'}
      </button>
    </main>
  );
}
