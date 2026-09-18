import { useEffect, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { solidPanel, TABLET_MIN_WIDTH } from '@/theme';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * A foundation-level bottom sheet: slide-up + backdrop, no drag/snap
 * points. Built on the built-in Modal + Animated APIs to avoid pulling in
 * react-native-gesture-handler/reanimated-driven gestures before a real
 * need for them exists — see docs/DECISIONS.md.
 *
 * Deliberately does **not** use `GlassSurface` — the sheet is a solid,
 * opaque panel: absolute black (`colors.background`, #000000) with the
 * *glass edge* recipe (`glass.border` + a brighter `glass.highlight` top
 * edge) instead of a translucent fill; `Modal` now shares the same solid
 * treatment, while every non-overlay card/panel stays real
 * glassmorphism — see docs/DECISIONS.md ("BottomSheet & Modal Solid
 * Black + Glass Border"). Building its own surface directly (rather than
 * adding a `GlassSurface` tone) keeps that scoping explicit in the code,
 * not just in a prop default someone could change later without noticing
 * these surfaces were meant to be solid.
 *
 * **Responsive by design**: from `TABLET_MIN_WIDTH` (768) up it renders
 * as a centered dialog instead of a bottom sheet, and it reads the
 * window size live (`useWindowDimensions`) rather than at module load, so
 * rotating a tablet switches forms correctly (docs/DECISIONS.md,
 * "Overlays Become Centered Dialogs on Tablet/Desktop"). Every sheet in
 * the app consumes this component, so the call sites never need to know
 * which form it takes.
 */
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const { width, height } = useWindowDimensions();
  const isDialog = width >= TABLET_MIN_WIDTH;
  const [translateY] = useState(() => new Animated.Value(Dimensions.get('window').height));

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : height,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, height, translateY]);

  if (isDialog) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable
          className="flex-1 items-center justify-center bg-overlay p-6"
          onPress={onClose}
          accessibilityLabel="Close"
        >
          <Pressable className="w-full max-w-[520px]" onPress={(e) => e.stopPropagation()}>
            <View className="p-6" style={[solidPanel, { borderRadius: 16 }]}>
              {children}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end bg-overlay"
        onPress={onClose}
        accessibilityLabel="Close"
      >
        <Animated.View className="w-full" style={{ transform: [{ translateY }] }}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              className="p-6"
              style={[
                solidPanel,
                { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomWidth: 0 },
              ]}
            >
              <SafeAreaView edges={['bottom']}>
                <View className="mb-3 h-1 w-9 self-center rounded-full bg-white/20" />
                {children}
              </SafeAreaView>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
