import type { ReactNode, SVGProps } from "react";
import type { CustomCategoryId } from "@/types/catalog";
import type { CameraPresetId } from "@/types/scene";

// Ikon garis sederhana buatan sendiri (tanpa library ikon dan tanpa logo merek).

function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

const CATEGORY_PATHS: Record<CustomCategoryId, ReactNode> = {
  // Sayap tangki / cover bodi
  bodi: (
    <>
      <path d="M3 15l5-8h9l4 5-6 5H6z" />
      <path d="M8 7l3 6h10" />
    </>
  ),
  // Kepala depan: headlamp dengan berkas cahaya
  kepala: (
    <>
      <path d="M4.5 12a7.5 7.5 0 0 1 7.5-7.5h2.5v15H12A7.5 7.5 0 0 1 4.5 12z" />
      <path d="M17.5 8.5h3M17.5 12h3M17.5 15.5h3" />
      <path d="M8 9.5c1.4-1.2 2.6-1.2 4 0v5c-1.4 1.2-2.6 1.2-4 0z" />
    </>
  ),
  // Kaki-kaki: garpu depan bertemu roda
  kaki: (
    <>
      <circle cx="12" cy="16" r="4" />
      <circle cx="12" cy="16" r="1" />
      <path d="M8 3.5l2.4 9M16 3.5l-2.4 9" />
    </>
  ),
};

export function CategoryIcon({ id, ...props }: { id: CustomCategoryId } & SVGProps<SVGSVGElement>) {
  return <Icon {...props}>{CATEGORY_PATHS[id]}</Icon>;
}

// Ikon sudut kamera: garis besar motor (kotak) dilihat dari tiap arah.
const CAMERA_PATHS: Record<CameraPresetId, ReactNode> = {
  depan: (
    <>
      <rect x="9" y="5" width="6" height="14" rx="1.5" />
      <path d="M5 9h4M15 9h4" />
    </>
  ),
  samping: (
    <>
      <circle cx="6.5" cy="16" r="3" />
      <circle cx="17.5" cy="16" r="3" />
      <path d="M6.5 16l4-7h5l2 7M10.5 9h-3" />
    </>
  ),
  belakang: (
    <>
      <rect x="9" y="5" width="6" height="14" rx="1.5" />
      <path d="M10.5 9h3" />
    </>
  ),
  atas: (
    <>
      <rect x="10" y="3" width="4" height="18" rx="2" />
      <path d="M5 8h14" />
    </>
  ),
};

export function CameraIcon({ id, ...props }: { id: CameraPresetId } & SVGProps<SVGSVGElement>) {
  return <Icon {...props}>{CAMERA_PATHS[id]}</Icon>;
}

export function SoundIcon({ on, ...props }: { on: boolean } & SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5z" />
      {on ? <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M16 9.5l5 5M21 9.5l-5 5" />}
    </Icon>
  );
}

export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Icon>
  );
}

export function ChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 15l6-6 6 6" />
    </Icon>
  );
}

export function SpinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M20 12a8 8 0 1 1-2.4-5.7" />
      <path d="M20 4v5h-5" />
    </Icon>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
  );
}

export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.6 3.4-5.5 7-5.5s6.2 1.9 7 5.5" />
    </Icon>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function ArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}
