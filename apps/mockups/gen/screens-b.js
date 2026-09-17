// Screens 5-9: Trade pick, Trade confirm, Create Call, Position picker, Search.
const k = require('./kit');
const a = require('./screens-a');
const { C, W, H } = k;

function tradePick() {
  let s = a.marketDetailBase();
  let sh = '';
  sh += k.txt(24, 46, 'Trade', { size: 22, weight: 700 });
  // outcome cards
  const ow = (W - 48 - 10) / 2;
  sh += k.rect(24, 66, ow, 74, { rx: 12, fill: 'rgba(34,197,94,0.15)', stroke: C.yes, sw: 1.5 });
  sh += k.txt(24 + ow / 2, 96, 'Yes', { size: 14, weight: 700, color: C.yes, anchor: 'middle' });
  sh += k.txt(24 + ow / 2, 122, '64¢', { size: 20, weight: 800, color: C.yes, anchor: 'middle' });
  sh += k.rect(24 + ow + 10, 66, ow, 74, { rx: 12, fill: C.elevated, stroke: C.border });
  sh += k.txt(24 + ow + 10 + ow / 2, 96, 'No', { size: 14, weight: 700, anchor: 'middle' });
  sh += k.txt(24 + ow + 10 + ow / 2, 122, '36¢', { size: 20, weight: 800, color: C.text2, anchor: 'middle' });
  // amount
  sh += k.txt(24, 172, 'Amount', { size: 12, color: C.text2 });
  sh += k.inputBox(24, 182, W - 48, '$0', { value: '$25' });
  let cx = 24;
  ['$5', '$10', '$25', '$50'].forEach((p) => {
    const [el] = k.chip(cx, 242, p, p === '$25');
    sh += el;
    cx += p.length * 8.2 + 28 + 8;
  });
  // estimates
  sh += k.rect(24, 292, W - 48, 96, { rx: 12, fill: C.elevated });
  const est = [['Estimated shares', '39.06'], ['Estimated price', '64¢'], ['Estimated cost', '$25.00'], ['Payout if correct', '$39.06']];
  est.forEach(([lb, v], i) => {
    sh += k.txt(38, 314 + i * 21, lb, { size: 12, color: C.text2 });
    sh += k.txt(W - 38, 314 + i * 21, v, { size: 12, color: C.text, anchor: 'end' });
  });
  sh += k.btn(24, 404, W - 48, 'Continue with Yes · $25.00', { variant: 'yes' });
  s += k.sheet(sh, { h: 500 });
  return k.frame(s);
}

function confirmRow(y, lb, v, color) {
  return (
    k.txt(24, y, lb, { size: 12, color: C.text2 }) +
    k.txt(W - 24, y, v, { size: 13, weight: 600, color: color || C.text, anchor: 'end' })
  );
}

function tradeConfirm() {
  let s = a.marketDetailBase();
  let sh = '';
  sh += k.txt(24, 46, 'Confirm Trade', { size: 22, weight: 700 });
  sh += confirmRow(86, 'Market', 'Fed rate cut in September 2026?');
  sh += confirmRow(114, 'Position', 'YES', C.yes);
  sh += confirmRow(142, 'Amount', '$25.00');
  sh += confirmRow(170, 'Estimated price', '64¢');
  sh += confirmRow(198, 'Estimated shares', '39.06');
  sh += k.txt(24, 226, 'Wallet', { size: 12, color: C.text2 });
  sh += k.txt(W - 24, 226, '0x7a3F…9bE2', { size: 13, weight: 600, anchor: 'end' });
  sh += k.btn(24, 252, W - 48, 'Confirm Trade', { variant: 'yes' });
  sh += k.btn(24, 312, W - 48, 'Back', { variant: 'ghost' });
  s += k.sheet(sh, { h: 420 });
  return k.frame(s);
}

function createCallBase() {
  let s = '';
  s += k.icon('close', 20, 56, 24, C.text);
  s += k.btn(W - 168, 52, 148, 'Publish Callout', { h: 36, size: 13, disabled: true });
  s += k.avatar(20, 104, 22, 'You');
  s += k.txt(72, 124, "What's your call?", { size: 16, color: C.text3 });
  s += k.txt(72, 208, '0/280', { size: 11, color: C.text3 });
  s += k.glassCard(20, 240, W - 40, 64);
  s += k.icon('chart', 36, 258, 24, C.accent);
  s += k.txt(72, 266, 'Attach your position', { size: 14, weight: 700 });
  s += k.txt(72, 286, 'Only a position you hold can become a Callout.', { size: 11, color: C.text2 });
  s += k.icon('chevron', W - 46, 262, 18, C.text3);
  return s;
}

function createCall() {
  return k.frame(createCallBase());
}

function positionRow(x, y, w, d) {
  let s = k.rect(x, y, w, 86, { rx: 12, fill: C.elevated, stroke: C.border });
  const oc = d.outcome === 'YES' ? C.yes : C.no;
  s += k.txt(x + 14, y + 24, d.outcome, { size: 13, weight: 800, color: oc });
  s += k.icon('chevron', x + w - 26, y + 14, 16, C.text3);
  s += k.txt(x + 14, y + 46, d.q, { size: 13 });
  s += k.txt(x + 14, y + 70, `Entry ${d.entry}   Current ${d.cur}   Size ${d.size}`, { size: 11, color: C.text2 });
  return s;
}

function positionPicker() {
  let s = createCallBase();
  let sh = '';
  sh += k.txt(24, 46, 'My Positions', { size: 22, weight: 700 });
  sh += positionRow(24, 66, W - 48, { outcome: 'YES', q: 'Fed rate cut in September 2026?', entry: '58¢', cur: '64¢', size: '$25.00' });
  sh += positionRow(24, 162, W - 48, { outcome: 'NO', q: 'Bitcoin above $150k by Dec 31?', entry: '52¢', cur: '59¢', size: '$10.00' });
  s += k.sheet(sh, { h: 330 });
  return k.frame(s);
}

function search() {
  let s = k.txt(20, 88, 'Search', { size: 34, weight: 800 });
  s += k.line(0, 108, W, 108);
  s += k.txt(20, 142, 'Recents', { size: 18, weight: 700 });
  s += k.txt(W - 20, 142, 'Clear', { size: 13, weight: 600, color: C.accent, anchor: 'end' });
  const recents = ['fed rate cut', 'bitcoin', 'aff championship', 'ethereum etf'];
  recents.forEach((r, i) => {
    const y = 168 + i * 44;
    s += k.icon('time', 20, y, 18, C.text3);
    s += k.txt(50, y + 14, r, { size: 15 });
    s += k.icon('close', W - 36, y + 1, 15, C.text3);
  });
  // bottom search field
  s += k.rect(16, H - 64 - 66, W - 32, 52, { rx: 26, fill: C.elevated, stroke: C.border });
  s += k.icon('search', 36, H - 64 - 66 + 15, 22, C.text3);
  s += k.txt(70, H - 64 - 66 + 33, 'Search people and markets', { size: 15, color: C.text3 });
  return k.frame(s, { tab: 'search' });
}

module.exports = { tradePick, tradeConfirm, createCall, createCallBase, positionPicker, search };
