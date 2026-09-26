'use client';

import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';

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
 * entry/paste, backspace steps back, arrow keys move between boxes, and
 * `autoComplete="one-time-code"` lets browsers/OSes offer the SMS/email
 * code. Digits only; non-digit input is ignored. Built for the sign-in
 * screen's dedicated OTP step (docs/DECISIONS.md, "Dedicated OTP Step on
 * Sign-In")  no external OTP/input dependency.
 */
export function CodeInput({ value, onChange, length = 6, disabled }: CodeInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const focusIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, length - 1));
    inputsRef.current[clamped]?.focus();
  };

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return;
    const next = (value.slice(0, index) + digits + value.slice(index + digits.length)).slice(0, length);
    onChange(next);
    focusIndex(index + digits.length);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (value[index]) {
        onChange(value.slice(0, index) + value.slice(index + 1));
      } else if (index > 0) {
        onChange(value.slice(0, index - 1) + value.slice(index));
        focusIndex(index - 1);
      }
    } else if (event.key === 'ArrowLeft') {
      focusIndex(index - 1);
    } else if (event.key === 'ArrowRight') {
      focusIndex(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!digits) return;
    onChange(digits);
    focusIndex(digits.length);
  };

  return (
    <div className="flex items-center justify-center gap-2" role="group" aria-label="Verification code">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={value[index] ?? ''}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          className={cn(
            'h-12 w-10 rounded-md border border-white/15 bg-white/10 text-center text-lg font-semibold text-text-primary',
            'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
            disabled && 'opacity-50'
          )}
        />
      ))}
    </div>
  );
}
