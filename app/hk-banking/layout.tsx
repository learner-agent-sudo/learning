import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HK Banking Regulation — Learning',
  description:
    'The Hong Kong Banking Ordinance and HKMA rulebook, for counsel at a virtual bank.',
};

export default function HkBankingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
