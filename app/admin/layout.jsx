'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SignOut,
  ArrowSquareOut,
  ShieldCheck,
  SoccerBall,
  User,
  Spinner,
} from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { ToastProvider } from '@/components/admin/Toast';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAuthSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const currentSession = data?.session || null;

        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession?.user || null);
          setIsAuthLoading(false);

          const isLoginPage = pathname === '/admin/login';

          if (!currentSession && !isLoginPage) {
            router.replace('/admin/login');
          } else if (currentSession && isLoginPage) {
            router.replace('/admin');
          }
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        if (isMounted) {
          setIsAuthLoading(false);
          if (pathname !== '/admin/login') {
            router.replace('/admin/login');
          }
        }
      }
    }

    checkAuthSession();

    // Listen to Supabase Auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      setUser(newSession?.user || null);
      setIsAuthLoading(false);

      const isLoginPage = pathname === '/admin/login';
      if (!newSession && !isLoginPage) {
        router.replace('/admin/login');
      } else if (newSession && isLoginPage) {
        router.replace('/admin');
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [pathname, router]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.replace('/admin/login');
    }
  };

  // If loading and accessing protected admin page, show secure loading screen
  if (isAuthLoading && pathname !== '/admin/login') {
    return (
      <div className="min-h-screen loui-pitch-bg flex flex-col items-center justify-center text-center p-4 relative">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative w-16 h-16 mb-3 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl border-4 border-emerald-600/30 border-t-lime-400 animate-spin" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/og1jrvy3/image/upload/f_auto,q_auto,w_100/v1789010759/756654575_17897804865557650_2370756875670529296_n.jpg"
              alt="LOUIFOOTBALL"
              className="w-11 h-11 rounded-xl object-cover shadow-md"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/100x100/225717/ffffff?text=Loui';
              }}
            />
          </div>
          <h2 className="text-xl font-bold font-loui text-white tracking-widest uppercase">
            LOUI<span className="text-lime-400">FOOTBALL</span>
          </h2>
          <span className="text-xs text-lime-400 font-semibold tracking-wider uppercase mt-0.5">
            Admin Portal
          </span>
          <p className="text-xs text-emerald-300/80 mt-2 flex items-center gap-1.5">
            <Spinner size={14} className="animate-spin" />
            Memverifikasi sesi otentikasi...
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated and NOT on login page, render nothing while redirecting
  if (!session && pathname !== '/admin/login') {
    return null;
  }

  // If on login page, render clean layout without admin navbar
  if (pathname === '/admin/login') {
    return <ToastProvider>{children}</ToastProvider>;
  }

  // Authenticated Admin Dashboard Layout
  return (
    <ToastProvider>
      <div className="min-h-screen loui-pitch-bg text-emerald-50 flex flex-col relative">
        {/* Ambient Dark Overlay to make content readable while maintaining rich pitch texture */}
        <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />

        {/* Sticky Admin Header Navigation */}
        <header className="sticky top-0 z-40 bg-emerald-950/90 backdrop-blur-md border-b border-emerald-800/80 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            {/* Brand Logo & Title from Cloudinary (matching home page) */}
            <div className="flex items-center gap-3">
              <Link href="/admin" className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none">
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-emerald-500/40 shadow-md group-hover:scale-105 transition shrink-0 bg-emerald-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://res.cloudinary.com/og1jrvy3/image/upload/f_auto,q_auto,w_100/v1789010759/756654575_17897804865557650_2370756875670529296_n.jpg"
                    alt="LOUIFOOTBALL"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/100x100/225717/ffffff?text=Loui';
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl font-loui tracking-wider text-white leading-none group-hover:text-lime-300 transition">
                      LOUI<span className="text-lime-400">FOOTBALL</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-400/20 border border-lime-400/50 text-lime-300">
                      ADMIN
                    </span>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest text-emerald-300 font-semibold mt-0.5 hidden sm:inline">
                    Merchandise Management
                  </span>
                </div>
              </Link>
            </div>

            {/* Right Action Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Link to Storefront */}
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-xs font-semibold hover:bg-emerald-800 hover:text-white transition shadow-sm"
                title="Buka Toko LOUIFOOTBALL di tab baru"
              >
                <ArrowSquareOut size={15} />
                <span className="hidden md:inline">Lihat Toko</span>
              </Link>

              {/* Admin User Info Pill */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-900/40 border border-emerald-800/60 text-xs text-emerald-200">
                <div className="w-5 h-5 rounded-full bg-emerald-800 flex items-center justify-center text-lime-400">
                  <User size={12} weight="bold" />
                </div>
                <span className="max-w-[140px] truncate font-medium text-emerald-100">
                  {user?.email || 'Admin'}
                </span>
                <ShieldCheck size={14} className="text-lime-400 shrink-0" />
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-700/40 text-rose-200 text-xs font-semibold hover:bg-rose-900/80 hover:text-white transition cursor-pointer shadow-sm"
                title="Keluar dari sesi admin"
              >
                <SignOut size={16} />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>

        {/* Admin Footer */}
        <footer className="relative z-10 border-t border-emerald-900/60 bg-emerald-950/60 backdrop-blur-sm py-4 text-center text-xs text-emerald-400/70">
          <p>© {new Date().getFullYear()} LOUIFOOTBALL Admin Portal • Powered by Supabase & Cloudinary</p>
        </footer>
      </div>
    </ToastProvider>
  );
}
