'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRightIcon,
  BookIcon,
  CompassIcon,
  DatabaseIcon,
  GlobeIcon,
  NetworkIcon,
  NewspaperIcon,
  PawIcon,
  ShieldIcon,
  SparkIcon,
} from './icons';

const PRIMARY_NAV = [
  { href: '/', label: 'Атлас', exact: true },
  { href: '/zoos', label: 'Зоопарки' },
  { href: '/species', label: 'Виды' },
  { href: '/programs', label: 'Программы' },
  { href: '/news', label: 'Новости' },
  { href: '/countries', label: 'География' },
  { href: '/graph', label: 'Граф' },
];

const MEGA_DOMAINS = [
  {
    href: '/zoos',
    title: 'Зоопарки Европы',
    meta: 'Каталог',
    desc: 'Коллекции, координаты WGS84, годы основания и программы.',
    icon: CompassIcon,
  },
  {
    href: '/species',
    title: 'Биологические виды',
    meta: 'IUCN',
    desc: 'Статусы угрозы, ареалы, биномиальная номенклатура и зоопарки.',
    icon: PawIcon,
  },
  {
    href: '/taxonomy',
    title: 'Таксономическое древо',
    meta: 'Древо',
    desc: 'Иерархия от царства Animalia до семейств, родов и видов.',
    icon: SparkIcon,
  },
  {
    href: '/programs',
    title: 'Программы сохранения',
    meta: 'EEP / ESB',
    desc: 'Европейские программы разведения и международные племенные книги.',
    icon: ShieldIcon,
  },
  {
    href: '/news',
    title: 'Новости зоопарков',
    meta: 'Официальные сайты',
    desc: 'Свежие обновления: события, пополнения и проекты зоопарков.',
    icon: NewspaperIcon,
  },
  {
    href: '/countries',
    title: 'География атласа',
    meta: 'Профили',
    desc: 'Национальные профили, членство в ЕС и распределение коллекций.',
    icon: GlobeIcon,
  },
  {
    href: '/graph',
    title: 'Граф знаний',
    meta: 'R1–R6',
    desc: 'Интерактивный обход связей и логический вывод по онтологии.',
    icon: NetworkIcon,
  },
  {
    href: '/research',
    title: 'Научные исследования',
    meta: 'In-situ / Ex-situ',
    desc: 'Программы реинтродукции, мониторинга и генетики популяций.',
    icon: BookIcon,
  },
  {
    href: '/organizations',
    title: 'Организации и союзы',
    meta: 'EAZA / WAZA',
    desc: 'Международные операторы программ и национальные федерации.',
    icon: DatabaseIcon,
  },
];

export function SiteNav() {
  const pathname = usePathname();
  const [openMega, setOpenMega] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpenMega(false);
  }, [pathname]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpenMega(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMega(false);
    };
    window.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={wrapRef} className="site-nav-wrap">
      <nav className="site-nav" aria-label="Основная навигация">
        <ul className="nav-list">
          {PRIMARY_NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="nav-link"
                  data-active={active ? 'true' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setOpenMega((prev) => !prev)}
              aria-expanded={openMega}
              className="nav-link nav-mega-trigger"
              data-active={openMega ? 'true' : undefined}
            >
              <span>Все разделы</span>
              <span className={`nav-chevron ${openMega ? 'rotate-180' : ''}`} aria-hidden="true">
                ▾
              </span>
            </button>
          </li>
        </ul>
      </nav>

      {openMega ? (
        <div className="mega-drawer" role="dialog" aria-label="Навигация по разделам базы знаний">
          <div className="mega-drawer-head">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c8f560]">
                Архитектура EuroZoo Atlas · 8 доменов
              </span>
              <p className="m-0 mt-1 text-xs text-white/60">
                Выберите раздел базы знаний или откройте реестр первоисточников
              </p>
            </div>
            <Link href="/sources" className="mega-sources-pill" onClick={() => setOpenMega(false)}>
              <ShieldIcon size={14} />
              <span>Реестр 534 источников</span>
              <ArrowUpRightIcon size={13} />
            </Link>
          </div>

          <div className="mega-grid">
            {MEGA_DOMAINS.map((domain) => {
              const Icon = domain.icon;
              const isCurrent = pathname === domain.href || pathname.startsWith(`${domain.href}/`);
              return (
                <Link
                  key={domain.href}
                  href={domain.href}
                  className={`mega-card ${isCurrent ? 'mega-card-active' : ''}`}
                  onClick={() => setOpenMega(false)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="mega-icon">
                      <Icon size={18} />
                    </span>
                    <span className="font-mono text-[10px] text-white/45">{domain.meta}</span>
                  </div>
                  <strong className="mt-2.5 block text-sm font-bold text-white">
                    {domain.title}
                  </strong>
                  <span className="mt-1 block text-xs leading-relaxed text-white/60">
                    {domain.desc}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
