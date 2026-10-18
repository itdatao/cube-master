import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = (p: IconProps) => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
})

export const IconShuffle = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="7" rx="2" />
    <rect x="14" y="14" width="7" height="7" rx="2" />
    <path d="M14.5 6.5H21M3 17.5h6.5" />
    <path d="M17.5 3.5 21 6.5l-3.5 3M6.5 14 3 17.5 6.5 21" />
  </svg>
)

export const IconReset = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </svg>
)

export const IconUndo = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 0 10h-4" />
  </svg>
)

export const IconRedo = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H9a5 5 0 0 0 0 10h4" />
  </svg>
)

export const IconPlay = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none" />
  </svg>
)

export const IconPause = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="6" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none" />
    <rect x="14" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none" />
  </svg>
)

export const IconSkipBack = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 5v14L8 12z" fill="currentColor" stroke="none" />
    <path d="M5 5v14" />
  </svg>
)

export const IconSkipForward = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 5v14l10-7z" fill="currentColor" stroke="none" />
    <path d="M19 5v14" />
  </svg>
)

export const IconCompass = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.5 8.5-2 5-5 2 2-5z" fill="currentColor" stroke="none" />
  </svg>
)

export const IconGauge = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 18a8 8 0 1 1 16 0" />
    <path d="m12 14 4-4" />
    <circle cx="12" cy="14" r="1.4" fill="currentColor" stroke="none" />
  </svg>
)

export const IconBook = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M4 5.5v15" />
    <path d="M8 7.5h7M8 11h5" />
  </svg>
)

export const IconGrid = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
  </svg>
)

export const IconChevron = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const IconClose = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const IconSparkles = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
    <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
  </svg>
)

export const IconHand = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 11V6.5a1.5 1.5 0 0 0-3 0V11" />
    <path d="M15 10.5V4.5a1.5 1.5 0 0 0-3 0V11" />
    <path d="M12 10.5V5.5a1.5 1.5 0 0 0-3 0V14" />
    <path d="M9 13.5v-1a1.5 1.5 0 0 0-3 0v3.5a6 6 0 0 0 6 6h1a6 6 0 0 0 6-6v-4" />
  </svg>
)

export const IconLayers = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m12 3 9 5-9 5-9-5z" />
    <path d="m3 13 9 5 9-5" />
  </svg>
)

export const IconInfo = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export const IconTarget = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
)

export const IconList = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </svg>
)
