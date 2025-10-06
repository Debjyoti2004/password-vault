'use client';

import { useTheme } from './ThemeProvider';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

import { Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { data: session, status } = useSession();
  const pathname = usePathname(); 
  const isAuthenticated = status === 'authenticated';

  return (
    <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm fixed w-full z-50">
      <div className="container mx-auto px-4 flex justify-between items-center py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png" 
            alt="LockBOX Logo"
            width={32} 
            height={40} 
            className="h-9 w-8"
          />
          <span className="text-2xl font-bold text-slate-800 dark:text-white">LockBox</span>
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-6 w-6 text-yellow-300" />
            ) : (
              <Moon className="h-6 w-6 text-blue-600" />
            )}
          </button>

          {isAuthenticated ? (
            <button
              onClick={() => signOut()}
              className="px-4 py-2 font-semibold text-white bg-red-600 rounded-md shadow-sm transition hover:bg-red-700"
            >
              Sign Out
            </button>
          ) : (
            pathname === '/' && (
              <>
                <Link href="/login" className="px-4 py-2 font-medium text-slate-700 dark:text-slate-200 rounded-md transition hover:bg-slate-100 dark:hover:bg-slate-700">
                  Login
                </Link>
                <Link href="/signup" className="px-4 py-2 font-semibold text-white bg-gradient-to-br from-blue-500 to-purple-600 rounded-md shadow-lg transition hover:shadow-blue-500/50">
                  Sign Up
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </nav>
  );
}

