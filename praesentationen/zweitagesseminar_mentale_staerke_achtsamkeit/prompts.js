// Erzeugt Bildprompts.md aus images.js und der Folienreihenfolge in build.js
const fs = require("fs");
const { IMAGES, STYLE } = require("./images");
const src = fs.readFileSync(__dirname + "/build.js", "utf8");
const blocks = src.split(/\n  \{ t: /).slice(1);
const where = {};
blocks.forEach((b, i) => {
  const m = b.match(/img: "(\d+)"/);
  const t = b.match(/title: "([^"]+)"/) || b.match(/text: "([^"]{0,40})/);
  if (m) where[m[1]] = { slide: i + 1, title: t ? t[1] : "" };
});
const fmt = { portrait: "Hochformat 4:5 (z. B. 1600 × 2000 px) – Midjourney: --ar 4:5", wide: "Querformat 16:9 (z. B. 1920 × 1080 px) – Midjourney: --ar 16:9" };
let md = `# Bildprompts – Zweitagesseminar „Mentale Stärke, Achtsamkeit und Entschleunigung“

${Object.keys(IMAGES).length} Bilder für die Präsentation. Jedes Bild hat in der PowerPoint bereits einen Bildplatz mit Platzhalter („BILD 01“ usw.).

## So geht's
1. Prompt in Ihren Bildgenerator kopieren (Midjourney, DALL·E, Adobe Firefly, Leonardo …). Die Prompts sind auf Englisch, weil die meisten Generatoren damit die besten Ergebnisse liefern.
2. Den **Stil-Zusatz** unten immer an den Prompt anhängen – so wirken alle Bilder wie aus einem Guss.
3. Bild speichern als \`bild_01.jpg\`, \`bild_02.jpg\` … (auch .png oder .webp möglich) und hier hochladen.
4. Ich füge die Bilder ein; sie werden automatisch passend zugeschnitten.

**Stil-Zusatz (an jeden Prompt anhängen):**
\`\`\`
${STYLE}
\`\`\`

**Tipps aus Fotografen-Sicht**
- Bei Personen ausdrücklich das Alter nennen (50+) – sonst liefern Generatoren meist 20- bis 30-Jährige.
- Hände genau prüfen (Fingerzahl) und notfalls neu generieren.
- Mehrere Varianten erzeugen und die ruhigste, natürlichste auswählen; lieber zurückhaltend als zu „perfekt“.
- Die Nutzungsbedingungen Ihres Bildgenerators für den Einsatz in Seminaren beachten.

---
`;
for (const [id, im] of Object.entries(IMAGES)) {
  const w = where[id] || {};
  md += `\n## Bild ${id} – ${im.de}\n- **Folie ${w.slide}:** ${w.title}\n- **Format:** ${fmt[im.slot]}\n\n\`\`\`\n${im.prompt}, ${STYLE}\n\`\`\`\n`;
}
fs.writeFileSync(__dirname + "/Bildprompts.md", md);
console.log(Object.entries(where).map(([k, v]) => k + "→" + v.slide).join(" "));
