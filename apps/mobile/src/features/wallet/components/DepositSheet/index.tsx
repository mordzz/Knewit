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

type Token = 'usdc' | 'usdcE';

const TOKEN_LABEL: Record<Token, string> = { usdc: 'USDC', usdcE: 'USDC.e' };

export interface DepositSheetProps {
  visible: boolean;
  onClose: () => void;
  /** The screen's existing card/bank flow (Privy funding + MoonPay). */
  onBuyWithCard: () => void;
}

/**
 * Deposit entry point: choose "Deposit crypto" (send USDC on Polygon to
 * your own address — no card, no provider fees) or "Buy with card". The
 * crypto view shows the right address per token, a QR code, and the live
 * status; arrivals convert to trading balance automatically
 * (`useCryptoDeposit`).
 */
export function DepositSheet({ visible, onClose, onBuyWithCard }: DepositSheetProps) {
  const [view, setView] = useState<'choose' | 'crypto'>('choose');

  const close = () => {
    onClose();
    setView('choose');
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
            description="Send USDC on Polygon from an exchange or wallet. Low fees, no minimum."
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
        <CryptoDepositView onBack={() => setView('choose')} onDone={close} active={visible} />
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
  onBack: () => void;
  onDone: () => void;
}) {
  const [token, setToken] = useState<Token>('usdc');
  const [copied, setCopied] = useState(false);
  const deposit = useCryptoDeposit(active);
  const address = deposit.info ? deposit.info[token].address : null;

  const copy = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon name="chevron-back" size={22} />
        </Pressable>
        <Text variant="heading">Deposit crypto</Text>
      </View>

      {/* Token choice — each token has its own address. */}
      <View className="flex-row rounded-xl border border-border bg-surface-elevated p-1">
        {(['usdc', 'usdcE'] as Token[]).map((option) => {
          const selected = option === token;
          return (
            <Pressable
              key={option}
              onPress={() => setToken(option)}
              className={`min-h-10 flex-1 items-center justify-center rounded-lg ${selected ? 'bg-accent' : ''}`}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={TOKEN_LABEL[option]}
            >
              <Text variant="bodyStrong" color={selected ? 'textInverse' : 'textSecondary'}>
                {option === 'usdc' ? 'USDC (recommended)' : 'USDC.e'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row items-start gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2.5">
        <Icon name="alert-circle-outline" size={18} color="accent" />
        <Text variant="caption" color="textPrimary" className="flex-1">
          Send only{' '}
          <Text variant="caption" className="font-bold">
            {TOKEN_LABEL[token]}
          </Text>{' '}
          on the{' '}
          <Text variant="caption" className="font-bold">
            Polygon
          </Text>{' '}
          network (sometimes shown as &quot;Polygon PoS&quot; or &quot;MATIC&quot;). Other tokens or
          networks can be lost.
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
            accessibilityLabel={`Copy ${TOKEN_LABEL[token]} deposit address`}
          >
            <View className="flex-1 gap-0.5">
              <Text variant="micro" color="textTertiary">
                Your {TOKEN_LABEL[token]} address (Polygon)
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
