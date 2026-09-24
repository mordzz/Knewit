'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Modal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { Icon, type IconName } from '@/components/ui/Icon';
import { cardDepositEnabled } from '@/lib/cardDeposit';
import { useCryptoDeposit, type CryptoDepositStatus } from '@/features/wallet/hooks/useCryptoDeposit';

type Mode = 'bridge' | 'direct';
type BridgeNetwork = 'evm' | 'svm' | 'btc' | 'tron';

/** How each Polymarket bridge address is presented — same copy as mobile's
 * `DepositSheet`. Minimums come from the bridge's /supported-assets. */
const BRIDGE_NETWORKS: Record<BridgeNetwork, { tab: string; label: string; send: string; networks: string; minimum: string }> = {
  evm: {
    tab: 'EVM',
    label: 'EVM address',
    send: 'USDC, USDT, DAI or ETH',
    networks: 'Polygon, Ethereum, Base, Arbitrum, Optimism, BNB Chain and more',
    minimum: 'Minimum $2 on Polygon, about $3 or more on other networks.',
  },
  svm: { tab: 'Solana', label: 'Solana address', send: 'USDC or SOL', networks: 'Solana', minimum: 'Minimum about $3.' },
  btc: {
    tab: 'Bitcoin',
    label: 'Bitcoin address',
    send: 'BTC',
    networks: 'Bitcoin',
    minimum: 'Minimum about $9 — Bitcoin deposits take longer to confirm.',
  },
  tron: { tab: 'Tron', label: 'Tron address', send: 'USDT', networks: 'Tron', minimum: 'Minimum about $3.' },
};

export interface DepositModalProps {
  visible: boolean;
  onClose: () => void;
  /** The card flow (`useBuyWithCardFlow`) — offered only when card deposits are on. */
  onBuyWithCard: () => void;
}

/**
 * Deposit entry point. With card deposits off (the default until Privy gas
 * sponsorship is enabled) it opens straight on crypto deposit; with them on
 * it first asks card or crypto. Crypto goes through the Polymarket bridge
 * (many tokens/networks → USDC.e) or straight to the Deposit Wallet as
 * USDC.e on Polygon; arrivals are wrapped into pUSD automatically.
 */
export function DepositModal({ visible, onClose, onBuyWithCard }: DepositModalProps) {
  const initialView = cardDepositEnabled ? 'choose' : 'crypto';
  const [view, setView] = useState<'choose' | 'crypto'>(initialView);

  const close = () => {
    onClose();
    setView(initialView);
  };

  return (
    <Modal visible={visible} onClose={close}>
      {view === 'choose' ? (
        <div className="flex flex-col gap-3">
          <Text variant="heading" className="block">Deposit</Text>
          <Text variant="caption" color="textSecondary" className="block">
            Choose how you&apos;d like to add funds.
          </Text>
          <Option
            icon="wallet-outline"
            title="Deposit crypto"
            description="Send USDC, USDT and more from an exchange or wallet, on Polygon or other networks."
            onClick={() => setView('crypto')}
          />
          <Option
            icon="add-circle-outline"
            title="Buy with card"
            description="Pay by card or bank through MoonPay. Converted to trading balance automatically."
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
    </Modal>
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
  const [mode, setMode] = useState<Mode>('bridge');
  const [network, setNetwork] = useState<BridgeNetwork>('evm');
  const [copied, setCopied] = useState(false);
  const [qrFor, setQrFor] = useState<{ address: string; url: string } | null>(null);
  const deposit = useCryptoDeposit(active);
  const bridge = deposit.info?.bridge ?? null;
  const effectiveMode: Mode = bridge ? mode : 'direct';
  const availableNetworks = (Object.keys(BRIDGE_NETWORKS) as BridgeNetwork[]).filter((key) => Boolean(bridge?.[key]));
  const address = effectiveMode === 'bridge' ? (bridge?.[network] ?? null) : (deposit.info?.usdcE.address ?? null);
  const route = BRIDGE_NETWORKS[network];

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
    <div className="flex max-h-[78vh] flex-col gap-4 overflow-y-auto">
      <div className="flex items-center gap-2">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label="Back">
            <Icon name="chevron-back" size={22} />
          </button>
        ) : null}
        <Text variant="heading" className="block">Deposit crypto</Text>
      </div>

      {bridge ? (
        <div className="flex rounded-xl border border-border bg-surface-elevated p-1" role="tablist">
          {(
            [
              { key: 'bridge', label: 'Any network' },
              { key: 'direct', label: 'USDC.e on Polygon' },
            ] as const
          ).map((option) => {
            const selected = option.key === effectiveMode;
            return (
              <button
                key={option.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setMode(option.key)}
                className={`min-h-10 flex-1 rounded-lg px-2 text-sm font-semibold ${selected ? 'bg-accent text-black' : 'text-text-secondary'}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {effectiveMode === 'bridge' && availableNetworks.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Network">
          {availableNetworks.map((key) => {
            const selected = key === network;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setNetwork(key)}
                className={`min-h-9 rounded-full border px-4 text-xs font-semibold ${
                  selected ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-surface-elevated text-text-secondary'
                }`}
              >
                {BRIDGE_NETWORKS[key].tab}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2.5">
        <Icon name="alert-circle-outline" size={18} color="accent" />
        <Text variant="caption" className="block flex-1">
          {effectiveMode === 'bridge' ? (
            <>
              Send <strong>{route.send}</strong> on {route.networks}. It&apos;s converted to your trading balance
              automatically. {route.minimum} Smaller amounts aren&apos;t converted.
            </>
          ) : (
            <>
              Send only <strong>USDC.e</strong> on the <strong>Polygon</strong> network. No minimum. Other tokens or
              networks sent here can be lost.
            </>
          )}
        </Text>
      </div>

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
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-left"
            aria-label="Copy deposit address"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Text variant="micro" color="textTertiary" className="block">
                {effectiveMode === 'bridge' ? `Your ${route.label}` : 'Your USDC.e address (Polygon)'}
              </Text>
              <span className="select-all break-all font-mono text-xs text-text-primary">{address}</span>
            </span>
            <Text variant="caption" color={copied ? 'yes' : 'accent'} className="font-semibold">
              {copied ? 'Copied' : 'Copy'}
            </Text>
          </button>
        </>
      ) : deposit.status === 'error' ? (
        <Text variant="caption" color="danger" className="block">
          Your deposit address isn&apos;t ready yet. Close this and try again in a moment.
        </Text>
      ) : (
        <div className="flex justify-center py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-text-secondary border-t-transparent" />
        </div>
      )}

      <DepositStatus
        status={deposit.status}
        message={deposit.message}
        convertedAmount={deposit.convertedAmount}
        autoConvert={deposit.info?.autoConvert ?? false}
      />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={deposit.checkNow}
          disabled={deposit.isChecking || deposit.status === 'converting'}
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

function DepositStatus({
  status,
  message,
  convertedAmount,
  autoConvert,
}: {
  status: CryptoDepositStatus;
  message: string | null;
  convertedAmount: number | null;
  autoConvert: boolean;
}) {
  const row = (text: string, tone: 'muted' | 'good' | 'warn' = 'muted', spinner = false) => (
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center">
        {spinner ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-text-secondary border-t-transparent" />
        ) : (
          <Icon
            name={tone === 'good' ? 'checkmark-circle' : tone === 'warn' ? 'time-outline' : 'alert-circle-outline'}
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

  if (status === 'converted') {
    return row(`${convertedAmount != null ? `$${convertedAmount.toFixed(2)} added` : 'Deposit added'} to your trading balance.`, 'good');
  }
  if (status === 'converting') return row('Deposit received — converting it to your trading balance…', 'muted', true);
  if (status === 'bridging') return row('Deposit detected — Polymarket is converting it. This usually takes about a minute.', 'muted', true);
  if (status === 'bridge_failed') {
    return row(
      "The bridge couldn't process your last deposit. Check that the token, network and amount are supported, then contact support if the funds don't return.",
      'warn'
    );
  }
  if (status === 'processing') return row(message ?? '', 'warn');
  if (status === 'waiting') {
    return row(
      `Waiting for your deposit. It usually arrives within a minute of sending${
        autoConvert ? ' — you can close this, it converts automatically.' : ' — keep this open until it lands.'
      }`,
      'muted',
      true
    );
  }
  return null;
}
