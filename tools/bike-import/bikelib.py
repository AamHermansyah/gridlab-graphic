"""Segmentasi mesh motor (OBJ) menjadi region + penulis GLB sederhana."""
import json, math, struct


def load_tris(path, digits):
    """Baca OBJ, satukan vertex berposisi sama, triangulasi. Hasil: pos, tris, keys.

    tris[i] = (a, b, c) indeks posisi; keys[i] = (grup, material)."""
    pos, index, vmap = [], {}, []
    tris, keys = [], []
    group, mat = "", ""
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            if line.startswith("v "):
                p = line.split()
                v = (float(p[1]), float(p[2]), float(p[3]))
                k = (round(v[0], digits), round(v[1], digits), round(v[2], digits))
                i = index.get(k)
                if i is None:
                    i = index[k] = len(pos)
                    pos.append(v)
                vmap.append(i)
            elif line.startswith("f "):
                ids = []
                for tok in line.split()[1:]:
                    vi = int(tok.split("/")[0])
                    ids.append(vmap[vi - 1 if vi > 0 else len(vmap) + vi])
                for j in range(1, len(ids) - 1):
                    a, b, c = ids[0], ids[j], ids[j + 1]
                    if a != b and b != c and a != c:
                        tris.append((a, b, c))
                        keys.append((group, mat))
            elif line.startswith("o ") or line.startswith("g "):
                group = line[2:].strip()
            elif line.startswith("usemtl "):
                mat = line[7:].strip()
    return pos, tris, keys


def face_normals(pos, tris):
    """Normal satuan + luas tiap segitiga."""
    normals, areas = [], []
    for a, b, c in tris:
        pa, pb, pc = pos[a], pos[b], pos[c]
        ux, uy, uz = pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]
        vx, vy, vz = pc[0] - pa[0], pc[1] - pa[1], pc[2] - pa[2]
        nx, ny, nz = uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx
        l = math.sqrt(nx * nx + ny * ny + nz * nz)
        if l > 1e-20:
            normals.append((nx / l, ny / l, nz / l))
        else:
            normals.append((0.0, 1.0, 0.0))
        areas.append(l / 2)
    return normals, areas


def segment(tris, keys, normals, crease_deg=None, two_sided=True):
    """Gabungkan segitiga bertetangga (berbagi edge) menjadi region.

    Segitiga hanya digabung bila grup/materialnya sama dan, jika crease_deg
    diisi, sudut antar-normalnya di bawah batas itu. Hasil: label region per segitiga."""
    parent = list(range(len(tris)))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    edges = {}
    for t, (a, b, c) in enumerate(tris):
        for e in ((a, b), (b, c), (c, a)):
            k = e if e[0] < e[1] else (e[1], e[0])
            edges.setdefault(k, []).append(t)
    cos_t = math.cos(math.radians(crease_deg)) if crease_deg is not None else None
    for ts in edges.values():
        if len(ts) < 2:
            continue
        for i in range(len(ts) - 1):
            t1, t2 = ts[i], ts[i + 1]
            if keys[t1] != keys[t2]:
                continue
            if cos_t is not None:
                n1, n2 = normals[t1], normals[t2]
                d = n1[0] * n2[0] + n1[1] * n2[1] + n1[2] * n2[2]
                if two_sided:
                    d = abs(d)
                if d < cos_t:
                    continue
            r1, r2 = find(t1), find(t2)
            if r1 != r2:
                parent[r1] = r2
    return [find(t) for t in range(len(tris))]


def region_stats(pos, tris, areas, normals, ids):
    mn, mx = [1e18] * 3, [-1e18] * 3
    c = [0.0, 0.0, 0.0]
    n = [0.0, 0.0, 0.0]
    total = 0.0
    for t in ids:
        w = areas[t]
        total += w
        for v in tris[t]:
            p = pos[v]
            for a in range(3):
                if p[a] < mn[a]:
                    mn[a] = p[a]
                if p[a] > mx[a]:
                    mx[a] = p[a]
                c[a] += p[a] * w / 3
        for a in range(3):
            n[a] += normals[t][a] * w
    total = total or 1e-12
    return {
        "tris": len(ids), "area": total, "min": mn, "max": mx,
        "centroid": [c[a] / total for a in range(3)],
        "normal": [n[a] / total for a in range(3)],
    }


def smooth_normals(tris, normals, areas, ids, smooth_deg=45):
    """Normal per sudut: rata-rata normal segitiga tetangga (dalam ids) yang arahnya mirip."""
    cos_t = math.cos(math.radians(smooth_deg))
    fan = {}
    for t in ids:
        for v in tris[t]:
            fan.setdefault(v, []).append(t)
    out = {}
    for t in ids:
        n0 = normals[t]
        res = []
        for v in tris[t]:
            sx = sy = sz = 0.0
            for u in fan[v]:
                n = normals[u]
                if n[0] * n0[0] + n[1] * n0[1] + n[2] * n0[2] >= cos_t:
                    w = areas[u]
                    sx += n[0] * w; sy += n[1] * w; sz += n[2] * w
            l = math.sqrt(sx * sx + sy * sy + sz * sz)
            res.append((sx / l, sy / l, sz / l) if l > 1e-20 else n0)
        out[t] = res
    return out


class GlbWriter:
    """Penulis GLB minimal: mesh berindeks dengan POSITION + NORMAL, material warna polos."""

    def __init__(self):
        self.chunks, self.length = [], 0
        self.views, self.accessors, self.meshes, self.nodes, self.materials = [], [], [], [], []
        self.roots = []

    def _view(self, data, target):
        pad = (-len(data)) % 4
        self.views.append({"buffer": 0, "byteOffset": self.length, "byteLength": len(data), "target": target})
        self.chunks.append(data + b"\0" * pad)
        self.length += len(data) + pad
        return len(self.views) - 1

    def material(self, name, color=(0.8, 0.8, 0.8), metallic=0.0, roughness=0.6, extra=None):
        m = {"name": name, "pbrMetallicRoughness": {"baseColorFactor": [color[0], color[1], color[2], 1.0], "metallicFactor": metallic, "roughnessFactor": roughness}}
        if extra:
            m.update(extra)
        self.materials.append(m)
        return len(self.materials) - 1

    def primitive(self, corners, material):
        """corners: list (pos, normal) atau (pos, normal, uv), kelipatan 3."""
        vmap, P, N, T, I = {}, [], [], [], []
        has_uv = len(corners[0]) == 3
        for corner in corners:
            p, n = corner[0], corner[1]
            k = (p, (round(n[0], 3), round(n[1], 3), round(n[2], 3)))
            i = vmap.get(k)
            if i is None:
                i = vmap[k] = len(P) // 3
                P.extend(p); N.extend(n)
                if has_uv:
                    T.extend(corner[2])
            I.append(i)
        count = len(P) // 3
        mn = [min(P[a::3]) for a in range(3)]
        mx = [max(P[a::3]) for a in range(3)]
        a0 = len(self.accessors)
        self.accessors.append({"bufferView": self._view(struct.pack("<%df" % len(P), *P), 34962), "componentType": 5126, "count": count, "type": "VEC3", "min": mn, "max": mx})
        self.accessors.append({"bufferView": self._view(struct.pack("<%df" % len(N), *N), 34962), "componentType": 5126, "count": count, "type": "VEC3"})
        if count < 65536:
            self.accessors.append({"bufferView": self._view(struct.pack("<%dH" % len(I), *I), 34963), "componentType": 5123, "count": len(I), "type": "SCALAR"})
        else:
            self.accessors.append({"bufferView": self._view(struct.pack("<%dI" % len(I), *I), 34963), "componentType": 5125, "count": len(I), "type": "SCALAR"})
        prim = {"attributes": {"POSITION": a0, "NORMAL": a0 + 1}, "indices": a0 + 2, "material": material}
        if has_uv:
            self.accessors.append({"bufferView": self._view(struct.pack("<%df" % len(T), *T), 34962), "componentType": 5126, "count": count, "type": "VEC2"})
            prim["attributes"]["TEXCOORD_0"] = len(self.accessors) - 1
        return prim

    def node(self, name, primitives, parent=None, extras=None):
        self.meshes.append({"name": name, "primitives": primitives})
        n = {"name": name, "mesh": len(self.meshes) - 1}
        if extras:
            n["extras"] = extras
        self.nodes.append(n)
        i = len(self.nodes) - 1
        if parent is None:
            self.roots.append(i)
        else:
            self.nodes[parent].setdefault("children", []).append(i)
        return i

    def group(self, name, parent=None, extras=None):
        n = {"name": name}
        if extras:
            n["extras"] = extras
        self.nodes.append(n)
        i = len(self.nodes) - 1
        if parent is None:
            self.roots.append(i)
        else:
            self.nodes[parent].setdefault("children", []).append(i)
        return i

    def save(self, path, name="Motor"):
        gltf = {
            "asset": {"version": "2.0", "generator": "gridlab obj converter"},
            "scene": 0, "scenes": [{"name": name, "nodes": self.roots}],
            "nodes": self.nodes, "meshes": self.meshes, "materials": self.materials,
            "accessors": self.accessors, "bufferViews": self.views, "buffers": [{"byteLength": self.length}],
        }
        js = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
        js += b" " * ((-len(js)) % 4)
        binb = b"".join(self.chunks)
        with open(path, "wb") as f:
            f.write(struct.pack("<4sII", b"glTF", 2, 12 + 8 + len(js) + 8 + len(binb)))
            f.write(struct.pack("<I4s", len(js), b"JSON")); f.write(js)
            f.write(struct.pack("<I4s", len(binb), b"BIN\0")); f.write(binb)
        return 20 + len(js) + 8 + len(binb)
