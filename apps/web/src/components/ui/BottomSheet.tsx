import { useEffect, type ReactNode } from 'react';
import { SOLID_PANEL_CLASS } from '@/components/ui/solidPanel';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Web equivalent of `apps/mobile/src/components/ui/BottomSheet` — a
 * slide-up sheet anchored to the bottom of the app shell's own frame
 * (`absolute`, not `fixed` — see `Modal`'s comment on why), a CSS
 * transform transition standing in for RN's `Animated.timing`.
 * Solid absolute black (`bg-background`) with the glass *edge* only —
 * a faint white border plus a brighter top edge — the same treatment
 * `Modal` shares; every non-overlay panel stays glass — see
 * docs/DECISIONS.md ("BottomSheet & Modal Solid Black + Glass Border").
 *
 * At `lg:` (desktop) the same component renders as a centered modal
 * instead — a viewport-fixed backdrop with a fade/scale panel that also
 * closes on Escape. Phone rendering is unchanged.
 */
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [visible, onClose]);

  return (
    <div
      className={`absolute inset-0 z-50 flex items-end bg-overlay lg:fixed lg:items-center lg:justify-center lg:p-6 transition-opacity duration-[250ms] ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`w-full rounded-t-[20px] ${SOLID_PANEL_CLASS} border-b-0 p-6 transition-transform duration-[250ms] lg:max-h-[85vh] lg:max-w-[460px] lg:overflow-y-auto lg:rounded-2xl lg:border-b ${
          visible ? 'translate-y-0 lg:scale-100' : 'translate-y-full lg:translate-y-0 lg:scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 h-1 w-9 self-center rounded-full bg-white/20 lg:hidden" />
        {children}
      </div>
    </div>
  );
}
