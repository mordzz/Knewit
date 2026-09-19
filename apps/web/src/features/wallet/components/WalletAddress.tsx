'use client';

import { useState } from 'react';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';

export interface WalletAddressProps {
  address: string;
  compact?: boolean;
  fullOnDesktop?: boolean;
}

function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Web equivalent of `apps/mobile/src/features/wallet/components/WalletAddress`
 * — the single place that formats and copies a wallet address, using
 * the browser's Clipboard API instead of `expo-clipboard`.
 */
export function WalletAddress({ address, compact = false, fullOnDesktop = false }: WalletAddressProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2000);
    }
  };

  return (
    <div className={compact ? 'flex items-center gap-2' : 'flex flex-col gap-1'}>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Wallet address ${address}. Click to copy.`}
        className="flex items-center gap-2 text-left transition-opacity hover:opacity-70"
      >
        <Text variant={compact ? 'bodyStrong' : 'body'} className={fullOnDesktop ? 'lg:hidden' : undefined}>
          {shortenAddress(address)}
        </Text>
        {fullOnDesktop ? (
          <Text variant={compact ? 'bodyStrong' : 'body'} className="hidden break-all lg:block">
            {address}
          </Text>
        ) : null}
        <Icon name={copied ? 'checkmark' : 'layers-outline'} size={16} color="textSecondary" />
      </button>
      {!compact && (copied || copyFailed) ? (
        <Text variant="micro" color={copyFailed ? 'danger' : 'yes'}>
          {copyFailed ? "Couldn't copy address" : 'Address copied'}
        </Text>
      ) : null}
    </div>
  );
}
