import type { ReactNode } from 'react';
import { SOLID_PANEL_CLASS } from '@/components/ui/solidPanel';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Web equivalent of `apps/mobile/src/components/ui/Modal`  a centered
 * dialog sharing the same solid surface as `BottomSheet`: absolute black
 * (`bg-background`) with the glass *edge* only (faint white border plus a
 * brighter top edge), instead of the old translucent `GlassSurface`.
 * Non-overlay panels stay glass  see docs/DECISIONS.md ("BottomSheet &
 * Modal Solid Black + Glass Border").
 */
export function Modal({ visible, onClose, children }: ModalProps) {
  if (!visible) return null;

  return (
    // `absolute`, not `fixed`  resolves against the app shell's own
    // `relative` frame (`app/(app)/layout.tsx`) so the backdrop covers
    // just that bordered column, not the full browser viewport, same
    // as every other overlay in this app.
    <div
      className="absolute inset-0 z-50 flex items-center lg:fixed justify-center bg-overlay p-6"
      onClick={onClose}
      role="presentation"
    >
      <div className="w-full max-w-[420px]" onClick={(e) => e.stopPropagation()}>
        <div className={`rounded-2xl ${SOLID_PANEL_CLASS} p-6`}>{children}</div>
      </div>
    </div>
  );
}
