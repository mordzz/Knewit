'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Text } from '@/components/ui/Text';
import { Icon, type IconName } from '@/components/ui/Icon';
import { cardDepositEnabled } from '@/lib/cardDeposit';
import { AssetPicker, FieldLabel, useAssetSelection } from '@/features/wallet/components/AssetPicker';
import { useCryptoDeposit, type CryptoDepositStatus } from '@/features/wallet/hooks/useCryptoDeposit';

export interface DepositModalProps {
  visible: boolean;
  onClose: () => void;
  /** The card flow (`useBuyWithCardFlow`) — offered only when card deposits are on. */
  onBuyWithCard: () => void;
}

/**
 * Deposit entry point — a bottom sheet on phones, a centered dialog on
 * desktop (`BottomSheet`). With card deposits off it opens straight on
 * crypto; with them on it first asks card or crypto. Crypto goes through the
 * Polymarket bridge: pick a token and chain (`/supported-assets`), send to
 * the address shown, and it arrives as pUSD trading balance.
 */
export function DepositModal({ visible, onClose, onBuyWithCard }: DepositModalProps) {
  const initialView = cardDepositEnabled ? 'choose' : 'crypto';
  const [view, setView] = useState<'choose' | 'crypto'>(initialView);

  const close = () => {
    onClose();
    setView(initialView);
  };

  return (
    <BottomSheet visible={visible} onClose={close} fitContent>
      {view === 'choose' ? (
        <div className="flex flex-col gap-3">
          <Text variant="heading" className="block">Deposit</Text>
          <Option
            icon="wallet-outline"
            title="Crypto"
            description="USDC, USDT and more, on any network."
            onClick={() => setView('crypto')}
          />
          <Option
            icon="add-circle-outline"
            title="Card"
            description="Buy USDC with card or bank via MoonPay."
            onClick={() => {
              close();
              onBuyWithCard();
            }}
          />
        </div>
      ) : (
        <CryptoDepositView
          active={visible}
          onBack={cardDepositEnabled ? () => setView('choose') : undefined}
          onDone={close}
        />
      )}
    </BottomSheet>
  );
}

function Option({ icon, title, description, onClick }: { icon: IconName; title: string; description: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-16 items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-4 text-left transition-colors hover:border-accent/60"
    >
      <Icon name={icon} color="accent" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Text variant="bodyStrong" className="block">{title}</Text>
        <Text variant="caption" color="textSecondary" className="block">{description}</Text>
      </span>
      <Icon name="chevron-forward" size={18} color="textTertiary" />
    </button>
  );
}

function CryptoDepositView({ active, onBack, onDone }: { active: boolean; onBack?: () => void; onDone: () => void }) {
  const deposit = useCryptoDeposit(active);
  const selection = useAssetSelection(deposit.info?.assets ?? []);
  const asset = selection.asset;
  const address = asset ? (deposit.info?.addresses[asset.addressType] ?? null) : null;
  const [copied, setCopied] = useState(false);
  const [qrFor, setQrFor] = useState<{ address: string; url: string } | null>(null);
  // Derived: a QR rendered for a previous address is never shown.
  const qr = qrFor && qrFor.address === address ? qrFor.url : null;

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    QRCode.toDataURL(address, { margin: 1, width: 360, color: { dark: '#000000', light: '#ffffff' } })
      .then((url) => {
        if (!cancelled) setQrFor({ address, url });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [address]);

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label="Back">
            <Icon name="chevron-back" size={22} />
          </button>
        ) : null}
        <Text variant="heading" className="block">Deposit</Text>
      </div>

      {deposit.info ? (
        <>
          <AssetPicker selection={selection} />
          {asset ? (
            <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2.5">
              <Icon name="alert-circle-outline" size={18} color="accent" />
              <Text variant="caption" className="block flex-1">
                Send only <strong>{asset.symbol}</strong> on <strong>{asset.chainName}</strong>.
              </Text>
            </div>
          ) : null}
          {address ? (
            <>
              <div className="flex justify-center">
                <div className="rounded-2xl bg-white p-3">
                  {qr ? (
                    // eslint-disable-next-line @next/next/no-img-element -- generated data URL
                    <img src={qr} alt="Deposit address QR code" width={180} height={180} />
                  ) : (
                    <div className="h-[180px] w-[180px]" />
                  )}
                </div>
              </div>
              <div>
                <FieldLabel>Your deposit address</FieldLabel>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-elevated px-3 py-2.5">
                  <span className="min-w-0 flex-1 select-all break-all font-mono text-xs text-text-primary">{address}</span>
                  <button
                    type="button"
                    onClick={copy}
                    aria-label={copied ? 'Copied' : 'Copy deposit address'}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-white/5"
                  >
                    <Icon name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? 'yes' : 'accent'} />
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </>
      ) : deposit.status === 'error' ? (
        <Text variant="caption" color="danger" className="block">
          Address not ready yet. Try again in a moment.
        </Text>
      ) : (
        <div className="flex justify-center py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-text-secondary border-t-transparent" />
        </div>
      )}

      <DepositStatus status={deposit.status} />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={deposit.checkNow}
          disabled={deposit.isChecking}
          className="min-h-11 flex-1 rounded-xl border border-border bg-surface-elevated text-sm font-semibold text-text-primary disabled:opacity-50"
        >
          {deposit.isChecking ? 'Checking…' : 'Check now'}
        </button>
        <button type="button" onClick={onDone} className="min-h-11 flex-1 rounded-xl bg-accent text-sm font-semibold text-black">
          Done
        </button>
      </div>
    </div>
  );
}

function DepositStatus({ status }: { status: CryptoDepositStatus }) {
  const row = (text: string, tone: 'muted' | 'good' | 'warn' = 'muted', spinner = false) => (
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center">
        {spinner ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-text-secondary border-t-transparent" />
        ) : (
          <Icon
            name={tone === 'good' ? 'checkmark-circle' : 'alert-circle-outline'}
            size={18}
            color={tone === 'good' ? 'yes' : tone === 'warn' ? 'accent' : 'textSecondary'}
          />
        )}
      </span>
      <Text variant="caption" color={tone === 'muted' ? 'textSecondary' : 'textPrimary'} className="block flex-1">
        {text}
      </Text>
    </div>
  );

  if (status === 'completed') return row('Deposit added to your balance.', 'good');
  if (status === 'bridging') return row('Deposit detected — about a minute.', 'muted', true);
  if (status === 'failed') return row("Bridge couldn't process it. Check the token, chain and amount.", 'warn');
  if (status === 'waiting') return row('Waiting for your deposit. You can close this.', 'muted', true);
  return null;
}
