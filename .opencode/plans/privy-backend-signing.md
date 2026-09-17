# Rencana: Aktifkan Backend Signing (Privy Authorization Key)

Konteks: wallet embedded milik user; backend (`privyClobSigner.ts`) memanggil
`signTypedData` tanpa `authorization_context`, sehingga Privy menolak →
saldo "—" dan trading gagal. User memilih: signer dipasang **lewat Privy
Dashboard saja** (tanpa tombol `addSigners` di app), tanpa dana USDC
(cukup saldo terbaca).

## Langkah user (di Dashboard Privy, di luar kode)

1. **Authorization keys** → buat key P-256. Catat:
   - **key quorum / authorization key ID** (publik, tidak perlu di app),
   - **private key** (base64 PKCS8, tanpa header PEM — ditampilkan sekali).
2. Jadikan key itu **signer default wallet embedded**: Embedded wallets →
   konfigurasi signer/additional signers. Catatan: biasanya hanya berlaku
   untuk wallet yang dibuat setelah konfigurasi; wallet test lama mungkin
   perlu "Add signer"/akun test baru — cek di Dashboard.
3. Simpan private key sebagai `PRIVY_AUTHORIZATION_PRIVATE_KEY` di
   `apps/backend/.env.local` (jangan pernah di commit / app klien).

## Perubahan kode (setelah disetujui)

Backend saja — tidak ada perubahan mobile/web:

1. `apps/backend/src/lib/env.ts`: getter `privyAuthorizationPrivateKey`
   (opsional; app tetap bisa boot untuk baca-baca tanpa key).
2. `apps/backend/src/lib/trading/privyClobSigner.ts`:
   - kirim `authorization_context: { authorization_private_keys: [privateKey] }`
     pada `signTypedData` (`wallets().ethereum().signTypedData`);
   - jika env kosong → throw pesan jelas ("Set
     PRIVY_AUTHORIZATION_PRIVATE_KEY — lihat docs/WALLET.md"), bukan error
     Privy yang membingungkan;
   - tulis ulang doc comment: prasyarat sekarang dashboard + env, bukan
     delegasi sisi klien yang belum ada.
   - Ini memperbaiki sekaligus CLOB L2 auth (`createOrDeriveApiKey`) yang
     dipakai `GET /wallet/balance` dan `POST /trading/orders`.
3. `apps/backend/.env.example`: tambah `PRIVY_AUTHORIZATION_PRIVATE_KEY`
   dengan komentar singkat.
4. Docs:
   - `docs/WALLET.md`: bagian "Backend Signing (Authorization Key)" dengan
     langkah dashboard + env + catatan policy (disarankan membatasi signer
     ke Exchange contract / typed-data domain).
   - `docs/INTEGRATION.md`: langkah setup backend menambah env baru ini.
   - `docs/DECISIONS.md`: entri "Backend Signing via Privy Authorization
     Key" (append-only, menjelaskan kenapa bukan tombol `addSigners`).

## Verifikasi

1. Restart backend → `GET /wallet/balance` dari app: Wallet & header Home
   harus menampilkan angka (`$0.00` asli bila saldo nol), bukan "—".
2. Bila masih "—": baca log backend
   `[wallet/balance] balance read unavailable:` — pesannya menunjukkan
   apakah key belum terpasang, bukan signer wallet, atau signature ditolak.
3. `npx tsc --noEmit` + `npm run lint` di `apps/backend` (mobile tak
   tersentuh, tetap dijalankan bila ada perubahan tak sengaja).
4. Trading nyata tidak diuji (tanpa dana) — jalur order memakai signer yang
   sama, jadi perbaikan ini prasyaratnya; uji penuh menunggu deposit USDC.
