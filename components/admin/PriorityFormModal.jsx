'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Spinner,
  Star,
  ArrowDown,
  User,
  Shield,
  Calendar,
  Package,
  MagnifyingGlass,
  Tag,
  Info,
} from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { useToast } from './Toast';
import { optimizeCloudinaryUrl } from '@/lib/utils';

const TARGET_TYPES = [
  { id: 'player', label: 'Pemain', icon: User, desc: 'Mencocokkan nama pemain di produk' },
  { id: 'team', label: 'Tim / Klub', icon: Shield, desc: 'Mencocokkan nama tim sepak bola' },
  { id: 'year', label: 'Tahun', icon: Calendar, desc: 'Mencocokkan tahun rilisan produk' },
  { id: 'product', label: 'Produk Spesifik', icon: Package, desc: 'Pilih 1 produk langsung dari katalog' },
  { id: 'keyword', label: 'Kata Kunci', icon: Tag, desc: 'Mencocokkan teks judul/deskripsi bebas' },
];

export default function PriorityFormModal({
  isOpen,
  onClose,
  priorityToEdit = null,
  defaultType = 'top',
  products = [],
  nextSortOrder = 1,
  onSuccess,
}) {
  const { showToast } = useToast();
  const isEditing = Boolean(priorityToEdit);

  const [type, setType] = useState(defaultType);
  const [targetType, setTargetType] = useState('player');
  const [targetValue, setTargetValue] = useState('');
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or Populate form when modal opens or priorityToEdit changes
  useEffect(() => {
    if (priorityToEdit) {
      setType(priorityToEdit.type || 'top');
      setTargetType(priorityToEdit.target_type || 'player');
      setTargetValue(priorityToEdit.target_value || '');
      setLabel(priorityToEdit.label || '');
      setNotes(priorityToEdit.notes || '');
      setIsActive(priorityToEdit.is_active !== false);
      setProductSearch('');
    } else {
      setType(defaultType);
      setTargetType('player');
      setTargetValue('');
      setLabel('');
      setNotes('');
      setIsActive(true);
      setProductSearch('');
    }
  }, [priorityToEdit, defaultType, isOpen]);

  // Distinct suggestions from current products
  const suggestions = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];
    if (targetType === 'player') {
      const set = new Set();
      products.forEach((p) => {
        if (p.player_name && p.player_name.trim()) set.add(p.player_name.trim());
      });
      return Array.from(set).sort();
    }
    if (targetType === 'team') {
      const set = new Set();
      products.forEach((p) => {
        if (p.team && p.team.trim()) set.add(p.team.trim());
      });
      return Array.from(set).sort();
    }
    if (targetType === 'year') {
      const set = new Set();
      products.forEach((p) => {
        if (p.year && String(p.year).trim()) set.add(String(p.year).trim());
      });
      return Array.from(set).sort().reverse();
    }
    return [];
  }, [products, targetType]);

  // Filtered products when selecting specific product
  const filteredProducts = useMemo(() => {
    if (targetType !== 'product') return [];
    const q = productSearch.toLowerCase().trim();
    if (!q) return products.slice(0, 15);
    return products
      .filter((p) => {
        const title = (p.title || '').toLowerCase();
        const player = (p.player_name || '').toLowerCase();
        const team = (p.team || '').toLowerCase();
        const id = String(p.id || '');
        return title.includes(q) || player.includes(q) || team.includes(q) || id.includes(q);
      })
      .slice(0, 15);
  }, [products, targetType, productSearch]);

  // Selected product object if targetType is 'product'
  const selectedProduct = useMemo(() => {
    if (targetType !== 'product' || !targetValue) return null;
    return products.find((p) => String(p.id) === String(targetValue)) || null;
  }, [products, targetType, targetValue]);

  // Auto-fill label when user picks suggestion
  const handleSelectSuggestion = (val) => {
    setTargetValue(val);
    if (!label || label === targetValue) {
      setLabel(val);
    }
  };

  // When user selects a specific product
  const handleSelectProduct = (prod) => {
    setTargetValue(String(prod.id));
    const autoLabel = prod.title || prod.player_name || `Produk #${prod.id}`;
    setLabel(autoLabel);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanTargetVal = String(targetValue || '').trim();
    const cleanLabel = String(label || '').trim() || cleanTargetVal;

    if (!cleanTargetVal) {
      showToast('Harap tentukan target prioritas!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type,
        target_type: targetType,
        target_value: cleanTargetVal.toLowerCase(),
        label: cleanLabel,
        notes: notes.trim() || null,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        const { error } = await supabase
          .from('catalog_priorities')
          .update(payload)
          .eq('id', priorityToEdit.id);

        if (error) throw error;
        showToast(`Prioritas "${cleanLabel}" berhasil diperbarui!`, 'success');
      } else {
        const insertPayload = {
          ...payload,
          sort_order: nextSortOrder,
        };
        const { error } = await supabase
          .from('catalog_priorities')
          .insert([insertPayload]);

        if (error) throw error;
        showToast(`Prioritas baru "${cleanLabel}" berhasil ditambahkan!`, 'success');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving priority:', err);
      showToast(err.message || 'Gagal menyimpan prioritas katalog', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-emerald-950 border border-emerald-700/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-800/60 bg-emerald-900/40">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                type === 'top'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {type === 'top' ? <Star size={22} weight="fill" /> : <ArrowDown size={22} weight="bold" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                {isEditing ? 'Edit Aturan Prioritas' : 'Tambah Aturan Prioritas'}
              </h2>
              <p className="text-xs text-emerald-300/80">
                {type === 'top' ? 'Prioritas Atas (Top)' : 'Prioritas Bawah (Mendekati Sold Out)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-emerald-400 hover:text-white rounded-xl hover:bg-emerald-800/60 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 text-sm">
          {/* 1. Pilih Tipe Prioritas: Top vs Bottom */}
          <div>
            <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">
              Posisi Prioritas
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-emerald-900/40 rounded-2xl border border-emerald-800/60">
              <button
                type="button"
                onClick={() => setType('top')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
                  type === 'top'
                    ? 'bg-amber-400 text-emerald-950 shadow-md font-extrabold'
                    : 'text-emerald-300 hover:text-white hover:bg-emerald-800/40'
                }`}
              >
                <Star size={16} weight={type === 'top' ? 'fill' : 'regular'} />
                <span>TOP (Atas)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('bottom')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
                  type === 'bottom'
                    ? 'bg-rose-500 text-white shadow-md font-extrabold'
                    : 'text-emerald-300 hover:text-white hover:bg-emerald-800/40'
                }`}
              >
                <ArrowDown size={16} weight="bold" />
                <span>BOTTOM (Bawah)</span>
              </button>
            </div>
          </div>

          {/* 2. Pilih Target Type */}
          <div>
            <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">
              Jenis Target Pencocokan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TARGET_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = targetType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTargetType(t.id);
                      setTargetValue('');
                      setLabel('');
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-lime-400/15 border-lime-400 text-lime-300 ring-1 ring-lime-400/50 shadow-sm'
                        : 'bg-emerald-900/30 border-emerald-800/60 text-emerald-300 hover:bg-emerald-800/40 hover:border-emerald-700'
                    }`}
                  >
                    <Icon size={20} className={isSelected ? 'text-lime-400' : 'text-emerald-400'} />
                    <span className="font-semibold text-xs mt-2 text-white">{t.label}</span>
                    <span className="text-[10px] text-emerald-400/70 mt-0.5 line-clamp-1">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Input Value based on Target Type */}
          {targetType === 'product' ? (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                Pilih Produk Spesifik
              </label>

              {/* Selected product card preview */}
              {selectedProduct ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-lime-950/60 border border-lime-500/50">
                  <div className="flex items-center gap-3">
                    {selectedProduct.img ? (
                      <img
                        src={optimizeCloudinaryUrl(selectedProduct.img)}
                        alt={selectedProduct.title}
                        className="w-12 h-12 rounded-xl object-cover bg-emerald-900"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-emerald-900 flex items-center justify-center text-xs">
                        No Img
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-white text-xs">{selectedProduct.title}</div>
                      <div className="text-[11px] text-emerald-300">
                        ID: #{selectedProduct.id} • {selectedProduct.category}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetValue('');
                      setLabel('');
                    }}
                    className="p-1.5 rounded-lg text-emerald-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                    title="Ganti produk"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : null}

              {/* Product search box */}
              <div className="relative">
                <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Cari judul produk / ID / nama pemain..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-500 text-xs focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
                />
              </div>

              {/* Search results list */}
              <div className="max-h-40 overflow-y-auto space-y-1 p-1 bg-emerald-900/30 rounded-2xl border border-emerald-800/60">
                {filteredProducts.length === 0 ? (
                  <div className="p-3 text-center text-xs text-emerald-400/60">Tidak ada produk ditemukan</div>
                ) : (
                  filteredProducts.map((p) => {
                    const isPicked = String(p.id) === String(targetValue);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition text-xs ${
                          isPicked
                            ? 'bg-lime-400/20 text-lime-300 font-bold border border-lime-400/40'
                            : 'hover:bg-emerald-800/40 text-emerald-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] text-emerald-400/80">#{p.id}</span>
                          <span className="truncate">{p.title || p.player_name}</span>
                          {p.edition && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300">
                              {p.edition}
                            </span>
                          )}
                        </div>
                        {isPicked && <Check size={16} className="text-lime-400 shrink-0" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                Nilai Target ({targetType.toUpperCase()})
              </label>
              <input
                type="text"
                value={targetValue}
                onChange={(e) => {
                  setTargetValue(e.target.value);
                  if (!label || label === targetValue) {
                    setLabel(e.target.value);
                  }
                }}
                placeholder={
                  targetType === 'player'
                    ? 'Contoh: Cristiano Ronaldo atau Messi'
                    : targetType === 'team'
                      ? 'Contoh: Leicester City atau Real Madrid'
                      : targetType === 'year'
                        ? 'Contoh: 2024 atau 1998'
                        : 'Contoh kata kunci judul stiker...'
                }
                required
                className="w-full px-4 py-2.5 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-500 text-xs focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
              />

              {/* Suggestions chips */}
              {suggestions.length > 0 && (
                <div>
                  <div className="text-[10px] text-emerald-400/80 mb-1.5">Saran cepat dari produk katalog:</div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {suggestions.slice(0, 12).map((sugg) => (
                      <button
                        key={sugg}
                        type="button"
                        onClick={() => handleSelectSuggestion(sugg)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          targetValue.toLowerCase() === sugg.toLowerCase()
                            ? 'bg-lime-400 text-emerald-950 border-lime-400 font-bold'
                            : 'bg-emerald-900/50 border-emerald-700/60 text-emerald-200 hover:bg-emerald-800 hover:text-white'
                        }`}
                      >
                        {sugg}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Label Tampilan di Admin */}
          <div>
            <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1.5">
              Label Nama (Tampilan di Admin)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nama tampilan yang jelas dibaca admin"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-500 text-xs focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
            />
          </div>

          {/* 5. Catatan Admin (Opsional) */}
          <div>
            <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1.5">
              Catatan Admin (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Trending minggu ini, atau banner promosi"
              className="w-full px-4 py-2 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-500 text-xs focus:outline-none focus:border-lime-400"
            />
          </div>

          {/* 6. Status Aktif */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-900/40 border border-emerald-800/60">
            <div>
              <div className="font-semibold text-white text-xs">Aktifkan Aturan Ini</div>
              <div className="text-[10px] text-emerald-400/80">
                Jika dimatikan, urutan prioritas tidak akan diterapkan di katalog
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsActive((prev) => !prev)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                isActive ? 'bg-lime-400' : 'bg-emerald-900 border border-emerald-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-emerald-950 transition-transform absolute top-1 left-1 ${
                  isActive ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Info Notice Box */}
          <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-800/50 flex items-start gap-2.5 text-cyan-200 text-xs">
            <Info size={18} className="text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              {type === 'top' ? (
                <span>
                  <strong>Top Priority:</strong> Pada tab <em>All</em>, item yang cocok akan langsung ditarik ke paling
                  atas katalog. Pada kategori khusus (seperti Stiker), item akan diprioritaskan di dalam edisinya
                  masing-masing.
                </span>
              ) : (
                <span>
                  <strong>Bottom Priority (Skenario A):</strong> Item yang cocok akan ditaruh di posisi paling bawah di
                  antara produk yang masih ada stoknya (tepat di atas produk <em>Sold Out</em>).
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-800/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-emerald-700/60 text-emerald-300 hover:text-white hover:bg-emerald-800/50 text-xs font-semibold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 text-emerald-950 text-xs font-bold shadow-lg shadow-lime-950/40 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Spinner size={16} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check size={16} weight="bold" />
                  <span>{isEditing ? 'Simpan Perubahan' : 'Tambahkan Prioritas'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

