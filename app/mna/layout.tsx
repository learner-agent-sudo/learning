import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learning M&A — APA Workflow',
  description:
    'Interactive walkthrough of a U.S. private-company Asset Purchase Agreement.',
};

export default function MnaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
