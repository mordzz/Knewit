import { useState } from 'react';
import { View, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';

export interface WalletAddressProps {
  address: string;
  /** Compact renders inline (e.g. inside WalletCard); default is a row
   * with its own copy affordance and feedback line. */
  compact?: boolean;
}

function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * The single place that formats and copies a wallet address — never
 * renders anything but the public address itself (see docs/WALLET.md
 * "Do Not Store Secrets"). The full, unshortened address is always what
 * gets copied and what screen readers hear, even though the visible
 * label is shortened.
 */
export function WalletAddress({ address, compact = false }: WalletAddressProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(address);
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2000);
    }
  };

  return (
    <View className={compact ? 'flex-row items-center gap-2' : 'gap-1'}>
      <Pressable
        onPress={handleCopy}
        className="flex-row items-center gap-2 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={`Wallet address ${address}. Double tap to copy.`}
      >
        <Text variant={compact ? 'bodyStrong' : 'body'}>{shortenAddress(address)}</Text>
        <Icon name={copied ? 'checkmark' : 'layers-outline'} size={16} color="textSecondary" />
      </Pressable>
      {!compact && (copied || copyFailed) ? (
        <Text
          variant="micro"
          color={copyFailed ? 'danger' : 'yes'}
          accessibilityLiveRegion="polite"
        >
          {copyFailed ? "Couldn't copy address" : 'Address copied'}
        </Text>
      ) : null}
    </View>
  );
}
