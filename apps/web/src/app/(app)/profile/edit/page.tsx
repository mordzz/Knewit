'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { EditProfileForm } from '@/features/profile/components/EditProfileForm';

/** Full-page profile and account editor. */
export default function EditProfilePage() {
  const router = useRouter();

  return (
    <main className="mx-auto flex w-full max-w-none flex-col gap-3 px-4 pb-8 pt-4 lg:gap-6 lg:px-0 lg:py-10">
      <div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.back()} aria-label="Go back" className="lg:hidden">
            <Icon name="chevron-back" size={24} />
          </button>
          <Text variant="heading" className="block text-4xl font-inter-extrabold lg:text-[42px] lg:tracking-[-0.03em]">
            Profile &amp; Account
          </Text>
        </div>
        <Text variant="caption" color="textSecondary" className="mt-1 hidden lg:block">
          Manage your profile information and account settings.
        </Text>
      </div>

      <EditProfileForm onSaved={() => router.push('/profile')} />
    </main>
  );
}
