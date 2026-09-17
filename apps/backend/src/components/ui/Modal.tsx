import type { ReactNode } from 'react';
import { GlassSurface } from '@/components/ui/GlassSurface';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Web equivalent of `apps/mobile/src/components/ui/Modal` — a centered
 * glass dialog. `BottomSheet` is the one surface that stays solid
 * instead; every other panel, including this one, is glass.
 */
export function Modal({ visible, onClose, children }: ModalProps) {
  if (!visible) return null;

  return (
    // `absolute`, not `fixed` — resolves against the app shell's own
    // `relative` frame (`app/(app)/layout.tsx`) so the backdrop covers
    // just that bordered column, not the full browser viewport, same
    // as every other overlay in this app.
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-overlay p-6"
      onClick={onClose}
      role="presentation"
    >
      <div className="w-full max-w-[420px]" onClick={(e) => e.stopPropagation()}>
        <GlassSurface contentClassName="p-6">{children}</GlassSurface>
      </div>
    </div>
  );
}
