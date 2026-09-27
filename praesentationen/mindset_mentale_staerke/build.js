const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const path = require("path");

const OCHRE = "CC9933";
const WHITE = "FFFFFF";
const BLACK = "000000";
const CARD = "161616";
const FONT = "Arial";
const LOGO = path.join(__dirname, "logo_dark.png");

async function icon(name, color = "#000000") {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(fa[name], { color, size: "256" })
  );
  const buf = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10 x 5.625
  pres.author = "Visual Academy";
  pres.title = "Mindset und mentale Stärke";

  pres.defineSlideMaster({
    title: "VA",
    background: { color: BLACK },
    objects: [{ image: { path: LOGO, x: 8.45, y: 0.22, w: 1.25, h: 0.546 } }],
    slideNumber: { x: 9.2, y: 5.2, w: 0.5, h: 0.3, color: OCHRE, fontFace: FONT, fontSize: 9, align: "right" },
  });

  const ic = {};
  for (const n of [
    "FaBrain", "FaSeedling", "FaMountain", "FaWind", "FaPen", "FaComments", "FaCheckCircle",
    "FaBullseye", "FaHeart", "FaLightbulb", "FaSync", "FaStar", "FaHandPaper", "FaEye",
    "FaBed", "FaWalking", "FaCoffee", "FaMobileAlt", "FaUserFriends", "FaShieldAlt",
    "FaBolt", "FaRegClock", "FaQuestion", "FaHandshake", "FaRoute", "FaUser", "FaTrophy",
    "FaLayerGroup", "FaCompass", "FaSmile",
  ]) ic[n] = await icon(n);

  const txt = (s, t, o) => s.addText(t, Object.assign({ fontFace: FONT, color: WHITE, isTextBox: true, margin: 0, valign: "top" }, o));

  const title = (s, t, sub) => {
    txt(s, t, { x: 0.5, y: 0.35, w: 7.7, h: 0.65, fontSize: 30, bold: true, color: OCHRE, valign: "middle" });
    if (sub) txt(s, sub, { x: 0.5, y: 1.0, w: 7.7, h: 0.35, fontSize: 14, color: WHITE, italic: true });
  };

  const circleIcon = (s, name, x, y, d = 0.6) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: OCHRE }, line: { color: OCHRE } });
    const p = d * 0.25;
    s.addImage({ data: ic[name], x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p });
  };

  const numCircle = (s, n, x, y, d = 0.5) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: OCHRE }, line: { color: OCHRE } });
    txt(s, String(n), { x, y, w: d, h: d, fontSize: d * 36, bold: true, color: BLACK, align: "center", valign: "middle" });
  };

  const card = (s, x, y, w, h, outline = false) =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h, rectRadius: 0.08, fill: { color: CARD },
      line: outline ? { color: OCHRE, width: 1.25 } : { color: CARD },
    });

  // "ÜBUNG · 3 Min" pill on exercise slides
  const pill = (s, label, x = 0.5, y = 1.05) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 1.9, h: 0.34, rectRadius: 0.17, fill: { color: OCHRE }, line: { color: OCHRE } });
    txt(s, label, { x, y, w: 1.9, h: 0.34, fontSize: 11, bold: true, color: BLACK, align: "center", valign: "middle", charSpacing: 1 });
  };

  const bullets = (s, items, o) =>
    txt(s, items.map((t, i) => ({ text: t, options: { bullet: { indent: 16 }, breakLine: i < items.length - 1 } })),
      Object.assign({ fontSize: 15, paraSpaceAfter: 8 }, o));

  const steps = (s, items, x, y, w, gap = 0.72, fs = 14) =>
    items.forEach(([h, d], i) => {
      numCircle(s, i + 1, x, y + i * gap, 0.44);
      txt(s, h, { x: x + 0.6, y: y + i * gap - 0.02, w, h: 0.28, fontSize: fs, bold: true, color: OCHRE });
      txt(s, d, { x: x + 0.6, y: y + i * gap + 0.26, w, h: 0.4, fontSize: fs - 2 });
    });

  const section = (n, t, sub, iconName) => {
    const s = pres.addSlide({ masterName: "VA" });
    txt(s, n, { x: 0.5, y: 1.2, w: 3, h: 1.3, fontSize: 88, bold: true, color: OCHRE });
    txt(s, t, { x: 0.5, y: 2.55, w: 7, h: 0.8, fontSize: 36, bold: true });
    txt(s, sub, { x: 0.5, y: 3.35, w: 6.5, h: 0.6, fontSize: 16, color: OCHRE, italic: true });
    circleIcon(s, iconName, 7.4, 2.2, 1.6);
    return s;
  };

  let s;

  // 1 Titel
  s = pres.addSlide({ masterName: "VA" });
  txt(s, "ONLINE-IMPULSVORTRAG", { x: 0.5, y: 1.3, w: 6, h: 0.35, fontSize: 13, bold: true, color: OCHRE, charSpacing: 4 });
  txt(s, "Mindset und\nmentale Stärke", { x: 0.5, y: 1.75, w: 7, h: 1.7, fontSize: 48, bold: true });
  txt(s, "Wie wir unser Denken trainieren – mit Übungen und Tipps für den Alltag", { x: 0.5, y: 3.55, w: 6.5, h: 0.7, fontSize: 18, color: OCHRE });
  circleIcon(s, "FaBrain", 7.6, 2.6, 1.5);
  s.addNotes("Begrüßung. Kurz vorstellen. Technik-Check: Alle hören und sehen gut? Chat-Funktion erklären – wir nutzen ihn heute oft.");

  // 2 Willkommen / Spielregeln online
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Willkommen! So arbeiten wir heute");
  [["FaComments", "Chat nutzen", "Gedanken, Fragen und Antworten jederzeit in den Chat schreiben."],
   ["FaPen", "Stift & Papier", "Für die Übungen brauchst du nur einen Zettel und einen Stift."],
   ["FaEye", "Kamera an – wenn möglich", "Gemeinsam üben wirkt stärker. Kein Muss, aber eine Einladung."],
   ["FaHandshake", "Freiwilligkeit", "Alles ist ein Angebot. Du entscheidest, was du teilst."]]
    .forEach(([i, h, d], k) => {
      const x = 0.5 + (k % 2) * 4.55, y = 1.5 + Math.floor(k / 2) * 1.85;
      card(s, x, y, 4.3, 1.6);
      circleIcon(s, i, x + 0.25, y + 0.3, 0.6);
      txt(s, h, { x: x + 1.05, y: y + 0.28, w: 3.05, h: 0.35, fontSize: 16, bold: true, color: OCHRE });
      txt(s, d, { x: x + 1.05, y: y + 0.66, w: 3.05, h: 0.8, fontSize: 13 });
    });

  // 3 Agenda
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Unser Fahrplan");
  [["Theorie kompakt", "Was Mindset und mentale Stärke wirklich bedeuten"],
   ["Denken verstehen", "Wie Gedanken Gefühle und Handeln steuern"],
   ["Werkzeuge", "Übungen für Kopf, Körper und Gefühle"],
   ["Alltagstransfer", "Rituale, Gewohnheiten und dein persönlicher Plan"]]
    .forEach(([h, d], k) => {
      const x = 0.5 + k * 2.3;
      card(s, x, 1.6, 2.1, 3.2);
      numCircle(s, k + 1, x + 0.25, 1.85, 0.6);
      txt(s, h, { x: x + 0.25, y: 2.7, w: 1.65, h: 0.7, fontSize: 16, bold: true, color: OCHRE });
      txt(s, d, { x: x + 0.25, y: 3.45, w: 1.65, h: 1.2, fontSize: 12 });
    });

  // 4 Check-in Übung
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Check-in: Wie geht es dir?");
  pill(s, "ÜBUNG · 2 MIN");
  txt(s, "Schreib eine Zahl von 1 bis 10 in den Chat:", { x: 0.5, y: 1.7, w: 8, h: 0.4, fontSize: 18 });
  for (let i = 1; i <= 10; i++) {
    const x = 0.5 + (i - 1) * 0.9;
    s.addShape(pres.shapes.OVAL, { x, y: 2.35, w: 0.7, h: 0.7, fill: { color: i > 7 ? OCHRE : CARD }, line: { color: OCHRE, width: 1 } });
    txt(s, String(i), { x, y: 2.35, w: 0.7, h: 0.7, fontSize: 20, bold: true, align: "center", valign: "middle", color: i > 7 ? BLACK : WHITE });
  }
  txt(s, "1 = völlig erschöpft", { x: 0.5, y: 3.2, w: 3, h: 0.3, fontSize: 12, color: OCHRE });
  txt(s, "10 = voller Energie", { x: 6.4, y: 3.2, w: 3, h: 0.3, fontSize: 12, color: OCHRE, align: "right" });
  card(s, 0.5, 3.8, 9, 1.0, true);
  txt(s, "Zusatzfrage: Was hat heute schon zu deiner Zahl beigetragen – im Guten wie im Schlechten?",
    { x: 0.75, y: 3.8, w: 8.5, h: 1.0, fontSize: 15, italic: true, valign: "middle" });
  s.addNotes("Einige Zahlen vorlesen, wertschätzend kommentieren. Hinweis: Die Selbstwahrnehmung ist bereits der erste Schritt mentaler Stärke.");

  // 5 Section Theorie
  section("01", "Theorie kompakt", "Was steckt hinter Mindset und mentaler Stärke?", "FaBrain");

  // 6 Was ist Mindset?
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Was ist ein Mindset?");
  txt(s, "Ein Mindset ist die Grundüberzeugung darüber, ob unsere Fähigkeiten feststehen oder sich entwickeln lassen.",
    { x: 0.5, y: 1.4, w: 5.2, h: 1.1, fontSize: 18 });
  bullets(s, [
    "Geprägt von der Psychologin Carol Dweck (Stanford)",
    "Beeinflusst, wie wir mit Herausforderungen, Kritik und Fehlern umgehen",
    "Ist kein fester Charakterzug – es ist lern- und trainierbar",
    "Wir alle tragen beide Anteile in uns",
  ], { x: 0.5, y: 2.65, w: 5.2, h: 2.3, fontSize: 14 });
  card(s, 6.1, 1.5, 3.4, 3.3, true);
  txt(s, "„Wird mir das gelingen?“", { x: 6.35, y: 1.8, w: 2.9, h: 0.5, fontSize: 16, italic: true });
  txt(s, "vs.", { x: 6.35, y: 2.45, w: 2.9, h: 0.4, fontSize: 22, bold: true, color: OCHRE, align: "center" });
  txt(s, "„Was kann ich dabei lernen?“", { x: 6.35, y: 3.0, w: 2.9, h: 0.8, fontSize: 16, italic: true, color: OCHRE });
  txt(s, "Die Frage, die wir uns stellen, prägt das Ergebnis.", { x: 6.35, y: 3.9, w: 2.9, h: 0.7, fontSize: 11 });

  // 7 Fixed vs Growth
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Statisches vs. dynamisches Selbstbild");
  const cmp = [["Herausforderungen", "werden vermieden", "werden gesucht"],
    ["Hindernisse", "führen zum Aufgeben", "fördern Ausdauer"],
    ["Anstrengung", "gilt als sinnlos", "ist der Weg zum Können"],
    ["Kritik", "wird ignoriert", "wird als Lernchance genutzt"],
    ["Erfolg anderer", "wirkt bedrohlich", "inspiriert"]];
  card(s, 2.6, 1.3, 3.3, 3.85);
  card(s, 6.1, 1.3, 3.4, 3.85, true);
  txt(s, "Fixed Mindset", { x: 2.8, y: 1.4, w: 3, h: 0.4, fontSize: 16, bold: true });
  txt(s, "Growth Mindset", { x: 6.3, y: 1.4, w: 3, h: 0.4, fontSize: 16, bold: true, color: OCHRE });
  cmp.forEach(([a, b, c], i) => {
    const y = 1.95 + i * 0.62;
    txt(s, a, { x: 0.5, y, w: 2.0, h: 0.5, fontSize: 13, bold: true, color: OCHRE, valign: "middle" });
    txt(s, b, { x: 2.8, y, w: 3.0, h: 0.5, fontSize: 13, valign: "middle" });
    txt(s, c, { x: 6.3, y, w: 3.1, h: 0.5, fontSize: 13, valign: "middle" });
  });

  // 8 Neuroplastizität
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Neuroplastizität: Das Gehirn lernt");
  txt(s, "Was wir wiederholt denken und tun, wird zur Gewohnheit – neuronal verankert.", { x: 0.5, y: 1.35, w: 7.7, h: 0.5, fontSize: 16, italic: true, color: OCHRE });
  [["FaRoute", "Trampelpfad", "Neue Denkweisen fühlen sich anfangs mühsam an – wie ein Weg durchs hohe Gras."],
   ["FaSync", "Wiederholung", "Jede Wiederholung stärkt die Verbindung. Aus dem Pfad wird ein Weg."],
   ["FaLayerGroup", "Autobahn", "Gut trainierte Muster laufen automatisch ab – die gute Nachricht: auch neue."]]
    .forEach(([i, h, d], k) => {
      const x = 0.5 + k * 3.07;
      card(s, x, 2.1, 2.85, 2.8);
      circleIcon(s, i, x + 0.25, 2.35, 0.65);
      txt(s, h, { x: x + 0.25, y: 3.15, w: 2.4, h: 0.4, fontSize: 17, bold: true, color: OCHRE });
      txt(s, d, { x: x + 0.25, y: 3.6, w: 2.4, h: 1.2, fontSize: 12.5 });
    });

  // 9 Mentale Stärke – 4C
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Was ist mentale Stärke?", "Das 4C-Modell nach Peter Clough");
  [["Control", "Kontrolle", "Ich habe Einfluss auf mein Leben und meine Emotionen.", "FaCompass"],
   ["Commitment", "Engagement", "Ich bleibe dran und halte meine Zusagen – auch an mich selbst.", "FaBullseye"],
   ["Challenge", "Herausforderung", "Ich sehe Veränderung und Probleme als Chance zum Wachsen.", "FaMountain"],
   ["Confidence", "Zuversicht", "Ich vertraue meinen Fähigkeiten und stehe zu mir.", "FaShieldAlt"]]
    .forEach(([en, de, d, i], k) => {
      const x = 0.5 + (k % 2) * 4.55, y = 1.55 + Math.floor(k / 2) * 1.8;
      card(s, x, y, 4.3, 1.6);
      circleIcon(s, i, x + 0.25, y + 0.3, 0.6);
      txt(s, [{ text: en, options: { bold: true, color: OCHRE } }, { text: "  " + de, options: { color: WHITE } }],
        { x: x + 1.05, y: y + 0.25, w: 3.1, h: 0.4, fontSize: 16 });
      txt(s, d, { x: x + 1.05, y: y + 0.68, w: 3.05, h: 0.8, fontSize: 12.5 });
    });

  // 10 Resilienz vs mentale Stärke – Zitat
  s = pres.addSlide({ masterName: "VA" });
  txt(s, "„", { x: 0.5, y: 0.7, w: 1.5, h: 1.4, fontSize: 110, bold: true, color: OCHRE });
  txt(s, "Mentale Stärke heißt nicht, keine Angst oder Zweifel zu haben – sondern trotzdem handlungsfähig zu bleiben.",
    { x: 1.2, y: 1.7, w: 7.6, h: 1.8, fontSize: 28, bold: true });
  txt(s, "Resilienz = sich von Krisen erholen   ·   Mentale Stärke = unter Druck klar bleiben",
    { x: 1.2, y: 3.9, w: 7.6, h: 0.5, fontSize: 15, color: OCHRE });

  // 11 Section Denken
  section("02", "Denken verstehen", "Nicht die Dinge beunruhigen uns, sondern unsere Sicht auf sie.", "FaLightbulb");

  // 12 ABC-Modell
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Das ABC-Modell nach Albert Ellis");
  [["A", "Auslöser", "Die Chefin antwortet nicht auf meine Mail."],
   ["B", "Bewertung", "„Sie ist bestimmt unzufrieden mit mir.“"],
   ["C", "Konsequenz", "Unruhe, Grübeln, schlechter Schlaf."]]
    .forEach(([l, h, d], k) => {
      const x = 0.5 + k * 3.07;
      card(s, x, 1.45, 2.85, 2.6, k === 1);
      txt(s, l, { x: x + 0.25, y: 1.55, w: 1, h: 0.9, fontSize: 54, bold: true, color: OCHRE });
      txt(s, h, { x: x + 0.25, y: 2.5, w: 2.4, h: 0.4, fontSize: 17, bold: true });
      txt(s, d, { x: x + 0.25, y: 2.95, w: 2.4, h: 0.9, fontSize: 13, italic: true });
    });
  txt(s, "Der Hebel liegt bei B: Wir können den Auslöser oft nicht ändern – unsere Bewertung schon.",
    { x: 0.5, y: 4.35, w: 9, h: 0.6, fontSize: 16, bold: true, color: OCHRE });

  // 13 Übung ABC
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Deine persönliche ABC-Analyse");
  pill(s, "ÜBUNG · 5 MIN");
  steps(s, [
    ["A – Situation notieren", "Denk an eine Situation der letzten Woche, die dich geärgert oder gestresst hat."],
    ["B – Gedanken aufschreiben", "Was genau hast du in dem Moment gedacht? Möglichst wörtlich."],
    ["C – Folgen benennen", "Welche Gefühle, Körperreaktionen und Handlungen folgten?"],
    ["D – Hinterfragen", "Ist der Gedanke wahr? Hilfreich? Was wäre eine andere Sichtweise?"],
  ], 0.5, 1.7, 5.3, 0.82);
  card(s, 6.6, 1.7, 2.9, 3.1, true);
  circleIcon(s, "FaPen", 6.85, 1.95, 0.55);
  txt(s, "Im Chat teilen:", { x: 6.85, y: 2.65, w: 2.5, h: 0.35, fontSize: 14, bold: true, color: OCHRE });
  txt(s, "Welche neue Sichtweise hast du für B gefunden?", { x: 6.85, y: 3.05, w: 2.45, h: 1.2, fontSize: 13 });
  s.addNotes("5 Minuten Stillarbeit, Timer einblenden. Danach 2-3 Freiwillige bitten, ihr D zu teilen.");

  // 14 Selbstwirksamkeit
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Selbstwirksamkeit (Bandura)", "Der Glaube: „Ich kann das schaffen.“ – vier Quellen stärken ihn");
  [["FaTrophy", "Eigene Erfolge", "Die stärkste Quelle: selbst etwas gemeistert haben."],
   ["FaUserFriends", "Vorbilder", "Sehen, wie Menschen wie ich es schaffen."],
   ["FaComments", "Ermutigung", "Zuspruch von anderen – und von mir selbst."],
   ["FaHeart", "Körpergefühl", "Anspannung als Energie deuten statt als Gefahr."]]
    .forEach(([i, h, d], k) => {
      const y = 1.6 + k * 0.85;
      circleIcon(s, i, 0.5, y, 0.6);
      txt(s, h, { x: 1.3, y: y + 0.02, w: 3, h: 0.3, fontSize: 15, bold: true, color: OCHRE });
      txt(s, d, { x: 1.3, y: y + 0.32, w: 4.4, h: 0.4, fontSize: 12.5 });
    });
  card(s, 6.1, 1.6, 3.4, 3.2, true);
  txt(s, "Alltags-Tipp", { x: 6.35, y: 1.8, w: 2.9, h: 0.35, fontSize: 14, bold: true, color: OCHRE });
  txt(s, "Große Ziele in kleine Schritte zerlegen. Jeder erreichte Schritt ist ein Mini-Erfolg – und trainiert das Gefühl: Ich bewirke etwas.",
    { x: 6.35, y: 2.25, w: 2.9, h: 2.3, fontSize: 14 });

  // 15 Übung Erfolgsinventur
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Meine Erfolgsinventur");
  pill(s, "ÜBUNG · 4 MIN");
  txt(s, "Notiere zu jedem Bereich einen Moment, in dem du etwas Schwieriges gemeistert hast:", { x: 0.5, y: 1.65, w: 9, h: 0.4, fontSize: 15 });
  ["Beruf", "Privatleben", "Gesundheit", "Krisen"].forEach((h, k) => {
    const x = 0.5 + k * 2.3;
    card(s, x, 2.25, 2.1, 1.6);
    txt(s, h, { x: x + 0.2, y: 2.4, w: 1.7, h: 0.4, fontSize: 15, bold: true, color: OCHRE });
    txt(s, "Was habe ich geschafft?\nWelche Stärke half mir?", { x: x + 0.2, y: 2.9, w: 1.75, h: 0.8, fontSize: 11.5 });
  });
  txt(s, [{ text: "Leitfrage: ", options: { bold: true, color: OCHRE } }, { text: "Welche meiner Stärken kann ich auf eine aktuelle Herausforderung übertragen?" }],
    { x: 0.5, y: 4.2, w: 9, h: 0.6, fontSize: 15 });

  // 16 Section Werkzeugkasten
  section("03", "Werkzeugkasten", "Übungen für Kopf, Körper und Gefühle – sofort anwendbar.", "FaLayerGroup");

  // 17 Box Breathing
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Box Breathing: In 1 Minute zur Ruhe");
  pill(s, "ÜBUNG · 2 MIN");
  const bx = 5.9, by = 1.5, bw = 3.0;
  s.addShape(pres.shapes.RECTANGLE, { x: bx, y: by, w: bw, h: bw, fill: { color: BLACK }, line: { color: OCHRE, width: 3 } });
  txt(s, "4 Sek.\nein", { x: bx, y: by - 0.02, w: bw, h: 0.6, fontSize: 12, bold: true, align: "center" });
  txt(s, "4 Sek.\nhalten", { x: bx + bw - 1.0, y: by + bw / 2 - 0.3, w: 0.9, h: 0.6, fontSize: 12, bold: true, align: "right" });
  txt(s, "4 Sek.\naus", { x: bx, y: by + bw - 0.62, w: bw, h: 0.6, fontSize: 12, bold: true, align: "center" });
  txt(s, "4 Sek.\nhalten", { x: bx + 0.1, y: by + bw / 2 - 0.3, w: 0.9, h: 0.6, fontSize: 12, bold: true });
  circleIcon(s, "FaWind", bx + bw / 2 - 0.4, by + bw / 2 - 0.4, 0.8);
  steps(s, [
    ["Einatmen", "4 Sekunden ruhig durch die Nase."],
    ["Halten", "4 Sekunden die Luft anhalten."],
    ["Ausatmen", "4 Sekunden langsam durch den Mund."],
    ["Halten", "4 Sekunden Pause – dann von vorn."],
  ], 0.5, 1.75, 4.4, 0.78);
  s.addNotes("Gemeinsam 4 Runden durchführen. Referent zählt laut mit. Einsatz im Alltag: vor Meetings, Gesprächen, Präsentationen.");

  // 18 Die Kraft des Noch
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Tipp: Die Kraft des Wortes „noch“");
  [["Ich kann das nicht.", "Ich kann das noch nicht."],
   ["Ich bin schlecht in Mathe.", "Ich lerne das gerade noch."],
   ["Das klappt bei mir nie.", "Das hat bisher noch nicht geklappt."]]
    .forEach(([a, b], k) => {
      const y = 1.5 + k * 1.05;
      card(s, 0.5, y, 4.0, 0.8);
      txt(s, a, { x: 0.75, y, w: 3.6, h: 0.8, fontSize: 16, valign: "middle" });
      txt(s, "→", { x: 4.6, y, w: 0.6, h: 0.8, fontSize: 26, bold: true, color: OCHRE, align: "center", valign: "middle" });
      card(s, 5.3, y, 4.2, 0.8, true);
      txt(s, b, { x: 5.55, y, w: 3.8, h: 0.8, fontSize: 16, bold: true, color: OCHRE, valign: "middle" });
    });
  txt(s, "Ein Wort verwandelt ein Urteil in einen Prozess.", { x: 0.5, y: 4.7, w: 9, h: 0.4, fontSize: 15, italic: true });

  // 19 Übung Reframing
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Gedanken umdeuten: Reframing");
  pill(s, "ÜBUNG · 4 MIN");
  txt(s, "Wähle einen belastenden Gedanken und stelle dir diese drei Fragen:", { x: 0.5, y: 1.65, w: 9, h: 0.4, fontSize: 15 });
  [["FaQuestion", "Stimmt das wirklich?", "Welche Fakten sprechen dafür – welche dagegen?"],
   ["FaUserFriends", "Was würde ich einer Freundin sagen?", "Wir sind zu anderen oft viel freundlicher als zu uns selbst."],
   ["FaRegClock", "Wie wichtig ist das in einem Jahr?", "Abstand relativiert – und schafft Handlungsspielraum."]]
    .forEach(([i, h, d], k) => {
      const x = 0.5 + k * 3.07;
      card(s, x, 2.25, 2.85, 2.6);
      circleIcon(s, i, x + 0.25, 2.45, 0.6);
      txt(s, h, { x: x + 0.25, y: 3.2, w: 2.4, h: 0.65, fontSize: 15, bold: true, color: OCHRE });
      txt(s, d, { x: x + 0.25, y: 3.9, w: 2.4, h: 0.85, fontSize: 12.5 });
    });

  // 20 Innerer Coach
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Innerer Kritiker vs. innerer Coach");
  pill(s, "ÜBUNG · 3 MIN");
  card(s, 0.5, 1.7, 4.3, 2.3);
  txt(s, "Innerer Kritiker", { x: 0.75, y: 1.85, w: 3.8, h: 0.4, fontSize: 16, bold: true });
  txt(s, "„Du Versager, das hättest du wissen müssen.“\n„Andere schaffen das mit links.“", { x: 0.75, y: 2.35, w: 3.8, h: 1.4, fontSize: 14, italic: true });
  card(s, 5.2, 1.7, 4.3, 2.3, true);
  txt(s, "Innerer Coach", { x: 5.45, y: 1.85, w: 3.8, h: 0.4, fontSize: 16, bold: true, color: OCHRE });
  txt(s, "„Anna, das war schwierig. Was nimmst du daraus mit?“\n„Du hast schon Schwereres geschafft.“", { x: 5.45, y: 2.35, w: 3.8, h: 1.4, fontSize: 14, italic: true, color: OCHRE });
  txt(s, [{ text: "So geht’s: ", options: { bold: true, color: OCHRE } },
    { text: "Sprich in schwierigen Momenten mit dir in der 2. oder 3. Person, mit deinem Vornamen. Studien (u. a. Ethan Kross) zeigen: Diese Distanz senkt Stress und macht klüger im Denken." }],
    { x: 0.5, y: 4.2, w: 9, h: 0.8, fontSize: 14 });

  // 21 Kontrollkreis
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Tipp: Dein Einflussbereich");
  s.addShape(pres.shapes.OVAL, { x: 0.6, y: 1.3, w: 3.9, h: 3.9, fill: { color: CARD }, line: { color: WHITE, width: 1 } });
  s.addShape(pres.shapes.OVAL, { x: 1.4, y: 2.1, w: 2.3, h: 2.3, fill: { color: OCHRE }, line: { color: OCHRE } });
  txt(s, "Kann ich\nbeeinflussen", { x: 1.4, y: 2.1, w: 2.3, h: 2.3, fontSize: 15, bold: true, color: BLACK, align: "center", valign: "middle" });
  txt(s, "Liegt nicht in meiner Hand", { x: 0.9, y: 1.5, w: 3.3, h: 0.4, fontSize: 12, align: "center" });
  txt(s, "In meiner Hand", { x: 5.0, y: 1.5, w: 4.5, h: 0.35, fontSize: 16, bold: true, color: OCHRE });
  bullets(s, ["Meine Vorbereitung", "Meine Reaktion und Haltung", "Wen ich um Hilfe bitte"], { x: 5.0, y: 1.9, w: 4.5, h: 1.2, fontSize: 14, paraSpaceAfter: 4 });
  txt(s, "Nicht in meiner Hand", { x: 5.0, y: 3.2, w: 4.5, h: 0.35, fontSize: 16, bold: true });
  bullets(s, ["Wetter, Wirtschaftslage, Bahn", "Die Meinung anderer über mich", "Die Vergangenheit"], { x: 5.0, y: 3.6, w: 4.5, h: 1.2, fontSize: 14, paraSpaceAfter: 4 });

  // 22 Übung Kontrollkreis
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Sortiere deine Sorgen");
  pill(s, "ÜBUNG · 4 MIN");
  steps(s, [
    ["Zwei Kreise zeichnen", "Einen großen Kreis auf dein Blatt, darin einen kleinen."],
    ["Sorgen sammeln", "Schreibe alles, was dich gerade beschäftigt, auf das Blatt."],
    ["Einsortieren", "Was kannst du beeinflussen? Innen. Alles andere: außen."],
    ["Einen Schritt wählen", "Nimm dir für den inneren Kreis eine konkrete Handlung für morgen vor."],
  ], 0.5, 1.7, 5.3, 0.82);
  card(s, 6.6, 1.7, 2.9, 3.1, true);
  circleIcon(s, "FaHandPaper", 6.85, 1.95, 0.55);
  txt(s, "Merksatz", { x: 6.85, y: 2.65, w: 2.5, h: 0.35, fontSize: 14, bold: true, color: OCHRE });
  txt(s, "Energie folgt der Aufmerksamkeit. Investiere sie dort, wo sie etwas bewirkt.", { x: 6.85, y: 3.05, w: 2.45, h: 1.5, fontSize: 13 });

  // 23 WOOP
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Ziele erreichen mit WOOP", "Methode nach Gabriele Oettingen – positive Gedanken plus Realitätscheck");
  pill(s, "ÜBUNG · 5 MIN", 7.6, 1.55);
  [["W", "Wish", "Was wünsche ich mir? Konkret und in den nächsten 4 Wochen erreichbar."],
   ["O", "Outcome", "Was wäre das beste Ergebnis? Wie fühlt es sich an?"],
   ["O", "Obstacle", "Welches innere Hindernis könnte mich stoppen?"],
   ["P", "Plan", "Wenn [Hindernis] auftritt, dann werde ich [Handlung]."]]
    .forEach(([l, h, d], k) => {
      const x = 0.5 + k * 2.3;
      card(s, x, 2.1, 2.1, 2.8, k === 3);
      txt(s, l, { x: x + 0.2, y: 2.2, w: 1, h: 0.8, fontSize: 44, bold: true, color: OCHRE });
      txt(s, h, { x: x + 0.2, y: 3.0, w: 1.7, h: 0.35, fontSize: 16, bold: true });
      txt(s, d, { x: x + 0.2, y: 3.4, w: 1.75, h: 1.4, fontSize: 12 });
    });

  // 24 3 gute Dinge
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Tipp: Drei gute Dinge am Abend");
  txt(s, "3", { x: 0.5, y: 1.3, w: 2.3, h: 2.2, fontSize: 150, bold: true, color: OCHRE, align: "center", valign: "middle" });
  txt(s, "Dinge, jeden Abend", { x: 0.5, y: 3.5, w: 2.3, h: 0.4, fontSize: 14, align: "center" });
  txt(s, "Übung aus der Positiven Psychologie (Martin Seligman)", { x: 3.3, y: 1.45, w: 6.2, h: 0.4, fontSize: 14, italic: true, color: OCHRE });
  steps(s, [
    ["Aufschreiben", "Drei Dinge, die heute gut waren – auch kleine."],
    ["Warum?", "Notiere, warum sie passiert sind und was dein Anteil war."],
    ["Dranbleiben", "Eine Woche lang täglich – dann Wirkung beobachten."],
  ], 3.3, 2.05, 5.6, 0.85);
  s.addNotes("Trainiert die Aufmerksamkeit für Positives und wirkt dem negativen Wahrnehmungsfilter (Negativity Bias) entgegen.");

  // 25 Rückschläge 3P
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Rückschläge meistern: Die 3 P", "Wie wir Misserfolge erklären, entscheidet über unsere Zuversicht");
  [["Persönlich", "„Es liegt nur an mir.“", "Welche Umstände haben auch mitgespielt?"],
   ["Permanent", "„Das wird immer so sein.“", "Was ist diesmal anders als beim nächsten Mal?"],
   ["Pervasiv", "„Alles geht schief.“", "Welche Lebensbereiche laufen gerade gut?"]]
    .forEach(([h, a, b], k) => {
      const x = 0.5 + k * 3.07;
      card(s, x, 1.65, 2.85, 3.2);
      txt(s, h, { x: x + 0.25, y: 1.85, w: 2.4, h: 0.45, fontSize: 19, bold: true, color: OCHRE });
      txt(s, "Falle", { x: x + 0.25, y: 2.4, w: 2.4, h: 0.3, fontSize: 11, bold: true });
      txt(s, a, { x: x + 0.25, y: 2.7, w: 2.4, h: 0.6, fontSize: 13, italic: true });
      txt(s, "Gegenfrage", { x: x + 0.25, y: 3.4, w: 2.4, h: 0.3, fontSize: 11, bold: true, color: OCHRE });
      txt(s, b, { x: x + 0.25, y: 3.7, w: 2.4, h: 0.9, fontSize: 13, color: OCHRE });
    });

  // 26 5-4-3-2-1
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Notfall-Übung: 5-4-3-2-1");
  pill(s, "ÜBUNG · 2 MIN");
  txt(s, "Holt dich bei Stress und Gedankenkarussell zurück ins Hier und Jetzt.", { x: 0.5, y: 1.6, w: 9, h: 0.4, fontSize: 15, italic: true, color: OCHRE });
  [["5", "Dinge, die du siehst"], ["4", "Dinge, die du fühlst"], ["3", "Dinge, die du hörst"], ["2", "Dinge, die du riechst"], ["1", "Ding, das du schmeckst"]]
    .forEach(([n, d], k) => {
      const x = 0.5 + k * 1.84;
      card(s, x, 2.25, 1.66, 2.55);
      txt(s, n, { x, y: 2.4, w: 1.66, h: 1.2, fontSize: 60, bold: true, color: OCHRE, align: "center", valign: "middle" });
      txt(s, d, { x: x + 0.15, y: 3.7, w: 1.36, h: 0.9, fontSize: 13, align: "center" });
    });
  s.addNotes("Live anleiten: Alle schauen sich im eigenen Raum um. Einige Beobachtungen im Chat sammeln.");

  // 27 Section Alltag
  section("04", "Alltagstransfer", "Mentale Stärke entsteht durch kleine, tägliche Wiederholungen.", "FaRoute");

  // 28 Energie & Gewohnheiten
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Die Basis: Körper und Gewohnheiten");
  [["FaBed", "Schlaf", "7–9 Stunden für Erwachsene: die Grundlage für Konzentration und Gelassenheit."],
   ["FaWalking", "Bewegung", "Schon ein 10-minütiger Spaziergang hebt die Stimmung spürbar."],
   ["FaCoffee", "Pausen", "Alle 60–90 Minuten kurz aufstehen, atmen, Blick in die Ferne."],
   ["FaMobileAlt", "Digitale Grenzen", "Handyfreie erste und letzte halbe Stunde des Tages."],
   ["FaUserFriends", "Beziehungen", "Soziale Unterstützung ist einer der stärksten Resilienzfaktoren."],
   ["FaLayerGroup", "Habit Stacking", "Neue Gewohnheit an eine alte koppeln: „Nach dem Kaffee …“"]]
    .forEach(([i, h, d], k) => {
      const x = 0.5 + (k % 3) * 3.07, y = 1.45 + Math.floor(k / 3) * 1.85;
      card(s, x, y, 2.85, 1.65);
      circleIcon(s, i, x + 0.2, y + 0.2, 0.5);
      txt(s, h, { x: x + 0.85, y: y + 0.25, w: 1.9, h: 0.4, fontSize: 15, bold: true, color: OCHRE, valign: "middle" });
      txt(s, d, { x: x + 0.2, y: y + 0.82, w: 2.5, h: 0.75, fontSize: 11.5 });
    });

  // 29 7-Tage-Plan + Commitment
  s = pres.addSlide({ masterName: "VA" });
  title(s, "Dein 7-Tage-Plan");
  pill(s, "ÜBUNG · 3 MIN");
  const plan = [["Mo", "ABC-Analyse"], ["Di", "Box Breathing"], ["Mi", "„noch“ nutzen"], ["Do", "Kontrollkreis"],
    ["Fr", "WOOP-Ziel"], ["Sa", "Innerer Coach"], ["So", "Erfolge feiern"]];
  plan.forEach(([d, t], k) => {
    const x = 0.5 + k * 1.3;
    card(s, x, 1.7, 1.18, 1.6);
    txt(s, d, { x, y: 1.8, w: 1.18, h: 0.5, fontSize: 20, bold: true, color: OCHRE, align: "center" });
    txt(s, t, { x: x + 0.08, y: 2.4, w: 1.02, h: 0.7, fontSize: 11, align: "center" });
  });
  txt(s, "Jeden Abend zusätzlich: drei gute Dinge notieren.", { x: 0.5, y: 3.45, w: 9, h: 0.35, fontSize: 13, italic: true, color: OCHRE });
  card(s, 0.5, 3.95, 9, 0.95, true);
  txt(s, [{ text: "Commitment im Chat: ", options: { bold: true, color: OCHRE } },
    { text: "„Ab morgen werde ich …“ – schreib deinen ersten konkreten Schritt." }],
    { x: 0.75, y: 3.95, w: 8.5, h: 0.95, fontSize: 15, valign: "middle" });

  // 30 Abschluss
  s = pres.addSlide({ masterName: "VA" });
  txt(s, "Das Wichtigste in Kürze", { x: 0.5, y: 0.35, w: 7.7, h: 0.65, fontSize: 30, bold: true, color: OCHRE, valign: "middle" });
  [["Mindset ist trainierbar", "Das Gehirn bleibt ein Leben lang formbar."],
   ["Bewertung ist der Hebel", "Nicht die Situation, sondern unser Blick darauf."],
   ["Kleine Schritte zählen", "Tägliche Mini-Übungen schlagen seltene große Vorsätze."]]
    .forEach(([h, d], k) => {
      const y = 1.3 + k * 0.85;
      circleIcon(s, "FaCheckCircle", 0.5, y, 0.55);
      txt(s, h, { x: 1.25, y, w: 4.5, h: 0.3, fontSize: 16, bold: true });
      txt(s, d, { x: 1.25, y: y + 0.32, w: 4.5, h: 0.3, fontSize: 12.5, color: OCHRE });
    });
  card(s, 6.1, 1.3, 3.4, 2.3, true);
  circleIcon(s, "FaComments", 6.35, 1.55, 0.55);
  txt(s, "Fragen & Austausch", { x: 6.35, y: 2.2, w: 3, h: 0.4, fontSize: 17, bold: true, color: OCHRE });
  txt(s, "Was nimmst du heute mit? Schreib ein Wort in den Chat.", { x: 6.35, y: 2.65, w: 2.95, h: 0.8, fontSize: 13 });
  txt(s, "Vielen Dank für deine Aufmerksamkeit!", { x: 0.5, y: 4.2, w: 9, h: 0.7, fontSize: 30, bold: true, color: OCHRE, align: "center", valign: "middle" });
  s.addNotes("Blitzlicht: Ein Wort in den Chat. Offene Fragen beantworten. Hinweis auf Folgeangebote der Visual Academy.");

  await pres.writeFile({ fileName: path.join(__dirname, "Mindset_und_mentale_Staerke.pptx") });
  console.log("done");
})();
