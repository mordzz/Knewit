# Rencana: Rapikan UI Profile (Border Wallet, Wallet & Portfolio, Tombol Edit Profile)

Keputusan user: judul baris wallet jadi **"Wallet & Portfolio"** (subtitle
"Positions and PnL"); tombol **"Edit Profile"** di kanan nama/username;
BottomSheet Settings **dihapus**.

## Perubahan (web `ProfileView.tsx` + mobile `ProfileScreen.tsx`)

1. **Header avatar**: hilangkan ikon gear untuk profil sendiri; sisi kanan
   hanya berisi tombol Follow untuk profil orang lain.
2. **Blok nama/username**: jadi baris `justify-between`; di profil sendiri
   ada tombol kecil `secondary` **"Edit Profile"** di kanan →
   `router.push('/profile/edit')` (web) / `navigation.navigate('EditProfile')`
   (mobile).
3. **Baris wallet (self)**: judul **"Wallet & Portfolio"**, subtitle
   **"Positions and PnL"**, dan border atas: `border-y border-border`.
   Blok wallet address untuk profil orang lain juga diberi `border-t`.
4. **Hapus BottomSheet Settings** beserta `settingsVisible`, komponen
   `SettingsRow`, dan import `BottomSheet` di kedua file.
5. Doc comment kedua file yang menyebut "settings gear/sheet" diperbarui;
   `DECISIONS.md` entri baru (menggantikan keputusan sheet settings lama).

## Tambahan: hapus baris Leaderboard Rank

Permintaan lanjutan user: "hapus jg leaderboard di profile".

- Web `ProfileView.tsx` (baris 185–195): hapus blok
  `user.leaderboardRank != null` (Link ke `/leaderboard`).
- Mobile `ProfileScreen.tsx` (baris 265–278): hapus blok
  `user.leaderboardRank != null` (Pressable ke tab Leaderboard).
- Tab/screen Leaderboard sendiri tidak diubah.
- Data API: **hapus sampai API** (keputusan user) —
  - `backend/src/types/social.ts`: hapus `leaderboardRank` dari `UserProfile`.
  - `backend/src/lib/social.ts`: hapus field `leaderboardRank` dari
    `buildUserProfile` (tetap memakai `standing?.volume` untuk
    `tradingVolume`); perbarui komentarnya.
  - `mobile/src/types/social.ts`: hapus `leaderboardRank` (+ komentar).
  - `mobile/src/features/profile/fixtures/userProfile.mock.ts`: hapus
    barisnya + perbarui komentar.
  - Komentar penyebut `tradingVolume/leaderboardRank` di
    `backend/src/lib/leaderboard.ts` & `lib/polymarket/dataApiClient.ts`
    disesuaikan; `docs/API.md` (row profil), `docs/DATABASE.md`
    (kalimat "not stored on User"), dan `DECISIONS.md` diperbarui.
  - `GET /leaderboard` dan `LeaderboardScreen`/tab-nya tidak berubah.

## Verifikasi

- `tsc` + `lint` + `next build` (web), `tsc` + `lint` + `prettier`
  (mobile).
- Manual: garis muncul di atas baris Wallet; judul/subtitle baru; tombol
  Edit Profile di kanan nama hanya untuk profil sendiri; sheet settings
  tidak ada lagi; baris Leaderboard Rank hilang; profil orang lain tetap
  punya tombol Follow.

