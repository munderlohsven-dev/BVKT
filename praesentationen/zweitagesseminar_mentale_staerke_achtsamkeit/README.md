# Zweitagesseminar „Mentale Stärke, Achtsamkeit und Entschleunigung im Arbeitsalltag“

Landkreis Osterholz · Bildungsstätte Bredbeck · Zielgruppe: Beschäftigte, insbesondere ab 50 Jahren.

- `Zweitagesseminar_Mentale_Staerke_Achtsamkeit.pptx` – 100 Folien, gleiches Layout wie „Mindset und mentale Stärke“ (schwarz, Orange-Ocker #E8963C / Weiß, Arial, Logo oben rechts)
- `Angebotsbeschreibung.md` – inhaltliche Grundlage
- `layouts.js` – wiederverwendbare Folien-Layouts; `build.js` – Inhalt aller Folien. Neu erzeugen mit `node build.js` (benötigt `pptxgenjs react react-dom react-icons sharp`)
- `Zusatzmodul_Menopause_Stress_Achtsamkeit.pptx` – 20 Folien zu Menopause, Stress und Achtsamkeit bei Frauen und Männern (Inhalt in `menopause.js`, erzeugen mit `node menopause.js`)
- `Bildprompts.md` – 32 Prompts für fotorealistische Bilder (aus `images.js`, erzeugt mit `node prompts.js`)
- `bilder/` – hier die generierten Bilder als `bild_01.jpg` … `bild_32.jpg` ablegen; `node build.js` bzw. `node menopause.js` setzt sie automatisch zugeschnitten ein, fehlende Bilder erscheinen als Platzhalter

## Aufbau
| Folien | Block |
|---|---|
| 1–8 | Eröffnung, Lernziele, Ablauf Tag 1, Kennenlernen, Energie-Barometer |
| 9–17 | 01 Mentale Gesundheit im Arbeitskontext |
| 18–29 | 02 Stress verstehen |
| 30–41 | 03 Resilienz und mentale Stärke |
| 42–53 | 04 Gedanken und Bewertungen, Tagesabschluss |
| 54–56 | Tag 2: Start, Ablauf, Check-in |
| 57–66 | 05 Achtsamkeit |
| 67–74 | 06 Atem und Kurzentspannung |
| 75–81 | 07 Entschleunigung |
| 82–90 | 08 Waldbaden (4 Stationen im Wald) |
| 91–100 | 09 Transfer, Zusammenfassung, Feedback, Dank |
