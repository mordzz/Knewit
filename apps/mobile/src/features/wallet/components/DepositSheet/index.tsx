import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCodeStyled from 'react-native-qrcode-styled';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Text } from '@/components/ui/Text';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { useCryptoDeposit } from '@/features/wallet/hooks/useCryptoDeposit';
import { formatUsd } from '@/utils/formatCurrency';
import { colors } from '@/theme';
import { env } from '@/app/config/env';

type Mode = 'bridge' | 'direct';
type BridgeNetwork = 'evm' | 'svm' | 'btc' | 'tron';

/** How each Polymarket bridge address is presented. Minimums come from
 * the bridge's own /supported-assets (Polygon $2; other chains ~$3+). */
const BRIDGE_NETWORKS: Record<
  BridgeNetwork,
  { tab: string; label: string; send: string; networks: string; minimum: string }
> = {
  evm: {
    tab: 'EVM',
    label: 'EVM address',
    send: 'USDC, USDT, DAI or ETH',
    networks: 'Polygon, Ethereum, Base, Arbitrum, Optimism, BNB Chain and more',
    minimum: 'Minimum $2 on Polygon, about $3 or more on other networks.',
  },
  svm: {
    tab: 'Solana',
    label: 'Solana address',
    send: 'USDC or SOL',
    networks: 'Solana',
    minimum: 'Minimum about $3.',
  },
  btc: {
    tab: 'Bitcoin',
    label: 'Bitcoin address',
    send: 'BTC',
    networks: 'Bitcoin',
    minimum: 'Minimum about $9 — Bitcoin deposits take longer to confirm.',
  },
  tron: {
    tab: 'Tron',
    label: 'Tron address',
    send: 'USDT',
    networks: 'Tron',
    minimum: 'Minimum about $3.',
  },
};

export interface DepositSheetProps {
  visible: boolean;
  onClose: () => void;
  /** The screen's existing card/bank flow (Privy funding + MoonPay). */
  onBuyWithCard: () => void;
}

/**
 * Deposit entry point: choose "Deposit crypto" or "Buy with card". Crypto
 * goes through Polymarket's bridge (USDC/USDT/… on many networks, bridged
 * to USDC.e with gas paid by Polymarket) or straight to the Deposit Wallet
 * as USDC.e on Polygon (no minimum). Arrivals are wrapped into pUSD
 * trading balance automatically (`useCryptoDeposit`).
 */
export function DepositSheet({ visible, onClose, onBuyWithCard }: DepositSheetProps) {
  // With card deposits off there's nothing to choose — go straight to crypto.
  const initialView = env.cardDepositEnabled ? 'choose' : 'crypto';
  const [view, setView] = useState<'choose' | 'crypto'>(initialView);

  const close = () => {
    onClose();
    setView(initialView);
  };

  return (
    <BottomSheet visible={visible} onClose={close}>
      {view === 'choose' ? (
        <View className="gap-3">
          <Text variant="heading">Deposit</Text>
          <Text variant="caption" color="textSecondary">
            Choose how you&apos;d like to add funds.
          </Text>
          <DepositOption
            icon="wallet-outline"
            title="Deposit crypto"
            description="Send USDC, USDT and more from an exchange or wallet, on Polygon or other networks."
            onPress={() => setView('crypto')}
          />
          <DepositOption
            icon="add-circle-outline"
            title="Buy with card"
            description="Pay by card or bank through MoonPay. Converted to trading balance automatically."
            onPress={() => {
              close();
              onBuyWithCard();
            }}
          />
        </View>
      ) : (
        <CryptoDepositView
          onBack={env.cardDepositEnabled ? () => setView('choose') : undefined}
          onDone={close}
          active={visible}
        />
      )}
    </BottomSheet>
  );
}

function DepositOption({
  icon,
  title,
  description,
  onPress,
}: {
  icon: IconName;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="min-h-16 flex-row items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-4 active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Icon name={icon} color="accent" />
      <View className="flex-1 gap-0.5">
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" color="textSecondary">
          {description}
        </Text>
      </View>
      <Icon name="chevron-forward" size={18} color="textTertiary" />
    </Pressable>
  );
}

function CryptoDepositView({
  active,
  onBack,
  onDone,
}: {
  active: boolean;
  /** Absent when crypto is the only deposit option (nothing to go back to). */
  onBack?: () => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<Mode>('bridge');
  const [network, setNetwork] = useState<BridgeNetwork>('evm');
  const [copied, setCopied] = useState(false);
  const deposit = useCryptoDeposit(active);
  const bridge = deposit.info?.bridge ?? null;
  // The bridge being unreachable leaves USDC.e direct as the only route.
  const effectiveMode: Mode = bridge ? mode : 'direct';
  const availableNetworks = (Object.keys(BRIDGE_NETWORKS) as BridgeNetwork[]).filter((key) =>
    Boolean(bridge?.[key])
  );
  const address =
    effectiveMode === 'bridge'
      ? (bridge?.[network] ?? null)
      : (deposit.info?.usdcE.address ?? null);
  const route = BRIDGE_NETWORKS[network];

  const copy = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-2">
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Icon name="chevron-back" size={22} />
          </Pressable>
        ) : null}
        <Text variant="heading">Deposit crypto</Text>
      </View>

      {bridge ? (
        <Segmented
          options={[
            { key: 'bridge', label: 'Any network' },
            { key: 'direct', label: 'USDC.e on Polygon' },
          ]}
          value={effectiveMode}
          onChange={(key) => setMode(key as Mode)}
        />
      ) : null}

      {effectiveMode === 'bridge' && availableNetworks.length > 1 ? (
        <View className="flex-row flex-wrap gap-2">
          {availableNetworks.map((key) => {
            const selected = key === network;
            return (
              <Pressable
                key={key}
                onPress={() => setNetwork(key)}
                className={`min-h-9 justify-center rounded-full border px-4 ${
                  selected ? 'border-accent bg-accent/15' : 'border-border bg-surface-elevated'
                }`}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={BRIDGE_NETWORKS[key].tab}
              >
                <Text
                  variant="caption"
                  color={selected ? 'accent' : 'textSecondary'}
                  className="font-semibold"
                >
                  {BRIDGE_NETWORKS[key].tab}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View className="flex-row items-start gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2.5">
        <Icon name="alert-circle-outline" size={18} color="accent" />
        <Text variant="caption" color="textPrimary" className="flex-1">
          {effectiveMode === 'bridge' ? (
            <>
              Send{' '}
              <Text variant="caption" className="font-bold">
                {route.send}
              </Text>{' '}
              on {route.networks}. It&apos;s converted to your trading balance automatically.{' '}
              {route.minimum} Smaller amounts aren&apos;t converted.
            </>
          ) : (
            <>
              Send only{' '}
              <Text variant="caption" className="font-bold">
                USDC.e
              </Text>{' '}
              on the{' '}
              <Text variant="caption" className="font-bold">
                Polygon
              </Text>{' '}
              network. No minimum. Other tokens or networks sent here can be lost.
            </>
          )}
        </Text>
      </View>

      {address ? (
        <>
          <View className="items-center">
            <View className="overflow-hidden rounded-2xl bg-white p-3">
              <QRCodeStyled
                data={address}
                pieceSize={5}
                color="#000000"
                style={{ backgroundColor: 'white' }}
              />
            </View>
          </View>

          <Pressable
            onPress={copy}
            className="flex-row items-center gap-3 rounded-xl border border-border bg-surface-elevated px-4 py-3 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel="Copy deposit address"
          >
            <View className="flex-1 gap-0.5">
              <Text variant="micro" color="textTertiary">
                {effectiveMode === 'bridge'
                  ? `Your ${route.label}`
                  : 'Your USDC.e address (Polygon)'}
              </Text>
              <Text variant="caption" color="textPrimary" style={{ fontFamily: 'monospace' }}>
                {address}
              </Text>
            </View>
            <Text variant="caption" color={copied ? 'yes' : 'accent'} className="font-semibold">
              {copied ? 'Copied' : 'Copy'}
            </Text>
          </Pressable>
        </>
      ) : deposit.status === 'error' ? (
        <Text variant="caption" color="danger">
          Your deposit address isn&apos;t ready yet. Close this and try again in a moment.
        </Text>
      ) : (
        <View className="items-center py-10">
          <ActivityIndicator color={colors.textSecondary} />
        </View>
      )}

      <DepositStatus
        status={deposit.status}
        message={deposit.message}
        convertedAmount={deposit.convertedAmount}
        autoConvert={deposit.info?.autoConvert ?? false}
      />

      <View className="flex-row gap-3">
        <Button
          label={deposit.isChecking ? 'Checking…' : 'Check now'}
          variant="secondary"
          onPress={deposit.checkNow}
          disabled={deposit.isChecking || deposit.status === 'converting'}
          className="min-h-12 flex-1"
        />
        <Button label="Done" onPress={onDone} className="min-h-12 flex-1" />
      </View>
    </View>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <View className="flex-row rounded-xl border border-border bg-surface-elevated p-1">
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            className={`min-h-10 flex-1 items-center justify-center rounded-lg px-2 ${selected ? 'bg-accent' : ''}`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
          >
            <Text
              variant="bodyStrong"
              color={selected ? 'textInverse' : 'textSecondary'}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function DepositStatus({
  status,
  message,
  convertedAmount,
  autoConvert,
}: {
  status: ReturnType<typeof useCryptoDeposit>['status'];
  message: string | null;
  convertedAmount: number | null;
  autoConvert: boolean;
}) {
  if (status === 'converted') {
    return (
      <StatusRow icon="checkmark-circle" color="yes">
        {convertedAmount != null ? `${formatUsd(convertedAmount)} added` : 'Deposit added'} to your
        trading balance.
      </StatusRow>
    );
  }
  if (status === 'converting') {
    return <StatusRow spinner>Deposit received — converting it to your trading balance…</StatusRow>;
  }
  if (status === 'bridging') {
    return (
      <StatusRow spinner>
        Deposit detected — Polymarket is converting it. This usually takes about a minute.
      </StatusRow>
    );
  }
  if (status === 'bridge_failed') {
    return (
      <StatusRow icon="alert-circle-outline" color="accent">
        The bridge couldn&apos;t process your last deposit. Check that the token, network and amount
        are supported, then contact support if the funds don&apos;t return.
      </StatusRow>
    );
  }
  if (status === 'processing') {
    return (
      <StatusRow icon="time-outline" color="accent">
        {message}
      </StatusRow>
    );
  }
  if (status === 'waiting') {
    return (
      <StatusRow spinner>
        Waiting for your deposit. It usually arrives within a minute of sending
        {autoConvert
          ? ' — you can close this, it converts automatically.'
          : ' — keep this open until it lands.'}
      </StatusRow>
    );
  }
  return null;
}

function StatusRow({
  icon,
  color = 'textSecondary',
  spinner = false,
  children,
}: {
  icon?: IconName;
  color?: 'yes' | 'accent' | 'textSecondary';
  spinner?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-5 w-5 items-center justify-center">
        {spinner ? (
          <ActivityIndicator size="small" color={colors.textSecondary} />
        ) : icon ? (
          <Icon name={icon} size={18} color={color} />
        ) : null}
      </View>
      <Text
        variant="caption"
        color={color === 'textSecondary' ? 'textSecondary' : 'textPrimary'}
        className="flex-1"
      >
        {children}
      </Text>
    </View>
  );
}
