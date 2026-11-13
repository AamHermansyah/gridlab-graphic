"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import { SCENE_BG } from "@/lib/sceneConstants";
import { useSceneStore } from "@/store/useSceneStore";
import { CameraRig } from "./CameraRig";
import { GarageScene } from "./GarageScene";

/** Memberi tahu UI bahwa frame pertama sudah tergambar (loading screen boleh ditutup). */
function SceneReadySignal() {
  const setSceneReady = useSceneStore((s) => s.setSceneReady);
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    setSceneReady();
  });
  return null;
}

/**
 * Canvas 3D utama.
 * - dpr dibatasi [1, 2] supaya HP dengan layar rapat tidak merender berlebihan
 * - frameloop "demand": frame hanya digambar saat ada perubahan (kamera
 *   digeser atau transisi preset berjalan)
 */
export default function GarageCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      frameloop="demand"
      camera={{ fov: 40, near: 0.1, far: 60, position: [4, 2.4, 5] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[SCENE_BG]} />
      <fog attach="fog" args={[SCENE_BG, 14, 34]} />

      {/* Suspense disiapkan untuk aset async di tahap berikutnya (mis. loader GLB) */}
      <Suspense fallback={null}>
        <GarageScene />
        <SceneReadySignal />
      </Suspense>

      <CameraRig />
    </Canvas>
  );
}
