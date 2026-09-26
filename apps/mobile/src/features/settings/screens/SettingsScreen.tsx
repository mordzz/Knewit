import { Linking, Pressable, View } from 'react-native';
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
import { DepositSheet } from '@/features/wallet/components/DepositSheet';
import { WithdrawSheet } from '@/features/wallet/components/WithdrawSheet';
import { isUserCancelledFunding } from '@/features/wallet/utils/privyErrors';
import { getDepositErrorMessage, logDepositFailure } from '@/features/wallet/utils/depositErrors';

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
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [depositNotice, setDepositNotice] = useState<string | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositSheetOpen, setDepositSheetOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const { deposit } = useDeposit();
  // Card/bank funding.
  const buyWithCard = async () => {
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
  };
  const openWeb = (path: string) => Linking.openURL(`${env.webBaseUrl}${path}`);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
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
          label={isDepositing ? 'Depositing…' : 'Deposit'}
          disabled={isDepositing}
          onPress={() => setDepositSheetOpen(true)}
        />
        <Row
          icon="arrow-up-circle-outline"
          label="Withdraw"
          onPress={() => setWithdrawOpen(true)}
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
      <DepositSheet
        visible={depositSheetOpen}
        onClose={() => setDepositSheetOpen(false)}
        onBuyWithCard={buyWithCard}
      />
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
      <WithdrawSheet visible={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
    </Screen>
  );
}
