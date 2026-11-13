"""Aturan pembagian bagian untuk suzuki-gsx.obj (punya grup + material dari 3ds Max).

Id region (rN) berasal dari komponen terhubung per grup/material; lihat debug_glb.py.
"""
NAME = "GSX"
DIGITS = 3
CREASE = None
MIN_TRIS = 120
SMOOTH_DEG = 45
WHEELBASE_M = 1.46  # naked sport 4 silinder

WHEELS = {"depan": (0.722, 0.280), "belakang": (-0.684, 0.295), "z": 0.0, "radius": 0.285}

DEBUG_COLORS = {
    "ban": (0.05, 0.05, 0.05), "velg": (0.9, 0.75, 0.1), "cakram": (0.7, 0.7, 0.75), "jok": (0.35, 0.2, 0.1),
    "hitam": (0.15, 0.15, 0.17), "logam": (0.6, 0.62, 0.66), "knalpot": (0.8, 0.5, 0.3), "lampu": (1, 1, 0.8),
    "sein": (1, 0.6, 0), "kaca": (0.3, 0.8, 0.9), "merah": (1, 0, 0), "kuning": (1, 0.9, 0), "suspensi": (0.9, 0.7, 0.2),
    "rem": (0.5, 0.3, 0.6), "layar": (0.1, 0.3, 0.5), "buang": (1, 0, 1), "swingarm": (1.0, 0.2, 0.8),
}

BY_ID = {
    "bodi_spakbor_depan": ["r12"],
    "bodi_cover_lampu": ["r39"],
    "bodi_tangki": ["r9", "r10"],
    "bodi_cover_tangki": ["r16"],
    "bodi_cover_samping": ["r27", "r28"],
    "bodi_buntut": ["r29", "r30"],
    "bodi_cover_bawah": ["r56", "r57"],
    "jok": ["r11", "r33"],
    "swingarm": ["r0"],
}
ID_CLASS = {rid: cls for cls, ids in BY_ID.items() for rid in ids}

BY_KEY = {
    ("ban_depan", "ban"): "ban", ("ban_belakang", "ban"): "ban",
    ("ban_depan", "hitam"): "velg", ("ban_belakang", "hitam"): "velg",
    ("body", "warna"): "bodi_tangki",
    ("cakram_belakang", "metal"): "logam",
    ("kaca_lampu", "kaca_lampu"): "lampu",
    ("kaca_lampu", "kaca_sein"): "kaca",
    ("kaca_speedo", "kaca_lcd"): "layar",
    ("kuning", "kuning"): "kuning",
    ("lampu_sein", "sein"): "sein",
    ("merah", "merah"): "merah",
    ("metal", "besi_metal"): "logam",
    ("rangka", "hitam"): "hitam",
    ("rem", "rem"): "rem",
    ("silincer", "silincer"): "knalpot",
    ("standar_samping", "standard"): "hitam",
    ("suspensi", "tabung"): "suspensi",
    ("suspensi", "baut_suspensi"): "logam",
}


def classify_region(r):
    if r.id in ID_CLASS:
        return ID_CLASS[r.id]
    # Huruf merek timbul di cover bawah mesin: dibuang (aturan proyek: tanpa logo/merek asli).
    if (r.key == ("metal", "besi_metal") and r.tris < 400 and -0.05 < r.c[0] < 0.3 and 0.16 < r.c[1] < 0.245
            and 0.12 < abs(r.c[2]) < 0.2 and max(r.mx[a] - r.mn[a] for a in range(3)) < 0.07):
        return None
    return BY_KEY.get(r.key, "hitam")


def classify_tri(cls, r, c, n):
    return cls
