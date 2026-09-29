'use client';

import React, { useState } from 'react';
import { WarningCircle, Trash, X, Spinner } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { formatRupiah } from '@/lib/utils';
import { useToast } from './Toast';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  if (!isOpen || !product) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      // Attempt to clean up Cloudinary images if present
      const imagesToDelete = [product.img, product.img_add].filter(
        (url) => url && typeof url === 'string' && url.includes('cloudinary.com')
      );

      if (imagesToDelete.length > 0) {
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

        for (const imgUrl of imagesToDelete) {
          try {
            await fetch('/api/upload', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: imgUrl,
                api_key: savedApiKey,
                api_secret: savedApiSecret,
                cloud_name: savedCloudName,
              }),
            });
          } catch {
            // ignore error
          }
        }
      }

      showToast(`Produk "${product.title || product.player_name}" berhasil dihapus.`, 'success');
      if (onSuccess) onSuccess(product.id);
      onClose();
    } catch (err) {
      console.error('Error deleting product:', err);
      showToast(`Gagal menghapus produk: ${err.message || 'Terjadi kesalahan sistem.'}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-emerald-950 border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-rose-400">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <WarningCircle size={24} weight="fill" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Hapus Produk?</h3>
              <p className="text-xs text-rose-300/80">Tindakan ini permanen dan tidak dapat dibatalkan.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Product Details Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-900/40 border border-emerald-700/40">
          <div className="w-14 h-14 rounded-lg bg-emerald-950 overflow-hidden shrink-0 border border-emerald-700/60 flex items-center justify-center">
            {product.img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.img}
                alt={product.title}
                className="w-full h-full object-contain p-0.5"
              />
            ) : (
              <span className="text-[10px] text-emerald-500">No Img</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white uppercase truncate">
              {product.title || product.player_name}
            </h4>
            <p className="text-[11px] text-emerald-300 truncate">
              {product.team ? `${product.team} • ` : ''}ID: #{product.id}
            </p>
            <p className="text-xs font-bold text-lime-400 mt-0.5">
              {formatRupiah(product.price)}
            </p>
          </div>
        </div>

        <p className="text-xs text-emerald-200/90 leading-relaxed">
          Apakah Anda yakin ingin menghapus produk ini dari database katalog? Data yang dihapus tidak dapat dipulihkan kembali.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/60 rounded-xl transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-950/50 transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Spinner size={16} className="animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash size={16} weight="bold" />
                <span>Ya, Hapus Produk</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
