# Rencana: Audit & Perbaikan Desimal Harga (sub-cent) + Blok Estimasi Trade

Keputusan user: satuan internal tetap **cents desimal 4 dp**; tampilan UI
**4 desimal penuh** (`0.1000¢`, `31.0000%`); migration `0007` disetujui.

## Akar masalah

- `normalize.parseChoices` membulatkan harga ke whole cents
  (`Math.round(fraction*100)`) → tick sub-cent Polymarket (0.001/0.0001)
  hilang menjadi 0.
- Kolom DB `markets.yes_price/no_price`, `orders.price`,
  `positions.entry_price`, `posts.position_snapshot_entry_price` bertipe
  `integer` cents — tidak bisa menyimpan sub-cent; `orders.ts` juga
  membulatkan `filledPrice` ke whole cents.
- `price-history` membulatkan ke cents → chart datar.
- Formatter (web & mobile) `Math.round(cents)` → `0¢`.
- Trade panel: row "Estimated price" memakai `choice.price` (integer
  cents), bukan hasil estimasi; "Estimated shares"/"Payout if correct"
  sudah benar dari estimasi (untuk $0.001: 1000 share itu memang benar).

## Perubahan

### 1. DB — migration `0007_decimal_prices.sql`
`integer` → `numeric(10,4)` untuk: `markets.yes_price`, `markets.no_price`,
`orders.price`, `positions.entry_price`,
`posts.position_snapshot_entry_price`. (Dijalankan bersama 0004/0005/0006.)

### 2. Backend
- `lib/polymarket/normalize.ts`: `toCents` → `Number((fraction*100).toFixed(4))`
  (tanpa pembulatan integer).
- `app/api/markets/[id]/price-history/route.ts`: `Number((p*100).toFixed(4))`.
- `lib/trading/orders.ts`: `filledPrice = Number(((filledUsd/filledSize)*100).toFixed(4))`;
  `filledSize` dari decimal-string SDK (`Number(...)`, tanpa round).
- `app/api/markets/[id]/trade-estimate/route.ts`: harga & shares
  `toFixed(4)`.
- Cek ulang `marketCache` (cast number, tanpa round) dan
  `types/social.ts` (komentar satuan: cents hingga 4 dp).

### 3. Client (web + mobile)
- `formatters.ts` / `formatCurrency.ts`: `formatPrice = ${cents.toFixed(4)}¢`,
  `formatProbability = ${cents.toFixed(4)}%` (4 dp penuh).
- `TradingPanel` (web & mobile): row "Estimated price" memakai
  `estimate.data?.estimatedPrice ?? price` (fallback saat loading), dan
  shares dari `estimate.data?.estimatedShares` (sudah); baris konfirmasi
  ikut memakai nilai yang sama.
- Chart (`MultiLineChart` web & mobile, `MarketPriceChart`/`EventPriceChart`):
  label tick & tooltip memakai formatter desimal.
- Fixtures dev (`marketDetail.mock.ts`) tidak lagi `Math.round` harga.

### 4. Docs
- `DATABASE.md` (kolom numeric + satuan), `API.md` (harga cents 4 dp),
  `DECISIONS.md` (entri "Sub-Cent Prices"), `DESIGN.md` bila menyebut
  presisi harga.

## Verifikasi

- `tsc` + `lint` + `next build` (web), `tsc` + `lint` (mobile).
- Live: market sub-cent (tick 0.001) via API → harga `0.1000`, bukan 0;
  endpoint estimasi → shares/harga konsisten; chart tidak datar.
- Script assert konversi: dollars ↔ cents(4dp) ↔ raw 6-desimal pUSD.
