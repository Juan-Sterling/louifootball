'use client';

import React, { useState, useMemo } from 'react';
import {
  Star,
  ArrowDown,
  Plus,
  PencilSimple,
  Trash,
  ArrowUp,
  ArrowsDownUp,
  CheckCircle,
  XCircle,
  MagnifyingGlass,
  Spinner,
  User,
  Shield,
  Calendar,
  Package,
  Tag,
  Info,
  WarningCircle,
} from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { useToast } from './Toast';
import PriorityFormModal from './PriorityFormModal';
import PriorityDeleteModal from './PriorityDeleteModal';
import { optimizeCloudinaryUrl } from '@/lib/utils';

export default function CatalogPriorityManager({
  priorities = [],
  setPriorities,
  products = [],
  isLoading = false,
  onRefresh,
}) {
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState('top'); // 'top' or 'bottom'
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [priorityToEdit, setPriorityToEdit] = useState(null);
  const [priorityToDelete, setPriorityToDelete] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Stats calculation
  const stats = useMemo(() => {
    const total = priorities.length;
    const topCount = priorities.filter((p) => p.type === 'top').length;
    const bottomCount = priorities.filter((p) => p.type === 'bottom').length;
    const activeCount = priorities.filter((p) => p.is_active !== false).length;
    return { total, topCount, bottomCount, activeCount };
  }, [priorities]);

  // Filtered and Sorted priorities for active sub-tab
  const listItems = useMemo(() => {
    let list = priorities.filter((p) => p.type === activeSubTab);
    // Sort ascending by sort_order
    list.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.label || '').toLowerCase().includes(q) ||
          (p.target_value || '').toLowerCase().includes(q) ||
          (p.target_type || '').toLowerCase().includes(q) ||
          (p.notes || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [priorities, activeSubTab, searchQuery]);

  // Target Type Badge Helper
  const renderTargetBadge = (targetType) => {
    switch (targetType) {
      case 'player':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
            <User size={12} weight="bold" /> Pemain
          </span>
        );
      case 'team':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
            <Shield size={12} weight="bold" /> Tim
          </span>
        );
      case 'year':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
            <Calendar size={12} weight="bold" /> Tahun
          </span>
        );
      case 'product':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800/60">
            <Package size={12} weight="bold" /> Produk
          </span>
        );
      case 'keyword':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800/60">
            <Tag size={12} weight="bold" /> Kata Kunci
          </span>
        );
    }
  };

  // Find product thumbnail if target is 'product'
  const getProductInfo = (targetValue) => {
    if (!products || products.length === 0) return null;
    return products.find((p) => String(p.id) === String(targetValue)) || null;
  };

  // Quick Toggle Active Status
  const handleToggleActive = async (item) => {
    if (togglingId) return;
    const newStatus = !item.is_active;
    const statusText = newStatus ? 'AKTIF' : 'NON-AKTIF';
    setTogglingId(item.id);

    // Optimistic UI update
    if (setPriorities) {
      setPriorities((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, is_active: newStatus } : p))
      );
    }

    try {
      const { error } = await supabase
        .from('catalog_priorities')
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) throw error;
      showToast(`Prioritas "${item.label}" diubah ke ${statusText}`, 'success', 2000);
    } catch (err) {
      // Rollback
      if (setPriorities) {
        setPriorities((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, is_active: !newStatus } : p))
        );
      }
      console.error('Toggle error:', err);
      showToast('Gagal mengubah status prioritas', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // Move Position Up or Down (Swaps sort_order between adjacent items)
  const handleMoveOrder = async (item, direction) => {
    if (isReordering) return;

    // Get current sorted list of this type (without search filter)
    const currentList = priorities
      .filter((p) => p.type === item.type)
      .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));

    const currentIndex = currentList.findIndex((p) => p.id === item.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    const targetItem = currentList[targetIndex];

    const currentOrder = Number(item.sort_order) || currentIndex + 1;
    const targetOrder = Number(targetItem.sort_order) || targetIndex + 1;

    // In case both have same sort_order, ensure distinct values
    const newCurrentOrder = currentOrder === targetOrder ? targetOrder + (direction === 'up' ? -1 : 1) : targetOrder;
    const newTargetOrder = currentOrder;

    setIsReordering(true);

    // Optimistic update
    if (setPriorities) {
      setPriorities((prev) =>
        prev.map((p) => {
          if (p.id === item.id) return { ...p, sort_order: newCurrentOrder };
          if (p.id === targetItem.id) return { ...p, sort_order: newTargetOrder };
          return p;
        })
      );
    }

    try {
      const update1 = supabase
        .from('catalog_priorities')
        .update({ sort_order: newCurrentOrder, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      const update2 = supabase
        .from('catalog_priorities')
        .update({ sort_order: newTargetOrder, updated_at: new Date().toISOString() })
        .eq('id', targetItem.id);

      const [res1, res2] = await Promise.all([update1, update2]);
      if (res1.error) throw res1.error;
      if (res2.error) throw res2.error;

      showToast(`Urutan "${item.label}" berhasil digeser!`, 'success', 1500);
    } catch (err) {
      console.error('Reorder error:', err);
      showToast('Gagal memindahkan urutan prioritas', 'error');
      if (onRefresh) onRefresh(true);
    } finally {
      setIsReordering(false);
    }
  };

  // Calculate next sort order for new item
  const nextSortOrder = useMemo(() => {
    const ofType = priorities.filter((p) => p.type === activeSubTab);
    if (ofType.length === 0) return 1;
    const maxOrder = Math.max(...ofType.map((p) => Number(p.sort_order) || 0));
    return maxOrder + 1;
  }, [priorities, activeSubTab]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header & KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Prioritas */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/40 backdrop-blur-sm">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-1">
            <span>Total Aturan</span>
            <ArrowsDownUp size={18} className="text-emerald-300" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">{stats.total}</div>
          <span className="text-[10px] text-emerald-400/80">{stats.activeCount} aktif di katalog</span>
        </div>

        {/* Prioritas TOP */}
        <div
          onClick={() => setActiveSubTab('top')}
          className={`p-3.5 sm:p-4 rounded-2xl border backdrop-blur-sm transition-all duration-200 cursor-pointer select-none hover:scale-[1.02] active:scale-[0.99] ${
            activeSubTab === 'top'
              ? 'bg-amber-950/80 border-amber-400 shadow-md ring-1 ring-amber-400/50'
              : 'bg-emerald-950/80 border-emerald-700/40 hover:border-amber-400/60'
          }`}
          title="Klik untuk melihat daftar TOP Priority"
        >
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold mb-1">
            <span>Prioritas TOP</span>
            <Star size={18} weight="fill" className="text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300">{stats.topCount}</div>
          <span className="text-[10px] text-amber-400/80">Paling atas katalog</span>
        </div>

        {/* Prioritas BOTTOM */}
        <div
          onClick={() => setActiveSubTab('bottom')}
          className={`p-3.5 sm:p-4 rounded-2xl border backdrop-blur-sm transition-all duration-200 cursor-pointer select-none hover:scale-[1.02] active:scale-[0.99] ${
            activeSubTab === 'bottom'
              ? 'bg-rose-950/80 border-rose-400 shadow-md ring-1 ring-rose-400/50'
              : 'bg-emerald-950/80 border-emerald-700/40 hover:border-rose-400/60'
          }`}
          title="Klik untuk melihat daftar BOTTOM Priority"
        >
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold mb-1">
            <span>Prioritas BOTTOM</span>
            <ArrowDown size={18} weight="bold" className="text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-300">{stats.bottomCount}</div>
          <span className="text-[10px] text-rose-400/80">Di atas Sold Out</span>
        </div>

        {/* Info Sold Out */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/40 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>SOLD OUT</span>
            <XCircle size={18} weight="fill" className="text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-300">Dasar</div>
          <span className="text-[10px] text-slate-400/80">Selalu di paling akhir</span>
        </div>
      </div>

      {/* 2. Sub-tab Navigation (TOP vs BOTTOM) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-emerald-950/90 border border-emerald-700/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {/* SubTab TOP */}
          <button
            type="button"
            onClick={() => setActiveSubTab('top')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
              activeSubTab === 'top'
                ? 'bg-amber-400 text-emerald-950 shadow-md font-extrabold shadow-amber-950/30'
                : 'text-emerald-300 hover:text-white hover:bg-emerald-900/60 font-semibold'
            }`}
          >
            <Star size={16} weight={activeSubTab === 'top' ? 'fill' : 'regular'} />
            <span>Pemain / Produk TOP</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeSubTab === 'top' ? 'bg-emerald-950 text-amber-400' : 'bg-emerald-900 text-emerald-300'
              }`}
            >
              {stats.topCount}
            </span>
          </button>

          {/* SubTab BOTTOM */}
          <button
            type="button"
            onClick={() => setActiveSubTab('bottom')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
              activeSubTab === 'bottom'
                ? 'bg-rose-500 text-white shadow-md font-extrabold shadow-rose-950/40'
                : 'text-emerald-300 hover:text-white hover:bg-emerald-900/60 font-semibold'
            }`}
          >
            <ArrowDown size={16} weight="bold" />
            <span>Posisi BOTTOM</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeSubTab === 'bottom' ? 'bg-rose-950 text-rose-300' : 'bg-emerald-900 text-emerald-300'
              }`}
            >
              {stats.bottomCount}
            </span>
          </button>
        </div>

        {/* Action: Add Button */}
        <button
          type="button"
          onClick={() => {
            setPriorityToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 text-emerald-950 font-bold text-xs shadow-lg shadow-lime-950/40 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer shrink-0"
        >
          <Plus size={16} weight="bold" />
          <span>Tambah Prioritas {activeSubTab === 'top' ? 'TOP' : 'BOTTOM'}</span>
        </button>
      </div>

      {/* 3. Penjelasan Visual Skenario A & Perilaku */}
      <div className="p-3.5 rounded-2xl bg-emerald-900/40 border border-emerald-800/60 text-xs text-emerald-200 flex items-start gap-3">
        <Info size={20} className="text-lime-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-white">
            {activeSubTab === 'top'
              ? 'Bagaimana Prioritas TOP Ditampilkan di Toko?'
              : 'Bagaimana Prioritas BOTTOM (Skenario A) Ditampilkan di Toko?'}
          </div>
          <p className="text-emerald-300/80 leading-relaxed text-[11px]">
            {activeSubTab === 'top' ? (
              <>
                Pada tab <strong>&quot;Semua&quot; (All)</strong>, produk yang cocok dengan daftar Top di bawah akan langsung
                ditarik ke <strong>paling atas katalog</strong>. Pada kategori spesifik (seperti Stiker), produk
                dikelompokkan per edisi dulu, lalu pemain top tampil di urutan awal edisi tersebut.
              </>
            ) : (
              <>
                Sesuai <strong>Skenario A</strong>: Urutan #1 (paling atas dalam kelompok ini), urutan nomor lebih besar
                makin ke bawah mendekati barisan sold out. Seluruh produk bottom ini diposisikan{' '}
                <strong>tepat di atas produk Sold Out</strong>.
              </>
            )}
          </p>
        </div>
      </div>

      {/* 4. Search Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari label prioritas ${activeSubTab === 'top' ? 'TOP' : 'BOTTOM'}, pemain, tim...`}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700/50 text-white placeholder-emerald-500 text-xs focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
          />
        </div>
      </div>

      {/* 5. Daftar Prioritas (List Cards) */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="p-12 text-center text-emerald-400 flex flex-col items-center justify-center gap-3">
            <Spinner size={32} className="animate-spin text-lime-400" />
            <span className="text-xs">Memuat daftar prioritas katalog...</span>
          </div>
        ) : listItems.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-emerald-950/60 border border-dashed border-emerald-800/80 flex flex-col items-center justify-center gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-900/60 text-emerald-400">
              <ArrowsDownUp size={28} />
            </div>
            <div className="text-sm font-bold text-white">
              Belum ada aturan prioritas {activeSubTab === 'top' ? 'TOP' : 'BOTTOM'}
            </div>
            <p className="text-xs text-emerald-400/80 max-w-sm">
              {searchQuery
                ? 'Tidak ada aturan yang cocok dengan pencarian Anda.'
                : `Tambahkan pemain, tim, atau produk ke dalam daftar prioritas ${activeSubTab.toUpperCase()}.`}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setPriorityToEdit(null);
                  setIsModalOpen(true);
                }}
                className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lime-400 text-emerald-950 font-bold text-xs hover:bg-lime-300 transition"
              >
                <Plus size={16} weight="bold" />
                <span>Tambah Sekarang</span>
              </button>
            )}
          </div>
        ) : (
          listItems.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === listItems.length - 1;
            const isItemActive = item.is_active !== false;
            const productMatch = item.target_type === 'product' ? getProductInfo(item.target_value) : null;

            return (
              <div
                key={item.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isItemActive
                    ? activeSubTab === 'top'
                      ? 'bg-emerald-950/90 border-emerald-700/60 hover:border-amber-400/50 hover:bg-emerald-900/40'
                      : 'bg-emerald-950/90 border-emerald-700/60 hover:border-rose-400/50 hover:bg-emerald-900/40'
                    : 'bg-emerald-950/40 border-emerald-900/50 opacity-60'
                }`}
              >
                {/* Left: Position Rank & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Position number badge */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      activeSubTab === 'top'
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                    title={`Peringkat #${index + 1} (sort_order: ${item.sort_order})`}
                  >
                    #{index + 1}
                  </div>

                  {/* Thumbnail if specific product */}
                  {productMatch && productMatch.img && (
                    <img
                      src={optimizeCloudinaryUrl(productMatch.img)}
                      alt={item.label}
                      className="w-10 h-10 rounded-xl object-cover bg-emerald-900 border border-emerald-700/50 shrink-0"
                    />
                  )}

                  {/* Name and Match info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm truncate">{item.label}</span>
                      {renderTargetBadge(item.target_type)}
                      {!isItemActive && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 font-semibold">
                          Non-Aktif
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400/80 mt-0.5 truncate">
                      <span className="font-mono">target: {item.target_value}</span>
                      {productMatch && (
                        <>
                          <span>•</span>
                          <span>ID: #{productMatch.id}</span>
                          {productMatch.edition && <span>• Edisi: {productMatch.edition}</span>}
                        </>
                      )}
                      {item.notes && (
                        <>
                          <span>•</span>
                          <span className="italic text-emerald-300/70">{item.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions (Move Up, Move Down, Toggle, Edit, Delete) */}
                <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-900/60">
                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(item, 'up')}
                    disabled={isFirst || isReordering}
                    className="p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-800/60 border border-emerald-800/60 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Geser Naik (Mendahului)"
                  >
                    <ArrowUp size={16} weight="bold" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(item, 'down')}
                    disabled={isLast || isReordering}
                    className="p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-800/60 border border-emerald-800/60 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Geser Turun"
                  >
                    <ArrowDown size={16} weight="bold" />
                  </button>

                  {/* Toggle Active */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    disabled={togglingId === item.id}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      isItemActive
                        ? 'bg-emerald-900/60 border-emerald-700/60 text-lime-400 hover:bg-emerald-800'
                        : 'bg-emerald-950 border-emerald-900 text-slate-400 hover:bg-emerald-900/40'
                    }`}
                    title={isItemActive ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                  >
                    {togglingId === item.id ? (
                      <Spinner size={14} className="animate-spin text-lime-400" />
                    ) : isItemActive ? (
                      <CheckCircle size={14} weight="fill" className="text-lime-400" />
                    ) : (
                      <XCircle size={14} className="text-slate-400" />
                    )}
                    <span className="hidden sm:inline">{isItemActive ? 'Aktif' : 'Mati'}</span>
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => {
                      setPriorityToEdit(item);
                      setIsModalOpen(true);
                    }}
                    className="p-2 rounded-xl text-emerald-300 hover:text-cyan-300 hover:bg-cyan-950/40 border border-emerald-800/60 transition cursor-pointer"
                    title="Edit Aturan"
                  >
                    <PencilSimple size={16} />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => setPriorityToDelete(item)}
                    className="p-2 rounded-xl text-emerald-400 hover:text-rose-400 hover:bg-rose-950/50 border border-emerald-800/60 transition cursor-pointer"
                    title="Hapus Aturan"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Modal Form Tambah / Edit Prioritas */}
      <PriorityFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        priorityToEdit={priorityToEdit}
        defaultType={activeSubTab}
        products={products}
        nextSortOrder={nextSortOrder}
        onSuccess={() => {
          if (onRefresh) onRefresh(true);
        }}
      />

      {/* 7. Modal Konfirmasi Hapus Prioritas */}
      <PriorityDeleteModal
        isOpen={Boolean(priorityToDelete)}
        onClose={() => setPriorityToDelete(null)}
        priority={priorityToDelete}
        onSuccess={(deletedId) => {
          if (setPriorities) {
            setPriorities((prev) => prev.filter((p) => p.id !== deletedId));
          }
          if (onRefresh) onRefresh(true);
        }}
      />
    </div>
  );
}

