import { useRef } from 'react';
import {
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { colors } from '@/theme';
import { cn } from '@/utils/cn';

export interface CodeInputProps {
  /** Current code (digits only, up to `length`). */
  value: string;
  onChange: (value: string) => void;
  /** Number of boxes  6 for Privy's email OTP. */
  length?: number;
  disabled?: boolean;
}

/**
 * Segmented one-time-code input: one box per digit, auto-advance on
 * entry/paste, backspace steps back, and `textContentType="oneTimeCode"` /
 * `autoComplete="one-time-code"` let iOS/Android offer the email code.
 * Digits only; non-digit input is ignored. Built for the sign-in screen's
 * dedicated OTP step (docs/DECISIONS.md, "Dedicated OTP Step on
 * Sign-In")  no external OTP/input dependency.
 */
export function CodeInput({ value, onChange, length = 6, disabled }: CodeInputProps) {
  const inputsRef = useRef<(TextInput | null)[]>([]);

  const focusIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, length - 1));
    inputsRef.current[clamped]?.focus();
  };

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      // Some keyboards report the cleared box as an empty change  treat
      // it as a single-character delete and step back, so backspace feels
      // like one continuous motion.
      if (value[index]) {
        onChange(value.slice(0, index) + value.slice(index + 1));
        focusIndex(index - 1);
      }
      return;
    }
    const next = (value.slice(0, index) + digits + value.slice(index + digits.length)).slice(
      0,
      length
    );
    onChange(next);
    focusIndex(index + digits.length);
  };

  const handleKeyPress = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>
  ) => {
    if (event.nativeEvent.key !== 'Backspace') return;
    if (value[index]) return; // the change handler already deletes this digit
    if (index > 0) {
      onChange(value.slice(0, index - 1) + value.slice(index));
      focusIndex(index - 1);
    }
  };

  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length }, (_, index) => (
        <TextInput
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          value={value[index] ?? ''}
          onChangeText={(text) => handleChange(index, text)}
          onKeyPress={(event) => handleKeyPress(index, event)}
          editable={!disabled}
          keyboardType="number-pad"
          textContentType={index === 0 ? 'oneTimeCode' : 'none'}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          accessibilityLabel={`Digit ${index + 1}`}
          placeholderTextColor={colors.textTertiary}
          className={cn(
            'h-12 w-10 rounded-md border border-white/15 bg-white/10 text-center text-lg font-semibold text-text-primary',
            disabled && 'opacity-50'
          )}
        />
      ))}
    </View>
  );
}
