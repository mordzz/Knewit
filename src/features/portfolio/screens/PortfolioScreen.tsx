import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { EmptyState } from '@/components/feedback/EmptyState';
import { WalletAddress } from '@/features/wallet/components/WalletAddress';
import { useWallet } from '@/hooks/useWallet';

/**
 * Shell only — real positions/PnL require the backend and a connected
 * wallet (docs/WALLET.md). The wallet row here reads real client state
 * (`useWallet`) even though nothing can actually connect yet.
 */
export function PortfolioScreen() {
  const navigation = useNavigation();
  const { isConnected, address } = useWallet();

  return (
    <Screen className="gap-3 pt-4">
      <Text variant="heading">Portfolio</Text>

      <Card contentClassName="flex-row items-center gap-3">
        <Icon name="wallet-outline" color={isConnected ? 'yes' : 'textTertiary'} />
        <View className="flex-1 gap-0.5">
          {isConnected && address ? (
            <WalletAddress address={address} compact />
          ) : (
            <Text variant="bodyStrong">No wallet connected</Text>
          )}
          <Text variant="caption" color="textSecondary">
            {isConnected ? 'Connected' : 'Connect to see your positions'}
          </Text>
        </View>
        {!isConnected ? (
          <Button label="Connect" variant="secondary" onPress={() => navigation.navigate('Auth')} />
        ) : null}
      </Card>

      <View className="flex-row gap-3">
        <Card className="flex-1" contentClassName="gap-1">
          <Text variant="caption" color="textSecondary">
            Open Positions
          </Text>
          <Text variant="title">0</Text>
        </Card>
        <Card className="flex-1" contentClassName="gap-1">
          <Text variant="caption" color="textSecondary">
            Unrealized PnL
          </Text>
          <Text variant="title">$0.00</Text>
        </Card>
      </View>

      <View className="flex-1">
        <EmptyState
          icon="trending-up-outline"
          title="No positions yet"
          message="Positions you take on markets will show up here."
        />
      </View>
    </Screen>
  );
}
