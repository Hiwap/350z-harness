#!/usr/bin/env python3
"""Engine harness print pack: p1 cover+EC-123+rails+F102, p2 motor fichas.
White backgrounds. Cards = group outline (web) · 5V = amber outer ring.
Color cable = solo contorno de cavidad + código escrito.
Caras Invertida (bancada): espejo L/R en ECM e intermedias motor (F-series mates).
Fichas grouped by PATH to final destination (motor loom only — no cabin / IPDM room).
"""
import json
import os
import re
from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.utils import ImageReader

_ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("PRINT_PACK_OUT", os.path.join(_ROOT, "350Z_2005_PRINT_PACK.pdf"))
PREVIEW_DIR = os.environ.get("PRINT_PACK_PREVIEW", os.path.join(_ROOT, "pdf_preview"))
W, H = landscape(letter)
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

FACE_INV = True  # Inverted (bench): L/R mirror on ALL faces (ECM + intermediates)
FACE_ORIENT_LABEL = "Inverted (bench) · L/R mirror of FSM H.S. face · ECM + motor intermediates"

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
CAV_STD_W = 24.0
CAV_STD_H = 24.0

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
    """Wire code like web .pw: each letter color + black halo for contrast."""
    if not code:
        code = "·"
    parts = code.split("/") if "/" in code else [code]
    # measure total width
    c.setFont("Helvetica-Bold", fs)
    segs = []
    for i, part in enumerate(parts):
        if i:
            segs.append(("/", HexColor("#455A64")))
        segs.append((part, oc(part)))
    total = sum(c.stringWidth(s, "Helvetica-Bold", fs) for s, _ in segs)
    x = cx - total / 2
    # black halo (8-dir) then colored glyph
    for dx, dy in ((-0.55,0),(0.55,0),(0,-0.55),(0,0.55),(-0.4,-0.4),(0.4,-0.4),(-0.4,0.4),(0.4,0.4)):
        xx = x
        for s, _col in segs:
            c.setFillColor(black)
            c.drawString(xx + dx, cy + dy, s)
            xx += c.stringWidth(s, "Helvetica-Bold", fs)
    xx = x
    for s, col in segs:
        c.setFillColor(col)
        c.drawString(xx, cy, s)
        xx += c.stringWidth(s, "Helvetica-Bold", fs)


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
    """ECM cell like web: pin nº · wire code · rail/CAN bottom (when present)."""
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
    has_bot = bool(bot)
    fs_pin = max(5.5, min(9.5, h * (0.32 if has_bot else 0.40)))
    fs_code = max(3.6, min(6.2, h * (0.22 if has_bot else 0.28)))
    fs_bot = max(3.4, min(5.8, h * 0.20))
    c.setFillColor(HexColor("#212121"))
    c.setFont("Helvetica-Bold", fs_pin)
    c.drawCentredString(x + w / 2, y + h * (0.62 if has_bot else 0.55), str(pin))
    draw_wire_code(x + w / 2, y + h * (0.34 if has_bot else 0.12), code if code else "·", fs_code)
    if has_bot:
        if bot in ("GND", "12V", "5V"):
            c.setFillColor(lab_fill(bot))
        elif bot.startswith("C/"):
            c.setFillColor(HexColor("#6A1B9A"))
        else:
            c.setFillColor(MUTED)
        c.setFont("Helvetica-Bold", fs_bot)
        c.drawCentredString(x + w / 2, y + max(2.0, h * 0.06), bot)


def draw_empty(x, y, w, h):
    c.setFillColor(white)
    c.setStrokeColor(HexColor("#E0E0E0"))
    c.setLineWidth(0.5)
    c.setDash(1, 1)
    c.roundRect(x, y, w, h, 1, fill=1, stroke=1)
    c.setDash()


def draw_block(x0, y_top, rows, pw, ph, gap=1.6):
    for ri, row in enumerate(rows):
        y = y_top - ri * (ph + gap)
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


def draw_cavity(px, py, cw, ch, lab, col, note, fs=None):
    """Cavity: white fill · wire-color contour stroke only · codes as text."""
    if fs is None:
        fs = max(4.0, min(7.2, min(ch * 0.26, cw * 0.22)))
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
    # Order matches web fichas: ECM # (top) · wire code · cavity id (bottom)
    c.setFillColor(ECM_BLUE)
    c.setFont("Helvetica-Bold", max(3.4, fs - 0.5))
    c.drawCentredString(px + cw / 2, py + ch * 0.68, ecm_label(note)[:8])
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", max(3.4, fs - 0.7))
    c.drawCentredString(px + cw / 2, py + ch * 0.40, str(col)[:8])
    c.setFillColor(lab_fill(lab))
    c.setFont("Helvetica", max(3.2, fs - 0.9))
    c.drawCentredString(px + cw / 2, py + max(2.4, ch * 0.08), str(lab)[:6])
    c.setFillColor(black)


def row_labs(labs):
    """Invertida (bancada): mirror each face row L↔R. Applies to ECM faces AND intermedias."""
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
    """Uniform pin size, shrink only if the card is too small."""
    cw = min(CAV_STD_W, face_w / max(cols, 1))
    ch = min(CAV_STD_H, face_h / max(rows, 1))
    # keep roughly square
    side = min(cw, ch)
    return side, side


def split_ficha_title(title):
    title = (title or "").strip()
    if "·" in title:
        a, b = title.split("·", 1)
        return a.strip(), b.strip()
    m = re.match(r"^([EF]\d+\w*)\s+(.+)$", title)
    if m:
        return m.group(1), m.group(2)
    m = re.match(r"^(Coil|Bobina|Inj|Iny)\s*(\d+)\b(.*)$", title, re.I)
    if m:
        kind = "Bob" if m.group(1).lower().startswith(("c", "b")) else "Iny"
        return f"{kind}{m.group(2)}", (m.group(3) or "").strip()
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
    c.setFont("Helvetica-Bold", code_fs)
    c.drawString(x + 6.5, y + h - band_h + (band_h * 0.38 if not (name and subtitle and w >= 100) else band_h * 0.52), code[:12])
    c.setFillColor(MUTED)
    name_fs = min(5.2, max(3.6, w * 0.042))
    c.setFont("Helvetica", name_fs)
    if name and subtitle and w >= 100:
        c.drawString(x + 6.5, y + h - band_h + 2.8, name[:26])
        c.setFont("Helvetica", max(3.2, name_fs - 0.5))
        c.drawRightString(x + w - 3.5, y + h - band_h + 2.8, subtitle[:20])
    elif name:
        c.drawRightString(x + w - 3.5, y + h - band_h + (band_h * 0.38), name[:22])
    elif subtitle:
        c.drawRightString(x + w - 3.5, y + h - band_h + (band_h * 0.38), subtitle[:22])
    if qty:
        c.setFont("Helvetica-Bold", 4.2)
        c.setFillColor(accent)
        c.drawRightString(x + w - 3.5, y + h - 3.5, str(qty)[:8])
    c.setFillColor(black)
    return band_h


def ficha(x, y, w, h, title, pins, shape="tab2", accent=None, qty="", face=None, subtitle="", rail_5v=False, face_inv=None):
    """
    Connector card: group-colored outline (web SUB_ACCENT). Optional amber outer ring for 5V.
    Wire color only on cavity stroke + codes. Invertida L/R on faces.
    """
    face = face or (shape if shape in ("af6", "rect6", "f2", "rect10", "e113", "f102", "smj_h", "f3", "f1") else None)
    # face_inv=None → global FACE_INV; False = keep FSM H.S. (intermedias)
    use_inv = FACE_INV if face_inv is None else face_inv
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

    # ---- RING (E17 body ground) ----
    if shape == "ring":
        card_shell(x, y, w, h, accent=accent or GRP["power"], rail_5v=rail_5v, radius=4)
        draw_ficha_header(x, y, w, h, title, subtitle or qty, accent or GRP["power"], qty)
        lab, col, note = pins[0] if pins else ("ring", "B", "")
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
        c.setFont("Helvetica-Bold", 5.5)
        c.drawCentredString(cx, cy - 1.5, str(lab)[:5])
        c.setFillColor(black)
        c.setFont("Helvetica", 4.5)
        c.drawCentredString(cx, y + 12, col)
        c.setFillColor(ECM_BLUE)
        c.setFont("Helvetica", 4.2)
        c.drawCentredString(cx, y + 5, ecm_label(note))
        return

    # ---- BOX (joint packs) ----
    if shape == "box":
        card_shell(x, y, w, h, accent=accent or GRP["sensors"], rail_5v=rail_5v, radius=3)
        c.setFillColor(TITLE_BLACK)
        c.setFont("Helvetica-Bold", 6.5)
        c.drawCentredString(x + w / 2, y + h - 12, title[:18])
        if subtitle:
            c.setFont("Helvetica", 4.0 if w >= 120 else 3.6)
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
        c.setFont("Helvetica-Bold", 5.8)
        c.drawCentredString(x + w / 2, y + h - 11, title[:20])
        c.setFillColor(ECM_BLUE)
        c.setFont("Helvetica-Bold", 4.6)
        # subtitle = plain-language job; fallback if empty
        job = (subtitle or "empalme intermedio").strip()
        # wrap up to 2 lines
        line1 = job[:28]
        line2 = job[28:56] if len(job) > 28 else ""
        c.drawCentredString(x + w / 2, y + h * (0.48 if line2 else 0.40), line1)
        if line2:
            c.setFont("Helvetica", 4.0)
            c.setFillColor(MUTED)
            c.drawCentredString(x + w / 2, y + h * 0.28, line2)
        else:
            c.setFillColor(MUTED)
            c.setFont("Helvetica", 3.8)
            c.drawCentredString(x + w / 2, y + h * 0.18, "par mate")
        return

    # Plain card shell — group outline (+ optional 5V amber ring)
    card_shell(x, y, w, h, accent=accent, rail_5v=rail_5v, radius=3.5)
    title_band = draw_ficha_header(x, y, w, h, title, subtitle, accent, qty)

    face_x = x + 3.5
    face_y = y + 2.5
    face_w = w - 7
    face_h = max(18, h - title_band - 3)

    # ---- AF6: FSM top 5-3-1 / bot 6-4-2 · Invertida mirrors each row ----
    if face == "af6" and all(k in by for k in ("1", "2", "3", "4", "5", "6")):
        order = [_row(["5", "3", "1"]), _row(["6", "4", "2"])]
        cw, ch = cav_fit(face_w, face_h, 3, 2)
        ox = face_x + max(0, (face_w - 3 * cw) / 2)
        oy = face_y + max(0, (face_h - 2 * ch) / 2)
        for ri, row in enumerate(order):
            for ci, key in enumerate(row):
                lab, col, note = _pin_disp(by[key])
                draw_cavity(ox + ci * cw, oy + (1 - ri) * ch, cw, ch, lab, col, note, fs=4.0)
        return

    # ---- E113 APP FSM face: top 3-2-1 / bot 6-5-4 · Invertida mirrors ----
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
                draw_cavity(face_x + ci * cw, face_y + (1 - ri) * ch, cw, ch, lab, col, note, fs=3.4)
        return

    # ---- RECT6: top 1-2-3 / bot 4-5-6 · Invertida ----
    if face == "rect6" and len(pins) >= 6:
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
                draw_cavity(ox + ci * cw, oy + ch, cw, ch, lab, col, note, fs=4.2)
            for ci, pid in enumerate(bot):
                lab, col, note = _pin_disp(by[pid])
                draw_cavity(ox + ci * cw, oy, cw, ch, lab, col, note, fs=4.2)
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
            draw_cavity(ox, oy + ch * 0.5, cw, ch, lab, col, note, fs=4.0)
            gx = ox + cw + cw * 0.15
            for ci, pid in enumerate(top):
                lab, col, note = _pin_disp(by[pid])
                draw_cavity(gx + ci * cw, oy + ch, cw, ch, lab, col, note, fs=4.0)
            for ci, pid in enumerate(bot):
                lab, col, note = _pin_disp(by[pid])
                draw_cavity(gx + ci * cw, oy, cw, ch, lab, col, note, fs=4.0)
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
            draw_cavity(ox + i * cw, oy, cw, ch, lab, col, note, fs=4.0)
        return

    # ---- F102 SMJ · PG-85 H.S. (ENGINE CONTROL HARNESS, white) · no Invertida ----
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
                    draw_cavity(px, py, cw, ch, dlab if dlab != lab else lab, col, note, fs=max(2.8, min(4.2, cw * 0.28)))
                else:
                    c.setFillColor(white)
                    c.setStrokeColor(HexColor("#E0E0E0"))
                    c.setLineWidth(0.4)
                    c.roundRect(px + 0.6, py + 0.6, cw - 1.2, ch - 1.2, 0.8, fill=1, stroke=1)
                    c.setFillColor(LIGHT_GRAY)
                    c.setFont("Helvetica", max(2.6, min(3.6, cw * 0.22)))
                    c.drawCentredString(px + cw / 2, py + ch * 0.55, lab)
                    c.setFillColor(HexColor("#BDBDBD"))
                    c.circle(px + cw / 2, py + ch * 0.28, max(0.6, min(1.2, cw * 0.08)), fill=1, stroke=0)
            for ci, lab in enumerate(bot):
                px = bx + ci * cw
                py = face_y
                if lab in verified:
                    dlab, col, note = _pin_disp(verified[lab])
                    draw_cavity(px, py, cw, ch, dlab if dlab != lab else lab, col, note, fs=max(2.8, min(4.2, cw * 0.28)))
                else:
                    c.setFillColor(white)
                    c.setStrokeColor(HexColor("#E0E0E0"))
                    c.setLineWidth(0.4)
                    c.roundRect(px + 0.6, py + 0.6, cw - 1.2, ch - 1.2, 0.8, fill=1, stroke=1)
                    c.setFillColor(LIGHT_GRAY)
                    c.setFont("Helvetica", max(2.6, min(3.6, cw * 0.22)))
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
        c.setFont("Helvetica-Bold", max(3.2, min(5.0, stub_w * 0.45)))
        c.drawCentredString(bx + stub_w / 2, face_y + face_h - 8, "30H")
        c.setFont("Helvetica-Bold", max(5.0, min(8.0, stub_w * 0.7)))
        c.drawCentredString(bx + stub_w / 2, face_y + face_h / 2 - 2, "—")
        c.setFont("Helvetica-Bold", max(3.2, min(5.0, stub_w * 0.45)))
        c.drawCentredString(bx + stub_w / 2, face_y + 3.5, "46H")
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 3.2)
        c.drawString(face_x + 1, face_y + face_h - 3.2, "PG-85 H.S. · R stub 30H–46H vacías")
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
                    fs=4.0 if shape == "ipdm" else 4.0)


def section_label(x, y, w, text):
    """Path / group banner — titles black."""
    c.setFillColor(PATH_BG)
    c.setStrokeColor(SHELL)
    c.setLineWidth(0.9)
    c.roundRect(x, y - 1, w, 12, 2, fill=1, stroke=1)
    c.setFillColor(TITLE_BLACK)
    c.setFont("Helvetica-Bold", 6.3)
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
    c.setFont("Helvetica-Bold", 6)
    c.drawCentredString(x + half_w + gap / 2, y + h / 2 - 2, "⟷")


def ecm_chip_row(x, y, w, h, pins_codes):
    """Compact ECM destination chips inside a path group."""
    c.setFillColor(white)
    c.setStrokeColor(SHELL)
    c.setLineWidth(1.2)
    c.roundRect(x, y, w, h, 3, fill=1, stroke=1)
    c.setFillColor(TITLE_BLACK)
    c.setFont("Helvetica-Bold", 5.5)
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
        c.setFont("Helvetica-Bold", max(4.0, min(6.5, ch * 0.35)))
        c.drawCentredString(px + cw / 2, py + ch * 0.52, str(pin))
        c.setFont("Helvetica", max(3.0, min(4.5, ch * 0.22)))
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
        lab = _field(obj, "lab") or pid or "?"
        code = _field(obj, "code")
        if code is None:
            code = "—"
        ecm = _field(obj, "ecm")
        src = _field(obj, "src")
        rail = _field(obj, "rail")
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
        elif lab_u == "SIG" or id_u == "SIG":
            if ecm and ecm != "null":
                disp = str(ecm) + "S"
            elif pid and id_u != "SIG":
                disp = str(pid) + "S"
            else:
                disp = "S"
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
if not KNOCK_PINS:
    KNOCK_PINS = [("SIG", "W", "15"), ("GND", "B", "116")]
if not E12_F3_SUB:
    E12_F3_SUB = "8-pin GY · VB 119/120 · IGN"
if not E10_F1_SUB:
    E10_F1_SUB = "9-pin GY · START · REV Y/R"


# ========== PAGE 1: cover (top band) + EC-123 (rest) — combined ==========
FOOT_Y = 8

# Cover band (was page 1) — kept visible so it is clearly merged, not deleted
cover_h = 46
c.setFillColor(PATH_BG)
c.setStrokeColor(SHELL)
c.setLineWidth(1.2)
c.roundRect(10, H - cover_h - 6, W - 20, cover_h, 5, fill=1, stroke=1)
c.setFillColor(black)
c.setFont("Helvetica-Bold", 13)
c.drawCentredString(W / 2, H - 20, "2005 Nissan 350Z VQ35DE — Engine harness print pack")
c.setFont("Helvetica", 7.5)
c.setFillColor(MUTED)
c.drawCentredString(W / 2, H - 34, "Motor-control loom on the bench (F-series) · ECM MEC61-510 · 2 páginas: EC-123 + fichas")
c.setFillColor(black)
c.setFont("Helvetica", 6.5)
c.drawCentredString(W / 2, H - 46, "Card · color = outline · 5V amber / 12V red / GND green · Inverted L/R · FSM EC 2005 · OEM · not a service manual")

# EC-123 title under cover band
y_ecm_title = H - cover_h - 18
c.setFont("Helvetica-Bold", 9)
c.drawCentredString(W / 2, y_ecm_title, "1 · EC-123 INVERTED — MEC61-510  ·  (same sheet as cover)")
c.setFont("Helvetica", 5.0)
c.setFillColor(MUTED)
c.drawCentredString(W / 2, y_ecm_title - 10, "pin # top · wire code bottom · border = wire · red = bench · Inverted L/R")
c.setFillColor(HexColor("#B71C1C"))
c.setFont("Helvetica-Bold", 5.5)
c.drawCentredString(W / 2, y_ecm_title - 20, "TOP | 121 on the LEFT")
c.setFillColor(black)
c.setFont("Helvetica-Bold", 5.0)
c.drawString(14, y_ecm_title - 30, "LEVER")
c.drawRightString(W - 14, y_ecm_title - 30, "LEVER")

lx = 14
ly = y_ecm_title - 40
for code, name in [("B", "negro"), ("W", "blanco"), ("R", "rojo"), ("G", "verde"), ("L", "azul"),
                   ("Y", "amarillo"), ("OR", "naranja"), ("P", "rosa"), ("PU", "violeta"),
                   ("GY", "gris"), ("BR", "marron"), ("SB", "celeste"), ("LG", "v.claro")]:
    c.setFillColor(white)
    c.setStrokeColor(oc(code))
    c.setLineWidth(1.5)
    c.rect(lx, ly, 8, 6, fill=1, stroke=1)
    c.setFillColor(black)
    c.setFont("Helvetica", 4.2)
    c.drawString(lx + 10, ly + 1.0, f"{code}={name}")
    lx += 58

b1 = [[121, 120, 119], [None, 118, 117], [116, 115, 114]]
b2 = [[113, 112, 111, 110, 109, 108, 107, 106], [105, 104, 103, 102, 101, 100, 99, 98],
      [97, 96, 95, 94, 93, 92, 91, 90], [89, 88, 87, 86, 85, 84, 83, 82]]
b3 = [list(range(6, 25)), list(range(25, 44)), list(range(44, 63)), list(range(63, 82))]
b4 = [[5, 4], [None, 3], [2, 1]]

gap_pin = 1.5
gap_blk = 6.5
# ECM under cover band — a bit taller (room left on page)
ph = 33.0
usable_w = W - 28
pw = (usable_w - 3 * gap_blk) / 32 - gap_pin
pw = max(15.5, min(pw, ph * 1.12))

grid_top = ly - 8
x = 14
y0 = grid_top
draw_block(x, y0, b1, pw, ph, gap_pin)
c.setFont("Helvetica-Bold", 6.0)
c.setFillColor(black)
c.drawCentredString(x + 1.5 * (pw + gap_pin), y0 - 3 * (ph + gap_pin) - 6, "114–121")
x += 3 * (pw + gap_pin) + gap_blk
draw_block(x, y0, b2, pw, ph, gap_pin)
c.drawCentredString(x + 4 * (pw + gap_pin), y0 - 4 * (ph + gap_pin) - 6, "82–113")
x += 8 * (pw + gap_pin) + gap_blk
draw_block(x, y0, b3, pw, ph, gap_pin)
c.drawCentredString(x + 9.5 * (pw + gap_pin), y0 - 4 * (ph + gap_pin) - 6, "6–81")
x += 19 * (pw + gap_pin) + gap_blk
draw_block(x, y0, b4, pw, ph, gap_pin)
c.drawCentredString(x + (pw + gap_pin), y0 - 3 * (ph + gap_pin) - 6, "1–5")

ecm_bottom = y0 - 4 * (ph + gap_pin) - 10

# --- RIELS ECM: named legend (12V / 5V / tierras) — bench ID under the face ---
rail_top = ecm_bottom - 2
rail_h = 58
rail_x, rail_w = 14, W - 28
c.setFillColor(HexColor("#FAFAFA"))
c.setStrokeColor(HexColor("#90A4AE"))
c.setLineWidth(1.0)
c.roundRect(rail_x, rail_top - rail_h, rail_w, rail_h, 4, fill=1, stroke=1)
# Title band
c.setFillColor(HexColor("#ECEFF1"))
c.rect(rail_x + 1, rail_top - 14, rail_w - 2, 13, fill=1, stroke=0)
c.setFillColor(HexColor("#37474F"))
c.setFont("Helvetica-Bold", 8.5)
c.drawString(rail_x + 6, rail_top - 10.5, "ECM RAILS  ·  lines leaving the module (engine harness)")
c.setFont("Helvetica", 5.0)
c.setFillColor(MUTED)
c.drawRightString(rail_x + rail_w - 6, rail_top - 10, "pin border = wire color · FSM EC-123")

def _rail_row(y, accent, title, body, fs_body=5.6):
    c.setFillColor(accent)
    c.roundRect(rail_x + 5, y - 1, 3.2, 11, 1, fill=1, stroke=0)
    c.setFillColor(TITLE_BLACK)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawString(rail_x + 12, y + 1.5, title)
    c.setFont("Helvetica", fs_body)
    c.setFillColor(HexColor("#222"))
    c.drawString(rail_x + 78, y + 1.5, body)

_rail_row(rail_top - 26, HexColor("#C62828"), "12V",
          "BATT 121=R/W · IGN 119=R/W · IGN 120=P · VMOT 3 (IPDM E8·42)  →  coil/inj feeds / ECM power")
_rail_row(rail_top - 39, HexColor("#F9A825"), "5V",
          "47 TPS/ETC · 48 EVAP · 49 A/C press · 68 PSP · 90 APP1 · 91 APP2   (separate rails, not one shared 5V)")
_rail_row(rail_top - 52, HexColor("#2E7D32"), "GND",
          "ECM 1=B · 115=B/W · 116=B/R (→F103/E17)  ·  SNS 66/67/78/82/83  ·  signals: KNK15 · CKP13 · CAN 86/94 · AFh 2/24")

# --- F102 SMJ under rails (motor face of control harness ↔ body) ---
F102_PINS, F102_SUB = extract_conn("ix_f102_m72")
f102_top = rail_top - rail_h - 8
f102_h = max(78, f102_top - 18)
c.setFont("Helvetica-Bold", 7.5)
c.setFillColor(TITLE_BLACK)
c.drawString(14, f102_top + 2, "F102 · SMJ  (ENGINE CONTROL HARNESS · PG-85)  ·  not inverted  ·  motor face of harness")
c.setFont("Helvetica", 4.8)
c.setFillColor(MUTED)
c.drawRightString(W - 14, f102_top + 2, (F102_SUB or "PG-85 H.S.") + f" · {len(F102_PINS)} cavities")
ficha(14, f102_top - f102_h, W - 28, f102_h - 2, "F102 · SMJ",
      F102_PINS, shape="f102", face="f102",
      subtitle="control harness ↔ body · 1H–29H + stub 30H–46H",
      accent=GRP["intermedias"], face_inv=False)

c.setFont("Helvetica", 4.6)
c.setFillColor(MUTED)
c.drawString(10, 4, "Page 1/2 · cover + EC-123 + rails + F102 · engine harness")
c.setFillColor(black)
c.showPage()


# ========== FICHAS POR PATH — motor loom dense page ==========
ML, MR = 5, 5
usable_w = W - ML - MR
GAP = 2.4
BOTTOM = 10
HEADER_H = 24

c.setFont("Helvetica-Bold", 8.5)
c.drawCentredString(W / 2, H - 9,
                    "2 · Motor fichas · sensor → intermediate F → ECM · group outline · 5V amber · Inverted")
c.setFont("Helvetica", 5.0)
c.setFillColor(MUTED)
c.drawCentredString(W / 2, H - 18,
                    "cavity: id · color · →ECM · 5V=amber ring · 12V red / GND green")
c.setFillColor(black)

y_top = H - HEADER_H
avail = y_top - BOTTOM
label_h = 11
# PATH rows: AF, knock+sens, ETC+VTC, coil, inj, jointsA, jointsB
# Balanced rows — pin cavities use CAV_STD_* (not stretched to card)
weights = [0.95, 0.85, 0.70, 0.52, 0.52, 0.48, 1.15]
gap_v = 2.0
n_gaps = len(weights) - 1
n_labels = 3  # AF, Knock, joints (+ act/coil/inj without banners)
card_budget = avail - n_labels * label_h - n_gaps * gap_v
chs = [card_budget * w / sum(weights) for w in weights]
(ch_af, ch_ks, ch_act, ch_coil, ch_inj, ch_ja, ch_jb) = chs

y = y_top

# --- A/F path ---
section_label(ML, y - 9, usable_w,
              "PATH A/F + HO2S  ·  sensors → E12⟷F3 (heaters / power) → ECM  ·  heaters ECM 2 / 24")
y -= label_h
cw_af = 210
cw_ho = (usable_w - 2 * cw_af - GAP) / 2
ficha(ML, y - ch_af, cw_af, ch_af, "A/F B1 · sensor",
      [("1", "LG/B", "16"), ("2", "P/B", "75"), ("3", "12V", "fuse"),
       ("4", "GY/R", "2"), ("5", "L/W", "35"), ("6", "W/L", "56")],
      "af6", face="af6", subtitle="FSM · pass/RH · Inv", accent=GRP["sensors"])
ficha(ML + cw_af + GAP, y - ch_af, cw_af, ch_af, "A/F B2 · sensor",
      [("1", "LG", "76"), ("2", "P", "77"), ("3", "12V", "fuse"),
       ("4", "G/Y", "24"), ("5", "L/B", "55"), ("6", "W", "58")],
      "af6", face="af6", subtitle="FSM · driver/LH · Inv", accent=GRP["sensors"])
ficha(ML + 2 * (cw_af + GAP), y - ch_af, cw_ho, ch_af, "F11 · HO2S B1",
      [("htr", "P/B", "25"), ("12V", "12V", "fuse")],
      "tab2", subtitle="post-cat RH", accent=GRP["sensors"])
ficha(ML + 2 * (cw_af + GAP) + cw_ho + GAP, y - ch_af, cw_ho, ch_af, "F12 · HO2S B2",
      [("htr", "P/L", "6"), ("12V", "12V", "fuse")],
      "tab2", subtitle="post-cat LH", accent=GRP["sensors"])
c.setFont("Helvetica", 4.2)
c.setFillColor(MUTED)
c.drawRightString(ML + usable_w - 2, y - ch_af + 5,
                  "A/F heaters / coil·inj 12V rail: E12⟷F3 (mate en joints abajo)")
c.setFillColor(black)
y -= ch_af + gap_v

# --- Knock path + other motor sensors ---
section_label(ML, y - 9, usable_w,
              "PATH Knock  ·  sensor → F14/F229 → ECM 15 / GND 116   ·   other motor sensors (direct → ECM)")
y -= label_h
# Wider knock strip so 2-pin cards fit CAV_STD (was overflowing at ~46pt wide)
w_kn = min(220, usable_w * 0.38)
w_rest = usable_w - w_kn - GAP
path_frame(ML, y - ch_ks, w_kn, ch_ks)
kn_sens_w = w_kn * 0.30
kn_mate_w = w_kn - kn_sens_w - 3
ficha(ML + 1, y - ch_ks + 1, kn_sens_w - 1, ch_ks - 2, "Knock · sensor",
      [("SIG", "W", "15"), ("GND", "B", "116")],
      "tab2", subtitle="→F14", accent=GRP["sensors"])
draw_mate_pair(ML + kn_sens_w + 1, y - ch_ks + 1, kn_mate_w - 1, ch_ks - 2,
               {"title": "F14 · knock", "pins": KNOCK_PINS, "shape": "tab2", "subtitle": "mate · GND",
                "accent": GRP["intermedias"], "face_inv": False},
               {"title": "F229 · knock", "pins": KNOCK_PINS, "shape": "tab2", "subtitle": "mate · GND",
                "accent": GRP["intermedias"], "face_inv": False})

w6 = (w_rest - 5 * GAP) / 6
items_s = [
    ("F25 · MAF", [("12V", "R", "pwr"), ("GND", "B", "gnd"), ("SIG", "OR", "51")], "tab3", "→ECM 51"),
    ("F10 · CKP", [("PWR", "R/W", "12V"), ("SIG", "W/L", "13"), ("GND", "B", "gnd")], "tab3", "→ECM 13"),
    ("CMP B1 · cam", [("SIG", "R", "33"), ("GND", "B", "gnd")], "tab2", "cam RH"),
    ("CMP B2 · cam", [("SIG", "R/L", "14"), ("GND", "B", "gnd")], "tab2", "cam LH"),
    ("ECT · coolant", [("SIG", "BR/Y", "73"), ("GND", "B", "SNS")], "tab2", "coolant"),
    ("IAT · intake", [("SIG", "Y/G", "34"), ("GND", "B", "SNS")], "tab2", "intake air"),
]
xx = ML + w_kn + GAP
for title, pins, sh, sub in items_s:
    ficha(xx, y - ch_ks, w6, ch_ks, title, pins, sh, subtitle=sub, accent=GRP["sensors"])
    xx += w6 + GAP
y -= ch_ks + gap_v

# --- ETC + VTC (same row — no full-width lone ETC) ---
cw3 = (usable_w - 2 * GAP) / 3
ficha(ML, y - ch_act, cw3, ch_act, "ETC · throttle",
      [("M+", "L/Y", "5"), ("M-", "L/B", "4"), ("5V", "W/R", "47"),
       ("T1", "G", "50"), ("T2", "Y", "69"), ("GND", "B", "SNS")],
      "rect6", face="rect6", subtitle="DBW · 5V=47 · TPS",
      accent=GRP["sensors"], rail_5v=True)
ficha(ML + cw3 + GAP, y - ch_act, cw3, ch_act, "VTC B1 · intake",
      [("ECM", "P", "11"), ("12V", "R", "ign")], "tab2", subtitle="intake cam RH · →ECM 11",
      accent=GRP["actuators"])
ficha(ML + 2 * (cw3 + GAP), y - ch_act, cw3, ch_act, "VTC B2 · intake",
      [("ECM", "W/G", "10"), ("12V", "R", "ign")], "tab2", subtitle="intake cam LH · →ECM 10",
      accent=GRP["actuators"])
y -= ch_act + gap_v

# --- Coils ---
coils = [(1, 62, "Y/R"), (2, 81, "G/B"), (3, 61, "L/R"), (4, 80, "GY"), (5, 60, "PU/W"), (6, 79, "GY/R")]
cw_c = (usable_w - 5 * GAP) / 6
xx = ML
for cyl, pin, code in coils:
    ficha(xx, y - ch_coil, cw_c, ch_coil, f"Coil {cyl}",
          [("ECM", code, str(pin)), ("12V", "R", "ign")],
          "tab2", subtitle=f"→ECM {pin}", accent=GRP["actuators"])
    xx += cw_c + GAP
y -= ch_coil + gap_v

# --- Injectors ---
injs = [(1, 23, "R/B"), (2, 42, "B/R"), (3, 22, "R/Y"), (4, 41, "W/B"), (5, 21, "SB"), (6, 40, "LG")]
xx = ML
for cyl, pin, code in injs:
    ficha(xx, y - ch_inj, cw_c, ch_inj, f"Inj {cyl}",
          [("ECM", code, str(pin)), ("12V", "R", "ign")],
          "tab2", subtitle=f"→ECM {pin}", accent=GRP["actuators"])
    xx += cw_c + GAP
y -= ch_inj + gap_v

# --- Motor joints (2 rows: grounds/noise | E12⟷F3 + E10⟷F1 mates from map) ---
section_label(ML, y - 9, usable_w,
              "Motor joints  ·  F103/gnd4 → E17  ·  Ign condenser  ·  SNS GND  ·  E12⟷F3  ·  E10⟷F1 (battery tray)")
y -= label_h

# Row A: F103 | E17 | condenser | SNS GND
w4 = (usable_w - 3 * GAP) / 4
ficha(ML, y - ch_ja, w4, ch_ja, "F103 · grounds",
      [("A", "B", "1"), ("B", "B/W", "115"), ("C", "B/R", "116"), ("D", "B", "E17")],
      "rect4", subtitle="1/115/116 → E17", accent=GRP["power"])
ficha(ML + w4 + GAP, y - ch_ja, w4, ch_ja, "E17 · body ground",
      [("ring", "B", "gnd")],
      "ring", qty="body", accent=GRP["power"])
ficha(ML + 2 * (w4 + GAP), y - ch_ja, w4, ch_ja, "F16 · condenser",
      [("~2µF", "—", "cyl3")],
      "tab2", subtitle="noise · near cyl3", accent=GRP["actuators"])
ficha(ML + 3 * (w4 + GAP), y - ch_ja, w4, ch_ja, "SNS · grounds",
      [("66", "B", "66"), ("67", "B", "67"), ("78", "B", "78")],
      "tab3", subtitle="sensor grounds", accent=GRP["power"])
y -= ch_ja + gap_v

# Row B: full E12⟷F3 + E10⟷F1 mate pairs (pins from live map HTML)
w_mate = (usable_w - GAP) / 2
draw_mate_pair(ML, y - ch_jb, w_mate, ch_jb,
               {"title": "E12 · power", "pins": E12_F3_PINS, "shape": "f3", "face": "f3",
                "subtitle": E12_F3_SUB, "accent": GRP["intermedias"],
                "face_inv": False},
               {"title": "F3 · power", "pins": E12_F3_PINS, "shape": "f3", "face": "f3",
                "subtitle": E12_F3_SUB, "accent": GRP["intermedias"],
                "face_inv": False})
draw_mate_pair(ML + w_mate + GAP, y - ch_jb, w_mate, ch_jb,
               {"title": "E10 · tray", "pins": E10_F1_PINS, "shape": "f1", "face": "f1",
                "subtitle": E10_F1_SUB, "accent": GRP["intermedias"],
                "face_inv": False},
               {"title": "F1 · tray", "pins": E10_F1_PINS, "shape": "f1", "face": "f1",
                "subtitle": E10_F1_SUB, "accent": GRP["intermedias"],
                "face_inv": False})
y -= ch_jb

c.setFont("Helvetica", 4.8)
c.setFillColor(MUTED)
c.drawString(ML, 3,
             f"Page 2/2 · motor fichas · F102 on page 1 · no CAN/DLC · {FACE_ORIENT_LABEL[:36]}")
c.setFillColor(black)


c.save()
print("Wrote", OUT)

# --- Preview PNGs ---
os.makedirs(PREVIEW_DIR, exist_ok=True)
for stale in ("fichas_page_A.png", "fichas_page_B.png", "intermedias_page.png",
              "print_p-5.png", "print_p5.png",
              "ecm_ipdm_page.png", "ipdm_fsm_page.png"):
    p = os.path.join(PREVIEW_DIR, stale)
    if os.path.exists(p):
        os.remove(p)
try:
    from pdf2image import convert_from_path
    pages = convert_from_path(OUT, dpi=120)
    for i, im in enumerate(pages, 1):
        path = f"{PREVIEW_DIR}/print_p-{i}.png"
        im.save(path, "PNG")
        print("Preview", path, im.size)
    if len(pages) >= 2:
        pages[0].save(f"{PREVIEW_DIR}/ec123_page.png", "PNG")
        print("EC-123 preview", f"{PREVIEW_DIR}/ec123_page.png", pages[0].size)
        fp = f"{PREVIEW_DIR}/fichas_page.png"
        pages[1].save(fp, "PNG")
        print("Fichas/paths preview", fp, pages[1].size)
    print("pages", len(pages))
except Exception as e:
    print("pdf2image failed:", e)
    import subprocess
    import shutil
    subprocess.check_call(
        ["pdftoppm", "-png", "-r", "120", OUT, f"{PREVIEW_DIR}/print_p"]
    )
    p1 = f"{PREVIEW_DIR}/print_p-1.png"
    p2 = f"{PREVIEW_DIR}/print_p-2.png"
    if os.path.exists(p1):
        shutil.copy(p1, f"{PREVIEW_DIR}/ec123_page.png")
    if os.path.exists(p2):
        shutil.copy(p2, f"{PREVIEW_DIR}/fichas_page.png")
    print("pdftoppm ok", sorted(os.listdir(PREVIEW_DIR)))
