'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Spinner,
  Megaphone,
  Sparkle,
  Image as ImageIcon,
  LinkSimple,
  ArrowsDownUp,
  Tag,
  SoccerBall,
} from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { getPromoTheme } from '@/lib/utils';
import CloudinaryWidget from './CloudinaryWidget';
import { useToast } from './Toast';

const BADGE_COLORS = [
  { id: 'lime', name: 'Lime / Hijau Neon', bg: 'bg-lime-400', text: 'text-emerald-950', border: 'border-lime-400' },
  { id: 'amber', name: 'Amber / Oranye', bg: 'bg-amber-400', text: 'text-amber-950', border: 'border-amber-400' },
  { id: 'purple', name: 'Purple / Ungu', bg: 'bg-purple-400', text: 'text-purple-950', border: 'border-purple-400' },
  { id: 'cyan', name: 'Cyan / Biru Muda', bg: 'bg-cyan-400', text: 'text-cyan-950', border: 'border-cyan-400' },
  { id: 'rose', name: 'Rose / Merah', bg: 'bg-rose-400', text: 'text-rose-950', border: 'border-rose-400' },
];

export default function PromotionFormModal({
  isOpen,
  onClose,
  promoToEdit = null,
  categories = [],
  onSuccess,
}) {
  const { showToast } = useToast();
  const isEditing = Boolean(promoToEdit);

  const [formData, setFormData] = useState({
    title: '',
    desc: '',
    badge_main: 'NEW RELEASE',
    badge_sub: '',
    badge_color: 'lime',
    img: '',
    action_type: 'edition', // 'edition', 'category', 'link', 'none'
    action_target: '12',
    btn_text: 'Lihat di Katalog',
    sort_order: 1,
    is_active: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (promoToEdit) {
        setFormData({
          title: promoToEdit.title || '',
          desc: promoToEdit.desc || '',
          badge_main: promoToEdit.badge_main || '',
          badge_sub: promoToEdit.badge_sub || '',
          badge_color: promoToEdit.badge_color || 'lime',
          img: promoToEdit.img || '',
          action_type: promoToEdit.action_type || 'edition',
          action_target: promoToEdit.action_target || '',
          btn_text: promoToEdit.btn_text || 'Lihat di Katalog',
          sort_order: typeof promoToEdit.sort_order === 'number' ? promoToEdit.sort_order : 1,
          is_active: promoToEdit.is_active !== false,
        });
      } else {
        setFormData({
          title: '',
          desc: '',
          badge_main: 'NEW RELEASE',
          badge_sub: 'Edisi Terbatas',
          badge_color: 'lime',
          img: '',
          action_type: 'edition',
          action_target: '12',
          btn_text: 'Lihat di Katalog',
          sort_order: 1,
          is_active: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, promoToEdit]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Judul promosi / iklan wajib diisi';
    }
    if (!formData.img.trim()) {
      newErrors.img = 'Foto / banner iklan wajib diunggah atau diisi URL-nya';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Harap lengkapi judul dan foto banner iklan', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        desc: formData.desc.trim(),
        badge_main: formData.badge_main.trim(),
        badge_sub: formData.badge_sub.trim(),
        badge_color: formData.badge_color,
        img: formData.img.trim(),
        action_type: formData.action_type,
        action_target: formData.action_target.trim(),
        btn_text: formData.btn_text.trim() || 'Lihat di Katalog',
        sort_order: parseInt(formData.sort_order, 10) || 1,
        is_active: Boolean(formData.is_active),
      };

      let result;
      if (isEditing) {
        result = await supabase
          .from('promotions')
          .update(payload)
          .eq('id', promoToEdit.id)
          .select();
      } else {
        result = await supabase
          .from('promotions')
          .insert([payload])
          .select();
      }

      if (result.error) throw result.error;
      if (!result.data || result.data.length === 0) {
        throw new Error(
          'Tidak dapat menyimpan data ke Supabase. Izin operasi tabel promotions diblokir oleh Row Level Security (RLS).'
        );
      }

      showToast(
        isEditing
          ? `Iklan "${payload.title}" berhasil diperbarui!`
          : `Iklan "${payload.title}" berhasil ditambahkan!`,
        'success'
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save promotion:', err);
      showToast(`Gagal menyimpan iklan: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const theme = getPromoTheme(formData.badge_color);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-emerald-950/95 border border-emerald-700/60 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-800/60 bg-emerald-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-lime-400/20 border border-lime-400/40 flex items-center justify-center text-lime-400">
              <Megaphone size={18} weight="bold" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-loui text-white tracking-wide uppercase">
                {isEditing ? 'Edit Banner Iklan' : 'Tambah Banner Iklan Baru'}
              </h2>
              <p className="text-[11px] text-emerald-300/80">
                {isEditing ? `Perbarui promosi ID #${promoToEdit.id}` : 'Tambahkan slide promosi baru untuk carousel beranda'}
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
          {/* Judul Iklan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1.5">
              Judul Banner Iklan <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="cth: Stickers Edisi #12 Special World Cup 26"
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border ${
                errors.title ? 'border-rose-500' : 'border-emerald-700/60'
              } text-white placeholder-emerald-500/60 focus:outline-none focus:border-lime-400 transition`}
            />
            {errors.title && (
              <span className="text-[11px] text-rose-400 mt-1 block font-medium">
                {errors.title}
              </span>
            )}
          </div>

          {/* Deskripsi Iklan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1.5">
              Deskripsi Singkat Promosi
            </label>
            <textarea
              rows={2}
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              placeholder="cth: Koleksi edisi Piala Dunia 2026 dari LOUIFOOTBALL. Vinyl tebal anti air & tahan gores!"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-500/60 focus:outline-none focus:border-lime-400 transition"
            />
          </div>

          {/* Badges & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1.5">
                Badge Utama
              </label>
              <input
                type="text"
                value={formData.badge_main}
                onChange={(e) => setFormData({ ...formData, badge_main: e.target.value })}
                placeholder="cth: NEW RELEASE, POPULAR, PROMO"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-500/60 focus:outline-none focus:border-lime-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1.5">
                Sub-Badge (Opsional)
              </label>
              <input
                type="text"
                value={formData.badge_sub}
                onChange={(e) => setFormData({ ...formData, badge_sub: e.target.value })}
                placeholder="cth: Edisi Terbatas, Akrilik HD"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-500/60 focus:outline-none focus:border-lime-400 transition"
              />
            </div>
          </div>

          {/* Pilihan Warna Badge */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1.5">
              Tema Warna Badge & Tombol
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {BADGE_COLORS.map((col) => {
                const isSelected = formData.badge_color === col.id;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, badge_color: col.id })}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'border-white bg-emerald-900 text-white shadow-md shadow-lime-950/40 ring-1 ring-white'
                        : 'border-emerald-800/80 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${col.bg} shrink-0`} />
                    <span className="truncate">{col.name.split('/')[0].trim()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload / URL Gambar Promo */}
          <div>
            <CloudinaryWidget
              value={formData.img}
              onChange={(url) => setFormData({ ...formData, img: url })}
              onDelete={() => setFormData({ ...formData, img: '' })}
              label="Banner / Foto Iklan"
              description="Foto merchandise atau gambar promosi untuk slide carousel"
              required={true}
              folder="louifootball promo"
            />
            {errors.img && (
              <span className="text-[11px] text-rose-400 mt-1 block font-medium">
                {errors.img}
              </span>
            )}
          </div>

          {/* Aksi Tombol & Target */}
          <div className="p-3.5 rounded-xl bg-emerald-900/30 border border-emerald-700/40 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-lime-400 flex items-center gap-1.5">
              <LinkSimple size={15} />
              Konfigurasi Aksi Tombol
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tipe Aksi */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-200 mb-1">
                  Tipe Aksi
                </label>
                <select
                  value={formData.action_type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    let defaultTarget = '';
                    if (newType === 'edition') defaultTarget = '12';
                    else if (newType === 'category') defaultTarget = categories[0]?.category || 'stickers';
                    setFormData({ ...formData, action_type: newType, action_target: defaultTarget });
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white focus:outline-none focus:border-lime-400 cursor-pointer"
                >
                  <option value="edition">Filter Edisi Katalog</option>
                  <option value="category">Filter Kategori Katalog</option>
                  <option value="link">Tautan Eksternal / URL</option>
                  <option value="none">Tanpa Aksi (Info Saja)</option>
                </select>
              </div>

              {/* Target Aksi */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-200 mb-1">
                  Target Aksi
                </label>
                {formData.action_type === 'category' ? (
                  <select
                    value={formData.action_target}
                    onChange={(e) => setFormData({ ...formData, action_target: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white focus:outline-none focus:border-lime-400 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.category}>
                        {c.category?.toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.action_target}
                    onChange={(e) => setFormData({ ...formData, action_target: e.target.value })}
                    disabled={formData.action_type === 'none'}
                    placeholder={
                      formData.action_type === 'edition'
                        ? 'cth: 12 atau Special'
                        : formData.action_type === 'link'
                        ? 'https://wa.me/...'
                        : '-'
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-500/60 focus:outline-none focus:border-lime-400 disabled:opacity-40 transition"
                  />
                )}
              </div>

              {/* Label Tombol */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-200 mb-1">
                  Teks Tombol
                </label>
                <input
                  type="text"
                  value={formData.btn_text}
                  onChange={(e) => setFormData({ ...formData, btn_text: e.target.value })}
                  placeholder="cth: Lihat di Katalog"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-500/60 focus:outline-none focus:border-lime-400 transition"
                />
              </div>
            </div>
          </div>

          {/* Urutan & Status Aktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1.5 flex items-center gap-1.5">
                <ArrowsDownUp size={14} className="text-lime-400" />
                Urutan Slide Tampilan
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white focus:outline-none focus:border-lime-400 transition"
              />
              <span className="text-[10px] text-emerald-400/70 mt-1 block">
                Slide dengan angka 1 akan tampil pertama di beranda.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1.5">
                Status Tayang Iklan
              </label>
              <label className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-900/50 border border-emerald-700/60 cursor-pointer hover:bg-emerald-900/80 transition">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-lime-400 focus:ring-lime-400 accent-lime-400 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    {formData.is_active ? 'Tayang di Beranda (Aktif)' : 'Disembunyikan (Non-Aktif)'}
                  </span>
                  <span className="text-[10px] text-emerald-300/80">
                    Centang untuk langsung menampilkan banner ini ke pembeli
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Live Hero Slide Preview */}
          <div className="pt-2 border-t border-emerald-800/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
              <Sparkle size={14} className="text-lime-400" />
              Live Preview Hero Carousel Slide
            </span>
            <div className="relative rounded-2xl overflow-hidden border border-emerald-700/50 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 p-4 shadow-lg">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Image */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-emerald-900/60 border border-emerald-700/50 overflow-hidden shrink-0 flex items-center justify-center">
                  {formData.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formData.img}
                      alt={formData.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={32} className="text-emerald-500/40" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                    {formData.badge_main && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${theme.badgeMain}`}>
                        {formData.badge_main}
                      </span>
                    )}
                    {formData.badge_sub && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${theme.badgeSub}`}>
                        {formData.badge_sub}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white font-loui tracking-wide">
                    {formData.title || 'Judul Promosi Banner'}
                  </h3>

                  <p className="text-[11px] text-emerald-200/80 line-clamp-2">
                    {formData.desc || 'Deskripsi promosi akan tampil di sini...'}
                  </p>

                  <div className="pt-1">
                    <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${theme.btn}`}>
                      {formData.btn_text || 'Lihat di Katalog'}
                    </span>
                  </div>
                </div>
              </div>
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
                  <span>{isEditing ? 'Simpan Perubahan' : 'Tambah Iklan'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
