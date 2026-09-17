// Screens 10-14: Leaderboard, Profile, Wallet, Portfolio, Post Detail.
const k = require('./kit');
const a = require('./screens-a');
const { C, W, H } = k;

function leaderboard() {
  let s = k.txt(20, 88, 'Leaderboard', { size: 34, weight: 800 });
  s += k.line(0, 108, W, 108);
  s += k.tabRow(0, 116, W, ['Global', 'Following'], 0);
  // top 3 highlight
  s += k.glassCard(16, 168, W - 32, 92);
  const top = [['2', 'Sinta M.', '$41.2K'], ['1', 'Rama P.', '$58.7K'], ['3', 'Bimo A.', '$33.5K']];
  top.forEach(([rank, name, vol], i) => {
    const x = 16 + 30 + i * ((W - 92) / 3);
    const big = rank === '1';
    s += k.circle(x + 22, big ? 200 : 208, big ? 24 : 20, { fill: C.elevated, stroke: big ? C.accent : C.border, sw: big ? 2 : 1 });
    s += k.txt(x + 22, (big ? 200 : 208) + 5, name[0], { size: 14, weight: 700, color: C.text2, anchor: 'middle' });
    s += k.txt(x + 22, 244, name, { size: 11, weight: 600, anchor: 'middle' });
    s += k.txt(x + 22, 258, vol, { size: 10, color: C.accent, anchor: 'middle' });
  });
  const rows = [
    ['4', 'Dewi Lestari', '$28.9K'],
    ['5', 'Andi Wijaya', '$24.1K'],
    ['6', 'Putri Ayu', '$19.8K'],
    ['7', 'Joko Santoso', '$17.2K'],
  ];
  let y = 284;
  for (const [rank, name, vol] of rows) {
    s += k.txt(24, y + 24, rank, { size: 14, weight: 700, color: C.text3 });
    s += k.avatar(52, y + 4, 17, name);
    s += k.txt(94, y + 20, name, { size: 14, weight: 600 });
    s += k.txt(94, y + 38, `${vol} volume`, { size: 11, color: C.text3 });
    s += k.btn(W - 104, y + 6, 80, 'Follow', { variant: 'secondary', h: 32, size: 12 });
    s += k.line(16, y + 52, W - 16, y + 52);
    y += 52;
  }
  // your rank
  s += k.rect(16, y + 12, W - 32, 56, { rx: 14, fill: C.elevated, stroke: C.accent, sw: 1 });
  s += k.txt(32, y + 46, 'Your Rank', { size: 13, weight: 700 });
  s += k.txt(W - 32, y + 46, '#42 · $3.1K', { size: 13, weight: 700, color: C.accent, anchor: 'end' });
  return k.frame(s, { tab: 'ranks' });
}

function profile() {
  let s = '';
  s += k.avatar(20, 56, 32, 'You');
  s += k.btn(W - 120, 66, 100, 'Edit', { variant: 'secondary', h: 36, size: 13 });
  s += k.txt(20, 144, 'Knewit User', { size: 20, weight: 800 });
  s += k.txt(20, 166, '@knewituser', { size: 13, color: C.text2 });
  s += k.txt(20, 190, 'Trading what I know. Calls backed by real positions.', { size: 13, color: C.text2 });
  s += k.txt(20, 218, '128', { size: 14, weight: 800 });
  s += k.txt(58, 218, 'Following', { size: 13, color: C.text2 });
  s += k.txt(140, 218, '256', { size: 14, weight: 800 });
  s += k.txt(178, 218, 'Followers', { size: 13, color: C.text2 });
  // wallet row
  s += k.line(0, 240, W, 240);
  s += k.icon('wallet', 20, 254, 22, C.accent);
  s += k.txt(54, 264, 'Wallet', { size: 14, weight: 700 });
  s += k.txt(54, 282, 'Connected · 0x7a3F…9bE2', { size: 11, color: C.text2 });
  s += k.icon('chevron', W - 38, 258, 18, C.text3);
  s += k.line(0, 296, W, 296);
  // trading performance
  s += k.txt(20, 326, 'Trading Performance', { size: 14, weight: 700 });
  const stats = [['Trading Volume', '$3.1K'], ['Calls', '12'], ['Posts', '34']];
  stats.forEach(([lb, v], i) => {
    const x = 20 + i * ((W - 40) / 3);
    s += k.txt(x, 352, lb, { size: 10, color: C.text3 });
    s += k.txt(x, 372, v, { size: 16, weight: 800 });
  });
  s += k.line(0, 392, W, 392);
  s += k.icon('trophy', 20, 406, 20, C.accent);
  s += k.txt(52, 422, 'Leaderboard Rank', { size: 14, weight: 700 });
  s += k.txt(W - 20, 422, '#42', { size: 14, weight: 800, color: C.accent, anchor: 'end' });
  s += k.line(0, 440, W, 440);
  s += k.tabRow(0, 448, W, ['Posts', 'Calls', 'Activity'], 1);
  let y = 500;
  const [row] = a.callRow(16, y, W - 32, {
    name: 'Knewit User', handle: 'knewituser', time: '1d',
    body: 'Taking YES on the September cut. Position attached.',
    market: 'Fed rate cut in September 2026?', yesPct: 64, verified: true, likes: 31, comments: 8,
  });
  s += row;
  return k.frame(s, { tab: 'profile' });
}

function infoCard(y, title, rows) {
  let s = k.rect(16, y, W - 32, 44 + rows.length * 24, { rx: 14, fill: C.surface, stroke: C.border });
  s += k.txt(32, y + 28, title, { size: 14, weight: 700 });
  rows.forEach(([lb, v], i) => {
    s += k.txt(32, y + 56 + i * 24, lb, { size: 12, color: C.text2 });
    s += k.txt(W - 32, y + 56 + i * 24, v, { size: 12, anchor: 'end' });
  });
  return s;
}

function wallet() {
  let s = k.txt(20, 88, 'Wallet', { size: 28, weight: 800 });
  // status card
  s += k.rect(16, 110, W - 32, 108, { rx: 14, fill: C.surface, stroke: C.border });
  s += k.icon('check', 32, 126, 20, C.yes);
  s += k.txt(60, 142, 'Wallet Connected', { size: 15, weight: 700, color: C.yes });
  s += k.line(32, 158, W - 32, 158);
  s += k.txt(32, 180, 'Wallet Address', { size: 11, color: C.text2 });
  s += k.txt(32, 202, '0x7a3F…9bE2', { size: 14, weight: 600 });
  s += k.icon('copy', W - 56, 186, 18, C.text3);
  s += infoCard(232, 'Wallet Information', [['Wallet type', 'Privy Embedded Wallet'], ['Network', 'Ethereum']]);
  // security
  s += k.rect(16, 348, W - 32, 92, { rx: 14, fill: C.surface, stroke: C.border });
  s += k.icon('shield', 32, 362, 18, C.text3);
  s += k.txt(58, 378, 'Security', { size: 14, weight: 700 });
  s += k.txt(32, 402, 'Managed by Privy — Knewit never sees your', { size: 11, color: C.text2 });
  s += k.txt(32, 418, 'private keys or recovery phrase.', { size: 11, color: C.text2 });
  // portfolio row
  s += k.rect(16, 456, W - 32, 60, { rx: 14, fill: C.surface, stroke: C.border });
  s += k.icon('chart', 32, 474, 22, C.accent);
  s += k.txt(66, 480, 'Portfolio', { size: 14, weight: 700 });
  s += k.txt(66, 498, 'Positions and activity', { size: 11, color: C.text2 });
  s += k.icon('chevron', W - 44, 476, 18, C.text3);
  s += k.btn(16, 540, W - 32, 'Log Out', { variant: 'ghost' });
  s += k.txt(W / 2, 612, 'Logging out ends your app session only —', { size: 10, color: C.text3, anchor: 'middle' });
  s += k.txt(W / 2, 626, "it doesn't delete your embedded wallet.", { size: 10, color: C.text3, anchor: 'middle' });
  return k.frame(s, { tab: 'profile' });
}

function portfolio() {
  let s = k.txt(20, 88, 'Portfolio', { size: 28, weight: 800 });
  s += k.icon('wallet', 20, 116, 22, C.yes);
  s += k.txt(54, 126, '0x7a3F…9bE2', { size: 14, weight: 700 });
  s += k.txt(54, 144, 'Connected', { size: 11, color: C.text2 });
  s += k.line(0, 168, W, 168);
  s += k.txt(20, 196, 'Open Positions', { size: 11, color: C.text2 });
  s += k.txt(20, 222, '0', { size: 20, weight: 800 });
  s += k.txt(W / 2 + 10, 196, 'Unrealized PnL', { size: 11, color: C.text2 });
  s += k.txt(W / 2 + 10, 222, '$0.00', { size: 20, weight: 800 });
  s += k.line(0, 244, W, 244);
  s += k.icon('chart', W / 2 - 13, 380, 26, C.text3);
  s += k.txt(W / 2, 432, 'No positions yet', { size: 16, weight: 700, anchor: 'middle' });
  s += k.txt(W / 2, 456, 'Positions you take on markets', { size: 12, color: C.text2, anchor: 'middle' });
  s += k.txt(W / 2, 474, 'will show up here.', { size: 12, color: C.text2, anchor: 'middle' });
  return k.frame(s, { tab: 'profile' });
}

function postDetail() {
  let s = '';
  s += k.icon('back', 16, 58, 24, C.text);
  s += k.txt(52, 74, 'Post', { size: 18, weight: 700 });
  s += k.line(0, 96, W, 96);
  const [row, ny] = a.callRow(16, 112, W - 32, {
    name: 'Rama Putra', handle: 'ramaputra', time: '2h',
    body: 'Fed minutes lean dovish. Taking YES on a September cut before the crowd catches up.',
    market: 'Fed rate cut in September 2026?', yesPct: 64, verified: true, likes: 128, comments: 24, liked: true,
  });
  s += row;
  s += k.txt(16, ny + 30, 'Comments', { size: 15, weight: 700 });
  let y = ny + 48;
  const comments = [
    { name: 'Sinta Maharani', handle: 'sintam', time: '1h', body: 'CPI next week could flip this. Size in carefully.', likes: 12, comments: 2 },
    { name: 'Bimo Aditama', handle: 'bimoadi', time: '44m', body: 'Entered at 58¢. Riding with you.', likes: 5, comments: 0 },
  ];
  for (const c of comments) {
    const [r2, ny2] = a.callRow(16, y, W - 32, c);
    s += r2;
    y = ny2 + 10;
  }
  // composer
  s += k.line(0, H - 64 - 62, W, H - 64 - 62);
  s += k.avatar(16, H - 64 - 50, 16, 'You');
  s += k.rect(56, H - 64 - 54, W - 56 - 64, 40, { rx: 20, fill: C.elevated, stroke: C.border });
  s += k.txt(72, H - 64 - 29, 'Add a comment', { size: 13, color: C.text3 });
  s += k.icon('send', W - 48, H - 64 - 48, 24, C.accent);
  return k.frame(s, { tab: 'home' });
}

function editProfile() {
  let s = '';
  s += k.icon('close', 20, 56, 24, C.text);
  s += k.txt(W / 2, 74, 'Edit Profile', { size: 20, weight: 700, anchor: 'middle' });
  // display name
  s += k.txt(20, 130, 'Display name', { size: 12, color: C.text2 });
  s += k.inputBox(20, 142, W - 40, 'Your name', { value: 'Knewit User' });
  s += k.txt(W - 20, 210, '11/50', { size: 11, color: C.text3, anchor: 'end' });
  // bio
  s += k.txt(20, 242, 'Bio', { size: 12, color: C.text2 });
  s += k.rect(20, 254, W - 40, 92, { rx: 12, fill: C.elevated, stroke: C.border });
  s += k.txt(34, 282, 'Trading what I know. Calls backed', { size: 15 });
  s += k.txt(34, 304, 'by real positions.', { size: 15 });
  s += k.txt(W - 20, 366, '51/160', { size: 11, color: C.text3, anchor: 'end' });
  s += k.btn(20, 396, W - 40, 'Save');
  return k.frame(s, { tab: 'profile' });
}

module.exports = { leaderboard, profile, wallet, portfolio, postDetail, editProfile };
