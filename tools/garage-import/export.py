"""Konversi 'Auto Workshop.blend' -> garage.glb (geometri + material) + daftar pekerjaan tekstur.

Pemakaian: python -I export.py <file.blend> <folder_tekstur_sumber> <folder_keluaran>
Tekstur direferensikan sebagai file eksternal textures/*.webp (dibuat oleh build-textures.js).
"""
import sys, os, struct, json, math, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blend import Blend

sys.stdout.reconfigure(encoding="utf-8")
blend_path, texdir, outdir = sys.argv[1:4]
os.makedirs(outdir, exist_ok=True)
os.makedirs(os.path.join(outdir, "packed"), exist_ok=True)
bf = Blend(blend_path)
D = bf.d

SMOOTH_ANGLE = math.radians(30)  # bawaan modifier "Smooth by Angle"


# ---------- util vektor ----------
def sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def cross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
def dot(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
def norm(a):
    l = math.sqrt(dot(a, a))
    return (a[0] / l, a[1] / l, a[2] / l) if l > 1e-20 else (0.0, 0.0, 1.0)


def euler_matrix(rx, ry, rz):
    cx, sx, cy, sy, cz, sz = math.cos(rx), math.sin(rx), math.cos(ry), math.sin(ry), math.cos(rz), math.sin(rz)
    # R = Rz * Ry * Rx (euler XYZ Blender)
    return (
        (cy * cz, sx * sy * cz - cx * sz, cx * sy * cz + sx * sz),
        (cy * sz, sx * sy * sz + cx * cz, cx * sy * sz - sx * cz),
        (-sy, sx * cy, cx * cy),
    )


# ---------- data mesh ----------
def layers(mesh, cd):
    c = mesh[cd]
    b = bf.by_ptr.get(c["layers"])
    out = {}
    if not b:
        return out
    for i in range(c["totlayer"]):
        l = bf.view(b, i)
        r = bf.raw(l["data"])
        if r:
            out.setdefault((l["type"], l["name"]), r)
    return out


def arr(r, fmt, n):
    return struct.unpack_from("<%d%s" % (n, fmt), D, r[0])


def read_mesh(mesh):
    nv, nf, nc = mesh["totvert"], mesh["totpoly"], mesh["totloop"]
    if nf == 0:
        return None
    vl, el, pl, ll = (layers(mesh, k) for k in ("vdata", "edata", "pdata", "ldata"))
    pos = arr(vl[(48, "position")], "f", nv * 3)
    cv = arr(ll[(11, ".corner_vert")], "i", nc)
    ce = arr(ll[(11, ".corner_edge")], "i", nc)
    offs = arr(bf.raw(mesh["poly_offset_indices"]), "i", nf + 1)
    uv = None
    for (t, name), r in ll.items():
        if t == 49:
            uv = arr(r, "f", nc * 2)
            break
    sharp_face = D[pl[(50, "sharp_face")][0]:][:nf] if (50, "sharp_face") in pl else None
    ne = mesh["totedge"]
    sharp_edge = D[el[(50, "sharp_edge")][0]:][:ne] if (50, "sharp_edge") in el else None
    mat_idx = arr(pl[(11, "material_index")], "i", nf) if (11, "material_index") in pl else None
    return dict(nv=nv, nf=nf, nc=nc, pos=pos, cv=cv, ce=ce, offs=offs, uv=uv,
                sharp_face=sharp_face, sharp_edge=sharp_edge, mat_idx=mat_idx)


def triangulate(pts, n):
    """Ear clipping untuk n-gon; pts = posisi 3D per sudut, n = normal face. Hasil: indeks lokal."""
    k = len(pts)
    if k == 3:
        return [(0, 1, 2)]
    if k == 4:
        return [(0, 1, 2), (0, 2, 3)]
    ax = max(range(3), key=lambda i: abs(n[i]))
    u, v = [(1, 2), (2, 0), (0, 1)][ax]
    sgn = 1.0 if n[ax] >= 0 else -1.0
    p2 = [(p[u] * sgn, p[v]) for p in pts]
    idx = list(range(k))
    tris = []

    def area(a, b, c):
        return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])

    guard = 0
    while len(idx) > 3 and guard < 10000:
        guard += 1
        m = len(idx)
        done = False
        for i in range(m):
            ia, ib, ic = idx[i - 1], idx[i], idx[(i + 1) % m]
            a, b, c = p2[ia], p2[ib], p2[ic]
            if area(a, b, c) <= 1e-12:
                continue
            ok = True
            for j in idx:
                if j in (ia, ib, ic):
                    continue
                p = p2[j]
                if area(a, b, p) >= -1e-12 and area(b, c, p) >= -1e-12 and area(c, a, p) >= -1e-12:
                    ok = False
                    break
            if ok:
                tris.append((ia, ib, ic))
                idx.pop(i)
                done = True
                break
        if not done:  # poligon bermasalah: kipas biasa
            for i in range(1, len(idx) - 1):
                tris.append((idx[0], idx[i], idx[i + 1]))
            return tris
    tris.append(tuple(idx))
    return tris


def build_object(o, mesh, md, smooth_by_angle):
    """Hasil: {slot_material: [segitiga -> 3 x (pos, normal, uv)]} dalam koordinat three.js."""
    R = euler_matrix(*o["rot"])
    S = o["size"]
    L = o["loc"]

    def xf(i):
        x, y, z = md["pos"][3 * i] * S[0], md["pos"][3 * i + 1] * S[1], md["pos"][3 * i + 2] * S[2]
        wx = R[0][0] * x + R[0][1] * y + R[0][2] * z + L[0]
        wy = R[1][0] * x + R[1][1] * y + R[1][2] * z + L[1]
        wz = R[2][0] * x + R[2][1] * y + R[2][2] * z + L[2]
        return (wx, wz, -wy)  # Z-up Blender -> Y-up three.js

    wpos = [xf(i) for i in range(md["nv"])]
    cv, ce, offs, nf = md["cv"], md["ce"], md["offs"], md["nf"]

    # Normal face (Newell) + luas
    fn = []
    for f in range(nf):
        a, b = offs[f], offs[f + 1]
        nx = ny = nz = 0.0
        for c in range(a, b):
            p = wpos[cv[c]]
            q = wpos[cv[c + 1 if c + 1 < b else a]]
            nx += (p[1] - q[1]) * (p[2] + q[2])
            ny += (p[2] - q[2]) * (p[0] + q[0])
            nz += (p[0] - q[0]) * (p[1] + q[1])
        fn.append((nx, ny, nz))  # panjang = 2 x luas
    fnu = [norm(n) for n in fn]

    # Kelompok penghalusan per sudut (union-find lewat edge yang tidak tajam)
    parent = list(range(md["nc"]))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    corner_face = [0] * md["nc"]
    fan = {}
    for f in range(nf):
        a, b = offs[f], offs[f + 1]
        for c in range(a, b):
            corner_face[c] = f
            prev = c - 1 if c > a else b - 1
            v = cv[c]
            fan.setdefault((v, ce[c]), []).append(c)
            fan.setdefault((v, ce[prev]), []).append(c)
    sf, se = md["sharp_face"], md["sharp_edge"]
    cos_t = math.cos(SMOOTH_ANGLE)
    for (v, e), cs in fan.items():
        if len(cs) != 2:
            continue
        if se is not None and se[e]:
            continue
        f1, f2 = corner_face[cs[0]], corner_face[cs[1]]
        if sf is not None and (sf[f1] or sf[f2]):
            continue
        if smooth_by_angle and dot(fnu[f1], fnu[f2]) < cos_t:
            continue
        r1, r2 = find(cs[0]), find(cs[1])
        if r1 != r2:
            parent[r1] = r2
    acc = {}
    for c in range(md["nc"]):
        r = find(c)
        n = fn[corner_face[c]]
        s = acc.get(r)
        acc[r] = n if s is None else (s[0] + n[0], s[1] + n[1], s[2] + n[2])
    cnorm = {r: norm(n) for r, n in acc.items()}

    uv = md["uv"]
    out = {}
    for f in range(nf):
        a, b = offs[f], offs[f + 1]
        slot = md["mat_idx"][f] if md["mat_idx"] else 0
        pts = [wpos[cv[c]] for c in range(a, b)]
        for tri in triangulate(pts, fnu[f]):
            verts = []
            for li in tri:
                c = a + li
                t = (uv[2 * c], 1.0 - uv[2 * c + 1]) if uv else (0.0, 0.0)
                verts.append((wpos[cv[c]], cnorm[find(c)], t))
            out.setdefault(slot, []).append(verts)
    return out


# ---------- material ----------
def img_base(idv):
    return idv["name"].replace("\\", "/").split("/")[-1]


def material_info(m):
    nt = m.ptr("nodetree")
    info = {"name": m.name}
    if not nt:
        return info
    nodes = {n.off: n for n in nt.listbase("nodes")}
    links = []
    for l in nt.listbase("links"):
        fn, tn, fs, ts = l.ptr("fromnode"), l.ptr("tonode"), l.ptr("fromsock"), l.ptr("tosock")
        if fn and tn and fs and ts:
            links.append((fn.off, fs["name"], tn.off, ts["name"], ts["identifier"]))

    def src(node_off, sock):
        for fo, fsn, to, tsn, tsi in links:
            if to == node_off and (tsn == sock or tsi == sock):
                return fo, fsn
        return None

    def trace(node_off, sock):
        s = src(node_off, sock)
        if not s:
            return None
        n = nodes[s[0]]
        idn = n["idname"]
        if idn == "ShaderNodeTexImage":
            im = n.ptr("id")
            return {"img": img_base(im)} if im else None
        if idn == "ShaderNodeNormalMap":
            return trace(n.off, "Color")
        if idn == "NodeReroute":
            return trace(n.off, "Input")
        if idn == "ShaderNodeMix":
            return {"mix": [trace(n.off, "A_Color"), trace(n.off, "B_Color")]}
        if idn == "ShaderNodeCombineColor":
            return {"combine": [trace(n.off, "Red"), trace(n.off, "Green"), trace(n.off, "Blue")]}
        if idn == "ShaderNodeSeparateColor":
            return {"sep": s[1], "of": trace(n.off, "Color")}
        if idn == "ShaderNodeInvert":
            return {"invert": trace(n.off, "Color")}
        return {"node": idn}

    bsdf = None
    for off, n in nodes.items():
        if n["idname"] == "ShaderNodeOutputMaterial":
            s = src(off, "Surface")
            if s and nodes[s[0]]["idname"] == "ShaderNodeBsdfPrincipled":
                bsdf = nodes[s[0]]
                break
    if bsdf is None:
        return info
    for key, sock in (("color", "Base Color"), ("metal", "Metallic"), ("rough", "Roughness"),
                      ("normal", "Normal"), ("alpha", "Alpha"), ("emission", "Emission Color")):
        info[key] = trace(bsdf.off, sock)
    for s in bsdf.listbase("inputs"):
        if s["name"] in ("Roughness", "Metallic", "Emission Strength"):
            b = bf.by_ptr.get(s["default_value"])
            if b:
                info["v_" + s["name"].lower().replace(" ", "_")] = bf.view(b)["value"]
    return info


def stem(name):
    return re.sub(r"[^A-Za-z0-9_]+", "_", os.path.splitext(name)[0])


jobs = {}  # nama file keluaran -> pekerjaan tekstur
# Atlas poster bawaan memuat karya pihak lain; aplikasi menggantinya dengan atlas sendiri.
NO_COLOR_TEXTURE = {"mat_garage_poster"}


def plan_material(info):
    """Tentukan tekstur glTF untuk satu material + catat pekerjaan konversinya."""
    name = info["name"]
    res = {"name": name}
    color, ao, invert_g = info.get("color"), None, False
    if color and "mix" in color:
        color, ao = color["mix"]
    if color and "combine" in color:
        g = color["combine"][1]
        invert_g = bool(g and "invert" in g)
        inner = color["combine"][0]
        color = inner.get("of") if inner else None
    cimg = color.get("img") if color else None
    if name in NO_COLOR_TEXTURE:
        cimg = None
    aimg = (info.get("alpha") or {}).get("img")
    if cimg:
        out = stem(cimg) + ("_ig" if invert_g else "") + ("_a" if aimg else "") + ".webp"
        jobs[out] = {"kind": "color", "src": cimg, "alpha": aimg, "invertG": invert_g, "mat": name}
        res["color"] = out
    nimg = (info.get("normal") or {}).get("img")
    if nimg:
        out = stem(nimg) + ".webp"
        jobs[out] = {"kind": "normal", "src": nimg, "mat": name}
        res["normal"] = out
    rimg = (info.get("rough") or {}).get("img")
    mimg = (info.get("metal") or {}).get("img")
    aoimg = ao.get("img") if ao else None
    if rimg or mimg or aoimg:
        out = stem(rimg or mimg or aoimg) + "_orm.webp"
        sig = {"kind": "orm", "ao": aoimg, "rough": rimg, "metal": mimg,
               "roughDefault": info.get("v_roughness", 0.5), "mat": name}
        if out in jobs and {k: jobs[out][k] for k in ("ao", "rough", "metal")} != {k: sig[k] for k in ("ao", "rough", "metal")}:
            out = stem(name) + "_orm.webp"
        jobs[out] = sig
        res["orm"] = out
        res["ao"] = bool(aoimg)
    res["roughness"] = info.get("v_roughness", 0.5)
    res["metallic"] = info.get("v_metallic", 0.0)
    eimg = (info.get("emission") or {}).get("img")
    if eimg and info.get("v_emission_strength", 0) > 0 and eimg == cimg:
        res["emissive"] = True
        res["emissiveStrength"] = info.get("v_emission_strength", 1.0)
    if aimg:
        res["alpha"] = True
    return res


# ---------- zona & penataan ulang ----------
# Scene konfigurator berputar 360 derajat dan kameranya sering berada di luar
# ruangan, jadi dinding beserta perabot yang menempel padanya dipisah ke zona
# per sisi supaya bisa disembunyikan saat kamera berada di baliknya.
SPLIT_BY_TRIANGLE = {"prop_garage_wall", "dec_garage_cable", "dec_garage_damage_concrete", "prop_garage_fluorescent_lamp"}
TOP_OBJECTS = {"prop_garage_roof", "prop_garage_wooden_beams"}


def zone_of(base, c, per_triangle):
    """Zona sebuah segitiga dinding (per_triangle) atau sebuah objek utuh (titik tengahnya)."""
    if base in TOP_OBJECTS or c[1] > 3.9:
        return "atas"
    # Dinding dinilai tepat di bidangnya; perabot dinilai lebih longgar karena
    # berdiri agak ke tengah ruangan (rak, meja perkakas, tumpukan ban).
    back, left = (-2.85, -4.9) if per_triangle else (-2.0, -4.4)
    if c[2] > 2.85:
        return "depan"
    if c[2] < back:
        return "belakang"
    if c[0] > 4.5:
        return "kanan"
    if c[0] < left:
        return "kiri"
    return "utama"


# Properti di sisi depan dipindah ke dinding belakang agar tidak menutupi motor.
RELOCATE = {
    "prop_garage_Balanced_Machine": dict(rot=math.pi, to=(-3.3, -2.47)),
    # Drum di model setinggi 1,04 m; diperkecil ke ukuran drum 200 liter asli (0,88 m).
    "prop_garage_barrel_Oil": dict(rot=0.6, to=(4.2, -2.5), scale=0.88 / 1.04),
    # Pelat servis diturunkan 3 cm sehingga nyaris rata lantai: roda motor yang
    # berputar di tempat tidak tampak melayang saat melewati tepi pelat.
    "prop_garage_pit_cover": dict(rot=0.0, to=None, lift=-0.03),
}


def relocate(tris, mn, mx, rot, to, scale=1.0, lift=0.0):
    cx, cz = (mn[0] + mx[0]) / 2, (mn[2] + mx[2]) / 2
    if to is None:
        to = (cx, cz)
    c, s = math.cos(rot), math.sin(rot)

    def r(v, pivot):
        k = scale if pivot else 1.0
        x, z = (v[0] - (cx if pivot else 0)) * k, (v[2] - (cz if pivot else 0)) * k
        y = mn[1] + (v[1] - mn[1]) * k + lift if pivot else v[1]
        return (c * x + s * z + (to[0] if pivot else 0), y, -s * x + c * z + (to[1] if pivot else 0))

    return [[(r(p, True), r(n, False), uv) for p, n, uv in t] for t in tris]


# ---------- kumpulkan objek ----------
mat_infos = {}
groups = {}  # (nama dasar, material) -> list segitiga
report = {"objects": [], "lights": [], "skipped": []}

for o in bf.of_code("OB"):
    name = o.name
    if o["type"] == 10:
        l = o.ptr("data")
        x, y, z = o["loc"]
        report["lights"].append({"name": name, "type": l["type"], "pos": [round(x, 3), round(z, 3), round(-y, 3)],
                                 "energy": l["energy"], "size": [l["area_size"], l["area_sizey"]]})
        continue
    if o["type"] != 1:
        continue
    mesh = o.ptr("data")
    md = read_mesh(mesh) if mesh else None
    if md is None:
        report["skipped"].append([name, "kosong"])
        continue
    if any(abs(v) > 1e-6 for v in o["dloc"] + o["drot"]) or o["rotmode"] != 1 or o["parent"]:
        print("PERINGATAN transform tak didukung:", name)
    mods = [m.sname for m in o.listbase("modifiers")]
    tris_by_slot = build_object(o, mesh, md, "NodesModifierData" in mods)

    # material per slot (objek boleh menimpa slot milik mesh)
    mp, op, ob = bf.raw(mesh["mat"]), bf.raw(o["mat"]), bf.raw(o["matbits"])
    allv = [v[0] for ts in tris_by_slot.values() for t in ts for v in t]
    mn = [min(p[i] for p in allv) for i in range(3)]
    mx = [max(p[i] for p in allv) for i in range(3)]
    if mx[0] < -5.6 or mn[0] > 5.6:
        report["skipped"].append([name, "di luar ruangan"])
        continue
    slot_names = []
    for slot, tris in tris_by_slot.items():
        p = 0
        if ob and slot < ob[1] and D[ob[0] + slot] and op:
            p = struct.unpack_from("<Q", D, op[0] + 8 * slot)[0]
        elif mp and slot * 8 < mp[1]:
            p = struct.unpack_from("<Q", D, mp[0] + 8 * slot)[0]
        m = bf.deref(p)
        mname = m.name if m else "default"
        if m and mname not in mat_infos:
            mat_infos[mname] = material_info(m)
        slot_names.append(mname)
        base = re.sub(r"\.\d+$", "", name)
        if name in RELOCATE:
            tris = relocate(tris, mn, mx, **RELOCATE[name])
        if base in SPLIT_BY_TRIANGLE:
            for t in tris:
                c = [sum(v[0][i] for v in t) / 3 for i in range(3)]
                groups.setdefault((base, mname, zone_of(base, c, True)), []).append(t)
        else:
            # Titik tengah dihitung dari posisi akhir (setelah dipindah, jika ada)
            pts = [v[0] for t in tris for v in t]
            c = [(min(p[i] for p in pts) + max(p[i] for p in pts)) / 2 for i in range(3)]
            groups.setdefault((base, mname, zone_of(base, c, False)), []).extend(tris)
    report["objects"].append({"name": name, "min": [round(v, 3) for v in mn], "max": [round(v, 3) for v in mx],
                              "tris": sum(len(t) for t in tris_by_slot.values()), "mats": slot_names, "mods": mods})

# ---------- tekstur yang hanya ada di dalam .blend ----------
for im in bf.of_code("IM"):
    base = img_base(im)
    if not base or os.path.exists(os.path.join(texdir, base)):
        continue
    for ipf in im.listbase("packedfiles"):
        pf = ipf.ptr("packedfile")
        if pf:
            r = bf.raw(pf["data"])
            if r:
                with open(os.path.join(outdir, "packed", base), "wb") as f:
                    f.write(D[r[0]:r[0] + pf["size"]])
                print("ekstrak packed:", base, pf["size"])
            break

# ---------- tulis GLB ----------
plans = {n: plan_material(i) for n, i in mat_infos.items()}
images, textures, materials, mat_index = [], [], [], {}
tex_index = {}


def tex(out):
    if out not in tex_index:
        images.append({"uri": "textures/" + out, "mimeType": "image/webp"})
        textures.append({"extensions": {"EXT_texture_webp": {"source": len(images) - 1}}})
        tex_index[out] = len(textures) - 1
    return {"index": tex_index[out]}


DOUBLE = ("dec_", "mat_garage_poster", "mat_garage_cable")
for n, p in plans.items():
    pbr = {"metallicFactor": p["metallic"], "roughnessFactor": p["roughness"]}
    m = {"name": n, "pbrMetallicRoughness": pbr, "doubleSided": n.startswith(DOUBLE)}
    if "color" in p:
        pbr["baseColorTexture"] = tex(p["color"])
    if "orm" in p:
        pbr["metallicRoughnessTexture"] = tex(p["orm"])
        pbr["metallicFactor"] = 1.0
        pbr["roughnessFactor"] = 1.0
        if p.get("ao"):
            m["occlusionTexture"] = tex(p["orm"])
    if "normal" in p:
        m["normalTexture"] = tex(p["normal"])
    if p.get("emissive"):
        m["emissiveTexture"] = tex(p["color"])
        m["emissiveFactor"] = [1.0, 1.0, 1.0]
    if p.get("alpha"):
        m["alphaMode"] = "MASK" if "cable" in n else "BLEND"
    mat_index[n] = len(materials)
    materials.append(m)

bin_chunks = []
bin_len = 0
views, accessors, meshes, nodes = [], [], [], []


def add_view(data, target):
    global bin_len
    pad = (-len(data)) % 4
    views.append({"buffer": 0, "byteOffset": bin_len, "byteLength": len(data), "target": target})
    bin_chunks.append(data + b"\0" * pad)
    bin_len += len(data) + pad
    return len(views) - 1


by_node = {}
for (base, mname, zone), tris in groups.items():
    vmap, P, N, T, I = {}, [], [], [], []
    for t in tris:
        for pos, nrm, uv in t:
            key = (round(pos[0], 5), round(pos[1], 5), round(pos[2], 5), round(nrm[0], 3), round(nrm[1], 3), round(nrm[2], 3), round(uv[0], 5), round(uv[1], 5))
            i = vmap.get(key)
            if i is None:
                i = vmap[key] = len(P) // 3
                P.extend(pos); N.extend(nrm); T.extend(uv)
            I.append(i)
    nvert = len(P) // 3
    mn = [min(P[i::3]) for i in range(3)]
    mx = [max(P[i::3]) for i in range(3)]
    a0 = len(accessors)
    accessors.append({"bufferView": add_view(struct.pack("<%df" % len(P), *P), 34962), "componentType": 5126, "count": nvert, "type": "VEC3", "min": mn, "max": mx})
    accessors.append({"bufferView": add_view(struct.pack("<%df" % len(N), *N), 34962), "componentType": 5126, "count": nvert, "type": "VEC3"})
    accessors.append({"bufferView": add_view(struct.pack("<%df" % len(T), *T), 34962), "componentType": 5126, "count": nvert, "type": "VEC2"})
    if nvert < 65536:
        accessors.append({"bufferView": add_view(struct.pack("<%dH" % len(I), *I), 34963), "componentType": 5123, "count": len(I), "type": "SCALAR"})
    else:
        accessors.append({"bufferView": add_view(struct.pack("<%dI" % len(I), *I), 34963), "componentType": 5125, "count": len(I), "type": "SCALAR"})
    prim = {"attributes": {"POSITION": a0, "NORMAL": a0 + 1, "TEXCOORD_0": a0 + 2}, "indices": a0 + 3}
    if mname in mat_index:
        prim["material"] = mat_index[mname]
    by_node.setdefault((zone, base), []).append(prim)

zone_children = {}
for (zone, base), prims in by_node.items():
    meshes.append({"name": base, "primitives": prims})
    nodes.append({"name": base, "mesh": len(meshes) - 1})
    zone_children.setdefault(zone, []).append(len(nodes) - 1)
roots = []
for zone, children in zone_children.items():
    nodes.append({"name": "zona_" + zone, "children": children})
    roots.append(len(nodes) - 1)

gltf = {
    "asset": {"version": "2.0", "generator": "gridlab blend converter"},
    "extensionsUsed": ["EXT_texture_webp"], "extensionsRequired": ["EXT_texture_webp"],
    "scene": 0, "scenes": [{"name": "Garage", "nodes": roots}],
    "nodes": nodes, "meshes": meshes, "materials": materials, "textures": textures, "images": images,
    "accessors": accessors, "bufferViews": views, "buffers": [{"byteLength": bin_len}],
}
js = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
js += b" " * ((-len(js)) % 4)
binb = b"".join(bin_chunks)
with open(os.path.join(outdir, "garage.glb"), "wb") as f:
    f.write(struct.pack("<4sII", b"glTF", 2, 12 + 8 + len(js) + 8 + len(binb)))
    f.write(struct.pack("<I4s", len(js), b"JSON")); f.write(js)
    f.write(struct.pack("<I4s", len(binb), b"BIN\0")); f.write(binb)

report["materials"] = mat_infos
report["plans"] = plans
with open(os.path.join(outdir, "texture-jobs.json"), "w", encoding="utf-8") as f:
    json.dump(jobs, f, indent=1)
with open(os.path.join(outdir, "report.json"), "w", encoding="utf-8") as f:
    json.dump(report, f, indent=1)
print("nodes", len(nodes), "prims", sum(len(p) for p in by_node.values()), "tris", sum(len(t) for t in groups.values()),
      "glb bytes", 20 + len(js) + 8 + len(binb), "textures", len(jobs))
print({z: len(c) for z, c in zone_children.items()})
print("depan/kanan/kiri/atas:", sorted((z, b) for (z, b) in by_node if z != "utama"))
