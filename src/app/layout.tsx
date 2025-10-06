import type { Metadata } from 'next';
import { Urbanist } from 'next/font/google';
import './globals.css';
import Providers from './providers'; 

const urbanist = Urbanist({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LockBox',
  description: 'Your secure password manager',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={urbanist.className}>
        <Providers>
          <main>{children}</main>
        </Providers> 
      </body>
    </html>
  );
}

