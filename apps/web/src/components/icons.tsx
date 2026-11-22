import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  };
}

export function LeafIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 4c-8.5.5-13 3.5-13 9a5 5 0 0 0 5 5c5.5 0 8-5.5 8-14Z" />
      <path d="M4 20c1.5-4 4-7 8-9" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" />
    </svg>
  );
}

export function PawIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <ellipse cx="6.2" cy="10" rx="2" ry="2.6" />
      <ellipse cx="10.1" cy="6.3" rx="2" ry="2.6" />
      <ellipse cx="14.3" cy="6.3" rx="2" ry="2.6" />
      <ellipse cx="18.1" cy="10" rx="2" ry="2.6" />
      <path d="M12.2 12.2c3.4 0 5.8 2 5.8 4.3 0 1.8-1.5 2.8-3.2 2.5-1.6-.3-3.4-.3-5 0-1.8.3-3.3-.7-3.3-2.5 0-2.3 2.4-4.3 5.7-4.3Z" />
    </svg>
  );
}

export function NetworkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="6" cy="6" r="2.6" />
      <circle cx="18" cy="7" r="2.6" />
      <circle cx="12" cy="18" r="2.6" />
      <path d="M8.2 7.1 15.4 7.6" />
      <path d="m7.2 8.3 3.5 7.3" />
      <path d="m16.7 9.2-3.4 6.4" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3 4.8 6v5.1c0 4.4 2.9 8.1 7.2 9.9 4.3-1.8 7.2-5.5 7.2-9.9V6L12 3Z" />
      <path d="m9.2 11.8 1.9 1.9 3.8-3.8" />
    </svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2.1 5-5 2.1 2.1-5 5-2.1Z" />
    </svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 4.5h10.5A2.5 2.5 0 0 1 18 7v13H7.5A2.5 2.5 0 0 1 5 17.5v-13Z" />
      <path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H18" />
      <path d="M9 8h5" />
    </svg>
  );
}

export function NewspaperIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5h13v14H6a2 2 0 0 1-2-2V5Z" />
      <path d="M17 9h2a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2h-1" />
      <path d="M7 8.5h7M7 11.5h7M7 14.5h4" />
    </svg>
  );
}

export function DatabaseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <path d="m6.3 6.3 2.5 2.5" />
      <path d="m15.2 15.2 2.5 2.5" />
      <path d="m17.7 6.3-2.5 2.5" />
      <path d="m8.8 15.2-2.5 2.5" />
    </svg>
  );
}

export function AdminIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}
