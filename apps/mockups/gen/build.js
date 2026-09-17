// Renders all mockup screens to PNG + a flow-map overview. Run: node build.js
const fs = require('fs');
const path = require('path');
const sharp = require('D:/Work/Knewit/apps/web/node_modules/sharp');
const k = require('./kit');
const a = require('./screens-a');
const b = require('./screens-b');
const c = require('./screens-c');

const OUT = path.join(__dirname, '..');
const SVG_DIR = path.join(OUT, 'svg');
fs.mkdirSync(SVG_DIR, { recursive: true });

const iconPath = path.join(OUT, '_icon.png');
const iconB64 = fs.existsSync(iconPath) ? fs.readFileSync(iconPath).toString('base64') : null;

const SCREENS = [
  ['01-signin', () => a.signin(iconB64)],
  ['02-home', a.home],
  ['03-markets', a.markets],
  ['04-market-detail', a.marketDetail],
  ['05-trade-pick', b.tradePick],
  ['06-trade-confirm', b.tradeConfirm],
  ['07-create-call', b.createCall],
  ['08-position-picker', b.positionPicker],
  ['09-search', b.search],
  ['10-leaderboard', c.leaderboard],
  ['11-profile', c.profile],
  ['12-wallet', c.wallet],
  ['13-portfolio', c.portfolio],
  ['14-post-detail', c.postDetail],
  ['15-edit-profile', c.editProfile],
];

const TITLES = {
  '01-signin': 'Sign In',
  '02-home': 'Home Feed',
  '03-markets': 'Markets',
  '04-market-detail': 'Market Detail',
  '05-trade-pick': 'Trade — Pilih & Nominal',
  '06-trade-confirm': 'Trade — Konfirmasi',
  '07-create-call': 'Create Call',
  '08-position-picker': 'Lampirkan Posisi',
  '09-search': 'Search',
  '10-leaderboard': 'Leaderboard',
  '11-profile': 'Profile',
  '12-wallet': 'Wallet',
  '13-portfolio': 'Portfolio',
  '14-post-detail': 'Post Detail',
  '15-edit-profile': 'Edit Profile',
};

async function main() {
  const pngs = {};
  for (const [name, fn] of SCREENS) {
    const svg = fn();
    fs.writeFileSync(path.join(SVG_DIR, `${name}.svg`), svg);
    const png = await sharp(Buffer.from(svg), { density: 144 }).png().toBuffer();
    fs.writeFileSync(path.join(OUT, `${name}.png`), png);
    pngs[name] = png.toString('base64');
    console.log('rendered', name);
  }

  // ---- flow map ----
  const TW = 170;
  const TH = Math.round((844 / 390) * TW); // 368
  const CW = 1960;
  const CH = 1760;
  const N = {
    signin: [50, 150],
    home: [330, 150],
    markets: [610, 150],
    marketdetail: [890, 150],
    search: [1170, 150],
    leaderboard: [1450, 150],
    postdetail: [330, 720],
    tradepick: [890, 720],
    tradeconfirm: [1170, 720],
    createcall: [1450, 720],
    positionpicker: [1730, 720],
    profile: [610, 1290],
    wallet: [890, 1290],
    portfolio: [1170, 1290],
    editprofile: [330, 1290],
  };
  const KEY = {
    signin: '01-signin', home: '02-home', markets: '03-markets', marketdetail: '04-market-detail',
    search: '09-search', leaderboard: '10-leaderboard', postdetail: '14-post-detail',
    tradepick: '05-trade-pick', tradeconfirm: '06-trade-confirm', createcall: '07-create-call',
    positionpicker: '08-position-picker', profile: '11-profile', wallet: '12-wallet', portfolio: '13-portfolio',
    editprofile: '15-edit-profile',
  };

  let m = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}">`;
  m += `<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${k.C.accent}"/></marker>`;
  m += `<marker id="arrd" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${k.C.text3}"/></marker></defs>`;
  m += k.rect(0, 0, CW, CH, { fill: '#0A0A0A' });
  m += k.txt(50, 70, 'Knewit — Peta Alur Mobile', { size: 34, weight: 800 });
  m += k.txt(50, 100, 'Semua layar inti dan navigasinya. Garis kuning = navigasi nyata di aplikasi. Putus-putus = aksi yang mengakhiri/mengubah sesi.', { size: 14, color: k.C.text2 });

  const arrow = (d, dashed) =>
    `<path d="${d}" fill="none" stroke="${dashed ? k.C.text3 : k.C.accent}" stroke-width="2.5" stroke-dasharray="${dashed ? '7 6' : '0'}" marker-end="url(#${dashed ? 'arrd' : 'arr'})"/>`;
  const cx = (key) => N[key][0] + TW / 2;
  const top = (key) => N[key][1];
  const bottom = (key) => N[key][1] + TH;
  const right = (key) => N[key][0] + TW;
  const left = (key) => N[key][0];
  const midY = (key) => N[key][1] + TH / 2;

  // onboarding + discover
  m += arrow(`M${right('signin')} ${midY('signin')} H${left('home') - 8}`);
  m += k.txt((right('signin') + left('home')) / 2, midY('signin') - 12, 'OTP / Google / X', { size: 11, color: k.C.text2, anchor: 'middle' });
  m += arrow(`M${cx('home')} ${top('home') - 8} V124 H${cx('marketdetail')} V${top('marketdetail') - 8}`);
  m += k.txt((cx('home') + cx('marketdetail')) / 2, 118, 'tap kartu market / call', { size: 11, color: k.C.text2, anchor: 'middle' });
  m += arrow(`M${right('markets')} ${midY('markets')} H${left('marketdetail') - 8}`);
  m += arrow(`M${left('search')} ${midY('search')} H${right('marketdetail') + 8}`);
  m += k.txt((left('search') + right('marketdetail')) / 2, midY('search') - 12, 'tap market', { size: 11, color: k.C.text2, anchor: 'middle' });
  m += k.txt(cx('search'), bottom('search') + 48, 'tap orang → Profile', { size: 11, color: k.C.text3, anchor: 'middle' });
  m += arrow(`M${cx('leaderboard')} ${bottom('leaderboard') + 8} V585 H${cx('profile') + 40} V${top('profile') - 8}`);
  m += k.txt(cx('leaderboard') + 10, 570, 'tap user → profil', { size: 11, color: k.C.text2 });

  // social
  m += arrow(`M${cx('home')} ${bottom('home') + 8} V${top('postdetail') - 8}`);
  m += k.txt(cx('home') + 10, (bottom('home') + top('postdetail')) / 2, 'tap call', { size: 11, color: k.C.text2 });
  m += arrow(`M${cx('postdetail')} ${bottom('postdetail') + 8} V1210 H${cx('profile') - 40} V${top('profile') - 8}`);
  m += k.txt(cx('postdetail') + 10, 1195, 'tap penulis → profil', { size: 11, color: k.C.text2 });

  // trade loop
  m += arrow(`M${cx('marketdetail')} ${bottom('marketdetail') + 8} V${top('tradepick') - 8}`);
  m += k.txt(cx('marketdetail') + 10, (bottom('marketdetail') + top('tradepick')) / 2, 'Trade', { size: 11, color: k.C.text2 });
  m += arrow(`M${right('tradepick')} ${midY('tradepick')} H${left('tradeconfirm') - 8}`);
  m += arrow(`M${right('tradeconfirm')} ${midY('tradeconfirm')} H${left('createcall') - 8}`);
  m += k.txt((right('tradeconfirm') + left('createcall')) / 2, midY('tradeconfirm') - 12, 'sukses → buat Call', { size: 11, color: k.C.text2, anchor: 'middle' });
  m += arrow(`M${right('createcall')} ${midY('createcall')} H${left('positionpicker') - 8}`);
  m += k.txt((right('createcall') + left('positionpicker')) / 2, midY('createcall') - 12, 'lampirkan posisi', { size: 11, color: k.C.text2, anchor: 'middle' });
  m += arrow(`M${cx('positionpicker')} ${top('positionpicker') - 8} V640 H${cx('home') - 30} V${bottom('home') + 8}`);
  m += k.txt((cx('positionpicker') + cx('home')) / 2, 660, 'Publish → muncul di Home feed (loop)', { size: 11, color: k.C.text2, anchor: 'middle' });

  // wallet chain
  m += arrow(`M${left('profile')} ${midY('profile')} H${right('editprofile') + 8}`);
  m += k.txt((left('profile') + right('editprofile')) / 2, midY('profile') - 12, 'Edit', { size: 11, color: k.C.text2, anchor: 'middle' });
  m += arrow(`M${right('profile')} ${midY('profile')} H${left('wallet') - 8}`);
  m += arrow(`M${right('wallet')} ${midY('wallet')} H${left('portfolio') - 8}`);
  m += arrow(`M${cx('wallet')} ${bottom('wallet') + 8} V1710 H${cx('signin')} V${bottom('signin') + 8}`, true);
  m += k.txt((cx('wallet') + cx('signin')) / 2, 1698, 'Log Out → sesi aplikasi berakhir (wallet tertanam tetap ada)', { size: 11, color: k.C.text3, anchor: 'middle' });

  // group labels
  m += k.txt(50, 130, '1 · Masuk & Jelajah', { size: 15, weight: 700, color: k.C.accent });
  m += k.txt(250, 700, '2 · Sosial', { size: 15, weight: 700, color: k.C.accent });
  m += k.txt(1000, 700, '3 · Trading → Call Loop', { size: 15, weight: 700, color: k.C.accent });
  m += k.txt(470, 1260, '4 · Profil & Wallet', { size: 15, weight: 700, color: k.C.accent });

  // nodes
  for (const key of Object.keys(N)) {
    const [x, y] = N[key];
    m += k.rect(x - 6, y - 6, TW + 12, TH + 12, { rx: 18, fill: '#141414', stroke: k.C.border });
    m += `<image href="data:image/png;base64,${pngs[KEY[key]]}" xlink:href="data:image/png;base64,${pngs[KEY[key]]}" x="${x}" y="${y}" width="${TW}" height="${TH}"/>`;
    m += k.txt(x + TW / 2, y + TH + 26, TITLES[KEY[key]], { size: 13, weight: 600, color: k.C.text2, anchor: 'middle' });
  }

  // "belum live" badges
  const badge = (key, label) => {
    const [x, y] = N[key];
    m += k.rect(x + TW - 96, y + 8, 92, 22, { rx: 11, fill: 'rgba(245,158,11,0.18)', stroke: '#F59E0B' });
    m += k.txt(x + TW - 50, y + 23, label, { size: 10, weight: 700, color: '#F59E0B', anchor: 'middle' });
  };
  badge('home', 'Deposit: stub');
  badge('tradeconfirm', 'belum live');

  // legend
  m += k.rect(1450, 1290, 460, 300, { rx: 16, fill: '#141414', stroke: k.C.border });
  m += k.txt(1476, 1330, 'Catatan kejujuran (sesuai kode)', { size: 15, weight: 700 });
  const notes = [
    '• Saldo Home "$0.00" & tombol Deposit = placeholder,',
    '   on-ramp belum diimplementasikan.',
    '• Trade end-to-end belum terverifikasi: butuh delegasi',
    '   signing Privy + USDC di Polygon. Gagal = error nyata,',
    '   bukan sukses palsu.',
    '• Call selalu wajib melampirkan posisi yang dimiliki.',
    '• Portfolio menampilkan 0 / kosong sampai backend',
    '   posisi benar-benar terisi.',
  ];
  notes.forEach((n, i) => {
    m += k.txt(1476, 1362 + i * 22, n, { size: 12, color: k.C.text2 });
  });

  m += '</svg>';
  fs.writeFileSync(path.join(SVG_DIR, 'flow-map.svg'), m);
  const mapPng = await sharp(Buffer.from(m), { density: 110 }).png().toBuffer();
  fs.writeFileSync(path.join(OUT, 'flow-map.png'), mapPng);
  console.log('rendered flow-map');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
