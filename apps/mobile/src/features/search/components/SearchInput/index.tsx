import { TextInput, View, Pressable } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/theme';

export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

/**
 * A search field matching the app's standard `Input` recipe  same
 * `min-h-12 rounded-md border-border bg-surface-elevated` surface, not a
 * one-off pill  with a leading search icon and a trailing clear button
 * that only appears once there's text to clear. Kept feature-local rather
 * than promoted to `components/ui`: nothing else in the app needs an
 * icon+clear-button text field today  see the project's "evidence before
 * promoting to global" convention (docs/DECISIONS.md).
 */
export function SearchInput({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search markets or people',
}: SearchInputProps) {
  return (
    <View className="min-h-12 flex-row items-center gap-2 rounded-md border border-border bg-surface-elevated px-3">
      <Icon name="search" size={18} color="textSecondary" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        onSubmitEditing={() => onSubmit?.()}
        accessibilityLabel="Search markets or people"
        accessibilityHint="Enter a market, topic, or username"
        className="flex-1 text-body text-text-primary"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
        >
          <Icon name="close" size={18} color="textSecondary" />
        </Pressable>
      ) : null}
    </View>
  );
}
