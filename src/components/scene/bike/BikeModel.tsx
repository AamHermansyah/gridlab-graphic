"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { DoubleSide, Mesh, type BufferGeometry } from "three";
import { PAINT_COLORS, findOption } from "@/data/catalog";
import type { BikeDefinition } from "@/types/catalog";

// Model motor dari GLB. Setiap node GLB = satu bagian; nama node menentukan
// material (lihat tools/bike-import untuk pembagiannya):
//   bodi_*  -> cat bodi dengan warna bawaan motor
//   jok, velg -> warna bawaan tetap
//   swingarm -> warna bawaan per motor
//   lainnya -> material tetap (ban, logam, lampu, kaca, ...)
// Pilihan di tahap kustom & decal saat ini hanya UI panel (mockup) dan TIDAK
// diterapkan ke model 3D: motor selalu tampil dengan tampilan bawaannya.

interface Part {
  name: string;
  geometry: BufferGeometry;
}

/** Material tetap per nama bagian. Mesh OBJ tidak selalu konsisten arah sisinya, jadi dua sisi. */
function FixedMaterial({ name }: { name: string }) {
  switch (name) {
    case "ban":
      return <meshStandardMaterial color="#0c0c0d" roughness={0.92} side={DoubleSide} />;
    case "cakram":
    case "logam":
      return <meshStandardMaterial color="#b4b9c1" metalness={1} roughness={0.34} side={DoubleSide} />;
    case "rangka":
      return <meshStandardMaterial color="#6f747c" metalness={0.9} roughness={0.42} side={DoubleSide} />;
    case "knalpot":
      return <meshStandardMaterial color="#a39a8c" metalness={1} roughness={0.28} side={DoubleSide} />;
    case "suspensi":
      return <meshStandardMaterial color="#c49a35" metalness={1} roughness={0.3} side={DoubleSide} />;
    case "lampu":
      return <meshStandardMaterial color="#f3f6ff" emissive="#dfe8ff" emissiveIntensity={1.1} roughness={0.2} side={DoubleSide} />;
    case "sein":
      return <meshStandardMaterial color="#ff9a1a" emissive="#ff8a00" emissiveIntensity={0.35} roughness={0.3} side={DoubleSide} />;
    case "merah":
      return <meshStandardMaterial color="#c80f20" emissive="#c80f20" emissiveIntensity={0.45} roughness={0.3} side={DoubleSide} />;
    case "kuning":
      return <meshStandardMaterial color="#f0c010" roughness={0.5} side={DoubleSide} />;
    case "kaca":
      return <meshStandardMaterial color="#e3e9f0" transparent opacity={0.45} roughness={0.05} side={DoubleSide} />;
    case "visor":
      return <meshStandardMaterial color="#0f1115" transparent opacity={0.6} roughness={0.05} metalness={0.3} side={DoubleSide} />;
    case "layar":
      return <meshStandardMaterial color="#0a1622" roughness={0.1} side={DoubleSide} />;
    case "rem":
      return <meshStandardMaterial color="#2a2b2f" metalness={0.7} roughness={0.45} side={DoubleSide} />;
    default:
      // "mekanik" / "hitam": mesin, rangka hitam, dan komponen lain
      return <meshStandardMaterial color="#1a1b1e" metalness={0.5} roughness={0.55} side={DoubleSide} />;
  }
}

const SEE_THROUGH = new Set(["kaca", "visor"]);

/** Cat bodi (tanpa lapisan decal): warnanya warna bawaan bagian itu. */
function BodyPartMesh({ part, color }: { part: Part; color: string }) {
  return (
    <mesh geometry={part.geometry} castShadow>
      <meshPhysicalMaterial
        color={color}
        roughness={0.34}
        metalness={0.1}
        clearcoat={1}
        clearcoatRoughness={0.1}
        envMapIntensity={1.3}
        side={DoubleSide}
      />
    </mesh>
  );
}

function RimMesh({ part }: { part: Part }) {
  return (
    <mesh geometry={part.geometry} castShadow>
      <meshStandardMaterial color="#15161a" metalness={0.65} roughness={0.36} side={DoubleSide} />
    </mesh>
  );
}

function SeatMesh({ part }: { part: Part }) {
  return (
    <mesh geometry={part.geometry} castShadow>
      <meshStandardMaterial color="#141416" roughness={0.86} side={DoubleSide} />
    </mesh>
  );
}

export function BikeModel({ bike }: { bike: BikeDefinition }) {
  const gltf = useGLTF(bike.url, false, false);
  const parts = useMemo(() => {
    const list: Part[] = [];
    gltf.scene.traverse((object) => {
      if (object instanceof Mesh) list.push({ name: object.name, geometry: object.geometry });
    });
    return list;
  }, [gltf.scene]);

  // Warna bawaan tiap bagian bodi (id node -> hex) dari definisi motor.
  const bodyColors = useMemo(
    () => Object.fromEntries(bike.bodyParts.map((p) => [p.id, findOption(PAINT_COLORS, p.warnaBawaan).hex])),
    [bike],
  );

  return (
    <group>
      {parts.map((part) => {
        if (part.name.startsWith("bodi_")) {
          return <BodyPartMesh key={part.name} part={part} color={bodyColors[part.name] ?? "#121315"} />;
        }
        if (part.name === "velg") return <RimMesh key={part.name} part={part} />;
        if (part.name === "jok") return <SeatMesh key={part.name} part={part} />;
        if (part.name === "swingarm") {
          return (
            <mesh key={part.name} geometry={part.geometry} castShadow>
              <meshStandardMaterial color={bike.warnaSwingarm} metalness={0.8} roughness={0.45} side={DoubleSide} />
            </mesh>
          );
        }
        return (
          <mesh key={part.name} geometry={part.geometry} castShadow={!SEE_THROUGH.has(part.name)}>
            <FixedMaterial name={part.name} />
          </mesh>
        );
      })}
    </group>
  );
}
