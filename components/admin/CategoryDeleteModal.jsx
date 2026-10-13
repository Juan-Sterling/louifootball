'use client';

import React, { useState, useEffect } from 'react';
import { WarningCircle, Trash, X, Spinner, ShieldWarning, Package } from '@phosphor-icons/react';
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
  const [isCheckingProducts, setIsCheckingProducts] = useState(false);
  const [liveProductsCount, setLiveProductsCount] = useState(productsCount);
  const [linkedSampleProducts, setLinkedSampleProducts] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen || !category) return;

    let isMounted = true;
    async function checkLinkedProducts() {
      setIsCheckingProducts(true);
      try {
        const { count, data, error } = await supabase
          .from('products')
          .select('id, title, player_name', { count: 'exact' })
          .eq('category_id', category.id)
          .limit(5);

        if (!error && isMounted) {
          const totalCount = count !== null && count !== undefined ? count : productsCount;
          setLiveProductsCount(totalCount);
          setLinkedSampleProducts(data || []);
        } else if (isMounted) {
          setLiveProductsCount(productsCount);
        }
      } catch (err) {
        console.warn('Error checking linked products:', err);
        if (isMounted) setLiveProductsCount(productsCount);
      } finally {
        if (isMounted) setIsCheckingProducts(false);
      }
    }

    checkLinkedProducts();

    return () => {
      isMounted = false;
    };
  }, [isOpen, category, productsCount]);

  if (!isOpen || !category) return null;

  const hasLinkedProducts = liveProductsCount > 0;

  const handleDelete = async () => {
    if (hasLinkedProducts) {
      showToast('Kategori tidak dapat dihapus karena masih ada produk yang memakainya.', 'error', 4500);
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      showToast(`Kategori "${category.category}" berhasil dihapus secara permanen.`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to delete category:', err);
      showToast(`Gagal menghapus kategori: ${err.message || 'Error'}`, 'error');
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

        {/* Warning Icon & Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              hasLinkedProducts
                ? 'bg-rose-500/10 border border-rose-500/40 text-rose-400'
                : 'bg-amber-500/10 border border-amber-500/40 text-amber-400'
            }`}
          >
            {hasLinkedProducts ? (
              <ShieldWarning size={28} weight="fill" />
            ) : (
              <WarningCircle size={28} weight="fill" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight font-loui tracking-wide uppercase">
              {hasLinkedProducts ? 'Kategori Tidak Dapat Dihapus' : 'Hapus Kategori'}
            </h3>
            <p className="text-xs text-emerald-300/80">
              {hasLinkedProducts ? 'Ada produk yang masih terhubung' : 'Penghapusan permanen dari database'}
            </p>
          </div>
        </div>

        {/* Category Info Box */}
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
        </div>

        {/* Dynamic Warning Message */}
        {isCheckingProducts ? (
          <div className="p-4 rounded-xl bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center gap-2 text-xs text-emerald-300 mb-5">
            <Spinner size={16} className="animate-spin text-lime-400" />
            <span>Memeriksa keterkaitan produk dengan kategori...</span>
          </div>
        ) : hasLinkedProducts ? (
          /* BLOCKED: Ada produk yang terhubung */
          <div className="space-y-3 mb-5">
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/60 text-xs text-rose-200 space-y-2 leading-relaxed">
              <div className="flex items-start gap-2 text-rose-300 font-bold">
                <WarningCircle size={18} weight="fill" className="shrink-0 text-rose-400 mt-0.5" />
                <span>PERINGATAN: Kategori Masih Digunakan!</span>
              </div>
              <p>
                Kategori ini masih digunakan oleh{' '}
                <strong className="text-white underline font-mono">{liveProductsCount} produk</strong> di katalog.
              </p>
              <p className="text-[11px] text-rose-200/90 font-medium">
                Sistem tidak mengizinkan kategori dihapus selama masih ada produk yang menggunakan kategori ini. Silakan hapus atau pindahkan kategori produk-produk tersebut terlebih dahulu!
              </p>
            </div>

            {/* Sample Products List */}
            {linkedSampleProducts.length > 0 && (
              <div className="p-3 rounded-xl bg-emerald-900/40 border border-emerald-800 text-[11px] space-y-1.5">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Package size={14} /> Contoh Produk yang Memakai Kategori Ini:
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-emerald-200">
                  {linkedSampleProducts.map((p) => (
                    <li key={p.id}>
                      {p.title || p.player_name || `Produk #${p.id}`}
                    </li>
                  ))}
                  {liveProductsCount > linkedSampleProducts.length && (
                    <li className="text-emerald-400 italic">
                      ...dan {liveProductsCount - linkedSampleProducts.length} produk lainnya
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        ) : (
          /* SAFE: Tidak ada produk yang memakai kategori ini */
          <div className="p-3 rounded-xl bg-emerald-900/50 border border-emerald-700/50 mb-5 text-xs text-emerald-200 space-y-1.5 leading-relaxed">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-lime-400" />
              Konfirmasi Penghapusan:
            </p>
            <p className="text-[11px] text-emerald-300/90">
              Tidak ada produk yang menggunakan kategori ini. Apakah Anda yakin ingin menghapus kategori{' '}
              <strong className="text-white">&quot;{category.category}&quot;</strong> secara permanen? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-xs font-semibold hover:bg-emerald-800 hover:text-white transition cursor-pointer"
          >
            {hasLinkedProducts ? 'Tutup' : 'Batal'}
          </button>

          {!hasLinkedProducts && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isCheckingProducts}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-950/50 hover:bg-rose-500 transition cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Spinner size={16} className="animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash size={16} weight="bold" />
                  <span>Ya, Hapus Kategori</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
