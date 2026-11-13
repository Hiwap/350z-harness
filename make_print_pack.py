#!/usr/bin/env python3
"""Engine/body harness print pack: EC-123 + FSM values + every ficha (paginated).
White backgrounds. Cards = group outline (web) · 5V = amber outer ring.
Color cable = cavity contour + written code only. Faces are fixed FSM T.S. order.
"""
import json
import os
import re
from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.utils import ImageReader
import argparse

_ROOT = os.path.dirname(os.path.abspath(__file__))

_parser = argparse.ArgumentParser(description="350Z engine harness print pack PDF")
_parser.add_argument("--lang", choices=("en", "es", "ja"), default="en",
                     help="PDF language (default: en)")
_args = _parser.parse_args()
LANG = _args.lang

_default_name = (
    "350Z_2005_PRINT_PACK.pdf" if LANG == "en"
    else f"350Z_2005_PRINT_PACK_{LANG}.pdf"
)
OUT = os.environ.get("PRINT_PACK_OUT", os.path.join(_ROOT, _default_name))
PREVIEW_DIR = os.environ.get("PRINT_PACK_PREVIEW", os.path.join(_ROOT, "pdf_preview"))
W, H = landscape(letter)

# ---- Fonts: Helvetica for en/es; CID Gothic for Japanese prose ----
FONT = "Helvetica"
FONT_B = "Helvetica-Bold"
if LANG == "ja":
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.cidfonts import UnicodeCIDFont
    pdfmetrics.registerFont(UnicodeCIDFont("HeiseiKakuGo-W5"))
    FONT = FONT_B = "HeiseiKakuGo-W5"

# ---- I18N from index.html (map is source of truth; --lang only selects pack) ----
import subprocess

def _load_map_i18n():
    """I18N, CONN_BASE, and CONN_I18N from test/load_map.mjs."""
    map_html = os.path.join(_ROOT, 'index.html')
    if not os.path.isfile(map_html):
        map_html = '/workspace/350z-harness-pages/index.html'
    loader = os.path.join(_ROOT, 'test', 'load_map.mjs')
    raw = subprocess.check_output(['node', loader, map_html], text=True)
    return json.loads(raw)

_MAP = _load_map_i18n()
I18N = _MAP['I18N']
CONN_BASE = _MAP['CONN_BASE']
CONN_I18N = _MAP['CONN_I18N']
print('I18N source: index.html · lang=%s · keys=%d' % (LANG, len(I18N.get(LANG) or {})))

def _load_sm_dump():
    dump = os.path.join(_ROOT, 'tools', 'sm_dump.mjs')
    raw = subprocess.check_output(['node', dump], text=True)
    return json.loads(raw)

SM_DUMP = _load_sm_dump()
print('SM dump: cards=%d ecm=%d' % (len(SM_DUMP.get('cards') or {}), len(SM_DUMP.get('ecm') or {})))

def sm_pin_lines(cid, pid):
    rec = (((SM_DUMP.get('cards') or {}).get(cid) or {}).get('pins') or {}).get(str(pid)) or {}
    return rec.get(LANG) or []

def sm_ecm_lines(n):
    rec = (SM_DUMP.get('ecm') or {}).get(str(n)) or {}
    return rec.get(LANG) or []

def sm_card_rows(cid):
    rows = ((SM_DUMP.get('cards') or {}).get(cid) or {}).get('rows')
    if not rows or (isinstance(rows, dict) and rows.get('none')):
        return []
    return rows or []


def t(key, **kwargs):
    """Translate key from map I18N[LANG]; fall back to en then es then key."""
    for pack_lang in (LANG, 'en', 'es'):
        pack = I18N.get(pack_lang) or {}
        if key in pack and pack[key] is not None:
            s = pack[key]
            break
    else:
        s = key
    if kwargs:
        return s.format(**kwargs)
    return s

def color_name(code):
    """Wire color legend label from map I18N.cname (not a parallel dict)."""
    pack = I18N.get(LANG) or I18N.get('en') or {}
    cname = pack.get('cname') or (I18N.get('en') or {}).get('cname') or {}
    return cname.get(code) or code

def conn_field(cid, field='name'):
    """Localized connector field from CONN_BASE (es) + CONN_I18N (en/ja)."""
    base = (CONN_BASE.get(cid) or {}).get(field) or ''
    if LANG == 'es':
        return base
    tr = (CONN_I18N.get(cid) or {}).get(LANG) or {}
    return tr.get(field) or base


c = canvas.Canvas(OUT, pagesize=landscape(letter))

# Wire colors / rails filled from map HTML after load (fallback: pin_colors.json)
PIN_COL = {}
PIN_RAIL = {}
PIN_CAN = {}
OC = {
    "B": HexColor("#000000"), "W": HexColor("#757575"), "R": HexColor("#D50000"),
    "G": HexColor("#1B5E20"), "L": HexColor("#0D47A1"), "Y": HexColor("#F57F17"),
    "OR": HexColor("#E65100"), "P": HexColor("#880E4F"), "PU": HexColor("#4A148C"),
    "GY": HexColor("#424242"), "BR": HexColor("#3E2723"), "SB": HexColor("#01579B"),
    "LG": HexColor("#33691E"), "?": HexColor("#616161"), "12V": HexColor("#C62828"),
    "SNS": HexColor("#546E7A"), "—": HexColor("#9E9E9E"),
}
BENCH = {90, 91, 82, 83, 13, 2, 47, 48, 49}

FACE_INV = True  # legacy "Invertida" flag: only row_labs() reads it (unused). Cards are fixed FSM T.S. faces (see ficha()).
FACE_ORIENT_LABEL = t("face_orient")

SHELL = black
LAB_5V = HexColor("#F9A825")
LAB_12V = HexColor("#C62828")
LAB_GND = HexColor("#2E7D32")
TITLE_BLACK = black
ECM_BLUE = HexColor("#1565C0")
MUTED = HexColor("#555555")
LIGHT_GRAY = HexColor("#BDBDBD")
PATH_BG = HexColor("#FAFAFA")
# Uniform cavity size across all fichas (print ≈ web fixed pin cells)
CAV_STD_W = 32.0
CAV_STD_H = 36.0

# Match web SUB_ACCENT (group outline on fichas)
GRP = {
    "power": HexColor("#66bb6a"),
    "feeds": HexColor("#ff8a65"),
    "sensors": HexColor("#42a5f5"),
    "actuators": HexColor("#7e57c2"),
    "intermedias": HexColor("#90a4ae"),
    "pedals": HexColor("#ffa726"),
    "ascd": HexColor("#26c6da"),
    "dlc": HexColor("#ab47bc"),
}


def oc(code):
    if not code or code == "?":
        return OC["?"]
    if code == "12V":
        return OC["12V"]
    if code == "—":
        return OC["—"]
    return OC.get(code.split("/")[0], OC["?"])


def draw_wire_code(cx, cy, code, fs):
    """Wire code like web .pw: each letter color + black halo for contrast.
    Always Helvetica-Bold — codes are ASCII (B, R/W), not translated prose."""
    if not code:
        code = "·"
    parts = code.split("/") if "/" in code else [code]
    wire_font = "Helvetica-Bold"
    c.setFont(wire_font, fs)
    segs = []
    for i, part in enumerate(parts):
        if i:
            segs.append(("/", HexColor("#455A64")))
        segs.append((part, oc(part)))
    total = sum(c.stringWidth(s, wire_font, fs) for s, _ in segs)
    x = cx - total / 2
    for dx, dy in ((-0.55,0),(0.55,0),(0,-0.55),(0,0.55),(-0.4,-0.4),(0.4,-0.4),(-0.4,0.4),(0.4,0.4)):
        xx = x
        for s, _col in segs:
            c.setFillColor(black)
            c.drawString(xx + dx, cy + dy, s)
            xx += c.stringWidth(s, wire_font, fs)
    xx = x
    for s, col in segs:
        c.setFillColor(col)
        c.drawString(xx, cy, s)
        xx += c.stringWidth(s, wire_font, fs)


def ecm_bottom_label(pin):
    """Match web ECM dest line: rail GND/12V/5V, CAN C/H·C/L, else blank."""
    rail = PIN_RAIL.get(pin)
    if rail == "gnd":
        return "GND"
    if rail == "12v":
        return "12V"
    if rail == "5v":
        return "5V"
    can = PIN_CAN.get(pin)
    if can:
        return can
    return ""


def draw_pin(x, y, w, h, pin):
    """ECM cell: pin nº · wire code · rail/CAN · reserved SM value band (uniform height)."""
    code = PIN_COL.get(pin, "")
    bot = ecm_bottom_label(pin)
    is_bench = pin in BENCH
    c.setFillColor(white)
    c.setStrokeColor(HexColor("#B71C1C") if is_bench else oc(code) if code else LIGHT_GRAY)
    c.setLineWidth(2.2 if (code or is_bench) else 0.5)
    c.roundRect(x, y, w, h, 2, fill=1, stroke=1)
    if code and "/" in code:
        c.setStrokeColor(oc(code.split("/")[1]))
        c.setLineWidth(1.4)
        c.line(x + w - 2.2, y + 2.5, x + w - 2.2, y + h - 2.5)
    band_h = max(12.0, min(24.0, h * 0.36))
    body_h = h - band_h
    has_bot = bool(bot)
    fs_pin = max(5.5, min(9.5, body_h * (0.36 if has_bot else 0.44)))
    fs_code = max(3.6, min(6.2, body_h * (0.24 if has_bot else 0.30)))
    fs_bot = max(3.4, min(5.8, body_h * 0.22))
    c.setFillColor(HexColor("#212121"))
    c.setFont(FONT_B, fs_pin)
    c.drawCentredString(x + w / 2, y + band_h + body_h * (0.62 if has_bot else 0.55), str(pin))
    draw_wire_code(x + w / 2, y + band_h + body_h * (0.34 if has_bot else 0.14), code if code else "·", fs_code)
    if has_bot:
        if bot in ("GND", "12V", "5V"):
            c.setFillColor(lab_fill(bot))
        elif bot.startswith("C/"):
            c.setFillColor(HexColor("#6A1B9A"))
        else:
            c.setFillColor(MUTED)
        c.setFont(FONT_B, fs_bot)
        c.drawCentredString(x + w / 2, y + band_h + max(1.6, body_h * 0.05), bot)
    # Reserved band on every cell (uniform height). Wrap 1–3 condition lines; the next page has the full text.
    raw = " · ".join(
        pdf_safe(item.get("text") if isinstance(item, dict) else str(item))
        for item in (sm_ecm_lines(pin) or [])
        if (item.get("text") if isinstance(item, dict) else str(item))
    )
    if raw and sm_text_duplicates_rail(bot, raw):
        raw = ""
    if raw:
        fs_v = max(2.5, min(3.8, min(band_h * 0.28, w * 0.20)))
        lines = wrap_to_width(raw, FONT, fs_v, w - 2.4, max_lines=3)
        if lines and len(lines[0].rstrip("…")) >= 2:
            c.saveState()
            pth = c.beginPath()
            pth.roundRect(x, y, w, h, 2)
            c.clipPath(pth, stroke=0, fill=0)
            c.setFillColor(HexColor("#6D4C00"))
            c.setFont(FONT, fs_v)
            step = min(fs_v + 0.45, (band_h - 1.0) / max(len(lines), 1))
            y0 = y + 1.0 + (band_h - step * len(lines)) / 2
            for i, ln in enumerate(lines):
                c.drawCentredString(x + w / 2, y0 + (len(lines) - 1 - i) * step, ln)
            c.restoreState()


def draw_empty(x, y, w, h):
    c.setFillColor(white)
    c.setStrokeColor(HexColor("#E0E0E0"))
    c.setLineWidth(0.5)
    c.setDash(1, 1)
    c.roundRect(x, y, w, h, 1, fill=1, stroke=1)
    c.setDash()


def draw_block(x0, y_top, rows, pw, ph, gap=1.6):
    """y_top is the top of the first row; reportlab rects are drawn from the bottom."""
    for ri, row in enumerate(rows):
        y = y_top - ph - ri * (ph + gap)
        for ci, pin in enumerate(row):
            x = x0 + ci * (pw + gap)
            if pin is None:
                draw_empty(x, y, pw, ph)
            else:
                draw_pin(x, y, pw, ph, pin)


def ecm_label(note):
    if note is None or note == "":
        return "—"
    s = str(note)
    if s.isdigit():
        return "→" + s
    if s.startswith("→"):
        return s
    return s


def lab_fill(lab):
    raw = str(lab).strip()
    u = raw.upper()
    if u == "5V":
        return LAB_5V
    if u == "12V":
        return LAB_12V
    # GND / gnd / SNS / SH / tierra → green
    if u in ("GND", "SNS", "SH", "TIERRA") or "TIERRA" in u or u.startswith("GND"):
        return LAB_GND
    return TITLE_BLACK


def pdf_safe(text):
    """Map characters Helvetica cannot draw (keeps FSM wording, typography only)."""
    if not text:
        return ""
    return (
        str(text)
        .replace("≈", "~")
        .replace("ω", "ohm")
        .replace("Ω", "ohm")
        .replace("℃", "°C")
        .replace("℉", "°F")
    )


_RAIL_DUP_RE = re.compile(
    r"^(?:aproximadamente|approximatel(?:y)?|aprox\.?|approx\.?|≈|~|∼|約)?\s*(0|5|12)(?:\.0)?\s*v\s*\.?$",
    re.I,
)

def sm_text_duplicates_rail(bot, raw):
    """Skip a 4th-row value that only repeats the 3rd-line rail (5V / 0V on GND / 12V)."""
    if not bot or not raw:
        return False
    bot_u = str(bot).strip().upper()
    t = str(raw).strip()
    if "·" in t or "–" in t or " - " in t:
        return False
    trail = re.sub(r"^.*?:\s*", "", t).strip()
    m = _RAIL_DUP_RE.match(trail) or _RAIL_DUP_RE.match(t)
    if not m:
        return False
    v = m.group(1)
    if bot_u == "5V" and v == "5":
        return True
    if bot_u == "12V" and v == "12":
        return True
    if bot_u in ("GND", "SNS", "SH", "TIERRA") or bot_u.startswith("GND"):
        return v == "0"
    return False


def wrap_to_width(text, font, size, width, max_lines=2):
    """Greedy wrap. Prefer middot breaks; works for ja (no spaces)."""
    from reportlab.pdfbase.pdfmetrics import stringWidth
    text = pdf_safe(text).strip()
    if not text or width <= 2 or max_lines <= 0:
        return []

    def sw(s):
        try:
            return stringWidth(s, font, size)
        except Exception:
            return len(s) * size * 0.5

    def split_chunk(chunk):
        if sw(chunk) <= width:
            return [chunk]
        out, cur = [], ""
        # word wrap when spaces exist (en/es); else character wrap (ja)
        tokens = chunk.split(" ") if (" " in chunk and LANG != "ja") else list(chunk)
        glue = " " if (" " in chunk and LANG != "ja") else ""
        for tok in tokens:
            trial = tok if not cur else cur + glue + tok
            if cur and sw(trial) > width:
                out.append(cur)
                cur = tok
            else:
                cur = trial
        if cur:
            out.append(cur)
        return out

    pieces = [p.strip() for p in text.split(" · ") if p.strip()] if " · " in text else [text]
    lines = []
    for i, piece in enumerate(pieces):
        chunk = piece if i == 0 or not lines else "· " + piece
        for bit in split_chunk(chunk if sw(chunk) <= width or i == 0 else piece):
            if len(lines) < max_lines:
                lines.append(bit)
            else:
                break
        if len(lines) >= max_lines:
            break
    leftover = False
    rendered = " ".join(lines).replace(" ", "")
    compact = text.replace(" ", "")
    if len(rendered) < len(compact) - 1:
        leftover = True
    if leftover and lines:
        last = lines[-1]
        while last and sw(last + "…") > width:
            last = last[:-1]
        lines[-1] = (last + "…") if last else "…"
    return lines


def draw_cavity(px, py, cw, ch, lab, col, note, fs=None, sm_lines=None):
    """Cavity: white fill · wire-color contour · codes · reserved SM value band (same height for every pin)."""
    sm_lines = sm_lines or []
    # Reserve a value band on EVERY cavity, empty or not, so pin size stays uniform.
    band_h = max(7.5, min(14.0, ch * 0.34)) if ch >= 22 else max(5.5, ch * 0.28)
    if fs is None:
        fs = max(4.0, min(7.2, min((ch - band_h) * 0.32, cw * 0.22)))
    pad = 1.0 if min(cw, ch) < 28 else 1.4
    c.setFillColor(white)
    stroke = oc(col) if col and col not in ("", "—", "nc") else LIGHT_GRAY
    c.setStrokeColor(stroke)
    c.setLineWidth(1.9 if ch >= 28 else 1.55)
    c.roundRect(px + pad, py + pad, cw - 2 * pad, ch - 2 * pad, min(2.4, ch * 0.12), fill=1, stroke=1)
    if col and "/" in col:
        c.setStrokeColor(oc(col.split("/")[1]))
        c.setLineWidth(1.35)
        c.line(px + cw - 3.8, py + 2.5, px + cw - 3.8, py + ch - 2.5)
    body_h = ch - band_h
    c.setFillColor(ECM_BLUE)
    c.setFont(FONT_B, max(3.4, fs - 0.5))
    c.drawCentredString(px + cw / 2, py + band_h + body_h * 0.70, ecm_label(note)[:8])
    c.setFillColor(black)
    c.setFont(FONT_B, max(3.4, fs - 0.7))
    c.drawCentredString(px + cw / 2, py + band_h + body_h * 0.38, str(col)[:8])
    c.setFillColor(lab_fill(lab))
    c.setFont(FONT, max(3.2, fs - 0.9))
    c.drawCentredString(px + cw / 2, py + band_h + max(1.4, body_h * 0.06), str(lab)[:7])
    # value band — always reserved; text only when FSM has a value
    texts = []
    for item in sm_lines:
        if isinstance(item, dict):
            tx = item.get("text") or ""
        else:
            tx = str(item)
        if tx:
            texts.append(pdf_safe(tx))
    raw = " · ".join(texts)
    if raw and sm_text_duplicates_rail(lab, raw):
        raw = ""
    if raw:
        fs_v = max(2.6, min(4.4, min(band_h * 0.42, cw * 0.16)))
        lines = wrap_to_width(raw, FONT, fs_v, cw - 2 * pad - 1.5, max_lines=2)
        # Don't paint unreadable 2–3 character fragments; the table under the face has the full text.
        if lines and len(lines[0].rstrip("…")) >= 4:
            c.saveState()
            pth = c.beginPath()
            pth.roundRect(px + pad, py + pad, cw - 2 * pad, ch - 2 * pad, min(2.4, ch * 0.12))
            c.clipPath(pth, stroke=0, fill=0)
            c.setFillColor(HexColor("#6D4C00"))
            c.setFont(FONT, fs_v)
            if len(lines) == 1:
                c.drawCentredString(px + cw / 2, py + pad + (band_h - fs_v) / 2, lines[0])
            else:
                step = min(fs_v + 0.6, (band_h - 1.2) / max(len(lines), 1))
                y0 = py + pad + band_h - step - 0.4
                for i, ln in enumerate(lines):
                    c.drawCentredString(px + cw / 2, y0 - i * step, ln)
            c.restoreState()
    c.setFillColor(black)


def row_labs(labs):
    """Legacy Invertida row mirror (not called). Motor cards are fixed FSM T.S. faces, like the map fichas."""
    labs = list(labs)
    return list(reversed(labs)) if FACE_INV else labs


def card_shell(x, y, w, h, accent=None, rail_5v=False, radius=3.5):
    """White card; group-colored outline. Optional outer amber ring for 5V paths."""
    stroke = accent if accent is not None else SHELL
    c.setFillColor(white)
    if rail_5v:
        c.setStrokeColor(LAB_5V)
        c.setLineWidth(2.7)
        c.roundRect(x - 1.6, y - 1.6, w + 3.2, h + 3.2, radius + 1.2, fill=0, stroke=1)
    c.setStrokeColor(stroke)
    c.setLineWidth(1.7)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)




def cav_fit(face_w, face_h, cols, rows=1):
    """Uniform pin size, shrink only if the card is too small.
    Height may exceed width so every cavity can reserve a value band."""
    cw = min(CAV_STD_W, face_w / max(cols, 1))
    ch = min(CAV_STD_H, face_h / max(rows, 1))
    if cw > 0 and ch / cw > 1.45:
        ch = cw * 1.45
    if ch > 0 and cw / ch > 1.25:
        cw = min(CAV_STD_W, ch * 1.25)
    return cw, ch


def split_ficha_title(title):
    title = (title or "").strip()
    if "·" in title:
        a, b = title.split("·", 1)
        return a.strip(), b.strip()
    m = re.match(r"^([EF]\d+\w*)\s+(.+)$", title)
    if m:
        return m.group(1), m.group(2)
    m = re.match(r"^(Coil|Bobina|Inj|Iny|コイル|インジェ)\s*(\d+)\b(.*)$", title, re.I)
    if m:
        # keep the language's own word from I18N title_coil / title_inj (en Coil/Inj, es Bobina/Iny, ja コイル/インジェ)
        sep = "" if LANG == "ja" else " "
        return f"{m.group(1)}{sep}{m.group(2)}", (m.group(3) or "").strip()
    m = re.match(r"^(VTC|ETC|MAF|CKP|CMP|ECT|IAT|Knock|HO2S|A/F|SNS|F\d+|E\d+)\b(.*)$", title, re.I)
    if m:
        return m.group(1), (m.group(2) or "").strip(" ·")
    return title, ""


def draw_ficha_header(x, y, w, h, title, subtitle="", accent=None, qty=""):
    """Accent title band: big code + name — easy ID with loom in hand."""
    code, name = split_ficha_title(title)
    band_h = 16 if w >= 80 else 14
    if subtitle and w >= 100:
        band_h = 18
    accent = accent or HexColor("#90a4ae")
    try:
        r, g, b = accent.red, accent.green, accent.blue
    except Exception:
        r, g, b = 0.56, 0.64, 0.68
    tint = HexColor("#%02x%02x%02x" % (
        int(r * 255 * 0.25 + 255 * 0.75),
        int(g * 255 * 0.25 + 255 * 0.75),
        int(b * 255 * 0.25 + 255 * 0.75)))
    c.setFillColor(tint)
    c.rect(x + 1.0, y + h - band_h - 0.5, w - 2.0, band_h, fill=1, stroke=0)
    c.setFillColor(accent)
    c.rect(x + 1.0, y + h - band_h - 0.5, 3.0, band_h, fill=1, stroke=0)
    c.setFillColor(TITLE_BLACK)
    code_fs = min(9.0, max(6.0, w * 0.09))
    c.setFont(FONT_B, code_fs)
    c.drawString(x + 6.5, y + h - band_h + (band_h * 0.38 if not (name and subtitle and w >= 100) else band_h * 0.52), code[:12])
    c.setFillColor(MUTED)
    name_fs = min(5.2, max(3.6, w * 0.042))
    c.setFont(FONT, name_fs)
    if name and subtitle and w >= 100:
        c.drawString(x + 6.5, y + h - band_h + 2.8, name[:26])
        c.setFont(FONT, max(3.2, name_fs - 0.5))
        c.drawRightString(x + w - 3.5, y + h - band_h + 2.8, subtitle[:38])
    elif name:
        c.drawRightString(x + w - 3.5, y + h - band_h + (band_h * 0.38), name[:22])
    elif subtitle:
        c.drawRightString(x + w - 3.5, y + h - band_h + (band_h * 0.38), subtitle[:22])
    if qty:
        c.setFont(FONT_B, 4.2)
        c.setFillColor(accent)
        c.drawRightString(x + w - 3.5, y + h - 3.5, str(qty)[:8])
    c.setFillColor(black)
    return band_h


def ficha(x, y, w, h, title, pins, shape="tab2", accent=None, qty="", face=None, subtitle="", rail_5v=False, face_inv=None, cid=None):
    """
    Connector card: group-colored outline (web SUB_ACCENT). Optional amber outer ring for 5V.
    Wire color only on cavity stroke + codes. Invertida L/R on faces.
    """
    face = face or (shape if shape in ("af6", "rect6", "f2", "rect10", "e113", "f102", "smj_h", "f3", "f1") else None)
    # Connector cards are fixed plug faces as drawn in the 2005 FSM T.S. (same as the map fichas):
    # pins are passed in FSM face order and are NOT mirrored by FACE_INV (that stays for the ECM grid only).
    use_inv = bool(face_inv)
    def _row(labs):
        labs = list(labs)
        return list(reversed(labs)) if use_inv else labs
    def _pin_disp(p):
        """Normalize (id,code,note[,disp]) → (disp_lab, code, note) for draw_cavity.
        Applies web-style bottom labels for rails / SIG on 3-tuples too."""
        if len(p) >= 4:
            return (p[3], p[1], p[2])
        lab, code, note = p[0], p[1], p[2]
        lu = str(lab).upper()
        if lu in ("GND", "12V", "5V"):
            return (lu, code, note)
        if lu == "SIG":
            # note often holds ECM #
            if note and str(note).isdigit():
                return (str(note) + "S", code, note)
            return ("S", code, note)
        if lu in ("SH",) and note and str(note).isdigit():
            return ("GND", code, note)  # knock shield
        return (lab, code, note)
    by = {str(p[0]): p for p in pins}

    # ---- RING (E17 body ground / F152 body ground) ----
    if shape == "ring":
        card_shell(x, y, w, h, accent=accent or GRP["power"], rail_5v=rail_5v, radius=4)
        draw_ficha_header(x, y, w, h, title, subtitle or qty, accent or GRP["power"], qty)
        lab, col, note = _pin_disp(pins[0]) if pins else ("ring", "B", "")
        cx, cy, r = x + w / 2, y + h * 0.40, min(w, h) * 0.22
        c.setStrokeColor(SHELL)
        c.setLineWidth(1.8)
        c.setFillColor(white)
        c.circle(cx, cy, r + 6, fill=1, stroke=1)
        c.setStrokeColor(oc(col))
        c.setLineWidth(1.8)
        c.setFillColor(white)
        c.circle(cx, cy, r * 0.55, fill=1, stroke=1)
        c.setFillColor(lab_fill(lab))
        c.setFont(FONT_B, 5.5)
        c.drawCentredString(cx, cy - 1.5, str(lab)[:5])
        c.setFillColor(black)
        c.setFont(FONT, 4.5)
        c.drawCentredString(cx, y + 12, col)
        c.setFillColor(ECM_BLUE)
        c.setFont(FONT, 4.2)
        c.drawCentredString(cx, y + 5, ecm_label(note))
        return

    # ---- BOX (joint packs) ----
    if shape == "box":
        card_shell(x, y, w, h, accent=accent or GRP["sensors"], rail_5v=rail_5v, radius=3)
        c.setFillColor(TITLE_BLACK)
        c.setFont(FONT_B, 6.5)
        c.drawCentredString(x + w / 2, y + h - 12, title[:18])
        if subtitle:
            c.setFont(FONT, 4.0 if w >= 120 else 3.6)
            c.setFillColor(MUTED)
            c.drawCentredString(x + w / 2, y + h - 22, subtitle[:40 if w >= 120 else 28])
        ordered = _row(list(pins))
        n = max(1, len(ordered))
        cw = (w - 10) / n
        ch = h - 28
        for i, p in enumerate(ordered):
            lab, col, note = _pin_disp(p)
            draw_cavity(x + 5 + i * cw, y + 4, cw, ch, lab, col, note)
        return

    # ---- IXNOTE (unknown intermediate half) ----
    if shape == "ixnote":
        card_shell(x, y, w, h, accent=accent or GRP["intermedias"], rail_5v=rail_5v, radius=3)
        c.setFillColor(TITLE_BLACK)
        c.setFont(FONT_B, 5.8)
        c.drawCentredString(x + w / 2, y + h - 11, title[:20])
        c.setFillColor(ECM_BLUE)
        c.setFont(FONT_B, 4.6)
        # subtitle = plain-language job; fallback if empty
        job = (subtitle or t("ix_default")).strip()
        # wrap up to 2 lines
        line1 = job[:28]
        line2 = job[28:56] if len(job) > 28 else ""
        c.drawCentredString(x + w / 2, y + h * (0.48 if line2 else 0.40), line1)
        if line2:
            c.setFont(FONT, 4.0)
            c.setFillColor(MUTED)
            c.drawCentredString(x + w / 2, y + h * 0.28, line2)
        else:
            c.setFillColor(MUTED)
            c.setFont(FONT, 3.8)
            c.drawCentredString(x + w / 2, y + h * 0.18, t("ix_mate_pair"))
        return

    # Plain card shell — group outline (+ optional 5V amber ring)
    card_shell(x, y, w, h, accent=accent, rail_5v=rail_5v, radius=3.5)
    title_band = draw_ficha_header(x, y, w, h, title, subtitle, accent, qty)

    face_x = x + 3.5
    face_y = y + 2.5
    face_w = w - 7
    face_h = max(18, h - title_band - 3)

    # Fixed FSM T.S. plug face from CONN_BASE.faceRows (never mirrored by FACE_INV).
    rows = None
    if cid:
        _card = CONN_BASE.get(cid) or {}
        rows = _card.get("faceRows")
        if not rows:
            _vbt = _card.get("faceRowsByTrans") or {}
            rows = _vbt.get("mt") or _vbt.get("at")
    if rows:
        n_rows = len(rows)
        cols = max((len(row) for row in rows), default=1)
        cw, ch = cav_fit(face_w, face_h, max(cols, 1), max(n_rows, 1))
        ox = face_x + max(0, (face_w - cols * cw) / 2)
        oy = face_y + max(0, (face_h - n_rows * ch) / 2)
        for ri, row in enumerate(rows):
            for ci, key in enumerate(row):
                if key is None or key == "":
                    continue
                px = ox + ci * cw
                py = oy + (n_rows - 1 - ri) * ch
                if str(key) in by:
                    lab, col, note = _pin_disp(by[str(key)])
                    draw_cavity(px, py, cw, ch, lab, col, note, sm_lines=sm_pin_lines(cid, str(key)) if cid else [])
                else:
                    c.setFillColor(white)
                    c.setStrokeColor(HexColor("#E0E0E0"))
                    c.setLineWidth(0.5)
                    c.roundRect(px + 1, py + 1, cw - 2, ch - 2, 1.5, fill=1, stroke=1)
                    c.setFillColor(LIGHT_GRAY)
                    c.setFont(FONT, 4)
                    c.drawCentredString(px + cw / 2, py + ch / 2 - 1, str(key))
        return

    # Fixed FSM T.S. plug face. Not mirrored by FACE_INV.
    if face == "af6":
        rows = (CONN_BASE.get(cid) or {}).get("faceRows") if cid else None
        if not rows:
            raise SystemExit("print pack: %s has no faceRows" % cid)
        n_rows = len(rows)
        cols = max(len(row) for row in rows)
        cw, ch = cav_fit(face_w, face_h, cols, n_rows)
        ox = face_x + max(0, (face_w - cols * cw) / 2)
        oy = face_y + max(0, (face_h - n_rows * ch) / 2)
        for ri, row in enumerate(rows):
            for ci, key in enumerate(row):
                lab, col, note = _pin_disp(by[str(key)])
                draw_cavity(ox + ci * cw, oy + (n_rows - 1 - ri) * ch, cw, ch, lab, col, note, fs=4.0)
        return

    # ---- E113 APP FSM face (EC-523 T.S.): fixed top 3-2-1 / bot 6-5-4 ----
    if face == "e113" and all(k in by for k in ("1", "2", "3", "4", "5", "6")):
        order = [_row(["3", "2", "1"]), _row(["6", "5", "4"])]
        cw, ch = face_w / 3, face_h / 2
        for ri, row in enumerate(order):
            for ci, key in enumerate(row):
                lab, col, note = _pin_disp(by[key])
                draw_cavity(face_x + ci * cw, face_y + (1 - ri) * ch, cw, ch, lab, col, note)
        return

    # ---- F2 / E11 10-pin: always FSM H.S. top 1-5 / bot 6-10 (NO Invertida — intermedias)
    # pins listed in cavity order 1..10; first field = DISPLAY label (may be 5V/GND)
    if face == "f2" or shape == "rect10":
        by_num = {str(i + 1): pins[i] for i in range(min(10, len(pins)))}
        order = [["1", "2", "3", "4", "5"], ["6", "7", "8", "9", "10"]]
        cw, ch = face_w / 5, face_h / 2
        for ri, row in enumerate(order):
            for ci, num in enumerate(row):
                if num not in by_num:
                    continue
                lab, col, note = _pin_disp(by_num[num])
                draw_cavity(face_x + ci * cw, face_y + (1 - ri) * ch, cw, ch, lab, col, note, fs=3.4, sm_lines=sm_pin_lines(cid, num) if cid else [])
        return

    # ---- RECT6 (ETC F31, EC-235/464 T.S.): fixed top 3-2-1 / bot 6-5-4, same as the map ----
    if face == "rect6" and len(pins) >= 6:
        if all(k in by for k in ("1", "2", "3", "4", "5", "6")):
            top = [by[k] for k in ("3", "2", "1")]
            bot = [by[k] for k in ("6", "5", "4")]
        else:
            top = _row(pins[:3])
            bot = _row(pins[3:6])
        cw, ch = cav_fit(face_w, face_h, 3, 2)
        ox = face_x + max(0, (face_w - 3 * cw) / 2)
        oy = face_y + max(0, (face_h - 2 * ch) / 2)
        for ci, p in enumerate(top):
            lab, col, note = _pin_disp(p)
            draw_cavity(ox + ci * cw, oy + ch, cw, ch, lab, col, note, fs=4.0)
        for ci, p in enumerate(bot):
            lab, col, note = _pin_disp(p)
            draw_cavity(ox + ci * cw, oy, cw, ch, lab, col, note, fs=4.0)
        return

    # ---- F3 (mapa svgF3): top 1-2-3-4 / bot 5-6-7-8 · fixed cavity size ----
    if face == "f3" or shape == "f3":
        ids_ok = all(str(i) in by for i in range(1, 9))
        if ids_ok:
            # Fixed pin size (same-ish as other fichas); center grid in card
            cw, ch = cav_fit(face_w, face_h, 4, 2)
            grid_w, grid_h = 4 * cw, 2 * ch
            ox = face_x + max(0, (face_w - grid_w) / 2)
            oy = face_y + max(0, (face_h - grid_h) / 2)
            top, bot = ["1", "2", "3", "4"], ["5", "6", "7", "8"]
            if use_inv:
                top, bot = list(reversed(top)), list(reversed(bot))
            for ci, pid in enumerate(top):
                lab, col, note = _pin_disp(by[pid])
                draw_cavity(ox + ci * cw, oy + ch, cw, ch, lab, col, note, fs=4.2, sm_lines=sm_pin_lines(cid, pid) if cid else [])
            for ci, pid in enumerate(bot):
                lab, col, note = _pin_disp(by[pid])
                draw_cavity(ox + ci * cw, oy, cw, ch, lab, col, note, fs=4.2, sm_lines=sm_pin_lines(cid, pid) if cid else [])
            return

    # ---- F1 (mapa svgF1): pin1 left mid · top 2-3-4-5 · bot 6-7-8-9 · fixed cavity ----
    if face == "f1" or shape == "f1":
        ids_ok = all(str(i) in by for i in range(1, 10))
        if ids_ok:
            cw, ch = cav_fit(face_w, face_h, 5.2, 2)
            # layout width: 1 + gap + 4
            grid_w = cw + 4 * cw + cw * 0.15
            grid_h = 2 * ch
            ox = face_x + max(0, (face_w - grid_w) / 2)
            oy = face_y + max(0, (face_h - grid_h) / 2)
            top, bot = ["2", "3", "4", "5"], ["6", "7", "8", "9"]
            if use_inv:
                top, bot = list(reversed(top)), list(reversed(bot))
            # pin 1 left, vertically centered between rows
            lab, col, note = _pin_disp(by["1"])
            draw_cavity(ox, oy + ch * 0.5, cw, ch, lab, col, note, fs=4.0, sm_lines=sm_pin_lines(cid, "1") if cid else [])
            gx = ox + cw + cw * 0.15
            for ci, pid in enumerate(top):
                lab, col, note = _pin_disp(by[pid])
                draw_cavity(gx + ci * cw, oy + ch, cw, ch, lab, col, note, fs=4.0, sm_lines=sm_pin_lines(cid, pid) if cid else [])
            for ci, pid in enumerate(bot):
                lab, col, note = _pin_disp(by[pid])
                draw_cavity(gx + ci * cw, oy, cw, ch, lab, col, note, fs=4.0, sm_lines=sm_pin_lines(cid, pid) if cid else [])
            return

    # ---- RECT4 · Invertida ----
    if shape == "rect4":
        n = min(4, len(pins))
        ordered = _row(pins[:n])
        # fixed-ish pin size, center in card
        cw, ch = cav_fit(face_w, face_h, n, 1)
        ox = face_x + max(0, (face_w - n * cw) / 2)
        oy = face_y + max(0, (face_h - ch) / 2)
        for i, p in enumerate(ordered):
            lab, col, note = _pin_disp(p)
            draw_cavity(ox + i * cw, oy, cw, ch, lab, col, note, fs=4.0, sm_lines=sm_pin_lines(cid, str(p[0])) if cid else [])
        return


    # ---- E108 / B1 SMJ · PG-84 T.S. band layout (same order as the map svgE108 / svgB1) ----
    if face in ("e108", "b1") or shape in ("e108", "b1"):
        suffix = "G" if (face == "e108" or shape == "e108") else "J"
        bands = [
            {"rows": [[f"1{suffix}", f"2{suffix}", f"3{suffix}", f"4{suffix}", f"5{suffix}"],
                      [f"6{suffix}", f"7{suffix}", f"8{suffix}", f"9{suffix}", f"10{suffix}"]]},
            {"stub": [f"11{suffix}", f"27{suffix}"], "label": f"11{suffix}–27{suffix}"},
            {"rows": [[f"28{suffix}", f"29{suffix}", f"30{suffix}", f"31{suffix}", f"32{suffix}"],
                      [f"33{suffix}", f"34{suffix}", f"35{suffix}", f"36{suffix}", f"37{suffix}"],
                      [f"38{suffix}", f"39{suffix}", f"40{suffix}", f"41{suffix}", f"42{suffix}"],
                      [f"43{suffix}", f"44{suffix}"]]},
            {"stub": [f"45{suffix}", f"64{suffix}"], "label": f"45{suffix}–64{suffix}"},
            {"rows": [[f"65{suffix}", f"66{suffix}", f"67{suffix}", f"68{suffix}", f"69{suffix}"]]},
        ]
        def _smj_num(pid):
            m = re.match(r"(\d+)", str(pid))
            return int(m.group(1)) if m else -1
        def _wired(a, b):
            lo, hi = _smj_num(a), _smj_num(b)
            out = []
            for p in pins:
                pid = str(p[0])
                n = _smj_num(pid)
                if lo <= n <= hi and pid in by:
                    out.append(pid)
            out.sort(key=_smj_num)
            return out
        max_cols = 5
        # Count visual rows (stubs + wired wrap + named rows) to size cavities uniformly.
        vis = 0
        for band in bands:
            if band.get("stub"):
                vis += 1  # stub bar
                wired = _wired(band["stub"][0], band["stub"][1])
                vis += (len(wired) + max_cols - 1) // max_cols if wired else 0
            else:
                vis += len(band["rows"])
        # stub bars are shorter than cavities
        stub_frac = 0.45
        n_stubs = sum(1 for b in bands if b.get("stub"))
        unit_rows = (vis - n_stubs) + n_stubs * stub_frac
        ch = min(CAV_STD_H, face_h / max(unit_rows, 1))
        cw = min(CAV_STD_W, face_w / max_cols)
        # keep uniform within the face
        grid_w = max_cols * cw
        ox = face_x + max(0, (face_w - grid_w) / 2)
        y_cursor = face_y + face_h
        def _row_ids(ids, yb):
            row_w = len(ids) * cw
            x0 = ox + max(0, (grid_w - row_w) / 2)
            for ci, pid in enumerate(ids):
                px, py = x0 + ci * cw, yb
                if pid in by:
                    dlab, col, note = _pin_disp(by[pid])
                    draw_cavity(px, py, cw, ch, dlab, col, note, fs=max(2.8, min(4.2, cw * 0.28)),
                                sm_lines=sm_pin_lines(cid, pid) if cid else [])
                else:
                    c.setFillColor(white)
                    c.setStrokeColor(HexColor("#E0E0E0"))
                    c.setLineWidth(0.4)
                    c.roundRect(px + 0.6, py + 0.6, cw - 1.2, ch - 1.2, 0.8, fill=1, stroke=1)
                    c.setFillColor(LIGHT_GRAY)
                    c.setFont(FONT, max(2.6, min(3.6, cw * 0.22)))
                    c.drawCentredString(px + cw / 2, py + ch / 2 - 1, pid)
        for band in bands:
            if band.get("stub"):
                y_cursor -= ch * stub_frac
                c.setFillColor(HexColor("#F5F7FA"))
                c.setStrokeColor(HexColor("#78909C"))
                c.setLineWidth(0.6)
                c.setDash(2, 1.5)
                c.roundRect(ox, y_cursor + 1, grid_w, ch * stub_frac - 2, 2, fill=1, stroke=1)
                c.setDash()
                c.setFillColor(HexColor("#607D8B"))
                c.setFont(FONT_B, max(4.0, min(6.0, ch * stub_frac * 0.7)))
                c.drawCentredString(ox + grid_w / 2, y_cursor + (ch * stub_frac) / 2 - 2, band["label"])
                wired = _wired(band["stub"][0], band["stub"][1])
                for i in range(0, len(wired), max_cols):
                    y_cursor -= ch
                    _row_ids(wired[i:i + max_cols], y_cursor)
            else:
                for row in band["rows"]:
                    y_cursor -= ch
                    _row_ids(row, y_cursor)
        return

    # ---- F102 SMJ · PG-85 T.S. (ENGINE CONTROL HARNESS, white, female) · fixed ----
    # L 1–10 · M 11–29 as grids; R 30H–46H = one tall empty stub (like web).
    if face in ("f102", "smj_h") or shape in ("f102", "smj_h"):
        blocks = [
            (["1H", "2H", "3H", "4H", "5H"], ["6H", "7H", "8H", "9H", "10H"]),
            (["11H", "12H", "13H", "14H", "15H", "16H", "17H", "18H", "19H", "20H"],
             ["21H", "22H", "23H", "24H", "25H", "26H", "27H", "28H", "29H"]),
        ]
        verified = {str(p[0]): p for p in pins}
        stub_cols = 1.15  # compact R stub width in cavity units (web ~18px)
        lm_cols = sum(max(len(top), len(bot)) for top, bot in blocks)
        n_gaps = len(blocks)  # L|M + M|R
        gap_frac = 0.35
        unit = face_w / (lm_cols + stub_cols + n_gaps * gap_frac)
        cw = unit
        ch = face_h / 2
        bx = face_x
        for bi, (top, bot) in enumerate(blocks):
            cols = max(len(top), len(bot))
            for ci, lab in enumerate(top):
                px = bx + ci * cw
                py = face_y + ch
                if lab in verified:
                    dlab, col, note = _pin_disp(verified[lab])
                    draw_cavity(px, py, cw, ch, dlab if dlab != lab else lab, col, note, fs=max(2.8, min(4.2, cw * 0.28)), sm_lines=sm_pin_lines(cid, lab) if cid else [])
                else:
                    c.setFillColor(white)
                    c.setStrokeColor(HexColor("#E0E0E0"))
                    c.setLineWidth(0.4)
                    c.roundRect(px + 0.6, py + 0.6, cw - 1.2, ch - 1.2, 0.8, fill=1, stroke=1)
                    c.setFillColor(LIGHT_GRAY)
                    c.setFont(FONT, max(2.6, min(3.6, cw * 0.22)))
                    c.drawCentredString(px + cw / 2, py + ch * 0.55, lab)
                    c.setFillColor(HexColor("#BDBDBD"))
                    c.circle(px + cw / 2, py + ch * 0.28, max(0.6, min(1.2, cw * 0.08)), fill=1, stroke=0)
            for ci, lab in enumerate(bot):
                px = bx + ci * cw
                py = face_y
                if lab in verified:
                    dlab, col, note = _pin_disp(verified[lab])
                    draw_cavity(px, py, cw, ch, dlab if dlab != lab else lab, col, note, fs=max(2.8, min(4.2, cw * 0.28)), sm_lines=sm_pin_lines(cid, lab) if cid else [])
                else:
                    c.setFillColor(white)
                    c.setStrokeColor(HexColor("#E0E0E0"))
                    c.setLineWidth(0.4)
                    c.roundRect(px + 0.6, py + 0.6, cw - 1.2, ch - 1.2, 0.8, fill=1, stroke=1)
                    c.setFillColor(LIGHT_GRAY)
                    c.setFont(FONT, max(2.6, min(3.6, cw * 0.22)))
                    c.drawCentredString(px + cw / 2, py + ch * 0.55, lab)
                    c.setFillColor(HexColor("#BDBDBD"))
                    c.circle(px + cw / 2, py + ch * 0.28, max(0.6, min(1.2, cw * 0.08)), fill=1, stroke=0)
            # separator after L and after M
            sx = bx + cols * cw + unit * gap_frac * 0.5
            c.setStrokeColor(HexColor("#90A4AE"))
            c.setLineWidth(0.7)
            c.line(sx, face_y + 1, sx, face_y + face_h - 1)
            bx += cols * cw + unit * gap_frac
        # R stub: one tall empty cavity 30H / — / 46H
        stub_w = stub_cols * unit
        c.setFillColor(HexColor("#F5F7FA"))
        c.setStrokeColor(HexColor("#78909C"))
        c.setLineWidth(1.0)
        c.setDash(2, 1.5)
        c.roundRect(bx + 0.4, face_y + 0.4, stub_w - 0.8, face_h - 0.8, 2.0, fill=1, stroke=1)
        c.setDash()
        c.setFillColor(HexColor("#607D8B"))
        c.setFont(FONT_B, max(3.2, min(5.0, stub_w * 0.45)))
        c.drawCentredString(bx + stub_w / 2, face_y + face_h - 8, "30H")
        c.setFont(FONT_B, max(5.0, min(8.0, stub_w * 0.7)))
        c.drawCentredString(bx + stub_w / 2, face_y + face_h / 2 - 2, "—")
        c.setFont(FONT_B, max(3.2, min(5.0, stub_w * 0.45)))
        c.drawCentredString(bx + stub_w / 2, face_y + 3.5, "46H")
        c.setFillColor(MUTED)
        c.setFont(FONT, 3.2)
        c.drawString(face_x + 1, face_y + face_h - 3.2, t("f102_stub"))
        c.setFillColor(black)
        return

    # ---- IPDM / TAB2 / TAB3 / default row · Invertida · fixed-ish pin size ----
    n = len(pins)
    if n == 0:
        return
    ordered = _row(pins)
    cols = len(ordered)
    cw, ch = cav_fit(face_w, face_h, cols, 1)
    ox = face_x + max(0, (face_w - cols * cw) / 2)
    oy = face_y + max(0, (face_h - ch) / 2)
    for i, pin in enumerate(ordered):
        lab, col, note = _pin_disp(pin)
        draw_cavity(ox + i * cw, oy, cw, ch, lab, col, note,
                    fs=4.0 if shape == "ipdm" else 4.0,
                    sm_lines=sm_pin_lines(cid, str(pin[0])) if cid else [])


def section_label(x, y, w, text):
    """Path / group banner — titles black."""
    c.setFillColor(PATH_BG)
    c.setStrokeColor(SHELL)
    c.setLineWidth(0.9)
    c.roundRect(x, y - 1, w, 12, 2, fill=1, stroke=1)
    c.setFillColor(TITLE_BLACK)
    c.setFont(FONT_B, 6.3)
    c.drawString(x + 5, y + 2.2, text)
    c.setFillColor(black)


def path_frame(x, y, w, h):
    """Light dashed outer frame around a path group."""
    c.setStrokeColor(HexColor("#757575"))
    c.setLineWidth(0.65)
    c.setDash(1.4, 1.1)
    c.roundRect(x - 1.2, y - 1.2, w + 2.4, h + 2.4, 2.5, fill=0, stroke=1)
    c.setDash()


def draw_mate_pair(x, y, w, h, left, right, gap=2.5):
    """Mating pair side-by-side; each face uses Invertida via ficha()."""
    half_w = (w - gap) / 2
    c.setStrokeColor(HexColor("#616161"))
    c.setLineWidth(0.65)
    c.setDash(1.2, 1.0)
    c.roundRect(x - 1.0, y - 1.0, w + 2.0, h + 2.0, 2.5, fill=0, stroke=1)
    c.setDash()
    ficha(x, y, half_w, h, left["title"], left.get("pins", []),
          left.get("shape", "ixnote"), face=left.get("face"),
          subtitle=left.get("subtitle", ""), qty=left.get("qty", ""),
          accent=left.get("accent"), rail_5v=left.get("rail_5v", False),
          face_inv=left.get("face_inv"))
    ficha(x + half_w + gap, y, half_w, h, right["title"], right.get("pins", []),
          right.get("shape", "ixnote"), face=right.get("face"),
          subtitle=right.get("subtitle", ""), qty=right.get("qty", ""),
          accent=right.get("accent"), rail_5v=right.get("rail_5v", False),
          face_inv=right.get("face_inv"))
    c.setFillColor(HexColor("#424242"))
    c.setFont(FONT_B, 6)
    c.drawCentredString(x + half_w + gap / 2, y + h / 2 - 2, "⟷")


def ecm_chip_row(x, y, w, h, pins_codes):
    """Compact ECM destination chips inside a path group."""
    c.setFillColor(white)
    c.setStrokeColor(SHELL)
    c.setLineWidth(1.2)
    c.roundRect(x, y, w, h, 3, fill=1, stroke=1)
    c.setFillColor(TITLE_BLACK)
    c.setFont(FONT_B, 5.5)
    c.drawCentredString(x + w / 2, y + h - 10, "→ ECM")
    n = max(1, len(pins_codes))
    cw = (w - 8) / n
    ch = h - 16
    for i, (pin, code) in enumerate(pins_codes):
        px = x + 4 + i * cw
        py = y + 3
        stroke = oc(code) if code else LIGHT_GRAY
        c.setFillColor(white)
        c.setStrokeColor(stroke)
        c.setLineWidth(1.4)
        c.roundRect(px + 0.8, py + 0.8, cw - 1.6, ch - 1.6, 1.5, fill=1, stroke=1)
        c.setFillColor(black)
        c.setFont(FONT_B, max(4.0, min(6.5, ch * 0.35)))
        c.drawCentredString(px + cw / 2, py + ch * 0.52, str(pin))
        c.setFont(FONT, max(3.0, min(4.5, ch * 0.22)))
        c.setFillColor(MUTED)
        c.drawCentredString(px + cw / 2, py + 2.5, str(code)[:6])




# ---- Live CONN pins from interactive map HTML (source of truth) ----
def _find_map_html():
    """Primary HTML candidates for CONN connector objects."""
    candidates = [
        os.path.join(_ROOT, "350Z_harness_interactive.html"),
        os.path.join(_ROOT, "index.html"),
        "/workspace/350Z_harness_interactive.html",
        "/workspace/350z-harness-pages/index.html",
    ]
    for p in candidates:
        if os.path.isfile(p):
            return p
    return None


def _brace_block(text, start_brace):
    """Return slice of balanced {...} starting at start_brace index."""
    depth = 0
    i = start_brace
    n = len(text)
    while i < n:
        ch = text[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start_brace:i + 1]
        i += 1
    return ""


_VIF_DEFAULT = {"trans": "mt", "body": "coupe", "market": "usa", "brake": "abs", "audio": "base",
                "nav": "no", "pseat": "no", "hseat": "no"}


def _vif_default(expr):
    """Web vifMatch() against the default car (M/T Coupe, USA, ABS, base audio, no options)."""
    for group in str(expr).split("|"):
        good = True
        for term in group.split("&"):
            if "=" not in term:
                continue
            k, vals = term.split("=", 1)
            if _VIF_DEFAULT.get(k.strip()) not in [v.strip() for v in vals.split(",")]:
                good = False
                break
        if good:
            return True
    return False


def extract_conn(conn_id, html=None):
    """Parse CONN[conn_id] from map HTML → (pins, subtitle).

    pins: list of (id, code, note, disp_lab) for ficha() / draw_mate_pair().
      id   = pin.id (cavity key for face grids)
      code = pin.code or '—'
      note = ecm as str, else src, else 'nc'
      disp_lab = pin.lab or id (bottom line on cavity)
    Does not invent pins; empty cavities keep code '—'.
    """
    if html is None:
        html = _MAP_HTML
    if not html:
        return [], ""
    m = re.search(rf"(?:^|,|\{{)\s*{re.escape(conn_id)}\s*:\s*\{{", html)
    if not m:
        return [], ""
    block = _brace_block(html, m.end() - 1)
    if not block:
        return [], ""

    meta_m = re.search(r"meta\s*:\s*'([^']*)'", block)
    name_m = re.search(r"name\s*:\s*'([^']*)'", block)
    subtitle = ""
    if meta_m:
        parts = [p.strip() for p in meta_m.group(1).split("·")]
        subtitle = " · ".join(parts[:3])[:42]
    elif name_m:
        subtitle = name_m.group(1)[:42]

    pins_m = re.search(r"pins\s*:\s*\[(.*?)\]", block, re.DOTALL)
    if not pins_m:
        return [], subtitle

    def _field(obj, key):
        mm = re.search(rf"{key}\s*:\s*'([^']*)'", obj)
        if mm:
            return mm.group(1)
        mm = re.search(rf"{key}\s*:\s*(\d+|null)", obj)
        if mm:
            return mm.group(1)
        return None

    pins = []
    for pm in re.finditer(r"\{([^{}]+)\}", pins_m.group(1)):
        obj = pm.group(1)
        pid = _field(obj, "id")
        raw_lab = _field(obj, "lab")
        lab = raw_lab or pid or "?"
        code = _field(obj, "code")
        if code is None:
            code = "—"
        ecm = _field(obj, "ecm")
        src = _field(obj, "src")
        src_if = _field(obj, "srcIf")
        if src and src_if and not _vif_default(src_if):
            # web srcIf: destination named only for that equipment (e.g. E12/F3·1 → F6 on A/T); pack = default car
            src = None
        rail = _field(obj, "rail")
        trans = _field(obj, "trans")
        vif = _field(obj, "vif")
        gated_off = (trans and trans != _VIF_DEFAULT.get("trans")) or (vif and not _vif_default(vif))
        if gated_off:
            # Default-car pack: optional / other-transmission cavities are empty (no colour, no ECM, no label).
            pins.append((str(pid or lab), "—", "nc", str(pid or lab)))
            continue
        if ecm and ecm != "null":
            note = str(ecm)
        elif src:
            note = src
        else:
            note = "nc"
        # Bottom line matches web cavBottomLabel
        lab_u = str(lab).upper()
        id_u = str(pid or "").upper()
        if rail == "gnd":
            disp = "GND"
        elif rail == "12v":
            disp = "12V"
        elif rail == "5v":
            disp = "5V"
        elif lab_u == "SIG" or id_u == "SIG" or (
            ecm and ecm != "null" and (not raw_lab or id_u == "ECM")
        ):
            if ecm and ecm != "null":
                disp = "SIG"
            elif pid and id_u not in ("SIG", "ECM"):
                disp = str(pid) + "S"
            else:
                disp = "SIG"
        else:
            disp = str(lab)
        pins.append((str(pid or lab), code, note, disp))
    return pins, subtitle


def _extract_js_object(html, name):
    m = re.search(rf"const {name} = (\{{.*?\}});", html, re.DOTALL)
    if not m:
        return {}
    raw = m.group(1)
    # JS object → JSON-ish: quote keys, keep string values
    raw = re.sub(r"([\{\,]\s*)(\d+)\s*:", r'\1"\2":', raw)
    raw = raw.replace("'", '"')
    try:
        return json.loads(raw)
    except Exception:
        out = {}
        for km in re.finditer(r"(\d+)\s*:\s*'([^']*)'", raw):
            out[km.group(1)] = km.group(2)
        for km in re.finditer(r'(\d+)\s*:\s*"([^"]*)"', raw):
            out[km.group(1)] = km.group(2)
        return out


_MAP_PATH = _find_map_html()
_MAP_HTML = ""
if _MAP_PATH:
    with open(_MAP_PATH, encoding="utf-8", errors="replace") as _mf:
        _MAP_HTML = _mf.read()
    print("CONN source:", _MAP_PATH)
    _pc = _extract_js_object(_MAP_HTML, "PIN_COL")
    _pr = _extract_js_object(_MAP_HTML, "PIN_RAIL")
    _pcan = _extract_js_object(_MAP_HTML, "PIN_CAN")
    if _pc:
        PIN_COL = {int(k): v for k, v in _pc.items()}
        print("PIN_COL from map:", len(PIN_COL))
    if _pr:
        PIN_RAIL = {int(k): v for k, v in _pr.items()}
        print("PIN_RAIL from map:", len(PIN_RAIL))
    if _pcan:
        PIN_CAN = {int(k): v for k, v in _pcan.items()}
        print("PIN_CAN from map:", PIN_CAN)

if not PIN_COL:
    _PIN_JSON = os.path.join(_ROOT, "pin_colors.json")
    if not os.path.exists(_PIN_JSON):
        _PIN_JSON = "/workspace/pin_colors.json"
    PIN_COL = {int(k): v for k, v in json.load(open(_PIN_JSON)).items()}
    print("PIN_COL fallback json:", len(PIN_COL))

# Pin data from map (motor loom intermediates)
E12_F3_PINS, E12_F3_SUB = extract_conn("ix_e12_f3")
E10_F1_PINS, E10_F1_SUB = extract_conn("ix_e10_f1")
KNOCK_PINS, _KNOCK_SUB = extract_conn("ix_f14_f229")
ETC_PINS, ETC_SUB = extract_conn("etc")
if not KNOCK_PINS:
    KNOCK_PINS = [("SIG", "W", "15"), ("GND", "B", "116")]
# F14 face as drawn in EC-317 T.S.: 1-2 (map ix_f14_f229 faceRows). F229 is not drawn in the FSM: kept as before.
# EC-317 F14: cavity 1 = B shield (GND), cavity 2 = W signal (SIG) -> left 1, right 2.
KNOCK_PINS_F14 = sorted(KNOCK_PINS, key=lambda p: 0 if p[0] == "GND" else 1)
if not E12_F3_SUB:
    E12_F3_SUB = "8-pin GY · VB 119/120 · IGN"
if not E10_F1_SUB:
    E10_F1_SUB = "9-pin GY · START · REV Y/R"
if not ETC_PINS or len(ETC_PINS) < 6:
    # FSM F31 (EC-238/304/468): 1 5V→47 · 2 T2→69 · 3 M-→4 · 4 T1→50 · 5 GND→66 · 6 M+→5
    ETC_PINS = [
        ("1", "W/R", "47", "1"),
        ("2", "Y", "69", "2"),
        ("3", "L/B", "4", "3"),
        ("4", "G", "50", "4"),
        ("5", "L", "66", "5"),
        ("6", "L/Y", "5", "6"),
    ]
else:
    # Print face: cavity 1–6 on the bottom (FSM F31), ECM# on top, color in the middle.
    ETC_PINS = [(p[0], p[1], p[2], p[0]) for p in ETC_PINS]
if not ETC_SUB:
    ETC_SUB = t("sub_etc")


# ========== PAGINATED PACK: ECM + values + every ficha ==========
FOOT_Y = 8
ML, MR = 10, 10
BOTTOM = 14
USABLE_W = W - ML - MR
GAP = 5.0
PAGE_NO = 0
PAGE_INDEX = []
DRAWN = []
OMITTED = []
_current_title = ""
_current_cids = []

def _footer_draw():
    if not PAGE_NO:
        return
    c.setFont(FONT, 4.8)
    c.setFillColor(MUTED)
    key = "page1_footer" if PAGE_NO == 1 else "pack_footer"
    txt = t(key, n=PAGE_NO, orient=FACE_ORIENT_LABEL[:36])
    c.drawString(10, 4, txt)
    c.setFillColor(black)
    PAGE_INDEX.append({"n": PAGE_NO, "title": _current_title, "cids": list(_current_cids)})

def new_page(title=""):
    global PAGE_NO, _current_title, _current_cids
    _footer_draw()
    if PAGE_NO:
        c.showPage()
    PAGE_NO += 1
    _current_title = title
    _current_cids = []
    return H - 16


def skip_reason(cid):
    if cid.startswith("feed_") or cid.startswith("ipdm_") or cid.startswith("fuse_") or cid.startswith("jb_fuse"):
        return "IPDM / fuse box / feed card omitted (complex face; no SM pin values on a printable T.S. face, or values already shown elsewhere)"
    if cid in ("ecm_power", "ipdm_legend"):
        return "summary/legend card; ECM terminal values are on the ECM values pages"
    if cid == "ix_f103_f151":
        return "ixnote joint callout with no cavity face"
    return None


# gnd4 / F103 face (EC-169): cavities 1-4 from CONN_BASE, never A/B/C/D.
# Wired example: ("4", "B/R", "116") on F103·4 → ECM 116 → F152.
def pins_from_base(cid):
    card = CONN_BASE.get(cid) or {}
    pins = list(card.get("pins") or [])
    out = []
    for p in pins:
        pid = str(p.get("id") or "")
        if not pid:
            continue
        trans = p.get("trans")
        vif = p.get("vif") or ""
        # Default-car pack (M/T Coupe USA ABS base): gated-off pins are empty cavities.
        if (trans and trans != _VIF_DEFAULT.get("trans")) or (vif and not _vif_default(vif)):
            out.append((pid, "—", "nc", pid))
            continue
        code = p.get("code") or "—"
        note = p.get("ecm")
        if note is None:
            note = p.get("src") or ""
        lab = p.get("lab") or pid
        out.append((pid, code, note, lab))
    return out


def card_title(cid):
    m = re.match(r"^(coil|inj)(\d)$", cid)
    if m:
        key = "title_coil" if m.group(1) == "coil" else "title_inj"
        return t(key, n=int(m.group(2)))
    return conn_field(cid, "name") or cid


def card_sub(cid):
    meta = conn_field(cid, "meta")
    if meta:
        return meta
    card = CONN_BASE.get(cid) or {}
    vif = card.get("vif") or ""
    return vif


def accent_for(cid):
    card = CONN_BASE.get(cid) or {}
    sub = card.get("sub") or ""
    group = card.get("group") or ""
    if sub in GRP:
        return GRP[sub]
    if group == "body" and sub == "pedals":
        return GRP["pedals"]
    if "intermedia" in sub:
        return GRP["intermedias"]
    if sub in ("bobinas", "inyectores", "actuators"):
        return GRP["actuators"]
    if sub == "sensors":
        return GRP["sensors"]
    if sub == "power":
        return GRP["power"]
    if sub in ("ascd_dlc", "ascd", "dlc"):
        return GRP["ascd"]
    return GRP.get("intermedias", SHELL)


def face_geometry(cid):
    card = CONN_BASE.get(cid) or {}
    shape = card.get("shape") or ""
    face = card.get("face") or shape
    pins = pins_from_base(cid)
    rows = card.get("faceRows")
    if not rows:
        vbt = card.get("faceRowsByTrans") or {}
        rows = vbt.get("mt") or vbt.get("at")
    if rows:
        nr = len(rows)
        nc = max((len(r) for r in rows), default=1)
        return nr, nc, shape, face
    if shape == "f102":
        return 2, 16, shape, face
    if shape in ("e108", "b1"):
        return 12, 5, shape, face
    if shape == "f3":
        return 2, 4, shape, face
    if shape == "f1":
        return 2, 5, shape, face
    if shape in ("rect10", "f2"):
        return 2, 5, shape, face
    if shape in ("rect6", "e113", "af6"):
        return 2, 3, shape, face
    if shape == "ring":
        return 1, 1, shape, face
    if shape == "rect4":
        return 1, min(4, max(1, len(pins))), shape, face
    n = max(1, len(pins))
    return 1, n, shape, face


def pin_table_entries(cid):
    entries = []
    for p in pins_from_base(cid):
        pid = str(p[0])
        code = str(p[1] or "")
        if code in ("—", "-", "nc", "NC", ""):
            continue
        lines = sm_pin_lines(cid, pid)
        if not lines:
            continue
        texts, src = [], ""
        for item in lines:
            if isinstance(item, dict):
                tx = item.get("text") or ""
                if item.get("src") and not src:
                    src = item.get("src")
            else:
                tx = str(item)
            if tx:
                texts.append(pdf_safe(tx))
        if texts:
            entries.append((pid, " · ".join(texts), src))
    return entries


def estimate_table_h(cid, card_w):
    entries = pin_table_entries(cid)
    if not entries:
        return 0
    # 11 header + ~9–11 per row (long values may wrap once)
    h = 11
    val_w = max(40, card_w - 70)
    for _pid, text, _src in entries:
        lines = max(1, len(wrap_to_width(text, FONT, 5.2, val_w, max_lines=6)))
        h += 4 + lines * 6.2
    return h


def estimate_face_h(cid, card_w):
    nr, nc, shape, face = face_geometry(cid)
    if shape == "ring":
        return 56
    if shape == "f102":
        return 118
    if shape in ("e108", "b1"):
        return min(340, 20 + nr * min(CAV_STD_H, 28))
    return 8 + nr * CAV_STD_H


def estimate_card_h(cid, card_w):
    header = 16
    face_h = estimate_face_h(cid, card_w)
    table_h = estimate_table_h(cid, card_w)
    return header + face_h + table_h + 6


def card_cols(cid):
    nr, nc, shape, face = face_geometry(cid)
    ntab = len(pin_table_entries(cid))
    if shape in ("f102", "e108", "b1") or nc >= 8 or ntab >= 8:
        return 1
    if nc >= 5 or ntab >= 4 or (nr >= 2 and nc >= 3) or shape in ("f1", "f3", "rect10", "f2", "rect6", "e113", "af6"):
        return 2
    return 3


def draw_sm_table(x, y, w, entries):
    """Draw value table downward from y (top). Returns height used."""
    if not entries:
        return 0
    header_h = 10
    c.setFillColor(HexColor("#FFF8E1"))
    c.rect(x, y - header_h, w, header_h, fill=1, stroke=0)
    c.setFillColor(HexColor("#5D4037"))
    c.setFont(FONT_B, 5.4)
    c.drawString(x + 3, y - 7.5, t("sm_col_pin"))
    c.drawString(x + 36, y - 7.5, t("sm_col_val"))
    c.drawRightString(x + w - 3, y - 7.5, t("sm_col_src"))
    yy = y - header_h
    pin_w, src_w = 32, 36
    val_w = w - pin_w - src_w - 8
    for i, (pid, text, src) in enumerate(entries):
        lines = wrap_to_width(text, FONT, 5.2, val_w, max_lines=6) or [text]
        rh = 4 + len(lines) * 6.2
        if i % 2 == 0:
            c.setFillColor(HexColor("#FAFAFA"))
            c.rect(x, yy - rh, w, rh, fill=1, stroke=0)
        c.setFillColor(TITLE_BLACK)
        c.setFont(FONT_B, 5.4)
        c.drawString(x + 3, yy - 8, str(pid))
        c.setFont(FONT, 5.2)
        c.setFillColor(HexColor("#212121"))
        for li, ln in enumerate(lines):
            c.drawString(x + 36, yy - 8 - li * 6.2, ln)
        if src:
            c.setFillColor(MUTED)
            c.setFont(FONT, 4.8)
            c.drawRightString(x + w - 3, yy - 8, str(src)[:12])
        c.setStrokeColor(HexColor("#EEEEEE"))
        c.setLineWidth(0.3)
        c.line(x, yy - rh, x + w, yy - rh)
        yy -= rh
    return y - yy


def draw_card(x, y, w, h, cid):
    """Draw ficha face + SM value table in the box (x,y,w,h), y = bottom."""
    card = CONN_BASE.get(cid) or {}
    shape = card.get("shape") or "tab2"
    face = card.get("face") or (shape if shape in ("af6", "rect6", "f2", "rect10", "e113", "f102", "smj_h", "f3", "f1", "e108", "b1") else None)
    title = card_title(cid)
    sub = card_sub(cid)
    pins = pins_from_base(cid)
    entries = pin_table_entries(cid)
    table_h = estimate_table_h(cid, w - 6)
    # If the estimated table would overflow, shrink the face.
    header = 16
    max_table = max(0, h - header - 40)
    if table_h > max_table:
        table_h = max_table
    face_h = max(28, h - header - table_h - 4)
    ficha(x, y + table_h, w, h - table_h, title, pins,
          shape=shape, face=face, subtitle=sub,
          accent=accent_for(cid), face_inv=False, cid=cid,
          rail_5v=any((p.get("rail") == "5v") for p in (card.get("pins") or []) if isinstance(p, dict)))
    if entries:
        used = draw_sm_table(x + 3, y + table_h - 1, w - 6, entries)
        # used is informational
    DRAWN.append(cid)
    _current_cids.append(cid)


def emit_section(title, cids):
    global _current_title
    cids = [cid for cid in cids if cid in CONN_BASE]
    if not cids:
        return
    y = new_page(title)
    c.setFont(FONT_B, 9)
    c.setFillColor(TITLE_BLACK)
    c.drawCentredString(W / 2, H - 12, title)
    y = H - 22

    row, row_w, row_hs = [], 0.0, []

    def flush():
        nonlocal y, row, row_w, row_hs
        if not row:
            return
        h = max(row_hs)
        h = min(h, H - BOTTOM - 24)
        if y - h < BOTTOM:
            y = new_page(_current_title)
            c.setFont(FONT_B, 8)
            c.setFillColor(TITLE_BLACK)
            c.drawCentredString(W / 2, H - 12, _current_title)
            y = H - 22
            h = min(max(row_hs), H - BOTTOM - 24)
        x = ML
        for cid, cw in row:
            draw_card(x, y - h, cw, h, cid)
            x += cw + GAP
        y -= h + GAP
        row, row_w, row_hs = [], 0.0, []

    for cid in cids:
        if skip_reason(cid):
            continue
        cols = card_cols(cid)
        cw = (USABLE_W - (cols - 1) * GAP) / cols
        if row and row_w + cw + (GAP if row else 0) > USABLE_W + 0.8:
            flush()
        ch = estimate_card_h(cid, cw)
        ch = min(max(ch, 70), H - BOTTOM - 24)
        row.append((cid, cw))
        row_w += cw + GAP
        row_hs.append(ch)
        # full-width cards flush immediately after
        if cols == 1:
            flush()
    flush()
    emit_section.y = y


# ---- PAGE 1: cover + EC-123 (bigger pins) + rails — F102 moves to intermediates ----
cover_h = 42
c.setFillColor(PATH_BG)
c.setStrokeColor(SHELL)
c.setLineWidth(1.2)
c.roundRect(10, H - cover_h - 6, W - 20, cover_h, 5, fill=1, stroke=1)
c.setFillColor(black)
c.setFont(FONT_B, 13)
c.drawCentredString(W / 2, H - 20, t("cover_title"))
c.setFont(FONT, 7.5)
c.setFillColor(MUTED)
c.drawCentredString(W / 2, H - 34, t("cover_sub"))
c.setFillColor(black)
c.setFont(FONT, 6.5)
c.drawCentredString(W / 2, H - 44, t("cover_legend"))

PAGE_NO = 1
_current_title = "EC-123"
_current_cids = ["ecm"]

y_ecm_title = H - cover_h - 16
c.setFont(FONT_B, 9)
c.drawCentredString(W / 2, y_ecm_title, t("ec123_title"))
c.setFont(FONT, 5.0)
c.setFillColor(MUTED)
c.drawCentredString(W / 2, y_ecm_title - 10, t("ec123_sub"))
c.setFillColor(HexColor("#B71C1C"))
c.setFont(FONT_B, 5.5)
c.drawCentredString(W / 2, y_ecm_title - 20, t("ec123_top"))
c.setFillColor(black)
c.setFont(FONT_B, 5.0)
c.drawString(14, y_ecm_title - 30, t("lever"))
c.drawRightString(W - 14, y_ecm_title - 30, t("lever"))

lx = 14
ly = y_ecm_title - 40
for code, name in [("B", color_name("B")), ("W", color_name("W")), ("R", color_name("R")), ("G", color_name("G")),
                   ("L", color_name("L")), ("Y", color_name("Y")), ("OR", color_name("OR")), ("P", color_name("P")),
                   ("PU", color_name("PU")), ("GY", color_name("GY")), ("BR", color_name("BR")),
                   ("SB", color_name("SB")), ("LG", color_name("LG"))]:
    c.setFillColor(white)
    c.setStrokeColor(oc(code))
    c.setLineWidth(1.5)
    c.rect(lx, ly, 8, 6, fill=1, stroke=1)
    c.setFillColor(black)
    c.setFont(FONT, 4.2)
    c.drawString(lx + 10, ly + 1.0, f"{code}={name}")
    lx += 58

b1 = [[121, 120, 119], [None, 118, 117], [116, 115, 114]]
b2 = [[113, 112, 111, 110, 109, 108, 107, 106], [105, 104, 103, 102, 101, 100, 99, 98],
      [97, 96, 95, 94, 93, 92, 91, 90], [89, 88, 87, 86, 85, 84, 83, 82]]
b3 = [list(range(6, 25)), list(range(25, 44)), list(range(44, 63)), list(range(63, 82))]
b4 = [[5, 4], [None, 3], [2, 1]]

gap_pin = 1.5
gap_blk = 6.5
rail_h = 58
usable_w = W - 28
pw = (usable_w - 3 * gap_blk) / 32 - gap_pin
# Taller ECM cells (F102 left this page) so the reserved value band is readable; width stays column-limited.
grid_top = ly - 8
rail_reserve = rail_h + 16
ph = (grid_top - rail_reserve - 16) / 4 - gap_pin
ph = max(44.0, min(ph, 58.0))
pw = max(16.0, min(pw, 22.5))

x = 14
y0 = grid_top
draw_block(x, y0, b1, pw, ph, gap_pin)
c.setFont(FONT_B, 6.0)
c.setFillColor(black)
def _blk_bot(n_rows):
    return y0 - n_rows * ph - (n_rows - 1) * gap_pin
c.drawCentredString(x + 1.5 * (pw + gap_pin), _blk_bot(3) - 8, "114–121")
x += 3 * (pw + gap_pin) + gap_blk
draw_block(x, y0, b2, pw, ph, gap_pin)
c.drawCentredString(x + 4 * (pw + gap_pin), _blk_bot(4) - 8, "82–113")
x += 8 * (pw + gap_pin) + gap_blk
draw_block(x, y0, b3, pw, ph, gap_pin)
c.drawCentredString(x + 9.5 * (pw + gap_pin), _blk_bot(4) - 8, "6–81")
x += 19 * (pw + gap_pin) + gap_blk
draw_block(x, y0, b4, pw, ph, gap_pin)
c.drawCentredString(x + (pw + gap_pin), _blk_bot(3) - 8, "1–5")

ecm_bottom = _blk_bot(4) - 12

rail_top = ecm_bottom - 2
rail_x, rail_w = 14, W - 28
c.setFillColor(HexColor("#FAFAFA"))
c.setStrokeColor(HexColor("#90A4AE"))
c.setLineWidth(1.0)
c.roundRect(rail_x, rail_top - rail_h, rail_w, rail_h, 4, fill=1, stroke=1)
c.setFillColor(HexColor("#ECEFF1"))
c.rect(rail_x + 1, rail_top - 14, rail_w - 2, 13, fill=1, stroke=0)
c.setFillColor(HexColor("#37474F"))
c.setFont(FONT_B, 8.5)
c.drawString(rail_x + 6, rail_top - 10.5, t("rails_title"))
c.setFont(FONT, 5.0)
c.setFillColor(MUTED)
c.drawRightString(rail_x + rail_w - 6, rail_top - 10, t("rails_hint"))

def _rail_row(y, accent, title, body, fs_body=5.6):
    c.setFillColor(accent)
    c.roundRect(rail_x + 5, y - 1, 3.2, 11, 1, fill=1, stroke=0)
    c.setFillColor(TITLE_BLACK)
    c.setFont(FONT_B, 6.5)
    c.drawString(rail_x + 12, y + 1.5, title)
    c.setFont(FONT, fs_body)
    c.setFillColor(HexColor("#222"))
    c.drawString(rail_x + 78, y + 1.5, body)

_rail_row(rail_top - 26, HexColor("#C62828"), "12V", t("rail_12v_body"))
_rail_row(rail_top - 39, HexColor("#F9A825"), "5V", t("rail_5v_body"))
_rail_row(rail_top - 52, HexColor("#2E7D32"), "GND", t("rail_gnd_body"))

# ---- ECM values table (following pages) ----
def emit_ecm_values():
    y = new_page(t("sec_ecm_vals"))
    c.setFont(FONT_B, 9)
    c.setFillColor(TITLE_BLACK)
    c.drawCentredString(W / 2, H - 12, t("sec_ecm_vals"))
    y = H - 22
    entries = []
    for n in range(1, 122):
        lines = sm_ecm_lines(n)
        if not lines:
            continue
        texts, src = [], ""
        for item in lines:
            if isinstance(item, dict):
                tx = item.get("text") or ""
                if item.get("src") and not src:
                    src = item.get("src")
            else:
                tx = str(item)
            if tx:
                texts.append(tx)
        if texts:
            entries.append((str(n), " · ".join(texts), src))
    # two columns
    col_w = (USABLE_W - GAP) / 2
    col_x = [ML, ML + col_w + GAP]
    col_y = [y, y]
    ci = 0
    # header first col then flow
    def ensure(need):
        nonlocal ci
        if col_y[ci] - need < BOTTOM + 4:
            ci += 1
            if ci > 1:
                ny = new_page(t("sec_ecm_vals"))
                c.setFont(FONT_B, 9)
                c.setFillColor(TITLE_BLACK)
                c.drawCentredString(W / 2, H - 12, t("sec_ecm_vals"))
                col_y[0] = col_y[1] = H - 22
                ci = 0
    # draw as a flowing 2-col table using draw_sm_table in chunks
    # simpler: one entry at a time
    # headers
    for i in range(2):
        used = 0  # placeholder
    i = 0
    while i < len(entries):
        # measure one
        pid, text, src = entries[i]
        val_w = col_w - 70
        nlines = max(1, len(wrap_to_width(text, FONT, 5.2, val_w, max_lines=6)))
        rh = 10 + 4 + nlines * 6.2 if (col_y[ci] > H - 24 - 1) else (4 + nlines * 6.2)
        # if at top of column, include header
        at_top = col_y[ci] >= H - 24
        need = (11 if at_top or True else 0) + 4 + nlines * 6.2
        # always keep a header if we're starting a fresh column top
        start_y = col_y[ci]
        if start_y >= H - 24 or True:
            pass
        if col_y[ci] - (4 + nlines * 6.2) < BOTTOM + 4:
            ci += 1
            if ci > 1:
                new_page(t("sec_ecm_vals"))
                c.setFont(FONT_B, 9)
                c.setFillColor(TITLE_BLACK)
                c.drawCentredString(W / 2, H - 12, t("sec_ecm_vals"))
                col_y[0] = col_y[1] = H - 22
                ci = 0
        # header if this column is at its start
        if col_y[ci] >= H - 24:
            used = draw_sm_table(col_x[ci], col_y[ci], col_w, [])  # 0
            # draw header only via a dummy? draw_sm_table with entries does header+rows.
        # Draw a chunk that fits
        chunk = []
        remain_h = col_y[ci] - (BOTTOM + 4)
        # reserve header
        remain_h -= 11
        take = []
        for e in entries[i:]:
            nlines = max(1, len(wrap_to_width(e[1], FONT, 5.2, col_w - 70, max_lines=6)))
            eh = 4 + nlines * 6.2
            if take and remain_h - eh < 0:
                break
            if not take and eh > remain_h:
                take.append(e)
                break
            take.append(e)
            remain_h -= eh
        if not take:
            # force one
            take = [entries[i]]
        used = draw_sm_table(col_x[ci], col_y[ci], col_w, take)
        col_y[ci] -= used + 2
        i += len(take)
        _current_cids.extend("ECM " + e[0] for e in take)
    emit_section.y = min(col_y)


emit_ecm_values()

# Collect cards by group/sub in stable CONN order
_by_sec = {
    "pedals": [],
    "sensors": [],
    "actuators": [],
    "coils": [],
    "injs": [],
    "ix": [],
    "body": [],
}
for cid, card in CONN_BASE.items():
    reason = skip_reason(cid)
    if reason:
        OMITTED.append((cid, reason))
        continue
    group = card.get("group") or ""
    sub = card.get("sub") or ""
    if group == "body" and sub == "pedals":
        _by_sec["pedals"].append(cid)
    elif group == "motor" and sub == "sensors":
        _by_sec["sensors"].append(cid)
    elif group == "motor" and sub == "actuators":
        _by_sec["actuators"].append(cid)
    elif group == "motor" and sub == "bobinas":
        _by_sec["coils"].append(cid)
    elif group == "motor" and sub == "inyectores":
        _by_sec["injs"].append(cid)
    elif "intermedia" in sub:
        _by_sec["ix"].append(cid)
    elif group == "motor" and sub == "power":
        _by_sec["ix"].append(cid)  # grounds / F103 with intermediates
    else:
        _by_sec["body"].append(cid)

# Prefer a readable intermediate order: F102, E108, B1, tray pairs, then the rest
_ix_pref = [
    "ix_f102_m72", "ix_e108_m15", "ix_b1_m12",
    "ix_e11_f2", "ix_e10_f1", "ix_e12_f3",
    "ix_f18_f201", "ix_f221_f33", "ix_f14_f229",
]
def _order(ids, pref):
    seen = set()
    out = []
    for i in pref:
        if i in ids:
            out.append(i)
            seen.add(i)
    for i in ids:
        if i not in seen:
            out.append(i)
    return out

_by_sec["ix"] = _order(_by_sec["ix"], _ix_pref)

emit_section(t("sec_pedals"), _by_sec["pedals"])
emit_section(t("sec_sensors"), _by_sec["sensors"])
emit_section(t("sec_actuators"), _by_sec["actuators"])
emit_section(t("sec_coils"), _by_sec["coils"])
emit_section(t("sec_injs"), _by_sec["injs"])
emit_section(t("sec_ix"), _by_sec["ix"])
emit_section(t("sec_body"), _by_sec["body"])

_footer_draw()
c.save()
print("Wrote", OUT, "pages", PAGE_NO, "cards", len(DRAWN), "omitted", len(OMITTED))
idx_path = os.path.splitext(OUT)[0] + "_index.json"
with open(idx_path, "w", encoding="utf-8") as fh:
    json.dump({"pages": PAGE_INDEX, "drawn": DRAWN, "omitted": OMITTED, "lang": LANG}, fh, ensure_ascii=False, indent=2)
print("Index", idx_path)

# --- Preview PNGs ---
os.makedirs(PREVIEW_DIR, exist_ok=True)
try:
    import subprocess
    import shutil
    # 110 dpi for the task pack; also keep whatever PREVIEW_DIR is.
    subprocess.check_call(["pdftoppm", "-png", "-r", "110", OUT, f"{PREVIEW_DIR}/print_p"])
    print("pdftoppm ok", sorted(os.listdir(PREVIEW_DIR))[:12], "...")
except Exception as e:
    print("preview skipped:", e)

# Named ES previews live under /workspace/printpack_preview (or PRINT_PACK_SHOTS).
if LANG == "es":
    shot_dir = os.environ.get("PRINT_PACK_SHOTS", "/workspace/printpack_preview")
    os.makedirs(shot_dir, exist_ok=True)
    try:
        import subprocess, shutil, glob
        prefix = os.path.join(shot_dir, "_tmp_p")
        subprocess.check_call(["pdftoppm", "-png", "-r", "110", OUT, prefix])
        # Map pages via index
        want = {
            "ecm": ("ecm_page.png", lambda p: p["n"] == 1 or "EC-123" in (p.get("title") or "")),
            "f102": ("f102_page.png", lambda p: "ix_f102_m72" in (p.get("cids") or [])),
            "e12": ("e12_f3_page.png", lambda p: "ix_e12_f3" in (p.get("cids") or []) or "ix_e10_f1" in (p.get("cids") or [])),
            "ix": ("ix_small_page.png", lambda p: "ix_e11_f2" in (p.get("cids") or []) or "ix_f14_f229" in (p.get("cids") or [])),
        }
        used = set()
        for key, (name, pred) in want.items():
            rec = next((p for p in PAGE_INDEX if pred(p)), None)
            if not rec:
                continue
            n = rec["n"]
            srcp = f"{prefix}-{n}.png"
            if not os.path.exists(srcp):
                srcp = f"{prefix}-{n:02d}.png"
            if os.path.exists(srcp):
                dest = os.path.join(shot_dir, name)
                shutil.copy(srcp, dest)
                used.add(srcp)
                print("shot", dest)
        # leave tmp pages for debugging under shot_dir/_tmp_p-*.png
        print("shots dir", shot_dir, sorted(os.listdir(shot_dir))[:20])
    except Exception as e:
        print("named shots skipped:", e)
