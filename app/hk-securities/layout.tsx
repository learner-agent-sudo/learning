import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HK Securities Regulation — Learning',
  description:
    'The Hong Kong Securities and Futures Ordinance and SFC rulebook, for counsel at a bank registered with the SFC.',
};

export default function HkSecuritiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
