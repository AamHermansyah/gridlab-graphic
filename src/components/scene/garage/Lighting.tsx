"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useState } from "react";
import { Object3D } from "three";
import { CAMERA_TARGET, COLORS, GARAGE } from "@/lib/sceneConstants";

/**
 * Pencahayaan showroom malam: ruangan gelap, motor disorot dari atas,
 * rim light dingin + aksen neon, dan environment berisi strip lampu
 * supaya permukaan mengilap punya pantulan yang menarik.
 */
export function Lighting() {
  // Sasaran lampu sorot: tengah pelat servis tempat motor berdiri.
  const [target] = useState(() => {
    const o = new Object3D();
    o.position.set(CAMERA_TARGET[0], CAMERA_TARGET[1] - 0.3, CAMERA_TARGET[2]);
    return o;
  });

  return (
    <>
      <primitive object={target} />

      <ambientLight color="#b9c4ff" intensity={0.1} />
      <hemisphereLight args={["#cfd8ff", "#0a0b0e", 0.16]} />

      {/* Lampu sorot utama dari atas-depan; satu-satunya lampu yang membuat bayangan */}
      <spotLight
        position={[0.9, 3.7, 1.9]}
        target={target}
        color="#f4f7ff"
        intensity={90}
        angle={0.62}
        penumbra={0.9}
        decay={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      {/* Rim light biru dingin dari belakang-kiri */}
      <spotLight
        position={[-4.2, 3.4, -2.8]}
        target={target}
        color="#6f9bff"
        intensity={120}
        angle={0.55}
        penumbra={1}
        decay={2}
      />

      {/* Rim light aksen neon dari belakang-kanan */}
      <spotLight
        position={[4.4, 2.6, -2.6]}
        target={target}
        color={COLORS.accent}
        intensity={55}
        angle={0.6}
        penumbra={1}
        decay={2}
      />

      {/* Pendar lampu neon bengkel (posisi mengikuti model, dalam koordinat model) */}
      <group position={GARAGE.offset}>
        <pointLight position={[-1.15, 3.2, -1.6]} color={COLORS.neonWhite} intensity={17} decay={2} />
        <pointLight position={[-1.15, 3.2, 1.65]} color={COLORS.neonWhite} intensity={8} decay={2} />
        <pointLight position={[-4.2, 2.5, 0]} color="#ffd9a8" intensity={9} decay={2} />
        <pointLight position={[2.6, 3.2, -1.3]} color={COLORS.neonWhite} intensity={12} decay={2} />
      </group>

      {/*
        Environment dibuat dari panel cahaya (Lightformer), bukan file HDR,
        dan hanya dirender sekali (frames=1) pada resolusi kecil.
      */}
      <Environment resolution={64} frames={1} environmentIntensity={0.38}>
        <color attach="background" args={["#07080b"]} />
        {/* Tiga strip lampu di langit-langit */}
        {[-2.2, 0, 2.2].map((x) => (
          <Lightformer
            key={x}
            form="rect"
            color="#eef2ff"
            intensity={5}
            position={[x, 5, 0]}
            rotation-x={Math.PI / 2}
            scale={[0.7, 8, 1]}
          />
        ))}
        <Lightformer
          form="rect"
          color="#6f9bff"
          intensity={2}
          position={[-6, 2, 0]}
          rotation-y={Math.PI / 2}
          scale={[7, 2, 1]}
        />
        <Lightformer
          form="rect"
          color={COLORS.accent}
          intensity={1.2}
          position={[6, 1.5, 0]}
          rotation-y={-Math.PI / 2}
          scale={[7, 1, 1]}
        />
        <Lightformer
          form="rect"
          color="#ffffff"
          intensity={0.8}
          position={[0, 2, 7]}
          rotation-y={Math.PI}
          scale={[8, 2, 1]}
        />
      </Environment>
    </>
  );
}
