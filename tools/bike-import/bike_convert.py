"""Konversi OBJ motor -> GLB berisi node per bagian (bodi, jok, velg, ban, ...).

Pemakaian: python -I bike_convert.py <config: ninja|gsx> <file.obj> <out.glb> <meta.json>

Mesh dipecah menjadi region (lihat bikelib.segment), lalu aturan di config
menentukan kelas tiap region/segitiga. Koordinat kerja ("ruang debug"): depan
motor +X, Y ke atas dari titik terendah, panjang keseluruhan = 2. Koordinat
keluaran: meter, roda di y = 0, titik asal di tengah jarak sumbu roda.
"""
import sys, os, json, math, importlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bikelib import load_tris, face_normals, segment, region_stats, smooth_normals, GlbWriter

sys.stdout.reconfigure(encoding="utf-8")
cfg = importlib.import_module("cfg_" + sys.argv[1])
obj_path, out_glb, out_meta = sys.argv[2:5]

pos, tris, keys = load_tris(obj_path, cfg.DIGITS)
normals, areas = face_normals(pos, tris)
labels = segment(tris, keys, normals, cfg.CREASE)
by_label = {}
for t, l in enumerate(labels):
    by_label.setdefault(l, []).append(t)
ordered = sorted(by_label.values(), key=lambda ids: -sum(areas[t] for t in ids))

# --- ruang debug (sama dengan debug_glb.py supaya id region cocok) ---
mn = [min(p[a] for p in pos) for a in range(3)]
mx = [max(p[a] for p in pos) for a in range(3)]
s = 2.0 / (mx[2] - mn[2])
cx, cz = (mn[0] + mx[0]) / 2, (mn[2] + mx[2]) / 2
dpos = [(-(p[2] - cz) * s, (p[1] - mn[1]) * s, (p[0] - cx) * s) for p in pos]
dnorm = [(-n[2], n[1], n[0]) for n in normals]
dareas = [a * s * s for a in areas]

W = cfg.WHEELS  # {"depan": (x, y), "belakang": (x, y), "z": zc, "radius": r}


class Region:
    pass


regions = []
big = 0
for ids in ordered:
    st = region_stats(dpos, tris, dareas, dnorm, ids)
    r = Region()
    r.ids = ids
    if len(ids) >= cfg.MIN_TRIS:
        r.id = "r%d" % big
        big += 1
    else:
        r.id = None
    r.key = keys[ids[0]]
    r.tris, r.area = st["tris"], st["area"]
    r.c, r.mn, r.mx, r.n = st["centroid"], st["min"], st["max"], st["normal"]
    nl = math.sqrt(sum(v * v for v in r.n))
    r.flat = nl  # 1 = datar sempurna, 0 = tertutup/melingkar
    # metrik roda: jarak terjauh vertex dari sumbu roda terdekat
    r.wheel = None
    for name in ("depan", "belakang"):
        wx, wy = W[name]
        maxr = 0.0
        for t in ids:
            for v in tris[t]:
                p = dpos[v]
                d = math.hypot(p[0] - wx, p[1] - wy)
                if d > maxr:
                    maxr = d
        if maxr <= W["radius"] * 1.06:
            r.wheel = name
            r.maxr = maxr
            r.offc = math.hypot(r.c[0] - wx, r.c[1] - wy)
            r.zlo, r.zhi = r.mn[2] - W["z"], r.mx[2] - W["z"]
    regions.append(r)

# --- klasifikasi ---
classes = {}  # nama kelas -> list (tri, )
counts = {}
for r in regions:
    cls = cfg.classify_region(r)
    if cls is None:
        counts["(dibuang)"] = counts.get("(dibuang)", 0) + len(r.ids)
        continue
    for t in r.ids:
        a, b, c = tris[t]
        ctr = tuple((dpos[a][i] + dpos[b][i] + dpos[c][i]) / 3 for i in range(3))
        final = cfg.classify_tri(cls, r, ctr, dnorm[t])
        if final is None:
            continue
        classes.setdefault(final, []).append(t)
for k, v in classes.items():
    counts[k] = len(v)

# --- ruang keluaran (meter) ---
wb_debug = W["depan"][0] - W["belakang"][0]
k = cfg.WHEELBASE_M / wb_debug
x0 = (W["depan"][0] + W["belakang"][0]) / 2
z0 = W["z"]


def out_pos(p):
    return (round((p[0] - x0) * k, 5), round(p[1] * k, 5), round((p[2] - z0) * k, 5))


# Area decal: kotak pembatas semua bagian bodi dilihat dari samping. UV bagian
# bodi = proyeksi samping ke kotak ini (u: belakang -> depan, v: atas -> bawah),
# sama untuk sisi kiri dan kanan, sehingga desain decal tercermin rapi.
bx = [1e9, -1e9]
by = [1e9, -1e9]
for cls, ids in classes.items():
    if cls.startswith("bodi_"):
        for t in ids:
            for v in tris[t]:
                p = out_pos(dpos[v])
                bx = [min(bx[0], p[0]), max(bx[1], p[0])]
                by = [min(by[0], p[1]), max(by[1], p[1])]


def decal_uv(p):
    return (round((p[0] - bx[0]) / (bx[1] - bx[0]), 5), round(1.0 - (p[1] - by[0]) / (by[1] - by[0]), 5))


w = GlbWriter()
meta = {"wheelbase": cfg.WHEELBASE_M, "parts": {}, "wheels": {}, "decalArea": {"x": [round(v, 3) for v in bx], "y": [round(v, 3) for v in by]}}
for name in ("depan", "belakang"):
    meta["wheels"][name] = [round((W[name][0] - x0) * k, 4), round(W[name][1] * k, 4), 0.0]
meta["wheelRadius"] = round(W["radius"] * k, 4)
allmn, allmx = [1e9] * 3, [-1e9] * 3
for cls in sorted(classes):
    ids = classes[cls]
    sn = smooth_normals(tris, dnorm, dareas, ids, cfg.SMOOTH_DEG)
    corners = []
    pmn, pmx = [1e9] * 3, [-1e9] * 3
    for t in ids:
        for j, v in enumerate(tris[t]):
            p = out_pos(dpos[v])
            corners.append((p, sn[t][j], decal_uv(p)) if cls.startswith("bodi_") else (p, sn[t][j]))
            for a in range(3):
                pmn[a] = min(pmn[a], p[a]); pmx[a] = max(pmx[a], p[a])
    col = cfg.DEBUG_COLORS.get(cls.split("_")[0], (0.5, 0.5, 0.5))
    if cls.startswith("bodi_"):
        h = (sum(ord(ch) for ch in cls) * 0.61803398875) % 1.0
        import colorsys
        col = colorsys.hsv_to_rgb(h, 0.75, 0.95)
    m = w.material(cls, col)
    w.node(cls, [w.primitive(corners, m)])
    meta["parts"][cls] = {"tris": len(ids), "min": [round(v, 3) for v in pmn], "max": [round(v, 3) for v in pmx]}
    for a in range(3):
        allmn[a] = min(allmn[a], pmn[a]); allmx[a] = max(allmx[a], pmx[a])
meta["min"], meta["max"] = [round(v, 3) for v in allmn], [round(v, 3) for v in allmx]
size = w.save(out_glb, cfg.NAME)
with open(out_meta, "w", encoding="utf-8") as f:
    json.dump(meta, f, indent=1)
# json kosong supaya penampil debug tidak gagal memuat label
with open(os.path.splitext(out_glb)[0] + ".json", "w", encoding="utf-8") as f:
    json.dump([], f)
print(cfg.NAME, "glb", size, "bytes; skala", round(k, 4), "ukuran (m)", [round(allmx[a] - allmn[a], 3) for a in range(3)])
for cls in sorted(counts):
    print("  %-26s %6d tris" % (cls, counts[cls]))
