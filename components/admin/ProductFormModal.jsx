'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Check,
  Plus,
  Trash,
  CheckCircle,
  Spinner,
  Tag,
  ListPlus,
  Sparkle,
  Camera,
} from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { formatRupiah, parseVariants, getCloudinaryFolderByCategory } from '@/lib/utils';
import CloudinaryWidget from './CloudinaryWidget';
import { useToast } from './Toast';

export default function ProductFormModal({
  isOpen,
  onClose,
  productToEdit = null,
  categories = [],
  onSuccess,
}) {
  const { showToast } = useToast();
  const isEditing = Boolean(productToEdit);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    player_name: '',
    team: '',
    category_id: '',
    price: '',
    edition: '',
    year: '',
    img: '',
    img_add: '',
    sold_out: false, // boolean in form, converted to 'Y' or null
  });

  // Variants State (Visual Form Only)
  const [variantsList, setVariantsList] = useState([]);

  // Status and submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Category info for spec, desc, and Cloudinary folder
  const selectedCategory = categories.find((c) => String(c.id) === String(formData.category_id));
  const isKeychain =
    String(formData.category_id) === '3' ||
    (selectedCategory?.category || '').toLowerCase().includes('keychain') ||
    (selectedCategory?.category || '').toLowerCase().includes('kunci');
  const isPoster =
    String(formData.category_id) === '4' ||
    (selectedCategory?.category || '').toLowerCase().includes('poster');
  const isLimited = String(formData.edition || '').trim().toUpperCase() === 'LIMITED';
  const activeCloudinaryFolder = getCloudinaryFolderByCategory(formData.category_id, selectedCategory?.category);

  // Categories available for selection in dropdown:
  // - Saat menambah produk baru: hanya kategori aktif (is_active !== false)
  // - Saat mengedit produk lama: kategori aktif + kategori produk saat ini jika telah dinonaktifkan
  const selectableCategories = useMemo(() => {
    return categories.filter((c) => {
      if (c.is_active !== false) return true;
      if (isEditing && String(c.id) === String(formData.category_id)) return true;
      return false;
    });
  }, [categories, isEditing, formData.category_id]);

  // Track images newly uploaded in this modal session (for auto-delete if replaced or cancelled)
  const sessionUploadedImages = useRef(new Map());

  // Function to delete an image from Cloudinary
  const deleteCloudinaryImage = async (url, public_id = null) => {
    if (!url && !public_id) return;
    try {
      // Check localStorage for client-configured credentials
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

      const res = await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          public_id,
          api_key: savedApiKey,
          api_secret: savedApiSecret,
          cloud_name: savedCloudName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.requiresCredentials) {
          showToast(
            'Foto belum terhapus dari penyimpanan: Periksa API Key & Secret atau konfigurasi di .env.local.',
            'warning',
            5500
          );
        } else {
          console.warn('Gagal menghapus gambar:', data.error || data.message);
        }
      } else {
        showToast('Foto berhasil dihapus.', 'info', 2500);
      }
    } catch (err) {
      console.warn('Gagal menghapus gambar:', err);
    }
  };

  // Main Image Change Handler (deletes old image if replaced during this session)
  const handleMainImageChange = (newUrl, newPublicId) => {
    const oldUrl = formData.img;
    if (oldUrl && oldUrl !== newUrl && sessionUploadedImages.current.has(oldUrl)) {
      const oldItem = sessionUploadedImages.current.get(oldUrl);
      deleteCloudinaryImage(oldUrl, oldItem?.public_id);
      sessionUploadedImages.current.delete(oldUrl);
    }
    if (newUrl) {
      sessionUploadedImages.current.set(newUrl, { url: newUrl, public_id: newPublicId });
    }
    setFormData((prev) => ({ ...prev, img: newUrl }));
    if (errors.img) setErrors((prev) => ({ ...prev, img: '' }));
  };

  // Main Image Delete Handler
  const handleMainImageDelete = (deletedUrl, deletedPublicId) => {
    if (deletedUrl) {
      const item = sessionUploadedImages.current.get(deletedUrl);
      deleteCloudinaryImage(deletedUrl, deletedPublicId || item?.public_id);
      sessionUploadedImages.current.delete(deletedUrl);
    }
    setFormData((prev) => ({ ...prev, img: '' }));
  };

  // Secondary Image Change Handler (Keychain 2 Sisi)
  const handleSecondaryImageChange = (newUrl, newPublicId) => {
    const oldUrl = formData.img_add;
    if (oldUrl && oldUrl !== newUrl && sessionUploadedImages.current.has(oldUrl)) {
      const oldItem = sessionUploadedImages.current.get(oldUrl);
      deleteCloudinaryImage(oldUrl, oldItem?.public_id);
      sessionUploadedImages.current.delete(oldUrl);
    }
    if (newUrl) {
      sessionUploadedImages.current.set(newUrl, { url: newUrl, public_id: newPublicId });
    }
    setFormData((prev) => ({ ...prev, img_add: newUrl }));
  };

  // Secondary Image Delete Handler
  const handleSecondaryImageDelete = (deletedUrl, deletedPublicId) => {
    if (deletedUrl) {
      const item = sessionUploadedImages.current.get(deletedUrl);
      deleteCloudinaryImage(deletedUrl, deletedPublicId || item?.public_id);
      sessionUploadedImages.current.delete(deletedUrl);
    }
    setFormData((prev) => ({ ...prev, img_add: '' }));
  };

  // Cancel and Cleanup all images newly uploaded in this modal session
  const handleCancelAndClose = () => {
    if (sessionUploadedImages.current.size > 0) {
      sessionUploadedImages.current.forEach((item) => {
        deleteCloudinaryImage(item.url, item.public_id);
      });
      sessionUploadedImages.current.clear();
    }
    onClose();
  };

  // Edition Change Handler (locks price to 0 if LIMITED)
  const handleEditionChange = (val) => {
    const isNowLimited = String(val || '').trim().toUpperCase() === 'LIMITED';
    setFormData((prev) => ({
      ...prev,
      edition: val,
      ...(isNowLimited ? { price: '0' } : {}),
    }));
    if (isNowLimited) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.price;
        return next;
      });
    }
  };

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    sessionUploadedImages.current.clear();

    if (productToEdit) {
      const isProdLimited = String(productToEdit.edition || '').trim().toUpperCase() === 'LIMITED';
      setFormData({
        title: productToEdit.title || '',
        player_name: productToEdit.player_name || productToEdit.title || '',
        team: productToEdit.team || '',
        category_id: productToEdit.category_id ? String(productToEdit.category_id) : (categories[0]?.id ? String(categories[0].id) : '1'),
        price: isProdLimited ? '0' : productToEdit.price !== undefined && productToEdit.price !== null ? String(productToEdit.price) : '',
        edition: productToEdit.edition !== undefined && productToEdit.edition !== null ? String(productToEdit.edition) : '',
        year: productToEdit.year || '',
        img: productToEdit.img || '',
        img_add: productToEdit.img_add || '',
        sold_out: String(productToEdit.sold_out || '').toUpperCase() === 'Y',
      });

      // Parse variants
      const parsed = parseVariants(productToEdit.variants);
      if (parsed && parsed.length > 0) {
        setVariantsList(parsed);
      } else {
        setVariantsList([]);
      }
    } else {
      // New product defaults: pilih kategori aktif pertama
      const firstActiveCat = categories.find((c) => c.is_active !== false) || categories[0];
      const defaultCatId = firstActiveCat?.id ? String(firstActiveCat.id) : '1';
      setFormData({
        title: '',
        player_name: '',
        team: '',
        category_id: defaultCatId,
        price: '10000',
        edition: '1',
        year: new Date().getFullYear().toString(),
        img: '',
        img_add: '',
        sold_out: false,
      });
      setVariantsList([]);
    }

    setErrors({});
  }, [isOpen, productToEdit, categories]);

  // Sync category change for posters default variants
  const handleCategoryChange = (e) => {
    const newCatId = e.target.value;
    const chosenCat = categories.find((c) => String(c.id) === String(newCatId));
    const isCatPoster = chosenCat && (chosenCat.category?.toLowerCase().includes('poster') || String(newCatId) === '4');

    setFormData((prev) => ({
      ...prev,
      category_id: newCatId,
      ...(isCatPoster && !isLimited && (!prev.price || prev.price === '10000') ? { price: '0' } : {}),
    }));

    if (isCatPoster && variantsList.length === 0) {
      const defaultPosterVariants = [
        { size: 'A3', price: 250000 },
        { size: 'A2', price: 325000 },
        { size: 'A1', price: 400000 },
      ];
      setVariantsList(defaultPosterVariants);
    }
  };

  // Variant Visual List Handlers
  const handleAddVariant = () => {
    const updated = [...variantsList, { size: '', price: Number(formData.price) || 0 }];
    setVariantsList(updated);
  };

  const handleUpdateVariant = (index, field, value) => {
    const updated = [...variantsList];
    if (field === 'price') {
      const cleanNum = parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0;
      updated[index] = { ...updated[index], price: cleanNum };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setVariantsList(updated);
  };

  const handleRemoveVariant = (index) => {
    setVariantsList((prev) => prev.filter((_, i) => i !== index));
  };

  const applyPosterPreset = () => {
    const defaultPosterVariants = [
      { size: 'A3', price: 250000 },
      { size: 'A2', price: 325000 },
      { size: 'A1', price: 400000 },
    ];
    setVariantsList(defaultPosterVariants);
    showToast('Preset varian poster (A3, A2, A1) berhasil diterapkan', 'info');
  };

  // Form Validation
  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Judul produk wajib diisi.';
    }
    if (!formData.category_id) {
      newErrors.category_id = 'Pilih kategori produk.';
    }

    if (isPoster) {
      // Untuk poster: Varian Ukuran & Harga wajib diisi!
      if (!variantsList || variantsList.length === 0) {
        newErrors.variants = 'Poster wajib memiliki minimal 1 varian ukuran dan harga.';
      } else {
        const hasEmptySize = variantsList.some((v) => !String(v.size || '').trim());
        const hasInvalidPrice = variantsList.some(
          (v) => !v.price || Number(v.price) <= 0 || isNaN(Number(v.price))
        );
        if (hasEmptySize) {
          newErrors.variants = 'Nama/kode ukuran varian poster wajib diisi (misal A3, A2, A1).';
        } else if (hasInvalidPrice) {
          newErrors.variants = 'Harga untuk setiap varian ukuran poster harus lebih dari 0.';
        }
      }
    } else {
      // Produk non-poster: validasi harga normal
      const cleanPrice = parseInt(String(formData.price || 0).replace(/[^0-9]/g, ''), 10);
      if (!isLimited && (isNaN(cleanPrice) || cleanPrice <= 0)) {
        newErrors.price = 'Harga produk harus lebih dari 0.';
      }
    }

    if (!formData.img.trim()) {
      newErrors.img = 'Unggah atau masukkan URL gambar produk.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Mohon lengkapi kolom yang bertanda merah', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine final variants: only for poster
      let finalVariants = null;
      if (isPoster) {
        const cleaned = variantsList.filter(
          (v) => String(v.size || '').trim() && Number(v.price) > 0
        );
        if (cleaned.length > 0) {
          finalVariants = cleaned;
        }
      }

      // If poster or LIMITED, price is 0 (for poster price is on the variants)
      const numericPrice = (isLimited || isPoster)
        ? 0
        : parseInt(String(formData.price || 0).replace(/[^0-9]/g, ''), 10) || 0;

      const cleanTitle = formData.title.trim().toUpperCase();
      const cleanPlayer = formData.player_name.trim() ? formData.player_name.trim().toUpperCase() : cleanTitle;
      const cleanTeam = formData.team.trim() ? formData.team.trim().toUpperCase() : null;

      // Construct payload according to PostgreSQL products schema
      const payload = {
        title: cleanTitle,
        player_name: cleanPlayer,
        team: cleanTeam,
        category_id: parseInt(formData.category_id, 10),
        price: numericPrice,
        edition: formData.edition ? String(formData.edition).trim() : null,
        year: formData.year ? String(formData.year).trim() : null,
        img: formData.img.trim(),
        img_add: isKeychain && formData.img_add ? formData.img_add.trim() : null,
        sold_out: formData.sold_out ? 'Y' : null,
        variants: finalVariants,
      };

      if (isEditing) {
        // Update product
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', productToEdit.id);

        if (error) throw error;
        showToast(`Produk "${cleanTitle}" berhasil diperbarui!`, 'success');
      } else {
        // Insert new product
        const { error } = await supabase
          .from('products')
          .insert([payload]);

        if (error) throw error;
        showToast(`Produk baru "${cleanTitle}" berhasil ditambahkan!`, 'success');
      }

      // Clean up any earlier replaced images uploaded in this session that were not saved
      sessionUploadedImages.current.forEach((item, url) => {
        if (url !== formData.img && url !== (isKeychain ? formData.img_add : null)) {
          deleteCloudinaryImage(item.url, item.public_id);
        }
      });
      sessionUploadedImages.current.clear();

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving product:', err);
      showToast(`Gagal menyimpan produk: ${err.message || 'Terjadi kesalahan sistem'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-emerald-950/95 border border-emerald-600/50 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-800/80 bg-emerald-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-lime-400/20 border border-lime-400/40 flex items-center justify-center text-lime-400">
              {isEditing ? <Tag size={18} weight="bold" /> : <Plus size={18} weight="bold" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                {isEditing ? 'Edit Data Produk' : 'Tambah Produk Baru'}
              </h2>
              <p className="text-xs text-emerald-300">
                {isEditing ? `Mengubah produk ID #${productToEdit?.id}` : 'Tambahkan item ke katalog LOUIFOOTBALL'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelAndClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/60 transition cursor-pointer"
            title="Tutup Modal (Hapus foto belum tersimpan)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-emerald-100 flex-1">
          {/* Section 1: Informasi Dasar */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-lime-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-emerald-800/60 pb-1.5">
              <Tag size={14} /> 1. Informasi Utama Produk
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Kategori Dropdown - Di paling atas sesuai permintaan */}
              <div className="sm:col-span-2 p-3 rounded-xl bg-emerald-900/40 border border-emerald-700/60 shadow-sm">
                <div className="mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                    <Tag size={15} className="text-lime-400" />
                    Kategori Produk <span className="text-rose-400">*</span>
                  </label>
                </div>
                <select
                  value={formData.category_id}
                  onChange={handleCategoryChange}
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg bg-emerald-950 border ${errors.category_id ? 'border-rose-500' : 'border-emerald-700/80'
                    } text-white focus:outline-none focus:border-lime-400 font-bold cursor-pointer`}
                >
                  {selectableCategories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-emerald-950 text-white font-medium">
                      {c.category?.toUpperCase()}{c.is_active === false ? ' (Non-Aktif)' : ''}
                    </option>
                  ))}
                </select>
                {errors.category_id && <p className="text-[11px] text-rose-400 mt-1">{errors.category_id}</p>}
              </div>

              {/* Edisi Produk - Pindah ke Atas */}
              <div className="sm:col-span-2 p-3 rounded-xl bg-emerald-900/30 border border-emerald-700/60 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                    <Sparkle size={15} className="text-lime-400" />
                    Edisi Produk
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEditionChange('LIMITED')}
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                        isLimited
                          ? 'bg-amber-400 text-emerald-950 shadow-sm font-black'
                          : 'bg-emerald-900/80 text-amber-300 hover:bg-emerald-800 border border-amber-500/40'
                      }`}
                    >
                      ★ LIMITED
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditionChange('SPECIAL')}
                      className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                        formData.edition?.toUpperCase() === 'SPECIAL'
                          ? 'bg-lime-400 text-emerald-950 font-bold'
                          : 'bg-emerald-900/80 text-emerald-200 hover:bg-emerald-800 border border-emerald-700'
                      }`}
                    >
                      SPECIAL
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditionChange('1')}
                      className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                        formData.edition === '1'
                          ? 'bg-lime-400 text-emerald-950 font-bold'
                          : 'bg-emerald-900/80 text-emerald-200 hover:bg-emerald-800 border border-emerald-700'
                      }`}
                    >
                      Edisi 1
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={formData.edition}
                  onChange={(e) => handleEditionChange(e.target.value)}
                  placeholder="Contoh: 1, 12, SPECIAL, atau LIMITED"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg bg-emerald-950 border border-emerald-700/60 text-white placeholder-emerald-600/50 focus:outline-none focus:border-lime-400 font-semibold uppercase"
                />
                {isLimited && (
                  <p className="text-[11px] text-amber-300 font-semibold mt-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>Edisi LIMITED aktif: Harga produk dikunci ke Rp 0 (tidak bisa diisi).</span>
                  </p>
                )}
              </div>

              {/* Judul Produk */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1">
                  Judul Produk <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Contoh: CR7 SPORTING CP DEBUT"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg bg-emerald-900/60 border ${errors.title ? 'border-rose-500' : 'border-emerald-700/60'
                    } text-white placeholder-emerald-600/50 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 font-semibold uppercase`}
                />
                {errors.title && <p className="text-[11px] text-rose-400 mt-1">{errors.title}</p>}
              </div>

              {/* Nama Pemain */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1">
                  Nama Pemain
                </label>
                <input
                  type="text"
                  value={formData.player_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, player_name: e.target.value }))}
                  placeholder="Contoh: CRISTIANO RONALDO"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-600/50 focus:outline-none focus:border-lime-400 font-medium uppercase"
                />
                <span className="text-[10px] text-emerald-400/70">Otomatis diisi dari judul jika kosong.</span>
              </div>

              {/* Tim / Klub */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1">
                  Tim / Klub / Negara
                </label>
                <input
                  type="text"
                  value={formData.team}
                  onChange={(e) => setFormData((prev) => ({ ...prev, team: e.target.value }))}
                  placeholder="Contoh: REAL MADRID, PRANCIS"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-600/50 focus:outline-none focus:border-lime-400 uppercase font-medium"
                />
              </div>

              {/* Harga Dasar (Hanya muncul jika BUKAN poster) */}
              {!isPoster && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1">
                    Harga Satuan (Rp) {!isLimited && <span className="text-rose-400">*</span>}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-lime-400 font-bold">Rp</span>
                    <input
                      type="text"
                      value={isLimited ? '0' : formData.price}
                      disabled={isLimited}
                      onChange={(e) => {
                        if (isLimited) return;
                        const num = e.target.value.replace(/[^0-9]/g, '');
                        setFormData((prev) => ({ ...prev, price: num }));
                      }}
                      placeholder={isLimited ? '0 (LIMITED)' : '10000'}
                      className={`w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-lg border font-mono font-bold focus:outline-none ${
                        isLimited
                          ? 'bg-emerald-950/70 border-amber-500/40 text-amber-300 cursor-not-allowed opacity-90'
                          : errors.price
                          ? 'bg-emerald-900/60 border-rose-500 text-white focus:border-lime-400'
                          : 'bg-emerald-900/60 border-emerald-700/60 text-white focus:border-lime-400'
                      }`}
                    />
                  </div>
                  {isLimited ? (
                    <span className="text-[10px] text-amber-300 font-bold mt-1 block">
                      ★ Edisi LIMITED: Harga diatur otomatis ke Rp 0
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400/80 mt-1 block">
                      Format: {formatRupiah(formData.price || 0)}
                    </span>
                  )}
                  {errors.price && !isLimited && <p className="text-[11px] text-rose-400 mt-1">{errors.price}</p>}
                </div>
              )}

              {/* Tahun Rilis */}
              <div className={isPoster ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1">
                  Tahun Musim / Rilis
                </label>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) => setFormData((prev) => ({ ...prev, year: e.target.value }))}
                  placeholder="Contoh: 2024/2025"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-600/50 focus:outline-none focus:border-lime-400 font-medium"
                />
              </div>
            </div>

            {/* Toggle Sold Out Switch */}
            <div className="p-3 rounded-xl bg-emerald-900/40 border border-emerald-700/60 flex items-center justify-between mt-2">
              <div>
                <span className="text-xs sm:text-sm font-bold text-white block">Status Keterangan Produk</span>
                <span className="text-[11px] text-emerald-300">
                  {formData.sold_out
                    ? 'Produk saat ini berstatus SOLD OUT (Habis).'
                    : 'Produk saat ini berstatus TERSEDIA (Tersedia untuk dipesan).'}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={formData.sold_out}
                onClick={() => setFormData((prev) => ({ ...prev, sold_out: !prev.sold_out }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-lime-400/50 ${formData.sold_out ? 'bg-rose-600' : 'bg-emerald-700'
                  }`}
                title={
                  formData.sold_out
                    ? 'Status: SOLD OUT (Habis). Klik untuk beralih ke TERSEDIA'
                    : 'Status: TERSEDIA. Klik untuk beralih ke SOLD OUT'
                }
              >
                <span
                  className={`pointer-events-none inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.sold_out ? 'translate-x-5 text-rose-600' : 'translate-x-0 text-emerald-700'
                    }`}
                >
                  {formData.sold_out ? (
                    <X size={10} weight="bold" />
                  ) : (
                    <Check size={10} weight="bold" />
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Section 2: Unggah Foto dari Perangkat */}
          <div className="space-y-4 pt-2">
            <div className="border-b border-emerald-800/60 pb-1.5">
              <h3 className="text-xs font-bold text-lime-400 tracking-wider uppercase flex items-center gap-1.5">
                <Camera size={14} /> 2. Foto Produk (Upload dari Perangkat)
              </h3>
            </div>

            {/* Foto Utama */}
            <CloudinaryWidget
              value={formData.img}
              onChange={handleMainImageChange}
              onDelete={handleMainImageDelete}
              label="Foto Produk Utama"
              folder={activeCloudinaryFolder}
              required={true}
            />
            {errors.img && <p className="text-[11px] text-rose-400">{errors.img}</p>}

            {/* Foto Tambahan (HANYA MUNCUL JIKA MEMILIH KEYCHAIN) */}
            {isKeychain && (
              <div className="pt-3 border-t border-emerald-800/60 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider">
                    Khusus Keychain 2 Sisi
                  </span>
                </div>
                <CloudinaryWidget
                  value={formData.img_add}
                  onChange={handleSecondaryImageChange}
                  onDelete={handleSecondaryImageDelete}
                  label="Foto Tambahan Sisi Belakang (img_add)"
                  description="Khusus gantungan kunci akrilik 2 sisi: unggah foto untuk sisi belakang langsung dari perangkat."
                  folder="louifootball product/3. Keychains"
                  required={false}
                />
              </div>
            )}
          </div>

          {/* Section 3: Varian Ukuran & Harga (HANYA MUNCUL JIKA KATEGORI POSTER) */}
          {isPoster && (
            <div className="space-y-3 pt-2 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/60 pb-1.5">
                <h3 className="text-xs font-bold text-lime-400 tracking-wider uppercase flex items-center gap-1.5">
                  <ListPlus size={14} /> 3. Varian Ukuran & Harga Poster <span className="text-rose-400">*</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={applyPosterPreset}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-900/60 border border-purple-500/40 text-purple-200 hover:bg-purple-800 text-xs font-medium transition cursor-pointer"
                  >
                    <Sparkle size={13} />
                    <span>Gunakan Preset Poster (A3, A2, A1)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-800 text-emerald-100 hover:bg-emerald-700 text-xs font-semibold transition cursor-pointer border border-emerald-600/60"
                  >
                    <Plus size={13} weight="bold" />
                    <span>Tambah Varian</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-emerald-300/80">
                Tentukan harga untuk masing-masing ukuran poster seperti <strong className="text-lime-300">A3, A2, dan A1</strong>. Bagian ini wajib diisi minimal 1 ukuran dengan harga valid.
              </p>

              {errors.variants && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-semibold animate-in fade-in duration-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  <span>{errors.variants}</span>
                </div>
              )}

              <div className="space-y-2.5">
                {variantsList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-900/50 border border-emerald-700/50 text-xs"
                  >
                    <div className="w-1/3">
                      <label className="block text-[10px] text-emerald-400 mb-0.5">Ukuran / Varian</label>
                      <input
                        type="text"
                        value={item.size}
                        onChange={(e) => handleUpdateVariant(idx, 'size', e.target.value)}
                        placeholder="Contoh: A3"
                        className="w-full px-2.5 py-1.5 rounded bg-emerald-950 border border-emerald-700 text-white font-bold uppercase focus:outline-none focus:border-lime-400 text-xs"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] text-emerald-400 mb-0.5">Harga (Rp)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs text-lime-400 font-bold">Rp</span>
                        <input
                          type="text"
                          value={item.price}
                          onChange={(e) => handleUpdateVariant(idx, 'price', e.target.value)}
                          placeholder="250000"
                          className="w-full pl-8 pr-2.5 py-1.5 rounded bg-emerald-950 border border-emerald-700 text-white font-mono font-bold focus:outline-none focus:border-lime-400 text-xs"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="self-end mb-1 p-1.5 rounded text-rose-400 hover:bg-rose-950 hover:text-rose-300 transition cursor-pointer"
                      title="Hapus Varian"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* Modal Footer / Actions */}
          <div className="pt-4 border-t border-emerald-800/80 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={handleCancelAndClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 font-semibold text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 text-emerald-950 font-bold text-xs sm:text-sm shadow-lg hover:from-lime-300 hover:to-lime-400 transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Spinner size={16} className="animate-spin text-emerald-950" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={18} weight="bold" />
                  <span>{isEditing ? 'Simpan Perubahan' : 'Terbitkan Produk'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
