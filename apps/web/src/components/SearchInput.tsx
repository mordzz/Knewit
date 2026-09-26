import { Icon } from '@/components/ui/Icon';

export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

/**
 * Web equivalent of `apps/mobile/src/features/search/components/SearchInput`
 *  a search field matching the app's standard `Input` recipe (same
 * `min-h-12 rounded-md border-border bg-surface-elevated` surface, not a
 * one-off pill), with a leading search icon and a trailing clear button
 * that only appears once there's text to clear.
 */
export function SearchInput({ value, onChangeText, onSubmit, placeholder = 'Search markets or people' }: SearchInputProps) {
  return (
    <div className="flex min-h-12 items-center gap-2 rounded-md border border-border bg-surface-elevated px-3">
      <Icon name="search" size={18} color="textSecondary" />
      <input
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        autoCorrect="off"
        autoCapitalize="none"
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit?.();
        }}
        aria-label="Search markets or people"
        className="flex-1 bg-transparent text-body text-text-primary placeholder:text-text-tertiary focus:outline-none"
      />
      {value.length > 0 ? (
        <button
          type="button"
          onClick={() => onChangeText('')}
          aria-label="Clear search"
          className="flex-shrink-0"
        >
          <Icon name="close" size={18} color="textSecondary" />
        </button>
      ) : null}
    </div>
  );
}
