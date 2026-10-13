'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LockKey,
  Eye,
  EyeSlash,
  CheckCircle,
  WarningCircle,
  ArrowLeft,
  Spinner,
} from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/admin/Toast';

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initRecovery() {
      try {
        if (typeof window !== 'undefined') {
          // 1. Cek jika terdapat parameter code (PKCE auth flow)
          const params = new URLSearchParams(window.location.search);
          const code = params.get('code');
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.warn('PKCE exchange error:', exchangeError);
            }
          }
        }

        // 2. Cek apakah session pemulihan telah aktif
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          if (session) {
            setHasValidSession(true);
            setIsVerifying(false);
          } else {
            // Beri toleransi waktu jika hash token (#access_token=...) sedang diparse oleh Supabase
            setTimeout(async () => {
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              if (isMounted) {
                if (retrySession) setHasValidSession(true);
                setIsVerifying(false);
              }
            }, 600);
          }
        }
      } catch (err) {
        console.error('Recovery init error:', err);
        if (isMounted) setIsVerifying(false);
      }
    }

    initRecovery();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        if (isMounted) {
          setHasValidSession(true);
          setIsVerifying(false);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setIsSuccess(true);
      showToast('Kata sandi berhasil diatur ulang! Mengalihkan ke login...', 'success', 3500);

      setTimeout(() => {
        router.replace('/admin/login');
      }, 2500);
    } catch (err) {
      console.error('Reset password error:', err);
      let msg = err.message || 'Gagal mengatur ulang kata sandi.';
      if (msg.toLowerCase().includes('session missing') || msg.toLowerCase().includes('not authenticated')) {
        msg = 'Sesi reset kata sandi tidak valid atau telah kedaluwarsa. Silakan minta tautan baru dari halaman login.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen loui-pitch-bg flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md bg-emerald-950/90 border border-emerald-600/40 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
        {/* Header Logo */}
        <div className="text-center mb-6">
          <div className="relative w-14 h-14 mx-auto rounded-2xl overflow-hidden border border-emerald-500/50 shadow-xl shadow-lime-950/60 mb-3 bg-emerald-900 flex items-center justify-center">
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
          <h1 className="text-2xl font-bold font-loui text-white tracking-widest uppercase">
            LOUI<span className="text-lime-400">FOOTBALL</span>
          </h1>
          <p className="text-xs text-lime-400 font-semibold tracking-wider uppercase mt-1">
            Atur Ulang Kata Sandi
          </p>
          <p className="text-xs text-emerald-300/80 mt-1">
            Masukkan kata sandi baru untuk akun admin Anda.
          </p>
        </div>

        {/* Feedback Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in duration-200">
            <WarningCircle size={18} weight="fill" className="text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="p-4 rounded-2xl bg-emerald-900/60 border border-lime-400/40 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-lime-400/20 text-lime-400 flex items-center justify-center mx-auto">
              <CheckCircle size={28} weight="fill" />
            </div>
            <h3 className="text-sm font-bold text-white">Kata Sandi Berhasil Diperbarui!</h3>
            <p className="text-xs text-emerald-300">
              Anda akan dialihkan ke halaman login dalam beberapa detik...
            </p>
            <Link
              href="/admin/login"
              className="inline-block mt-2 px-4 py-2 rounded-xl bg-lime-400 text-emerald-950 font-bold text-xs hover:bg-lime-300 transition"
            >
              Masuk Sekarang
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1.5">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                  <LockKey size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-600/60 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-400 hover:text-lime-300 cursor-pointer"
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1.5">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                  <LockKey size={18} />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Ulangi kata sandi baru"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-600/60 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-400 hover:text-lime-300 cursor-pointer"
                >
                  {showConfirm ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 text-emerald-950 font-bold text-xs sm:text-sm shadow-xl hover:from-lime-300 hover:to-lime-400 transition cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Spinner size={18} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Kata Sandi Baru</span>
              )}
            </button>
          </form>
        )}

        {/* Back to Login */}
        <div className="mt-6 pt-5 border-t border-emerald-800/60 text-center">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-lime-300 transition font-medium"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Halaman Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
