import type { BikeDefinition, BikeId } from "@/types/catalog";

// Daftar motor yang bisa dipilih di tahap 1.
// Model GLB dikonversi dari file OBJ lewat tools/bike-import dan diskalakan
// ke meter berdasarkan jarak sumbu roda. Id bodyParts harus sama dengan nama
// node di GLB.

export const BIKES: readonly BikeDefinition[] = [
  {
    id: "ninja",
    nama: "Ninja",
    tipe: "Sport Fairing",
    deskripsi: "Motor sport berfairing penuh dengan kaca depan.",
    url: "/models/bikes/ninja.glb",
    spec: { panjang: 1.99, lebar: 0.69, tinggi: 1.03, jarakSumbuRoda: 1.39 },
    bodyParts: [
      { id: "bodi_spakbor_depan", nama: "Spakbor depan", warnaBawaan: "hitam" },
      { id: "bodi_cowl_depan", nama: "Kepala (papan nomor)", warnaBawaan: "lime" },
      // Motor trail punya dua cover samping; model demo Ninja masih satu node
      // GLB (bodi_fairing_samping), jadi node itu tetap dicat tanpa input.
      { id: "bodi_cover_samping_depan", nama: "Cover samping depan", warnaBawaan: "lime" },
      { id: "bodi_cover_samping_belakang", nama: "Cover samping belakang", warnaBawaan: "lime" },
      { id: "bodi_tangki", nama: "Tangki", warnaBawaan: "lime", tanpaInput: true },
      { id: "bodi_fairing_samping", nama: "Cover samping (fairing)", warnaBawaan: "lime", tanpaInput: true },
      { id: "bodi_buntut", nama: "Cover belakang (buntut)", warnaBawaan: "lime" },
    ],
    warnaSwingarm: "#6f747c",
  },
  {
    id: "gsx",
    nama: "GSX",
    tipe: "Naked Sport",
    deskripsi: "Motor naked 4 silinder dengan cover bodi bersudut tajam.",
    url: "/models/bikes/gsx.glb",
    spec: { panjang: 2.08, lebar: 0.76, tinggi: 1.18, jarakSumbuRoda: 1.46 },
    // Input warna di tahap kustom disamakan dengan Ninja: spakbor depan, kepala,
    // cover samping depan, cover samping belakang, dan buntut. Bagian lain
    // (tangki, cover tangki, cover bawah mesin) tetap dicat bawaan tanpa input.
    // Node GLB gsx belum punya cover samping belakang, jadi entri itu panel saja.
    bodyParts: [
      { id: "bodi_spakbor_depan", nama: "Spakbor depan", warnaBawaan: "biru" },
      { id: "bodi_cover_lampu", nama: "Kepala (papan nomor)", warnaBawaan: "biru" },
      { id: "bodi_cover_samping", nama: "Cover samping depan", warnaBawaan: "biru" },
      { id: "bodi_cover_samping_belakang", nama: "Cover samping belakang", warnaBawaan: "biru" },
      { id: "bodi_tangki", nama: "Tangki", warnaBawaan: "biru", tanpaInput: true },
      { id: "bodi_cover_tangki", nama: "Cover tangki", warnaBawaan: "hitam", tanpaInput: true },
      { id: "bodi_cover_bawah", nama: "Cover bawah mesin", warnaBawaan: "hitam", tanpaInput: true },
      { id: "bodi_buntut", nama: "Cover belakang (buntut)", warnaBawaan: "biru" },
    ],
    warnaSwingarm: "#1a1b1e",
  },
];

export const DEFAULT_BIKE_ID: BikeId = "ninja";

export function getBike(id: BikeId): BikeDefinition {
  const bike = BIKES.find((b) => b.id === id);
  if (!bike) throw new Error(`Motor tidak dikenal: ${id}`);
  return bike;
}
