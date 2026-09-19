'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IoSearchOutline } from 'react-icons/io5';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { CARD_SURFACE_CLASS } from '@/components/ui/cardSurface';
import { PersonResult } from '@/components/PersonResult';
import { MarketCard } from '@/components/MarketCard';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useDepositFlow } from '@/hooks/useDepositFlow';
import { useSession } from '@/hooks/useSession';
import { useSearch, MIN_QUERY_LENGTH } from '@/hooks/useSearch';
import { useDebounce } from '@/hooks/useDebounce';
import { formatUsd } from '@/lib/formatters';

const SEARCH_DEBOUNCE_MS = 300;
const MAX_PEOPLE = 4;
const MAX_MARKETS = 3;

/**
 * Desktop/tablet-only top bar (`hidden lg:flex`), ported from
 * `apps/dekstop/src/components/knew/app-shell.tsx`'s `<header>` — a
 * search field, balance, and a Deposit button, fixed above the content
 * area (`lg:left-56`, clearing `SideNav`). The search field searches in
 * place: results (same `useSearch` the `/search` page uses) open in a
 * dropdown under the field, and picking one goes straight to that
 * profile/market — it never routes through `/search`.
 */
export function TopHeader() {
  const router = useRouter();
  const { canUseApp, walletConnected } = useSession();
  const balance = useWalletBalance();
  const { isDepositing, depositError, handleDeposit: doDeposit } = useDepositFlow();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);
  const trimmed = query.trim();
  const search = useSearch(debouncedQuery);
  const showDropdown = open && trimmed.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const closeAndClear = () => {
    setOpen(false);
    setQuery('');
  };

  const balanceLabel = balance.data?.usdc != null ? formatUsd(balance.data.usdc) : '—';

  const handleDeposit = () => {
    if (!canUseApp || !walletConnected) {
      router.push('/sign-in');
      return;
    }
    doDeposit();
  };

  const people = search.data?.people.slice(0, MAX_PEOPLE) ?? [];
  const markets = search.data?.markets.slice(0, MAX_MARKETS) ?? [];
  const isSettled = debouncedQuery.trim() === trimmed;

  return (
    <header className="fixed inset-x-0 top-0 z-20 hidden h-16 items-center gap-4 border-b border-border bg-background/95 px-7 backdrop-blur lg:left-56 lg:flex">
      <div ref={searchRef} className="relative w-full max-w-md">
        <label className="flex h-10 w-full items-center gap-2 rounded-md border border-border bg-surface px-3 text-text-tertiary transition-colors focus-within:border-border-strong hover:border-border-strong">
          <IoSearchOutline size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setOpen(false);
                event.currentTarget.blur();
              }
            }}
            placeholder="Search markets, people"
            aria-label="Search markets and people"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-caption text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </label>

        {showDropdown ? (
          <div className={`absolute left-0 right-0 top-full z-30 mt-2 shadow-2xl ${CARD_SURFACE_CLASS}`}>
            <div className="max-h-[70vh] overflow-y-auto">
              {!isSettled || search.isFetching ? (
                <Text variant="caption" color="textTertiary" className="block px-4 py-4">
                  Searching…
                </Text>
              ) : search.isError ? (
                <Text variant="caption" color="danger" className="block px-4 py-4">
                  Couldn&apos;t search right now. Try again.
                </Text>
              ) : people.length === 0 && markets.length === 0 ? (
                <Text variant="caption" color="textTertiary" className="block px-4 py-4">
                  No results for &ldquo;{trimmed}&rdquo;
                </Text>
              ) : (
                <>
                  {people.length > 0 ? (
                    <div>
                      <Text variant="micro" color="textTertiary" className="block px-4 pb-1 pt-3 uppercase">
                        People
                      </Text>
                      {people.map((user) => (
                        <PersonResult
                          key={user.id}
                          user={user}
                          onPress={() => {
                            closeAndClear();
                            router.push(`/profile/${user.id}`);
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                  {markets.length > 0 ? (
                    <div>
                      <Text variant="micro" color="textTertiary" className="block px-4 pb-1 pt-3 uppercase">
                        Markets
                      </Text>
                      {markets.map((item) => (
                        <div key={item.kind === 'market' ? item.market.id : item.group.id} onClickCapture={closeAndClear}>
                          <MarketCard item={item} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="text-right">
          <Text variant="caption" color="textSecondary" className="block">
            Balance
          </Text>
          <Text variant="bodyStrong" className="tabular-nums">
            {balanceLabel}
          </Text>
        </div>
        <Button label="Deposit" loading={isDepositing} onClick={handleDeposit} className="min-h-0 px-4 py-2" />
        {depositError ? (
          <Text variant="caption" color="danger" className="absolute right-7 top-full mt-1">
            {depositError}
          </Text>
        ) : null}
      </div>
    </header>
  );
}
