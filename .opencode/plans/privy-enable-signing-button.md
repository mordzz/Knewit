# Rencana: Tombol Sekali-Klik "Aktifkan Trading" (add signer)

Tujuan: mendaftarkan authorization key server sebagai **signer** pada wallet
embedded user yang sudah ada, supaya backend boleh menandatangani (saldo +
order). Privy hanya mengizinkan ini lewat **consent pemilik wallet di app**
(`useSigners().addSigners`) — tidak ada jalur dashboard untuk wallet lama.

## Data yang dibutuhkan dari user

- **Key quorum ID** dari Dashboard Privy → Wallet infrastructure →
  Authorization keys (kunci yang sudah dibuat; bentuk ID `t0…`/`cm…`).
  Ini publik; private key-nya sudah ada di `backend/.env`.

## Env

- Web: `NEXT_PUBLIC_PRIVY_SIGNER_ID` → `lib/publicEnv.ts` (`privySignerId`),
  `.env`, `.env.example`.
- Mobile: `EXPO_PUBLIC_PRIVY_SIGNER_ID` → `src/app/config/env.ts`
  (`privySignerId`), `.env`, `.env.example`.

## UI (hanya muncul jika signing belum aktif)

Kondisi tampil: wallet connected **dan** `signerId` terisi **dan**
`wallet-balance` mengembalikan `usdc == null && !isPending` (artinya Privy
menolak tanda tangan). Kalau env kosong → tombol tidak dirender (caption
"Shows once wallet signing is active." tetap ada).

- Web `app/(app)/wallet/page.tsx`: `const { addSigners } = useSigners()`
  dari `@privy-io/react-auth`; tombol secondary "Enable trading" di bawah
  baris Balance; `addSigners({ address, signers: [{ signerId }] })`; saat
  sukses invalidasi `['wallet-balance']`; tampilkan error asli Privy bila
  gagal (tidak difabrikasi).
- Mobile `features/wallet/screens/WalletScreen.tsx`: sama, memakai
  `useSigners` dari `@privy-io/expo` + `useQueryClient()`.

Ini satu kali per wallet; setelah signer terpasang tombol hilang karena
`usdc` sudah mengembalikan angka (`$0.00` asli bila kosong).

## Docs

- `docs/WALLET.md` "Backend Signing": langkah 3 diganti — consent lewat
  tombol di app (web + mobile), bukan dashboard.
- `docs/INTEGRATION.md`: tambah env signer id (publik) untuk kedua app.
- `docs/DECISIONS.md`: append entri "Signer Consent via In-App Button".

## Verifikasi

1. `npx tsc --noEmit` + `npm run lint` di backend & mobile.
2. User klik "Enable trading" sekali di web (dan/atau mobile).
3. Jalankan ulang probe `signTypedData` + CLOB: harus `SIGNING OK`,
   `CLOB L2 AUTH OK`, `BALANCE OK … USDC 0`.
4. Wallet & Home menampilkan angka saldo, bukan "—".

## Blocker

- Menunggu **key quorum ID** dari user sebelum env bisa diisi dan tombol
  bisa diuji.
