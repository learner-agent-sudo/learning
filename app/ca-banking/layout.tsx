import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Canadian Banking Regulation — Learning',
  description:
    'The Bank Act and OSFI rulebook, with the vendor and third-party contract kit, for counsel at a digital bank in Canada.',
};

export default function CaBankingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
