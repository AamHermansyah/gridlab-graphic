"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { MathUtils, PerspectiveCamera, Spherical, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { DEFAULT_CAMERA_VIEW, getCameraPreset } from "@/data/cameraPresets";
import {
  DESKTOP_BREAKPOINT,
  MOBILE_HEADER_SPACE,
  PRESET_BAR_SPACE,
  SIDEBAR_WIDTH,
  getSheetHeight,
} from "@/lib/layout";
import { CAMERA_TARGET, ORBIT_LIMITS } from "@/lib/sceneConstants";
import { useSceneStore } from "@/store/useSceneStore";
import type { CameraPreset, CameraView } from "@/types/scene";

const TRANSITION_SPEED = 4.5; // makin besar makin cepat
const OFFSET_SPEED = 9;

// Objek kerja, dipakai ulang agar tidak membuat sampah memori tiap frame.
const _offset = new Vector3();
const _spherical = new Spherical();

interface Goal {
  azimuth: number;
  polar: number;
  distance: number;
}

/** Menghitung tujuan kamera supaya area "fit" preset muat di area layar yang terlihat. */
function resolveGoal(
  view: CameraView | CameraPreset,
  fovDeg: number,
  visibleW: number,
  visibleH: number,
  fullH: number,
): Goal {
  const portrait = visibleW < visibleH;
  const v: CameraView =
    portrait && "portrait" in view && view.portrait ? { ...view, ...view.portrait } : view;
  const tan = Math.tan(MathUtils.degToRad(fovDeg) / 2);
  const fitW = (v.fitHalfWidth * fullH) / (visibleW * tan);
  const fitH = (v.fitHalfHeight * fullH) / (visibleH * tan);
  return {
    azimuth: v.azimuth,
    polar: v.polar,
    distance: MathUtils.clamp(
      Math.max(v.minDistance, fitW, fitH),
      ORBIT_LIMITS.minDistance,
      ORBIT_LIMITS.maxDistance,
    ),
  };
}

/**
 * Kontrol kamera:
 * - OrbitControls dengan batas zoom dan sudut
 * - transisi halus ke preset (interpolasi dalam koordinat bola, jadi kamera
 *   mengitari motor, bukan menembusnya)
 * - menggeser titik tengah render supaya motor tidak tertutup panel UI
 */
export function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const rig = useRef({
    initialized: false,
    transitioning: false,
    offsetX: 0,
    offsetY: 0,
    lastW: 0,
    lastH: 0,
  });

  const presetId = useSceneStore((s) => s.cameraPreset);
  const nonce = useSceneStore((s) => s.cameraNonce);
  const panelOpen = useSceneStore((s) => s.panelOpen);
  const clearCameraPreset = useSceneStore((s) => s.clearCameraPreset);
  const invalidate = useThree((s) => s.invalidate);

  // Preset dipilih (atau dipilih ulang): mulai transisi.
  useEffect(() => {
    if (nonce === 0) return;
    rig.current.transitioning = true;
    invalidate();
  }, [nonce, invalidate]);

  // Sheet dibuka/ditutup: titik tengah render perlu digeser. Jika sebuah preset
  // sedang aktif, jaraknya dihitung ulang supaya motor tetap muat di area sisa.
  useEffect(() => {
    if (rig.current.initialized && useSceneStore.getState().cameraPreset) {
      rig.current.transitioning = true;
    }
    invalidate();
  }, [panelOpen, invalidate]);

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    const camera = state.camera;
    if (!controls || !(camera instanceof PerspectiveCamera)) return;

    const r = rig.current;
    const dt = Math.min(delta, 0.1);
    const { width, height } = state.size;
    const desktop = width >= DESKTOP_BREAKPOINT;
    const sidebarWidth = desktop ? SIDEBAR_WIDTH : 0;
    // Bagian layar yang tertutup UI di atas (judul) dan di bawah (sheet + bar preset).
    const topInset = desktop ? 0 : MOBILE_HEADER_SPACE;
    const bottomInset = (desktop ? 0 : getSheetHeight(height, panelOpen)) + PRESET_BAR_SPACE;

    // --- 1. Geser titik tengah render ke tengah area yang tidak tertutup UI ---
    const targetX = sidebarWidth / 2;
    const targetY = (bottomInset - topInset) / 2;
    let nextX = r.initialized ? MathUtils.damp(r.offsetX, targetX, OFFSET_SPEED, dt) : targetX;
    let nextY = r.initialized ? MathUtils.damp(r.offsetY, targetY, OFFSET_SPEED, dt) : targetY;
    if (Math.abs(nextX - targetX) < 0.5) nextX = targetX;
    if (Math.abs(nextY - targetY) < 0.5) nextY = targetY;
    if (nextX !== r.offsetX || nextY !== r.offsetY || width !== r.lastW || height !== r.lastH) {
      camera.setViewOffset(width, height, nextX, nextY, width, height);
      r.offsetX = nextX;
      r.offsetY = nextY;
      r.lastW = width;
      r.lastH = height;
    }
    if (nextX !== targetX || nextY !== targetY) state.invalidate();

    // --- 2. Posisi awal dan transisi preset ---
    if (r.initialized && !r.transitioning) return;

    const view = r.initialized && presetId ? getCameraPreset(presetId) : DEFAULT_CAMERA_VIEW;
    const goal = resolveGoal(
      view,
      camera.fov,
      width - sidebarWidth,
      height - topInset - bottomInset,
      height,
    );

    _offset.copy(camera.position).sub(controls.target);
    _spherical.setFromVector3(_offset);

    if (!r.initialized) {
      // Frame pertama: langsung lompat ke sudut awal tanpa animasi.
      _spherical.set(goal.distance, goal.polar, goal.azimuth);
      r.initialized = true;
    } else {
      const dAzimuth = goal.azimuth - _spherical.theta;
      const dPolar = goal.polar - _spherical.phi;
      const dRadius = goal.distance - _spherical.radius;
      if (Math.abs(dAzimuth) < 0.002 && Math.abs(dPolar) < 0.002 && Math.abs(dRadius) < 0.01) {
        _spherical.set(goal.distance, goal.polar, goal.azimuth);
        r.transitioning = false;
      } else {
        const k = 1 - Math.exp(-TRANSITION_SPEED * dt);
        _spherical.theta += dAzimuth * k;
        _spherical.phi += dPolar * k;
        _spherical.radius += dRadius * k;
      }
    }

    camera.position.setFromSpherical(_spherical).add(controls.target);
    controls.update();
    state.invalidate();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={[...CAMERA_TARGET]}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.7}
      zoomSpeed={0.8}
      minDistance={ORBIT_LIMITS.minDistance}
      maxDistance={ORBIT_LIMITS.maxDistance}
      minPolarAngle={ORBIT_LIMITS.minPolar}
      maxPolarAngle={ORBIT_LIMITS.maxPolar}
      minAzimuthAngle={-ORBIT_LIMITS.maxAzimuth}
      maxAzimuthAngle={ORBIT_LIMITS.maxAzimuth}
      // User mulai menggeser sendiri: batalkan transisi dan lepas preset aktif.
      onStart={() => {
        rig.current.transitioning = false;
        clearCameraPreset();
      }}
    />
  );
}
