"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Text } from "@/components/ui/Text";
import { useDebounce } from "@/hooks/useDebounce";
import { useWithdraw } from "@/features/wallet/hooks/useWithdraw";
import { ApiRequestError } from "@/lib/apiClient";
import {
  AssetPicker,
  FieldLabel,
  useAssetSelection,
} from "@/features/wallet/components/AssetPicker";
import {
  addressPlaceholder,
  looksLikeAddress,
} from "@/features/wallet/lib/bridgeAssets";
import {
  getWithdrawAssets,
  getWithdrawQuote,
  getWithdrawStatus,
  type WithdrawResult,
} from "@/features/wallet/lib/walletService";

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-3 text-sm text-text-primary outline-none focus:border-accent";

/**
 * Withdraw trading balance (pUSD) through the Polymarket bridge: pick the
 * token and chain to receive (`/supported-assets`, same pickers as deposit),
 * enter the destination address and amount, review the bridge's quote and
 * confirm. A bottom sheet on phones, a dialog on desktop. Same flow as the
 * mobile `WithdrawSheet`.
 */
export function WithdrawModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { withdraw } = useWithdraw();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "review" | "done">("form");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<WithdrawResult | null>(null);

  const assets = useQuery({
    queryKey: ["withdraw-assets"],
    queryFn: getWithdrawAssets,
    enabled: visible,
    staleTime: 10 * 60_000,
  });
  const selection = useAssetSelection(assets.data ?? []);
  const asset = selection.asset;

  const trimmedRecipient = recipient.trim();
  const amountNumber = Number(amount);
  const amountValid =
    /^\d+(?:\.\d{1,6})?$/.test(amount.trim()) && amountNumber > 0;
  const recipientValid = asset
    ? looksLikeAddress(asset.addressType, trimmedRecipient)
    : false;
  const meetsMinimum =
    Boolean(asset) && amountValid && amountNumber >= asset!.minUsd;
  const formReady = recipientValid && meetsMinimum;

  const quoteInput = useDebounce(
    formReady && asset
      ? {
          chainId: asset.chainId,
          tokenAddress: asset.tokenAddress,
          recipient: trimmedRecipient,
          amount: amount.trim(),
        }
      : null,
    500,
  );
  const quote = useQuery({
    queryKey: ["withdraw-quote", quoteInput],
    queryFn: () => getWithdrawQuote(quoteInput!),
    enabled: visible && quoteInput != null,
    staleTime: 30_000,
    retry: false,
  });

  const bridgeStatus = useQuery({
    queryKey: ["withdraw-status", result?.bridgeAddress],
    queryFn: () => getWithdrawStatus(result!.bridgeAddress!),
    enabled: visible && step === "done" && Boolean(result?.bridgeAddress),
    refetchInterval: (query) => {
      const latest = query.state.data?.[0]?.status;
      return latest === "COMPLETED" || latest === "FAILED" ? false : 10_000;
    },
  });

  const close = () => {
    if (isSubmitting) return;
    setStep("form");
    setError(null);
    setResult(null);
    onClose();
  };

  const review = () => {
    if (!asset) return;
    if (!recipientValid)
      return setError(`Enter a valid ${asset.chainName} address.`);
    if (!amountValid)
      return setError("Enter a valid amount with up to 6 decimal places.");
    if (!meetsMinimum)
      return setError(
        `The minimum for ${asset.symbol} on ${asset.chainName} is $${asset.minUsd}.`,
      );
    setError(null);
    setStep("review");
  };

  const confirm = async () => {
    if (!asset) return;
    setIsSubmitting(true);
    setError(null);
    try {
      setResult(
        await withdraw({
          chainId: asset.chainId,
          tokenAddress: asset.tokenAddress,
          recipient: trimmedRecipient,
          amount: amount.trim(),
        }),
      );
      setStep("done");
    } catch (failure) {
      setError(
        failure instanceof ApiRequestError
          ? failure.body.message
          : failure instanceof Error
            ? failure.message
            : "Withdrawal failed. Check your balance before trying again.",
      );
      setStep("form");
    } finally {
      setIsSubmitting(false);
    }
  };

  const receiveLine =
    quote.data && asset
      ? `≈ ${formatTokenAmount(quote.data.estimatedReceived)} ${asset.symbol} (~$${quote.data.estimatedReceivedUsd.toFixed(2)})`
      : null;
  const latestBridge = bridgeStatus.data?.[0]?.status ?? null;

  return (
    <BottomSheet visible={visible} onClose={close} fitContent>
      <div className="flex flex-col gap-4">
        <div>
          <Text variant="heading" className="block">
            Withdraw
          </Text>
          <Text variant="caption" color="textSecondary" className="mt-1 block">
            Send your balance to a wallet or exchange.
          </Text>
        </div>

        {step === "form" ? (
          assets.data ? (
            <div className="flex flex-col gap-3">
              <AssetPicker selection={selection} />
              <div>
                <FieldLabel>Recipient address</FieldLabel>
                <input
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  placeholder={
                    asset
                      ? addressPlaceholder(asset.addressType, asset.chainName)
                      : "Address"
                  }
                  autoComplete="off"
                  aria-label="Recipient address"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <FieldLabel>Amount</FieldLabel>
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="decimal"
                  placeholder="Amount (USD)"
                  aria-label="Amount"
                  className={INPUT_CLASS}
                />
              </div>
              {formReady ? (
                <Text
                  variant="caption"
                  color={quote.isError ? "danger" : "textSecondary"}
                  className="block"
                >
                  {quote.isError
                    ? "No quote for this route right now."
                    : quote.data
                      ? `You receive ${receiveLine}. Cost $${quote.data.totalCostUsd.toFixed(2)}.`
                      : "Getting a quote…"}
                </Text>
              ) : null}
            </div>
          ) : assets.isError ? (
            <Text variant="caption" color="danger" className="block">
              Withdrawals are unavailable right now.
            </Text>
          ) : (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-text-secondary border-t-transparent" />
            </div>
          )
        ) : step === "review" && asset ? (
          <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface p-3">
            <Text variant="bodyStrong" className="block">
              Review withdrawal
            </Text>
            <ReviewRow label="Token" value={asset.symbol} />
            <ReviewRow label="Chain" value={asset.chainName} />
            <ReviewRow label="Amount" value={`$${amountNumber}`} />
            {receiveLine ? (
              <ReviewRow label="You receive" value={receiveLine} />
            ) : null}
            <Text variant="caption" className="mt-1 block break-all font-mono">
              {trimmedRecipient}
            </Text>
            <Text variant="caption" color="danger" className="mt-1 block">
              Check the address and chain. Transfers can&apos;t be reversed.
            </Text>
          </div>
        ) : result && asset ? (
          <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface p-3">
            <Text variant="bodyStrong" className="block">
              {result.status === "confirmed"
                ? `$${result.amountUsdc} sent`
                : "Withdrawal pending"}
            </Text>
            <Text
              variant="caption"
              color={
                latestBridge === "COMPLETED"
                  ? "yes"
                  : latestBridge === "FAILED"
                    ? "danger"
                    : "textSecondary"
              }
              className="block"
            >
              {latestBridge === "COMPLETED"
                ? `Delivered as ${asset.symbol} on ${asset.chainName}.`
                : latestBridge === "FAILED"
                  ? "The bridge couldn't deliver it. Contact support with the transaction below."
                  : `On its way to ${asset.chainName} — about a minute.`}
            </Text>
            {result.transactionHash ? (
              <a
                href={`https://polygonscan.com/tx/${result.transactionHash}`}
                target="_blank"
                rel="noreferrer"
                className="block break-all text-xs text-accent underline"
              >
                View transaction on PolygonScan
              </a>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <Text variant="caption" color="danger" className="block">
            {error}
          </Text>
        ) : null}

        <div className="flex gap-3">
          {step === "done" ? (
            <button
              type="button"
              onClick={close}
              className="min-h-11 flex-1 rounded-xl bg-accent text-sm font-semibold text-black"
            >
              Close
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => (step === "review" ? setStep("form") : close())}
                disabled={isSubmitting}
                className="min-h-11 flex-1 rounded-xl border border-border bg-surface-elevated text-sm font-semibold text-text-primary"
              >
                {step === "review" ? "Back" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={
                  isSubmitting ||
                  !asset ||
                  (step === "form" && formReady && !quote.data)
                }
                onClick={step === "review" ? confirm : review}
                className="min-h-11 flex-1 rounded-xl bg-accent text-sm font-semibold text-black disabled:opacity-50"
              >
                {step === "review"
                  ? isSubmitting
                    ? "Submitting…"
                    : "Confirm"
                  : "Review"}
              </button>
            </>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="caption" className="text-right">
        {value}
      </Text>
    </div>
  );
}

/** Destination amount: up to 6 significant decimals, trimmed. */
function formatTokenAmount(value: number): string {
  if (value >= 1) return value.toFixed(2);
  return Number(value.toPrecision(4)).toString();
}
