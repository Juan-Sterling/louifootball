'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  PencilSimple,
  Trash,
  Megaphone,
  CheckCircle,
  XCircle,
  MagnifyingGlass,
  X,
  Spinner,
  ArrowsDownUp,
  Image as ImageIcon,
  Eye,
  LinkSimple,
  Sparkle,
} from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { getPromoTheme } from '@/lib/utils';
import PromotionFormModal from './PromotionFormModal';
import PromotionDeleteModal from './PromotionDeleteModal';
import { useToast } from './Toast';

export default function PromotionManager({
  promotions = [],
  setPromotions,
  categories = [],
  isLoading = false,
  onRefresh,
  onZoomImage,
}) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [promoToEdit, setPromoToEdit] = useState(null);
  const [promoToDelete, setPromoToDelete] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Promotions KPI Stats
  const promoStats = useMemo(() => {
    const total = promotions.length;
    const activeCount = promotions.filter((p) => Boolean(p.is_active)).length;
    const inactiveCount = total - activeCount;
    const firstPromo = [...promotions].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0];
    return {
      total,
      activeCount,
      inactiveCount,
      firstPromoTitle: firstPromo ? firstPromo.title : '-',
    };
  }, [promotions]);

  // Filtered and Sorted promotions
  const filteredPromotions = useMemo(() => {
    let list = [...promotions];
    // Sort by sort_order ascending
    list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.desc || '').toLowerCase().includes(q) ||
          (p.badge_main || '').toLowerCase().includes(q) ||
          (p.badge_sub || '').toLowerCase().includes(q) ||
          (p.action_target || '').toLowerCase().includes(q) ||
          String(p.id).includes(q)
      );
    }
    return list;
  }, [promotions, searchQuery]);

  // Quick Toggle Active Status
  const handleToggleActive = async (promo) => {
    if (togglingId) return;
    const newStatus = !promo.is_active;
    const statusText = newStatus ? 'AKTIF' : 'NON-AKTIF';
    setTogglingId(promo.id);

    // 1. Optimistic UI update: langsung ubah status di tabel secara instan
    if (setPromotions) {
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === promo.id
            ? {
                ...p,
                is_active: newStatus,
              }
            : p
        )
      );
    }

    try {
      const { data, error } = await supabase
        .from('promotions')
        .update({ is_active: newStatus })
        .eq('id', promo.id)
        .select();

      if (error) throw error;

      // Cek apakah database benar-benar mengizinkan update (mencegah silent fail karena RLS)
      if (!data || data.length === 0) {
        throw new Error(
          'Tidak dapat mengubah status di Supabase. Izin UPDATE tabel promotions diblokir oleh Row Level Security (RLS). Harap tambahkan policy RLS untuk tabel promotions.'
        );
      }

      showToast(
        `Status tayang "${promo.title}" diubah ke ${statusText}`,
        'success',
        2500
      );
    } catch (err) {
      // Rollback optimistic update jika gagal
      if (setPromotions) {
        setPromotions((prev) =>
          prev.map((p) =>
            p.id === promo.id
              ? {
                  ...p,
                  is_active: promo.is_active,
                }
              : p
          )
        );
      }
      console.error('Failed to toggle promotion active status:', err);
      showToast(`Gagal mengubah status: ${err.message || 'Error'}`, 'error', 4500);
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenAddModal = () => {
    setPromoToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (promo) => {
    setPromoToEdit(promo);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (promo) => {
    setPromoToDelete(promo);
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Iklan */}
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/40 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-1">
            <span>Total Iklan</span>
            <Megaphone size={18} className="text-lime-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {promoStats.total}
          </div>
          <span className="text-[10px] text-emerald-400/80">Banner carousel</span>
        </div>

        {/* Iklan Aktif */}
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/40 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-1">
            <span>Aktif Tayang</span>
            <CheckCircle size={18} className="text-lime-400" weight="fill" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-lime-400">
            {promoStats.activeCount}
          </div>
          <span className="text-[10px] text-emerald-400/80">Tampil di beranda</span>
        </div>

        {/* Iklan Non-Aktif */}
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/40 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold mb-1">
            <span>Non-Aktif</span>
            <XCircle size={18} className="text-rose-400" weight="fill" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
            {promoStats.inactiveCount}
          </div>
          <span className="text-[10px] text-rose-300/80">Disembunyikan</span>
        </div>

        {/* Slide Utama */}
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/40 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-1">
            <span>Slide Pertama</span>
            <Sparkle size={18} className="text-amber-400" />
          </div>
          <div className="text-xs sm:text-sm font-bold text-amber-300 truncate">
            {promoStats.firstPromoTitle}
          </div>
          <span className="text-[10px] text-emerald-400/80">Urutan terdepan</span>
        </div>
      </div>

      {/* Action Toolbar above Promotions Table */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
            <MagnifyingGlass size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul promosi, badge, target aksi..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-500/60 focus:outline-none focus:border-lime-400 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Add Promotion Button above Table */}
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 text-emerald-950 font-bold text-xs sm:text-sm shadow-lg shadow-lime-950/40 hover:from-lime-300 hover:to-lime-400 transition cursor-pointer active:scale-95 shrink-0"
        >
          <Plus size={18} weight="bold" />
          <span>Tambah Iklan</span>
        </button>
      </div>

      {/* Main Promotions Table */}
      <div className="bg-emerald-950/80 border border-emerald-700/40 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Spinner size={32} className="animate-spin text-lime-400 mb-3" />
            <p className="text-sm font-semibold text-emerald-200">Memuat data promosi & iklan...</p>
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center text-emerald-400 mb-3">
              <Megaphone size={30} />
            </div>
            <h3 className="text-base font-bold text-white">Tidak ada iklan ditemukan</h3>
            <p className="text-xs text-emerald-300/80 max-w-sm mt-1">
              {searchQuery
                ? `Tidak ada promosi yang cocok dengan pencarian "${searchQuery}".`
                : 'Belum ada data banner promosi carousel yang dibuat.'}
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-400 text-emerald-950 font-bold text-xs hover:bg-lime-300 transition"
            >
              <Plus size={16} weight="bold" />
              <span>Tambah Iklan Baru</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-emerald-800/80 bg-emerald-900/40 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  <th className="py-3 px-3 w-16 text-center">Urutan</th>
                  <th className="py-3 px-4 w-16 text-center">Banner</th>
                  <th className="py-3 px-4 min-w-[200px]">Info Iklan & Badge</th>
                  <th className="py-3 px-4 min-w-[170px]">Aksi Tombol (CTA)</th>
                  <th className="py-3 px-4 w-32 text-center">Status Tayang</th>
                  <th className="py-3 px-4 w-28 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/60 text-xs">
                {filteredPromotions.map((promo) => {
                  const theme = getPromoTheme(promo.badge_color);
                  const isToggling = togglingId === promo.id;

                  return (
                    <tr
                      key={promo.id}
                      className={`hover:bg-emerald-900/30 transition-colors ${
                        !promo.is_active ? 'opacity-60 bg-emerald-950/40' : ''
                      }`}
                    >
                      {/* Urutan & ID */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className="w-7 h-7 rounded-lg bg-emerald-900/80 border border-emerald-700/60 flex items-center justify-center text-xs font-bold font-mono text-lime-400">
                            {promo.sort_order}
                          </span>
                          <span className="text-[10px] text-emerald-500/70 font-mono mt-0.5">#{promo.id}</span>
                        </div>
                      </td>

                      {/* Banner Thumbnail */}
                      <td className="py-3 px-4 text-center">
                        <div
                          onClick={() => promo.img && onZoomImage && onZoomImage(promo.img)}
                          className="w-14 h-14 mx-auto rounded-xl bg-emerald-900/80 border border-emerald-700/60 overflow-hidden flex items-center justify-center cursor-pointer group relative shadow-sm"
                          title="Klik untuk melihat foto lebih besar"
                        >
                          {promo.img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={promo.img}
                              alt={promo.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                            />
                          ) : (
                            <ImageIcon size={20} className="text-emerald-500/50" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                            <Eye size={16} />
                          </div>
                        </div>
                      </td>

                      {/* Info Iklan & Badges */}
                      <td className="py-3 px-4">
                        <div className="space-y-1 max-w-sm">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {promo.badge_main && (
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${theme.badgeMain}`}>
                                {promo.badge_main}
                              </span>
                            )}
                            {promo.badge_sub && (
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${theme.badgeSub}`}>
                                {promo.badge_sub}
                              </span>
                            )}
                            <span className="text-[9px] text-emerald-400 font-mono">
                              ({promo.badge_color || 'lime'})
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="font-bold text-white text-xs sm:text-sm leading-tight">
                            {promo.title}
                          </h4>

                          {/* Desc */}
                          {promo.desc && (
                            <p className="text-[11px] text-emerald-300/80 line-clamp-2 leading-relaxed">
                              {promo.desc}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Aksi Tombol (CTA) */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${theme.btn}`}>
                            {promo.btn_text || 'Lihat di Katalog'}
                          </span>
                          <div className="text-[10px] text-emerald-300/80 flex items-center gap-1">
                            <span className="text-emerald-400 font-semibold uppercase">{promo.action_type}:</span>
                            <span className="font-mono truncate max-w-[120px]">
                              {promo.action_target || 'Semua'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status Tayang (1-Click Toggle) */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(promo)}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            promo.is_active
                              ? 'bg-lime-400/20 border border-lime-400/50 text-lime-300 hover:bg-lime-400/30'
                              : 'bg-rose-950/60 border border-rose-700/50 text-rose-300 hover:bg-rose-900/60'
                          } ${isToggling ? 'opacity-50 cursor-wait' : ''}`}
                          title="Klik untuk ubah status tayang"
                        >
                          {isToggling ? (
                            <Spinner size={14} className="animate-spin" />
                          ) : promo.is_active ? (
                            <CheckCircle size={14} weight="fill" className="text-lime-400" />
                          ) : (
                            <XCircle size={14} weight="fill" className="text-rose-400" />
                          )}
                          <span>{promo.is_active ? 'Aktif' : 'Non-Aktif'}</span>
                        </button>
                      </td>

                      {/* Aksi (Edit, Delete) */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(promo)}
                            className="p-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 hover:text-white hover:bg-emerald-800 transition cursor-pointer"
                            title="Edit Iklan"
                          >
                            <PencilSimple size={15} />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(promo)}
                            className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-700/40 text-rose-300 hover:text-white hover:bg-rose-900/80 transition cursor-pointer"
                            title="Hapus Iklan"
                          >
                            <Trash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <PromotionFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        promoToEdit={promoToEdit}
        categories={categories}
        onSuccess={onRefresh}
      />

      <PromotionDeleteModal
        isOpen={Boolean(promoToDelete)}
        onClose={() => setPromoToDelete(null)}
        promotion={promoToDelete}
        onSuccess={onRefresh}
      />
    </div>
  );
}
