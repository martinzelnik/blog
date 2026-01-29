import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'My Simple Blog',
  description: 'A simple blog with Next.js and MongoDB',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
