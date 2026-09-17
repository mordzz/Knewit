# Rencana: Deposit (Privy Funding UI) + Approve USDC + Warna Tombol

Keputusan user: Privy funding UI (bukan deposit address / transfer manual);
Log Out tetap di baris status; sekalian tombol approve allowance ke
Exchange Polymarket. Target: backend (web) + mobile.

## A. Deposit — Privy funding UI

- **Web** (`@privy-io/react-auth`): `useAddFunds()` →
  `addFunds({ destination: { address, chain: 'eip155:137', asset: <USDC.e> },
  fiat: { assets: ['usd'] }, crypto: {} })`. Privy membuka modalnya sendiri
  (kartu/fiat + crypto). `useFundWallet` sudah deprecated, jangan dipakai.
- **Mobile** (`@privy-io/expo/ui`): `useFundWallet()` →
  `fundWallet({ address, chain: 'polygon', asset: { tokenAddress: <USDC.e> } })`.
  Perlu mount `<PrivyElements />` sekali di `AppProviders` (di dalam
  `PrivyProvider`), karena hook `/ui` bergantung padanya.
- **Token tujuan**: USDC.e `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` —
  collateral yang dipakai CLOB (bukan native USDC). Kalau rute Privy tidak
  mendukungnya, error tampil jujur (tidak difabrikasi), fallback dibahas
  terpisah (native USDC + swap).
- **Prasyarat dashboard Privy**: aktifkan Funding/deposit addresses +
  payment method + swap & gas sponsorship. Tanpa itu tombol menampilkan
  pesan error asli dari Privy.
- **Tempat tombol**: Wallet (web+mobile), `variant="primary"` = kuning,
  muncul saat wallet connected. Home header Deposit memicu flow yang sama
  bila sudah connected (kalau belum → sign-in seperti sekarang).
- Setelah flow selesai: invalidate `['wallet-balance']` + `['positions']`,
  plus caption "dana bisa butuh beberapa menit".

## B. Approve USDC ke Exchange (trading-ready)

- **Backend**:
  - `GET /wallet/balance` diperluas → `{ usdc, allowance, collateral,
    exchange, negRiskExchange, unavailable? }`. Alamat kontrak diambil dari
    `getContractConfig(Chain.POLYGON)` milik `@polymarket/clob-client`
    (sumber Polymarket, bukan hardcode). `allowance` = string mentah dari
    `getBalanceAllowance`.
  - Baru `POST /wallet/allowance/refresh` (auth): memanggil
    `clobClient.updateBalanceAllowance({ asset_type: COLLATERAL })` supaya
    cache CLOB ikut tahu setelah approve on-chain. Balas `{}`.
- **Client (web+mobile)** — tombol "Approve USDC" (`variant="secondary"`)
  muncul saat wallet connected dan allowance masih 0:
  - Encode calldata ERC-20 `approve(address,uint256)` manual:
    selector `0x095ea7b3` + address + MaxUint256 (padding manual, tanpa
    dependency baru).
  - Kirim 2 tx berurutan dari wallet embedded user: **Exchange** dan
    **NegRiskExchange** (dari respons balance). Web: `useSendTransaction`;
    mobile: `(await wallet.getProvider()).request({ method:
    'eth_sendTransaction', ... })` (provider-nya EIP-1193).
  - Sukses → panggil `POST /wallet/allowance/refresh` → invalidate
    `['wallet-balance']`.
  - Unlimited approval (MaxUint256) = perilaku standar Polymarket; dicatat
    sebagai tradeoff. Loading/error jujur.
- **Gas**: approve butuh POL di wallet. Rekomendasi: aktifkan gas
  sponsorship Privy di dashboard; kalau tidak, pesan error menyebut POL.

## C. Warna tombol

- Deposit → `variant="primary"` (kuning, `bg-accent`), di baris status.
- Log Out → tetap di baris status, `variant="no"` (merah, `bg-no`).
- Approve → `variant="secondary"` (bukan kuning, supaya Deposit tetap satu-
  satunya aksi kuning).

## File yang disentuh

- Backend: `app/api/wallet/balance/route.ts`,
  `app/api/wallet/allowance/refresh/route.ts` (baru),
  `app/(app)/wallet/page.tsx`, `app/(app)/page.tsx`,
  `hooks/useDeposit.ts` + `hooks/useApproveCollateral.ts` (baru),
  `lib/walletService.ts` (tipe respons baru).
- Mobile: `features/wallet/screens/WalletScreen.tsx`,
  `features/home/screens/HomeScreen.tsx`, `app/providers/AppProviders.tsx`
  (+`PrivyElements`), `features/wallet/hooks/useDeposit.ts` +
  `useApproveCollateral.ts` (baru),
  `features/wallet/services/walletService.ts`, `services/api/endpoints.ts`.
- Docs: `WALLET.md` (deposit + approve), `API.md` (bentuk respons balance +
  endpoint refresh), `DECISIONS.md` (entri baru).

## Verifikasi

1. `npx tsc --noEmit` + `npm run lint` di backend & mobile; `next build` web.
2. `GET /api/wallet/balance` mengembalikan `allowance`/`collateral`/
   `exchange` (uji via probe backend).
3. Uji tombol: Deposit membuka modal Privy (atau error jelas bila dashboard
   funding belum aktif); Approve → allowance berubah > 0 di endpoint,
   `updateBalanceAllowance` sukses.
4. Warna: Deposit kuning, Log Out merah, di web & mobile.
