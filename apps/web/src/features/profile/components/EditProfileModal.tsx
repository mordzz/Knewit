'use client';

import { useEffect } from 'react';
import { SOLID_PANEL_CLASS } from '@/components/ui/solidPanel';
import { EditProfileForm } from '@/features/profile/components/EditProfileForm';

/** Desktop-only popup for Edit Profile; mounted only while open so the
 * form re-seeds from the current profile each time. */
export function EditProfileModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit Profile"
        className={`max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl ${SOLID_PANEL_CLASS} p-5`}
        onClick={(event) => event.stopPropagation()}
      >
        <EditProfileForm onClose={onClose} onSaved={onClose} />
      </div>
    </div>
  );
}
