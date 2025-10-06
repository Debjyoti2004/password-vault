'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '../components/ThemeProvider'; 
import Navbar from '@/components/Navbar';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <Navbar />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}

