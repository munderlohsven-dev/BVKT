#!/bin/bash
# Doppelklick-Starter für macOS. Öffnet ein Terminalfenster, fragt das Kennwort ab
# und speichert alle E-Mails unter ~/Desktop/E-Mail-Backup_<Benutzer>/.
cd "$(dirname "$0")" || exit 1
echo "E-Mail-Backup wird gestartet ..."
echo
if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 wurde nicht gefunden. Bitte im erscheinenden Dialog die"
  echo "Kommandozeilen-Tools installieren und danach erneut doppelklicken."
  xcode-select --install 2>/dev/null
  read -r -p "Zum Schließen Enter drücken."
  exit 1
fi
python3 email_backup.py "$@"
STATUS=$?
echo
if [ $STATUS -eq 0 ]; then
  echo "Backup abgeschlossen. Der Zielordner wird im Finder geöffnet."
  open "$HOME/Desktop/E-Mail-Backup_"* 2>/dev/null
else
  echo "Das Backup wurde mit Fehlercode $STATUS beendet (siehe Meldung oben)."
fi
read -r -p "Zum Schließen Enter drücken."
