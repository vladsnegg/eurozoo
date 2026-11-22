import Link from 'next/link';

export function Logo({ href = '/', compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className={`brand ${compact ? 'brand-compact' : ''}`} aria-label="EuroZoo Atlas">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" width="26" height="26" fill="none">
          <circle cx="24" cy="24" r="22.5" stroke="currentColor" strokeOpacity="0.18" />
          <path
            d="M16.5 18.5c-2.6-4-6.2-5.7-9.6-4.4 1.8 4.3 4.9 7.7 8.4 10.1"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M31.5 18.5c2.6-4 6.2-5.7 9.6-4.4-1.8 4.3-4.9 7.7-8.4 10.1"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M18.6 22.4c1.5-1.4 3.3-2.2 5.4-2.2s3.9.8 5.4 2.2l-2.1 6.6c-1 3.1-2.3 5.3-3.3 6.6-1-1.3-2.3-3.5-3.3-6.6l-2.1-6.6Z"
            fill="currentColor"
          />
          <circle cx="21.2" cy="25.8" r="1.05" fill="#c8f560" />
          <circle cx="26.8" cy="25.8" r="1.05" fill="#c8f560" />
        </svg>
      </span>
      <span className="brand-name">
        eurozoo<span className="brand-name-accent">atlas</span>
      </span>
    </Link>
  );
}
