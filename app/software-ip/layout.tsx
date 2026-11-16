import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Open Source & Software IP — Learning',
  description:
    'US copyright, patents, trade secrets, trademarks and open source licences for counsel at a bank or fintech, with a licence finder and checklists.',
};

export default function SoftwareIpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
