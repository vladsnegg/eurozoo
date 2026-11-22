'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import { toPng } from 'html-to-image';
import '@xyflow/react/dist/style.css';

type GraphNode = {
  type: string;
  id: string;
  label: string;
  subtitle: string | null;
  url: string;
  degree: number;
};

type GraphEdge = {
  src: string;
  dst: string;
  predicate: string;
  labelRu: string;
  confidence: number | null;
  inferred: boolean;
};

type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  truncated: boolean;
  stats: { nodes: number; edges: number; depth: number };
};

type Predicate = { code: string; labelRu: string };

const TYPE_COLORS: Record<string, string> = {
  zoo: '#1f6f4a',
  species: '#245a8d',
  taxon: '#5b7f2a',
  city: '#9a6a12',
  country: '#a33a2b',
  program: '#6b4a8d',
  organization: '#4a6b8d',
  research: '#8d4a6b',
};

const TYPE_LABELS: Record<string, string> = {
  zoo: 'Зоопарк',
  species: 'Вид',
  taxon: 'Таксон',
  city: 'Город',
  country: 'Страна',
  program: 'Программа',
  organization: 'Организация',
  research: 'Исследование',
};

const TYPES = ['zoo', 'species', 'taxon', 'city', 'country', 'program', 'organization', 'research'];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export function GraphView({
  initialSeed,
  predicates,
}: {
  initialSeed: { type: string; id: string } | null;
  predicates: Predicate[];
}) {
  const router = useRouter();
  const [seed, setSeed] = useState(initialSeed);
  const [depth, setDepth] = useState(2);
  const [types, setTypes] = useState<string[]>(TYPES);
  const [selectedPredicates, setSelectedPredicates] = useState<string[]>([]);
  const [includeInferred, setIncludeInferred] = useState(true);
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [layout, setLayout] = useState<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!seed) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      seed: `${seed.type}:${seed.id}`,
      depth: String(depth),
      inferred: String(includeInferred),
      limit: '200',
    });
    if (types.length > 0) params.set('types', types.join(','));
    if (selectedPredicates.length > 0) params.set('predicates', selectedPredicates.join(','));

    fetch(`${API_URL}/graph?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('graph request failed');
        return (await response.json()) as GraphData;
      })
      .then((payload) => setData(payload))
      .catch(() => {
        if (!controller.signal.aborted) setError('Не удалось загрузить граф.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [seed, depth, types, selectedPredicates, includeInferred]);

  useEffect(() => {
    if (!data) {
      setLayout({ nodes: [], edges: [] });
      return;
    }

    const typeById = new Map(data.nodes.map((node) => [node.id, node.type]));
    const elk = new ELK();
    const graph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        'elk.spacing.nodeNode': '32',
        'elk.layered.spacing.nodeNodeBetweenLayers': '64',
      },
      children: data.nodes.map((node) => ({
        id: `${node.type}:${node.id}`,
        width: 190,
        height: 64,
      })),
      edges: data.edges.map((edge, index) => ({
        id: `e${index}`,
        sources: [`${typeById.get(edge.src) ?? 'zoo'}:${edge.src}`],
        targets: [`${typeById.get(edge.dst) ?? 'zoo'}:${edge.dst}`],
      })),
    };

    void elk.layout(graph).then((result) => {
      const positions = new Map(
        (result.children ?? []).map((child) => [child.id ?? '', { x: child.x ?? 0, y: child.y ?? 0 }]),
      );

      const nodes: Node[] = data.nodes.map((node) => {
        const key = `${node.type}:${node.id}`;
        const position = positions.get(key) ?? { x: 0, y: 0 };
        return {
          id: key,
          position,
          data: {
            label: (
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', opacity: 0.7 }}>
                  {TYPE_LABELS[node.type] ?? node.type}
                </div>
                <div style={{ fontWeight: 600, lineHeight: 1.2 }}>{node.label}</div>
                {node.subtitle ? (
                  <div style={{ fontSize: 11, opacity: 0.75 }}>{node.subtitle}</div>
                ) : null}
              </div>
            ),
          },
          style: {
            width: 190,
            borderLeft: `4px solid ${TYPE_COLORS[node.type] ?? '#666'}`,
            borderRadius: 8,
            background: '#fff',
            padding: 8,
            fontSize: 12,
          },
        };
      });

      const edges: Edge[] = data.edges.map((edge, index) => ({
        id: `e${index}`,
        source: `${typeById.get(edge.src) ?? 'zoo'}:${edge.src}`,
        target: `${typeById.get(edge.dst) ?? 'zoo'}:${edge.dst}`,
        label: edge.labelRu,
        animated: false,
        style: edge.inferred ? { strokeDasharray: '6 4', stroke: '#9a6a12' } : undefined,
        markerEnd: { type: MarkerType.ArrowClosed },
      }));

      setLayout({ nodes, edges });
    });
  }, [data]);

  const applyFilters = useCallback(() => {
    if (!seed) return;
    const params = new URLSearchParams({ seed: `${seed.type}:${seed.id}`, depth: String(depth) });
    if (types.length > 0) params.set('types', types.join(','));
    if (selectedPredicates.length > 0) params.set('predicates', selectedPredicates.join(','));
    if (includeInferred) params.set('inferred', 'true');
    router.replace(`/graph?${params.toString()}`);
  }, [seed, depth, types, selectedPredicates, includeInferred, router]);

  const selectedNode = useMemo(
    () => data?.nodes.find((node) => selected && node.id === selected.id) ?? null,
    [data, selected],
  );

  const toggle = (value: string, list: string[], setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // клипборд может быть недоступен; молча игнорируем
    }
  };

  const exportPng = async () => {
    if (!canvasRef.current) return;
    const dataUrl = await toPng(canvasRef.current, { backgroundColor: '#fbfaf7' });
    const link = document.createElement('a');
    link.download = 'eurozoo-graph.png';
    link.href = dataUrl;
    link.click();
  };

  if (!seed) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-border bg-surface p-6">
        <p className="m-0 font-medium">Выберите стартовую сущность</p>
        <p className="mb-0 mt-2 text-sm text-muted">
          Откройте карточку зоопарка или вида и нажмите «Открыть в графе».
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="graph-controls">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm">
            Глубина
            <select
              value={depth}
              onChange={(event) => setDepth(Number(event.target.value))}
              className="select ml-2 !w-auto !min-h-0 !py-1.5"
            >
              {[1, 2, 3].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeInferred}
              onChange={(event) => setIncludeInferred(event.target.checked)}
            />
            Показывать выведенные
          </label>
          <button type="button" onClick={applyFilters} className="btn btn-primary btn-sm">
            Применить
          </button>
          <button type="button" onClick={copyLink} className="btn btn-outline btn-sm">
            Скопировать ссылку
          </button>
          <button type="button" onClick={exportPng} className="btn btn-outline btn-sm">
            PNG
          </button>
          <button type="button" onClick={() => router.push('/graph')} className="btn btn-outline btn-sm">
            Сбросить
          </button>
        </div>

        <fieldset className="flex flex-wrap gap-3 border-0 p-0">
          <legend className="mb-1 text-sm font-medium">Типы узлов</legend>
          {TYPES.map((type) => (
            <label key={type} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={types.includes(type)}
                onChange={() => toggle(type, types, setTypes)}
              />
              {TYPE_LABELS[type]}
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-wrap gap-3 border-0 p-0">
          <legend className="mb-1 text-sm font-medium">Связи</legend>
          {predicates.map((predicate) => (
            <label key={predicate.code} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selectedPredicates.includes(predicate.code)}
                onChange={() => toggle(predicate.code, selectedPredicates, setSelectedPredicates)}
              />
              {predicate.labelRu}
            </label>
          ))}
        </fieldset>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-[#ecc9c2] bg-[#fcefec] px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {loading ? <p className="text-sm text-muted">Загружаем граф…</p> : null}

      {data ? (
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <span>
              Узлов: {data.stats.nodes} · связей: {data.stats.edges}
            </span>
            {data.truncated ? (
              <span className="text-[#7a5410]">Показаны не все связи — уменьшите глубину.</span>
            ) : null}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
            <div ref={canvasRef} className="graph-canvas">
              <ReactFlow
                nodes={layout.nodes}
                edges={layout.edges}
                fitView
                onNodeClick={(_, node) => {
                  const [type, ...rest] = node.id.split(':');
                  const id = rest.join(':');
                  const found = data.nodes.find((item) => item.id === id && item.type === type);
                  if (found) setSelected(found);
                }}
                proOptions={{ hideAttribution: true }}
              >
                <Background />
                <MiniMap />
                <Controls />
              </ReactFlow>
            </div>

            <aside className="panel p-4 text-sm">
              {selectedNode ? (
                <>
                  <p className="m-0 text-xs uppercase tracking-wide text-muted">
                    {TYPE_LABELS[selectedNode.type] ?? selectedNode.type}
                  </p>
                  <p className="mb-1 mt-1 font-medium">{selectedNode.label}</p>
                  {selectedNode.subtitle ? <p className="m-0 text-muted">{selectedNode.subtitle}</p> : null}
                  <p className="mt-2 text-muted">Связей: {selectedNode.degree}</p>
                  <a href={selectedNode.url} className="mt-2 inline-block">
                    Открыть карточку
                  </a>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm mt-3"
                    onClick={() => {
                      setSeed({ type: selectedNode.type, id: selectedNode.id });
                      setSelected(null);
                    }}
                  >
                    Развернуть от этого узла
                  </button>
                </>
              ) : (
                <p className="m-0 text-muted">Нажмите на узел, чтобы увидеть подробности.</p>
              )}
            </aside>
          </div>

          <details className="panel p-4">
            <summary className="cursor-pointer text-sm font-medium">Список связей</summary>
            <ul className="mt-3 grid list-none gap-1 p-0 text-sm">
              {data.edges.map((edge, index) => (
                <li key={`${edge.predicate}-${index}`}>
                  {edge.labelRu}: {edge.src.slice(0, 8)} → {edge.dst.slice(0, 8)}
                  {edge.inferred ? ' (выведено)' : ''}
                </li>
              ))}
            </ul>
          </details>
        </>
      ) : null}
    </div>
  );
}
