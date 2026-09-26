# E-Mail-Backup (getrennt nach Gesendet und Empfangen)

Lädt alle E-Mails des Postfachs `sven.munderloh@bvkt.de` vom Server
`secure.emailsrvr.com` auf den Mac. Es wird IMAP (Port 993, SSL) verwendet,
weil nur IMAP auch den Ordner „Gesendet" liefert. POP3 (Port 995) kennt
ausschließlich den Posteingang.

## Schnellstart auf dem Mac

1. Diesen Ordner `email_backup` auf den Mac laden (z. B. Repo als ZIP
   herunterladen oder `git clone`).
2. Im Finder auf **„E-Mail-Backup starten.command"** doppelklicken.
   Meldet macOS „kann nicht geöffnet werden": Rechtsklick → **Öffnen** → **Öffnen**.
   Fragt macOS nach den „Kommandozeilen-Tools": **Installieren** anklicken,
   danach erneut doppelklicken.
3. Im Terminalfenster das Kennwort eingeben (die Eingabe bleibt unsichtbar)
   und mit Enter bestätigen.
4. Warten, bis „Fertig" erscheint. Der Zielordner öffnet sich im Finder.

Alternativ im Terminal:

```bash
cd email_backup
python3 email_backup.py
```

## Ergebnis

```
~/Desktop/E-Mail-Backup_sven.munderloh/
├── Gesendet/                 alle gesendeten E-Mails als .eml
├── Gesendet.mbox             dieselben E-Mails als Mailbox-Datei
├── Empfangen/
│   ├── Posteingang/          empfangene E-Mails als .eml
│   ├── Posteingang.mbox
│   └── <weitere Ordner>/     eigene Unterordner des Postfachs
├── Sonstiges/                Entwürfe, Papierkorb, Spam
└── Uebersicht.csv            Liste aller E-Mails (öffnet sich in Excel/Numbers)
```

* Dateiname jeder E-Mail: `JJJJ-MM-TT_HHMMSS_Betreff_uidNNN.eml`.
  Ein Doppelklick öffnet sie in Apple Mail, Anhänge sind enthalten.
* Die `.mbox`-Dateien lassen sich in Apple Mail (Ablage → Postfächer
  importieren → „Dateien im mbox-Format") oder Thunderbird importieren.
* Das Skript ändert nichts auf dem Server (nur lesender Zugriff, E-Mails
  werden nicht als gelesen markiert und nicht gelöscht).
* Ein erneuter Start lädt nur E-Mails nach, die noch fehlen. Ein Abbruch ist
  daher unkritisch.

## Optionen

```
python3 email_backup.py --help
  --user ADRESSE     anderes Postfach
  --out ORDNER       anderer Zielordner
  --pop3             POP3 statt IMAP (nur Posteingang, Notlösung)
  --password ...     Kennwort direkt angeben (nicht empfohlen, landet im Verlauf)
```

Das Kennwort kann auch über die Umgebungsvariable `EMAIL_BACKUP_PASSWORD`
übergeben werden. Es wird nirgends gespeichert.

## Hinweis zur Sicherheit

Die Zugangsdaten wurden im Chat und als Bildschirmfoto übermittelt. Nach dem
Backup sollte das Kennwort im Webmail (https://webmail.jimdo.com/) geändert
werden.
