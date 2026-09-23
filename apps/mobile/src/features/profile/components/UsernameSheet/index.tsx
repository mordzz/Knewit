import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Platform, Pressable, TextInput, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { useHandleAvailability } from '@/features/profile/hooks/useHandleAvailability';
import { colors, solidPanel, typography } from '@/theme';

export const HANDLE_MIN_LENGTH = 3;
export const HANDLE_MAX_LENGTH = 20;

/** What a username may contain — anything else is converted or dropped
 * while typing, so the field can never hold an invalid character. */
export function sanitizeHandle(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, HANDLE_MAX_LENGTH);
}

export interface UsernameSheetProps {
  currentHandle: string;
  saving: boolean;
  errorMessage: string | null;
  /** Distance from the bottom of this screen's content to the top of the
   * keyboard — the panel docks right on top of the keyboard, whatever
   * its height is on this phone. */
  bottomOffset: number;
  onSave: (handle: string) => void;
  onClose: () => void;
}

/**
 * "Change username" panel. Docks directly on top of the keyboard (its
 * height is read from the real keyboard, so it fits every phone) with
 * one large field, the rules shown as a live checklist, and full-width
 * buttons. Mount it only while open — it focuses the field on mount.
 */
export function UsernameSheet({
  currentHandle,
  saving,
  errorMessage,
  bottomOffset,
  onSave,
  onClose,
}: UsernameSheetProps) {
  const inputRef = useRef<TextInput>(null);
  const [value, setValue] = useState(currentHandle);
  const [focused, setFocused] = useState(false);

  // Closing the panel (Cancel, backdrop, or a successful save) also closes
  // the keyboard, instead of leaving it up with focus jumping elsewhere.
  useEffect(() => () => Keyboard.dismiss(), []);

  const lengthOk = value.length >= HANDLE_MIN_LENGTH && value.length <= HANDLE_MAX_LENGTH;
  const unchanged = value === currentHandle;
  const availability = useHandleAvailability(value, currentHandle);
  const isTaken = availability.result?.available === false;
  // Wait for the check before allowing a save, and never save a name the
  // server already said is taken. An unverified result ("couldn't check")
  // still allows saving — the save itself re-checks.
  const canSave = lengthOk && !unchanged && !saving && !availability.isChecking && !isTaken;

  const submit = () => {
    if (!canSave) return;
    // Drop focus first: if the field still has focus when the panel
    // unmounts after saving, Android hands it to the next field (Name)
    // and keeps the keyboard up.
    inputRef.current?.blur();
    Keyboard.dismiss();
    onSave(value);
  };

  return (
    <View
      className="absolute left-0 right-0 top-0"
      style={{ bottom: bottomOffset }}
      pointerEvents="box-none"
    >
      <Pressable
        className="flex-1 bg-overlay"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      />
      <View
        className="gap-4 px-5 pb-4 pt-3"
        style={[
          solidPanel,
          { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomWidth: 0 },
        ]}
      >
        <View className="h-1 w-9 self-center rounded-full bg-white/20" />

        <View className="gap-1">
          <Text variant="heading">Change username</Text>
          <Text variant="caption" color="textSecondary">
            People use your username to find and mention you.
          </Text>
        </View>

        {/* The whole box focuses the field, so it's easy to hit. */}
        <Pressable
          onPress={() => inputRef.current?.focus()}
          className={`min-h-14 flex-row items-center gap-1 rounded-xl border-2 bg-surface-elevated pl-4 pr-2 ${
            focused ? 'border-accent' : 'border-border'
          }`}
          accessibilityRole="none"
        >
          <Text variant="title" color="textTertiary">
            @
          </Text>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={(text) => setValue(sanitizeHandle(text))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={submit}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            // Android's plain keyboard keeps suggesting (and inserting)
            // dictionary words; this variant is plain text without them.
            keyboardType={Platform.OS === 'android' ? 'visible-password' : 'default'}
            returnKeyType="done"
            maxLength={HANDLE_MAX_LENGTH}
            placeholder="username"
            placeholderTextColor={colors.textTertiary}
            selectionColor={colors.accent}
            className="flex-1 py-3 text-text-primary"
            style={{ fontFamily: typography.family.semibold, fontSize: 18 }}
            accessibilityLabel="New username"
          />
          {value.length > 0 ? (
            <Pressable
              onPress={() => {
                setValue('');
                inputRef.current?.focus();
              }}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Clear username"
            >
              <Icon name="close-circle" size={20} color="textTertiary" />
            </Pressable>
          ) : null}
        </Pressable>

        <View className="gap-2">
          <Rule
            ok={lengthOk}
            text={`${HANDLE_MIN_LENGTH}–${HANDLE_MAX_LENGTH} characters`}
            trailing={`${value.length}/${HANDLE_MAX_LENGTH}`}
          />
          <Rule ok text="Letters, numbers and _ only — spaces become _ automatically" />
          {lengthOk && !unchanged ? <AvailabilityRow availability={availability} /> : null}
        </View>

        {errorMessage ? (
          <View className="flex-row items-center gap-2 rounded-lg bg-danger/10 px-3 py-2.5">
            <Icon name="alert-circle-outline" size={18} color="danger" />
            <Text variant="caption" color="danger" className="flex-1">
              {errorMessage}
            </Text>
          </View>
        ) : null}

        <View className="flex-row gap-3">
          <Button
            label="Cancel"
            variant="secondary"
            onPress={onClose}
            disabled={saving}
            className="min-h-12 flex-1"
          />
          <Button
            label={unchanged ? 'No changes' : saving ? 'Saving…' : 'Save username'}
            onPress={submit}
            disabled={!canSave}
            loading={saving}
            className="min-h-12 flex-1"
            accessibilityLabel="Save username"
          />
        </View>
      </View>
    </View>
  );
}

function AvailabilityRow({
  availability,
}: {
  availability: ReturnType<typeof useHandleAvailability>;
}) {
  if (availability.isChecking) {
    return (
      <View className="flex-row items-center gap-2">
        <View className="h-[18px] w-[18px] items-center justify-center">
          <ActivityIndicator size="small" color={colors.textTertiary} />
        </View>
        <Text variant="caption" color="textSecondary" className="flex-1">
          Checking if it&apos;s available…
        </Text>
      </View>
    );
  }
  const result = availability.result;
  if (availability.failed || result?.available == null) {
    return (
      <View className="flex-row items-center gap-2">
        <Icon name="alert-circle-outline" size={18} color="textTertiary" />
        <Text variant="caption" color="textSecondary" className="flex-1">
          {result?.message ??
            "Couldn't check this username right now. You can still try to save it."}
        </Text>
      </View>
    );
  }
  return result.available ? (
    <Rule ok text="Username is available" />
  ) : (
    <Rule ok={false} bad text={result.message} />
  );
}

function Rule({
  ok,
  bad = false,
  text,
  trailing,
}: {
  ok: boolean;
  /** A hard failure (e.g. taken), shown red — not just "not met yet". */
  bad?: boolean;
  text: string;
  trailing?: string;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon
        name={ok ? 'checkmark-circle' : bad ? 'close-circle' : 'ellipse-outline'}
        size={18}
        color={ok ? 'yes' : bad ? 'danger' : 'textTertiary'}
      />
      <Text
        variant="caption"
        color={ok ? 'textPrimary' : bad ? 'danger' : 'textSecondary'}
        className="flex-1"
      >
        {text}
      </Text>
      {trailing ? (
        <Text variant="caption" color="textTertiary">
          {trailing}
        </Text>
      ) : null}
    </View>
  );
}
