// Shared SVG kit for Knewit mobile mockups. Pure string builders, no deps.
const C = {
  bg: '#000000',
  surface: '#151923',
  elevated: '#1E2330',
  border: '#2A3040',
  text: '#FFFFFF',
  text2: '#9AA3B2',
  text3: '#5C6577',
  yes: '#22C55E',
  no: '#F43F5E',
  accent: '#FDCC03',
  danger: '#EF4444',
  glassFill: 'rgba(14,15,19,0.94)',
  glassBorder: 'rgba(255,255,255,0.14)',
};
const FONT = "'Segoe UI', Arial, sans-serif";
const W = 390;
const H = 844;

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function txt(x, y, s, o = {}) {
  const { size = 14, weight = 400, color = C.text, anchor = 'start', opacity = 1, ls } = o;
  const spacing = ls != null ? ` letter-spacing="${ls}"` : '';
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" opacity="${opacity}"${spacing}>${esc(s)}</text>`;
}

function rect(x, y, w, h, o = {}) {
  const { fill = 'none', stroke, sw = 1, rx = 0, opacity = 1 } = o;
  const st = stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" opacity="${opacity}"${st}/>`;
}

function line(x1, y1, x2, y2, o = {}) {
  const { stroke = C.border, sw = 1, dash, opacity = 1 } = o;
  const d = dash ? ` stroke-dasharray="${dash}"` : '';
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"${d}/>`;
}

function circle(cx, cy, r, o = {}) {
  const { fill = 'none', stroke, sw = 1, opacity = 1 } = o;
  const st = stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : '';
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}"${st}/>`;
}

function path(d, o = {}) {
  const { stroke = C.text, sw = 2, fill = 'none', opacity = 1 } = o;
  return `<path d="${d}" stroke="${stroke}" stroke-width="${sw}" fill="${fill}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`;
}

const ICONS = {
  home: 'M3 10.5L12 3l9 7.5M5.5 9.6V21h13V9.6',
  chart: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  search: 'M10.8 4a6.8 6.8 0 1 0 0 13.6 6.8 6.8 0 0 0 0-13.6zM16 16l5 5',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0V4zM8 5.5H4.5a3.5 3.5 0 0 0 3.6 3.5M16 5.5h3.5a3.5 3.5 0 0 1-3.6 3.5M12 13v3.5M8.5 20.5h7M10 16.5h4',
  person: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4.5 20.5c.8-3.8 3.9-5.5 7.5-5.5s6.7 1.7 7.5 5.5',
  plus: 'M12 5v14M5 12h14',
  heart: 'M12 20.5S3.5 15.6 3.5 9.9A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.5 2.9c0 5.7-8.5 10.6-8.5 10.6z',
  chat: 'M4 5.5h16V16H9l-5 4.5V5.5z',
  back: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12.5l2.8 2.8L16.5 9.5',
  alert: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5V13M12 16.2v.3',
  wallet: 'M3.5 7.5h17V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5zM3.5 7.5L6 4h12.5M15.5 13.5h4',
  chevron: 'M9.5 5l7 7-7 7',
  time: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5.2l3.4 2.6',
  send: 'M3.5 11.5L20.5 4l-6.5 17-2.2-7.3z',
  edit: 'M4.5 19.5l4-.8L20 7.2 16.8 4 5.3 15.5z',
  shield: 'M12 3l7 2.8v6c0 4.2-3 7.2-7 9.2-4-2-7-5-7-9.2v-6z',
  logout: 'M9.5 4.5H5v15h4.5M13.5 8.5l4 3.5-4 3.5M17 12H9.5',
  copy: 'M9 9h11v11H9zM4 15V4h11',
  verified: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12.5l2.8 2.8L16.5 9.5',
};

function icon(name, x, y, size, color = C.text, sw) {
  const s = size / 24;
  return `<g transform="translate(${x},${y}) scale(${s})">${path(ICONS[name], { stroke: color, sw: sw || 1.9 })}</g>`;
}

function avatar(x, y, r, label, fill) {
  const initial = (label || '?').trim().charAt(0).toUpperCase();
  return (
    circle(x + r, y + r, r, { fill: fill || C.elevated, stroke: C.border, sw: 1 }) +
    txt(x + r, y + r + r * 0.38, initial, { size: r * 1.05, weight: 700, color: C.text2, anchor: 'middle' })
  );
}

function wrap(s, maxChars) {
  const words = String(s).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

function statusBar() {
  return (
    txt(28, 30, '9:41', { size: 15, weight: 600 }) +
    rect(310, 18, 18, 10, { rx: 3, stroke: C.text2, sw: 1, opacity: 0.9 }) +
    rect(312, 20, 12, 6, { rx: 1.5, fill: C.text2 }) +
    path('M340 20l4 4 4-4', { stroke: C.text2, sw: 1.6 }) +
    rect(354, 16, 24, 13, { rx: 4, stroke: C.text2, sw: 1 }) +
    rect(356, 18, 16, 9, { rx: 2, fill: C.text2 })
  );
}

const TABS = [
  ['home', 'home'],
  ['chart', 'markets'],
  ['search', 'search'],
  ['trophy', 'ranks'],
  ['person', 'profile'],
];

function tabBar(active) {
  let s = rect(0, H - 64, W, 64, { fill: C.bg }) + line(0, H - 64, W, H - 64);
  const step = W / 5;
  TABS.forEach(([ic, key], i) => {
    const on = key === active;
    s += icon(ic, step * i + step / 2 - 13, H - 64 + 18, 26, on ? C.text : C.text3, on ? 2.1 : 1.8);
  });
  return s;
}

function fab() {
  return (
    circle(W - 46, H - 64 - 46, 28, { fill: C.accent }) +
    icon('plus', W - 46 - 13, H - 64 - 46 - 13, 26, '#000000', 2.4)
  );
}

function frame(body, o = {}) {
  const { tab, fab: showFab = false } = o;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += rect(0, 0, W, H, { fill: C.bg });
  s += statusBar();
  s += body;
  if (tab) s += tabBar(tab);
  if (showFab) s += fab();
  return s + '</svg>';
}

function btn(x, y, w, label, o = {}) {
  const { variant = 'primary', h = 48, size = 16, disabled = false } = o;
  const map = {
    primary: [C.accent, '#000000'],
    yes: [C.yes, '#000000'],
    no: [C.no, '#000000'],
    secondary: [C.elevated, C.text],
    ghost: ['none', C.text2],
  };
  const [bg, fg] = map[variant];
  const stroke = variant === 'secondary' ? C.border : undefined;
  return (
    rect(x, y, w, h, { fill: bg, rx: h / 2, stroke, opacity: disabled ? 0.45 : 1 }) +
    txt(x + w / 2, y + h / 2 + size * 0.36, label, { size, weight: 700, color: fg, anchor: 'middle' })
  );
}

function chip(x, y, label, active) {
  const w = label.length * 8.2 + 28;
  return [
    rect(x, y, w, 32, {
      rx: 16,
      fill: active ? C.accent : C.elevated,
      stroke: active ? undefined : C.border,
    }) + txt(x + w / 2, y + 21, label, { size: 13, weight: 600, color: active ? '#000' : C.text2, anchor: 'middle' }),
    w,
  ];
}

function inputBox(x, y, w, placeholder, o = {}) {
  const { h = 48, value, glassy = false } = o;
  return (
    rect(x, y, w, h, {
      rx: 12,
      fill: glassy ? 'rgba(255,255,255,0.10)' : C.elevated,
      stroke: glassy ? 'rgba(255,255,255,0.15)' : C.border,
    }) +
    txt(x + 14, y + h / 2 + 5, value || placeholder, { size: 15, color: value ? C.text : C.text3 })
  );
}

function tabRow(x, y, w, options, activeIdx) {
  const cw = w / options.length;
  let s = '';
  options.forEach((op, i) => {
    const on = i === activeIdx;
    s += txt(x + cw * i + cw / 2, y + 18, op, {
      size: 15,
      weight: on ? 700 : 500,
      color: on ? C.text : C.text3,
      anchor: 'middle',
    });
    if (on) s += rect(x + cw * i + cw / 2 - 26, y + 30, 52, 3, { fill: C.accent, rx: 1.5 });
  });
  s += line(x, y + 34, x + w, y + 34);
  return s;
}

function sheet(content, o = {}) {
  const { h = 520 } = o;
  const y = H - h;
  return (
    rect(0, 40, W, H - 40, { fill: 'rgba(0,0,0,0.62)' }) +
    rect(0, y, W, h, { fill: C.surface, rx: 24 }) +
    rect(0, y + 22, W, h - 22, { fill: C.surface }) +
    rect(W / 2 - 18, y + 10, 36, 4, { rx: 2, fill: 'rgba(255,255,255,0.2)' }) +
    `<g transform="translate(0,${y})">${content}</g>`
  );
}

function glassCard(x, y, w, h) {
  return rect(x, y, w, h, { fill: C.glassFill, stroke: C.glassBorder, sw: 1, rx: 16 });
}

function svgDoc(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${rect(0, 0, W, H, { fill: C.bg })}${body}</svg>`;
}

module.exports = { C, FONT, W, H, esc, txt, rect, line, circle, path, icon, avatar, wrap, statusBar, tabBar, fab, frame, btn, chip, inputBox, tabRow, sheet, glassCard, svgDoc };
