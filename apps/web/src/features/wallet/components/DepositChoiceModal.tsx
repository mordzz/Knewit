import { Modal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';

export interface DepositChoiceModalProps {
  visible: boolean;
  onClose: () => void;
  onDepositCrypto: () => void;
  onBuyWithCard: () => void;
}

/**
 * The single "Deposit" entry point's first screen — picks between the two
 * real funding paths this app has, each with its own destination asset and
 * flow (see `useDeposit`/`useBuyWithCard`'s doc comments for why they
 * can't be merged into one Privy modal call):
 *
 * - **Deposit crypto**: send USDC.e directly from another wallet/exchange
 *   straight to the Polymarket Deposit Wallet — instant, no conversion.
 * - **Buy with card or bank**: Privy's own onramp (Stripe/MoonPay — card,
 *   Google Pay, *and* bank transfer all live inside that one flow) buys
 *   native USDC, which is then auto-converted to USDC.e. Not a third,
 *   separate "bank transfer" button — bank is just one of the payment
 *   methods Privy's own screen offers once this option is chosen, so a
 *   dedicated button for it would just duplicate this one.
 */
export function DepositChoiceModal({ visible, onClose, onDepositCrypto, onBuyWithCard }: DepositChoiceModalProps) {
  return (
    <Modal visible={visible} onClose={onClose}>
      <Text variant="heading" className="block">
        Deposit
      </Text>
      <Text variant="body" color="textSecondary" className="mt-2 block">
        Choose how you&apos;d like to add funds.
      </Text>

      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            onClose();
            onDepositCrypto();
          }}
          className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-4 text-left transition-opacity hover:opacity-90"
        >
          <Icon name="wallet-outline" color="textPrimary" />
          <div className="min-w-0 flex-1">
            <Text variant="bodyStrong" className="block">
              Deposit crypto
            </Text>
            <Text variant="caption" color="textSecondary" className="block">
              Send USDC.e from another wallet or exchange — instant.
            </Text>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onBuyWithCard();
          }}
          className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-4 text-left transition-opacity hover:opacity-90"
        >
          <Icon name="add-circle-outline" color="textPrimary" />
          <div className="min-w-0 flex-1">
            <Text variant="bodyStrong" className="block">
              Buy with card or bank
            </Text>
            <Text variant="caption" color="textSecondary" className="block">
              Pay by card, Google Pay, or bank transfer — converted to trading balance automatically.
            </Text>
          </div>
        </button>
      </div>
    </Modal>
  );
}
