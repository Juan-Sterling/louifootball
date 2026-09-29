'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  PencilSimple,
  Trash,
  Tag,
  Package,
  MagnifyingGlass,
  X,
  Spinner,
  CheckCircle,
  XCircle,
  FolderOpen,
} from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { getCategoryBadgeStyle } from '@/lib/utils';
import CategoryFormModal from './CategoryFormModal';
import CategoryDeleteModal from './CategoryDeleteModal';
import { useToast } from './Toast';

export default function CategoryManager({
  categories = [],
  setCategories,
  products = [],
  isLoading = false,
  onRefresh,
}) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Compute products count per category
  const productCountMap = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const catId = p.category_id || p.categories?.id;
      if (catId) {
        map[catId] = (map[catId] || 0) + 1;
      }
      const catName = (p.categories?.category || p.category || '').toLowerCase().trim();
      if (catName) {
        map[catName] = (map[catName] || 0) + 1;
      }
    });
    return map;
  }, [products]);

  const getCountForCat = (cat) => {
    return productCountMap[cat.id] || productCountMap[cat.category?.toLowerCase()?.trim()] || 0;
  };

  // KPI Stats for categories
  const categoryStats = useMemo(() => {
    const total = categories.length;
    const activeCount = categories.filter((c) => c.is_active !== false).length;
    const inactiveCount = total - activeCount;
    return {
      total,
      activeCount,
      inactiveCount,
      totalProducts: products.length,
    };
  }, [categories, products]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      (c) =>
        (c.category || '').toLowerCase().includes(q) ||
        (c.spec || '').toLowerCase().includes(q) ||
        (c.desc || '').toLowerCase().includes(q) ||
        String(c.id).includes(q)
    );
  }, [categories, searchQuery]);

  // 1-Click Quick Toggle for Category Active Status
  const handleToggleActive = async (cat) => {
    if (togglingId) return;
    const newStatus = cat.is_active === false ? true : false;
    const statusText = newStatus ? 'AKTIF' : 'NON-AKTIF';
    setTogglingId(cat.id);

    // Optimistic UI update
    if (setCategories) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === cat.id
            ? { ...c, is_active: newStatus }
            : c
        )
      );
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .update({ is_active: newStatus })
        .eq('id', cat.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(
          'Tidak dapat mengubah data di Supabase. Izin UPDATE tabel categories diblokir oleh Row Level Security (RLS).'
        );
      }

      showToast(`Status kategori "${cat.category}" diubah ke ${statusText}`, 'success', 2500);
    } catch (err) {
      // Rollback optimistic update
      if (setCategories) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === cat.id
              ? { ...c, is_active: cat.is_active }
              : c
          )
        );
      }
      console.error('Failed to toggle category status:', err);
      showToast(`Gagal mengubah status: ${err.message || 'Error'}`, 'error', 4000);
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenAddModal = () => {
    setCategoryToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setCategoryToEdit(cat);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (cat) => {
    setCategoryToDelete(cat);
  };

  return (
    <div className="space-y-6">
      {/* Category KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Kategori */}
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/40 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-1">
            <span>Total Kategori</span>
            <Tag size={18} className="text-lime-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {categoryStats.total}
          </div>
          <span className="text-[10px] text-emerald-400/80">Seluruh kategori</span>
        </div>

        {/* Kategori Aktif */}
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/40 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-1">
            <span>Kategori Aktif</span>
            <CheckCircle size={18} className="text-lime-400" weight="fill" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-lime-400">
            {categoryStats.activeCount}
          </div>
          <span className="text-[10px] text-emerald-400/80">Tampil saat tambah produk</span>
        </div>

        {/* Kategori Non-Aktif */}
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/40 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold mb-1">
            <span>Non-Aktif</span>
            <XCircle size={18} className="text-rose-400" weight="fill" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
            {categoryStats.inactiveCount}
          </div>
          <span className="text-[10px] text-rose-300/80">Disembunyikan dari produk baru</span>
        </div>

        {/* Total Produk Terkait */}
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/40 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-1">
            <span>Total Produk Katalog</span>
            <Package size={18} className="text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-300">
            {categoryStats.totalProducts}
          </div>
          <span className="text-[10px] text-emerald-400/80">Item produk terdaftar</span>
        </div>
      </div>

      {/* Action Toolbar above Category Table */}
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
            placeholder="Cari kategori, spesifikasi, atau ID..."
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

        {/* Add Category Button above Table */}
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 text-emerald-950 font-bold text-xs sm:text-sm shadow-lg shadow-lime-950/40 hover:from-lime-300 hover:to-lime-400 transition cursor-pointer active:scale-95 shrink-0"
        >
          <Plus size={18} weight="bold" />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {/* Main Categories Table */}
      <div className="bg-emerald-950/80 border border-emerald-700/40 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Spinner size={32} className="animate-spin text-lime-400 mb-3" />
            <p className="text-sm font-semibold text-emerald-200">Memuat data kategori...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center text-emerald-400 mb-3">
              <Tag size={30} />
            </div>
            <h3 className="text-base font-bold text-white">Tidak ada kategori ditemukan</h3>
            <p className="text-xs text-emerald-300/80 max-w-sm mt-1">
              {searchQuery
                ? `Tidak ada kategori yang cocok dengan pencarian "${searchQuery}".`
                : 'Belum ada data kategori tersimpan di basis data.'}
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-400 text-emerald-950 font-bold text-xs hover:bg-lime-300 transition"
            >
              <Plus size={16} weight="bold" />
              <span>Tambah Kategori Baru</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-emerald-800/80 bg-emerald-900/40 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  <th className="py-3 px-4 w-16 text-center">ID</th>
                  <th className="py-3 px-4 min-w-[150px]">Nama Kategori</th>
                  <th className="py-3 px-4 w-32 text-center">Status</th>
                  <th className="py-3 px-4 min-w-[180px]">Spesifikasi Material</th>
                  <th className="py-3 px-4 min-w-[220px]">Deskripsi</th>
                  <th className="py-3 px-4 w-28 text-center">Produk Terkait</th>
                  <th className="py-3 px-4 w-28 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/60 text-xs">
                {filteredCategories.map((cat) => {
                  const badgeClass = getCategoryBadgeStyle(cat.category);
                  const count = getCountForCat(cat);
                  const isCatActive = cat.is_active !== false;
                  const isToggling = togglingId === cat.id;

                  return (
                    <tr
                      key={cat.id}
                      className={`hover:bg-emerald-900/30 transition-colors ${
                        !isCatActive ? 'opacity-70 bg-emerald-950/40' : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-emerald-400 font-semibold">
                        #{cat.id}
                      </td>

                      {/* Nama Kategori */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${badgeClass}`}>
                            {cat.category}
                          </span>
                        </div>
                      </td>

                      {/* Status Aktif / Non-Aktif (1-Click Toggle) */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(cat)}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isCatActive
                              ? 'bg-lime-400/20 border border-lime-400/50 text-lime-300 hover:bg-lime-400/30'
                              : 'bg-rose-950/60 border border-rose-700/50 text-rose-300 hover:bg-rose-900/60'
                          } ${isToggling ? 'opacity-50 cursor-wait' : ''}`}
                          title={isCatActive ? 'Klik untuk nonaktifkan kategori' : 'Klik untuk aktifkan kategori'}
                        >
                          {isToggling ? (
                            <Spinner size={14} className="animate-spin" />
                          ) : isCatActive ? (
                            <CheckCircle size={14} weight="fill" className="text-lime-400" />
                          ) : (
                            <XCircle size={14} weight="fill" className="text-rose-400" />
                          )}
                          <span>{isCatActive ? 'Aktif' : 'Non-Aktif'}</span>
                        </button>
                      </td>

                      {/* Spesifikasi */}
                      <td className="py-3 px-4 text-emerald-200">
                        {cat.spec ? (
                          <span className="font-medium text-emerald-100">{cat.spec}</span>
                        ) : (
                          <span className="text-emerald-500/60 italic">- Belum diatur -</span>
                        )}
                      </td>

                      {/* Deskripsi */}
                      <td className="py-3 px-4 text-emerald-300/90 max-w-xs">
                        {cat.desc ? (
                          <p className="line-clamp-2 leading-relaxed">{cat.desc}</p>
                        ) : (
                          <span className="text-emerald-500/60 italic">- Belum ada deskripsi -</span>
                        )}
                      </td>

                      {/* Produk Terkait */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                            count > 0
                              ? 'bg-emerald-900/80 text-lime-400 border border-emerald-700/60'
                              : 'bg-emerald-900/30 text-emerald-400/60'
                          }`}
                        >
                          <Package size={12} />
                          {count} item
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(cat)}
                            className="p-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 hover:text-white hover:bg-emerald-800 transition cursor-pointer"
                            title="Edit Kategori"
                          >
                            <PencilSimple size={15} />
                          </button>

                          {/* Delete / Deactivate Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(cat)}
                            className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-700/40 text-rose-300 hover:text-white hover:bg-rose-900/80 transition cursor-pointer"
                            title="Nonaktifkan Kategori"
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
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        categoryToEdit={categoryToEdit}
        onSuccess={onRefresh}
      />

      <CategoryDeleteModal
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        category={categoryToDelete}
        productsCount={categoryToDelete ? getCountForCat(categoryToDelete) : 0}
        onSuccess={onRefresh}
      />
    </div>
  );
}
