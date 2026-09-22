"use client";

import { useState } from "react";
import Link from "next/link";
import { useLogout } from "@privy-io/react-auth";
import { useBuyWithCardFlow } from "@/features/wallet/hooks/useBuyWithCardFlow";
import { WithdrawModal } from "@/features/wallet/components/WithdrawModal";
import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { Modal } from "@/components/ui/Modal";
import { SOLID_PANEL_CLASS } from "@/components/ui/solidPanel";

function SettingRow({
  label,
  href,
  onClick,
  danger = false,
  disabled = false,
  icon,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  icon: import("@/components/ui/Icon").IconName;
}) {
  const className = `flex min-h-14 items-center justify-between border-b border-border px-4 py-3 text-sm ${danger ? "text-danger" : "text-text-primary"} hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60`;
  const content = (
    <>
      <span className="flex items-center gap-3"><Icon name={icon} size={19} color={danger ? "danger" : "textSecondary"} />{label}</span>
      <Icon name="chevron-forward" size={18} color="textTertiary" />
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${className} w-full text-left`}
    >
      {content}
    </button>
  );
}

export default function SettingsPage() {
  const { logout } = useLogout();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const { isBuying, stage, buyError, handleBuyWithCard } = useBuyWithCardFlow();
  return (
    <main className="mx-auto flex w-full max-w-none flex-col gap-3 px-4 pb-12 pt-4 lg:gap-6 lg:px-0 lg:py-10">
      <div className="flex items-end justify-between gap-4 pb-3 lg:pb-6">
        <div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => window.history.back()} aria-label="Back" className="lg:hidden">
              <Icon name="chevron-back" size={24} />
            </button>
            <Text variant="heading" className="block text-4xl font-inter-extrabold lg:text-[42px] lg:tracking-[-0.03em]">
              Settings
            </Text>
          </div>
          <Text variant="caption" color="textSecondary" className="mt-1 hidden lg:block">
            Manage your profile, wallet, and account preferences.
          </Text>
        </div>
      </div>
      <section className={`mb-6 overflow-hidden rounded-2xl ${SOLID_PANEL_CLASS}`}>
        <Text
          variant="micro"
          color="textTertiary"
          className="block px-4 pb-2 pt-4 uppercase"
        >
          Profile &amp; account
        </Text>
        <SettingRow icon="person-outline" label="Profile & Account" href="/profile/edit" />
      </section>
      <section className={`mb-6 overflow-hidden rounded-2xl ${SOLID_PANEL_CLASS}`}>
        <Text
          variant="micro"
          color="textTertiary"
          className="block px-4 pb-2 pt-4 uppercase"
        >
          Wallet
        </Text>
        <SettingRow
          icon="arrow-down-circle-outline"
          label={stage === 'converting' ? 'Converting…' : stage === 'waiting' ? 'Waiting for USDC…' : isBuying ? 'Depositing…' : 'Deposit'}
          onClick={handleBuyWithCard}
          disabled={isBuying}
        />
        {buyError ? (
          <Text variant="caption" color="danger" className="block px-4 pb-3">
            {buyError}
          </Text>
        ) : null}
        <SettingRow icon="arrow-up-circle-outline" label="Withdraw" onClick={() => setWithdrawOpen(true)} />
      </section>
      <section className={`mb-6 overflow-hidden rounded-2xl ${SOLID_PANEL_CLASS}`}>
        <Text
          variant="micro"
          color="textTertiary"
          className="block px-4 pb-2 pt-4 uppercase"
        >
          Help &amp; legal
        </Text>
        <SettingRow icon="document-text-outline" label="Privacy Policy" href="/privacy" />
        <SettingRow icon="document-text-outline" label="Terms of Service" href="/terms" />
        <SettingRow icon="help-circle-outline" label="FAQ" href="/#faq" />
      </section>
      <section className={`mb-6 overflow-hidden rounded-2xl ${SOLID_PANEL_CLASS} lg:hidden`}>
        <SettingRow
          icon="log-out-outline"
          label="Logout"
          danger
          onClick={() => setLogoutOpen(true)}
        />
      </section>
      <Modal visible={logoutOpen} onClose={() => setLogoutOpen(false)}>
        <Text variant="heading" className="block">Log out?</Text>
        <Text variant="body" color="textSecondary" className="mt-2 block">
          You can sign in again at any time.
        </Text>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setLogoutOpen(false)}
            className="rounded-md px-4 py-2 text-sm text-text-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-md bg-danger px-4 py-2 text-sm font-semibold text-white"
          >
            Log out
          </button>
        </div>
      </Modal>
      <WithdrawModal visible={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
    </main>
  );
}
