import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import type { BridgeAsset } from '@/features/wallet/services/walletService';
import { chainsForToken, formatMinimum, tokenSymbols } from '@/features/wallet/utils/bridgeAssets';

const DEFAULT_TOKEN = 'USDC';

/**
 * Token + chain selection over the bridge's `/supported-assets`. Picking a
 * token keeps the chain when that token exists there, else falls back to
 * the token's first chain. `asset` is `null` until the list loads.
 */
export function useAssetSelection(assets: BridgeAsset[]) {
  const tokens = useMemo(() => tokenSymbols(assets), [assets]);
  const [symbol, setSymbol] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);

  const token =
    symbol && tokens.includes(symbol)
      ? symbol
      : tokens.includes(DEFAULT_TOKEN)
        ? DEFAULT_TOKEN
        : (tokens[0] ?? null);
  const chains = useMemo(() => (token ? chainsForToken(assets, token) : []), [assets, token]);
  const asset = chains.find((candidate) => candidate.chainId === chainId) ?? chains[0] ?? null;

  return { tokens, chains, asset, setSymbol, setChainId };
}

type Selection = ReturnType<typeof useAssetSelection>;

/** Label shown above a field (outside its box), as in the wallet sheets. */
export function FieldLabel({ children }: { children: string }) {
  return (
    <Text variant="caption" color="textSecondary" className="mb-1.5">
      {children}
    </Text>
  );
}

interface PickerOption {
  value: string;
  label: string;
  hint?: string;
}

/**
 * Token and Chain dropdowns side by side — the same field as the market
 * detail's Top Holders filter, opening a sheet with the options (chains
 * list their minimum there; the field shows just the value).
 */
export function AssetPicker({ selection }: { selection: Selection }) {
  const { tokens, chains, asset, setSymbol, setChainId } = selection;
  const [open, setOpen] = useState<'token' | 'chain' | null>(null);

  const options: PickerOption[] =
    open === 'token'
      ? tokens.map((symbol) => ({ value: symbol, label: symbol }))
      : chains.map((chain) => ({
          value: chain.chainId,
          label: chain.chainName,
          hint: formatMinimum(chain.minUsd),
        }));
  const selected = open === 'token' ? asset?.symbol : asset?.chainId;

  return (
    <View className="flex-row gap-2">
      <View className="flex-1">
        <FieldLabel>Token</FieldLabel>
        <Field value={asset?.symbol ?? '…'} label="Token" onPress={() => setOpen('token')} />
      </View>
      <View className="flex-1">
        <FieldLabel>Chain</FieldLabel>
        <Field value={asset?.chainName ?? '…'} label="Chain" onPress={() => setOpen('chain')} />
      </View>

      <BottomSheet visible={open != null} onClose={() => setOpen(null)}>
        <Text variant="heading" className="mb-3">
          {open === 'token' ? 'Token' : 'Chain'}
        </Text>
        <ScrollView className="max-h-96" keyboardShouldPersistTaps="handled">
          <View className="gap-2 pb-2">
            {options.map((option) => {
              const active = option.value === selected;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    if (open === 'token') setSymbol(option.value);
                    else setChainId(option.value);
                    setOpen(null);
                  }}
                  className="flex-row items-center gap-3 rounded-xl border border-border p-3 active:opacity-90"
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={option.hint ? `${option.label}, ${option.hint}` : option.label}
                >
                  <Text variant="body" className="flex-1" numberOfLines={1}>
                    {option.label}
                  </Text>
                  {option.hint ? (
                    <Text variant="caption" color="textSecondary">
                      {option.hint}
                    </Text>
                  ) : null}
                  {active ? <Icon name="checkmark" size={16} color="accent" /> : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

function Field({ value, label, onPress }: { value: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3 py-2.5 active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text variant="caption" color="textPrimary" className="flex-1" numberOfLines={1}>
        {value}
      </Text>
      <View style={{ transform: [{ rotate: '90deg' }] }}>
        <Icon name="chevron-forward" size={14} color="textTertiary" />
      </View>
    </Pressable>
  );
}
