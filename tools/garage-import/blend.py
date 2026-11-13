"""Pembaca file .blend minimal (pointer 8 byte, little endian, tanpa kompresi)."""
import struct

BASIC = {
    "char": "b", "uchar": "B", "short": "h", "ushort": "H", "int": "i", "uint": "I",
    "float": "f", "double": "d", "int64_t": "q", "uint64_t": "Q", "int8_t": "b", "uint8_t": "B",
    "long": "i", "ulong": "I",
}


class Block:
    __slots__ = ("code", "size", "old", "sdna", "count", "off")


class Blend:
    def __init__(self, path):
        with open(path, "rb") as f:
            self.d = f.read()
        d = self.d
        assert d[:7] == b"BLENDER" and d[7:8] == b"-" and d[8:9] == b"v", d[:12]
        self.version = int(d[9:12])
        self.blocks = []
        self.by_ptr = {}
        pos = 12
        while pos < len(d):
            code = d[pos:pos + 4]
            size, old, sdna, count = struct.unpack_from("<iQii", d, pos + 4)
            b = Block()
            b.code = code.rstrip(b"\0").decode("latin1")
            b.size, b.old, b.sdna, b.count, b.off = size, old, sdna, count, pos + 24
            self.blocks.append(b)
            self.by_ptr[old] = b
            pos += 24 + size
            if code == b"ENDB":
                break
        self._parse_dna()

    def _parse_dna(self):
        d = self.d
        b = next(b for b in self.blocks if b.code == "DNA1")
        p = base = b.off
        assert d[p:p + 8] == b"SDNANAME"
        p += 8

        def strings(p):
            n = struct.unpack_from("<i", d, p)[0]
            p += 4
            out = []
            for _ in range(n):
                e = d.index(b"\0", p)
                out.append(d[p:e].decode("latin1"))
                p = e + 1
            return out, base + ((p - base + 3) & ~3)

        names, p = strings(p)
        assert d[p:p + 4] == b"TYPE"
        types, p = strings(p + 4)
        assert d[p:p + 4] == b"TLEN"
        p += 4
        tlen = struct.unpack_from("<%dH" % len(types), d, p)
        p = base + ((p + 2 * len(types) - base + 3) & ~3)
        assert d[p:p + 4] == b"STRC"
        ns = struct.unpack_from("<i", d, p + 4)[0]
        p += 8
        self.tlen = dict(zip(types, tlen))
        self.structs = {}
        self.struct_by_index = []
        for _ in range(ns):
            t, nf = struct.unpack_from("<HH", d, p)
            p += 4
            fields = {}
            off = 0
            for _ in range(nf):
                ft, fn = struct.unpack_from("<HH", d, p)
                p += 4
                name = names[fn]
                tname = types[ft]
                is_ptr = name.startswith("*") or name.startswith("(*")
                dims = []
                base = name
                while base.endswith("]"):
                    i = base.rindex("[")
                    dims.insert(0, int(base[i + 1:-1]))
                    base = base[:i]
                clean = base.lstrip("*")
                if clean.startswith("("):
                    clean = clean[1:clean.index(")")].lstrip("*")
                esize = 8 if is_ptr else tlen[ft]
                n = 1
                for x in dims:
                    n *= x
                fields[clean] = (tname, is_ptr, dims, off, esize)
                off += esize * n
            self.structs[types[t]] = fields
            self.struct_by_index.append(types[t])

    def view(self, block, index=0):
        name = self.struct_by_index[block.sdna]
        return View(self, name, block.off + index * self.tlen[name])

    def deref(self, ptr, index=0):
        if not ptr:
            return None
        b = self.by_ptr.get(ptr)
        return self.view(b, index) if b else None

    def raw(self, ptr):
        """(offset, size) blok data mentah yang ditunjuk pointer."""
        b = self.by_ptr.get(ptr) if ptr else None
        return (b.off, b.size) if b else None

    def of_code(self, code):
        return [self.view(b) for b in self.blocks if b.code == code]


class View:
    def __init__(self, bf, sname, off):
        self.bf, self.sname, self.off = bf, sname, off

    def has(self, name):
        return name in self.bf.structs[self.sname]

    def __getitem__(self, name):
        bf = self.bf
        tname, is_ptr, dims, off, esize = bf.structs[self.sname][name]
        p = self.off + off
        d = bf.d
        if is_ptr:
            if dims:
                return list(struct.unpack_from("<%dQ" % dims[0], d, p))
            return struct.unpack_from("<Q", d, p)[0]
        if tname in BASIC:
            if tname == "char" and len(dims) == 1:
                s = d[p:p + dims[0]]
                return s.split(b"\0", 1)[0].decode("utf8", "replace")
            if dims:
                n = 1
                for x in dims:
                    n *= x
                return list(struct.unpack_from("<%d%s" % (n, BASIC[tname]), d, p))
            return struct.unpack_from("<" + BASIC[tname], d, p)[0]
        if dims:
            return [View(bf, tname, p + i * esize) for i in range(dims[0])]
        return View(bf, tname, p)

    def ptr(self, name, index=0):
        return self.bf.deref(self[name], index)

    def listbase(self, name):
        """Iterasi ListBase; elemen dibaca sesuai struct bloknya masing-masing."""
        cur = self[name]["first"]
        while cur:
            b = self.bf.by_ptr.get(cur)
            if not b:
                break
            v = self.bf.view(b)
            yield v
            cur = struct.unpack_from("<Q", self.bf.d, b.off)[0]  # field pertama = *next

    @property
    def name(self):
        return self["id"]["name"][2:]
