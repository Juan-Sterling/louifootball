'use client';

import React, { useState } from 'react';
import { WarningCircle, Trash, X, Spinner } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { getPromoTheme } from '@/lib/utils';
import { useToast } from './Toast';

export default function PromotionDeleteModal({
  isOpen,
  onClose,
  promotion,
  onSuccess,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  if (!isOpen || !promotion) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', promotion.id);

      if (error) throw error;

      // Attempt to clean up Cloudinary image if present
      if (promotion.img && typeof promotion.img === 'string' && promotion.img.includes('cloudinary.com')) {
        let savedApiKey = '';
        let savedApiSecret = '';
        let savedCloudName = '';
        try {
          savedApiKey = localStorage.getItem('loui_cloudinary_api_key') || '';
          savedApiSecret = localStorage.getItem('loui_cloudinary_api_secret') || '';
          savedCloudName = localStorage.getItem('loui_cloudinary_cloud_name') || '';
        } catch {
          // ignore
        }

        try {
          await fetch('/api/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: promotion.img,
              api_key: savedApiKey,
              api_secret: savedApiSecret,
              cloud_name: savedCloudName,
            }),
          });
        } catch {
          // ignore error
        }
      }

      showToast(`Iklan "${promotion.title}" berhasil dihapus.`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to delete promotion:', err);
      showToast(`Gagal menghapus iklan: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const theme = getPromoTheme(promotion.badge_color);

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
          disabled={isDeleting}
          className="absolute top-4 right-4 text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900/60 transition"
        >
          <X size={20} />
        </button>

        {/* Warning Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <WarningCircle size={28} weight="fill" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight font-loui tracking-wide uppercase">
              Hapus Banner Iklan
            </h3>
            <p className="text-xs text-rose-300/80">Tindakan ini permanen dan tidak dapat dibatalkan.</p>
          </div>
        </div>

        {/* Promotion Details Card */}
        <div className="p-3.5 rounded-xl bg-emerald-900/40 border border-emerald-700/40 mb-4 flex items-center gap-3">
          {promotion.img && (
            <div className="w-16 h-16 rounded-xl bg-emerald-900/80 border border-emerald-700/50 overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={promotion.img}
                alt={promotion.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              {promotion.badge_main && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${theme.badgeMain}`}>
                  {promotion.badge_main}
                </span>
              )}
              <span className="text-[10px] font-mono text-emerald-400">Order #{promotion.sort_order}</span>
            </div>
            <h4 className="text-xs font-bold text-white truncate">
              {promotion.title}
            </h4>
            {promotion.desc && (
              <p className="text-[11px] text-emerald-300/80 line-clamp-1 mt-0.5">
                {promotion.desc}
              </p>
            )}
          </div>
        </div>

        <p className="text-xs text-emerald-300/90 mb-5 leading-relaxed">
          Apakah Anda yakin ingin menghapus iklan <strong>&quot;{promotion.title}&quot;</strong> dari banner Hero Carousel?
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-xs font-semibold hover:bg-emerald-800 hover:text-white transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-950/50 hover:bg-rose-500 transition cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Spinner size={16} className="animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash size={16} weight="bold" />
                <span>Ya, Hapus Iklan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
