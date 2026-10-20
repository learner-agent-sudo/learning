import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Learning',
  description:
    'Personal study site: M&A, privacy, and Hong Kong financial regulation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
