// Shared layout toolkit – same design as the "Mindset und mentale Stärke" deck
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const fs = require("fs");
const path = require("path");

const OCHRE = "E8963C";
const WHITE = "FFFFFF";
const BLACK = "000000";
const CARD = "161616";
const FONT = "Arial";
const BOTTOM = 5.05;

async function renderIcon(name) {
  if (!fa[name]) throw new Error("Unknown icon " + name);
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(fa[name], { color: "#000000", size: "256" }));
  const buf = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

async function createDeck({ logo, title, slides, images = {}, imageDir }) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10 x 5.625
  pres.author = "Visual Academy";
  pres.title = title;
  pres.defineSlideMaster({
    title: "VA",
    background: { color: BLACK },
    objects: [{ image: { path: logo, x: 8.45, y: 0.22, w: 1.25, h: 0.546 } }],
    slideNumber: { x: 9.2, y: 5.2, w: 0.5, h: 0.3, color: OCHRE, fontFace: FONT, fontSize: 9, align: "right" },
  });

  const ic = {};
  for (const n of new Set([...JSON.stringify(slides).match(/\bFa[A-Z]\w+/g), "FaCheckCircle", "FaWind", "FaCamera"])) ic[n] = await renderIcon(n);

  // Photos: images/bild_XX.(jpg|jpeg|png|webp) -> cropped to the slot's aspect ratio
  const photo = {};
  const findImg = (id) => {
    if (!imageDir || !fs.existsSync(imageDir)) return null;
    const f = fs.readdirSync(imageDir).find((n) => new RegExp("^bild_" + id + "\\.(jpe?g|png|webp)$", "i").test(n));
    return f ? path.join(imageDir, f) : null;
  };
  const ASPECT = { portrait: 3.2 / 4.0, wide: 2.9 / 1.55 };
  for (const [id, meta] of Object.entries(images)) {
    const f = findImg(id);
    if (!f) continue;
    const a = ASPECT[meta.slot], W = 1600, H = Math.round(W / a);
    const buf = await sharp(f).rotate().resize(W, H, { fit: "cover", position: sharp.strategy.attention }).jpeg({ quality: 84 }).toBuffer();
    photo[id] = "image/jpeg;base64," + buf.toString("base64");
  }
  const missing = [];

  const txt = (s, t, o) => s.addText(t, Object.assign({ fontFace: FONT, color: WHITE, isTextBox: true, margin: 0, valign: "top" }, o));

  const circleIcon = (s, name, x, y, d = 0.6) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: OCHRE }, line: { color: OCHRE } });
    const p = d * 0.25;
    s.addImage({ data: ic[name], x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p });
  };
  const numCircle = (s, n, x, y, d = 0.5) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: OCHRE }, line: { color: OCHRE } });
    txt(s, String(n), { x, y, w: d, h: d, fontSize: Math.round(d * (String(n).length > 1 ? 30 : 36)), bold: true, color: BLACK, align: "center", valign: "middle" });
  };
  // an item "icon" is either a react-icons name or a short label (number/letter)
  const badge = (s, i, x, y, d) => (/^Fa[A-Z]/.test(i) ? circleIcon(s, i, x, y, d) : numCircle(s, i, x, y, d));
  const card = (s, x, y, w, h, outline = false) =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h, rectRadius: 0.08, fill: { color: CARD },
      line: outline ? { color: OCHRE, width: 1.25 } : { color: CARD },
    });
  const imgBox = (s, id, x, y, w, h) => {
    if (photo[id]) { s.addImage({ data: photo[id], x, y, w, h, altText: images[id].de }); return; }
    missing.push(id);
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: CARD }, line: { color: OCHRE, width: 1.25, dashType: "dash" } });
    const small = h < 2;
    circleIcon(s, "FaCamera", x + w / 2 - (small ? 0.22 : 0.3), y + (small ? 0.2 : h / 2 - 0.75), small ? 0.44 : 0.6);
    txt(s, "BILD " + id, { x: x + 0.15, y: y + (small ? 0.72 : h / 2 + 0.0), w: w - 0.3, h: 0.3, fontSize: 12, bold: true, color: OCHRE, align: "center", charSpacing: 2 });
    txt(s, images[id].de, { x: x + 0.2, y: y + (small ? 1.02 : h / 2 + 0.35), w: w - 0.4, h: small ? h - 1.08 : 0.9, fontSize: small ? 9.5 : 11, align: "center", italic: true });
  };
  const PX = 6.3, PY = 1.0, PW = 3.2, PH = 4.0; // portrait photo panel

  const pill = (s, label, x = 0.5, y = 1.05) => {
    const w = 0.4 + label.length * 0.095;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.34, rectRadius: 0.17, fill: { color: OCHRE }, line: { color: OCHRE } });
    txt(s, label, { x, y, w, h: 0.34, fontSize: 11, bold: true, color: BLACK, align: "center", valign: "middle", charSpacing: 1 });
  };
  const bullets = (s, items, o) =>
    txt(s, items.map((t, i) => ({ text: t, options: { bullet: { indent: 16 }, breakLine: i < items.length - 1 } })),
      Object.assign({ fontSize: 15, paraSpaceAfter: 8 }, o));

  // Title + optional subtitle / pill. Returns y where content may start.
  const head = (s, d) => {
    const fs = d.title.length > 40 ? 24 : d.title.length > 33 ? 27 : 30;
    txt(s, d.title, { x: 0.5, y: 0.35, w: 7.8, h: 0.65, fontSize: fs, bold: true, color: OCHRE, valign: "middle" });
    if (d.sub) txt(s, d.sub, { x: 0.5, y: 1.02, w: d.pill ? 6.2 : 7.8, h: 0.35, fontSize: 14, italic: true });
    if (d.pill) d.sub ? pill(s, d.pill, 9.5 - (0.4 + d.pill.length * 0.095), 1.03) : pill(s, d.pill);
    let y = d.sub || d.pill ? 1.62 : 1.35;
    if (d.lead) {
      txt(s, d.lead, { x: 0.5, y, w: 9, h: 0.45, fontSize: 15, italic: !!d.leadItalic, color: d.leadItalic ? OCHRE : WHITE });
      y += 0.55;
    }
    return y;
  };

  const L = {};

  L.cover = (s, d) => {
    txt(s, d.kicker, { x: 0.5, y: 1.05, w: 7, h: 0.35, fontSize: 13, bold: true, color: OCHRE, charSpacing: 4 });
    const cw = d.img ? 5.5 : 6.9;
    txt(s, d.title, { x: 0.5, y: 1.5, w: cw, h: 1.9, fontSize: d.img && d.title.length > 50 ? 28 : (d.size || 40), bold: true, valign: "middle" });
    txt(s, d.sub, { x: 0.5, y: 3.55, w: d.img ? 5.4 : 6.6, h: 0.8, fontSize: d.img ? 15 : 17, color: OCHRE });
    if (d.meta) txt(s, d.meta, { x: 0.5, y: 4.45, w: 6.6, h: 0.4, fontSize: 12 });
    d.img ? imgBox(s, d.img, PX, PY, PW, PH) : circleIcon(s, d.icon, 7.6, 2.3, 1.5);
  };

  L.section = (s, d) => {
    if (d.img) {
      txt(s, d.n, { x: 0.5, y: 1.0, w: 3, h: 1.3, fontSize: 88, bold: true, color: OCHRE });
      txt(s, d.title, { x: 0.5, y: 2.35, w: 5.4, h: 1.15, fontSize: 32, bold: true, valign: "middle" });
      txt(s, d.sub, { x: 0.5, y: 3.6, w: 5.3, h: 0.8, fontSize: 15, color: OCHRE, italic: true });
      imgBox(s, d.img, PX, PY, PW, PH);
      return;
    }
    txt(s, d.n, { x: 0.5, y: 1.2, w: 3, h: 1.3, fontSize: 88, bold: true, color: OCHRE });
    txt(s, d.title, { x: 0.5, y: 2.55, w: 6.8, h: 0.8, fontSize: d.title.length > 24 ? 30 : 36, bold: true });
    txt(s, d.sub, { x: 0.5, y: 3.35, w: 6.5, h: 0.7, fontSize: 16, color: OCHRE, italic: true });
    circleIcon(s, d.icon, 7.5, 2.1, 1.6);
  };

  // Generic card grid; items: [icon|label, header, description]
  L.grid = (s, d) => {
    const y0 = head(s, d);
    const n = d.items.length, c = d.cols || (n === 4 ? 2 : n <= 3 ? n : 3);
    const r = Math.ceil(n / c), gap = d.gap || (c >= 5 ? 0.18 : 0.25);
    const w = (9 - (c - 1) * gap) / c;
    const h = Math.min((BOTTOM - y0 - (r - 1) * gap) / r, 3.1);
    const vertical = d.vertical ?? (r === 1 && c >= 3);
    d.items.forEach(([i, hd, ds], k) => {
      const x = 0.5 + (k % c) * (w + gap), y = y0 + Math.floor(k / c) * (h + gap);
      card(s, x, y, w, h, d.hi === k);
      if (vertical) {
        const bd = c >= 5 ? 0.5 : 0.6;
        badge(s, i, x + 0.2, y + 0.22, bd);
        txt(s, hd, { x: x + 0.2, y: y + bd + 0.38, w: w - 0.35, h: 0.6, fontSize: c >= 5 ? 13 : 15, bold: true, color: OCHRE });
        txt(s, ds, { x: x + 0.2, y: y + bd + 1.0, w: w - 0.35, h: h - bd - 1.1, fontSize: c >= 5 ? 11 : 12.5 });
      } else if (c >= 4) {
        badge(s, i, x + 0.2, y + 0.18, 0.45);
        txt(s, hd, { x: x + 0.2, y: y + 0.72, w: w - 0.3, h: 0.32, fontSize: 12.5, bold: true, color: OCHRE });
        txt(s, ds, { x: x + 0.2, y: y + 1.06, w: w - 0.35, h: h - 1.12, fontSize: 11 });
      } else {
        const bd = 0.5;
        badge(s, i, x + 0.2, y + 0.2, bd);
        txt(s, hd, { x: x + 0.85, y: y + 0.2, w: w - 1.0, h: bd, fontSize: c >= 4 ? 13 : 15, bold: true, color: OCHRE, valign: "middle" });
        const dx = c === 2 ? 0.85 : 0.2;
        txt(s, ds, { x: x + dx, y: y + 0.85, w: w - dx - 0.2, h: h - 0.95, fontSize: c === 2 ? 13 : c >= 4 ? 11 : 11.5 });
      }
    });
  };

  L.letters = (s, d) => {
    const y0 = head(s, d);
    const n = d.items.length, gap = 0.2, w = (9 - (n - 1) * gap) / n;
    const h = (d.foot ? 4.25 : BOTTOM) - y0;
    d.items.forEach(([l, hd, ds], k) => {
      const x = 0.5 + k * (w + gap);
      card(s, x, y0, w, h, d.hi === k);
      txt(s, l, { x: x + 0.2, y: y0 + 0.1, w: w - 0.3, h: 0.8, fontSize: 44, bold: true, color: OCHRE });
      txt(s, hd, { x: x + 0.2, y: y0 + 0.9, w: w - 0.35, h: 0.4, fontSize: 15, bold: true });
      txt(s, ds, { x: x + 0.2, y: y0 + 1.45, w: w - 0.35, h: h - 1.55, fontSize: 12 });
    });
    if (d.foot) txt(s, d.foot, { x: 0.5, y: 4.4, w: 9, h: 0.6, fontSize: 15, bold: true, color: OCHRE });
  };

  L.steps = (s, d) => {
    const y0 = head(s, d);
    const n = d.items.length, gap = Math.min(0.85, (BOTTOM + 0.1 - y0) / n);
    const w = d.side ? 5.3 : 8.3, fs = n > 5 ? 13 : 14;
    d.items.forEach(([hd, ds], i) => {
      const y = y0 + i * gap;
      numCircle(s, i + 1, 0.5, y, 0.44);
      txt(s, hd, { x: 1.1, y: y - 0.02, w, h: 0.28, fontSize: fs, bold: true, color: OCHRE });
      txt(s, ds, { x: 1.1, y: y + 0.26, w, h: gap - 0.3, fontSize: fs - 2 });
    });
    if (d.side) {
      const sy = y0, sh = 4.95 - y0;
      card(s, 6.6, sy, 2.9, sh, true);
      if (d.side.img) {
        imgBox(s, d.side.img, 6.6, sy, 2.9, 1.55);
        txt(s, d.side.h, { x: 6.85, y: sy + 1.7, w: 2.5, h: 0.35, fontSize: 14, bold: true, color: OCHRE });
        txt(s, d.side.d, { x: 6.85, y: sy + 2.08, w: 2.45, h: sh - 2.15, fontSize: 12 });
      } else {
        circleIcon(s, d.side.icon, 6.85, sy + 0.25, 0.55);
        txt(s, d.side.h, { x: 6.85, y: sy + 0.95, w: 2.5, h: 0.35, fontSize: 14, bold: true, color: OCHRE });
        txt(s, d.side.d, { x: 6.85, y: sy + 1.35, w: 2.45, h: sh - 1.45, fontSize: 13 });
      }
    }
  };

  L.table = (s, d) => {
    const y0 = head(s, d);
    card(s, 2.6, y0 - 0.05, 3.3, BOTTOM + 0.1 - y0);
    card(s, 6.1, y0 - 0.05, 3.4, BOTTOM + 0.1 - y0, true);
    txt(s, d.heads[0], { x: 2.8, y: y0 + 0.05, w: 3, h: 0.4, fontSize: 16, bold: true });
    txt(s, d.heads[1], { x: 6.3, y: y0 + 0.05, w: 3, h: 0.4, fontSize: 16, bold: true, color: OCHRE });
    const gap = (BOTTOM - y0 - 0.6) / d.rows.length;
    d.rows.forEach(([a, b, c], i) => {
      const y = y0 + 0.6 + i * gap;
      txt(s, a, { x: 0.5, y, w: 2.0, h: gap, fontSize: 13, bold: true, color: OCHRE, valign: "middle" });
      txt(s, b, { x: 2.8, y, w: 3.0, h: gap, fontSize: 13, valign: "middle" });
      txt(s, c, { x: 6.3, y, w: 3.1, h: gap, fontSize: 13, valign: "middle" });
    });
  };

  L.compare = (s, d) => {
    const y0 = head(s, d);
    const h = (d.foot ? 4.0 : BOTTOM) - y0;
    [d.left, d.right].forEach((b, k) => {
      const x = k ? 5.1 : 0.5;
      card(s, x, y0, 4.4, h, k === 1);
      if (b.icon) circleIcon(s, b.icon, x + 0.25, y0 + 0.2, 0.5);
      const hx = b.icon ? x + 0.9 : x + 0.25;
      txt(s, b.h, { x: hx, y: y0 + 0.2, w: 3.3, h: 0.5, fontSize: 16, bold: true, color: k ? OCHRE : WHITE, valign: "middle" });
      bullets(s, b.items, { x: x + 0.25, y: y0 + 0.85, w: 3.95, h: h - 0.95, fontSize: 13, paraSpaceAfter: 6, italic: !!b.italic, color: k && b.italic ? OCHRE : WHITE });
    });
    if (d.foot) txt(s, d.foot, { x: 0.5, y: 4.15, w: 9, h: 0.85, fontSize: 14 });
  };

  L.quote = (s, d) => {
    txt(s, "„", { x: 0.5, y: 0.7, w: 1.5, h: 1.4, fontSize: 110, bold: true, color: OCHRE });
    const qw = d.img ? 4.8 : 7.6;
    txt(s, d.text, { x: 1.2, y: d.img ? 1.2 : 1.5, w: qw, h: d.img ? 2.5 : 2.2, fontSize: d.img ? (d.imgSize || 22) : (d.size || 28), bold: true, valign: "middle" });
    if (d.src) txt(s, d.src, { x: 1.2, y: 3.8, w: qw, h: d.img ? 0.5 : 0.4, fontSize: d.img ? 13 : 15, color: OCHRE });
    if (d.sub) txt(s, d.sub, { x: 1.2, y: d.img ? 4.35 : 4.3, w: qw, h: 0.7, fontSize: d.img ? 11.5 : 13, italic: true });
    if (d.img) imgBox(s, d.img, PX, PY, PW, PH);
  };

  L.big = (s, d) => {
    const y0 = head(s, d);
    txt(s, d.num, { x: 0.5, y: y0, w: 2.6, h: 2.1, fontSize: d.num.length > 2 ? 90 : 140, bold: true, color: OCHRE, align: "center", valign: "middle" });
    txt(s, d.label, { x: 0.5, y: y0 + 2.15, w: 2.6, h: 0.6, fontSize: 14, align: "center" });
    let y = y0;
    if (d.info) { txt(s, d.info, { x: 3.5, y, w: 6, h: 0.45, fontSize: 14, italic: true, color: OCHRE }); y += 0.6; }
    const gap = Math.min(0.85, (BOTTOM - y) / d.items.length);
    d.items.forEach(([hd, ds], i) => {
      numCircle(s, i + 1, 3.5, y + i * gap, 0.44);
      txt(s, hd, { x: 4.1, y: y + i * gap - 0.02, w: 5.4, h: 0.28, fontSize: 14, bold: true, color: OCHRE });
      txt(s, ds, { x: 4.1, y: y + i * gap + 0.26, w: 5.4, h: gap - 0.3, fontSize: 12 });
    });
  };

  L.arrows = (s, d) => {
    const y0 = head(s, d);
    const n = d.rows.length, gap = Math.min(1.05, ((d.foot ? 4.55 : BOTTOM) - y0) / n), h = gap - 0.22;
    if (d.heads) {
      txt(s, d.heads[0], { x: 0.5, y: y0 - 0.05, w: 4, h: 0.3, fontSize: 12, bold: true });
      txt(s, d.heads[1], { x: 5.3, y: y0 - 0.05, w: 4, h: 0.3, fontSize: 12, bold: true, color: OCHRE });
    }
    const yy = d.heads ? y0 + 0.3 : y0;
    const g2 = d.heads ? (((d.foot ? 4.55 : BOTTOM) - yy) / n) : gap, h2 = d.heads ? g2 - 0.18 : h;
    d.rows.forEach(([a, b], k) => {
      const y = yy + k * g2;
      card(s, 0.5, y, 4.0, h2);
      txt(s, a, { x: 0.72, y, w: 3.65, h: h2, fontSize: 14, valign: "middle" });
      txt(s, "→", { x: 4.6, y, w: 0.6, h: h2, fontSize: 24, bold: true, color: OCHRE, align: "center", valign: "middle" });
      card(s, 5.3, y, 4.2, h2, true);
      txt(s, b, { x: 5.52, y, w: 3.85, h: h2, fontSize: 14, bold: true, color: OCHRE, valign: "middle" });
    });
    if (d.foot) txt(s, d.foot, { x: 0.5, y: 4.62, w: 9, h: 0.4, fontSize: 14, italic: true });
  };

  L.circles = (s, d) => {
    head(s, d);
    s.addShape(pres.shapes.OVAL, { x: 0.6, y: 1.3, w: 3.9, h: 3.9, fill: { color: CARD }, line: { color: WHITE, width: 1 } });
    s.addShape(pres.shapes.OVAL, { x: 1.4, y: 2.1, w: 2.3, h: 2.3, fill: { color: OCHRE }, line: { color: OCHRE } });
    txt(s, d.inner, { x: 1.4, y: 2.1, w: 2.3, h: 2.3, fontSize: 15, bold: true, color: BLACK, align: "center", valign: "middle" });
    txt(s, d.outer, { x: 0.9, y: 1.5, w: 3.3, h: 0.4, fontSize: 12, align: "center" });
    txt(s, d.inH, { x: 5.0, y: 1.5, w: 4.5, h: 0.35, fontSize: 16, bold: true, color: OCHRE });
    bullets(s, d.inList, { x: 5.0, y: 1.9, w: 4.5, h: 1.2, fontSize: 14, paraSpaceAfter: 4 });
    txt(s, d.outH, { x: 5.0, y: 3.2, w: 4.5, h: 0.35, fontSize: 16, bold: true });
    bullets(s, d.outList, { x: 5.0, y: 3.6, w: 4.5, h: 1.2, fontSize: 14, paraSpaceAfter: 4 });
  };

  L.timeline = (s, d) => {
    const y0 = head(s, d);
    const gap = (BOTTOM - y0) / d.rows.length;
    s.addShape(pres.shapes.LINE, { x: 1.83, y: y0 + gap / 2, w: 0, h: gap * (d.rows.length - 1), line: { color: OCHRE, width: 1.5 } });
    d.rows.forEach(([t, item, isBreak], k) => {
      const y = y0 + k * gap;
      txt(s, t, { x: 0.5, y, w: 1.05, h: gap, fontSize: 14, bold: true, color: OCHRE, valign: "middle" });
      s.addShape(pres.shapes.OVAL, { x: 1.73, y: y + gap / 2 - 0.1, w: 0.2, h: 0.2, fill: { color: isBreak ? BLACK : OCHRE }, line: { color: OCHRE, width: 1.5 } });
      txt(s, item, { x: 2.15, y, w: 3.9, h: gap, fontSize: isBreak ? 13 : 14.5, bold: !isBreak, italic: !!isBreak, valign: "middle" });
    });
    const sy = y0, sh = 4.95 - y0;
    card(s, 6.4, sy, 3.1, sh, true);
    circleIcon(s, d.side.icon, 6.65, sy + 0.25, 0.6);
    txt(s, d.side.h, { x: 6.65, y: sy + 1.0, w: 2.7, h: 0.4, fontSize: 15, bold: true, color: OCHRE });
    txt(s, d.side.d, { x: 6.65, y: sy + 1.45, w: 2.65, h: sh - 1.55, fontSize: 13 });
  };

  L.scale = (s, d) => {
    const y0 = head(s, d);
    txt(s, d.q, { x: 0.5, y: y0 + 0.05, w: 9, h: 0.4, fontSize: 18 });
    for (let i = 1; i <= 10; i++) {
      const x = 0.5 + (i - 1) * 0.9, hi = i > 7;
      s.addShape(pres.shapes.OVAL, { x, y: y0 + 0.7, w: 0.7, h: 0.7, fill: { color: hi ? OCHRE : CARD }, line: { color: OCHRE, width: 1 } });
      txt(s, String(i), { x, y: y0 + 0.7, w: 0.7, h: 0.7, fontSize: 20, bold: true, align: "center", valign: "middle", color: hi ? BLACK : WHITE });
    }
    txt(s, d.left, { x: 0.5, y: y0 + 1.55, w: 4, h: 0.3, fontSize: 12, color: OCHRE });
    txt(s, d.right, { x: 5.5, y: y0 + 1.55, w: 3.9, h: 0.3, fontSize: 12, color: OCHRE, align: "right" });
    card(s, 0.5, y0 + 2.15, 9, BOTTOM - y0 - 2.2, true);
    txt(s, d.extra, { x: 0.75, y: y0 + 2.15, w: 8.5, h: BOTTOM - y0 - 2.2, fontSize: 15, italic: true, valign: "middle" });
  };

  L.iconList = (s, d) => {
    const y0 = head(s, d);
    const n = d.items.length, gap = (BOTTOM - y0 + 0.1) / n, w = d.side ? 4.5 : 8.2;
    d.items.forEach(([i, hd, ds], k) => {
      const y = y0 + k * gap;
      badge(s, i, 0.5, y, 0.55);
      txt(s, hd, { x: 1.25, y: y, w, h: 0.3, fontSize: 15, bold: true, color: OCHRE });
      txt(s, ds, { x: 1.25, y: y + 0.3, w, h: gap - 0.32, fontSize: 12.5 });
    });
    if (d.side) {
      card(s, 6.1, y0, 3.4, 4.95 - y0, true);
      txt(s, d.side.h, { x: 6.35, y: y0 + 0.2, w: 2.9, h: 0.35, fontSize: 14, bold: true, color: OCHRE });
      txt(s, d.side.d, { x: 6.35, y: y0 + 0.65, w: 2.9, h: 4.95 - y0 - 0.8, fontSize: 14 });
    }
  };

  L.reflection = (s, d) => {
    const y0 = head(s, d);
    const n = d.qs.length, c = n === 4 ? 2 : n, r = Math.ceil(n / c), gap = 0.25;
    const w = (9 - (c - 1) * gap) / c, h = (BOTTOM - y0 - (r - 1) * gap) / r;
    d.qs.forEach((q, k) => {
      const x = 0.5 + (k % c) * (w + gap), y = y0 + Math.floor(k / c) * (h + gap);
      card(s, x, y, w, h, true);
      numCircle(s, k + 1, x + 0.25, y + 0.25, 0.45);
      txt(s, q, c === 2
        ? { x: x + 0.9, y: y + 0.2, w: w - 1.1, h: h - 0.35, fontSize: 15, italic: true }
        : { x: x + 0.25, y: y + 0.9, w: w - 0.45, h: h - 1.05, fontSize: 15, italic: true });
    });
  };

  L.box = (s, d) => {
    const y0 = head(s, d);
    const bx = 5.9, by = 1.5, bw = 3.0;
    s.addShape(pres.shapes.RECTANGLE, { x: bx, y: by, w: bw, h: bw, fill: { color: BLACK }, line: { color: OCHRE, width: 3 } });
    txt(s, "4 Sek.\nein", { x: bx, y: by + 0.08, w: bw, h: 0.6, fontSize: 12, bold: true, align: "center" });
    txt(s, "4 Sek.\nhalten", { x: bx + bw - 1.0, y: by + bw / 2 - 0.3, w: 0.9, h: 0.6, fontSize: 12, bold: true, align: "right" });
    txt(s, "4 Sek.\naus", { x: bx, y: by + bw - 0.68, w: bw, h: 0.6, fontSize: 12, bold: true, align: "center" });
    txt(s, "4 Sek.\nhalten", { x: bx + 0.1, y: by + bw / 2 - 0.3, w: 0.9, h: 0.6, fontSize: 12, bold: true });
    circleIcon(s, "FaWind", bx + bw / 2 - 0.4, by + bw / 2 - 0.4, 0.8);
    d.items.forEach(([hd, ds], i) => {
      const y = y0 + 0.1 + i * 0.78;
      numCircle(s, i + 1, 0.5, y, 0.44);
      txt(s, hd, { x: 1.1, y: y - 0.02, w: 4.2, h: 0.28, fontSize: 14, bold: true, color: OCHRE });
      txt(s, ds, { x: 1.1, y: y + 0.26, w: 4.2, h: 0.4, fontSize: 12 });
    });
  };

  L.summary = (s, d) => {
    head(s, d);
    const gap = 3.6 / d.items.length;
    d.items.forEach(([hd, ds], k) => {
      const y = 1.4 + k * gap;
      circleIcon(s, "FaCheckCircle", 0.5, y, 0.5);
      txt(s, hd, { x: 1.2, y, w: 4.6, h: 0.3, fontSize: 15, bold: true });
      txt(s, ds, { x: 1.2, y: y + 0.3, w: 4.6, h: 0.3, fontSize: 12, color: OCHRE });
    });
    card(s, 6.1, 1.4, 3.4, 3.5, true);
    circleIcon(s, d.side.icon, 6.35, 1.65, 0.6);
    txt(s, d.side.h, { x: 6.35, y: 2.4, w: 3, h: 0.4, fontSize: 17, bold: true, color: OCHRE });
    txt(s, d.side.d, { x: 6.35, y: 2.85, w: 2.95, h: 1.9, fontSize: 13 });
  };

  L.thanks = (s, d) => {
    const tw = d.img ? 5.4 : 6.6;
    txt(s, d.title, { x: 0.5, y: 1.3, w: tw, h: 1.6, fontSize: 44, bold: true, color: OCHRE, valign: "middle" });
    txt(s, d.sub, { x: 0.5, y: 3.0, w: tw, h: 1.0, fontSize: 18 });
    if (d.meta) txt(s, d.meta, { x: 0.5, y: 4.2, w: tw, h: 0.5, fontSize: 13, italic: true, color: OCHRE });
    d.img ? imgBox(s, d.img, PX, PY, PW, PH) : circleIcon(s, d.icon, 7.6, 2.3, 1.5);
  };

  for (const d of slides) {
    const s = pres.addSlide({ masterName: "VA" });
    if (!L[d.t]) throw new Error("Unknown layout " + d.t);
    L[d.t](s, d);
    if (d.notes) s.addNotes(d.notes);
  }
  pres.missingImages = [...new Set(missing)];
  return pres;
}

module.exports = { createDeck };
