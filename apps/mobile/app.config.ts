import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Knew it',
  slug: 'knewit',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  // Required for Google/X OAuth sign-in (Privy's `useLoginWithOAuth`) to
  // redirect back into this app after the browser auth step — Expo's
  // `Linking.createURL`, which Privy's SDK calls internally, needs a
  // custom scheme to build that redirect URL on a standalone/dev-client
  // build (this app hasn't used Expo Go since Sprint 6's dev-client
  // requirement — see docs/WALLET.md). No effect on the existing
  // email-OTP flow, which never leaves the app.
  scheme: 'knewit',
  ios: {
    bundleIdentifier: 'com.dzakaal10.knewit', // Disarankan tambahkan juga untuk iOS
  },
  android: {
    package: 'com.dzakaal10.knewit', // <-- Ditambahkan di sini
    adaptiveIcon: {
      backgroundColor: '#FFE506',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-font',
    'expo-secure-store',
    'expo-web-browser',
    // Profile avatar/banner picking — the config plugin supplies the iOS
    // photo/camera usage strings on the next `expo prebuild`.
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow Knewit to choose a profile photo or banner from your library.',
        cameraPermission: 'Allow Knewit to take a profile photo or banner with the camera.',
      },
    ],
  ],
  extra: {
    eas: {
      projectId: 'd3336eb9-d7c1-4503-bdd6-3a424c3652d4',
    },
  },
};

export default config;
