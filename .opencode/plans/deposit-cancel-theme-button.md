# Rencana: Cancel Deposit Bukan Error, Tema Modal, Posisi Tombol Deposit

Konteks: tiga permintaan user — (1) user menutup/membatalkan flow deposit
tidak boleh memunculkan pesan error (error asli tetap tampil), (2) modal
deposit mengikuti tema UI yang ada, (3) tombol Deposit di Wallet pindah ke
sisi kanan baris Balance.

## Temuan SDK (terverifikasi dari bundle yang terpasang)

- Web `useAddFunds`: saat user menutup flow, promise **reject** dengan
  `Error("User cancelled funding")` (bundle react-auth:
  `o(Error("User cancelled funding"))`). Sub-flow crypto bisa memunculkan
  `Error("USER_EXITED")`. Tidak ada callback `onUserExited` di `useAddFunds`.
- Mobile `useFundWallet` (`@privy-io/expo/ui`): reject dengan
  `PrivyUIError("funding_flow_cancelled", "Funding flow was cancelled")`
  → `error.code === 'funding_flow_cancelled'`.
- Tema: modal Privy sudah dark + accent dari `PrivyProvider.appearance`
  (web) dan `PrivyElements.config` (mobile). Yang belum bertema adalah
  **hosted UI MoonPay**: web punya `config.fundingMethodConfig.moonpay.uiConfig`
  (`MoonpayUiConfig { accentColor?, theme? }`), mobile punya
  `fundWallet({ moonpay: { uiConfig } })`.

## A. Cancel ≠ error (web + mobile)

- Helper terpusat `isUserCancelledFunding(error)`:
  - web: `lib/privyErrors.ts` → true bila message `'User cancelled funding'`,
    `'USER_EXITED'`, atau `/cancell?ed/i`.
  - mobile: `features/wallet/utils/privyErrors.ts` → true bila
    `code === 'funding_flow_cancelled'` atau `/cancell?ed/i` di message.
- Dipakai di 4 catch yang ada: `app/(app)/wallet/page.tsx`,
  `app/(app)/page.tsx` (Header), mobile `WalletScreen.tsx`, mobile
  `HomeScreen.tsx` — cancel → kembalikan state bersih (tidak ada
  `depositError`), error asli tetap ditampilkan seperti sekarang.
- Helper terpusat supaya penyesuaian SDK ke depan cukup di satu tempat.

## B. Tema modal deposit

- Web `app/providers.tsx`: tambah
  `fundingMethodConfig: { moonpay: { uiConfig: { accentColor: '#FDCC03', theme: 'dark' } } }`.
- Mobile `useDeposit`: kirim
  `moonpay: { uiConfig: { accentColor: '#FDCC03', theme: 'dark' } }` pada
  `fundWallet(...)`. `PrivyElements` sudah dark + accent (tidak berubah).
- Coinbase onramp tidak mengekspos opsi tema — dicatat di docs.

## C. Posisi tombol Deposit di Wallet

- Web `app/(app)/wallet/page.tsx`: tombol Deposit dipindah dari baris
  status ke **kanan baris Balance** (baris Balance jadi
  `flex items-center justify-between`); baris status tinggal Log Out merah.
- Mobile `WalletScreen.tsx`: sama — Deposit di kanan baris Balance.
- `isDepositing`/`depositError` tetap, error muncul di bawah baris Balance.
- Tombol Deposit di header Home tidak berubah (memang sudah di kanan).
- Tombol Approve USDC tetap di kolom kiri bawah nilai Balance (tidak
  ikut pindah) supaya Deposit tetap satu-satunya aksi kuning di kanan.

## File yang disentuh

- Web: `app/providers.tsx`, `app/(app)/wallet/page.tsx`,
  `app/(app)/page.tsx`, `lib/privyErrors.ts` (baru).
- Mobile: `features/wallet/hooks/useDeposit.ts`,
  `features/wallet/screens/WalletScreen.tsx`,
  `features/home/screens/HomeScreen.tsx`,
  `features/wallet/utils/privyErrors.ts` (baru).
- Docs: `WALLET.md` (cancel ≠ error, catatan tema), `DECISIONS.md` (entri).

## Verifikasi

1. `npx tsc --noEmit` + `npm run lint` di backend & mobile; `next build`.
2. Manual: buka Deposit lalu tutup → tidak ada pesan error; matikan
   funding di dashboard (atau paksa error) → pesan error asli tetap
   tampil; modal MoonPay tampil dark + accent kuning; Deposit ada di kanan
   baris Balance pada web & mobile.
