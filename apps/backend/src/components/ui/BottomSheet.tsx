import type { ReactNode } from 'react';

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
 * Deliberately solid (`bg-surface-elevated`), not glass — the one
 * exception to this app's glassmorphism, same as mobile.
 */
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  return (
    <div
      className={`absolute inset-0 z-50 flex items-end bg-overlay transition-opacity duration-[250ms] ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`w-full rounded-t-[20px] border border-b-0 border-border bg-surface-elevated p-6 transition-transform duration-[250ms] ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 h-1 w-9 self-center rounded-full bg-white/20" />
        {children}
      </div>
    </div>
  );
}
