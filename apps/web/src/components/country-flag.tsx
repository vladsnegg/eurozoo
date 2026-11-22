export function CountryFlag({
  iso2,
  size = 16,
  className,
}: {
  iso2?: string | null;
  size?: number;
  className?: string;
}) {
  if (!iso2 || iso2.length !== 2) return null;
  const height = Math.round(size * 0.75);

  return (
    <img
      src={`https://flagcdn.com/w40/${iso2.toLowerCase()}.png`}
      alt=""
      width={size}
      height={height}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={`country-flag${className ? ` ${className}` : ''}`}
      style={{ width: size, height }}
    />
  );
}
