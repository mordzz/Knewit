'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { WalletAddress } from '@/components/WalletAddress';
import { useCreateTrade } from '@/hooks/useCreateTrade';
import { formatPrice, formatUsd } from '@/lib/formatters';
import type { Outcome } from '@/types/market';
import type { MarketDetail } from '@/types/social';

const AMOUNT_PRESETS = [5, 10, 25, 50];

function outcomeLabel(market: MarketDetail, outcome: Outcome): string {
  const labels = market.outcomeLabels ?? { yes: 'Yes', no: 'No' };
  return outcome === 'YES' ? labels.yes : labels.no;
}

function validateAmount(amount: number): string | null {
  if (amount === 0) return 'Enter an amount';
  if (amount < 0 || Number.isNaN(amount)) return 'Enter a valid amount';
  return null;
}

/**
 * Direct conversion of `apps/mobile`'s `TradingPanel` — a single
 * "Trade" button opening one `BottomSheet` whose content switches
 * between two steps: pick (outcome + amount) and confirm (review →
 * pending → success/failed). Never fabricates a successful trade — a
 * failed backend call shows a real "Trade failed" state.
 */
export function TradingPanel({ market }: { market: MarketDetail }) {
  const router = useRouter();
  const { user } = usePrivy();
  const address = user?.wallet?.address ?? null;
  const isConnected = !!address;
  const [outcome, setOutcome] = useState<Outcome>('YES');
  const [amountText, setAmountText] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [step, setStep] = useState<'pick' | 'confirm'>('pick');
  const [isValidating, setIsValidating] = useState(false);
  const mutation = useCreateTrade(market.id);

  const amount = Number(amountText) || 0;
  const price = outcome === 'YES' ? market.yesPrice : market.noPrice;
  const shares = amount > 0 && price > 0 ? (amount * 100) / price : 0;
  const canSubmit = amount > 0 && price > 0;

  function handleChangeAmount(value: string) {
    setAmountText(value.replace(/[^0-9]/g, ''));
  }

  function openSheet() {
    if (!isConnected) {
      router.push('/wallet');
      return;
    }
    mutation.reset();
    setStep('pick');
    setSheetVisible(true);
  }

  function goToConfirm() {
    if (validateAmount(amount)) return;
    setStep('confirm');
  }

  function handleConfirm() {
    setIsValidating(true);
    const validationError = validateAmount(amount);
    const stillTradeable = !market.closed && !market.resolved && market.isBinary !== false;
    setIsValidating(false);
    if (validationError || !isConnected || !address || !stillTradeable) return;
    mutation.mutate({ marketId: market.id, outcome, usdAmount: amount });
  }

  function closeSheet() {
    setSheetVisible(false);
    setStep('pick');
    if (mutation.isSuccess) {
      mutation.reset();
      setAmountText('');
    }
  }

  if (market.resolved) {
    return (
      <InfoBanner
        text={market.resolvedOutcome ? `This market resolved ${outcomeLabel(market, market.resolvedOutcome)}.` : 'This market has resolved.'}
      />
    );
  }
  if (market.isBinary === false) return null;
  if (market.closed) {
    return <InfoBanner text="Market Closed — Trading is no longer available." />;
  }

  const labels = market.outcomeLabels ?? { yes: 'Yes', no: 'No' };

  return (
    <>
      <Button label={isConnected ? 'Trade' : 'Connect Wallet to Trade'} onClick={openSheet} />

      <BottomSheet visible={sheetVisible} onClose={closeSheet}>
        {step === 'pick' ? (
          <PickStep
            labels={labels}
            outcome={outcome}
            onSelectOutcome={setOutcome}
            yesPrice={market.yesPrice}
            noPrice={market.noPrice}
            amountText={amountText}
            onChangeAmount={handleChangeAmount}
            amount={amount}
            price={price}
            shares={shares}
            canSubmit={canSubmit}
            onContinue={goToConfirm}
          />
        ) : (
          <ConfirmTradeContent
            market={market}
            outcome={outcome}
            amount={amount}
            shares={shares}
            price={price}
            address={address}
            isValidating={isValidating}
            mutationStatus={mutation.status}
            errorMessage={mutation.error?.message ?? null}
            onConfirm={handleConfirm}
            onBack={() => setStep('pick')}
            onClose={closeSheet}
          />
        )}
      </BottomSheet>
    </>
  );
}

function PickStep({
  labels,
  outcome,
  onSelectOutcome,
  yesPrice,
  noPrice,
  amountText,
  onChangeAmount,
  amount,
  price,
  shares,
  canSubmit,
  onContinue,
}: {
  labels: { yes: string; no: string };
  outcome: Outcome;
  onSelectOutcome: (outcome: Outcome) => void;
  yesPrice: number;
  noPrice: number;
  amountText: string;
  onChangeAmount: (value: string) => void;
  amount: number;
  price: number;
  shares: number;
  canSubmit: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Text variant="heading">Trade</Text>

      <div className="flex gap-2">
        <OutcomeCard label={labels.yes} priceCents={yesPrice} selected={outcome === 'YES'} variant="yes" onPress={() => onSelectOutcome('YES')} />
        <OutcomeCard label={labels.no} priceCents={noPrice} selected={outcome === 'NO'} variant="no" onPress={() => onSelectOutcome('NO')} />
      </div>

      <Input label="Amount" inputMode="numeric" value={amountText} onChange={(e) => onChangeAmount(e.target.value)} placeholder="$0" />

      <div className="flex gap-2">
        {AMOUNT_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChangeAmount(String(preset))}
            className="rounded-full border border-border px-3 py-1.5 hover:opacity-70"
          >
            <Text variant="caption" color="textSecondary">
              ${preset}
            </Text>
          </button>
        ))}
      </div>

      {amount > 0 ? (
        <div className="flex flex-col gap-1 rounded-lg bg-surface-elevated p-3">
          <EstimateRow label="Estimated shares" value={shares.toFixed(2)} />
          <EstimateRow label="Estimated price" value={formatPrice(price)} />
          <EstimateRow label="Estimated cost" value={formatUsd(amount)} />
          <EstimateRow label="Payout if correct" value={formatUsd(shares)} />
        </div>
      ) : null}

      <Button
        variant={outcome === 'YES' ? 'yes' : 'no'}
        label={`Continue with ${outcome === 'YES' ? labels.yes : labels.no}${amount > 0 ? ` · ${formatUsd(amount)}` : ''}`}
        onClick={onContinue}
        disabled={!canSubmit}
      />
    </div>
  );
}

function OutcomeCard({
  label,
  priceCents,
  selected,
  variant,
  onPress,
}: {
  label: string;
  priceCents: number;
  selected: boolean;
  variant: 'yes' | 'no';
  onPress: () => void;
}) {
  const activeClass = variant === 'yes' ? 'border-yes bg-yes-muted' : 'border-no bg-no-muted';
  const textColor = variant === 'yes' ? 'yes' : 'no';

  return (
    <button
      type="button"
      onClick={onPress}
      className={`flex flex-1 flex-col items-center gap-1 rounded-xl border p-3 ${selected ? activeClass : 'border-border bg-surface-elevated'}`}
    >
      <Text variant="bodyStrong" color={selected ? textColor : 'textPrimary'}>
        {label}
      </Text>
      <Text variant="title" color={selected ? textColor : 'textSecondary'}>
        {formatPrice(priceCents)}
      </Text>
    </button>
  );
}

function EstimateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="caption">{value}</Text>
    </div>
  );
}

function ConfirmTradeContent({
  market,
  outcome,
  amount,
  shares,
  price,
  address,
  isValidating,
  mutationStatus,
  errorMessage,
  onConfirm,
  onBack,
  onClose,
}: {
  market: MarketDetail;
  outcome: Outcome;
  amount: number;
  shares: number;
  price: number;
  address: string | null;
  isValidating: boolean;
  mutationStatus: 'idle' | 'pending' | 'error' | 'success';
  errorMessage: string | null;
  onConfirm: () => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const status: 'idle' | 'preparing' | 'pending' | 'success' | 'failed' = isValidating
    ? 'preparing'
    : mutationStatus === 'pending'
      ? 'pending'
      : mutationStatus === 'error'
        ? 'failed'
        : mutationStatus === 'success'
          ? 'success'
          : 'idle';

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <Icon name="checkmark-circle" size={36} color="yes" />
        <Text variant="bodyStrong">Trade successful</Text>
        <Text variant="caption" color="textSecondary">
          Your position will appear below shortly.
        </Text>
        <Button label="Done" onClick={onClose} className="mt-3 w-full" />
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <Icon name="alert-circle-outline" size={36} color="danger" />
        <Text variant="bodyStrong">Trade failed</Text>
        <Text variant="caption" color="textSecondary">
          {friendlyTradeError(errorMessage)}
        </Text>
        <Button label="Try again" onClick={onConfirm} className="mt-3 w-full" />
        <Button label="Cancel" variant="ghost" onClick={onClose} className="w-full" />
      </div>
    );
  }

  if (status === 'preparing' || status === 'pending') {
    return (
      <div className="flex flex-col items-center gap-2 py-6">
        <Text variant="bodyStrong">{status === 'preparing' ? 'Preparing trade...' : 'Transaction pending...'}</Text>
        <Text variant="caption" color="textSecondary">
          This won&apos;t take long.
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Text variant="heading">Confirm Trade</Text>

      <ConfirmRow label="Market" value={market.question} />
      <ConfirmRow label="Position" value={outcome} valueColor={outcome === 'YES' ? 'yes' : 'no'} />
      <ConfirmRow label="Amount" value={formatUsd(amount)} />
      <ConfirmRow label="Estimated price" value={formatPrice(price)} />
      <ConfirmRow label="Estimated shares" value={shares.toFixed(2)} />
      <div className="flex items-center justify-between">
        <Text variant="caption" color="textSecondary">
          Wallet
        </Text>
        {address ? <WalletAddress address={address} compact /> : null}
      </div>

      <Button variant={outcome === 'YES' ? 'yes' : 'no'} label="Confirm Trade" onClick={onConfirm} className="mt-2" />
      <Button label="Back" variant="ghost" onClick={onBack} />
    </div>
  );
}

function ConfirmRow({ label, value, valueColor = 'textPrimary' }: { label: string; value: string; valueColor?: 'textPrimary' | 'yes' | 'no' }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="bodyStrong" color={valueColor} className="flex-1 text-right">
        {value}
      </Text>
    </div>
  );
}

function friendlyTradeError(message: string | null): string {
  if (!message) return "Couldn't complete this trade right now. Please try again.";
  if (/network/i.test(message)) {
    return 'Network error — check your connection and try again.';
  }
  return "Couldn't complete this trade right now. Please try again.";
}

function InfoBanner({ text }: { text: string }) {
  return (
    <Card contentClassName="p-4">
      <Text variant="body" color="textSecondary" className="block text-center">
        {text}
      </Text>
    </Card>
  );
}
