import { useState } from 'react';
import { View, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CategoryCard } from '@/features/search/components/CategoryCard';
import { KNOWN_CATEGORIES } from '@/types/common';
import { spacing } from '@/theme';
import { cn } from '@/utils/cn';

type SearchScope = 'markets' | 'people';

/**
 * Global discovery: People + Markets search (foundation only — no
 * backend search endpoint exists yet, see docs/API.md), and category
 * discovery cards when there's no query. Selecting a category deep-links
 * into the Markets tab with that category pre-selected.
 */
export function SearchScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('markets');
  const hasQuery = query.trim().length > 0;

  return (
    <Screen className="gap-3 pt-4">
      <Text variant="heading">Search</Text>

      <Input
        placeholder="Search people or markets"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {hasQuery ? (
        <>
          <View className="flex-row gap-2">
            <ScopeChip
              label="Markets"
              active={scope === 'markets'}
              onPress={() => setScope('markets')}
            />
            <ScopeChip
              label="People"
              active={scope === 'people'}
              onPress={() => setScope('people')}
            />
          </View>
          <View className="flex-1">
            <EmptyState
              icon="search"
              title={`Searching ${scope} isn't wired up yet`}
              message="Needs the backend search endpoint (docs/API.md) — the UI is ready for it."
            />
          </View>
        </>
      ) : (
        <FlatList
          data={KNOWN_CATEGORIES}
          keyExtractor={(category) => category}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.sm }}
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
          renderItem={({ item }) => (
            <CategoryCard
              category={item}
              onPress={() =>
                navigation.navigate('Main', { screen: 'MarketsTab', params: { category: item } })
              }
            />
          )}
        />
      )}
    </Screen>
  );
}

function ScopeChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-full border px-3 py-1.5',
        active ? 'border-accent bg-accent-muted' : 'border-border'
      )}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text variant="caption" color={active ? 'accent' : 'textSecondary'}>
        {label}
      </Text>
    </Pressable>
  );
}
