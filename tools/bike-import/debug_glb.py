"""GLB debug: tiap region diberi warna berbeda + regions.json untuk pelabelan.

Pemakaian: python -I debug_glb.py <obj> <out_prefix> <digits> <crease_deg|none> <min_tris>
"""
import sys, os, json, colorsys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bikelib import load_tris, face_normals, segment, region_stats, smooth_normals, GlbWriter

sys.stdout.reconfigure(encoding="utf-8")
obj, prefix, digits, crease, min_tris = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4], int(sys.argv[5])
crease = None if crease == "none" else float(crease)
pos, tris, keys = load_tris(obj, digits)
normals, areas = face_normals(pos, tris)
labels = segment(tris, keys, normals, crease)
regions = {}
for t, l in enumerate(labels):
    regions.setdefault(l, []).append(t)
ordered = sorted(regions.values(), key=lambda ids: -sum(areas[t] for t in ids))
big = [ids for ids in ordered if len(ids) >= min_tris]
small = [t for ids in ordered if len(ids) < min_tris for t in ids]
print("tris", len(tris), "region", len(ordered), "besar", len(big), "tris kecil", len(small))

# Normalisasi: depan (-Z) -> +X, panjang = 2, roda di y = 0, pusat di tengah
mn = [min(p[a] for p in pos) for a in range(3)]
mx = [max(p[a] for p in pos) for a in range(3)]
s = 2.0 / (mx[2] - mn[2])
cx, cz = (mn[0] + mx[0]) / 2, (mn[2] + mx[2]) / 2


def xf(p):
    return (-(p[2] - cz) * s, (p[1] - mn[1]) * s, (p[0] - cx) * s)


def xn(n):
    return (-n[2], n[1], n[0])


w = GlbWriter()
info = []
for i, ids in enumerate(big + ([small] if small else [])):
    is_rest = i == len(big)
    h = (i * 0.61803398875) % 1.0
    col = (0.25, 0.25, 0.25) if is_rest else colorsys.hsv_to_rgb(h, 0.55 + 0.4 * ((i * 7) % 3) / 2, 0.95 - 0.35 * ((i * 5) % 4) / 3)
    m = w.material("r%d" % i, col)
    sn = smooth_normals(tris, normals, areas, ids)
    corners = []
    for t in ids:
        for j, v in enumerate(tris[t]):
            corners.append((xf(pos[v]), xn(sn[t][j])))
    name = "rest" if is_rest else "r%d" % i
    w.node(name, [w.primitive(corners, m)])
    st = region_stats(pos, tris, areas, normals, ids)
    info.append({
        "id": name, "key": list(keys[ids[0]]), "tris": st["tris"], "area": round(st["area"] * s * s, 4),
        "centroid": [round(v, 3) for v in xf(st["centroid"])],
        "min": [round(v, 3) for v in (min(xf(st["min"])[0], xf(st["max"])[0]), xf(st["min"])[1], min(xf(st["min"])[2], xf(st["max"])[2]))],
        "max": [round(v, 3) for v in (max(xf(st["min"])[0], xf(st["max"])[0]), xf(st["max"])[1], max(xf(st["min"])[2], xf(st["max"])[2]))],
        "normal": [round(v, 2) for v in xn(st["normal"])],
        "color": [round(c, 3) for c in col],
    })
size = w.save(prefix + ".glb")
with open(prefix + ".json", "w", encoding="utf-8") as f:
    json.dump(info, f)
print("glb", size, "bytes; region tertulis", len(info))
for r in info[:80]:
    print(r["id"], r["key"], "tris", r["tris"], "area", r["area"], "c", r["centroid"], "min", r["min"], "max", r["max"], "n", r["normal"])
