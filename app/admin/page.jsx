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
  EyeSlash,
  Sliders,
  Faders,
  CaretDown,
  Tag,
  Megaphone,
  VideoCamera,
} from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { formatRupiah, parseVariants, getCategoryBadgeStyle, normalizeCategory, sortCatalogProducts, optimizeCloudinaryUrl } from '@/lib/utils';
import ProductFormModal from '@/components/admin/ProductFormModal';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import CategoryManager from '@/components/admin/CategoryManager';
import PromotionManager from '@/components/admin/PromotionManager';
import BulkEditModal from '@/components/admin/BulkEditModal';
import VideoPreviewModal from '@/components/admin/VideoPreviewModal';
import { useToast } from '@/components/admin/Toast';

export default function AdminDashboardPage() {
  const { showToast } = useToast();

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [activeTab, setActiveTab] = useState('produk'); // 'produk', 'kategori', 'iklan'
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync tab with URL search parameter if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['produk', 'kategori', 'iklan'].includes(tabParam.toLowerCase())) {
        setActiveTab(tabParam.toLowerCase());
      }
    }
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url);
    }
  };

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all'); // 'all', 'normal', 'sold_out'
  const [selectedActiveFilter, setSelectedActiveFilter] = useState('active'); // 'active' (default: sembunyikan yang non-aktif), 'inactive', 'all'
  const [sortBy, setSortBy] = useState('catalog_default'); // 'catalog_default', 'id_desc', 'id_asc', 'name_asc', 'name_desc', 'price_desc', 'price_asc'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Bulk selection states
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkDeactivating, setIsBulkDeactivating] = useState(false);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const [previewVideoProduct, setPreviewVideoProduct] = useState(null);

  // Quick Sold Out & Active Toggle in-flight tracker
  const [togglingId, setTogglingId] = useState(null);
  const [togglingActiveId, setTogglingActiveId] = useState(null);
  const [expandedVariantId, setExpandedVariantId] = useState(null);

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
        .select('*, categories(*)');

      if (prodError) throw prodError;

      // 3. Fetch promotions for hero carousel
      const { data: promoData, error: promoError } = await supabase
        .from('promotions')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (promoError) console.warn('Promotions query error:', promoError);
      if (promoData) setPromotions(promoData.map((p) => ({ ...p, img: optimizeCloudinaryUrl(p.img) })));

      // Map products to clean structure matching main page (app/page.jsx)
      const mapped = (prodData || []).map((item) => {
        const catObj = item.categories || {};
        const playerName = item.player_name ? String(item.player_name).trim() : '';
        const productTitle = item.title ? String(item.title).trim() : '';
        const resolvedPlayerName = playerName || productTitle || 'Produk Loui';
        const soldOutVal = item.sold_out ? String(item.sold_out).trim() : '';
        const rawYear = item.year ? String(item.year).trim() : '';
        const isYearValid = rawYear && rawYear.toLowerCase() !== 'null' && rawYear.toLowerCase() !== 'undefined' && rawYear !== '-';
        const cleanYear = isYearValid ? rawYear : '';

        const rawTeam = item.team ? String(item.team).trim() : '';
        const isTeamValid = rawTeam && rawTeam.toLowerCase() !== 'null' && rawTeam.toLowerCase() !== 'undefined' && rawTeam !== '-';
        const cleanTeam = isTeamValid ? rawTeam : '';

        return {
          ...item,
          player_name: resolvedPlayerName,
          title: productTitle || resolvedPlayerName,
          sold_out: soldOutVal,
          is_sold_out: soldOutVal.toUpperCase() === 'Y',
          img: optimizeCloudinaryUrl(item.img),
          img_add: item.img_add ? optimizeCloudinaryUrl(item.img_add) : item.img_add,
          category: normalizeCategory(catObj.category || item.category || 'lainnya'),
          team: cleanTeam,
          year: cleanYear,
          spec: catObj.spec || item.spec || 'Koleksi Resmi',
          desc: catObj.desc || item.desc || '',
          qr_video: item.qr_video || '',
        };
      });

      setProducts(mapped);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      showToast(`Gagal memuat data: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  // Initial fetch
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered & Sorted products list (pencarian & sorting disamakan dengan halaman utama)
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    // 1. Filter data
    const filtered = products.filter((item) => {
      // Pencarian teks (disamakan persis dengan halaman utama + pencarian ID)
      if (query) {
        const name = (item.player_name || item.title || '').toLowerCase();
        const rawTitle = (item.title || '').toLowerCase();
        const titleMatch = name.includes(query) || rawTitle.includes(query);

        const edRaw = item.edition ? String(item.edition).trim() : '';
        const edLower = edRaw.toLowerCase();
        const isSpecialEd = edLower === 'special' || edLower === 'spesial';
        const editionMatch = edRaw
          ? (
              edLower === query ||
              edLower.includes(query) ||
              `edisi ${edLower}`.includes(query) ||
              `#${edLower}`.includes(query) ||
              (isSpecialEd && (query.includes('special') || query.includes('spesial')))
            )
          : false;

        const teamMatch = item.team ? item.team.toLowerCase().includes(query) : false;
        const yearMatch = item.year ? String(item.year).toLowerCase().includes(query) : false;
        const descMatch =
          (item.desc || '').toLowerCase().includes(query) ||
          (item.spec || '').toLowerCase().includes(query);
        const catMatch = (item.category || item.categories?.category || '').toLowerCase().includes(query);
        const idMatch = String(item.id).includes(query);

        if (!titleMatch && !editionMatch && !teamMatch && !yearMatch && !descMatch && !catMatch && !idMatch) {
          return false;
        }
      }

      // Filter Kategori
      if (selectedCategoryFilter !== 'all') {
        if (String(item.category_id) !== String(selectedCategoryFilter)) {
          return false;
        }
      }

      // Filter Status (Normal vs SOLD OUT)
      const isSoldOut = String(item.sold_out || '').trim().toUpperCase() === 'Y';
      if (selectedStatusFilter === 'sold_out' && !isSoldOut) return false;
      if (selectedStatusFilter === 'normal' && isSoldOut) return false;

      // Filter Status Publikasi (Aktif vs Non-Aktif)
      const isProductActive = item.is_active !== false;
      if (selectedActiveFilter === 'active' && !isProductActive) return false;
      if (selectedActiveFilter === 'inactive' && isProductActive) return false;

      return true;
    });

    // 2. Sorting
    if (sortBy === 'id_desc') {
      return [...filtered].sort((a, b) => (b.id || 0) - (a.id || 0));
    }
    if (sortBy === 'id_asc') {
      return [...filtered].sort((a, b) => (a.id || 0) - (b.id || 0));
    }
    if (sortBy === 'name_asc') {
      return [...filtered].sort((a, b) =>
        (a.player_name || a.title || '').localeCompare(b.player_name || b.title || '')
      );
    }
    if (sortBy === 'name_desc') {
      return [...filtered].sort((a, b) =>
        (b.player_name || b.title || '').localeCompare(a.player_name || a.title || '')
      );
    }
    if (sortBy === 'price_desc') {
      return [...filtered].sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    if (sortBy === 'price_asc') {
      return [...filtered].sort((a, b) => (a.price || 0) - (b.price || 0));
    }

    // Default Sorting: Sesuai Urutan Halaman Utama (sortCatalogProducts)
    let activeCatName = 'all';
    if (selectedCategoryFilter !== 'all') {
      const chosen = categories.find((c) => String(c.id) === String(selectedCategoryFilter));
      if (chosen?.category) {
        activeCatName = normalizeCategory(chosen.category);
      }
    }
    return sortCatalogProducts(filtered, activeCatName);
  }, [products, searchQuery, selectedCategoryFilter, selectedStatusFilter, selectedActiveFilter, sortBy, categories]);

  // Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Selection helpers for bulk edit
  const paginatedProductIds = useMemo(
    () => paginatedProducts.map((p) => p.id),
    [paginatedProducts]
  );
  const isAllPaginatedSelected =
    paginatedProductIds.length > 0 &&
    paginatedProductIds.every((id) => selectedProductIds.includes(id));

  const handleToggleSelectAll = () => {
    if (isAllPaginatedSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !paginatedProductIds.includes(id)));
    } else {
      setSelectedProductIds((prev) => {
        const next = new Set([...prev, ...paginatedProductIds]);
        return Array.from(next);
      });
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryFilter, selectedStatusFilter, selectedActiveFilter, sortBy, pageSize]);

  // Quick Action: Toggle Sold Out Status
  const handleToggleSoldOut = async (product) => {
    if (togglingId === product.id) return;
    setTogglingId(product.id);

    const isCurrentlySoldOut = String(product.sold_out || '').trim().toUpperCase() === 'Y';
    const newSoldOutVal = isCurrentlySoldOut ? null : 'Y';
    const statusText = newSoldOutVal === 'Y' ? 'SOLD OUT' : 'TERSEDIA';

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? {
              ...p,
              sold_out: newSoldOutVal,
              is_sold_out: newSoldOutVal === 'Y',
            }
          : p
      )
    );

    try {
      const { error } = await supabase
        .from('products')
        .update({ sold_out: newSoldOutVal })
        .eq('id', product.id);

      if (error) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id
              ? {
                  ...p,
                  sold_out: product.sold_out,
                  is_sold_out: String(product.sold_out || '').trim().toUpperCase() === 'Y',
                }
              : p
          )
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

  // Quick Action: Toggle Active / Inactive Status (agar product bisa dinonaktifkan dari admin)
  const handleToggleActiveProduct = async (product) => {
    if (togglingActiveId === product.id) return;
    setTogglingActiveId(product.id);

    const currentlyActive = product.is_active !== false;
    const newActiveVal = !currentlyActive;

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_active: newActiveVal } : p))
    );

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: newActiveVal })
        .eq('id', product.id);

      if (error) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, is_active: currentlyActive } : p))
        );
        throw error;
      }

      showToast(
        newActiveVal
          ? `Produk "${product.title || product.player_name}" berhasil diaktifkan kembali.`
          : `Produk "${product.title || product.player_name}" dinonaktifkan dan disembunyikan dari daftar admin.`,
        'success',
        3000
      );
    } catch (err) {
      console.error('Failed to toggle active product:', err);
      showToast(`Gagal mengubah status aktif produk: ${err.message || 'Error'}`, 'error');
    } finally {
      setTogglingActiveId(null);
    }
  };

  // Quick Action: Bulk Activate / Deactivate Selected Products (Show / Hide)
  const handleBulkToggleActive = async (targetActive) => {
    if (selectedProductIds.length === 0 || isBulkDeactivating) return;
    setIsBulkDeactivating(true);

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: targetActive })
        .in('id', selectedProductIds);

      if (error) throw error;

      const actionText = targetActive ? 'diaktifkan & ditampilkan' : 'dinonaktifkan & disembunyikan';
      showToast(
        `${selectedProductIds.length} produk berhasil ${actionText}.`,
        'success',
        3500
      );
      setSelectedProductIds([]);
      loadData(true);
    } catch (err) {
      console.error('Bulk toggle active error:', err);
      showToast(`Gagal mengubah status produk terpilih: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsBulkDeactivating(false);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = products.length;
    const activeCount = products.filter((p) => p.is_active !== false).length;
    const inactiveCount = total - activeCount;
    const soldOutCount = products.filter((p) => String(p.sold_out || '').trim().toUpperCase() === 'Y').length;
    const normalCount = total - soldOutCount;
    const totalCats = categories.length;
    return { total, activeCount, inactiveCount, soldOutCount, normalCount, totalCats };
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
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-loui text-white tracking-wider uppercase flex items-center gap-2">
            {activeTab === 'produk' && (
              <>
                <span>Katalog & Stok Produk</span>
                <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-lime-400 text-emerald-950">
                  {stats.total} Produk
                </span>
              </>
            )}
            {activeTab === 'kategori' && (
              <>
                <span>Manajemen Kategori</span>
                <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-lime-400 text-emerald-950">
                  {categories.length} Kategori
                </span>
              </>
            )}
            {activeTab === 'iklan' && (
              <>
                <span>Manajemen Promosi & Iklan</span>
                <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-lime-400 text-emerald-950">
                  {promotions.length} Banner
                </span>
              </>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-300/80 mt-1">
            {activeTab === 'produk' && 'Kelola data produk, toggle status SOLD OUT, tambah varian poster, dan unggah gambar.'}
            {activeTab === 'kategori' && 'Kelola daftar kategori produk, spesifikasi bahan material, dan deskripsi kategori katalog.'}
            {activeTab === 'iklan' && 'Kelola banner promosi carousel di beranda, urutan tayang, badge warna, dan tautan aksi.'}
          </p>
        </div>
      </div>

      {/* Navbar di atas KPI Stats Cards (PRODUK, KATEGORI, IKLAN) */}
      <nav className="p-1.5 sm:p-2 rounded-2xl bg-emerald-950/90 border border-emerald-700/50 shadow-xl backdrop-blur-md flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Tab PRODUK */}
          <button
            type="button"
            onClick={() => handleTabChange('produk')}
            className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'produk'
                ? 'bg-gradient-to-r from-lime-400 to-lime-500 text-emerald-950 shadow-lg shadow-lime-950/40 scale-[1.02]'
                : 'text-emerald-300 hover:text-white hover:bg-emerald-900/60 font-semibold'
            }`}
          >
            <Package size={18} weight={activeTab === 'produk' ? 'bold' : 'regular'} />
            <span>PRODUK</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'produk' ? 'bg-emerald-950 text-lime-400' : 'bg-emerald-900 text-emerald-300'
              }`}
            >
              {products.length}
            </span>
          </button>

          {/* Tab KATEGORI */}
          <button
            type="button"
            onClick={() => handleTabChange('kategori')}
            className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'kategori'
                ? 'bg-gradient-to-r from-lime-400 to-lime-500 text-emerald-950 shadow-lg shadow-lime-950/40 scale-[1.02]'
                : 'text-emerald-300 hover:text-white hover:bg-emerald-900/60 font-semibold'
            }`}
          >
            <Tag size={18} weight={activeTab === 'kategori' ? 'bold' : 'regular'} />
            <span>KATEGORI</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'kategori' ? 'bg-emerald-950 text-lime-400' : 'bg-emerald-900 text-emerald-300'
              }`}
            >
              {categories.length}
            </span>
          </button>

          {/* Tab IKLAN */}
          <button
            type="button"
            onClick={() => handleTabChange('iklan')}
            className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'iklan'
                ? 'bg-gradient-to-r from-lime-400 to-lime-500 text-emerald-950 shadow-lg shadow-lime-950/40 scale-[1.02]'
                : 'text-emerald-300 hover:text-white hover:bg-emerald-900/60 font-semibold'
            }`}
          >
            <Megaphone size={18} weight={activeTab === 'iklan' ? 'bold' : 'regular'} />
            <span>IKLAN</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'iklan' ? 'bg-emerald-950 text-lime-400' : 'bg-emerald-900 text-emerald-300'
              }`}
            >
              {promotions.length}
            </span>
          </button>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-xs font-semibold hover:bg-emerald-800 hover:text-white transition cursor-pointer disabled:opacity-50 shrink-0"
          title="Segarkan data aktif"
        >
          <ArrowClockwise size={16} className={isRefreshing ? 'animate-spin text-lime-400' : ''} />
          <span className="hidden sm:inline">Segarkan Data</span>
        </button>
      </nav>

      {/* ===================== VIEW PRODUK ===================== */}
      {activeTab === 'produk' && (
        <div className="space-y-6">
          {/* KPI Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            {/* Produk Aktif */}
            <div
              onClick={() => setSelectedActiveFilter((prev) => (prev === 'active' ? 'all' : 'active'))}
              className={`p-3.5 sm:p-4 rounded-2xl border backdrop-blur-sm transition-all duration-200 cursor-pointer select-none hover:scale-[1.02] active:scale-[0.99] ${
                selectedActiveFilter === 'active'
                  ? 'bg-emerald-900/90 border-lime-400 shadow-md shadow-lime-950/30 ring-1 ring-lime-400/50'
                  : 'bg-emerald-950/80 border-emerald-700/40 hover:border-emerald-500'
              }`}
              title="Klik untuk filter hanya produk aktif (klik lagi untuk menampilkan semua)"
            >
              <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-1">
                <span>Produk Aktif</span>
                <CheckCircle size={18} className="text-lime-400" weight="fill" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-lime-400">
                {stats.activeCount}
              </div>
              <span className="text-[10px] text-emerald-300/80">Tampil di katalog</span>
            </div>

            {/* Produk Non-Aktif */}
            <div
              onClick={() => setSelectedActiveFilter((prev) => (prev === 'inactive' ? 'all' : 'inactive'))}
              className={`p-3.5 sm:p-4 rounded-2xl border backdrop-blur-sm transition-all duration-200 cursor-pointer select-none hover:scale-[1.02] active:scale-[0.99] ${
                selectedActiveFilter === 'inactive'
                  ? 'bg-amber-950/90 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                  : 'bg-emerald-950/80 border-emerald-700/40 hover:border-amber-600/50'
              }`}
              title="Klik untuk melihat produk yang dinonaktifkan (klik lagi untuk kembali)"
            >
              <div className="flex items-center justify-between text-amber-400 text-xs font-semibold mb-1">
                <span>Non-Aktif</span>
                <EyeSlash size={18} className="text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300">
                {stats.inactiveCount}
              </div>
              <span className="text-[10px] text-amber-400/80">Disembunyikan</span>
            </div>

            {/* Produk Tersedia */}
            <div
              onClick={() => setSelectedStatusFilter((prev) => (prev === 'normal' ? 'all' : 'normal'))}
              className={`p-3.5 sm:p-4 rounded-2xl border backdrop-blur-sm transition-all duration-200 cursor-pointer select-none hover:scale-[1.02] active:scale-[0.99] ${
                selectedStatusFilter === 'normal'
                  ? 'bg-emerald-900/90 border-lime-400 shadow-md shadow-lime-950/30 ring-1 ring-lime-400/50'
                  : 'bg-emerald-950/80 border-emerald-700/40 hover:border-emerald-500 hover:bg-emerald-900/40'
              }`}
              title="Klik untuk memfilter produk yang TERSEDIA (klik lagi untuk reset)"
            >
              <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-1">
                <span>Tersedia</span>
                <Package size={18} className={selectedStatusFilter === 'normal' ? 'text-lime-300' : 'text-emerald-300'} />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                {stats.normalCount}
              </div>
              <span className="text-[10px] text-emerald-400/80">
                {selectedStatusFilter === 'normal' ? '✓ Filter aktif' : 'Siap dipesan'}
              </span>
            </div>

            {/* Produk SOLD OUT */}
            <div
              onClick={() => setSelectedStatusFilter((prev) => (prev === 'sold_out' ? 'all' : 'sold_out'))}
              className={`p-3.5 sm:p-4 rounded-2xl border backdrop-blur-sm transition-all duration-200 cursor-pointer select-none hover:scale-[1.02] active:scale-[0.99] ${
                selectedStatusFilter === 'sold_out'
                  ? 'bg-rose-950/90 border-rose-500 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/50'
                  : 'bg-emerald-950/80 border-emerald-700/40 hover:border-rose-500/60 hover:bg-rose-950/30'
              }`}
              title="Klik untuk memfilter produk yang SOLD OUT (klik lagi untuk reset)"
            >
              <div className="flex items-center justify-between text-rose-400 text-xs font-semibold mb-1">
                <span>SOLD OUT</span>
                <XCircle size={18} className="text-rose-400" weight="fill" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
                {stats.soldOutCount}
              </div>
              <span className="text-[10px] text-rose-300/80">
                {selectedStatusFilter === 'sold_out' ? '✓ Filter aktif' : 'Stok habis'}
              </span>
            </div>

            {/* Total Kategori */}
            <div
              onClick={() => handleTabChange('kategori')}
              className="p-3.5 sm:p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/40 hover:border-cyan-400/80 hover:bg-emerald-900/50 backdrop-blur-sm col-span-2 sm:col-span-1 transition-all duration-200 cursor-pointer select-none hover:scale-[1.02] active:scale-[0.99] group"
              title="Klik untuk berpindah ke Tab Manajemen Kategori"
            >
              <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-1 group-hover:text-cyan-300 transition">
                <span>Kategori</span>
                <Funnel size={18} className="text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-300">
                {stats.totalCats}
              </div>
              <span className="text-[10px] text-emerald-400/80 group-hover:text-cyan-200/90 transition">
                Buka manajemen &rarr;
              </span>
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
                  placeholder="Cari pemain, edisi (cth: #12), tim, tahun, ID..."
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

              {/* Filter Status Publikasi (Aktif vs Non-Aktif) */}
              <div className="w-full md:w-52 shrink-0">
                <select
                  value={selectedActiveFilter}
                  onChange={(e) => setSelectedActiveFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white focus:outline-none focus:border-lime-400 cursor-pointer font-medium"
                >
                  <option value="active">Produk Aktif ({stats.activeCount})</option>
                  <option value="inactive">Produk Non-Aktif ({stats.inactiveCount})</option>
                  <option value="all">Semua Status ({stats.total})</option>
                </select>
              </div>

              {/* Filter Kategori */}
              <div className="w-full md:w-48 shrink-0">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white focus:outline-none focus:border-lime-400 cursor-pointer"
                >
                  <option value="all">Semua Kategori ({stats.totalCats})</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.category?.toUpperCase()}{cat.is_active === false ? ' (Non-Aktif)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Status (Tersedia vs SOLD OUT) */}
              <div className="w-full md:w-40 shrink-0">
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white focus:outline-none focus:border-lime-400 cursor-pointer"
                >
                  <option value="all">Semua Stok</option>
                  <option value="normal">Tersedia ({stats.normalCount})</option>
                  <option value="sold_out">SOLD OUT ({stats.soldOutCount})</option>
                </select>
              </div>

              {/* Pengurutan (Sorting) */}
              <div className="w-full md:w-48 shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white focus:outline-none focus:border-lime-400 cursor-pointer"
                  title="Pilihan Pengurutan Produk"
                >
                  <option value="catalog_default">Default Urutan Toko</option>
                  <option value="id_desc">ID Terbaru</option>
                  <option value="id_asc">ID Terlama</option>
                  <option value="name_asc">Nama (A - Z)</option>
                  <option value="name_desc">Nama (Z - A)</option>
                  <option value="price_desc">Harga Tertinggi</option>
                  <option value="price_asc">Harga Terendah</option>
                </select>
              </div>
            </div>

            {/* Active Filter Indicators */}
            {(searchQuery || selectedCategoryFilter !== 'all' || selectedStatusFilter !== 'all' || selectedActiveFilter !== 'active' || sortBy !== 'catalog_default') && (
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-800/40 text-xs text-emerald-300">
                <span>Filter Aktif:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-900 border border-emerald-700 text-[11px]">
                    Pencarian: &quot;{searchQuery}&quot;
                    <button onClick={() => setSearchQuery('')} className="hover:text-white cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedActiveFilter !== 'active' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-600/60 text-amber-300 text-[11px]">
                    Tampilan: {selectedActiveFilter === 'inactive' ? 'Produk Non-Aktif' : 'Semua (Aktif & Non-Aktif)'}
                    <button onClick={() => setSelectedActiveFilter('active')} className="hover:text-white cursor-pointer" title="Kembali ke Produk Aktif">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedCategoryFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-900 border border-emerald-700 text-[11px]">
                    Kategori: {categories.find((c) => String(c.id) === String(selectedCategoryFilter))?.category?.toUpperCase()}
                    <button onClick={() => setSelectedCategoryFilter('all')} className="hover:text-white cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedStatusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-900 border border-emerald-700 text-[11px]">
                    Stok: {selectedStatusFilter === 'sold_out' ? 'SOLD OUT' : 'Tersedia'}
                    <button onClick={() => setSelectedStatusFilter('all')} className="hover:text-white cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {sortBy !== 'catalog_default' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-900 border border-emerald-700 text-[11px]">
                    Urutan:{' '}
                    {sortBy === 'id_desc'
                      ? 'ID Terbaru'
                      : sortBy === 'id_asc'
                      ? 'ID Terlama'
                      : sortBy === 'name_asc'
                      ? 'Nama (A-Z)'
                      : sortBy === 'name_desc'
                      ? 'Nama (Z-A)'
                      : sortBy === 'price_desc'
                      ? 'Harga Tertinggi'
                      : sortBy === 'price_asc'
                      ? 'Harga Terendah'
                      : sortBy}
                    <button onClick={() => setSortBy('catalog_default')} className="hover:text-white cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategoryFilter('all');
                    setSelectedStatusFilter('all');
                    setSelectedActiveFilter('active');
                    setSortBy('catalog_default');
                  }}
                  className="text-lime-400 hover:underline text-[11px] ml-auto cursor-pointer"
                >
                  Reset Semua Filter
                </button>
              </div>
            )}
          </div>

      {/* Action Toolbar di atas Table Product */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Daftar Produk Katalog</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-mono">
              {filteredProducts.length} Item
            </span>
            {selectedProductIds.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-lime-400 text-emerald-950 font-bold font-mono">
                {selectedProductIds.length} Terpilih
              </span>
            )}
          </h2>
          <p className="text-[11px] text-emerald-400/70">
            Kelola stok produk, aktifkan/nonaktifkan produk, dan centang produk untuk bulk edit massal.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Tombol Bulk Actions jika ada item tercentang */}
          {selectedProductIds.length > 0 && (
            <div className="flex items-center gap-1.5 animate-in fade-in">
              {/* Tombol Cepat: Tampilkan Terpilih */}
              <button
                type="button"
                onClick={() => handleBulkToggleActive(true)}
                disabled={isBulkDeactivating}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-lime-300 font-bold text-xs shadow border border-emerald-600/60 transition cursor-pointer active:scale-95 disabled:opacity-50"
                title="Tampilkan semua produk terpilih di katalog toko"
              >
                {isBulkDeactivating ? <Spinner size={13} className="animate-spin" /> : <Eye size={14} weight="bold" />}
                <span>Tampilkan ({selectedProductIds.length})</span>
              </button>

              {/* Tombol Cepat: Sembunyikan Terpilih */}
              <button
                type="button"
                onClick={() => handleBulkToggleActive(false)}
                disabled={isBulkDeactivating}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold text-xs shadow border border-amber-600/50 transition cursor-pointer active:scale-95 disabled:opacity-50"
                title="Sembunyikan semua produk terpilih dari katalog toko"
              >
                {isBulkDeactivating ? <Spinner size={13} className="animate-spin" /> : <EyeSlash size={14} weight="bold" />}
                <span>Sembunyikan ({selectedProductIds.length})</span>
              </button>

              {/* Tombol Modal Bulk Edit Lengkap */}
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-lime-400 text-emerald-950 font-bold text-xs sm:text-sm shadow-lg shadow-lime-950/40 hover:bg-lime-300 transition cursor-pointer active:scale-95"
                title="Buka form bulk edit lengkap"
              >
                <Sliders size={16} weight="bold" />
                <span className="hidden sm:inline">Bulk Edit</span>
              </button>
            </div>
          )}

          {/* Tombol Tambah Produk */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 text-emerald-950 font-bold text-xs sm:text-sm shadow-lg shadow-lime-950/40 hover:from-lime-300 hover:to-lime-400 transition cursor-pointer active:scale-95 shrink-0"
          >
            <Plus size={18} weight="bold" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Main Products Table */}
      <div className="bg-emerald-950/80 border border-emerald-700/40 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Spinner size={32} className="animate-spin text-lime-400 mb-3" />
            <p className="text-sm font-semibold text-emerald-200">Memuat data produk...</p>
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
                  {/* Checkbox Select All Column */}
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllPaginatedSelected}
                      onChange={handleToggleSelectAll}
                      title="Pilih semua di halaman ini"
                      className="w-4 h-4 rounded text-lime-400 bg-emerald-950 border-emerald-700 focus:ring-lime-400 focus:ring-offset-0 cursor-pointer accent-lime-400"
                    />
                  </th>
                  <th className="py-3 px-3 w-14 text-center">Gambar</th>
                  <th className="py-3 px-4 min-w-[200px]">Judul Produk</th>
                  <th className="py-3 px-4 min-w-[120px]">Kategori</th>
                  <th className="py-3 px-4 min-w-[130px]">Harga</th>
                  <th className="py-3 px-4 min-w-[120px] text-center">QR Video</th>
                  <th className="py-3 px-4 min-w-[190px]">Status Keterangan</th>
                  <th className="py-3 px-4 min-w-[150px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/60 text-xs">
                {paginatedProducts.map((product) => {
                  const isSoldOut = String(product.sold_out || '').trim().toUpperCase() === 'Y';
                  const isProductActive = product.is_active !== false;
                  const isTogglingThis = togglingId === product.id;
                  const isTogglingActiveThis = togglingActiveId === product.id;
                  const isSelected = selectedProductIds.includes(product.id);
                  const catName = product.categories?.category || product.category || 'stiker';
                  const catBadgeClass = getCategoryBadgeStyle(catName);
                  const isPoster = String(product.category_id) === '4' || String(catName).toLowerCase().includes('poster');
                  const variants = parseVariants(product.variants);
                  const isLimited = String(product.edition || '').trim().toUpperCase() === 'LIMITED';

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-emerald-900/30 transition-colors ${
                        isSelected
                          ? 'bg-emerald-900/50 ring-1 ring-lime-400/40'
                          : !isProductActive
                          ? 'bg-slate-950/40 opacity-75'
                          : isSoldOut
                          ? 'bg-rose-950/10'
                          : ''
                      }`}
                    >
                      {/* 0. Row Checkbox */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(product.id)}
                          title="Pilih untuk bulk edit"
                          className="w-4 h-4 rounded text-lime-400 bg-emerald-950 border-emerald-700 focus:ring-lime-400 focus:ring-offset-0 cursor-pointer accent-lime-400"
                        />
                      </td>

                      {/* 1. Thumbnail Image */}
                      <td className="py-3 px-3 text-center">
                        <div
                          onClick={() => product.img && setZoomImage(product.img)}
                          className="w-11 h-11 mx-auto rounded-lg bg-emerald-900/60 border border-emerald-700/60 overflow-hidden flex items-center justify-center cursor-pointer group relative shadow-sm"
                          title="Klik untuk memperbesar gambar"
                        >
                          {product.img ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={optimizeCloudinaryUrl(product.img)}
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-xs sm:text-sm uppercase tracking-wide">
                            {product.title || product.player_name}
                          </span>
                          {!isProductActive && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/50 font-bold text-[9px] uppercase tracking-wider">
                              Non-Aktif
                            </span>
                          )}
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
                        {isLimited ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-400 text-emerald-950 font-black text-xs uppercase tracking-wider shadow-sm">
                              LIMITED
                            </span>
                            <span className="text-amber-300 font-mono font-bold text-xs">
                              {formatRupiah(product.price && product.price > 0 ? product.price : 20000)}
                            </span>
                          </div>
                        ) : isPoster || (variants && variants.length > 0) ? (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setExpandedVariantId(expandedVariantId === product.id ? null : product.id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                                expandedVariantId === product.id
                                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-950/50'
                                  : 'bg-purple-950/70 hover:bg-purple-900/90 text-purple-200 border-purple-500/40'
                              }`}
                              title="Klik untuk melihat rincian harga tiap varian"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                              <span>{variants?.length || 3} Varian Ukuran</span>
                              <CaretDown
                                size={12}
                                className={`transition-transform duration-200 ${
                                  expandedVariantId === product.id ? 'rotate-180' : ''
                                }`}
                              />
                            </button>

                            {expandedVariantId === product.id && (
                              <div className="mt-1.5 p-2 rounded-xl bg-emerald-950/95 border border-purple-500/50 shadow-xl text-xs space-y-1.5 min-w-[170px] animate-in fade-in duration-150">
                                <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider pb-1 border-b border-emerald-800 flex items-center justify-between">
                                  <span>Rincian Varian</span>
                                  <span className="text-[9px] text-emerald-400 font-normal">
                                    {variants?.length || 0} Ukuran
                                  </span>
                                </div>
                                {variants && variants.length > 0 ? (
                                  <div className="space-y-1">
                                    {variants.map((v, idx) => (
                                      <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
                                        <span className="font-semibold text-purple-200">Ukuran {v.size}:</span>
                                        <span className="font-mono font-bold text-lime-400">{formatRupiah(v.price)}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-emerald-300/80 italic">
                                    Ukuran A3, A2, A1
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="font-mono font-bold text-lime-400 text-xs sm:text-sm">
                            {formatRupiah(product.price)}
                          </div>
                        )}
                      </td>

                      {/* 5. QR Video */}
                      <td className="py-3 px-4 text-center">
                        {product.qr_video ? (
                          <button
                            type="button"
                            onClick={() => setPreviewVideoProduct(product)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-lime-400/20 hover:bg-lime-400/30 text-lime-300 border border-lime-400/50 text-[11px] font-bold shadow-sm transition hover:scale-105 cursor-pointer"
                            title="Tonton Preview & Salin Link QR Video"
                          >
                            <VideoCamera size={14} weight="fill" className="text-lime-400" />
                            <span>Lihat QR</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600/70 italic font-mono">-</span>
                        )}
                      </td>

                      {/* 6. Status Keterangan (Tersedia vs SOLD OUT) - Menggunakan Switch Toggle */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {/* Switch Component */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isSoldOut}
                            onClick={() => handleToggleSoldOut(product)}
                            disabled={isTogglingThis}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-lime-400/50 disabled:opacity-50 disabled:cursor-not-allowed ${
                              isSoldOut ? 'bg-rose-600' : 'bg-emerald-700'
                            }`}
                            title={
                              isSoldOut
                                ? 'Status: SOLD OUT (Habis). Klik switch untuk ubah ke TERSEDIA'
                                : 'Status: TERSEDIA. Klik switch untuk ubah ke SOLD OUT'
                            }
                          >
                            <span
                              className={`pointer-events-none inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isSoldOut ? 'translate-x-5 text-rose-600' : 'translate-x-0 text-emerald-700'
                              }`}
                            >
                              {isTogglingThis ? (
                                <Spinner size={10} className="animate-spin text-emerald-800" />
                              ) : isSoldOut ? (
                                <X size={10} weight="bold" />
                              ) : (
                                <Check size={10} weight="bold" />
                              )}
                            </span>
                          </button>

                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm transition-colors ${
                              isSoldOut
                                ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                                : 'bg-emerald-900 text-lime-300 border border-lime-400/40'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSoldOut ? 'bg-rose-400 animate-pulse' : 'bg-lime-400'
                              }`}
                            />
                            {isSoldOut ? 'SOLD OUT' : 'TERSEDIA'}
                          </span>
                        </div>
                      </td>

                      {/* 6. Kolom Aksi (Edit, Nonaktifkan/Aktifkan, Hapus) */}
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

                          {/* Tombol Nonaktifkan / Aktifkan Produk */}
                          {isProductActive ? (
                            <button
                              type="button"
                              onClick={() => handleToggleActiveProduct(product)}
                              disabled={isTogglingActiveThis}
                              className="p-2 rounded-lg bg-emerald-900/60 hover:bg-amber-950 text-emerald-300 hover:text-amber-300 border border-emerald-700/50 hover:border-amber-700/50 transition cursor-pointer"
                              title="Nonaktifkan Produk (Sembunyikan dari katalog toko & daftar admin)"
                            >
                              {isTogglingActiveThis ? (
                                <Spinner size={15} className="animate-spin text-amber-400" />
                              ) : (
                                <EyeSlash size={15} />
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleActiveProduct(product)}
                              disabled={isTogglingActiveThis}
                              className="p-2 rounded-lg bg-lime-950/60 hover:bg-lime-900 text-lime-300 hover:text-white border border-lime-700/50 transition cursor-pointer"
                              title="Aktifkan Kembali Produk"
                            >
                              {isTogglingActiveThis ? (
                                <Spinner size={15} className="animate-spin text-lime-400" />
                              ) : (
                                <Eye size={15} />
                              )}
                            </button>
                          )}

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/40 transition cursor-pointer"
                            title="Hapus Produk"
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
        {/* Floating Bulk Action Bar */}
        {selectedProductIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-emerald-950/95 border-2 border-lime-400/80 rounded-2xl shadow-2xl px-4 py-3 sm:px-6 sm:py-3.5 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-2xl w-[92%]">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-lime-400 text-emerald-950 font-black text-xs flex items-center justify-center">
                {selectedProductIds.length}
              </span>
              <span className="text-sm font-semibold text-white">
                {selectedProductIds.length} produk terpilih
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-emerald-950 font-bold text-xs flex items-center gap-1.5 shadow-md hover:shadow-lime-400/20 transition cursor-pointer"
              >
                <Sliders size={16} weight="bold" />
                <span>Bulk Edit (Kategori, Harga, Sold Out, Edisi)</span>
              </button>

              <button
                type="button"
                onClick={handleBulkDeactivate}
                disabled={isBulkDeactivating}
                className="px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-600/40 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                title="Nonaktifkan semua produk yang dipilih sekaligus"
              >
                {isBulkDeactivating ? (
                  <Spinner size={15} className="animate-spin text-amber-400" />
                ) : (
                  <EyeSlash size={15} />
                )}
                <span className="hidden sm:inline">Nonaktifkan</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProductIds([])}
                className="p-1.5 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-900/60 transition cursor-pointer"
                title="Batalkan pilihan"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
        </div>
      )}

      {/* ===================== VIEW KATEGORI (CRUD) ===================== */}
      {activeTab === 'kategori' && (
        <CategoryManager
          categories={categories}
          setCategories={setCategories}
          products={products}
          isLoading={isLoading}
          onRefresh={loadData}
        />
      )}

      {/* ===================== VIEW IKLAN (CRUD) ===================== */}
      {activeTab === 'iklan' && (
        <PromotionManager
          promotions={promotions}
          setPromotions={setPromotions}
          categories={categories}
          isLoading={isLoading}
          onRefresh={loadData}
          onZoomImage={setZoomImage}
        />
      )}

      {/* Modal Bulk Edit Produk */}
      <BulkEditModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedProductIds={selectedProductIds}
        categories={categories}
        onSuccess={() => {
          setSelectedProductIds([]);
          loadData(true);
        }}
      />

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

      {/* Modal Preview Video QR & Salin Link */}
      <VideoPreviewModal
        isOpen={Boolean(previewVideoProduct)}
        onClose={() => setPreviewVideoProduct(null)}
        product={previewVideoProduct}
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
              src={optimizeCloudinaryUrl(zoomImage)}
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
