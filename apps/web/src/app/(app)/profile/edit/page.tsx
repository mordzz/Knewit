'use client';

import { useRouter } from 'next/navigation';
import { EditProfileForm } from '@/features/profile/components/EditProfileForm';

/** Edit Profile as its own page (phone, or a direct visit); desktop
 * opens the same form as a modal from the Profile page. */
export default function EditProfilePage() {
  const router = useRouter();

  return (
    <main className="w-full px-4 pb-8 pt-4 lg:mx-auto lg:max-w-3xl lg:px-0">
      <EditProfileForm onClose={() => router.back()} onSaved={() => router.push('/profile')} />
    </main>
  );
}
