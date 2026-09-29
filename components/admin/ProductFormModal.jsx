'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash,
  CheckCircle,
  Spinner,
  Tag,
  CurrencyDollar,
  ListPlus,
  Code,
  Sparkle,
  Info,
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

  // Variants State
  const [variantsList, setVariantsList] = useState([]);
  const [variantMode, setVariantMode] = useState('visual'); // 'visual' or 'json'
  const [variantsJsonText, setVariantsJsonText] = useState('[]');
  const [jsonError, setJsonError] = useState('');

  // Status and submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Category info for spec, desc, and Cloudinary folder
  const selectedCategory = categories.find((c) => String(c.id) === String(formData.category_id));
  const isKeychain =
    String(formData.category_id) === '3' ||
    (selectedCategory?.category || '').toLowerCase().includes('keychain') ||
    (selectedCategory?.category || '').toLowerCase().includes('kunci');
  const activeCloudinaryFolder = getCloudinaryFolderByCategory(formData.category_id, selectedCategory?.category);

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
            'Foto belum terhapus dari Cloudinary: Buka "Opsi Cloudinary" dan masukkan API Key & Secret, atau atur di .env.local.',
            'warning',
            5500
          );
        } else {
          console.warn('Gagal menghapus gambar di Cloudinary:', data.error || data.message);
        }
      } else {
        showToast('Foto berhasil dihapus dari Cloudinary.', 'info', 2500);
      }
    } catch (err) {
      console.warn('Gagal menghapus gambar di Cloudinary:', err);
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

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    sessionUploadedImages.current.clear();

    if (productToEdit) {
      setFormData({
        title: productToEdit.title || '',
        player_name: productToEdit.player_name || productToEdit.title || '',
        team: productToEdit.team || '',
        category_id: productToEdit.category_id ? String(productToEdit.category_id) : (categories[0]?.id ? String(categories[0].id) : '1'),
        price: productToEdit.price !== undefined && productToEdit.price !== null ? String(productToEdit.price) : '',
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
        setVariantsJsonText(JSON.stringify(parsed, null, 2));
      } else {
        setVariantsList([]);
        setVariantsJsonText('[]');
      }
    } else {
      // New product defaults
      const defaultCatId = categories[0]?.id ? String(categories[0].id) : '1';
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
      setVariantsJsonText('[]');
    }

    setErrors({});
    setJsonError('');
    setVariantMode('visual');
  }, [isOpen, productToEdit, categories]);

  // Sync category change for posters default variants
  const handleCategoryChange = (e) => {
    const newCatId = e.target.value;
    setFormData((prev) => ({ ...prev, category_id: newCatId }));

    // If changing to Poster (id: 4) and variants are empty, suggest default poster variants
    const chosenCat = categories.find((c) => String(c.id) === String(newCatId));
    const isPoster = chosenCat && (chosenCat.category?.toLowerCase().includes('poster') || String(newCatId) === '4');

    if (isPoster && variantsList.length === 0) {
      const defaultPosterVariants = [
        { size: 'A3', price: 250000 },
        { size: 'A2', price: 325000 },
        { size: 'A1', price: 400000 },
      ];
      setVariantsList(defaultPosterVariants);
      setVariantsJsonText(JSON.stringify(defaultPosterVariants, null, 2));
      if (!formData.price || formData.price === '10000') {
        setFormData((prev) => ({ ...prev, price: '250000' }));
      }
    }
  };

  // Variant Visual List Handlers
  const handleAddVariant = () => {
    const updated = [...variantsList, { size: '', price: Number(formData.price) || 0 }];
    setVariantsList(updated);
    setVariantsJsonText(JSON.stringify(updated, null, 2));
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
    setVariantsJsonText(JSON.stringify(updated, null, 2));
  };

  const handleRemoveVariant = (index) => {
    const updated = variantsList.filter((_, i) => i !== index);
    setVariantsList(updated);
    setVariantsJsonText(JSON.stringify(updated, null, 2));
  };

  const applyPosterPreset = () => {
    const defaultPosterVariants = [
      { size: 'A3', price: 250000 },
      { size: 'A2', price: 325000 },
      { size: 'A1', price: 400000 },
    ];
    setVariantsList(defaultPosterVariants);
    setVariantsJsonText(JSON.stringify(defaultPosterVariants, null, 2));
    setJsonError('');
    showToast('Preset varian poster (A3, A2, A1) berhasil diterapkan', 'info');
  };

  // Sync JSON text change
  const handleJsonTextChange = (e) => {
    const val = e.target.value;
    setVariantsJsonText(val);

    try {
      if (!val.trim()) {
        setVariantsList([]);
        setJsonError('');
        return;
      }
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) {
        setJsonError('Format JSON harus berupa Array / Daftar Objek, contoh: [{"size": "A3", "price": 250000}]');
        return;
      }
      setVariantsList(parsed);
      setJsonError('');
    } catch (err) {
      setJsonError(`JSON tidak valid: ${err.message}`);
    }
  };

  // Format / Prettify JSON
  const handlePrettifyJson = () => {
    try {
      const parsed = JSON.parse(variantsJsonText);
      setVariantsJsonText(JSON.stringify(parsed, null, 2));
      setJsonError('');
    } catch {
      // ignore
    }
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
    const cleanPrice = parseInt(String(formData.price).replace(/[^0-9]/g, ''), 10);
    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      newErrors.price = 'Harga produk harus lebih dari 0.';
    }
    if (!formData.img.trim()) {
      newErrors.img = 'Unggah atau masukkan URL gambar produk.';
    }

    if (jsonError) {
      newErrors.variants = 'Format JSON varian masih terdapat kesalahan.';
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
      // Determine final variants
      let finalVariants = null;
      if (variantMode === 'json') {
        if (variantsJsonText.trim()) {
          try {
            const parsed = JSON.parse(variantsJsonText);
            if (Array.isArray(parsed) && parsed.length > 0) {
              finalVariants = parsed;
            }
          } catch {
            throw new Error('Format JSON varian tidak valid.');
          }
        }
      } else {
        const cleaned = variantsList.filter((v) => v.size && v.price > 0);
        if (cleaned.length > 0) {
          finalVariants = cleaned;
        }
      }

      const numericPrice = parseInt(String(formData.price).replace(/[^0-9]/g, ''), 10) || 0;
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
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg bg-emerald-950 border ${
                    errors.category_id ? 'border-rose-500' : 'border-emerald-700/80'
                  } text-white focus:outline-none focus:border-lime-400 font-bold cursor-pointer`}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-emerald-950 text-white font-medium">
                      {c.category?.toUpperCase()}
                    </option>
                  ))}
                </select>
                {errors.category_id && <p className="text-[11px] text-rose-400 mt-1">{errors.category_id}</p>}
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
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg bg-emerald-900/60 border ${
                    errors.title ? 'border-rose-500' : 'border-emerald-700/60'
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

              {/* Harga Dasar */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1">
                  Harga Satuan (Rp) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-lime-400 font-bold">Rp</span>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => {
                      const num = e.target.value.replace(/[^0-9]/g, '');
                      setFormData((prev) => ({ ...prev, price: num }));
                    }}
                    placeholder="10000"
                    className={`w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-lg bg-emerald-900/60 border ${
                      errors.price ? 'border-rose-500' : 'border-emerald-700/60'
                    } text-white font-mono font-bold focus:outline-none focus:border-lime-400`}
                  />
                </div>
                <span className="text-[10px] text-emerald-400/80 mt-1 block">
                  Format: {formatRupiah(formData.price || 0)}
                </span>
                {errors.price && <p className="text-[11px] text-rose-400 mt-1">{errors.price}</p>}
              </div>

              {/* Edisi */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1">
                  Edisi Produk
                </label>
                <input
                  type="text"
                  value={formData.edition}
                  onChange={(e) => setFormData((prev) => ({ ...prev, edition: e.target.value }))}
                  placeholder="Contoh: 1, 12, atau Special"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-600/50 focus:outline-none focus:border-lime-400 font-medium"
                />
              </div>

              {/* Tahun Rilis */}
              <div>
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
                    : 'Produk saat ini berstatus NORMAL (Tersedia untuk dipesan).'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, sold_out: !prev.sold_out }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.sold_out ? 'bg-rose-500' : 'bg-emerald-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.sold_out ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
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

          {/* Section 3: Varian Ukuran & Harga (Khusus Poster) */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/60 pb-1.5">
              <h3 className="text-xs font-bold text-lime-400 tracking-wider uppercase flex items-center gap-1.5">
                <ListPlus size={14} /> 3. Varian Produk (Ukuran & Harga)
              </h3>
              <div className="flex items-center gap-1 bg-emerald-950 p-0.5 rounded-lg border border-emerald-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setVariantMode('visual')}
                  className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                    variantMode === 'visual' ? 'bg-lime-400 text-emerald-950 font-bold' : 'text-emerald-300 hover:text-white'
                  }`}
                >
                  Form Terpisah
                </button>
                <button
                  type="button"
                  onClick={() => setVariantMode('json')}
                  className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                    variantMode === 'json' ? 'bg-lime-400 text-emerald-950 font-bold' : 'text-emerald-300 hover:text-white'
                  }`}
                >
                  Teks JSON
                </button>
              </div>
            </div>

            <p className="text-[11px] text-emerald-300/80">
              Digunakan khusus untuk produk dengan beberapa pilihan ukuran seperti <strong className="text-lime-300">Poster (A3, A2, A1)</strong> atau kaos. Kosongkan jika produk hanya memiliki satu harga tunggal.
            </p>

            {variantMode === 'visual' ? (
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
                      <input
                        type="text"
                        value={item.price}
                        onChange={(e) => handleUpdateVariant(idx, 'price', e.target.value)}
                        placeholder="250000"
                        className="w-full px-2.5 py-1.5 rounded bg-emerald-950 border border-emerald-700 text-white font-mono font-bold focus:outline-none focus:border-lime-400 text-xs"
                      />
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

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 text-emerald-100 hover:bg-emerald-700 text-xs font-semibold transition cursor-pointer"
                  >
                    <Plus size={14} weight="bold" />
                    <span>Tambah Varian Ukuran</span>
                  </button>

                  <button
                    type="button"
                    onClick={applyPosterPreset}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/60 border border-purple-500/40 text-purple-200 hover:bg-purple-800 text-xs font-medium transition cursor-pointer"
                  >
                    <Sparkle size={14} />
                    <span>Gunakan Preset Poster (A3, A2, A1)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-emerald-400">
                  <span className="flex items-center gap-1">
                    <Code size={14} /> Format JSON Varian
                  </span>
                  <button
                    type="button"
                    onClick={handlePrettifyJson}
                    className="text-lime-300 hover:underline cursor-pointer"
                  >
                    Rapikan / Prettify
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={variantsJsonText}
                  onChange={handleJsonTextChange}
                  placeholder={`[\n  { "size": "A3", "price": 250000 },\n  { "size": "A2", "price": 325000 }\n]`}
                  className={`w-full p-3 font-mono text-xs rounded-lg bg-emerald-950 border ${
                    jsonError ? 'border-rose-500' : 'border-emerald-700/70'
                  } text-emerald-100 focus:outline-none focus:border-lime-400`}
                />
                {jsonError ? (
                  <p className="text-[11px] text-rose-400">{jsonError}</p>
                ) : (
                  <p className="text-[10px] text-emerald-400/70">
                    Sintaks valid: Array berisi objek dengan key &quot;size&quot; dan &quot;price&quot;.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Section 4: Spesifikasi & Deskripsi Info */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-lime-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-emerald-800/60 pb-1.5">
              <Info size={14} /> 4. Spesifikasi & Deskripsi Kategori
            </h3>

            <div className="p-3 rounded-lg bg-emerald-900/40 border border-emerald-700/40 space-y-2 text-xs">
              <div className="flex items-center justify-between text-emerald-200">
                <span className="font-semibold text-lime-300">
                  Kategori: {selectedCategory?.category?.toUpperCase() || '-'}
                </span>
                <span className="text-[10px] text-emerald-400">Bawaan Template</span>
              </div>
              <div>
                <span className="text-[11px] text-emerald-400 font-semibold block">Spesifikasi Material:</span>
                <p className="text-emerald-100 text-xs italic">
                  {selectedCategory?.spec || 'Vinyl Waterproof / Standar Koleksi Resmi'}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-emerald-400 font-semibold block">Deskripsi Standar:</span>
                <p className="text-emerald-100 text-xs leading-relaxed">
                  {selectedCategory?.desc || 'Merchandise resmi sepak bola berkualitas dari LOUIFOOTBALL.'}
                </p>
              </div>
            </div>
          </div>

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
