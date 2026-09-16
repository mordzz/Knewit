// Polyfills the Privy Expo SDK needs (APIs it assumes exist that React
// Native doesn't provide) — must load before anything that might import
// `@privy-io/expo` transitively, so first in the file, before even
// `global.css` — see docs/WALLET.md.
import 'fast-text-encoding';
import 'react-native-get-random-values';
import '@ethersproject/shims';
import './global.css';
import '@/app/config/nativewindInterop';
import { StatusBar } from 'expo-status-bar';
// Deliberately NOT `from '@expo-google-fonts/inter'` (the package root) —
// that barrel file unconditionally requires all 18 weight/style font
// files as a side effect of import, so Metro bundles every one of them
// even though only 5 are ever used. Each weight's own subpath only
// requires its own file — see docs/DECISIONS.md.
import { useFonts } from '@expo-google-fonts/inter/useFonts';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { AppProviders } from '@/app/providers/AppProviders';
import { RootNavigator } from '@/app/navigation/RootNavigator';

export default function App() {
  const [, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // Deliberately does NOT block rendering on `fontsLoaded` — an earlier
  // version returned null until fonts were ready, which meant any font
  // load failure (network hiccup, asset resolution issue, anything)
  // left the app on a permanent blank white screen with no way to
  // recover. Text renders in the system font for one frame and swaps to
  // Inter once loaded instead — a minor flash beats a hard, silent
  // failure mode. See docs/DECISIONS.md.
  if (fontError && __DEV__) {
    console.warn('[fonts] Inter failed to load, falling back to system font', fontError);
  }

  return (
    <AppProviders>
      <RootNavigator />
      <StatusBar style="light" />
    </AppProviders>
  );
}
