"use client";

import { ContactShadows } from "@react-three/drei";
import { STAND } from "@/lib/sceneConstants";
import { BikeStage } from "./bike/BikeStage";
import { Lighting } from "./garage/Lighting";
import { WorkshopModel } from "./garage/WorkshopModel";
import { SpinGroup } from "./SpinGroup";

/**
 * Susunan lengkap scene: bengkel (GLB, skala 1:1) + motor terpilih di jalur
 * servisnya. Seluruhnya berada di dalam SpinGroup, jadi rotasi 360° memutar
 * bengkel beserta motornya. Pembesaran motor diatur lewat BIKE_SCALE.
 */
export function GarageScene() {
  return (
    <>
      <SpinGroup>
        <Lighting />
        <WorkshopModel />
        <BikeStage />

        {/* Bayangan kontak lembut di bawah motor */}
        <ContactShadows
          position={[0, STAND.top + 0.004, 0]}
          scale={[3.4, 1.6]}
          resolution={256}
          blur={2.2}
          far={1.3}
          opacity={0.6}
        />
      </SpinGroup>

      {/* Pelataran gelap di luar bengkel, supaya tepi lantai tidak berakhir di ruang kosong */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.13, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#26282c" roughness={0.95} />
      </mesh>
    </>
  );
}
