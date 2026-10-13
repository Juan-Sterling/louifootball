'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LockKey,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  SignIn,
  WarningCircle,
  ArrowLeft,
  Spinner,
  Check,
  X,
} from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/admin/Toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forget Password state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess(false);

    if (!forgotEmail.trim()) {
      setForgotError('Harap masukkan alamat email admin Anda.');
      return;
    }

    setIsForgotLoading(true);

    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/admin/reset-password`
        : 'http://localhost:3000/admin/reset-password';

      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setForgotSuccess(true);
      showToast('Tautan reset kata sandi telah dikirim ke email Anda!', 'success', 5000);
    } catch (err) {
      console.error('Forget password error:', err);
      setForgotError(err.message || 'Gagal mengirim email reset kata sandi.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Harap masukkan email dan kata sandi.');
      return;
    }

    setIsLoading(true);

    try {
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
    } catch (err) {
      console.error('Auth error:', err);
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
            Gunakan akun admin Anda untuk mengakses dasbor.
          </p>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in duration-200">
            <WarningCircle size={18} weight="fill" className="text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Kata Sandi (Password)
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotError('');
                  setForgotSuccess(false);
                  setIsForgotModalOpen(true);
                }}
                className="text-[11px] text-lime-400 hover:text-lime-300 hover:underline font-medium cursor-pointer"
              >
                Lupa Kata Sandi?
              </button>
            </div>
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
            ) : (
              <>
                <SignIn size={18} weight="bold" />
                <span>Masuk ke Dasbor Admin</span>
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

      {/* Forget Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="relative w-full max-w-md bg-emerald-950/95 border border-emerald-700/60 rounded-2xl shadow-2xl p-6 text-emerald-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900/60 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-lime-400/20 border border-lime-400/40 flex items-center justify-center text-lime-400 shrink-0">
                <LockKey size={26} weight="bold" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight font-loui tracking-wide uppercase">
                  Lupa Kata Sandi?
                </h3>
                <p className="text-xs text-emerald-300/80">Kirim tautan reset kata sandi ke email Anda</p>
              </div>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                <WarningCircle size={18} weight="fill" className="text-rose-400 shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-900/60 border border-lime-400/40 text-center space-y-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-lime-400/20 text-lime-400 flex items-center justify-center mx-auto">
                  <Check size={20} weight="bold" />
                </div>
                <h4 className="text-xs font-bold text-white">Email Reset Terkirim!</h4>
                <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                  Kami telah mengirimkan tautan untuk mengatur ulang kata sandi ke{' '}
                  <strong className="text-lime-300">{forgotEmail}</strong>. Silakan periksa inbox atau kotak spam email Anda.
                </p>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="mt-3 px-4 py-2 rounded-xl bg-lime-400 text-emerald-950 font-bold text-xs hover:bg-lime-300 transition"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-emerald-300/80 leading-relaxed">
                  Masukkan alamat email akun admin Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi baru.
                </p>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1.5">
                    Email Admin
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                      <EnvelopeSimple size={18} />
                    </div>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      placeholder="admin@louifootball.com"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-600/60 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    disabled={isForgotLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-xs font-semibold hover:bg-emerald-800 hover:text-white transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 text-emerald-950 font-bold text-xs shadow-lg hover:from-lime-300 hover:to-lime-400 transition cursor-pointer disabled:opacity-50"
                  >
                    {isForgotLoading ? (
                      <>
                        <Spinner size={16} className="animate-spin text-emerald-950" />
                        <span>Mengirim Email...</span>
                      </>
                    ) : (
                      <span>Kirim Tautan Reset</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
