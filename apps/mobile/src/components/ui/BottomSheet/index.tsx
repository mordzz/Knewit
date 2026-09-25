import { useEffect, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { solidPanel } from '@/theme';
import { useKeyboardPadding } from '@/hooks/useKeyboardPadding';

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
 */
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const { height } = useWindowDimensions();
  // The sheet is as tall as its content, up to 75% of the screen; past
  // that the content scrolls. Every layer below only shrinks (never
  // grows), so the ScrollView takes its content's height until this cap
  // forces it to scroll.
  // With the keyboard open the sheet sits on top of it (inputs stay
  // visible) and shrinks to the space left above it.
  const keyboard = useKeyboardPadding();
  const maxSheetHeight = Math.min(height * 0.75, height - keyboard - 48);
  const [translateY] = useState(() => new Animated.Value(Dimensions.get('window').height));

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : height,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, height, translateY]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end bg-overlay"
        onPress={onClose}
        accessibilityLabel="Close"
      >
        <Animated.View
          className="w-full"
          style={[
            { maxHeight: maxSheetHeight, marginBottom: keyboard },
            { transform: [{ translateY }] },
          ]}
        >
          <Pressable className="shrink" onPress={(e) => e.stopPropagation()}>
            <View
              className="shrink p-6"
              style={[
                solidPanel,
                { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomWidth: 0 },
              ]}
            >
              <SafeAreaView edges={['bottom']} className="shrink">
                <View className="mb-3 h-1 w-9 self-center rounded-full bg-white/20" />
                <ScrollView
                  className="shrink grow-0"
                  contentContainerStyle={{ paddingBottom: 8 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {children}
                </ScrollView>
              </SafeAreaView>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
