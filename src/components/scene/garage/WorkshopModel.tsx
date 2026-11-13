"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { DoubleSide, Mesh, MeshStandardMaterial, Vector3, type Material, type Object3D, type Texture } from "three";
import { createPosterAtlasTexture } from "@/lib/proceduralTextures";
import { GARAGE } from "@/lib/sceneConstants";
import { useDisposable } from "@/lib/useDisposable";

// Permukaan besar yang sering terlihat miring: tekstur dipertajam dengan anisotropi.
const LARGE_SURFACES = ["mat_garage_concrete_slabs", "mat_concrete_wall", "mat_garage_metal", "mat_garage_wood"];
// Objek lantai yang menerima bayangan lampu sorot.
const SHADOW_RECEIVERS = ["prop_garage_floor", "prop_garage_pit_cover"];

/** Menyesuaikan satu material model untuk kebutuhan scene konfigurator. */
function tuneMaterial(source: Material, posterAtlas: Texture): Material {
  const material = source.clone();
  if (!(material instanceof MeshStandardMaterial)) return material;
  const name = material.name;

  if (name.startsWith("dec_")) {
    // Decal menempel di lantai/dinding: digambar tanpa menulis depth dan
    // sedikit dimajukan supaya tidak berkedip (z-fighting).
    material.transparent = true;
    material.depthWrite = false;
    material.polygonOffset = true;
    material.polygonOffsetFactor = -4;
    material.polygonOffsetUnits = -4;
  } else if (name === "mat_garage_poster") {
    // Poster bawaan memuat karya pihak lain: diganti atlas buatan sendiri.
    material.map = posterAtlas;
    material.roughness = 0.75;
  } else if (name === "mat_garage_wheel") {
    // Mesh ban tidak tertutup / sisi dalamnya menghadap ke dalam: dengan culling
    // bawaan bagian belakang ban tampak transparan. Gambar kedua sisi.
    material.side = DoubleSide;
  } else if (name === "mat_garage_lamp") {
    // Tabung lampu neon menyala
    material.emissiveIntensity = 3;
    material.toneMapped = false;
  }

  if (LARGE_SURFACES.some((key) => name.startsWith(key))) {
    for (const texture of [material.map, material.normalMap, material.roughnessMap]) {
      if (texture) texture.anisotropy = 8;
    }
  }
  material.envMapIntensity = 0.6;
  return material;
}

/** Salinan scene GLB dengan material yang sudah disesuaikan. */
function prepareWorkshop(source: Object3D, posterAtlas: Texture): Object3D {
  const root = source.clone(true);
  const tuned = new Map<string, Material>();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const original = object.material as Material;
    let material = tuned.get(original.uuid);
    if (!material) {
      material = tuneMaterial(original, posterAtlas);
      tuned.set(original.uuid, material);
    }
    object.material = material;
    object.receiveShadow = SHADOW_RECEIVERS.some((key) => object.name.startsWith(key));
    if (material.name.startsWith("dec_")) object.renderOrder = 1;
  });
  return root;
}

// Vektor kerja untuk useFrame (dipakai ulang supaya tidak membuat objek tiap frame).
const cameraLocal = new Vector3();

/**
 * Model bengkel dari file GLB. Dinding tiap sisi beserta perabot yang menempel
 * padanya, juga atap, dikelompokkan per zona (zona_depan, zona_belakang, ...)
 * saat konversi; zona disembunyikan ketika kamera berada di baliknya supaya
 * motor selalu terlihat, termasuk saat scene berputar 360°.
 */
export function WorkshopModel() {
  const gltf = useGLTF(GARAGE.url, false, false);
  const posterAtlas = useDisposable(createPosterAtlasTexture);
  const workshop = useMemo(() => prepareWorkshop(gltf.scene, posterAtlas), [gltf.scene, posterAtlas]);
  const root = useRef<Object3D>(null);

  useFrame((state) => {
    const model = root.current;
    if (!model) return;
    // Posisi kamera dalam koordinat model: bengkel ikut berputar bersama scene,
    // jadi "di balik dinding" harus dinilai relatif terhadap bengkelnya.
    const { x, y, z } = model.worldToLocal(cameraLocal.copy(state.camera.position));
    for (const zone of model.children) {
      if (zone.name === "zona_depan") zone.visible = z < GARAGE.frontZ;
      else if (zone.name === "zona_belakang") zone.visible = z > GARAGE.backZ;
      else if (zone.name === "zona_kanan") zone.visible = x < GARAGE.rightX;
      else if (zone.name === "zona_kiri") zone.visible = x > GARAGE.leftX;
      else if (zone.name === "zona_atas") zone.visible = y < GARAGE.topY;
    }
  });

  return <primitive ref={root} object={workshop} position={GARAGE.offset} />;
}

useGLTF.preload(GARAGE.url, false, false);
