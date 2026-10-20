'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// The minimal shape the diagram needs; each topic's stage type satisfies it.
export interface DiagramStage {
  id: string;
  index: number;
  title: string;
  kind?: string;
}

interface Props {
  stages: DiagramStage[];
  selectedStageId: string | null;
  enabledStageIds: Set<string>;
  onSelectStage: (stageId: string) => void;
  // Mermaid class per stage plus its style; defaults to the M&A deal phases.
  classOf?: (stage: DiagramStage) => string;
  classDefs?: Record<string, string>;
  label?: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  flowchart: { htmlLabels: true, curve: 'basis' },
  themeVariables: {
    primaryColor: '#ffffff',
    primaryTextColor: '#0f172a',
    primaryBorderColor: '#cbd5e1',
    lineColor: '#94a3b8',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  },
});

function phaseFor(index: number): 'pre' | 'active' | 'post' {
  if (index <= 3) return 'pre';
  if (index <= 6) return 'active';
  return 'post';
}

const DEAL_PHASE_CLASS = { pre: 'phasePre', active: 'phaseActive', post: 'phasePost' };

const DEFAULT_CLASS_OF = (s: DiagramStage) => DEAL_PHASE_CLASS[phaseFor(s.index)];

const DEFAULT_CLASS_DEFS: Record<string, string> = {
  phasePre: 'fill:#eff6ff,stroke:#93c5fd,color:#0f172a',
  phaseActive: 'fill:#fffbeb,stroke:#fcd34d,color:#0f172a',
  phasePost: 'fill:#ecfdf5,stroke:#6ee7b7,color:#0f172a',
};

function buildSpec(
  stages: DiagramStage[],
  classOf: (s: DiagramStage) => string,
  classDefs: Record<string, string>
): string {
  const lines: string[] = ['flowchart TD'];
  for (const s of stages) {
    lines.push(`  ${s.id}["${s.title}"]`);
  }
  for (let i = 0; i < stages.length - 1; i++) {
    lines.push(`  ${stages[i].id} --> ${stages[i + 1].id}`);
  }
  for (const [name, style] of Object.entries(classDefs)) {
    lines.push(`  classDef ${name} ${style}`);
  }
  lines.push('  classDef preProcess stroke-dasharray: 5 5');
  const groups: Record<string, string[]> = {};
  for (const s of stages) (groups[classOf(s)] ||= []).push(s.id);
  for (const [name, ids] of Object.entries(groups)) {
    lines.push(`  class ${ids.join(',')} ${name}`);
  }
  const dashed = stages.filter((s) => s.kind === 'pre-process').map((s) => s.id);
  if (dashed.length) lines.push(`  class ${dashed.join(',')} preProcess`);
  return lines.join('\n');
}

export function WorkflowDiagram({
  stages,
  selectedStageId,
  enabledStageIds,
  onSelectStage,
  classOf = DEFAULT_CLASS_OF,
  classDefs = DEFAULT_CLASS_DEFS,
  label = 'M&A workflow diagram',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef('mermaid-' + Math.random().toString(36).slice(2, 9));

  useEffect(() => {
    let cancelled = false;
    const spec = buildSpec(stages, classOf, classDefs);
    mermaid
      .render(idRef.current, spec)
      .then(({ svg }) => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
        wireUp(containerRef.current, stages, enabledStageIds, onSelectStage, selectedStageId);
      })
      .catch((err) => {
        console.error('Mermaid render error', err);
      });
    return () => {
      cancelled = true;
    };
  }, [stages, selectedStageId, enabledStageIds, onSelectStage, classOf, classDefs]);

  return (
    <div
      ref={containerRef}
      className="mermaid-host overflow-x-auto rounded-lg border border-slate-200 bg-white p-4"
      role="img"
      aria-label={label}
    >
      <div
        className="mx-auto flex w-40 animate-pulse flex-col items-center gap-3 py-2"
        aria-hidden
      >
        {Array.from({ length: stages.length }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-7 w-40 rounded bg-slate-100" />
            {i < stages.length - 1 && <div className="h-3 w-px bg-slate-200" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function wireUp(
  host: HTMLElement,
  stages: DiagramStage[],
  enabledIds: Set<string>,
  onSelect: (id: string) => void,
  selectedId: string | null
) {
  const svg = host.querySelector('svg');
  if (!svg) return;
  svg.style.maxWidth = '100%';
  svg.style.height = 'auto';

  // Build a title -> stage map for matching nodes by their rendered text.
  const byTitle = new Map<string, DiagramStage>();
  for (const s of stages) byTitle.set(s.title.trim().toLowerCase(), s);

  const nodes = svg.querySelectorAll<SVGGElement>('g.node');
  for (const node of Array.from(nodes)) {
    const text = (node.textContent || '').trim().toLowerCase();
    const stage = byTitle.get(text);
    if (!stage) continue;
    node.dataset.stageId = stage.id;

    const enabled = enabledIds.has(stage.id);
    const selected = selectedId === stage.id;
    node.style.cursor = enabled ? 'pointer' : 'not-allowed';
    node.style.opacity = enabled ? '1' : '0.4';
    node.setAttribute('tabindex', enabled ? '0' : '-1');
    node.setAttribute('role', 'button');
    node.setAttribute(
      'aria-label',
      `${stage.title}${enabled ? '' : ' (coming soon)'}`
    );
    if (selected) {
      const shape = node.querySelector<SVGElement>('rect, polygon, path');
      // Inline style: Mermaid's class styles outrank presentation attributes.
      if (shape) {
        shape.style.stroke = '#2563eb';
        shape.style.strokeWidth = '3px';
      }
    }
  }

  // Single delegated click handler on the SVG root.
  const handleClick = (e: Event) => {
    const target = e.target as Element | null;
    const nodeEl = target?.closest('g.node') as SVGGElement | null;
    const id = nodeEl?.dataset.stageId;
    if (id && enabledIds.has(id)) onSelect(id);
  };
  const handleKey = (e: Event) => {
    const ke = e as KeyboardEvent;
    if (ke.key !== 'Enter' && ke.key !== ' ') return;
    const target = ke.target as Element | null;
    const nodeEl = target?.closest('g.node') as SVGGElement | null;
    const id = nodeEl?.dataset.stageId;
    if (id && enabledIds.has(id)) {
      ke.preventDefault();
      onSelect(id);
    }
  };
  svg.addEventListener('click', handleClick);
  svg.addEventListener('keydown', handleKey);
}
