import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Bottom padding that lifts content above the on-screen keyboard.
 *
 * `KeyboardAvoidingView` isn't reliable here: the app runs edge-to-edge on
 * Android (the window no longer resizes for the keyboard), and inside the
 * bottom-tab navigator its own overlap math left inputs half covered. This
 * reads the keyboard height straight from the keyboard events instead.
 *
 * `bottomSpace` is whatever already sits between the content and the
 * screen's bottom edge (e.g. the tab bar) — the keyboard covers that
 * first, so it's subtracted from the padding.
 */
export function useKeyboardPadding(bottomSpace = 0): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // iOS fires the "will" events in time to animate alongside the
    // keyboard; Android only fires the "did" events.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event) =>
      setKeyboardHeight(event.endCoordinates.height)
    );
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return Math.max(0, keyboardHeight - bottomSpace);
}
