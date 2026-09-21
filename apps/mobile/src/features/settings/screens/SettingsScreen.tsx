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
import { useWithdraw } from '@/features/wallet/hooks/useWithdraw';

function Row({
  icon,
  label,
  onPress,
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
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
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
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [depositNotice, setDepositNotice] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [withdrawNotice, setWithdrawNotice] = useState<string | null>(null);
  const { deposit } = useDeposit();
  const { withdraw } = useWithdraw();
  const openWeb = (path: string) => Linking.openURL(`${env.apiBaseUrl}${path}`);

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
          label="Deposit"
          onPress={async () => {
            setDepositNotice(null);
            try {
              await deposit();
            } catch (error) {
              setDepositNotice(
                error instanceof Error ? error.message : 'Could not open the deposit flow.'
              );
            }
          }}
        />
        <Row
          icon="arrow-up-circle-outline"
          label="Withdraw"
          onPress={() => {
            setWithdrawNotice(null);
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
          <Pressable onPress={() => logout()} className="rounded-lg bg-danger px-4 py-2">
            <Text variant="bodyStrong" className="text-white">
              Log out
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
      <Modal visible={withdrawOpen} onClose={() => setWithdrawOpen(false)}>
        <Text variant="heading">Withdraw USDC</Text>
        <Text variant="body" color="textSecondary" className="mt-2">
          Send USDC on Polygon to another wallet. Privy will ask you to confirm.
        </Text>
        <TextInput
          value={recipient}
          onChangeText={setRecipient}
          placeholder="Recipient wallet address"
          placeholderTextColor="#6B7280"
          autoCapitalize="none"
          className="mt-5 rounded-lg border border-border bg-surface px-3 py-3 text-white"
        />
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="Amount (USDC)"
          placeholderTextColor="#6B7280"
          keyboardType="decimal-pad"
          className="mt-3 rounded-lg border border-border bg-surface px-3 py-3 text-white"
        />
        {withdrawNotice ? (
          <Text variant="caption" color="danger" className="mt-3">
            {withdrawNotice}
          </Text>
        ) : null}
        <View className="mt-5 flex-row justify-end gap-3">
          <Pressable onPress={() => setWithdrawOpen(false)} className="px-4 py-2">
            <Text variant="body" color="textSecondary">
              Cancel
            </Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              try {
                setWithdrawNotice(null);
                if (!/^0x[a-fA-F0-9]{40}$/.test(recipient.trim()))
                  throw new Error('Enter a valid EVM wallet address.');
                await withdraw(recipient.trim(), amount.trim());
                setWithdrawOpen(false);
              } catch (error) {
                setWithdrawNotice(error instanceof Error ? error.message : 'Withdrawal failed.');
              }
            }}
            className="rounded-lg bg-accent px-4 py-2"
          >
            <Text variant="bodyStrong" className="text-black">
              Continue with Privy
            </Text>
          </Pressable>
        </View>
      </Modal>
    </Screen>
  );
}
