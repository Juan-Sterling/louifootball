'use client';

import React, { useState } from 'react';
import { WarningCircle, XCircle, X, Spinner } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { getCategoryBadgeStyle } from '@/lib/utils';
import { useToast } from './Toast';

export default function CategoryDeleteModal({
  isOpen,
  onClose,
  category,
  productsCount = 0,
  onSuccess,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  if (!isOpen || !category) return null;

  const hasLinkedProducts = productsCount > 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Soft delete: ubah is_active menjadi FALSE sesuai permintaan
      const { data, error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', category.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          'Gagal mengubah status di Supabase. Periksa izin RLS (Row Level Security) tabel categories.'
        );
      }

      showToast(`Kategori "${category.category}" berhasil dinonaktifkan.`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to deactivate category:', err);
      showToast(`Gagal menonaktifkan kategori: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const badgeClass = getCategoryBadgeStyle(category.category);

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
          className="absolute top-4 right-4 text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900/60 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Warning Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <WarningCircle size={28} weight="fill" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight font-loui tracking-wide uppercase">
              Nonaktifkan Kategori
            </h3>
            <p className="text-xs text-amber-300/80">Status kategori akan diubah menjadi Non-Aktif (is_active = FALSE).</p>
          </div>
        </div>

        {/* Category Details Card */}
        <div className="p-3.5 rounded-xl bg-emerald-900/40 border border-emerald-700/40 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${badgeClass}`}>
              {category.category}
            </span>
            <span className="text-[11px] font-mono text-emerald-400">ID #{category.id}</span>
          </div>
          {category.spec && (
            <p className="text-xs text-emerald-200">
              <span className="text-emerald-400 font-semibold">Spesifikasi:</span> {category.spec}
            </p>
          )}
          {category.desc && (
            <p className="text-xs text-emerald-300/80 line-clamp-2">
              <span className="text-emerald-400 font-semibold">Deskripsi:</span> {category.desc}
            </p>
          )}
        </div>

        {/* Information text about soft delete */}
        <div className="p-3 rounded-xl bg-emerald-900/50 border border-emerald-700/50 mb-5 text-xs text-emerald-200 space-y-1.5 leading-relaxed">
          <p className="font-semibold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-lime-400" />
            Ketentuan Setelah Dinonaktifkan:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-emerald-300/90">
            <li>Kategori ini <strong>tidak akan muncul</strong> saat menambah produk baru.</li>
            {hasLinkedProducts ? (
              <li>
                Sebanyak <strong>{productsCount} produk lama</strong> yang memakai kategori ini tetap aman dan masih bisa dilihat serta difilter di katalog.
              </li>
            ) : (
              <li>Belum ada produk yang terhubung dengan kategori ini.</li>
            )}
            <li>Kategori dapat diaktifkan kembali kapan saja melalui tombol status di tabel.</li>
          </ul>
        </div>

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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-950/50 hover:bg-rose-500 transition cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Spinner size={16} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <XCircle size={16} weight="bold" />
                <span>Ya, Nonaktifkan Kategori</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
