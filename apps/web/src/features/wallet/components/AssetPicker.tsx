'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import type { BridgeAsset } from '@/features/wallet/lib/walletService';
import { chainsForToken, formatMinimum, tokenSymbols } from '@/features/wallet/lib/bridgeAssets';

const DEFAULT_TOKEN = 'USDC';

/**
 * Token + chain selection over the bridge's `/supported-assets`. Picking a
 * token keeps the chain when that token exists there, else falls back to the
 * token's first chain. Returns the selected asset (`null` until loaded).
 */
export function useAssetSelection(assets: BridgeAsset[]) {
  const tokens = useMemo(() => tokenSymbols(assets), [assets]);
  const [symbol, setSymbol] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);

  const token = symbol && tokens.includes(symbol) ? symbol : tokens.includes(DEFAULT_TOKEN) ? DEFAULT_TOKEN : (tokens[0] ?? null);
  const chains = useMemo(() => (token ? chainsForToken(assets, token) : []), [assets, token]);
  const asset = chains.find((candidate) => candidate.chainId === chainId) ?? chains[0] ?? null;

  return { tokens, chains, asset, setSymbol, setChainId };
}

type Selection = ReturnType<typeof useAssetSelection>;

/** Label shown above a field (outside its box), as in the wallet sheets. */
export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Text variant="caption" color="textSecondary" className="mb-1.5 block">
      {children}
    </Text>
  );
}

/** Token and Chain dropdowns side by side — the same box as the market
 * detail's Top Holders filter. The box shows just the value; the native
 * list (a transparent select over the box) also shows each chain's minimum. */
export function AssetPicker({ selection }: { selection: Selection }) {
  const { tokens, chains, asset, setSymbol, setChainId } = selection;

  return (
    <div className="grid grid-cols-2 gap-2">
      <SelectField
        label="Token"
        display={asset?.symbol ?? '…'}
        value={asset?.symbol ?? ''}
        onChange={setSymbol}
        options={tokens.map((symbol) => ({ value: symbol, label: symbol }))}
      />
      <SelectField
        label="Chain"
        display={asset?.chainName ?? '…'}
        value={asset?.chainId ?? ''}
        onChange={setChainId}
        options={chains.map((chain) => ({ value: chain.chainId, label: `${chain.chainName} · ${formatMinimum(chain.minUsd)}` }))}
      />
    </div>
  );
}

function SelectField({
  label,
  display,
  value,
  onChange,
  options,
}: {
  label: string;
  display: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3 py-2.5 focus-within:border-accent">
        <Text variant="caption" className="block min-w-0 flex-1 truncate">{display}</Text>
        <Icon name="chevron-down" size={14} color="textTertiary" />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-surface text-text-primary">
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
