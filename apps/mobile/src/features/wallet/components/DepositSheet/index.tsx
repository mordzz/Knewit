import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCodeStyled from 'react-native-qrcode-styled';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Text } from '@/components/ui/Text';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import {
  AssetPicker,
  FieldLabel,
  useAssetSelection,
} from '@/features/wallet/components/AssetPicker';
import {
  useCryptoDeposit,
  type CryptoDepositStatus,
} from '@/features/wallet/hooks/useCryptoDeposit';
import { colors } from '@/theme';
import { env } from '@/app/config/env';

export interface DepositSheetProps {
  visible: boolean;
  onClose: () => void;
  /** The screen's card flow (Privy funding + MoonPay). */
  onBuyWithCard: () => void;
}

/**
 * Deposit entry point. With card deposits off it opens straight on crypto;
 * with them on it first asks card or crypto. Crypto goes through the
 * Polymarket bridge: pick a token and chain (`/supported-assets`), send to
 * the address shown, and it arrives as pUSD trading balance.
 */
export function DepositSheet({ visible, onClose, onBuyWithCard }: DepositSheetProps) {
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
          <DepositOption
            icon="wallet-outline"
            title="Crypto"
            description="USDC, USDT and more, on any network."
            onPress={() => setView('crypto')}
          />
          <DepositOption
            icon="add-circle-outline"
            title="Card"
            description="Buy USDC with card or bank via MoonPay."
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
  const deposit = useCryptoDeposit(active);
  const selection = useAssetSelection(deposit.info?.assets ?? []);
  const asset = selection.asset;
  const address = asset ? (deposit.info?.addresses[asset.addressType] ?? null) : null;
  const [copied, setCopied] = useState(false);

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
        <Text variant="heading">Deposit</Text>
      </View>

      {deposit.info ? (
        <>
          <AssetPicker selection={selection} />
          {asset ? (
            <View className="flex-row items-start gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2.5">
              <Icon name="alert-circle-outline" size={18} color="accent" />
              <Text variant="caption" color="textPrimary" className="flex-1">
                Send only{' '}
                <Text variant="caption" className="font-bold">
                  {asset.symbol}
                </Text>{' '}
                on{' '}
                <Text variant="caption" className="font-bold">
                  {asset.chainName}
                </Text>
                .
              </Text>
            </View>
          ) : null}
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
              <View>
                <FieldLabel>Your deposit address</FieldLabel>
                <View className="flex-row items-center gap-3 rounded-xl border border-border bg-surface-elevated py-2.5 pl-3 pr-1.5">
                  <Text
                    variant="caption"
                    color="textPrimary"
                    className="flex-1"
                    style={{ fontFamily: 'monospace' }}
                    selectable
                  >
                    {address}
                  </Text>
                  <Pressable
                    onPress={copy}
                    hitSlop={8}
                    className="h-9 w-9 items-center justify-center rounded-lg active:opacity-70"
                    accessibilityRole="button"
                    accessibilityLabel={copied ? 'Copied' : 'Copy deposit address'}
                  >
                    <Icon
                      name={copied ? 'checkmark' : 'copy-outline'}
                      size={18}
                      color={copied ? 'yes' : 'accent'}
                    />
                  </Pressable>
                </View>
              </View>
            </>
          ) : null}
        </>
      ) : deposit.status === 'error' ? (
        <Text variant="caption" color="danger">
          Address not ready yet. Try again in a moment.
        </Text>
      ) : (
        <View className="items-center py-10">
          <ActivityIndicator color={colors.textSecondary} />
        </View>
      )}

      <DepositStatus status={deposit.status} />

      <View className="flex-row gap-3">
        <Button
          label={deposit.isChecking ? 'Checking…' : 'Check now'}
          variant="secondary"
          onPress={deposit.checkNow}
          disabled={deposit.isChecking}
          className="min-h-12 flex-1"
        />
        <Button label="Done" onPress={onDone} className="min-h-12 flex-1" />
      </View>
    </View>
  );
}

function DepositStatus({ status }: { status: CryptoDepositStatus }) {
  if (status === 'completed') {
    return (
      <StatusRow icon="checkmark-circle" color="yes">
        Deposit added to your balance.
      </StatusRow>
    );
  }
  if (status === 'bridging')
    return <StatusRow spinner>Deposit detected — about a minute.</StatusRow>;
  if (status === 'failed') {
    return (
      <StatusRow icon="alert-circle-outline" color="accent">
        Bridge couldn&apos;t process it. Check the token, chain and amount.
      </StatusRow>
    );
  }
  if (status === 'waiting') {
    return <StatusRow spinner>Waiting for your deposit. You can close this.</StatusRow>;
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
