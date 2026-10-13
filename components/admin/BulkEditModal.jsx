'use client';

import React, { useState } from 'react';
import {
  X,
  Check,
  Spinner,
  PencilSimple,
  Sliders,
  Tag,
  CurrencyDollar,
  Sparkle,
  CheckCircle,
} from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { formatRupiah } from '@/lib/utils';
import { useToast } from './Toast';

export default function BulkEditModal({
  isOpen,
  onClose,
  selectedProductIds = [],
  categories = [],
  onSuccess,
}) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field edit enablement toggles
  const [changeCategory, setChangeCategory] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState('');

  const [changePrice, setChangePrice] = useState(false);
  const [newPrice, setNewPrice] = useState('');

  const [changeSoldOut, setChangeSoldOut] = useState(false);
  const [soldOutValue, setSoldOutValue] = useState('normal'); // 'normal' | 'sold_out'

  const [changeEdition, setChangeEdition] = useState(false);
  const [editionAction, setEditionAction] = useState('set'); // 'set' | 'clear'
  const [newEdition, setNewEdition] = useState('');

  if (!isOpen || selectedProductIds.length === 0) return null;

  const totalCount = selectedProductIds.length;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!changeCategory && !changePrice && !changeSoldOut && !changeEdition) {
      showToast('Pilih minimal satu kolom yang ingin Anda ubah.', 'warning');
      return;
    }

    const payload = {};

    if (changeCategory) {
      if (!newCategoryId) {
        showToast('Pilih kategori tujuan untuk bulk edit.', 'error');
        return;
      }
      payload.category_id = parseInt(newCategoryId, 10);
    }

    if (changePrice) {
      const cleanPrice = parseInt(String(newPrice).replace(/[^0-9]/g, ''), 10);
      if (isNaN(cleanPrice) || cleanPrice < 0) {
        showToast('Masukkan nominal harga yang valid.', 'error');
        return;
      }
      payload.price = cleanPrice;
    }

    if (changeSoldOut) {
      payload.sold_out = soldOutValue === 'sold_out' ? 'Y' : null;
    }

    if (changeEdition) {
      if (editionAction === 'clear') {
        payload.edition = null;
      } else {
        if (!newEdition.trim()) {
          showToast('Masukkan nama/nomor edisi atau pilih kosongkan edisi.', 'error');
          return;
        }
        payload.edition = newEdition.trim();
      }
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('products')
        .update(payload)
        .in('id', selectedProductIds);

      if (error) throw error;

      showToast(`Berhasil memperbarui ${totalCount} produk sekaligus!`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to bulk edit products:', err);
      showToast(`Gagal melakukan bulk edit: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-emerald-950/95 border border-emerald-700/60 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-emerald-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-800/60 bg-emerald-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-lime-400/20 border border-lime-400/40 flex items-center justify-center text-lime-400">
              <Sliders size={18} weight="bold" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-loui text-white tracking-wide uppercase">
                Bulk Edit Produk
              </h2>
              <p className="text-[11px] text-emerald-300/80">
                Mengubah massal <strong className="text-lime-300 font-mono">{totalCount} produk terpilih</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900/60 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          <p className="text-xs text-emerald-300/90 leading-relaxed bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/60">
            Centang opsi data yang ingin Anda ubah. Kolom yang tidak dicentang akan tetap mempertahankan nilai aslinya pada setiap produk.
          </p>

          {/* 1. Kategori */}
          <div className="p-3.5 rounded-xl bg-emerald-900/40 border border-emerald-700/50 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={changeCategory}
                onChange={(e) => setChangeCategory(e.target.checked)}
                className="w-4 h-4 rounded text-lime-400 bg-emerald-950 border-emerald-700 focus:ring-lime-400 focus:ring-offset-0 cursor-pointer accent-lime-400"
              />
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Tag size={15} className="text-lime-400" />
                Ubah Kategori
              </span>
            </label>

            {changeCategory && (
              <div className="pt-1 animate-in fade-in duration-150 pl-6">
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-emerald-950 border border-emerald-700 text-white focus:outline-none focus:border-lime-400 cursor-pointer"
                >
                  <option value="">-- Pilih Kategori Baru --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.category?.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 2. Harga */}
          <div className="p-3.5 rounded-xl bg-emerald-900/40 border border-emerald-700/50 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={changePrice}
                onChange={(e) => setChangePrice(e.target.checked)}
                className="w-4 h-4 rounded text-lime-400 bg-emerald-950 border-emerald-700 focus:ring-lime-400 focus:ring-offset-0 cursor-pointer accent-lime-400"
              />
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CurrencyDollar size={15} className="text-lime-400" />
                Ubah Harga
              </span>
            </label>

            {changePrice && (
              <div className="pt-1 animate-in fade-in duration-150 pl-6 space-y-1">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-lime-400 font-bold">Rp</span>
                  <input
                    type="text"
                    value={newPrice}
                    onChange={(e) => {
                      const num = e.target.value.replace(/[^0-9]/g, '');
                      setNewPrice(num ? parseInt(num, 10).toLocaleString('id-ID') : '');
                    }}
                    placeholder="Contoh: 15.000"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-emerald-950 border border-emerald-700 text-white focus:outline-none focus:border-lime-400"
                  />
                </div>
                <span className="text-[10px] text-emerald-400/80">
                  Harga ini akan diterapkan ke semua {totalCount} produk terpilih.
                </span>
              </div>
            )}
          </div>

          {/* 3. Sold Out */}
          <div className="p-3.5 rounded-xl bg-emerald-900/40 border border-emerald-700/50 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={changeSoldOut}
                onChange={(e) => setChangeSoldOut(e.target.checked)}
                className="w-4 h-4 rounded text-lime-400 bg-emerald-950 border-emerald-700 focus:ring-lime-400 focus:ring-offset-0 cursor-pointer accent-lime-400"
              />
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle size={15} className="text-lime-400" />
                Ubah Status Sold Out (Ketersediaan)
              </span>
            </label>

            {changeSoldOut && (
              <div className="pt-1 animate-in fade-in duration-150 pl-6 flex flex-wrap gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="soldOutOption"
                    value="normal"
                    checked={soldOutValue === 'normal'}
                    onChange={() => setSoldOutValue('normal')}
                    className="text-lime-400 accent-lime-400 cursor-pointer"
                  />
                  <span className="text-lime-300 font-semibold">TERSEDIA (Bukan Sold Out)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="soldOutOption"
                    value="sold_out"
                    checked={soldOutValue === 'sold_out'}
                    onChange={() => setSoldOutValue('sold_out')}
                    className="text-rose-400 accent-rose-500 cursor-pointer"
                  />
                  <span className="text-rose-300 font-semibold">SOLD OUT (Habis)</span>
                </label>
              </div>
            )}
          </div>

          {/* 4. Edisi */}
          <div className="p-3.5 rounded-xl bg-emerald-900/40 border border-emerald-700/50 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={changeEdition}
                onChange={(e) => setChangeEdition(e.target.checked)}
                className="w-4 h-4 rounded text-lime-400 bg-emerald-950 border-emerald-700 focus:ring-lime-400 focus:ring-offset-0 cursor-pointer accent-lime-400"
              />
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkle size={15} className="text-lime-400" />
                Ubah Edisi
              </span>
            </label>

            {changeEdition && (
              <div className="pt-1 animate-in fade-in duration-150 pl-6 space-y-2">
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="editionActionOption"
                      checked={editionAction === 'set'}
                      onChange={() => setEditionAction('set')}
                      className="accent-lime-400 cursor-pointer"
                    />
                    <span>Tentukan Edisi Baru</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="editionActionOption"
                      checked={editionAction === 'clear'}
                      onChange={() => setEditionAction('clear')}
                      className="accent-lime-400 cursor-pointer"
                    />
                    <span className="text-amber-300">Kosongkan Edisi</span>
                  </label>
                </div>

                {editionAction === 'set' && (
                  <input
                    type="text"
                    value={newEdition}
                    onChange={(e) => setNewEdition(e.target.value)}
                    placeholder="Contoh: 12 atau SPECIAL atau LIMITED"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-emerald-950 border border-emerald-700 text-white focus:outline-none focus:border-lime-400"
                  />
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-emerald-800/80 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 font-semibold text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 text-emerald-950 font-bold text-xs sm:text-sm shadow-lg hover:from-lime-300 hover:to-lime-400 transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Spinner size={16} className="animate-spin text-emerald-950" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Check size={16} weight="bold" />
                  <span>Terapkan Bulk Edit ({totalCount} Produk)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
