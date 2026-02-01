/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './_components/Providers';

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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
