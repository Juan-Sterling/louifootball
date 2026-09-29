'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LockKey,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  SoccerBall,
  SignIn,
  UserPlus,
  WarningCircle,
  CheckCircle,
  ArrowLeft,
  Spinner,
} from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/admin/Toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !password) {
      setErrorMessage('Harap masukkan email dan kata sandi.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          throw error;
        }

        if (data?.session) {
          showToast('Login berhasil! Mengalihkan ke dasbor...', 'success');
          router.replace('/admin');
        }
      } else {
        // Sign up mode
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (error) {
          throw error;
        }

        if (data?.session) {
          showToast('Pendaftaran akun berhasil! Mengalihkan ke dasbor...', 'success');
          router.replace('/admin');
        } else {
          setSuccessMessage(
            'Pendaftaran berhasil! Jika konfirmasi email aktif di Supabase, silakan periksa inbox email Anda untuk mengonfirmasi.'
          );
        }
      }
    } catch (err) {
      console.error('Supabase Auth error:', err);
      let msg = err.message || 'Gagal masuk ke sistem.';
      if (msg.includes('Invalid login credentials')) {
        msg = 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Email Anda belum dikonfirmasi. Periksa kotak masuk email Anda.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen loui-pitch-bg flex items-center justify-center p-4 relative">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Floating Card */}
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
            Portal Administrasi & Stok
          </p>
          <p className="text-xs text-emerald-300/80 mt-1">
            Gunakan akun Supabase Auth Anda untuk mengakses dasbor.
          </p>
        </div>

        {/* Tab Switcher: Masuk / Daftar */}
        <div className="flex rounded-xl bg-emerald-900/50 p-1 mb-5 border border-emerald-800/70 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-lime-400 text-emerald-950 shadow'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            <SignIn size={14} weight="bold" />
            <span>Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signup'
                ? 'bg-lime-400 text-emerald-950 shadow'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            <UserPlus size={14} weight="bold" />
            <span>Daftar Akun Baru</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in duration-200">
            <WarningCircle size={18} weight="fill" className="text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-900/90 border border-lime-400/50 text-emerald-100 text-xs flex items-start gap-2 animate-in fade-in duration-200">
            <CheckCircle size={18} weight="fill" className="text-lime-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login / Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1.5">
              Alamat Email Admin
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                <EnvelopeSimple size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@louifootball.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-600/60 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1.5">
              Kata Sandi (Password)
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
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-600/60 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-400 hover:text-lime-300 cursor-pointer transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 text-emerald-950 font-bold text-xs sm:text-sm shadow-xl shadow-lime-950/50 hover:from-lime-300 hover:to-lime-400 transition cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Spinner size={18} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : mode === 'login' ? (
              <>
                <SignIn size={18} weight="bold" />
                <span>Masuk ke Dasbor Admin</span>
              </>
            ) : (
              <>
                <UserPlus size={18} weight="bold" />
                <span>Daftarkan Akun Admin</span>
              </>
            )}
          </button>
        </form>

        {/* Back to store */}
        <div className="mt-6 pt-5 border-t border-emerald-800/60 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-lime-300 transition font-medium"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Katalog LOUIFOOTBALL</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
