# Rencana: Hapus total Post legacy, Hapus Callout/Reply, Satukan Wallet + Portfolio

Disetujui user (2026-09-18). Batasan: API 3rd-party hanya Privy + Polymarket. Tidak ada data fabrikasi.

## A. Hapus total Post legacy

Backend (`apps/backend`):
- Hapus file `src/app/api/users/[id]/posts/route.ts`.
- `src/types/social.ts`: buang `postCount` dari `UserProfile`; tambah `canDelete: boolean` (server-computed) di `FeedItem`.
- `src/types/activity.ts`: buang `'POST'` dari `ActivityType` + `PostActivityItem` + union.
- `src/lib/social.ts`: buang query `postCount` + field `postCount`; isi `canDelete: viewerUserId === post.author_id` di `buildFeedItems`.
- `src/app/api/users/[id]/activity/route.ts`: buang case `'POST'`.
- `src/components/ActivityRow.tsx`: buang case `'POST'`.
- `src/components/ProfileView.tsx`: buang StatColumn "Posts" + baris Portfolio (lihat D).
- `src/lib/postService.ts`: buang `createPost`; hapus `src/hooks/useCreatePost.ts` (verifikasi tak dipakai).

Mobile (`apps/mobile`):
- `src/services/api/endpoints.ts`: buang `userPosts`.
- `src/types/social.ts`: buang `postCount`; tambah `FeedItem.canDelete`.
- `src/types/activity.ts`: buang `'POST'` + `PostActivityItem` + union.
- `src/features/profile/screens/ProfileScreen.tsx`: buang StatColumn "Posts"; cek pemakaian `usePositions`/baris Portfolio.
- `src/features/profile/components/ActivityRow/index.tsx`: buang case `'POST'`.
- Fixtures: `features/profile/fixtures/userProfile.mock.ts` (postCount), `features/profile/fixtures/activity.mock.ts` (generator POST), `features/home/fixtures/feed.mock.ts` (item `positionSnapshot: null` + `canDelete` per item), `features/markets/fixtures/marketDetail.mock.ts` (entri `positionSnapshot: null` legacy).
- `src/features/home/services/postService.ts`: buang `createPost`; hapus `features/home/hooks/useCreatePost.ts`.
- Pertahankan render toleran `positionSnapshot: PositionSnapshot | null` (legacy rows bisa saja belum terhapus), tapi tidak ada lagi jalur membuat Post biasa.

DB:
- Migration baru `apps/backend/supabase/migrations/0006_remove_legacy_posts.sql`: `delete from posts where position_id is null;` (FK comments/likes sudah `on delete cascade`). Dijalankan user bersama 0004/0005.

## B. Hapus Callout

- `apps/backend/src/app/api/calls/[id]/route.ts`: tambah `DELETE` — auth wajib, author-only (403), 404 bila tak ada, hapus row, balas `{}`.
- `FeedItem.canDelete` sudah ditambah di bagian A (buildFeedItems).
- Web:
  - `src/lib/postService.ts`: tambah `deletePost(id)`.
  - `src/hooks/useDeletePost.ts` baru: mutation + invalidate `['feed']`, `['feed-following']`, `['profile-calls']`, `['profile-activity']`, `['market-activity']`, `['profile']`, buang cache `['post', id]`.
  - `src/app/(app)/calls/[id]/PostDetailView.tsx`: header kanan tombol "…" hanya bila `post.data.canDelete` → modal konfirmasi (pola `CommentRow`) → goBack.
- Mobile:
  - `src/features/home/services/postService.ts`: tambah `deletePost`.
  - `src/features/home/hooks/useDeletePost.ts` baru (invalidasi sama + `navigation.goBack()` di komponen).
  - `src/features/home/screens/PostDetailScreen.tsx`: header kanan ("…", hanya bila `canDelete`) → modal konfirmasi → goBack.
- Kartu feed tidak diberi tombol hapus (konsisten pola komentar: aksi hanya di detail).

## C. Hapus Reply — verifikasi saja

`DELETE /comments/:id` + menu "…" di `CommentRow` (mobile & web) sudah ada untuk komentar dan balasan. Tidak ada perubahan; hanya uji manual + pastikan tidak ada regresi setelah A/B.

## D. Satukan Wallet + Portfolio

Backend:
- Route baru `src/app/api/wallet/balance/route.ts`: `GET` auth wajib → `buildClobClientForUser(wallet.id, wallet.address)` → `getBalanceAllowance({ asset_type: AssetType.COLLATERAL })` → `{ usdc: Number(balance) / 1e6 }`; gagal → `{ usdc: null, unavailable: true }` (jangan pernah 0 palsu). Semua via API Polymarket/Privy yang sudah ada; tanpa env/dependency baru.
- Saldo tampil "—" + caption "Balance appears once wallet signing is active" sampai delegasi signing Privy ditambahkan (lihat `privyClobSigner.ts`).

Web:
- `src/app/(app)/wallet/page.tsx` jadi halaman gabungan: status + alamat + Connect/Log Out ringkas → Saldo USDC → ringkasan posisi (jumlah + total unrealized PnL bila `currentPrice` tersedia) → daftar posisi (market, outcome berwarna via `choiceTone`, entry → current, size, P/L per posisi) → empty/loading/error (pakai `useQuery(['positions'])` yang sudah ada).
- Hapus `src/app/(app)/portfolio/page.tsx`.
- `src/components/ProfileView.tsx`: hapus baris Portfolio; Wallet row subtitle → "Address, positions, and PnL".
- `src/app/(app)/page.tsx`: header ganti placeholder `$0.00` dengan saldo real (hook baru `src/hooks/useWalletBalance.ts`).

Mobile:
- `src/features/wallet/screens/WalletScreen.tsx` jadi layar gabungan dengan isi yang sama (pakai `usePositions` dari `features/portfolio/hooks`).
- Hapus `src/features/portfolio/screens/PortfolioScreen.tsx` + route/tipe navigasi `Portfolio`; hapus tautan Portfolio di Profile/Wallet.
- `src/features/home/screens/HomeScreen.tsx`: header balance real via hook `features/wallet/hooks/useWalletBalance.ts`.
- Buang dari Wallet: kartu "Wallet Information", kartu "Security", catatan logout panjang.

## E. Docs

- `docs/API.md`: hapus `GET /users/:id/posts`, `postCount`, activity POST; tambah `DELETE /calls/:id` + `GET /wallet/balance`.
- `docs/WALLET.md`: layar Wallet gabungan + saldo CLOB + catatan delegasi signing.
- `docs/DECISIONS.md`: Post legacy dihapus total; aturan `FeedItem.canDelete`; Wallet menggantikan Portfolio.

## F. Verifikasi

- `npx tsc --noEmit` + `npm run lint` di `apps/backend` dan `apps/mobile` → 0 error.
- Grep: tidak ada sisa `postCount`, `'POST'`, `/users/:id/posts`, route Portfolio, `createPost`.
- Manual: hapus Callout (author) & Reply; Wallet menampilkan saldo "—" saat signing belum aktif (bukan angka palsu) dan posisi/PnL real; header Home real.
