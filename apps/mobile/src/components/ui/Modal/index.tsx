import { Modal as RNModal, Pressable } from 'react-native';
import { GlassSurface } from '@/components/ui/GlassSurface';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * A centered glass dialog (real glassmorphism, via `GlassSurface`'s
 * default `tone="light"`) — `BottomSheet` is the one surface in the app
 * that stays solid instead; every other panel, including this one, is
 * glass — see docs/DECISIONS.md ("Glassmorphism Restored Outside
 * BottomSheet"). For a bottom-anchored sheet, use
 * `components/ui/BottomSheet` instead.
 */
export function Modal({ visible, onClose, children }: ModalProps) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center bg-overlay p-6"
        onPress={onClose}
        accessibilityLabel="Close"
      >
        <Pressable className="w-full max-w-[420px]" onPress={(e) => e.stopPropagation()}>
          <GlassSurface contentClassName="p-6">{children}</GlassSurface>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
