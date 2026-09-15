import { PropsWithChildren, useEffect, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';

// Wire TanStack Query's connectivity/focus signals to React Native's own
// APIs — by default it assumes a browser (navigator.onLine, window focus
// events), neither of which exist on-device. Module-level: these are
// process-wide singletons, not per-render state.
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected));
  });
});

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

/**
 * Central place to register app-wide providers. A PrivyProvider will be
 * added here once wallet integration is implemented — see docs/WALLET.md.
 */
export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Per docs/ARCHITECTURE.md: prices need a short staleTime,
            // metadata a longer one. This is the conservative default;
            // individual queries override it once they exist.
            staleTime: 30_000,
            retry: 2,
            refetchOnReconnect: true,
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            if (__DEV__) {
              console.warn('[query error]', error);
            }
          },
        }),
      })
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
}
