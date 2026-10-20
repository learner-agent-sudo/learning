import Link from 'next/link';

export const metadata = {
  title: 'About — Learning M&A',
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <nav className="mb-6 text-sm">
        <Link href="/mna/" className="text-accent hover:underline">
          ← Back to workflow
        </Link>
      </nav>

      <h1 className="text-2xl font-semibold">About this site</h1>

      <section className="prose prose-slate mt-6 max-w-none text-sm leading-relaxed">
        <p>
          <strong>Learning M&amp;A</strong> is an interactive, browser-based
          walkthrough of a U.S. private-company{' '}
          <strong>Asset Purchase Agreement (APA)</strong> transaction, from
          strategy through post-closing. v1 covers the APA structure only;
          Stock Purchase Agreements and statutory mergers are flagged at the
          LOI branch and will be added later.
        </p>

        <h2 className="mt-8 text-lg font-semibold">Data sources</h2>
        <p>
          Clause excerpts are drawn from two sources, and every clause card
          shows a <em>provenance pill</em> identifying which:
        </p>
        <ul className="list-disc pl-5">
          <li>
            <strong>CUAD</strong> — the{' '}
            <a
              className="text-accent hover:underline"
              href="https://www.atticusprojectai.org/cuad"
              target="_blank"
              rel="noreferrer"
            >
              Contract Understanding Atticus Dataset
            </a>{' '}
            (Atticus Project, CC BY 4.0). 510 commercial contracts annotated
            by lawyers across 41 clause categories.
          </li>
          <li>
            <strong>Hand-authored</strong> — illustrative drafting for
            APA-specific provisions that CUAD under-represents (purchased
            assets, indemnification mechanics, MAC, working-capital
            adjustment, etc.).
          </li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold">Disclaimer</h2>
        <p>
          Clause excerpts shown on this site are illustrative, not legal
          advice. CUAD excerpts reflect the contracts that CUAD&apos;s
          annotators happened to label — not necessarily best-in-class APA
          drafting. Hand-authored examples are pedagogical and do not
          substitute for jurisdiction-specific drafting by counsel. Real
          transactions involve client-specific facts and licensed
          attorneys.
        </p>

        <h2 className="mt-8 text-lg font-semibold">Tech</h2>
        <p>
          Static Next.js 15 + React 19 site, Tailwind for styles, Mermaid
          for the workflow diagram. CUAD is preprocessed at build time by a
          Python script (<code>scripts/extract_cuad.py</code>). No backend,
          no analytics, no user data collected.
        </p>
      </section>
    </main>
  );
}
