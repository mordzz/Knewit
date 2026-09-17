# Rencana: Tombol Deposit Home, Judul Wallet, dan PnL "—"

## 1. Tombol Deposit di Home = gaya Wallet

Saat ini tombol Deposit di header Home memakai gaya pill besar
(`h-12 rounded-full px-12`, mobile plus `text-lg font-semibold`),
sedangkan di Wallet memakai gaya standar (`min-h-0 px-4 py-2`).
Samakan ke gaya Wallet:

- Web `app/(app)/page.tsx` (Header): `className="h-12 min-h-0 rounded-full
  px-12 py-0"` → `className="min-h-0 px-4 py-2"`.
- Mobile `features/home/screens/HomeScreen.tsx` (Header):
  `className="h-12 min-h-0 rounded-full px-12 py-0 text-lg font-semibold"`
  → `className="min-h-0 px-4 py-2"`.
- Perilaku sudah sama (buka flow Privy saat wallet ada, kalau belum →
  sign-in) — hanya gaya yang berubah.

## 2. Judul "Wallet" mengikuti Search/Markets/Leaderboard

Pola halaman lain:
- Web: `<Text variant="heading" className="block px-4 pb-3 pt-2 text-4xl
  font-inter-extrabold">Title</Text>` (Markets pakai `<h1>` dengan kelas
  setara).
- Mobile: `variant="heading" className="px-4 pb-3 pt-2 text-4xl"` +
  `style={{ fontFamily: typography.family.extrabold }}`.

Perubahan:
- Web `app/(app)/wallet/page.tsx`: judul `<Text variant="heading"
  className="px-4">` → `className="block px-4 pb-3 text-4xl
  font-inter-extrabold"` (tanpa `pt-2` karena `main` sudah `pt-4`,
  supaya jarak atas tidak dobel).
- Mobile `WalletScreen.tsx`: judul → `className="px-4 pb-3 text-4xl"` +
  `style={{ fontFamily: typography.family.extrabold }}`; tambah impor
  `typography` dari `@/theme`. Cabang `!isPrivyConfigured` ikut disamakan.
- Tidak menambah `<Divider />` di bawah judul (halaman lain punya garis,
  tapi baris status Wallet sudah punya `border-b`; menambah divider
  berisiko garis dobel dan mengubah spacing `gap-3`). Kalau mau garis
  juga, bilang.

## 3. Kenapa Unrealized PnL menampilkan "—"

Logika sekarang: `totalPnl` dihitung hanya dari posisi yang punya
`currentPrice`; kalau tidak ada satu pun (termasuk saat **0 posisi**),
nilainya `null` → dirender "—" (aturan proyek: jangan mengarang angka).
Dengan 0 posisi, PnL nol itu angka **nyata**, bukan karangan.

Usulan (web + mobile):
- `positions.length === 0` → tampilkan `$0.00` (netral, warna
  `textSecondary`, bukan hijau).
- Ada posisi tapi tidak ada harga live → tetap "—".
- Per-posisi P/L tidak berubah (tetap "—" bila harga posisi itu tidak ada).

## Verifikasi

- `npx tsc --noEmit` + `npm run lint` di backend & mobile; `next build`.
- Cek visual: tombol Deposit Home sama dengan Wallet; judul Wallet besar
  extra-bold seperti halaman lain; PnL `$0.00` saat tanpa posisi.

## Keputusan user (final)

- Tombol Deposit Home: **samakan ke Wallet** (`min-h-0 px-4 py-2`, kuning).
- PnL 0 posisi: **tampilkan `$0.00`** netral; "—" hanya bila ada posisi
  tanpa harga live.
- Judul Wallet: gaya Search/Markets/Leaderboard (4xl extra-bold), tanpa
  garis pemisah tambahan.

