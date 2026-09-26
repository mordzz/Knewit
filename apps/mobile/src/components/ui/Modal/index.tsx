import { Modal as RNModal, Pressable, View } from 'react-native';
import { solidPanel } from '@/theme';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * A centered dialog sharing the same solid surface as `BottomSheet`:
 * absolute black (`colors.background`, #000000) with the glass *edge*
 * recipe (`glass.border` + a brighter `glass.highlight` top edge). It no
 * longer uses `GlassSurface`  non-overlay cards/panels stay real
 * glassmorphism  see docs/DECISIONS.md ("BottomSheet & Modal Solid
 * Black + Glass Border"). For a bottom-anchored sheet, use
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
          <View className="p-6" style={[solidPanel, { borderRadius: 16 }]}>
            {children}
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
