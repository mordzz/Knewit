// Screens 1-4: Sign In, Home, Markets, Market Detail.
const k = require('./kit');
const { C, W, H } = k;

function signin(iconB64) {
  let s = '';
  s += k.circle(40, 60, 150, { fill: C.accent, opacity: 0.08 });
  s += k.circle(W - 10, H - 60, 170, { fill: C.accent, opacity: 0.06 });
  if (iconB64) {
    s += `<image href="data:image/png;base64,${iconB64}" x="${W / 2 - 70}" y="150" width="140" height="140"/>`;
  } else {
    s += k.rect(W / 2 - 70, 150, 140, 140, { fill: C.accent, rx: 32 }) +
      k.txt(W / 2, 235, 'knewit', { size: 30, weight: 800, color: '#000', anchor: 'middle' });
  }
  // bottom glass sheet
  const sy = 430;
  s += k.rect(0, sy, W, H - sy, { fill: C.glassFill, stroke: C.glassBorder, rx: 24 });
  s += k.rect(0, sy + 22, W, H - sy - 22, { fill: C.glassFill });
  s += k.rect(W / 2 - 18, sy + 12, 36, 4, { rx: 2, fill: 'rgba(255,255,255,0.2)' });
  s += k.txt(W / 2, sy + 66, 'Sign in', { size: 30, weight: 700, anchor: 'middle' });
  s += k.txt(W / 2, sy + 92, 'Enter your email to get started', { size: 13, color: C.text2, anchor: 'middle' });
  s += k.inputBox(20, sy + 116, W - 40, 'Enter your email', { glassy: true });
  s += k.btn(20, sy + 176, W - 40, 'Continue');
  s += k.line(20, sy + 256, W / 2 - 60, sy + 256, { stroke: C.border });
  s += k.txt(W / 2, sy + 260, 'Or sign in with', { size: 12, color: C.text3, anchor: 'middle' });
  s += k.line(W / 2 + 60, sy + 256, W - 20, sy + 256, { stroke: C.border });
  s += k.rect(20, sy + 280, (W - 52) / 2, 48, { rx: 24, fill: 'rgba(255,255,255,0.10)', stroke: 'rgba(255,255,255,0.15)' });
  s += k.txt(20 + (W - 52) / 4, sy + 310, 'Google', { size: 15, weight: 600, anchor: 'middle' });
  s += k.rect(32 + (W - 52) / 2, sy + 280, (W - 52) / 2, 48, { rx: 24, fill: 'rgba(255,255,255,0.10)', stroke: 'rgba(255,255,255,0.15)' });
  s += k.txt(32 + ((W - 52) / 4) * 3, sy + 310, 'X', { size: 15, weight: 700, anchor: 'middle' });
  s += k.txt(W / 2, sy + 364, 'No seed phrase. Your wallet is managed securely by Privy.', { size: 11, color: C.text3, anchor: 'middle' });
  return k.frame(s);
}

function callRow(x, y, w, d) {
  let s = k.avatar(x, y + 4, 20, d.name);
  s += k.txt(x + 48, y + 16, d.name, { size: 14, weight: 700 });
  s += k.txt(x + 48 + d.name.length * 8 + 8, y + 16, `@${d.handle} · ${d.time}`, { size: 12, color: C.text3 });
  const lines = k.wrap(d.body, 46);
  lines.forEach((ln, i) => {
    s += k.txt(x + 48, y + 38 + i * 19, ln, { size: 14, color: C.text });
  });
  let cy = y + 38 + lines.length * 19 + 8;
  if (d.market) {
    s += k.glassCard(x + 48, cy, w - 48, 74);
    s += k.rect(x + 60, cy + 15, 44, 44, { rx: 10, fill: C.elevated, stroke: C.border });
    s += k.icon('chart', x + 70, cy + 25, 24, C.accent);
    const ql = k.wrap(d.market, 34);
    s += k.txt(x + 116, cy + 30, ql[0], { size: 13, weight: 600 });
    s += k.txt(x + 116, cy + 48, ql[1] || '', { size: 13, weight: 600 });
    s += k.txt(x + 116, cy + 66, `${d.yesPct}% Yes`, { size: 12, weight: 700, color: C.yes });
    if (d.verified) {
      s += k.icon('verified', x + w - 128, cy + 56, 13, C.yes);
      s += k.txt(x + w - 110, cy + 66, 'Verified Position', { size: 10, weight: 600, color: C.yes });
    }
    cy += 86;
  }
  s += k.icon('chat', x + 48, cy + 2, 17, C.text3);
  s += k.txt(x + 72, cy + 15, String(d.comments), { size: 12, color: C.text3 });
  s += k.icon('heart', x + 128, cy + 2, 17, d.liked ? C.no : C.text3);
  s += k.txt(x + 152, cy + 15, String(d.likes), { size: 12, color: d.liked ? C.no : C.text3 });
  s += k.line(x, cy + 32, x + w, cy + 32);
  return [s, cy + 32];
}

function home() {
  let s = '';
  s += k.txt(20, 92, '$0.00', { size: 34, weight: 800 });
  s += k.btn(W - 132, 58, 112, 'Deposit', { h: 40, size: 14 });
  s += k.line(0, 116, W, 116);
  s += k.tabRow(0, 124, W, ['For You', 'Following'], 0);
  let y = 176;
  const posts = [
    { name: 'Rama Putra', handle: 'ramaputra', time: '2h', body: 'Fed minutes lean dovish. Taking YES on a September cut before the crowd catches up.', market: 'Fed rate cut in September 2026?', yesPct: 64, verified: true, likes: 128, comments: 24, liked: true },
    { name: 'Sinta Maharani', handle: 'sintam', time: '5h', body: 'Volume is thin and whales are selling. I am fading this rally with NO.', market: 'Bitcoin above $150k by Dec 31?', yesPct: 41, verified: true, likes: 86, comments: 17 },
    { name: 'Bimo Aditama', handle: 'bimoadi', time: '8h', body: 'Rain forecast just jumped to 70% for race day. Markets have not priced this in yet.', market: null, likes: 42, comments: 9 },
  ];
  for (const p of posts) {
    const [row, ny] = callRow(16, y, W - 32, p);
    s += row;
    y = ny + 14;
  }
  return k.frame(s, { tab: 'home', fab: true });
}

function marketCard(x, y, w, d) {
  let s = k.glassCard(x, y, w, 132);
  s += k.rect(x + 14, y + 14, 48, 48, { rx: 12, fill: C.elevated, stroke: C.border });
  s += k.icon('chart', x + 26, y + 26, 24, C.accent);
  const ql = k.wrap(d.q, 30);
  s += k.txt(x + 74, y + 34, ql[0], { size: 14, weight: 700 });
  s += k.txt(x + 74, y + 53, ql[1] || '', { size: 14, weight: 700 });
  s += k.txt(x + 14, y + 84, d.cat, { size: 11, weight: 600, color: C.text3 });
  const bw = w - 28;
  s += k.rect(x + 14, y + 94, bw * (d.yes / 100), 8, { rx: 4, fill: C.yes });
  s += k.rect(x + 14 + bw * (d.yes / 100), y + 94, bw * (1 - d.yes / 100), 8, { rx: 4, fill: C.no });
  s += k.txt(x + 14, y + 122, `Yes ${d.yes}%`, { size: 12, weight: 700, color: C.yes });
  s += k.txt(x + 84, y + 122, `No ${100 - d.yes}%`, { size: 12, weight: 700, color: C.no });
  s += k.txt(x + w - 14, y + 122, d.vol, { size: 12, color: C.text3, anchor: 'end' });
  return s;
}

function markets() {
  let s = k.txt(20, 92, 'Markets', { size: 34, weight: 800 });
  s += k.line(0, 112, W, 112);
  let cx = 16;
  ['Trending', 'Politics', 'Sports', 'Crypto'].forEach((c, i) => {
    const [el, w] = k.chip(cx, 126, c, i === 0);
    s += el;
    cx += w + 8;
  });
  const cards = [
    { q: 'Fed rate cut in September 2026?', cat: 'Politics', yes: 64, vol: '$2.4M Vol' },
    { q: 'Bitcoin above $150k by Dec 31?', cat: 'Crypto', yes: 41, vol: '$5.1M Vol' },
    { q: 'Indonesia wins AFF Championship 2026?', cat: 'Sports', yes: 28, vol: '$310K Vol' },
    { q: 'Ethereum ETF inflows top $1B in Q4?', cat: 'Crypto', yes: 55, vol: '$1.2M Vol' },
  ];
  let y = 176;
  for (const c of cards) {
    s += marketCard(16, y, W - 32, c);
    y += 146;
  }
  return k.frame(s, { tab: 'markets' });
}

function marketDetailBase() {
  let s = '';
  s += k.icon('back', 16, 58, 24, C.text);
  s += k.rect(52, 52, 48, 48, { rx: 12, fill: C.elevated, stroke: C.border });
  s += k.icon('chart', 64, 64, 24, C.accent);
  s += k.txt(112, 74, 'Fed rate cut in', { size: 17, weight: 700 });
  s += k.txt(112, 94, 'September 2026?', { size: 17, weight: 700 });
  // probability + chart panel
  s += k.glassCard(16, 118, W - 32, 236);
  s += k.txt(32, 146, 'Current probability', { size: 12, color: C.text2 });
  s += k.txt(32, 172, 'Yes 64%', { size: 16, weight: 800, color: C.yes });
  s += k.txt(W - 32, 172, 'No 36%', { size: 16, weight: 800, color: C.no, anchor: 'end' });
  const bw = W - 64;
  s += k.rect(32, 182, bw * 0.64, 10, { rx: 5, fill: C.yes });
  s += k.rect(32 + bw * 0.64, 182, bw * 0.36, 10, { rx: 5, fill: C.no });
  // price line
  const pts = [0.42, 0.45, 0.44, 0.5, 0.53, 0.51, 0.57, 0.6, 0.58, 0.62, 0.64];
  const px = pts.map((p, i) => `${32 + (bw / (pts.length - 1)) * i},${330 - p * 190}`).join(' ');
  s += `<polyline points="${px}" fill="none" stroke="${C.yes}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
  s += k.txt(32, 348, 'Jul', { size: 10, color: C.text3 });
  s += k.txt(W - 32, 348, 'Sep', { size: 10, color: C.text3, anchor: 'end' });
  // stats
  const stats = [['Volume', '$2.4M'], ['Liquidity', '$812K'], ['Ends', 'Sep 30, 2026']];
  stats.forEach(([lb, v], i) => {
    const x = 16 + i * ((W - 32) / 3);
    s += k.txt(x + 4, 384, lb, { size: 11, color: C.text3 });
    s += k.txt(x + 4, 404, v, { size: 14, weight: 700 });
  });
  s += k.btn(16, 424, W - 32, 'Trade');
  s += k.tabRow(0, 494, W, ['Comments', 'Top Holders'], 0);
  return s;
}

function marketDetail() {
  let s = marketDetailBase();
  let y = 546;
  const rows = [
    { name: 'Rama Putra', handle: 'ramaputra', time: '2h', body: 'Dovish minutes confirmed my thesis. YES all the way.', likes: 45, comments: 6 },
    { name: 'Sinta Maharani', handle: 'sintam', time: '4h', body: 'Careful — CPI print next week can flip this fast.', likes: 21, comments: 3 },
  ];
  for (const p of rows) {
    const [row, ny] = callRow(16, y, W - 32, p);
    s += row;
    y = ny + 12;
  }
  return k.frame(s, { tab: 'home' });
}

module.exports = { signin, home, markets, marketDetail, marketDetailBase, callRow, marketCard };
