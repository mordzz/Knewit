# Rencana: Trading Bisa Diuji Tanpa Saldo + Perbaikan Error 502

## Temuan (dari kode & log)

- `POST /api/trading/orders 502` berasal dari penolakan CLOB, bukan
  kegagalan signing — signing sudah terbukti sehat (pembacaan saldo
  butuh L2 auth bertanda tangan dan berhasil). Dengan saldo/allowance
  $0, penolakan yang *diharapkan* dari CLOB adalah
  `not enough balance / allowance`.
- UI menyembunyikan penyebabnya: `friendlyTradeError` (web; mobile
  serupa) hanya memetakan error jaringan, sisanya jadi generik
  "Couldn't complete this trade right now" — karena itu terlihat seperti
  trading rusak, padahal yang kurang saldo.
- `calculateMarketPrice(tokenId, BUY, amount, FAK)` di clob-client
  memakai **order book publik** (`getOrderBook`) — bisa jadi estimasi
  tanpa auth/saldo.
- Tidak ada endpoint estimasi; `orders.ts` memakai
  `createMarketOrder` + `postOrder` terpisah.

## Perubahan

1. **Preflight di backend** (`POST /trading/orders`, sebelum sign/post):
   baca `getBalanceAllowance(COLLATERAL)`; jika `balance < usdAmount` →
   `400 insufficient_balance`; jika allowance spender < usdAmount →
   `400 insufficient_allowance` (pesan actionable: deposit / approve).
   Error CLOB asli & signing tetap `502 trade_failed`/`signing_failed` —
   tidak ada sukses palsu. Efek: tanpa saldo, hasilnya deterministik dan
   bisa diuji.
2. **Estimasi read-only**: `GET /markets/:id/trade-estimate?choiceIndex=&usdAmount=`
   → `{ estimatedPrice (cents), estimatedShares, tickSize }` memakai
   `calculateMarketPrice` + `getTickSize` (order book CLOB publik).
3. **UI (web + mobile)**: tampilkan estimasi ("≈ X shares @ Y¢") di
   panel Trade sebelum konfirmasi; map error baru ke copy spesifik
   (saldo kurang → arahkan Deposit; allowance kurang → jelaskan perlu
   approve di luar app).
4. **Tes sekali pakai (tanpa file di repo)**: karena user memilih tidak
   menyimpan script, tes dijalankan lewat script sementara di folder
   temp (seperti probe Privy/CLOB sebelumnya): cetak balance/allowance →
   estimasi `calculateMarketPrice` → `createMarketOrder` lokal tanpa
   post → satu order FAK nyata (tanpa dana, ditolak; izin user) dan
   cetak penolakan CLOB sebagai bukti pipeline sehat. Tidak ada file
   baru di repo, tidak ada npm script.
5. **Docs**: `API.md` (endpoint estimasi + error preflight),
   `DECISIONS.md` (entri preflight/estimasi/testing),
   `WALLET.md` (catatan approve di luar app).

## Verifikasi

- `tsc` + `lint` + `next build` (web), `tsc` + `lint` (mobile).
- Tes sekali pakai: signing OK + estimate OK + penolakan saldo/allowance
  dari order FAK nyata tercatat sebagai hasil yang benar.
- Uji endpoint: akun saldo 0 → `POST /trading/orders` menjawab 400
  `insufficient_balance`/`insufficient_allowance`, bukan 502 generik.

## Keputusan user (final)

- Estimasi ditampilkan di UI trade (web + mobile): **ya**.
- Aku boleh mengirim satu order FAK nyata tanpa dana sebagai tes: **ya**.
- Script preflight: **sekali pakai** (di folder temp, bukan di repo).

