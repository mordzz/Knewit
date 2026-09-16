import { useEffect, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

/**
 * A foundation-level bottom sheet: slide-up + backdrop, no drag/snap
 * points. Built on the built-in Modal + Animated APIs to avoid pulling in
 * react-native-gesture-handler/reanimated-driven gestures before a real
 * need for them exists — see docs/DECISIONS.md.
 *
 * Deliberately does **not** use `GlassSurface` — every other card/panel
 * in the app is real glassmorphism (blur + translucency), but this sheet
 * specifically stays a solid, opaque panel (`colors.surfaceElevated` +
 * a plain top border), by request — see docs/DECISIONS.md
 * ("Glassmorphism Restored Outside BottomSheet"). Building its own
 * surface directly (rather than adding a third `GlassSurface` tone)
 * keeps that scoping explicit in the code, not just in a prop default
 * someone could change later without noticing this sheet was meant to
 * be the one exception.
 */
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const [translateY] = useState(() => new Animated.Value(SCREEN_HEIGHT));

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

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
              style={{
                backgroundColor: colors.surfaceElevated,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                borderBottomWidth: 0,
              }}
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
