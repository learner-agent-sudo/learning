import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HK Insurance Regulation — Learning',
  description:
    'The Hong Kong Insurance Ordinance and the Insurance Authority, for counsel at a digital bank that wants to sell insurance in its app.',
};

export default function HkInsuranceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
