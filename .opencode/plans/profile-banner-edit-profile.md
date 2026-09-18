# Rencana: Banner Profile ala X, Padding Following, Edit Profile Lengkap

Keputusan user: Supabase Storage; tambah `expo-image-picker` (mobile);
placeholder banner = gradien lembut; username = lowercase 3–20, unik.

## A. Storage + API

1. **Migration `0008_profile_images.sql`**
   - `alter table users add column if not exists banner_url text;`
   - Bucket publik: `insert into storage.buckets (id,name,public) values
     ('profile-images','profile-images',true) on conflict (id) do nothing;`
     (upload hanya via service role backend; baca publik).
2. **`POST /users/me/images?kind=avatar|banner`** (auth, multipart):
   validasi mime `image/png|jpeg|webp` & ≤2MB → upload ke
   `profile-images/{userId}/{kind}-{timestamp}.{ext}` (hapus file lama
   bila ada) → update `avatar_url`/`banner_url` → balas `UserProfile`.
3. **`PATCH /users/me` diperluas**: `{ displayName, handle, bio,
   avatarUrl?, bannerUrl? }`
   - displayName: 1–50; bio ≤160; handle `^[a-z0-9_]{3,20}$` (lowercase);
     duplikat → `409 handle_taken`.
   - avatarUrl/bannerUrl hanya boleh URL bucket kita (prefix
     `…/storage/v1/object/public/profile-images/`); `""` → `null`
     (hapus gambar).
4. `UserProfile` + `buildUserProfile` menambah `bannerUrl` (`User` publik
   tidak berubah); `UpdateProfileInput` diperluas di backend + kedua app.
5. Docs: `API.md`, `DATABASE.md`, `DECISIONS.md` (menggantikan "Edit
   Profile Scope"), `DESIGN.md` (banner).

## B. Profile dengan banner (web `ProfileView.tsx`, mobile `ProfileScreen.tsx`)

- Banner full-width ±3:1 (mobile `h-32`, web `h-36`, `object-cover`);
  tanpa gambar → gradien lembut dari token yang ada (mobile: layer blob
  accent transparan di atas `surface`, pola sama seperti sign-in; web:
  `bg-gradient-to-br from-accent-muted via-surface to-surface-elevated`).
- Avatar menumpuk di tepi bawah banner (`-mt-10`, ring
  `border-background`), lalu nama/username + tombol **Edit Profile**
  (sudah ada), bio, counts.
- **Padding bottom di bawah baris Following/Followers** (`pb-4`) sebelum
  baris Wallet & Portfolio.

## C. Edit Profile gaya Create Callout (web + mobile)

- Header: close/kembali (kiri) + judul **Edit Profile** di sampingnya +
  tombol **Save** (kanan, primary, disabled sampai valid).
- Kartu solid-panel #1: preview **banner** (tap → ganti) + garis pemisah
  + baris **avatar** (tap → ganti) dengan teks "Change cover"/"Change
  photo".
- Kartu solid-panel #2 (dengan garis pemisah antar-field seperti
  composer): **Name** (≤50, counter), **Username** (`@`, auto-lowercase,
  3–20, hanya a-z0-9_), **Bio** (multiline, ≤160, counter).
- Web: `<input type="file" accept="image/png,image/jpeg,image/webp">`
  tersembunyi; Mobile: `expo-image-picker`
  (`launchImageLibraryAsync`, `allowsEditing`, aspect 3:1 untuk banner).
- Upload langsung saat gambar dipilih (loading state di area gambar),
  hasilnya mengganti cache `['profile','me']`; Save mengirim PATCH;
  error dipetakan (username dipakai, format salah, file >2MB).

## D. Client plumbing

- Web `lib/userService.ts` + mobile `userService.ts`:
  `uploadProfileImage(kind, file)`; `apiRequest` di kedua app diubah agar
  **tidak** memasang `Content-Type: application/json` saat body `FormData`.
- Hooks baru `useUploadProfileImage(kind)` → set cache profil +
  invalidasi feed/komentar (avatar/display name tampil di kartu feed).
- `useUpdateProfile` dipakai ulang (cache replace + invalidasi).

## E. Dependency & prasyarat

- Mobile: `npx expo install expo-image-picker` → **butuh `npx expo
  prebuild` + rebuild dev client** (config plugin menambahkan izin
  galeri/kamera).
- User menjalankan migration `0004`–`0008` di Supabase.

## F. Verifikasi

- `tsc` + `lint` + `next build` (web); `tsc` + `lint` + `prettier`
  (mobile).
- Manual: upload banner + avatar, ganti nama/username/bio; profil
  menampilkan banner + avatar menumpuk; padding bawah counts; duplikat
  username → pesan jelas; file >2MB → ditolak; hapus gambar → kembalI
  placeholder gradien.
