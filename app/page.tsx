import Link from 'next/link';

type TopicStatus = 'live' | 'next' | 'planned';

interface Topic {
  title: string;
  scope: string;
  description: string;
  status: TopicStatus;
  href?: string;
  // Standalone HTML pages under /public need a plain <a>, not client routing.
  staticPage?: boolean;
}

const TOPICS: Topic[] = [
  {
    title: 'M&A',
    scope: 'U.S. private-company Asset Purchase Agreement',
    description:
      'Nine-stage deal workflow from strategy to post-closing, with real contract clauses (CUAD) and a glossary.',
    status: 'live',
    href: '/mna/',
  },
  {
    title: 'Privacy & data protection',
    scope: 'GDPR',
    description:
      'DataGuard: decide 20 compliance cases drawn from real GDPR enforcement decisions.',
    status: 'live',
    href: '/privacy/dataguard/index.html',
    staticPage: true,
  },
  {
    title: 'HK banking regulation',
    scope: 'Banking Ordinance (Cap. 155) · HKMA',
    description:
      'Life of a bank: authorization, capital, AML, conduct, supervision, and resolution.',
    status: 'next',
  },
  {
    title: 'HK securities regulation',
    scope: 'Securities and Futures Ordinance (Cap. 571) · SFC',
    description:
      'Licensing, conduct, market misconduct, takeovers, and enforcement routes.',
    status: 'planned',
  },
  {
    title: 'HK insurance regulation',
    scope: 'Insurance Ordinance (Cap. 41) · IA',
    description:
      'Insurers, intermediaries, and policyholders: authorization, conduct, and discipline.',
    status: 'planned',
  },
];

const STATUS_PILL: Record<TopicStatus, { label: string; className: string }> = {
  live: { label: 'Live', className: 'bg-emerald-50 text-emerald-700' },
  next: { label: 'Up next', className: 'bg-blue-50 text-blue-700' },
  planned: { label: 'Planned', className: 'bg-slate-100 text-muted' },
};

const CARD = 'block h-full rounded-lg border p-4 sm:p-5';

function TopicCard({ topic }: { topic: Topic }) {
  const pill = STATUS_PILL[topic.status];
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold leading-snug">{topic.title}</h2>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${pill.className}`}
        >
          {pill.label}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-muted">{topic.scope}</p>
      <p className="mt-3 text-sm leading-relaxed">{topic.description}</p>
      {topic.href && (
        <p className="mt-3 text-sm font-medium text-accent">Open →</p>
      )}
    </>
  );

  if (!topic.href) {
    return (
      <div className={`${CARD} border-dashed border-slate-300 bg-panel opacity-80`}>
        {body}
      </div>
    );
  }
  const live = `${CARD} border-slate-200 bg-white transition-shadow hover:border-slate-300 hover:shadow-sm`;
  return topic.staticPage ? (
    <a href={topic.href} className={live}>
      {body}
    </a>
  ) : (
    <Link href={topic.href} className={live}>
      {body}
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-semibold sm:text-3xl">Learning</h1>
        <p className="mt-1 text-sm text-muted">
          Interactive study notes on deals, privacy, and Hong Kong financial
          regulation.
        </p>
      </header>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {TOPICS.map((topic) => (
          <li key={topic.title}>
            <TopicCard topic={topic} />
          </li>
        ))}
      </ul>

      <footer className="mt-12 border-t border-slate-200 pt-4 text-xs text-muted">
        Personal study site — educational only, not legal advice.
      </footer>
    </main>
  );
}
