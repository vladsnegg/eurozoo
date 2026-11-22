'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowRightIcon, SearchIcon } from './icons';

type SearchItem = {
  type: string;
  id: string;
  title: string;
  subtitle: string | null;
  url: string;
};

type SearchResponse = {
  total: number;
  groups: Array<{ type: string; label: string; items: SearchItem[] }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const TYPE_LABELS: Record<string, string> = {
  zoo: 'Зоопарк',
  species: 'Вид',
  program: 'Программа',
  country: 'Страна',
  city: 'Город',
  organization: 'Организация',
  research: 'Исследование',
};

const QUICK_JUMPS = [
  { label: 'Panthera tigris', href: '/species/panthera-tigris', tag: 'EN · Вид' },
  { label: 'Zoo Praha', href: '/zoos/zoo-praha', tag: 'CZ · 1931' },
  { label: 'Tiergarten Schönbrunn', href: '/zoos/tiergarten-schoenbrunn', tag: 'AT · 1752' },
  { label: 'Ailurus fulgens', href: '/species/ailurus-fulgens', tag: 'EN · Малая панда' },
  { label: 'EEP: западная горилла', href: '/programs/eep-gorilla-gorilla', tag: 'EEP' },
];

export function GlobalSearch() {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setItems([]);
      setTotal(0);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/search?q=${encodeURIComponent(term)}&pageSize=6`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error('search failed');
        const data = (await response.json()) as SearchResponse;
        setItems(data.groups.flatMap((group) => group.items).slice(0, 7));
        setTotal(data.total);
        setOpen(true);
      } catch {
        if (!controller.signal.aborted) {
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((event.key === '/' && !typing) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) {
        event.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    const onClickOutside = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  const hasTerm = query.trim().length >= 2;

  return (
    <div ref={wrapRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const term = query.trim();
          if (!term) return;
          setOpen(false);
          router.push(`/search?q=${encodeURIComponent(term)}`);
        }}
      >
        <label htmlFor="global-search" className="sr-only">
          Поиск по базе знаний
        </label>
        <div className="search-field">
          <SearchIcon size={15} />
          <input
            id="global-search"
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Поиск по атласу…"
            autoComplete="off"
          />
          <kbd className="search-kbd" aria-hidden="true">
            ⌘K
          </kbd>
        </div>
      </form>

      {open ? (
        <div className="search-pop" role="listbox" aria-label="Быстрый поиск и переходы">
          {!hasTerm ? (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 pb-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Быстрые переходы
                </span>
                <span className="font-mono text-[10px] text-muted">ESC — закрыть</span>
              </div>
              <ul className="m-0 grid list-none gap-1 p-0">
                {QUICK_JUMPS.map((jump) => (
                  <li key={jump.href}>
                    <Link
                      href={jump.href}
                      className="search-item flex items-center justify-between gap-2"
                      onClick={() => setOpen(false)}
                    >
                      <span className="font-semibold text-text">{jump.label}</span>
                      <span className="rounded-md border border-border bg-surface-soft px-2 py-0.5 font-mono text-[10.5px] text-muted">
                        {jump.tag}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-2 border-t border-border pt-2">
                <Link
                  href="/search"
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent-weak"
                  onClick={() => setOpen(false)}
                >
                  <span>Открыть расширенный поиск с фасетами</span>
                  <ArrowRightIcon size={13} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-1.5">
              {loading ? <p className="m-0 px-2.5 py-2 text-sm text-muted">Поиск в индексе…</p> : null}
              {!loading && items.length === 0 ? (
                <p className="m-0 px-2.5 py-2 text-sm text-muted">
                  Совпадений не найдено. Нажмите Enter для полнотекстового поиска.
                </p>
              ) : null}
              <ul className="m-0 grid list-none gap-0.5 p-0">
                {items.map((item) => (
                  <li key={`${item.type}-${item.id}`}>
                    <Link href={item.url} className="search-item" onClick={() => setOpen(false)}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-text">{item.title}</span>
                        <span className="rounded bg-surface-soft px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
                          {TYPE_LABELS[item.type] ?? item.type}
                        </span>
                      </div>
                      {item.subtitle ? (
                        <span className="mt-0.5 block text-xs text-muted">{item.subtitle}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
              {total > 0 ? (
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                  className="mt-1.5 flex items-center justify-between rounded-xl border border-border bg-surface-soft px-3 py-2 text-xs font-bold text-text"
                  onClick={() => setOpen(false)}
                >
                  <span>Все результаты по запросу «{query.trim()}»</span>
                  <span className="font-mono text-accent">{total} →</span>
                </Link>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
