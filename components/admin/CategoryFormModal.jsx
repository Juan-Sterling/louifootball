'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Spinner,
  Tag,
  Sparkle,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { getCategoryBadgeStyle } from '@/lib/utils';
import { useToast } from './Toast';

export default function CategoryFormModal({
  isOpen,
  onClose,
  categoryToEdit = null,
  onSuccess,
}) {
  const { showToast } = useToast();
  const isEditing = Boolean(categoryToEdit);

  const [formData, setFormData] = useState({
    category: '',
    spec: '',
    desc: '',
    is_active: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        setFormData({
          category: categoryToEdit.category || '',
          spec: categoryToEdit.spec || '',
          desc: categoryToEdit.desc || '',
          is_active: categoryToEdit.is_active !== false,
        });
      } else {
        setFormData({
          category: '',
          spec: '',
          desc: '',
          is_active: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, categoryToEdit]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.category.trim()) {
      newErrors.category = 'Nama kategori wajib diisi';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Harap periksa form kategori yang belum lengkap', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        category: formData.category.trim().toLowerCase(),
        spec: formData.spec.trim(),
        desc: formData.desc.trim(),
        is_active: Boolean(formData.is_active),
      };

      let result;
      if (isEditing) {
        result = await supabase
          .from('categories')
          .update(payload)
          .eq('id', categoryToEdit.id)
          .select();
      } else {
        result = await supabase
          .from('categories')
          .insert([payload])
          .select();
      }

      if (result.error) {
        if (result.error.code === '23505' || result.error.message?.includes('duplicate') || result.error.message?.includes('unique') || result.error.message?.includes('categories_category_key')) {
          showToast(`Kategori "${payload.category}" sudah ada di database. Silakan gunakan nama lain.`, 'error', 4000);
          return;
        }
        throw result.error;
      }

      if (!result.data || result.data.length === 0) {
        throw new Error(
          'Tidak dapat menyimpan data ke Supabase. Izin operasi tabel categories diblokir oleh Row Level Security (RLS).'
        );
      }

      showToast(
        isEditing
          ? `Kategori "${payload.category}" berhasil diperbarui!`
          : `Kategori "${payload.category}" berhasil ditambahkan!`,
        'success'
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save category:', err);
      if (err?.code === '23505' || err?.message?.includes('duplicate') || err?.message?.includes('unique') || err?.message?.includes('categories_category_key')) {
        showToast(`Kategori "${formData.category}" sudah ada di database. Silakan gunakan nama lain.`, 'error', 4000);
      } else {
        showToast(`Gagal menyimpan kategori: ${err.message || 'Error'}`, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const badgeClass = getCategoryBadgeStyle(formData.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-emerald-950/95 border border-emerald-700/60 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-800/60 bg-emerald-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-lime-400/20 border border-lime-400/40 flex items-center justify-center text-lime-400">
              <Tag size={18} weight="bold" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-loui text-white tracking-wide uppercase">
                {isEditing ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h2>
              <p className="text-[11px] text-emerald-300/80">
                {isEditing ? `Perbarui data kategori ID #${categoryToEdit.id}` : 'Tambahkan kategori baru untuk pengelompokan produk'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-800/60 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Nama Kategori */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1.5">
              Nama Kategori / Slug <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="cth: stickers, keychains, posters, apparel"
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border ${
                errors.category ? 'border-rose-500' : 'border-emerald-700/60'
              } text-white placeholder-emerald-500/60 focus:outline-none focus:border-lime-400 transition`}
            />
            {errors.category && (
              <span className="text-[11px] text-rose-400 mt-1 block font-medium">
                {errors.category}
              </span>
            )}
            <span className="text-[10px] text-emerald-400/70 mt-1 block">
              Gunakan huruf kecil atau spasi biasa (cth: mini stickers). Nama kategori harus unik.
            </span>
          </div>

          {/* Spesifikasi Material */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1.5">
              Spesifikasi Singkat (Material & Ukuran)
            </label>
            <input
              type="text"
              value={formData.spec}
              onChange={(e) => setFormData({ ...formData, spec: e.target.value })}
              placeholder="cth: Vinyl Waterproof • 7 cm atau Akrilik 3mm • 2 Sisi HD"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-500/60 focus:outline-none focus:border-lime-400 transition"
            />
            <span className="text-[10px] text-emerald-400/70 mt-1 block">
              Teks ringkas spesifikasi material yang tampil pada tab filter dan info produk.
            </span>
          </div>

          {/* Deskripsi Kategori */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1.5">
              Deskripsi Lengkap Kategori
            </label>
            <textarea
              rows={3}
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              placeholder="cth: Bahan vinyl tebal tahan air, panas matahari, dan anti gores. Cocok untuk laptop, helm, dan tumbler."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-500/60 focus:outline-none focus:border-lime-400 transition"
            />
            <span className="text-[10px] text-emerald-400/70 mt-1 block">
              Deskripsi keunggulan kategori saat tab ini dipilih di halaman utama.
            </span>
          </div>

          {/* Status Aktif Kategori */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1.5">
              Status Aktif Kategori
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl bg-emerald-900/50 border border-emerald-700/60 cursor-pointer hover:bg-emerald-900/80 transition">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-lime-400 focus:ring-lime-400 accent-lime-400 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  {formData.is_active ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-lime-400">
                      <CheckCircle size={14} weight="fill" />
                      Aktif (Muncul saat tambah produk baru)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400">
                      <XCircle size={14} weight="fill" />
                      Non-Aktif (Disembunyikan saat tambah produk baru)
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-emerald-300/80 block mt-0.5">
                  Produk lama yang sudah terhubung dengan kategori ini tetap aman dan bisa difilter di katalog.
                </span>
              </div>
            </label>
          </div>

          {/* Live Preview Card */}
          <div className="pt-2 border-t border-emerald-800/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
              <Sparkle size={14} className="text-lime-400" />
              Live Preview Tampilan
            </span>
            <div className="p-3.5 rounded-xl bg-emerald-900/40 border border-emerald-700/40 space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${badgeClass}`}>
                  {formData.category.trim() || 'nama kategori'}
                </span>
                {!formData.is_active && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-700/50 text-[10px] font-bold">
                    NON-AKTIF
                  </span>
                )}
                {formData.spec && (
                  <span className="text-[11px] text-emerald-300 font-medium">
                    • {formData.spec}
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-200/90 leading-relaxed italic">
                {formData.desc.trim() || 'Deskripsi kategori akan tampil di sini...'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-800/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-xs font-semibold hover:bg-emerald-800 hover:text-white transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 text-emerald-950 font-bold text-xs shadow-lg shadow-lime-950/40 hover:from-lime-300 hover:to-lime-400 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Spinner size={16} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check size={16} weight="bold" />
                  <span>{isEditing ? 'Simpan Perubahan' : 'Tambah Kategori'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
