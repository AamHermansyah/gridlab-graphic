"""Aturan pembagian bagian untuk kawasaki-ninja.obj (satu mesh tanpa grup/material).

Id region (rN) berasal dari segmentasi crease 22 derajat; lihat debug_glb.py.
"""
NAME = "Ninja"
DIGITS = 4
CREASE = 22
MIN_TRIS = 12
SMOOTH_DEG = 50
WHEELBASE_M = 1.39  # sport 600 cc berfairing penuh

WHEELS = {"depan": (0.724, 0.277), "belakang": (-0.675, 0.295), "z": -0.012, "radius": 0.29}
RIM_HALF_WIDTH = {"depan": 0.052, "belakang": 0.078}

DEBUG_COLORS = {
    "ban": (0.05, 0.05, 0.05), "velg": (0.9, 0.75, 0.1), "cakram": (0.7, 0.7, 0.75), "jok": (0.35, 0.2, 0.1),
    "rangka": (0.6, 0.62, 0.66), "swingarm": (1.0, 0.2, 0.8), "knalpot": (0.8, 0.5, 0.3), "mekanik": (0.2, 0.2, 0.22), "lampu": (1, 1, 0.8),
    "visor": (0.2, 0.9, 0.9),
}

BY_ID = {
    "bodi_cowl_depan": ["r0", "r44", "r71", "r83", "r87", "r77", "r79"],
    "bodi_fairing_samping": ["r4", "r6", "r45"],
    "bodi_tangki": ["r5"],
    "bodi_cover_tengah": ["r7"],
    "bodi_buntut": ["r2", "r30", "r43", "r52", "r67", "r106", "r109"],
    "bodi_spakbor_depan": ["r49", "r50", "r91"],
    "jok": ["r15"],
    "rangka": ["r9", "r10"],
    "swingarm": ["r24", "r31", "r17", "r41"],
    "knalpot": ["r16", "r19"],
    "lampu": ["r74", "r78", "r96", "r97"],
    "logam": ["r94"],
}
ID_CLASS = {rid: cls for cls, ids in BY_ID.items() for rid in ids}


def classify_region(r):
    if r.id in ID_CLASS:
        return ID_CLASS[r.id]
    if r.wheel:
        half = RIM_HALF_WIDTH[r.wheel]
        centered = r.offc < 0.03
        if centered and r.maxr > 0.262 and r.zlo > -0.12 and r.zhi < 0.12:
            return "ban"
        if r.flat > 0.9 and r.maxr < 0.17 and centered:
            return "cakram"
        if r.zlo > -half and r.zhi < half and r.maxr < 0.245:
            return "velg"
        if centered and r.flat > 0.9 and r.maxr < 0.255:
            return "velg"  # sisi pelek yang datar
    return "mekanik"


def classify_tri(cls, r, c, n):
    if cls == "bodi_cowl_depan":
        # Bagian atas cowl adalah kaca depan (visor)
        if c[0] < 0.83 and c[1] > 0.79 + 0.2 * (0.808 - c[0]):
            return "visor"
    if cls == "bodi_cover_tengah" and n[1] > 0.2 and abs(c[2] - WHEELS["z"]) < 0.115 and c[1] > 0.6:
        return "jok"  # permukaan atas bagian tengah = jok pengendara
    return cls
