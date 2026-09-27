// Förderbericht Eingangsevaluation Kids for success Iserlohn, 25.09.2026
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, LevelFormat, BorderStyle, Footer, Header, PageNumber, ImageRun, TableLayoutType,
} = require("docx");

const FONT = "Arial";
// Farben aus der Excel-Tabelle (BVKT)
const ACCENT = "005E8F";   // Primärblau
const ORANGE = "FBAF3F";   // Akzent
const LIGHT = "DCEAF3", LIGHTER = "F3F8FB", LINE = "B8C7D1";
const TEXT = "2B2B2B", GRAY = "8A8A8A";
const LOGO = fs.readFileSync(__dirname + "/bvkt_logo.png");

const P = (text, o = {}) => new Paragraph({ spacing: { after: 120, line: 300 }, ...o, children: runs(text) });
// **bold** markup inside strings
function runs(text) {
  return text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((t) =>
    t.startsWith("**") ? new TextRun({ text: t.slice(2, -2), bold: true, color: ACCENT }) : new TextRun(t));
}
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, keepNext: true, keepLines: true, spacing: { before: 360, after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE, space: 4 } }, children: [new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, keepLines: true, spacing: { before: 220, after: 100 }, children: [new TextRun(t)] });
const B = (t) => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60, line: 280 }, children: runs(t) });
let numRef = 0;
const numbered = (items) => { const ref = "num" + ++numRef; numCfg.push(numConfig(ref)); return items.map((t) => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 60, line: 280 }, children: runs(t) })); };
const numConfig = (reference) => ({ reference, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { run: { color: ACCENT, bold: true }, paragraph: { indent: { left: 720, hanging: 360 } } } }] });
const numCfg = [];

const metaRow = (label, value) => new TableRow({ children: [
  new TableCell({ width: { size: 3200, type: WidthType.DXA }, borders: noB, shading: { fill: LIGHTER, type: ShadingType.CLEAR, color: "auto" }, margins: { top: 50, bottom: 50, left: 160, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color: ACCENT, size: 20 })] })] }),
  new TableCell({ width: { size: 5826, type: WidthType.DXA }, borders: noB, shading: { fill: LIGHTER, type: ShadingType.CLEAR, color: "auto" }, margins: { top: 50, bottom: 50, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: value, size: 20 })] })] }),
] });
const metaTable = (rows) => new Table({ width: { size: 9026, type: WidthType.DXA }, columnWidths: [3200, 5826],
  borders: { top: { style: BorderStyle.SINGLE, size: 12, color: ACCENT }, bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT }, left: nb, right: nb, insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: LIGHT }, insideVertical: nb },
  rows: rows.map(([a, b]) => metaRow(a, b)) });

const nb = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noB = { top: nb, bottom: nb, left: nb, right: nb };
const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
function table(head, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  const cell = (t, i, isHead, r = 0) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA }, borders,
    shading: { fill: isHead ? ACCENT : r % 2 ? "FFFFFF" : LIGHTER, type: ShadingType.CLEAR, color: "auto" },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text: t, bold: isHead || t === "Sehr hoch", color: isHead ? "FFFFFF" : t === "Sehr hoch" ? ACCENT : undefined, size: 20 })] })],
  });
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: head.map((t, i) => cell(t, i, true)) }),
      ...rows.map((r, ri) => new TableRow({ children: r.map((t, i) => cell(t, i, false, ri)) }))],
  });
}
const gap = () => new Paragraph({ spacing: { after: 120 }, children: [] });

const body = [
  new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: "KIDS FOR SUCCESS", bold: true, size: 20, color: ORANGE, characterSpacing: 40 })] }),
  new Paragraph({ spacing: { after: 280 }, children: [new TextRun({ text: "Förderbericht zur Eingangsevaluation", bold: true, size: 40, color: ACCENT })] }),
  metaTable([["Projekt", "Kids for success"], ["Institution", "Bartholomäusschule Iserlohn"], ["Zeitpunkt", "25. September 2026 (Schuljahr 2026/27)"],
    ["Anzahl teilnehmender Kinder", "10 (Alter: 7 bis 9 Jahre)"], ["Bereich", "Visuell-kognitives Training und motorische Entwicklung"]]),
  gap(),

  H1("1. Auftragsklärung und Ziel der Evaluation"),
  P("Im Rahmen des Projekts „Kids for success“ wurde am 25. September 2026 eine umfassende Eingangsevaluation mit einer Gruppe von zehn Kindern der Bartholomäusschule Iserlohn durchgeführt. Ziel dieser Evaluation war die systematische Erfassung des aktuellen Leistungsstands in den Bereichen visuelle Wahrnehmung, Binokularsehen, Blickbewegungen beim Lesen, kognitive Verarbeitung sowie motorische Koordination. Die gewonnenen Erkenntnisse dienen als Grundlage für die Erstellung individualisierter Förderpläne und die bedarfsgerechte Ausgestaltung der Projektinterventionen im Rahmen eines Gruppentrainings."),

  H1("2. Durchgeführte Testverfahren"),
  P("Die Eingangsevaluation umfasste insgesamt sieben standardisierte und praxisbewährte Testverfahren:"),
  ...numbered([
    "**Farbtafel / Tapping** – visuelle Verarbeitungsgeschwindigkeit, selektive Aufmerksamkeit und Blicksteuerung (bearbeitete Zeilen, Fehler)",
    "**Fitlight** – visuomotorische Reaktionsfähigkeit und periphere Wahrnehmung (Reaktionszeit, getroffene Lichter, Fehler)",
    "**Koordinationsleiter** – bilateral-koordinative Bewegungsabläufe (absolvierte Bahnen, Schrittfehler)",
    "**Seilspringen** – rhythmische Koordination und Ausdauer (Anzahl der Sprünge)",
    "**Frisbee** – Auge-Hand-Koordination und Distanzeinschätzung (fünf Versuche)",
    "**BVA** – Binokularsehen und räumliches Sehen: Fusionsbreite nach innen (Base-in) und außen (Base-out), jeweils Bruch- und Erholungspunkt",
    "**EyeTracker** – Blickbewegungen beim Lesen (Regressionen, Lesegeschwindigkeit in Wörtern pro Minute)",
  ]),
  P("Darüber hinaus erfolgten folgende qualitative Erhebungen:", { spacing: { before: 120, after: 120 } }),
  ...numbered([
    "Beobachtung von Sozialverhalten und Einordnung in die Gruppe",
    "Beobachtung von Aufmerksamkeit, Regelverständnis und Arbeitshaltung",
    "Erfassung der motivationalen Ausgangslage",
    "Dokumentation individueller Auffälligkeiten beim Sehen und Lesen",
  ]),
  P("Die Tests wurden gewählt, um ein umfassendes Bild der visuell-kognitiven und motorischen Kompetenzen sowie der Selbststeuerungsfähigkeiten der Kinder zu erhalten.", { spacing: { before: 120, after: 120 } }),

  H1("3. Allgemeine Beobachtungen während der Testdurchführung"),
  H2("3.1 Sozialverhalten und Gruppendynamik"),
  P("Das Sozialverhalten der Gruppe gestaltete sich zum Zeitpunkt der Eingangsevaluation noch schwierig. Einzelne Kinder konnten sich nur mit Mühe in die Gruppe einordnen: Warten, Abwechseln und das Einhalten gemeinsamer Absprachen fielen ihnen schwer, und die Gruppe benötigte wiederholt Unterstützung, um als Gemeinschaft zu arbeiten. Bei einem Kind war zudem eine ausgeprägte motorische Unruhe zu beobachten."),
  P("Da die Förderung im Gruppensetting stattfindet, ist die Entwicklung von Gruppenfähigkeit – Rücksichtnahme, Kooperation und Akzeptanz gemeinsamer Regeln – eine wichtige Voraussetzung für den Trainingserfolg."),
  H2("3.2 Aufmerksamkeit und Aufgabenverständnis"),
  P("Die Aufmerksamkeitsspanne war bei mehreren Kindern zum Teil recht kurz. Anweisungen mussten häufiger wiederholt werden, und die Konzentration ließ im Verlauf einzelner Aufgaben spürbar nach. Aufgaben mit längerer Dauer oder mehreren Teilschritten stellten für einen Teil der Gruppe eine deutliche Herausforderung dar."),
  P("Dies deutet auf Förderbedarf im Bereich der Daueraufmerksamkeit und der Exekutivfunktionen hin – zentrale Bereiche, die im Kontext visuell-kognitiven Trainings relevant sind."),
  H2("3.3 Motivationale Ausgangslage"),
  P("Positiv zu vermerken ist, dass alle zehn Kinder sämtliche Testaufgaben absolviert haben. Die grundsätzliche Bereitschaft zur Mitarbeit war damit gegeben. Die Motivation konnte jedoch noch nicht durchgängig in ein strukturiertes, zielgerichtetes und gruppenbezogenes Arbeitsverhalten umgesetzt werden."),
  H2("3.4 Auffälligkeiten beim Sehen und Lesen"),
  P("Während der Testdurchführung wurden bei mehreren Kindern Auffälligkeiten dokumentiert, die für die Förderplanung bedeutsam sind:"),
  B("Bei **fünf Kindern** konnte der EyeTracker-Lesetest nur anhand von Anfangsbuchstaben durchgeführt werden, da das flüssige Lesen ganzer Wörter noch nicht möglich war."),
  B("Ein Kind kennt noch nicht alle Buchstaben; bei **zwei Kindern** zeigten sich Verwechslungen der Buchstaben b und d."),
  B("Bei **fünf Kindern** ergaben sich Hinweise auf mögliche Sehprobleme: Verdacht auf Weitsichtigkeit, Verdacht auf Schielen mit erschwertem Nahsehen ohne Brille, tränende Augen beim BVA-Test, ein auffällig geringer Leseabstand sowie eine als sehr anstrengend erlebte BVA-Testung."),
  B("Ein Kind nutzte beim Lesen den Finger als Zeilenhilfe."),
  B("Ein Kind gab an, nicht gerne zu lesen."),

  H1("4. Ergebnisse der Testverfahren"),
  H2("4.1 Gesamtleistungsniveau"),
  P("In den sieben durchgeführten Tests erreichte die Gruppe insgesamt überwiegend durchschnittliche bis unterdurchschnittliche Leistungen. Die Streuung war dabei erheblich: Während einzelne Kinder in einzelnen Bereichen gute Leistungen zeigten, fanden sich bei der Mehrheit deutliche Defizite. Besonders auffällig waren die Ergebnisse im Binokularsehen (BVA), bei den Blickbewegungen und der Lesegeschwindigkeit (EyeTracker) sowie beim Seilspringen. Vergleichsweise stabil fielen die Ergebnisse im Fitlight-Test aus."),
  H2("4.2 Farbtafel / Tapping – visuelle Verarbeitung und selektive Aufmerksamkeit"),
  P("**Befund:** Die Kinder bearbeiteten zwischen zwei und sechs Zeilen (Median: 4 Zeilen) bei 0 bis 12 Fehlern (Median: 3 Fehler). Vier Kinder arbeiteten fehlerfrei, drei Kinder machten sieben oder mehr Fehler. Drei Kinder bearbeiteten lediglich zwei Zeilen."),
  P("**Interpretation:** Die Ergebnisse zeigen eine große Spannbreite in Verarbeitungsgeschwindigkeit und Genauigkeit. Hohe Fehlerzahlen weisen auf Schwierigkeiten in der selektiven Aufmerksamkeit und der systematischen Blickführung über die Tafel hin."),
  H2("4.3 Fitlight – visuomotorische Reaktionsfähigkeit"),
  P("**Befund:** Die Kinder erreichten zwischen 15 und 21 Lichtern (Median: 15,5) bei Reaktionszeiten zwischen 1,0 und 1,6 Sekunden. Kein Kind machte Fehler; die Hälfte der Gruppe erreichte jedoch nur 15 Lichter."),
  P("**Interpretation:** Die Kinder reagieren zuverlässig und zielgenau auf visuelle Reize. Das Reaktionstempo bietet noch deutliches Steigerungspotential. Der Fitlight-Test ist damit ein relativer Stärkenbereich der Gruppe und eignet sich gut als motivierendes Trainingselement."),
  H2("4.4 Koordinationsleiter – bilateral-koordinative Bewegungen"),
  P("**Befund:** Die Kinder absolvierten drei bis fünf Bahnen mit 4 bis 20 Schrittfehlern (Median: 7,5). Vier Kinder machten zwölf oder mehr Schrittfehler."),
  P("**Interpretation:** Die Fehlerzahlen weisen bei einem Teil der Gruppe auf unsichere Fußplatzierungen und noch nicht automatisierte, bilateral koordinierte Bewegungsabläufe hin. Diese Fähigkeiten sind grundlegend für viele alltägliche und sportliche Anforderungen."),
  H2("4.5 Seilspringen – rhythmische Koordination"),
  P("**Befund:** Die Anzahl der Sprünge reichte von 0 bis 37 (Median: 10). Zwei Kinder konnten noch keinen Sprung ausführen, insgesamt erreichte die Hälfte der Gruppe höchstens zehn Sprünge. Drei Kinder zeigten mit über 30 Sprüngen gute Leistungen."),
  P("**Interpretation:** Bei der Hälfte der Kinder bestehen erhebliche Defizite in der rhythmischen Koordination von Armen und Beinen sowie in der Körperspannung. Die große Spannbreite unterstreicht die Heterogenität der Gruppe."),
  H2("4.6 Frisbee – Auge-Hand-Koordination"),
  P("**Befund:** Von fünf Versuchen gelangen den Kindern zwischen einem und fünf (Median: 4). Drei Kinder waren in allen fünf Versuchen erfolgreich, zwei Kinder in höchstens zwei Versuchen."),
  P("**Interpretation:** Die Auge-Hand-Koordination und Distanzeinschätzung ist bei der Mehrheit der Kinder altersgemäß angelegt. Bei einzelnen Kindern besteht Förderbedarf in der Abstimmung von visueller Wahrnehmung und Bewegung."),
  H2("4.7 BVA – Binokularsehen und räumliches Sehen"),
  P("**Befund:** Die BVA erwies sich als einer der kritischsten Bereiche. Der Bruchpunkt bei Base-out (Konvergenz) lag zwischen 2 und 31 (Median: 12); bei sechs von zehn Kindern lag er deutlich unter den für diese Altersgruppe üblichen Richtwerten. Die Erholungswerte bei Base-out waren mit 0 bis 8 (Median: 2,5) bei allen Kindern gering. Bei Base-in (Divergenz) lag der Bruchpunkt zwischen 1 und 16 (Median: 10,5), die Erholungswerte zwischen 0 und 12; ein Kind zeigte hier einen sehr niedrigen Bruchpunkt, zwei Kinder keine messbare Erholung."),
  P("**Spezifische Beobachtungen:**"),
  B("Tränende Augen während der Testung bei einem Kind."),
  B("Ein Kind empfand die Testung als sehr anstrengend."),
  B("Ein Kind näherte sich den Testvorlagen auffällig dicht an."),
  P("**Interpretation:** Die Ergebnisse geben Hinweise auf eingeschränkte fusionale Reserven, insbesondere bei der Konvergenz. Dies kann sich bei Naharbeit wie Lesen und Schreiben durch schnelle Ermüdung, Konzentrationsprobleme, verschwommenes Sehen oder Kopfschmerzen bemerkbar machen. Eine augenärztliche bzw. optometrische Abklärung ist für die Kinder mit auffälligen Werten oder Beobachtungen empfehlenswert.", { spacing: { before: 120, after: 120 } }),
  H2("4.8 EyeTracker – Blickbewegungen beim Lesen"),
  P("**Befund:** Die Lesegeschwindigkeit lag zwischen 25 und 158 Wörtern pro Minute (Median: 40,5). Sechs von zehn Kindern lasen höchstens 48 Wörter pro Minute, vier Kinder erreichten 83 bis 158 Wörter pro Minute. Die Regressionswerte (Rücksprünge des Blicks) lagen zwischen 3,5 und 12,2; bei fünf Kindern waren sie mit Werten über 8 deutlich erhöht. Bei fünf Kindern war die Messung nur eingeschränkt anhand von Anfangsbuchstaben möglich."),
  P("**Interpretation:** Bei einem großen Teil der Gruppe sind Blicksteuerung und Lesefluss noch wenig automatisiert. Häufige Regressionen weisen auf ungenaue Blicksprünge (Sakkaden) und eine unsichere Zeilenführung hin. In Verbindung mit der teils unvollständigen Buchstabenkenntnis und den Buchstabenverwechslungen bietet der EyeTracker einen wichtigen Ankerpunkt für die Förderplanung."),
  P("Eine differenzierte Betrachtung der Einzelergebnisse findet sich in den individuellen Kinderberichten in unseren Unterlagen."),

  H1("5. Zusammenfassende Bewertung"),
  H2("5.1 Stärken der Gruppe"),
  B("Alle Kinder haben sämtliche Testaufgaben absolviert."),
  B("Zuverlässige, fehlerfreie Reaktionen im Fitlight-Test."),
  B("Überwiegend solide Auge-Hand-Koordination im Frisbee-Test."),
  B("Heterogenität der Gruppe mit einzelnen Kindern, die in Teilbereichen gute Leistungen zeigen (z. B. Seilspringen, Lesegeschwindigkeit, fehlerfreies Arbeiten an der Farbtafel)."),
  H2("5.2 Defizite und Förderbedarf"),
  P("Die Eingangsevaluation hat ein deutliches Profil von Kindern mit Förderbedarf in mehreren Bereichen aufgezeigt:"),
  table(["Bereich", "Auffälligkeitsgrad", "Priorität"], [
    ["Binokularsehen / Vergenz (BVA)", "Hoch (6 von 10 Kindern)", "Sehr hoch"],
    ["Blickbewegungen und Lesefluss (EyeTracker)", "Hoch (6 von 10 Kindern)", "Sehr hoch"],
    ["Sozialverhalten und Gruppenintegration", "Mittelhoch", "Hoch"],
    ["Aufmerksamkeitsspanne", "Mittelhoch", "Hoch"],
    ["Rhythmische Koordination (Seilspringen)", "Hoch (5 von 10 Kindern)", "Hoch"],
    ["Bilateral-koordinative Fähigkeiten (Koordinationsleiter)", "Mittel (4 von 10 Kindern)", "Mittel"],
    ["Visuelle Verarbeitung (Farbtafel / Tapping)", "Mittel", "Mittel"],
    ["Auge-Hand-Koordination (Frisbee)", "Gering bis mittel", "Mittel"],
    ["Visuomotorische Reaktion (Fitlight)", "Gering", "Niedrig bis mittel"],
  ], [4200, 2700, 2126]),
  gap(),
  H2("5.3 Ursachenspektrum"),
  P("Die beobachteten Auffälligkeiten können verschiedene Ursprünge haben:"),
  B("Eingeschränkte binokulare Funktionen und möglicherweise nicht erkannte oder nicht korrigierte Sehfehler."),
  B("Noch nicht ausreichend entwickelte Blicksteuerung und Lesekompetenz."),
  B("Unzureichend entwickelte neuromotorische Basiskompetenzen."),
  B("Noch wenig ausgeprägte soziale Kompetenzen und Selbstregulationsfähigkeiten."),
  B("Kurze Aufmerksamkeitsspanne oder Konzentrationsschwächen."),
  B("Mangelnde Erfahrung mit strukturiertem motorischem Training."),

  H1("6. Empfehlungen für die Förderplanung"),
  H2("6.1 Schwerpunkte der Intervention"),
  P("Auf Grundlage der Evaluationsergebnisse werden folgende Förderbereiche empfohlen:"),
  P("**1. Binokular- und Augenmotoriktraining (Priorität: sehr hoch)**"),
  B("Übungen zur Konvergenz und Fusionsbreite (z. B. Brock-Schnur, Annäherungsübungen)."),
  B("Gezielte Übungen zur Präzisierung von Sakkaden und Folgebewegungen."),
  B("Kurze, gut dosierte Einheiten mit Pausen, um Überanstrengung zu vermeiden."),
  P("**2. Lesebezogenes Blicktraining (Priorität: sehr hoch)**"),
  B("Training der Zeilenführung und Leserichtung, Reduktion von Regressionen."),
  B("Spielerische Buchstaben- und Formunterscheidung, insbesondere b/d."),
  B("Enge Abstimmung mit dem schulischen Leseunterricht."),
  P("**3. Soziales Lernen und Gruppenfähigkeit (Priorität: hoch)**"),
  B("Kooperationsspiele und Partnerübungen mit klaren Rollen."),
  B("Feste Rituale zu Beginn und Ende jeder Einheit."),
  B("Gezielte Integration einzelner Kinder, z. B. durch Verantwortungsaufgaben in der Gruppe."),
  P("**4. Aufmerksamkeits- und Konzentrationstraining (Priorität: hoch)**"),
  B("Kurze Übungsphasen von fünf bis zehn Minuten mit häufigem Aufgabenwechsel."),
  B("Visuelle Hilfen wie Timer, Bildkarten und Ablaufpläne."),
  B("Ruhe- und Achtsamkeitsübungen zur Selbstregulation."),
  P("**5. Koordinatives Basistraining (Priorität: hoch)**"),
  B("Rhythmische Bewegungsabläufe mit visueller und akustischer Unterstützung (Seilspringen, Klatschrhythmen)."),
  B("Bilateral-koordinative Übungen an der Koordinationsleiter und Doppelaufgaben."),
  B("Fitlight- und Frisbee-Übungen als motivierende Elemente zur Verbindung von Wahrnehmung und Bewegung."),
  H2("6.2 Förderstruktur"),
  B("**Kleinschrittige Progression:** Anforderungen graduell erhöhen."),
  B("**Kurze Übungseinheiten:** der Aufmerksamkeitsspanne der Kinder angepasst."),
  B("**Wiederholung und Automatisierung:** regelmäßiges Training zur Verfestigung."),
  B("**Spielerische Vermittlung:** Motivation durch spiel- und erlebnisorientierte Methoden."),
  B("**Positive Verstärkung:** Erfolgserlebnisse schaffen und Fortschritte anerkennen."),
  B("**Klare Struktur:** verlässliche Abläufe, transparente Regeln und feste Gruppenrituale."),
  H2("6.3 Begleitende Maßnahmen"),
  B("Regelmäßiger Austausch mit Lehrkräften und Schulsozialarbeit der Bartholomäusschule."),
  B("Empfehlung an die Eltern von fünf Kindern, eine augenärztliche bzw. optometrische Untersuchung durchführen zu lassen; bei vorhandener Brille auf konsequentes Tragen achten."),
  B("Zwischenevaluationen (zweiter und dritter Evaluationsdurchgang) zur Erfassung der Fortschritte, die erste voraussichtlich im Januar 2027."),
  B("Individuelle Förderpläne für Kinder mit besonderem Förderbedarf."),

  H1("7. Abschließende Bewertung"),
  P("Die Eingangsevaluation zeigt eine sehr heterogene Gruppe von Kindern mit viel Potential im Bereich der visuell-kognitiven und motorischen Kompetenzen. Das Ausmaß der Auffälligkeiten – insbesondere im Binokularsehen, bei den Blickbewegungen und im Lesefluss sowie in der rhythmischen Koordination – bestätigt die Notwendigkeit eines strukturierten, kontinuierlichen Trainings."),
  P("Eine besondere Aufgabe für die kommenden Wochen liegt im Aufbau eines tragfähigen Gruppenklimas und in der Förderung der Aufmerksamkeitsspanne. Positiv zu bewerten ist, dass alle Kinder die Testaufgaben vollständig bearbeitet haben – ein guter Ausgangspunkt für die weitere Arbeit. Mit einer gut gestalteten, kleinschrittigen und spielerisch vermittelten Intervention besteht berechtigte Hoffnung auf deutliche Fortschritte in den kommenden Wochen und Monaten."),
  P("Das Projekt „Kids for success“ leistet damit einen wichtigen Beitrag zur frühzeitigen Prävention und Förderung von Kindern mit Entwicklungsdefiziten. Die Ergebnisse dieser Eingangsevaluation werden regelmäßig überprüft und für die Optimierung der Fördermaßnahmen genutzt."),
];

const doc = new Document({
  creator: "Kids for success",
  title: "Förderbericht Eingangsevaluation Iserlohn 25.09.2026",
  styles: {
    default: { document: { run: { font: FONT, size: 22, color: TEXT } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 28, bold: true, color: ACCENT }, paragraph: { outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 23, bold: true, color: ACCENT }, paragraph: { outlineLevel: 1 } },
    ],
  },
  numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "■", alignment: AlignmentType.LEFT, style: { run: { color: ORANGE, size: 16 }, paragraph: { indent: { left: 720, hanging: 360 } } } }] }, ...numCfg] },
  sections: [{
    properties: { page: { margin: { top: 1700, bottom: 1300, left: 1440, right: 1440, header: 500 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new ImageRun({ type: "png", data: LOGO, transformation: { width: 62, height: 62 }, altText: { title: "BVKT e.V.", description: "Logo BVKT e.V.", name: "BVKT Logo" } })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "BVKT e.V.", bold: true, size: 16, color: ACCENT }), new TextRun({ text: "  ·  Kids for success  ·  Eingangsevaluation Iserlohn  ·  25.09.2026  ·  Seite ", size: 16, color: GRAY }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRAY })] })] }) },
    children: body,
  }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(__dirname + "/Foerderbericht_Kids_for_Success_Iserlohn_Eingangsevaluation_2026.docx", b); console.log("ok"); });
