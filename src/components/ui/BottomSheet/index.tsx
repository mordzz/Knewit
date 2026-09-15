import { useEffect, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassSurface } from '@/components/ui/GlassSurface';

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
 * need for them exists — see docs/DECISIONS.md. Glass surface (top
 * corners only) — see docs/DESIGN.md.
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
            <GlassSurface
              style={{
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                borderBottomWidth: 0,
              }}
              contentClassName="p-6"
            >
              <SafeAreaView edges={['bottom']}>
                <View className="mb-3 h-1 w-9 self-center rounded-full bg-white/20" />
                {children}
              </SafeAreaView>
            </GlassSurface>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
