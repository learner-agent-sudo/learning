import Link from 'next/link';
import { ArrowRight, ChartLine, Handshake, Landmark, Lock, Umbrella, type LucideIcon } from 'lucide-react';
import { STAGES } from '@/lib/workflow';
import { BANKING_STAGES } from '@/lib/banking';
import { TONES, toneVars, type Tone } from '@/lib/theme';
import { ContinueReading, ModuleInfo, VolumeProgress } from '@/components/hub/StudyProgress';
import { ThemeToggle } from '@/components/ThemeToggle';

type TopicStatus = 'live' | 'next' | 'planned';

interface Topic {
  title: string;
  scope: string;
  description: string;
  status: TopicStatus;
  icon: LucideIcon;
  tone: Tone;
  meta?: string[];
  href?: string;
  // Storage key and stage ids, for progress kept in this browser.
  module?: string;
  stageIds?: string[];
  // Standalone HTML pages under /public need a plain <a>, not client routing.
  staticPage?: boolean;
}

const TOPICS: Topic[] = [
  {
    title: 'M&A',
    scope: 'U.S. private-company Asset Purchase Agreement',
    description: 'A deal from strategy memo to post-closing, with real contract clauses (CUAD) and the jargon explained.',
    status: 'live',
    icon: Handshake,
    tone: TONES.navy,
    meta: [`${STAGES.length} stages`, `${STAGES.reduce((n, s) => n + s.clauses.length, 0)} clauses`],
    href: '/mna/',
    module: 'mna',
    stageIds: STAGES.map((s) => s.id),
  },
  {
    title: 'Privacy & data protection',
    scope: 'GDPR',
    description: 'DataGuard: decide 20 compliance cases drawn from real GDPR enforcement decisions.',
    status: 'live',
    icon: Lock,
    tone: TONES.teal,
    meta: ['20 cases', 'game'],
    href: '/privacy/dataguard/index.html',
    staticPage: true,
  },
  {
    title: 'HK banking regulation',
    scope: 'Banking Ordinance (Cap. 155) · HKMA',
    description:
      'From the regulatory map to resolution, written for counsel at a digital bank, with the official statute text.',
    status: 'live',
    icon: Landmark,
    tone: TONES.forest,
    meta: [
      `${BANKING_STAGES.length} stages`,
      `${BANKING_STAGES.reduce((n, s) => n + s.provisions.length, 0)} provisions`,
      `${BANKING_STAGES.reduce((n, s) => n + s.checklist.length, 0)} checklist items`,
    ],
    href: '/hk-banking/',
    module: 'hk-banking',
    stageIds: BANKING_STAGES.map((s) => s.id),
  },
  {
    title: 'HK securities regulation',
    scope: 'Securities and Futures Ordinance (Cap. 571) · SFC',
    description: 'Licensing, conduct, market misconduct, takeovers, and enforcement routes.',
    status: 'next',
    icon: ChartLine,
    tone: TONES.plum,
  },
  {
    title: 'HK insurance regulation',
    scope: 'Insurance Ordinance (Cap. 41) · IA',
    description: 'Insurers, intermediaries, and policyholders: authorization, conduct, and discipline.',
    status: 'planned',
    icon: Umbrella,
    tone: TONES.bronze,
  },
];

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

function Volume({ topic, n, delay }: { topic: Topic; n: number; delay: number }) {
  const Icon = topic.icon;
  const body = (
    <>
      <div className="relative h-24 overflow-hidden bg-vol px-5 pt-4 text-onaccent dark:bg-vol/20 dark:text-vol">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-onaccent dark:text-vol">Vol. {ROMAN[n]}</span>
        <Icon
          className="absolute -bottom-5 right-3 h-24 w-24 text-onaccent/15 transition-transform dark:text-vol/25 duration-500 group-hover:-rotate-6 group-hover:scale-105"
          strokeWidth={1.25}
          aria-hidden
        />
        <span aria-hidden className="absolute inset-x-0 bottom-3 h-px bg-onaccent/20 dark:bg-vol/30" />
        <span aria-hidden className="absolute inset-x-0 bottom-1.5 h-px bg-onaccent/10 dark:bg-vol/15" />
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h3 className="font-serif text-2xl font-semibold leading-tight">{topic.title}</h3>
        <p className="mt-1 font-mono text-[11.5px] text-muted">{topic.scope}</p>
        <p className="mt-3 flex-1 leading-relaxed text-ink/80">{topic.description}</p>
        {topic.meta && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {topic.meta.map((m) => (
              <li key={m} className="rounded-full bg-vol/10 px-2.5 py-0.5 text-xs text-vol">
                {m}
              </li>
            ))}
          </ul>
        )}
        {topic.module && topic.stageIds && <VolumeProgress module={topic.module} ids={topic.stageIds} />}
        <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-vol">
          Open volume
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </p>
      </div>
    </>
  );
  const cls =
    'group flex h-full animate-rise flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift';
  const style = { ...toneVars('--vol', topic.tone), animationDelay: `${delay}ms` };
  return topic.staticPage ? (
    <a href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${topic.href}`} className={cls} style={style}>
      {body}
    </a>
  ) : (
    <Link href={topic.href!} className={cls} style={style}>
      {body}
    </Link>
  );
}

function Forthcoming({ topic, n }: { topic: Topic; n: number }) {
  const Icon = topic.icon;
  return (
    <div
      className="flex items-start gap-4 rounded-2xl border border-dashed border-ink/20 px-5 py-4"
      style={toneVars('--vol', topic.tone)}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-vol/10 text-vol">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Vol. {ROMAN[n]} · {topic.status === 'next' ? 'Up next' : 'Planned'}
        </p>
        <h3 className="mt-0.5 font-serif text-xl font-semibold leading-tight">{topic.title}</h3>
        <p className="mt-0.5 font-mono text-[11.5px] text-muted">{topic.scope}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink/75">{topic.description}</p>
      </div>
    </div>
  );
}

// Titles for the "continue" link; passed down so the client bundle does not
// carry the full stage content.
const MODULES: ModuleInfo[] = [
  {
    module: 'hk-banking',
    title: 'HK banking',
    href: '/hk-banking/',
    tone: TONES.forest,
    stages: BANKING_STAGES.map(({ id, index, title }) => ({ id, index, title })),
  },
  { module: 'mna', title: 'M&A', href: '/mna/', tone: TONES.navy, stages: STAGES.map(({ id, index, title }) => ({ id, index, title })) },
];

export default function HomePage() {
  const live = TOPICS.filter((t) => t.status === 'live');
  const coming = TOPICS.filter((t) => t.status !== 'live');
  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
      <div className="flex justify-end pt-4">
        <ThemeToggle />
      </div>
      <header className="relative overflow-hidden border-b border-line pb-10 pt-6 sm:pb-14 sm:pt-12">
        <span
          aria-hidden
          className="numeral-outline pointer-events-none absolute -right-6 -top-4 select-none font-serif text-[9rem] font-semibold leading-none text-accent/15 sm:text-[15rem]"
        >
          §
        </span>
        <p className="kicker animate-rise text-accent">A personal study library</p>
        <h1
          className="mt-3 animate-rise font-serif text-6xl font-semibold leading-[0.95] tracking-tight sm:text-8xl"
          style={{ animationDelay: '60ms' }}
        >
          Learning
        </h1>
        <p
          className="mt-5 max-w-2xl animate-rise font-serif text-xl leading-snug text-ink/75 sm:text-2xl"
          style={{ animationDelay: '120ms' }}
        >
          Deals, privacy and Hong Kong financial regulation, broken into stages you can work through one at a
          time: key points first, then the detail, the law and a checklist.
        </p>
        <ContinueReading modules={MODULES} />
      </header>

      <section className="mt-10">
        <h2 className="kicker mb-4">On the shelf</h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {live.map((t, i) => (
            <li key={t.title}>
              <Volume topic={t} n={TOPICS.indexOf(t)} delay={180 + i * 80} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="kicker mb-4">In preparation</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {coming.map((t) => (
            <li key={t.title}>
              <Forthcoming topic={t} n={TOPICS.indexOf(t)} />
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-16 border-t border-line pt-5 text-xs text-muted">
        Personal study site. Educational only, not legal advice.
      </footer>
    </main>
  );
}
