# Rencana: Perbaikan Tampilan Layar Create Callout (web + mobile)

Keputusan user: rapikan seluruh layar Create Callout (dibuka dari FAB
Home); kartu di dalamnya pakai **solid hitam + edge glass**; avatar/nama
pakai **profil asli**.

## Temuan sekarang

- Header hanya X + tombol "Publish Callout", tanpa judul (halaman lain
  punya judul 4xl extra-bold).
- Area tulis = `Input` transparan tanpa surface di atas latar hitam.
- Avatar selalu "?" (mobile: `user?.displayName` dari auth store yang
  `null`; web: `uri={null}` hardcoded).
- Kartu "Attach your position" & kartu posisi terpilih memakai
  `GlassSurface tone="dark"` translusen — kusam di atas hitam dan tidak
  selaras dengan gaya terbaru (BottomSheet/Modal/sign-in = hitam pekat +
  edge glass).

## Perubahan

### 1. Resep "solid panel" jadi satu sumber
- Mobile `theme/colors.ts`: tambah `solidPanel`
  `{ backgroundColor: colors.background, borderWidth: 1,
  borderColor: glass.border, borderTopColor: glass.highlight }`.
- Web: konstanta kelas `SOLID_PANEL_CLASS =
  'border border-white/[0.14] border-t-white/30 bg-background'`
  (di `components/ui/solidPanel.ts`).
- Pakai ulang di BottomSheet, Modal, panel sign-in, dan kartu-kartu baru
  composer → tidak ada drift.

### 2. Layar Create Callout (mobile `CreateCallScreen.tsx`, web `create-call/page.tsx`)
- **Judul** "New Callout" (gaya judul halaman: 4xl extra-bold; web
  `font-inter-extrabold`, mobile `typography.family.extrabold`) di bawah
  baris X + Publish. Tombol Publish tetap di kanan atas (pola composer).
- **Kartu komposer** (baru): panel solid hitam + edge glass, radius 16,
  berisi Avatar **dari `useProfile()`** (profil sendiri via `'me'`) +
  nama tampilan, `Input` transparan multiline (min-h-24) + counter
  karakter di dalam kartu. '?' hanya saat profil masih dimuat / belum
  login.
- **Kartu "Attach your position"** dan **kartu posisi terpilih**:
  `GlassSurface` → `solidPanel` (konten tetap sama; kartu posisi tetap
  preview, tanpa klaim "verified").
- **Card "Sign in to publish"** ikut `solidPanel` agar seragam.
- Tidak mengubah logika publish/validasi (Publish tetap disabled sampai
  ada posisi + teks valid; error tetap jujur).

### 3. Docs
- `DECISIONS.md` entri "Create Callout Composer Polish" (+ alasan
  ekstraksi resep solid panel).
- `DESIGN.md`: sebut `solidPanel` sebagai primitif untuk overlay +
  kartu composer.

## Verifikasi

- `tsc` + `lint` + `next build` (web), `tsc` + `lint` + `prettier`
  (mobile).
- Manual: composer menampilkan avatar+nama asli; judul tampil; semua
  kartu hitam pekat dengan garis tepi glass; publish/posisi/error tetap
  seperti sebelumnya.

## Keputusan user (final)

- Header: **judul "New Callout" 4xl extra-bold** di bawah baris X +
  Publish; tombol Publish **tetap kanan atas**.
- Resep solid panel **dipakai ulang di semua**: BottomSheet, Modal,
  panel sign-in, dan kartu-kartu composer.

