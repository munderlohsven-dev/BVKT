#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
E-Mail-Backup: lädt alle E-Mails eines Postfachs herunter und speichert sie
lokal, getrennt nach "Gesendet" und "Empfangen".

Standard ist IMAP (Port 993, SSL), weil nur IMAP alle Ordner des Postfachs
liefert. POP3 (Port 995, SSL) kennt nur den Posteingang und ist als
Notlösung mit --pop3 wählbar.

Jede E-Mail wird unverändert als .eml-Datei gespeichert (öffnet sich per
Doppelklick in Apple Mail). Zusätzlich entsteht pro Ordner eine .mbox-Datei
für den Import in Apple Mail oder Thunderbird sowie eine Übersicht als CSV.

Das Skript benötigt nur Python 3 (auf dem Mac vorinstalliert) und keine
Zusatzpakete. Ein Abbruch ist unkritisch: Beim nächsten Start werden nur
noch fehlende E-Mails nachgeladen.
"""
from __future__ import annotations

import argparse
import base64
import csv
import email
import email.utils
import getpass
import imaplib
import mailbox
import os
import poplib
import re
import socket
import ssl
import sys
import time
from datetime import datetime, timezone
from email.header import decode_header, make_header
from pathlib import Path

DEFAULT_HOST = "secure.emailsrvr.com"
DEFAULT_USER = "sven.munderloh@bvkt.de"
IMAP_PORT = 993
POP3_PORT = 995
BATCH_SIZE = 25
TIMEOUT = 90

# Ordnernamen, an denen "Gesendet" erkannt wird, falls der Server kein \Sent-Flag liefert
SENT_NAMES = {
    "sent", "sent items", "sent messages", "sent mail", "gesendet",
    "gesendete objekte", "gesendete elemente", "gesendete nachrichten",
}
# Ordner, die weder gesendet noch empfangen sind
OTHER_NAMES = {
    "drafts", "entwürfe", "entwuerfe", "trash", "deleted items", "deleted messages",
    "papierkorb", "gelöschte objekte", "geloeschte objekte", "gelöschte elemente",
    "junk", "junk e-mail", "spam", "spamverdacht", "bulk mail", "outbox", "postausgang",
    "archive", "archiv", "notes", "notizen", "calendar", "kalender", "contacts", "kontakte",
    "tasks", "aufgaben",
}
DISPLAY_NAMES = {"inbox": "Posteingang", "sent": "Gesendet", "sent items": "Gesendet",
                 "sent messages": "Gesendet", "drafts": "Entwürfe", "trash": "Papierkorb",
                 "junk": "Spam", "spam": "Spam", "deleted items": "Papierkorb",
                 "deleted messages": "Papierkorb", "archive": "Archiv"}

LIST_RE = re.compile(rb'\((?P<flags>[^)]*)\)\s+(?P<delim>"[^"]*"|NIL)\s+(?P<name>.+)$')
UID_RE = re.compile(rb"UID (\d+)")
INTERNALDATE_RE = re.compile(rb'INTERNALDATE "([^"]+)"')


# ----------------------------------------------------------------------------
# Hilfsfunktionen
# ----------------------------------------------------------------------------
def log(msg: str) -> None:
    print(msg, flush=True)


def decode_modified_utf7(raw: str) -> str:
    """IMAP-Ordnernamen (RFC 3501, modified UTF-7) in normalen Text wandeln."""
    out, i = [], 0
    while i < len(raw):
        ch = raw[i]
        if ch != "&":
            out.append(ch)
            i += 1
            continue
        end = raw.find("-", i)
        if end == -1:
            out.append(raw[i:])
            break
        chunk = raw[i + 1:end]
        if chunk == "":
            out.append("&")
        else:
            b64 = chunk.replace(",", "/")
            b64 += "=" * (-len(b64) % 4)
            try:
                out.append(base64.b64decode(b64).decode("utf-16-be"))
            except Exception:
                out.append(raw[i:end + 1])
        i = end + 1
    return "".join(out)


def parse_list_line(line: bytes):
    """Eine Zeile der IMAP-LIST-Antwort in (flags, delimiter, name) zerlegen."""
    m = LIST_RE.match(line)
    if not m:
        return None
    flags = {f.decode("ascii", "replace").lower() for f in m.group("flags").split()}
    delim = m.group("delim")
    delim = None if delim == b"NIL" else delim.strip(b'"').decode("ascii", "replace")
    name = m.group("name").strip()
    if name.startswith(b'"') and name.endswith(b'"'):
        name = name[1:-1].replace(b'\\"', b'"').replace(b"\\\\", b"\\")
    return flags, delim, name.decode("ascii", "replace")


def classify(flags: set, name: str, delim) -> str:
    """Ordner einer Kategorie zuordnen: Gesendet, Empfangen oder Sonstiges."""
    last = name.split(delim)[-1] if delim else name
    key = last.strip().lower()
    if "\\sent" in flags or key in SENT_NAMES:
        return "Gesendet"
    if flags & {"\\drafts", "\\trash", "\\junk", "\\archive"} or key in OTHER_NAMES:
        return "Sonstiges"
    return "Empfangen"


def sanitize(part: str, limit: int = 80) -> str:
    """Dateisystem-taugliche Namen erzeugen (macOS, Windows, Linux)."""
    part = decode_modified_utf7(part) if "&" in part else part
    part = re.sub(r'[\\/:*?"<>|\x00-\x1f]', "_", part)
    part = re.sub(r"\s+", " ", part).strip(" .")
    return (part[:limit].rstrip(" .") or "_")


def folder_path(base: Path, category: str, name: str, delim) -> Path:
    segments = name.split(delim) if delim else [name]
    segments = [decode_modified_utf7(s) for s in segments]
    if category == "Gesendet" and len(segments) == 1:
        return base / "Gesendet"
    nice = [DISPLAY_NAMES.get(s.lower(), s) for s in segments]
    return base / category / Path(*[sanitize(s) for s in nice])


def header_text(msg, name: str) -> str:
    raw = msg.get(name, "")
    if not raw:
        return ""
    try:
        return str(make_header(decode_header(raw))).replace("\n", " ").replace("\r", " ")
    except Exception:
        return str(raw)


def message_date(msg, internaldate: bytes | None) -> datetime:
    for candidate in (msg.get("Date"),):
        if candidate:
            try:
                dt = email.utils.parsedate_to_datetime(candidate)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except Exception:
                pass
    if internaldate:
        try:
            return datetime.fromtimestamp(
                time.mktime(imaplib.Internaldate2tuple(b'INTERNALDATE "' + internaldate + b'"')),
                tz=timezone.utc)
        except Exception:
            pass
    return datetime.now(timezone.utc)


def existing_uids(folder: Path) -> set:
    uids = set()
    if folder.is_dir():
        for p in folder.glob("*_uid*.eml"):
            m = re.search(r"_uid(\d+)\.eml$", p.name)
            if m:
                uids.add(m.group(1))
    return uids


class Writer:
    """Schreibt .eml-Dateien, pflegt .mbox und die CSV-Übersicht eines Ordners."""

    def __init__(self, folder: Path, category: str, index_csv: Path):
        self.folder = folder
        self.category = category
        self.folder.mkdir(parents=True, exist_ok=True)
        self.mbox = mailbox.mbox(str(folder.with_suffix(".mbox")))
        new_index = not index_csv.exists()
        self.csv_file = open(index_csv, "a", newline="", encoding="utf-8-sig")
        self.csv = csv.writer(self.csv_file, delimiter=";")
        if new_index:
            self.csv.writerow(["Kategorie", "Ordner", "Datum", "Von", "An", "Betreff", "Datei"])
        self.count = 0

    def write(self, uid: str, raw: bytes, internaldate: bytes | None) -> None:
        msg = email.message_from_bytes(raw)
        dt = message_date(msg, internaldate)
        subject = sanitize(header_text(msg, "Subject") or "(kein Betreff)", 60)
        fname = f"{dt.strftime('%Y-%m-%d_%H%M%S')}_{subject}_uid{uid}.eml"
        target = self.folder / fname
        tmp = target.with_suffix(".part")
        tmp.write_bytes(raw)
        os.replace(tmp, target)
        try:
            self.mbox.add(raw)
        except Exception as exc:  # mbox ist nur eine Zugabe, .eml ist die Quelle
            log(f"    Hinweis: mbox-Eintrag fehlgeschlagen ({exc})")
        self.csv.writerow([self.category, self.folder.name, dt.strftime("%Y-%m-%d %H:%M:%S"),
                           header_text(msg, "From"), header_text(msg, "To"),
                           header_text(msg, "Subject"), str(target)])
        self.count += 1

    def close(self) -> None:
        try:
            self.mbox.flush()
            self.mbox.close()
        finally:
            self.csv_file.close()


# ----------------------------------------------------------------------------
# IMAP
# ----------------------------------------------------------------------------
def imap_connect(host: str, port: int, user: str, password: str) -> imaplib.IMAP4_SSL:
    ctx = ssl.create_default_context()
    conn = imaplib.IMAP4_SSL(host, port, ssl_context=ctx, timeout=TIMEOUT)
    conn.login(user, password)
    return conn


def imap_folders(conn) -> list:
    typ, lines = conn.list()
    if typ != "OK":
        raise RuntimeError(f"LIST fehlgeschlagen: {typ} {lines}")
    folders = []
    for line in lines:
        if isinstance(line, tuple):  # Name als Literal übertragen
            line = line[0] + b' "' + line[1] + b'"'
        parsed = parse_list_line(line) if line else None
        if not parsed:
            continue
        flags, delim, name = parsed
        if "\\noselect" in flags or "\\nonexistent" in flags:
            continue
        folders.append((flags, delim, name))
    return folders


def quote_mailbox(name: str) -> str:
    return '"' + name.replace("\\", "\\\\").replace('"', '\\"') + '"'


def imap_download_folder(conn_holder: dict, connect, base: Path, index_csv: Path,
                         flags: set, delim, name: str) -> tuple:
    category = classify(flags, name, delim)
    target = folder_path(base, category, name, delim)
    conn = conn_holder["conn"]
    typ, data = conn.select(quote_mailbox(name), readonly=True)
    if typ != "OK":
        log(f"  Ordner {name!r} kann nicht geöffnet werden: {data}")
        return category, 0, 0
    typ, data = conn.uid("SEARCH", None, "ALL")
    uids = data[0].split() if typ == "OK" and data and data[0] else []
    uids = [u.decode() for u in uids]
    have = existing_uids(target)
    todo = [u for u in uids if u not in have]
    log(f"  {category:9s} {decode_modified_utf7(name):35s} {len(uids):6d} E-Mails, davon neu: {len(todo)}")
    if not todo:
        return category, len(uids), 0

    writer = Writer(target, category, index_csv)
    done = 0
    try:
        for start in range(0, len(todo), BATCH_SIZE):
            batch = todo[start:start + BATCH_SIZE]
            for attempt in (1, 2, 3):
                try:
                    typ, data = conn.uid("FETCH", ",".join(batch),
                                         "(UID INTERNALDATE BODY.PEEK[])")
                    if typ != "OK":
                        raise RuntimeError(f"FETCH-Antwort {typ}")
                    break
                except (imaplib.IMAP4.abort, socket.error, ssl.SSLError, OSError, RuntimeError) as exc:
                    if attempt == 3:
                        raise
                    log(f"    Verbindung gestört ({exc}), neuer Versuch {attempt + 1}/3 ...")
                    time.sleep(3 * attempt)
                    conn = conn_holder["conn"] = connect()
                    conn.select(quote_mailbox(name), readonly=True)
            for item in data:
                if not isinstance(item, tuple) or len(item) < 2:
                    continue
                header, raw = item[0], item[1]
                m = UID_RE.search(header)
                if not m or not raw:
                    continue
                uid = m.group(1).decode()
                idm = INTERNALDATE_RE.search(header)
                writer.write(uid, raw, idm.group(1) if idm else None)
                done += 1
            log(f"    ... {done}/{len(todo)} gespeichert")
    finally:
        writer.close()
    return category, len(uids), done


def run_imap(args, password: str, base: Path) -> int:
    log(f"Verbinde per IMAP mit {args.host}:{args.port} als {args.user} ...")

    def connect():
        return imap_connect(args.host, args.port, args.user, password)

    holder = {"conn": connect()}
    log("Anmeldung erfolgreich. Lese Ordnerliste ...")
    folders = imap_folders(holder["conn"])
    if not folders:
        log("Keine Ordner gefunden.")
        return 1
    log(f"{len(folders)} Ordner gefunden:\n")
    index_csv = base / "Uebersicht.csv"
    totals = {}
    for flags, delim, name in folders:
        try:
            category, total, new = imap_download_folder(holder, connect, base, index_csv,
                                                        flags, delim, name)
        except Exception as exc:
            log(f"  FEHLER in Ordner {name!r}: {exc} (wird übersprungen, später erneut starten)")
            continue
        t = totals.setdefault(category, [0, 0])
        t[0] += total
        t[1] += new
    try:
        holder["conn"].logout()
    except Exception:
        pass
    log("\nZusammenfassung:")
    for cat in ("Empfangen", "Gesendet", "Sonstiges"):
        if cat in totals:
            log(f"  {cat:9s}: {totals[cat][0]:6d} E-Mails im Postfach, {totals[cat][1]} neu gespeichert")
    return 0


# ----------------------------------------------------------------------------
# POP3 (nur Posteingang)
# ----------------------------------------------------------------------------
def run_pop3(args, password: str, base: Path) -> int:
    log("HINWEIS: POP3 liefert nur den Posteingang. Gesendete E-Mails sind nur per IMAP erreichbar.")
    port = args.port if args.port != IMAP_PORT else POP3_PORT
    log(f"Verbinde per POP3 mit {args.host}:{port} als {args.user} ...")
    ctx = ssl.create_default_context()
    conn = poplib.POP3_SSL(args.host, port, context=ctx, timeout=TIMEOUT)
    conn.user(args.user)
    conn.pass_(password)
    count, size = conn.stat()
    log(f"Anmeldung erfolgreich. {count} E-Mails ({size / 1e6:.1f} MB) im Posteingang.")
    target = base / "Empfangen" / "Posteingang"
    have = existing_uids(target)
    writer = Writer(target, "Empfangen", base / "Uebersicht.csv")
    try:
        _, uidl, _ = conn.uidl()
        entries = [line.decode().split(" ", 1) for line in uidl]
        todo = [(num, uid) for num, uid in entries if re.sub(r"\W", "", uid) not in have]
        log(f"Davon neu: {len(todo)}")
        for i, (num, uid) in enumerate(todo, 1):
            _, lines, _ = conn.retr(int(num))
            raw = b"\r\n".join(lines) + b"\r\n"
            writer.write(re.sub(r"\W", "", uid), raw, None)
            if i % 25 == 0 or i == len(todo):
                log(f"    ... {i}/{len(todo)} gespeichert")
    finally:
        writer.close()
        try:
            conn.quit()
        except Exception:
            pass
    log(f"\nZusammenfassung:\n  Empfangen: {count:6d} E-Mails im Postfach, {writer.count} neu gespeichert")
    return 0


# ----------------------------------------------------------------------------
def main(argv=None) -> int:
    p = argparse.ArgumentParser(description="E-Mail-Backup, getrennt nach Gesendet und Empfangen.")
    p.add_argument("--user", default=os.environ.get("EMAIL_BACKUP_USER", DEFAULT_USER),
                   help=f"Benutzername / E-Mail-Adresse (Standard: {DEFAULT_USER})")
    p.add_argument("--host", default=os.environ.get("EMAIL_BACKUP_HOST", DEFAULT_HOST),
                   help=f"Mailserver (Standard: {DEFAULT_HOST})")
    p.add_argument("--port", type=int, default=IMAP_PORT, help="Port (Standard 993, bei --pop3 995)")
    p.add_argument("--pop3", action="store_true", help="POP3 statt IMAP verwenden (nur Posteingang)")
    p.add_argument("--out", help="Zielordner (Standard: ~/Desktop/E-Mail-Backup_<Benutzer>)")
    p.add_argument("--password", help="Kennwort (besser: Eingabeaufforderung oder EMAIL_BACKUP_PASSWORD)")
    args = p.parse_args(argv)

    password = args.password or os.environ.get("EMAIL_BACKUP_PASSWORD")
    if not password:
        password = getpass.getpass(f"Kennwort für {args.user} (Eingabe bleibt unsichtbar): ")
    base = Path(args.out).expanduser() if args.out else \
        Path.home() / "Desktop" / f"E-Mail-Backup_{sanitize(args.user.split('@')[0])}"
    base.mkdir(parents=True, exist_ok=True)
    log(f"Zielordner: {base}\n")

    started = time.time()
    try:
        rc = run_pop3(args, password, base) if args.pop3 else run_imap(args, password, base)
    except imaplib.IMAP4.error as exc:
        log(f"\nIMAP-Fehler: {exc}\nBitte Benutzername und Kennwort prüfen.")
        return 2
    except poplib.error_proto as exc:
        log(f"\nPOP3-Fehler: {exc}\nBitte Benutzername und Kennwort prüfen.")
        return 2
    except (socket.gaierror, socket.timeout, ConnectionError, ssl.SSLError, OSError) as exc:
        log(f"\nVerbindungsfehler: {exc}\nBitte Internetverbindung und Servername prüfen.")
        return 3
    except KeyboardInterrupt:
        log("\nAbgebrochen. Beim nächsten Start werden nur fehlende E-Mails nachgeladen.")
        return 130
    log(f"\nFertig nach {time.time() - started:.0f} Sekunden. Alle Dateien liegen in:\n  {base}")
    return rc


if __name__ == "__main__":
    sys.exit(main())
