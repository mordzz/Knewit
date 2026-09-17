# Rencana: Semua Bottom Sheet Solid Hitam + Border Glass

## Kondisi sekarang

- Mobile `components/ui/BottomSheet/index.tsx`: panel solid
  `colors.surfaceElevated` (#1E2330) + border `colors.border` (#2A3040),
  radius atas 20, `borderBottomWidth: 0`, backdrop `bg-overlay`.
- Web `components/ui/BottomSheet.tsx`: `bg-surface-elevated` +
  `border-border`, radius `rounded-t-[20px]`, struktur sama.
- Semua sheet di kedua app lewat dua komponen ini: PositionPickerSheet,
  TradingPanel (Trade), Profile settings, MarketDetail picker — jadi cukup
  mengubah dua file.
- Resep "glass edge" yang existing (`GlassSurface tone="dark"`):
  border `rgba(255,255,255,0.14)` + sheen tepi atas
  `rgba(255,255,255,0.3)` (mobile: `glass.border` + `glass.highlight`;
  web: nilai yang sama).
- Warna hitam pekat yang sudah jadi token app: `#000000`
  (mobile `colors.background`, web `--color-background` → `bg-background`).

## Perubahan

1. Mobile `BottomSheet`: fill → `colors.background` (#000000);
   `borderColor` → `glass.border`; tambah `borderTopColor: glass.highlight`
   (sheen atas); radius 20 / `borderBottomWidth: 0` / handle bar / backdrop
   tidak berubah.
2. Web `BottomSheet`: `bg-surface-elevated` → `bg-background`; border
   `border-white/[0.14] border-t-white/30` (menggantikan `border-border`);
   radius/struktur tidak berubah.
3. **Modal tengah ikut** (keputusan user): mobile
   `components/ui/Modal` berhenti memakai `GlassSurface` dan membangun
   panel solid sendiri — fill `colors.background`, radius 16,
   `glass.border` + `glass.highlight` (resep sama dengan BottomSheet);
   web `components/ui/Modal` → `bg-background rounded-2xl
   border-white/[0.14] border-t-white/30 p-6`. Backdrop/posisi tetap.
   Dampak: `GlassSurface` `tone="light"` tidak lagi punya pemakai —
   komponennya tetap dipertahankan sebagai varian primitif, hanya
   komentar "used by Modal" yang diperbarui.
4. Doc comment kedua BottomSheet + kedua Modal + GlassSurface mobile
   diperbarui; `DECISIONS.md` entri append "BottomSheet & Modal Solid
   Black + Glass Border" (melanjutkan "Glassmorphism Restored Outside
   BottomSheet": kini dua surface solid, keduanya hitam pekat ber-edge
   glass).

## Keputusan user (final)

- Hitam: `#000000` (token `background` app).
- Cakupan: **BottomSheet dan Modal tengah** dua-duanya.


## Verifikasi

- `npx tsc --noEmit` + `npm run lint` backend & mobile; `next build`.
- Cek visual: panel sheet **dan** dialog tengah hitam pekat (#000000),
  garis tepi putih transparan + sedikit lebih terang di tepi atas; konten
  tetap terbaca; backdrop tidak berubah.
