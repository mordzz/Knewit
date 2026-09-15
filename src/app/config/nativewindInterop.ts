import { SafeAreaView } from 'react-native-safe-area-context';
import { cssInterop } from 'nativewind';

/**
 * NativeWind v4 patches core React Native components (View, Text,
 * Pressable, ScrollView, FlatList, Animated.View, ...) automatically.
 * Third-party components — react-native-safe-area-context's SafeAreaView
 * here — need explicit registration so `className` maps to `style`.
 * Imported once, early, from App.tsx before SafeAreaView is used anywhere.
 */
cssInterop(SafeAreaView, { className: 'style' });
