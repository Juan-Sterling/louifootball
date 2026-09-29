'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  PencilSimple,
  Trash,
  CheckCircle,
  XCircle,
  MagnifyingGlass,
  ArrowClockwise,
  Package,
  Check,
  X,
  Funnel,
  Spinner,
  CaretLeft,
  CaretRight,
  ArrowsClockwise,
  WarningCircle,
  Eye,
} from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { formatRupiah, getCategoryBadgeStyle, normalizeCategory } from '@/lib/utils';
import ProductFormModal from '@/components/admin/ProductFormModal';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { useToast } from '@/components/admin/Toast';

export default function AdminDashboardPage() {
  const { showToast } = useToast();

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all'); // 'all', 'normal', 'sold_out'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);

  // Quick Sold Out Toggle in-flight tracker
  const [togglingId, setTogglingId] = useState(null);

  // Load products and categories from Supabase
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      // 1. Fetch categories
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('id', { ascending: true });

      if (catError) console.warn('Categories query error:', catError);
      if (catData) setCategories(catData);

      // 2. Fetch products with joined categories
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*, categories(*)')
        .order('id', { ascending: false });

      if (prodError) throw prodError;

      setProducts(prodData || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      showToast(`Gagal memuat data dari Supabase: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  // Initial fetch
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return products.filter((item) => {
      // Search matching title, player_name, or team
      if (query) {
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const playerMatch = (item.player_name || '').toLowerCase().includes(query);
        const teamMatch = (item.team || '').toLowerCase().includes(query);
        const idMatch = String(item.id).includes(query);
        if (!titleMatch && !playerMatch && !teamMatch && !idMatch) {
          return false;
        }
      }

      // Category filter
      if (selectedCategoryFilter !== 'all') {
        if (String(item.category_id) !== String(selectedCategoryFilter)) {
          return false;
        }
      }

      // Status filter (Normal vs SOLD OUT)
      const isSoldOut = String(item.sold_out || '').trim().toUpperCase() === 'Y';
      if (selectedStatusFilter === 'sold_out' && !isSoldOut) return false;
      if (selectedStatusFilter === 'normal' && isSoldOut) return false;

      return true;
    });
  }, [products, searchQuery, selectedCategoryFilter, selectedStatusFilter]);

  // Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryFilter, selectedStatusFilter, pageSize]);

  // Quick Action: Toggle Sold Out Status
  const handleToggleSoldOut = async (product) => {
    if (togglingId === product.id) return;
    setTogglingId(product.id);

    const isCurrentlySoldOut = String(product.sold_out || '').trim().toUpperCase() === 'Y';
    // If currently SOLD OUT ('Y'), toggle to NULL (Normal). Otherwise, toggle to 'Y' (SOLD OUT).
    const newSoldOutVal = isCurrentlySoldOut ? null : 'Y';
    const statusText = newSoldOutVal === 'Y' ? 'SOLD OUT' : 'NORMAL / TERSEDIA';

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, sold_out: newSoldOutVal } : p))
    );

    try {
      const { error } = await supabase
        .from('products')
        .update({ sold_out: newSoldOutVal })
        .eq('id', product.id);

      if (error) {
        // Rollback optimistic update
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, sold_out: product.sold_out } : p))
        );
        throw error;
      }

      showToast(`Status "${product.title || product.player_name}" diubah ke ${statusText}`, 'success', 2500);
    } catch (err) {
      console.error('Failed to toggle sold out:', err);
      showToast(`Gagal mengubah status: ${err.message || 'Error'}`, 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = products.length;
    const soldOutCount = products.filter((p) => String(p.sold_out || '').trim().toUpperCase() === 'Y').length;
    const normalCount = total - soldOutCount;
    const totalCats = categories.length;
    return { total, soldOutCount, normalCount, totalCats };
  }, [products, categories]);

  // Open Add Product Modal
  const handleOpenAddModal = () => {
    setProductToEdit(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditModal = (product) => {
    setProductToEdit(product);
    setIsFormModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-loui text-white tracking-wider uppercase flex items-center gap-2">
            <span>Katalog & Stok Produk</span>
            <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-lime-400 text-emerald-950">
              {stats.total} Produk
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-300/80 mt-1">
            Kelola data produk, toggle status SOLD OUT, tambah varian poster, dan unggah gambar via Cloudinary.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-xs font-semibold hover:bg-emerald-800 hover:text-white transition cursor-pointer disabled:opacity-50"
            title="Muat ulang data dari Supabase"
          >
            <ArrowClockwise size={16} className={isRefreshing ? 'animate-spin text-lime-400' : ''} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          {/* Add Product Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 text-emerald-950 font-bold text-xs sm:text-sm shadow-lg shadow-lime-950/40 hover:from-lime-300 hover:to-lime-400 transition cursor-pointer active:scale-95"
          >
            <Plus size={18} weight="bold" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Produk */}
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/40 backdrop-blur-sm">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-1">
            <span>Total Produk</span>
            <Package size={18} className="text-lime-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {stats.total}
          </div>
          <span className="text-[10px] text-emerald-400/80">Seluruh item katalog</span>
        </div>

        {/* Produk Normal / Tersedia */}
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/40 backdrop-blur-sm">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-1">
            <span>Tersedia (Normal)</span>
            <CheckCircle size={18} className="text-lime-400" weight="fill" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-lime-400">
            {stats.normalCount}
          </div>
          <span className="text-[10px] text-emerald-400/80">Siap dipesan pembeli</span>
        </div>

        {/* Produk SOLD OUT */}
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/40 backdrop-blur-sm">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold mb-1">
            <span>SOLD OUT</span>
            <XCircle size={18} className="text-rose-400" weight="fill" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
            {stats.soldOutCount}
          </div>
          <span className="text-[10px] text-rose-300/80">Stok habis di toko</span>
        </div>

        {/* Total Kategori */}
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/40 backdrop-blur-sm">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-1">
            <span>Kategori</span>
            <Funnel size={18} className="text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-300">
            {stats.totalCats}
          </div>
          <span className="text-[10px] text-emerald-400/80">Stickers, Posters, dll</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/40 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
              <MagnifyingGlass size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan judul produk, nama pemain, tim, atau ID..."
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-500/60 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Kategori */}
          <div className="w-full md:w-56 shrink-0">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white focus:outline-none focus:border-lime-400 cursor-pointer"
            >
              <option value="all">Semua Kategori ({stats.totalCats})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.category?.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status (Normal vs SOLD OUT) */}
          <div className="w-full md:w-48 shrink-0">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white focus:outline-none focus:border-lime-400 cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="normal">Normal / Tersedia ({stats.normalCount})</option>
              <option value="sold_out">SOLD OUT ({stats.soldOutCount})</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(searchQuery || selectedCategoryFilter !== 'all' || selectedStatusFilter !== 'all') && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-800/40 text-xs text-emerald-300">
            <span>Filter Aktif:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-900 border border-emerald-700 text-[11px]">
                Pencarian: &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery('')} className="hover:text-white">
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedCategoryFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-900 border border-emerald-700 text-[11px]">
                Kategori: {categories.find((c) => String(c.id) === String(selectedCategoryFilter))?.category?.toUpperCase()}
                <button onClick={() => setSelectedCategoryFilter('all')} className="hover:text-white">
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedStatusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-900 border border-emerald-700 text-[11px]">
                Status: {selectedStatusFilter === 'sold_out' ? 'SOLD OUT' : 'Tersedia'}
                <button onClick={() => setSelectedStatusFilter('all')} className="hover:text-white">
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryFilter('all');
                setSelectedStatusFilter('all');
              }}
              className="text-lime-400 hover:underline text-[11px] ml-auto cursor-pointer"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* Main Products Table */}
      <div className="bg-emerald-950/80 border border-emerald-700/40 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Spinner size={32} className="animate-spin text-lime-400 mb-3" />
            <p className="text-sm font-semibold text-emerald-200">Memuat data produk dari Supabase...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center text-emerald-400 mb-3">
              <Package size={30} />
            </div>
            <h3 className="text-base font-bold text-white">Tidak ada produk ditemukan</h3>
            <p className="text-xs text-emerald-300/80 max-w-sm mt-1">
              Tidak ada produk yang cocok dengan kriteria pencarian atau filter yang Anda pilih.
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-400 text-emerald-950 font-bold text-xs hover:bg-lime-300 transition"
            >
              <Plus size={16} weight="bold" />
              <span>Tambah Produk Baru</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-emerald-800/80 bg-emerald-900/40 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  <th className="py-3 px-4 w-14 text-center">Gambar</th>
                  <th className="py-3 px-4 min-w-[200px]">Judul Produk</th>
                  <th className="py-3 px-4 min-w-[120px]">Kategori</th>
                  <th className="py-3 px-4 min-w-[130px]">Harga</th>
                  <th className="py-3 px-4 min-w-[170px]">Status Keterangan</th>
                  <th className="py-3 px-4 min-w-[140px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/60 text-xs">
                {paginatedProducts.map((product) => {
                  const isSoldOut = String(product.sold_out || '').trim().toUpperCase() === 'Y';
                  const isTogglingThis = togglingId === product.id;
                  const catName = product.categories?.category || product.category || 'stiker';
                  const catBadgeClass = getCategoryBadgeStyle(catName);

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-emerald-900/30 transition-colors ${
                        isSoldOut ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* 1. Thumbnail Image */}
                      <td className="py-3 px-4 text-center">
                        <div
                          onClick={() => product.img && setZoomImage(product.img)}
                          className="w-11 h-11 mx-auto rounded-lg bg-emerald-900/60 border border-emerald-700/60 overflow-hidden flex items-center justify-center cursor-pointer group relative shadow-sm"
                          title="Klik untuk memperbesar gambar"
                        >
                          {product.img ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={product.img}
                                alt={product.title}
                                className="w-full h-full object-contain p-0.5 group-hover:scale-110 transition duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                                <Eye size={14} />
                              </div>
                            </>
                          ) : (
                            <span className="text-[9px] text-emerald-500">No img</span>
                          )}
                        </div>
                      </td>

                      {/* 2. Judul Produk, Player Name, Team */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs sm:text-sm uppercase tracking-wide">
                          {product.title || product.player_name}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-emerald-300/80">
                          {product.player_name && product.player_name !== product.title && (
                            <span>{product.player_name} •</span>
                          )}
                          {product.team && (
                            <span className="text-emerald-400 font-medium">{product.team}</span>
                          )}
                          {product.edition && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-900 text-lime-300 font-mono text-[10px]">
                              Ed. {product.edition}
                            </span>
                          )}
                          {product.year && (
                            <span className="text-emerald-400/80 text-[10px]">{product.year}</span>
                          )}
                        </div>
                      </td>

                      {/* 3. Kategori */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block font-loui tracking-wider uppercase px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${catBadgeClass}`}
                        >
                          {catName}
                        </span>
                      </td>

                      {/* 4. Harga & Varian */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-lime-400 text-xs sm:text-sm">
                          {formatRupiah(product.price)}
                        </div>
                        {product.variants && Array.isArray(product.variants) && product.variants.length > 0 && (
                          <div className="text-[10px] text-purple-300 mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
                            {product.variants.length} Varian Ukuran
                          </div>
                        )}
                      </td>

                      {/* 5. Status Keterangan (Normal vs SOLD OUT) & Quick Toggle */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm ${
                              isSoldOut
                                ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                                : 'bg-emerald-900 text-lime-300 border border-lime-400/40'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isSoldOut ? 'bg-rose-400 animate-pulse' : 'bg-lime-400'
                              }`}
                            />
                            {isSoldOut ? 'SOLD OUT' : 'NORMAL'}
                          </span>

                          {/* Tombol Cepat "Toggle Sold Out" */}
                          <button
                            type="button"
                            onClick={() => handleToggleSoldOut(product)}
                            disabled={isTogglingThis}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border active:scale-95 disabled:opacity-50 ${
                              isSoldOut
                                ? 'bg-emerald-800 hover:bg-emerald-700 text-lime-200 border-emerald-600'
                                : 'bg-rose-900/80 hover:bg-rose-800 text-rose-100 border-rose-700'
                            }`}
                            title={
                              isSoldOut
                                ? 'Klik satu kali untuk ubah status ke NORMAL (Tersedia)'
                                : 'Klik satu kali untuk ubah status ke SOLD OUT'
                            }
                          >
                            {isTogglingThis ? (
                              <Spinner size={12} className="animate-spin text-white" />
                            ) : isSoldOut ? (
                              <>
                                <Check size={12} weight="bold" />
                                <span>Set Normal</span>
                              </>
                            ) : (
                              <>
                                <X size={12} weight="bold" />
                                <span>Set Sold Out</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 6. Kolom Aksi (Edit & Hapus) */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(product)}
                            className="p-2 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 hover:text-white border border-emerald-700/50 transition cursor-pointer"
                            title="Edit Data Produk"
                          >
                            <PencilSimple size={15} />
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/40 transition cursor-pointer"
                            title="Hapus Produk dari Supabase"
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

        {/* Table Footer with Pagination */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="px-4 py-3 border-t border-emerald-800/60 bg-emerald-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-300">
            <div className="flex items-center gap-3">
              <span>
                Menampilkan <strong>{(currentPage - 1) * pageSize + 1}</strong> -{' '}
                <strong>{Math.min(currentPage * pageSize, totalItems)}</strong> dari{' '}
                <strong>{totalItems}</strong> produk
              </span>
              <div className="hidden sm:flex items-center gap-1.5 border-l border-emerald-800 pl-3">
                <span>Baris:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700 text-white text-xs cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Pagination buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 disabled:opacity-40 disabled:hover:bg-emerald-900/80 transition cursor-pointer"
                title="Halaman Sebelumnya"
              >
                <CaretLeft size={16} />
              </button>

              <span className="px-3 py-1 rounded-lg bg-emerald-950 font-mono font-bold text-white text-xs">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 disabled:opacity-40 disabled:hover:bg-emerald-900/80 transition cursor-pointer"
                title="Halaman Berikutnya"
              >
                <CaretRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Produk */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        productToEdit={productToEdit}
        categories={categories}
        onSuccess={() => loadData(true)}
      />

      {/* Modal Hapus Produk */}
      <DeleteConfirmModal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        product={productToDelete}
        onSuccess={(deletedId) => {
          setProducts((prev) => prev.filter((p) => p.id !== deletedId));
        }}
      />

      {/* Quick Image Zoom Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer animate-in fade-in duration-200"
        >
          <div className="relative max-w-lg max-h-[85vh] bg-emerald-950 p-2 rounded-2xl border border-lime-400/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomImage}
              alt="Zoomed product"
              className="max-w-full max-h-[80vh] object-contain rounded-xl mx-auto"
            />
            <p className="text-center text-xs text-emerald-300 mt-2">Klik di mana saja untuk menutup</p>
          </div>
        </div>
      )}
    </div>
  );
}
