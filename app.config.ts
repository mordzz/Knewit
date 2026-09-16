import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Knewit',
  slug: 'knewit',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#FDCC03',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  // expo-secure-store/expo-web-browser: required native config for the
  // Privy Expo SDK (session persistence + the OTP/OAuth web flows) — see
  // docs/WALLET.md. Their presence here means this project can no longer
  // run in plain Expo Go; a custom dev client (`npx expo prebuild` /
  // EAS dev build) is required from Sprint 6 onward — see docs/DECISIONS.md.
  plugins: ['expo-font', 'expo-secure-store', 'expo-web-browser'],
};

export default config;
