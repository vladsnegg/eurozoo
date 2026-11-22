'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { EuropeAdminRegion } from './europe-admin-regions';
import { EUROPE_CITY_POINTS } from './europe-city-points';
import { CRIMEA_PATH } from './europe-disputed-regions';
import { EUROPE_COUNTRY_PATHS } from './europe-geo-paths';
import { CountryFlag } from './country-flag';
import { ArrowUpRightIcon, GlobeIcon } from './icons';

export type MapZooPoint = {
  slug: string;
  name: string;
  city: string;
  country: string;
  iso2: string;
  neutral?: boolean;
  foundedYear?: number | null;
  speciesCount?: number;
  lat: number | null;
  lng: number | null;
};

// Lambert Conformal Conic centered on Europe (10°E, 50°N), standard parallels 43°N and 62°N
const DEG = Math.PI / 180;
const PHI1 = 43 * DEG;
const PHI2 = 62 * DEG;
const PHI0 = 50 * DEG;
const LAM0 = 10 * DEG;

const N =
  Math.log(Math.cos(PHI1) / Math.cos(PHI2)) /
  Math.log(Math.tan(Math.PI / 4 + PHI2 / 2) / Math.tan(Math.PI / 4 + PHI1 / 2));
const F = (Math.cos(PHI1) * Math.pow(Math.tan(Math.PI / 4 + PHI1 / 2), N)) / N;
const rho = (phi: number) => F / Math.pow(Math.tan(Math.PI / 4 + phi / 2), N);
const RHO0 = rho(PHI0);

const SCALE = 860;
const CX = 505;
const CY = 330;

function project(lat: number, lng: number): { x: number; y: number } {
  const clampedLat = Math.max(24, Math.min(78, lat));
  const clampedLng = Math.max(-35, Math.min(80, lng));
  const phi = clampedLat * DEG;
  const lam = clampedLng * DEG;
  const r = rho(phi);
  const theta = N * (lam - LAM0);
  const x = CX + SCALE * r * Math.sin(theta);
  const y = CY - SCALE * (RHO0 - r * Math.cos(theta));
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

function parallelPath(lat: number): string {
  const parts: string[] = [];
  for (let lng = -24; lng <= 42; lng += 2) {
    const { x, y } = project(lat, lng);
    parts.push(`${lng === -24 ? 'M' : 'L'}${x},${y}`);
  }
  return parts.join('');
}

function meridianPath(lng: number): string {
  const parts: string[] = [];
  for (let lat = 32; lat <= 70; lat += 2) {
    const { x, y } = project(lat, lng);
    parts.push(`${lat === 32 ? 'M' : 'L'}${x},${y}`);
  }
  return parts.join('');
}

type PinLabelPlacement = { dx: number; dy: number; anchor: 'start' | 'end' };
type LabelBox = { x1: number; y1: number; x2: number; y2: number };

const PIN_LABEL_CANDIDATES: PinLabelPlacement[] = [
  { dx: 9, dy: -9, anchor: 'start' },
  { dx: 9, dy: 15, anchor: 'start' },
  { dx: -9, dy: -9, anchor: 'end' },
  { dx: -9, dy: 15, anchor: 'end' },
];

const CITY_LABEL_CANDIDATES: PinLabelPlacement[] = [
  { dx: 5, dy: -4, anchor: 'start' },
  { dx: 5, dy: 11, anchor: 'start' },
  { dx: -5, dy: -4, anchor: 'end' },
  { dx: -5, dy: 11, anchor: 'end' },
];

function labelBox(
  baseX: number,
  baseY: number,
  width: number,
  placement: PinLabelPlacement,
): LabelBox {
  const x1 = placement.anchor === 'start' ? baseX + placement.dx : baseX + placement.dx - width;
  return {
    x1,
    y1: baseY + placement.dy - 10,
    x2: x1 + width,
    y2: baseY + placement.dy + 2,
  };
}

function boxesOverlap(a: LabelBox, b: LabelBox): boolean {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

function layoutPinLabels(
  pins: Array<{ slug: string; name: string; x: number; y: number }>,
  scale: number,
): { labels: Map<string, PinLabelPlacement>; boxes: LabelBox[] } {
  const boxes: LabelBox[] = pins.map((pin) => ({
    x1: pin.x * scale - 7,
    y1: pin.y * scale - 7,
    x2: pin.x * scale + 7,
    y2: pin.y * scale + 7,
  }));
  const labels = new Map<string, PinLabelPlacement>();
  const ordered = [...pins].sort((a, b) => a.y - b.y || a.x - b.x);
  for (const pin of ordered) {
    const width = Math.max(38, pin.name.length * 5.9);
    const baseX = pin.x * scale;
    const baseY = pin.y * scale;
    let chosen = PIN_LABEL_CANDIDATES[0];
    for (const candidate of PIN_LABEL_CANDIDATES) {
      const box = labelBox(baseX, baseY, width, candidate);
      if (!boxes.some((existing) => boxesOverlap(existing, box))) {
        chosen = candidate;
        break;
      }
    }
    boxes.push(labelBox(baseX, baseY, width, chosen));
    labels.set(pin.slug, chosen);
  }
  return { labels, boxes };
}

function layoutCityLabels(
  cities: Array<{ name: string; x: number; y: number }>,
  scale: number,
  occupied: LabelBox[],
): Map<number, PinLabelPlacement> {
  const boxes = [...occupied];
  const labels = new Map<number, PinLabelPlacement>();
  cities.forEach((city, index) => {
    const width = Math.max(20, city.name.length * 5.4);
    const baseX = city.x * scale;
    const baseY = city.y * scale;
    let chosen: PinLabelPlacement | null = null;
    for (const candidate of CITY_LABEL_CANDIDATES) {
      const box = labelBox(baseX, baseY, width, candidate);
      if (!boxes.some((existing) => boxesOverlap(existing, box))) {
        chosen = candidate;
        break;
      }
    }
    if (!chosen) return;
    boxes.push(labelBox(baseX, baseY, width, chosen));
    labels.set(index, chosen);
  });
  return labels;
}

export function EuropeAtlasMap({
  zoos,
  activeSlug,
  compact = false,
}: {
  zoos: MapZooPoint[];
  activeSlug?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const points = useMemo(
    () =>
      zoos
        .filter(
          (z): z is MapZooPoint & { lat: number; lng: number } => z.lat !== null && z.lng !== null,
        )
        .map((z) => ({
          ...z,
          ...project(z.lat, z.lng),
        })),
    [zoos],
  );

  const representedCountries = useMemo(
    () => new Set(points.map((p) => p.iso2.toUpperCase())),
    [points],
  );

  const initial = useMemo(
    () =>
      points.find((p) => p.slug === activeSlug) ??
      points.find((p) => p.slug === 'zoo-praha') ??
      points[0] ??
      null,
    [points, activeSlug],
  );

  const [selectedSlug, setSelectedSlug] = useState<string | null>(initial?.slug ?? null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [hoverIso, setHoverIso] = useState<string | null>(null);
  const [focusIso, setFocusIso] = useState<string | null>(null);
  const [adminRegions, setAdminRegions] = useState<EuropeAdminRegion[] | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [viewScale, setViewScale] = useState(0.8);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;
    const update = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewScale(Math.max(rect.width / 1000, rect.height / 560));
      }
    };
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!focusIso) return undefined;
    let cancelled = false;
    import('./europe-admin-regions')
      .then((module) => {
        if (!cancelled) setAdminRegions(module.EUROPE_ADMIN_REGIONS);
      })
      .catch(() => {
        if (!cancelled) setAdminRegions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [focusIso]);

  const selected = points.find((p) => p.slug === selectedSlug) ?? initial;
  const focusedCountry = focusIso
    ? EUROPE_COUNTRY_PATHS.find((country) => country.iso2 === focusIso)
    : null;
  const hoveredCountry = hoverIso
    ? EUROPE_COUNTRY_PATHS.find((country) => country.iso2 === hoverIso)
    : null;
  const focusedCountryZoos = focusIso
    ? points.filter((point) => point.iso2.toUpperCase() === focusIso && !point.neutral)
    : [];
  const visibleCountries = focusIso
    ? EUROPE_COUNTRY_PATHS.filter((country) => country.iso2 === focusIso)
    : EUROPE_COUNTRY_PATHS;
  const visiblePoints = focusIso
    ? points.filter((point) => point.iso2.toUpperCase() === focusIso && !point.neutral)
    : points;
  const focusedCities = focusIso
    ? EUROPE_CITY_POINTS.filter((city) => city.iso2 === focusIso).slice(0, 6)
    : [];
  const focusedRegions =
    focusIso && adminRegions ? adminRegions.filter((region) => region.iso2 === focusIso) : [];

  const hudZoo = focusIso
    ? (focusedCountryZoos.find((point) => point.slug === selectedSlug) ??
      focusedCountryZoos[0] ??
      null)
    : selected;

  const mapView = useMemo(() => {
    if (!focusedCountry?.bbox) {
      return { transform: 'translate(0px, 0px) scale(1)', scale: 1 };
    }
    const [minX, minY, maxX, maxY] = focusedCountry.bbox;
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const fit = Math.min(960 / width, 510 / height);
    const scale = Math.min(60, Math.max(1.3, fit));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return {
      transform: `translate(500px, 280px) scale(${scale}) translate(${-cx}px, ${-cy}px)`,
      scale,
    };
  }, [focusedCountry]);

  const mapTransform = mapView.transform;
  const focusScale = mapView.scale;
  const markerScale = viewScale * (focusIso ? focusScale : 1);
  const pinLayout = focusIso ? layoutPinLabels(visiblePoints, markerScale) : null;
  const pinLabels = pinLayout?.labels ?? null;
  const cityLabels = focusIso
    ? layoutCityLabels(focusedCities, markerScale, pinLayout?.boxes ?? [])
    : null;

  const latLines = [40, 45, 50, 55, 60, 65];
  const lngLines = [-10, 0, 10, 20, 30];

  return (
    <div className="atlas-map-shell">
      <div className={`atlas-map-card ${compact ? 'atlas-map-compact' : ''}`}>
        <div className="atlas-map-header">
          <div className="flex items-center gap-2">
            <span className="atlas-pulse-dot" aria-hidden="true" />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/75">
              {focusIso && focusedCountry
                ? focusedCountry.nameRu.toUpperCase()
                : hoverIso && hoveredCountry
                  ? hoveredCountry.nameRu.toUpperCase()
                  : 'КАРТА ЕВРОПЫ'}
            </span>
          </div>
          {focusIso ? (
            <button
              type="button"
              className="atlas-reset-btn"
              onClick={() => {
                setFocusIso(null);
                setHoveredSlug(null);
              }}
            >
              ← Вся Европа
            </button>
          ) : (
            <span className="font-mono text-[10.5px] text-[#c8f560]">КЛИКНИТЕ НА СТРАНУ</span>
          )}
        </div>

        <div ref={stageRef} className={`atlas-map-stage ${focusIso ? 'is-focused' : ''}`}>
          <svg
            viewBox="0 0 1000 560"
            preserveAspectRatio="xMidYMid slice"
            className="atlas-svg"
            role="img"
            aria-label="Географическая карта зоопарков Европы"
          >
            <defs>
              <radialGradient id="oceanGlow" cx="50%" cy="48%" r="60%">
                <stop offset="0%" stopColor="#0f3b26" stopOpacity="0.42" />
                <stop offset="65%" stopColor="#071911" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#040c08" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="edgeLine" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c8f560" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="focusLand" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1f8a5c" />
                <stop offset="55%" stopColor="#136b46" />
                <stop offset="100%" stopColor="#0c5134" />
              </linearGradient>
              <clipPath id="mapFrame">
                <rect x="0" y="0" width="1000" height="560" />
              </clipPath>
              {focusedCountry ? (
                <clipPath id="focusCountryClip">
                  <path d={focusedCountry.d} />
                </clipPath>
              ) : null}
            </defs>

            <rect
              width="1000"
              height="560"
              fill={focusIso ? 'transparent' : '#040d09'}
              onClick={() => {
                setFocusIso(null);
                setHoverIso(null);
                setHoveredSlug(null);
              }}
            />
            {!focusIso ? (
              <rect width="1000" height="560" fill="url(#oceanGlow)" pointerEvents="none" />
            ) : null}

            <g clipPath="url(#mapFrame)">
              <g
                style={{
                  transform: mapTransform,
                  transformOrigin: '0px 0px',
                  transition: 'transform 520ms cubic-bezier(0.22, 0.61, 0.36, 1)',
                }}
              >
                {/* Curved Conic Graticule */}
                {!focusIso &&
                  latLines.map((lat) => {
                    const labelPos = project(lat, -15);
                    return (
                      <g key={`lat-${lat}`}>
                        <path
                          d={parallelPath(lat)}
                          fill="none"
                          stroke="rgba(255,255,255,0.065)"
                          strokeWidth="1"
                          strokeDasharray="3 6"
                        />
                        <text
                          x={Math.max(14, labelPos.x)}
                          y={labelPos.y - 4}
                          fill="rgba(255,255,255,0.28)"
                          fontSize="10"
                          fontFamily="var(--font-mono)"
                        >
                          {lat}°N
                        </text>
                      </g>
                    );
                  })}
                {!focusIso &&
                  lngLines.map((lng) => {
                    const labelPos = project(36.5, lng);
                    return (
                      <g key={`lng-${lng}`}>
                        <path
                          d={meridianPath(lng)}
                          fill="none"
                          stroke="rgba(255,255,255,0.065)"
                          strokeWidth="1"
                          strokeDasharray="3 6"
                        />
                        <text
                          x={labelPos.x - 12}
                          y={548}
                          fill="rgba(255,255,255,0.28)"
                          fontSize="10"
                          fontFamily="var(--font-mono)"
                        >
                          {lng === 0 ? '0°' : lng > 0 ? `${lng}°E` : `${Math.abs(lng)}°W`}
                        </text>
                      </g>
                    );
                  })}

                {/* Country geometries */}
                <g aria-label="Контуры стран Европы">
                  {visibleCountries.map((country) => {
                    const hasZoos = representedCountries.has(country.iso2);
                    const isFocused = focusIso === country.iso2;
                    const isHovered = hoverIso === country.iso2;
                    return (
                      <path
                        key={country.iso2}
                        d={country.d}
                        fill={
                          isFocused
                            ? 'url(#focusLand)'
                            : isHovered
                              ? 'rgba(200, 245, 96, 0.18)'
                              : hasZoos
                                ? 'rgba(22, 108, 69, 0.46)'
                                : 'rgba(20, 107, 67, 0.3)'
                        }
                        stroke={
                          isFocused
                            ? 'rgba(200, 245, 96, 0.9)'
                            : isHovered
                              ? 'rgba(200, 245, 96, 0.75)'
                              : hasZoos
                                ? 'rgba(134, 239, 172, 0.42)'
                                : 'rgba(134, 239, 172, 0.26)'
                        }
                        strokeWidth={isFocused ? 2 : isHovered ? 1.5 : 0.9}
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        className={`atlas-country ${focusIso ? 'is-static' : ''}`}
                        onMouseEnter={() => {
                          if (!focusIso) setHoverIso(country.iso2);
                        }}
                        onMouseLeave={() =>
                          setHoverIso((current) => (current === country.iso2 ? null : current))
                        }
                        onClick={() => {
                          if (focusIso) return;
                          setFocusIso(country.iso2);
                          setHoverIso(null);
                          setHoveredSlug(null);
                          const activeZoo = points.find(
                            (p) => p.slug === selectedSlug && p.iso2.toUpperCase() === country.iso2,
                          );
                          const firstZoo =
                            activeZoo ?? points.find((p) => p.iso2.toUpperCase() === country.iso2);
                          setSelectedSlug(firstZoo?.slug ?? null);
                        }}
                      >
                        <title>{country.nameRu}</title>
                      </path>
                    );
                  })}
                </g>

                {/* Internal administrative borders of the focused country */}
                {focusIso ? (
                  <g
                    aria-label="Административные границы"
                    pointerEvents="none"
                    clipPath="url(#focusCountryClip)"
                  >
                    {focusedRegions.map((region, index) => (
                      <path
                        key={`${region.iso2}-${index}`}
                        d={region.d}
                        fill="none"
                        stroke="rgba(224, 255, 238, 0.36)"
                        strokeWidth="0.85"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                  </g>
                ) : (
                  <g aria-label="Подписи стран" pointerEvents="none">
                    {EUROPE_COUNTRY_PATHS.map((country) => {
                      if (compact || viewScale < 0.55) return null;
                      if (!country.label || !country.bbox) return null;
                      const width = country.bbox[2] - country.bbox[0];
                      const height = country.bbox[3] - country.bbox[1];
                      if (width < 14 || height < 10) return null;
                      const hasZoos = representedCountries.has(country.iso2);
                      return (
                        <text
                          key={`label-${country.iso2}`}
                          x={country.label[0]}
                          y={country.label[1]}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={hasZoos ? 'rgba(226, 255, 238, 0.4)' : 'rgba(226, 255, 238, 0.22)'}
                          fontSize={hasZoos ? 9.5 : 8.5}
                          fontWeight={hasZoos ? 600 : 500}
                          letterSpacing="0.14em"
                          fontFamily="var(--font-mono)"
                        >
                          {country.iso2}
                        </text>
                      );
                    })}
                  </g>
                )}

                {/* Neutral disputed area: Crimea is not attributed to either country */}
                {!focusIso || focusIso === 'UA' || focusIso === 'RU' ? (
                  <g aria-label="Крым — нейтральная территория">
                    <path
                      d={CRIMEA_PATH}
                      fill={focusIso ? 'url(#focusLand)' : 'rgba(22, 108, 69, 0.46)'}
                      stroke={focusIso ? 'rgba(235, 240, 230, 0.6)' : 'rgba(235, 240, 230, 0.42)'}
                      strokeWidth={focusIso ? 2.6 : 1.8}
                      strokeDasharray="3 3"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      className="atlas-disputed"
                    />
                  </g>
                ) : null}

                {/* Major cities inside the focused country */}
                {focusIso ? (
                  <g aria-label="Крупные города" pointerEvents="none">
                    {focusedCities.map((city, index) => {
                      const placement = cityLabels?.get(index);
                      return (
                        <g key={`city-${city.iso2}-${city.name}-${index}`}>
                          <circle
                            cx={city.x}
                            cy={city.y}
                            r={2.5 / markerScale}
                            fill="rgba(226, 255, 238, 0.7)"
                            stroke="#04100a"
                            strokeWidth={1.1 / markerScale}
                          />
                          {placement && (!compact || index < 3) ? (
                            <text
                              x={city.x + placement.dx / markerScale}
                              y={city.y + placement.dy / markerScale}
                              textAnchor={placement.anchor}
                              fill="rgba(226, 255, 238, 0.74)"
                              fontSize={9 / markerScale}
                              fontWeight={600}
                              fontFamily="var(--font-sans)"
                              paintOrder="stroke"
                              stroke="#04100a"
                              strokeWidth={2.4 / markerScale}
                              strokeLinejoin="round"
                            >
                              {city.name}
                            </text>
                          ) : null}
                        </g>
                      );
                    })}
                  </g>
                ) : null}

                {/* Arcs from selected zoo to peers (base map only) */}
                {selected && !focusIso
                  ? points
                      .filter((p) => p.slug !== selected.slug)
                      .slice(0, 6)
                      .map((peer) => {
                        const mx = (selected.x + peer.x) / 2;
                        const my = Math.min(selected.y, peer.y) - 18;
                        return (
                          <path
                            key={`arc-${peer.slug}`}
                            d={`M ${selected.x} ${selected.y} Q ${mx} ${my} ${peer.x} ${peer.y}`}
                            fill="none"
                            stroke="url(#edgeLine)"
                            strokeWidth="1.05"
                            strokeDasharray="3 4"
                          />
                        );
                      })
                  : null}

                {/* Zoo pins */}
                {visiblePoints.map((point) => {
                  const isCurrent = focusIso
                    ? hudZoo?.slug === point.slug
                    : hoveredSlug === point.slug;
                  const clickable = focusIso !== null || point.neutral === true;
                  const placement = pinLabels?.get(point.slug);
                  return (
                    <g
                      key={point.slug}
                      transform={`translate(${point.x}, ${point.y})`}
                      className={`atlas-pin ${clickable ? 'is-clickable' : ''}`}
                      onMouseEnter={() => {
                        setHoveredSlug(point.slug);
                        setSelectedSlug(point.slug);
                      }}
                      onMouseLeave={() => setHoveredSlug(null)}
                      onClick={() => {
                        if (clickable) {
                          router.push(`/zoos/${point.slug}`);
                          return;
                        }
                        setFocusIso(point.iso2.toUpperCase());
                        setHoverIso(null);
                        setHoveredSlug(null);
                        setSelectedSlug(point.slug);
                      }}
                    >
                      <g className="atlas-pin-visual">
                        <circle
                          className="atlas-pin-halo"
                          r={16 / markerScale}
                          fill="rgba(200, 245, 96, 0.14)"
                          stroke="rgba(200, 245, 96, 0.4)"
                          strokeWidth={0.9 / markerScale}
                          pointerEvents="none"
                        />
                        {isCurrent ? (
                          <>
                            <circle
                              r={20 / markerScale}
                              fill="rgba(200, 245, 96, 0.16)"
                              pointerEvents="none"
                            />
                            <circle
                              r={11 / markerScale}
                              fill="none"
                              stroke="#c8f560"
                              strokeWidth={1.4 / markerScale}
                              strokeDasharray="3 2.5"
                              pointerEvents="none"
                            />
                          </>
                        ) : null}
                        <circle
                          r={(isCurrent ? 5.6 : 4.4) / markerScale}
                          fill={isCurrent ? '#c8f560' : '#4ade80'}
                          stroke="#04100a"
                          strokeWidth={1.6 / markerScale}
                        />
                      </g>
                      {focusIso && point.name && placement && (!compact || isCurrent) ? (
                        <text
                          x={placement.dx / markerScale}
                          y={placement.dy / markerScale}
                          textAnchor={placement.anchor}
                          fill="#ffffff"
                          fontSize={10.5 / markerScale}
                          fontWeight={700}
                          fontFamily="var(--font-sans)"
                          paintOrder="stroke"
                          stroke="#04100a"
                          strokeWidth={2.6 / markerScale}
                          strokeLinejoin="round"
                        >
                          {point.name}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>
        </div>

        <div className="atlas-map-hud">
          {hudZoo ? (
            <>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <strong className="text-base font-bold text-white">{hudZoo.name}</strong>
                  <span className="inline-flex items-center gap-1.5 text-xs text-white/60">
                    {hudZoo.neutral ? null : <CountryFlag iso2={hudZoo.iso2} size={14} />}
                    {hudZoo.city}, {hudZoo.country}
                  </span>
                </div>
              </div>
              {focusIso ? (
                <button
                  type="button"
                  className="atlas-hud-btn"
                  onClick={() => router.push(`/zoos/${hudZoo.slug}`)}
                >
                  Открыть карточку <ArrowUpRightIcon size={14} />
                </button>
              ) : null}
            </>
          ) : focusIso && focusedCountry ? (
            <span className="inline-flex items-center gap-2 text-xs text-white/70">
              <GlobeIcon size={14} /> Зоопарков пока нет
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
