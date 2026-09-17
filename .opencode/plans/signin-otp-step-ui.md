# Rencana: UI Khusus Langkah Kode OTP di Sign-In (+ warning WalletConnect)

## 0. Jawaban: warning WalletConnect

`[browser] WalletConnect Core is already initialized … Init() was called 2
times.` adalah **warning, bukan error** — dari `@walletconnect/core` yang
di-init dua kali di realm yang sama. Penyebab umum di dev: React
StrictMode (Next dev mengaktifkannya) men-double-invoke effect + HMR saat
file berubah. Efeknya kosmetik; login, saldo, dan signing tidak
terpengaruh; di build produksi normalnya tidak muncul.

Opsi menghilangkan (opsional): app ini tidak memakai external wallet
(`loginMethods: ['email','google','twitter']`), jadi WalletConnect bisa
dimatikan di `app/providers.tsx`:
`externalWallets: { walletConnect: { enabled: false }, solana: { ... } }`.
Tidak mengganggu silencer Solana (itu wallet-standard, bukan WC) dan
sedikit memangkas bundle.

## 1. UI khusus langkah kode (web + mobile)

Saat ini langkah kode hanya mengganti isi panel: judul "Sign in"
menghilang, muncul caption "Enter the code sent to {email}" + satu input
+ Verify + "Use a different email".

Menjadi langkah tersendiri yang jelas:

- Header langkah 2: tombol kembali (chevron) + judul **"Check your
  email"** + subjudul `We sent a 6-digit code to <email>` (alamat
  ditampilkan, bukan input lagi).
- Input kode OTP:
  - Opsi A (disarankan): **6 kotak terpisah** (`CodeInput` baru, tanpa
    dependency — refs + auto-advance + backspace mundur + dukungan
    paste). Fokus otomatis, hanya angka, `maxLength=1` per kotak.
  - Opsi B: satu input tengah dengan `letter-spacing` besar + `maxLength=6`.
- **Resend code** dengan countdown 60 detik (`sendCode({ email })` yang
  sama dipanggil ulang; tombol disabled sampai hitungan habis).
- **Change email** sebagai tombol teks sekunder (menggantikan "Use a
  different email", kembali ke langkah 1 dan reset kode).
- Autofill: mobile `textContentType="oneTimeCode"` +
  `autoComplete="one-time-code"`; web `autoComplete="one-time-code"` +
  `inputMode="numeric"`.
- Tombol **Verify** dengan state loading yang ada; baris error tetap di
  bawah. Panel tetap hitam pekat + edge glass (tidak berubah).

File:
- Mobile `features/auth/screens/SignInScreen.tsx` (+
  `components/ui/CodeInput` bila Opsi A).
- Web `app/sign-in/page.tsx` (+ `components/ui/CodeInput.tsx` bila Opsi A).
- Docs: entri `DECISIONS.md` (langkah OTP tersendiri + autofill/resend).

## Keputusan user (final)

- Input kode: **6 kotak** (komponen `CodeInput`, auto-advance/backspace/paste).
- **Resend code + countdown 60 detik**: ya.
- **WalletConnect dimatikan** di `app/providers.tsx`
  (`externalWallets.walletConnect.enabled: false`) — external wallet memang
  tidak pernah ditawarkan (`loginMethods: email/google/twitter`), dan user
  juga mematikan opsi dashboard "Create embedded wallets for all users,
  even if they have linked external wallets". Konfigurasi Solana
  connectors tetap (untuk mematikan warning Solana).

## Verifikasi

- `tsc` + `lint` + `next build` (web), `tsc` + `lint` (mobile).
- Manual: kirim kode → header "Check your email" + alamat tampil; 6 kotak
  angka auto-advance/paste; Verify loading; resend menunggu countdown;
  change email kembali ke langkah 1; error tetap tampil apa adanya; console
  dev tanpa warning WalletConnect.
