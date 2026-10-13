'use client';

import React, { useState } from 'react';
import {
  LockKey,
  Eye,
  EyeSlash,
  Check,
  X,
  Spinner,
  ShieldCheck,
  WarningCircle,
} from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { useToast } from './Toast';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { showToast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword.length < 6) {
      setErrorMessage('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      showToast('Kata sandi admin berhasil diperbarui!', 'success', 3500);
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      console.error('Change password error:', err);
      setErrorMessage(err.message || 'Gagal memperbarui kata sandi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-emerald-950/95 border border-emerald-700/60 rounded-2xl shadow-2xl p-6 text-emerald-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900/60 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-lime-400/20 border border-lime-400/40 flex items-center justify-center text-lime-400 shrink-0">
            <LockKey size={26} weight="bold" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight font-loui tracking-wide uppercase">
              Ubah Kata Sandi
            </h3>
            <p className="text-xs text-emerald-300/80">Perbarui kata sandi akun admin LOUIFOOTBALL</p>
          </div>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <WarningCircle size={18} weight="fill" className="text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1.5">
              Kata Sandi Baru (Min. 6 Karakter)
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Minimal 6 karakter"
                className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-600/60 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-400 hover:text-white cursor-pointer"
              >
                {showNew ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1.5">
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Ulangi kata sandi baru"
                className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-600/60 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-400 hover:text-white cursor-pointer"
              >
                {showConfirm ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-xs font-semibold hover:bg-emerald-800 hover:text-white transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 text-emerald-950 font-bold text-xs sm:text-sm shadow-lg hover:from-lime-300 hover:to-lime-400 transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Spinner size={16} className="animate-spin text-emerald-950" />
                  <span>Memperbarui...</span>
                </>
              ) : (
                <>
                  <Check size={16} weight="bold" />
                  <span>Simpan Kata Sandi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
