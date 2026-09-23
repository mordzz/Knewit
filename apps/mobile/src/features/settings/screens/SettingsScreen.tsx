import { Linking, Pressable, TextInput, View } from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { usePrivy } from '@privy-io/expo';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { env } from '@/app/config/env';
import { Modal } from '@/components/ui/Modal';
import { solidPanel } from '@/theme';
import { useDeposit } from '@/features/wallet/hooks/useDeposit';
import { useAuth } from '@/hooks/useAuth';
import { useGuestStore } from '@/store/guest/guestStore';
import { isUserCancelledFunding } from '@/features/wallet/utils/privyErrors';
import { getDepositErrorMessage, logDepositFailure } from '@/features/wallet/utils/depositErrors';
import { useWithdraw } from '@/features/wallet/hooks/useWithdraw';
import type { WithdrawResult } from '@/features/wallet/services/walletService';

function Row({
  icon,
  label,
  onPress,
  disabled = false,
  destructive = false,
}: {
  icon:
    | 'person-outline'
    | 'notifications-outline'
    | 'wallet-outline'
    | 'document-text-outline'
    | 'help-circle-outline'
    | 'log-out-outline'
    | 'arrow-down-circle-outline'
    | 'arrow-up-circle-outline';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center gap-3 border-b border-border py-4 active:opacity-70"
      accessibilityRole="button"
    >
      <Icon name={icon} color={destructive ? 'danger' : 'textSecondary'} />
      <Text variant="body" color={destructive ? 'danger' : 'textPrimary'} className="flex-1">
        {label}
      </Text>
      <Icon name="chevron-forward" size={18} color="textTertiary" />
    </Pressable>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation();
  const { logout } = usePrivy();
  const { isGuest } = useAuth();
  const exitGuest = useGuestStore((state) => state.exitGuest);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [depositNotice, setDepositNotice] = useState<string | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [withdrawNotice, setWithdrawNotice] = useState<string | null>(null);
  const [withdrawResult, setWithdrawResult] = useState<WithdrawResult | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);
  const { deposit } = useDeposit();
  const { withdraw } = useWithdraw();
  const openWeb = (path: string) => Linking.openURL(`${env.webBaseUrl}${path}`);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      if (isGuest) {
        exitGuest();
      } else {
        await logout();
      }
      setLogoutOpen(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Screen scroll contentContainerClassName="gap-6 px-4 pb-10 pt-5">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon name="chevron-back" />
        </Pressable>
        <Text variant="heading">Settings</Text>
      </View>
      <View style={[solidPanel, { borderRadius: 16 }]} className="p-4">
        <Text variant="micro" color="textTertiary" className="mb-2 uppercase">
          Profile &amp; account
        </Text>
        <Row
          icon="person-outline"
          label="Profile & Account"
          onPress={() => navigation.navigate('EditProfile' as never)}
        />
        <Row
          icon="notifications-outline"
          label="Notifications"
          onPress={() => navigation.navigate('Notifications')}
        />
      </View>
      <View style={[solidPanel, { borderRadius: 16 }]} className="p-4">
        <Text variant="micro" color="textTertiary" className="mb-2 uppercase">
          Wallet
        </Text>
        <Row
          icon="arrow-down-circle-outline"
          label={isGuest ? 'Add demo funds' : isDepositing ? 'Depositing…' : 'Deposit'}
          disabled={isDepositing}
          onPress={async () => {
            if (isDepositing) return;
            setDepositNotice(null);
            setIsDepositing(true);
            try {
              await deposit();
            } catch (error) {
              if (isUserCancelledFunding(error)) return;
              logDepositFailure(error);
              setDepositNotice(getDepositErrorMessage(error));
            } finally {
              setIsDepositing(false);
            }
          }}
        />
        <Row
          icon="arrow-up-circle-outline"
          label="Withdraw"
          onPress={() => {
            setWithdrawNotice(null);
            setWithdrawResult(null);
            setConfirmingWithdraw(false);
            setWithdrawOpen(true);
          }}
        />
      </View>
      <View style={[solidPanel, { borderRadius: 16 }]} className="p-4">
        <Text variant="micro" color="textTertiary" className="mb-2 uppercase">
          Help &amp; legal
        </Text>
        <Row
          icon="document-text-outline"
          label="Privacy Policy"
          onPress={() => openWeb('/privacy')}
        />
        <Row
          icon="document-text-outline"
          label="Terms of Service"
          onPress={() => openWeb('/terms')}
        />
        <Row icon="help-circle-outline" label="FAQ" onPress={() => openWeb('/#faq')} />
      </View>
      <View style={[solidPanel, { borderRadius: 16 }]} className="p-4">
        <Row
          icon="log-out-outline"
          label="Logout"
          destructive
          onPress={() => setLogoutOpen(true)}
        />
      </View>
      <Modal visible={logoutOpen} onClose={() => setLogoutOpen(false)}>
        <Text variant="heading">Log out?</Text>
        <Text variant="body" color="textSecondary" className="mt-2">
          You can sign in again at any time.
        </Text>
        <View className="mt-6 flex-row justify-end gap-3">
          <Pressable onPress={() => setLogoutOpen(false)} className="px-4 py-2">
            <Text variant="body" color="textSecondary">
              Cancel
            </Text>
          </Pressable>
          <Pressable
            onPress={handleLogout}
            disabled={isLoggingOut}
            className={`rounded-lg bg-danger px-4 py-2 ${isLoggingOut ? 'opacity-50' : ''}`}
          >
            <Text variant="bodyStrong" className="text-white">
              {isLoggingOut ? 'Logging out…' : 'Log out'}
            </Text>
          </Pressable>
        </View>
      </Modal>
      <Modal visible={Boolean(depositNotice)} onClose={() => setDepositNotice(null)}>
        <Text variant="heading">Deposit unavailable</Text>
        <Text variant="body" color="textSecondary" className="mt-2">
          {depositNotice}
        </Text>
        <Pressable
          onPress={() => setDepositNotice(null)}
          className="mt-5 self-end rounded-lg bg-accent px-4 py-2"
        >
          <Text variant="bodyStrong" className="text-black">
            Close
          </Text>
        </Pressable>
      </Modal>
      <Modal visible={withdrawOpen} onClose={() => { setWithdrawOpen(false); setConfirmingWithdraw(false); }}>
        <Text variant="heading">Withdraw USDC</Text>
        <Text variant="body" color="textSecondary" className="mt-2">
          Send funds from your trading balance to a Polygon wallet.
        </Text>
        {!confirmingWithdraw && !withdrawResult ? <TextInput
          value={recipient}
          onChangeText={setRecipient}
          placeholder="Polygon wallet address"
          placeholderTextColor="#6B7280"
          autoCapitalize="none"
          className="mt-5 rounded-lg border border-border bg-surface px-3 py-3 text-white"
        /> : null}
        {confirmingWithdraw && !withdrawResult ? (
          <View className="mt-5 gap-2 rounded-lg border border-border bg-surface p-3">
            <Text variant="bodyStrong">Review withdrawal</Text>
            <Text variant="caption" color="textSecondary">Network: Polygon</Text>
            <Text variant="caption" color="textSecondary">Asset: USDC.e</Text>
            <Text variant="caption" className="font-mono">{recipient.trim()}</Text>
            <Text variant="caption" color="textSecondary">Amount: {amount.trim()} USDC.e</Text>
            <Text variant="caption" color="danger">Check the address and network. Transfers can't be reversed.</Text>
          </View>
        ) : null}
        {!confirmingWithdraw && !withdrawResult ? <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="Amount (USDC.e)"
          placeholderTextColor="#6B7280"
          keyboardType="decimal-pad"
          className="mt-3 rounded-lg border border-border bg-surface px-3 py-3 text-white"
        /> : null}
        {withdrawNotice ? (
          <Text variant="caption" color="danger" className="mt-3">
            {withdrawNotice}
          </Text>
        ) : null}
        {withdrawResult ? (
          <Text variant="caption" color={withdrawResult.status === 'confirmed' ? 'yes' : 'accent'} className="mt-3">
            {withdrawResult.status === 'confirmed'
              ? 'Withdrawal confirmed.'
              : 'Withdrawal pending. Wait for confirmation before trying again.'}
            {withdrawResult.transactionHash ? ` Transaction: ${withdrawResult.transactionHash}` : ''}
            {withdrawResult.transactionId ? ` Relayer ID: ${withdrawResult.transactionId}` : ''}
          </Text>
        ) : null}
        <View className="mt-5 flex-row justify-end gap-3">
          <Pressable
            onPress={() => {
              if (confirmingWithdraw && !withdrawResult) setConfirmingWithdraw(false);
              else {
                setWithdrawOpen(false);
                setWithdrawResult(null);
                setConfirmingWithdraw(false);
              }
            }}
            className="px-4 py-2"
          >
            <Text variant="body" color="textSecondary">
              {withdrawResult ? 'Close' : 'Cancel'}
            </Text>
          </Pressable>
          <Pressable
            disabled={isWithdrawing || Boolean(withdrawResult)}
            onPress={async () => {
              if (isWithdrawing) return;
              if (!confirmingWithdraw) {
                if (!/^0x[a-fA-F0-9]{40}$/.test(recipient.trim())) {
                  setWithdrawNotice('Enter a valid Polygon wallet address. Check the address and its checksum.');
                  return;
                }
                setWithdrawNotice(null);
                setConfirmingWithdraw(true);
                return;
              }
              setIsWithdrawing(true);
              try {
                setWithdrawNotice(null);
                setWithdrawResult(await withdraw(recipient.trim(), amount.trim()));
              } catch (error) {
                setWithdrawNotice(error instanceof Error ? error.message : 'Withdrawal failed.');
              } finally {
                setIsWithdrawing(false);
              }
            }}
            className={`rounded-lg bg-accent px-4 py-2 ${isWithdrawing || withdrawResult ? 'opacity-50' : ''}`}
          >
            <Text variant="bodyStrong" className="text-black">
              {isWithdrawing ? 'Submitting…' : withdrawResult ? 'Submitted' : confirmingWithdraw ? 'Confirm withdrawal' : 'Review withdrawal'}
            </Text>
          </Pressable>
        </View>
      </Modal>
    </Screen>
  );
}
