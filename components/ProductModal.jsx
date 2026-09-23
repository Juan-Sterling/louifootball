'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MagnifyingGlassPlus,
  Shield,
  CalendarBlank,
  WhatsappLogo,
  ShoppingBagOpen,
  Storefront,
  CheckCircle,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import { formatRupiah, parseVariants, WA_NUMBER } from '@/lib/utils';

export default function ProductModal({ product, isOpen, onClose, onOpenZoom }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImg, setActiveImg] = useState(product?.img || '');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset pilihan ukuran dan gambar aktif saat modal dibuka atau produk berganti
  useEffect(() => {
    setSelectedVariant(null);
    setActiveImg(product?.img || '');
  }, [product?.id, product?.img, isOpen]);

  if (!isOpen || !product) return null;

  const playerName = product.player_name ? String(product.player_name).trim() : '';
  const productTitle = product.title ? String(product.title).trim() : '';
  const productName = playerName || productTitle || 'Produk Loui';
  const variants = parseVariants(product.variants);

  // Status opsi gambar img & img_add
  const hasAddImg = Boolean(
    product.img_add &&
    String(product.img_add).trim() !== '' &&
    String(product.img_add).trim().toLowerCase() !== 'null' &&
    String(product.img_add).trim().toLowerCase() !== 'undefined'
  );
  const images = [product.img, hasAddImg ? product.img_add : null].filter(Boolean);
  const currentImg = (activeImg === product.img_add && hasAddImg) ? product.img_add : product.img;
  const currentImgIndex = currentImg === product.img_add ? 1 : 0;

  const isLimited = String(product.edition || '').trim().toUpperCase() === 'LIMITED';

  // Hitung display harga: jika edisi LIMITED, tulis 'LIMITED'.
  // Jika ada varian terpilih, gunakan harga varian.
  // Jika default (belum ada yang dipilih), tampilkan harga terendah - tertinggi.
  let displayPrice = '';
  if (isLimited) {
    displayPrice = 'LIMITED';
  } else if (selectedVariant) {
    displayPrice = formatRupiah(selectedVariant.price);
  } else if (variants && variants.length > 0) {
    const prices = variants.map((v) => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    displayPrice = minPrice === maxPrice
      ? formatRupiah(minPrice)
      : `${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}`;
  } else {
    displayPrice = formatRupiah(product.price);
  }

  const isNumericEdition = product.edition && !isNaN(product.edition);
  const editionText = product.edition
    ? isNumericEdition
      ? `(Edisi #${product.edition})`
      : `(Edisi ${product.edition})`
    : '';

  const variantWaText = selectedVariant
    ? `\nUkuran: ${selectedVariant.size} (${formatRupiah(selectedVariant.price)})`
    : variants && variants.length > 0
    ? `\nPilihan Ukuran: Tersedia ${variants.map((v) => v.size).join(', ')}`
    : '';

  const titleWaText = productTitle && productTitle !== playerName ? `\nJudul: ${productTitle}` : '';

  const rawTeam = product.team ? String(product.team).trim() : '';
  const isTeamValid = rawTeam && rawTeam.toLowerCase() !== 'null' && rawTeam.toLowerCase() !== 'undefined' && rawTeam !== '-';
  const teamText = isTeamValid ? rawTeam : '';

  const rawYear = product.year ? String(product.year).trim() : '';
  const isYearValid = rawYear && rawYear.toLowerCase() !== 'null' && rawYear.toLowerCase() !== 'undefined' && rawYear !== '-';
  const yearText = isYearValid ? rawYear : '';

  const teamYearParts = [];
  if (teamText) teamYearParts.push(`Tim/Klub: ${teamText}`);
  if (yearText) teamYearParts.push(`Musim: ${yearText}`);
  const teamYearWaText = teamYearParts.length > 0 ? `\n${teamYearParts.join('\n')}` : '';

  const isSoldOut = String(product.sold_out || '').trim().toUpperCase() === 'Y';

  const msg = isLimited
    ? encodeURIComponent(`Halo LOUIFOOTBALL, saya ingin bertanya tentang edisi koleksi terbatas:

*${productName}* ${editionText}${variantWaText}${titleWaText}${teamYearWaText}
Status: Edisi Limited (Koleksi / Tidak Dijual)`)
    : isSoldOut
    ? encodeURIComponent(`Halo LOUIFOOTBALL, saya ingin bertanya tentang stok produk:

*${productName}* ${editionText}${variantWaText}${titleWaText}${teamYearWaText}
Status: Sold Out

Apakah produk ini akan restock kembali?`)
    : encodeURIComponent(`Halo LOUIFOOTBALL, saya ingin memesan:

*${productName}* ${editionText}${variantWaText}${titleWaText}${teamYearWaText}
Harga: ${displayPrice}

Apakah stok masih ada?`);

  const waLink = `https://wa.me/${WA_NUMBER}?text=${msg}`;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Tombol Tutup Modal */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Tutup"
          className="absolute top-3 right-3 z-30 bg-black/60 hover:bg-black text-white w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition cursor-pointer active:scale-95"
        >
          <X size={18} weight="bold" />
        </button>

        {/* Showcase Gambar Penuh */}
        <div className="relative w-full bg-zinc-950 flex items-center justify-center p-4 min-h-[260px] max-h-[380px] sm:max-h-[420px] overflow-hidden border-b border-gray-200 select-none">
          {/* Badge Sold Out pada Gambar */}
          {isSoldOut && (
            <div className="absolute top-3 left-3 z-30 bg-red-600/90 border border-red-400/60 text-white font-black text-xs px-3 py-1 rounded-full shadow-lg tracking-wider uppercase">
              SOLD OUT
            </div>
          )}

          {/* Badge Counter Gambar (cth: 1/2) jika ada img_add */}
          {hasAddImg && (
            <div className={`absolute top-3 z-30 bg-black/65 backdrop-blur-md border border-white/20 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md ${
              isSoldOut ? 'left-28' : 'left-3'
            }`}>
              <span className="text-lime-300 font-black">{currentImgIndex + 1}</span>
              <span className="text-white/40">/</span>
              <span>{images.length}</span>
            </div>
          )}

          {/* Tombol Panah Kiri / Kanan jika ada lebih dari 1 gambar */}
          {hasAddImg && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImg(images[currentImgIndex === 0 ? 1 : 0]);
                }}
                aria-label="Gambar Sebelumnya"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur-sm transition cursor-pointer shadow active:scale-95 border border-white/10"
              >
                <CaretLeft size={18} weight="bold" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImg(images[currentImgIndex === 0 ? 1 : 0]);
                }}
                aria-label="Gambar Berikutnya"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur-sm transition cursor-pointer shadow active:scale-95 border border-white/10"
              >
                <CaretRight size={18} weight="bold" />
              </button>
            </>
          )}

          {/* Gambar Produk Aktif */}
          <img
            src={currentImg}
            alt={productName}
            onClick={() => onOpenZoom(currentImg, productName)}
            title="Klik untuk memperbesar gambar"
            className="w-full h-full max-h-[360px] sm:max-h-[400px] object-contain drop-shadow-md rounded-lg cursor-zoom-in hover:scale-[1.01] transition duration-200"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/600x600/225717/ffffff?text=Loui';
            }}
          />

          {/* Thumbnails Opsi Gambar (img & img_add) di sudut kiri bawah showcase */}
          {hasAddImg && (
            <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-lg">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImg(product.img);
                }}
                title="1"
                className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition cursor-pointer shrink-0 bg-zinc-900 ${
                  currentImg === product.img
                    ? 'border-lime-400 scale-105 shadow-md ring-1 ring-lime-400/50'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={product.img} alt="1" className="w-full h-full object-cover" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImg(product.img_add);
                }}
                title="2"
                className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition cursor-pointer shrink-0 bg-zinc-900 ${
                  currentImg === product.img_add
                    ? 'border-lime-400 scale-105 shadow-md ring-1 ring-lime-400/50'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={product.img_add} alt="2" className="w-full h-full object-cover" />
              </button>
            </div>
          )}

          {/* Tombol Buka Resolusi Penuh */}
          <button
            onClick={() => onOpenZoom(currentImg, productName)}
            type="button"
            className="absolute bottom-3 right-3 bg-black/75 hover:bg-lime-400 hover:text-emerald-950 text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm transition shadow cursor-pointer active:scale-95"
          >
            <MagnifyingGlassPlus size={16} weight="bold" />
            <span>Buka Resolusi Penuh</span>
          </button>
        </div>

        {/* Opsi Pilihan Gambar (1 & 2) */}
        {hasAddImg && (
          <div className="bg-emerald-950/[0.04] border-b border-gray-100 px-4 sm:px-5 py-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveImg(product.img)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                currentImg === product.img
                  ? 'bg-emerald-950 text-lime-300 border-emerald-950 shadow-sm ring-2 ring-lime-400'
                  : 'bg-white text-gray-700 hover:bg-emerald-50 border-gray-200'
              }`}
            >
              <span className="w-5 h-5 rounded-md overflow-hidden bg-black/10 shrink-0 border border-black/10 flex items-center justify-center">
                <img src={product.img} alt="1" className="w-full h-full object-cover" />
              </span>
              <span>1</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveImg(product.img_add)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                currentImg === product.img_add
                  ? 'bg-emerald-950 text-lime-300 border-emerald-950 shadow-sm ring-2 ring-lime-400'
                  : 'bg-white text-gray-700 hover:bg-emerald-50 border-gray-200'
              }`}
            >
              <span className="w-5 h-5 rounded-md overflow-hidden bg-black/10 shrink-0 border border-black/10 flex items-center justify-center">
                <img src={product.img_add} alt="2" className="w-full h-full object-cover" />
              </span>
              <span>2</span>
            </button>
          </div>
        )}

        {/* Area Detail Informasi Produk */}
        <div className="p-5 overflow-y-auto">
          {/* Badges Baris Atas */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider bg-emerald-100 px-2.5 py-0.5 rounded-md">
                {product.category}
              </span>
              {product.edition && (
                <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-200">
                  {isNumericEdition ? `Edisi #${product.edition}` : `Edisi ${product.edition}`}
                </span>
              )}
            </div>
          </div>

          {/* Judul Produk / Nama Pemain */}
          <h2 className="text-xl sm:text-2xl font-loui font-bold text-gray-950 mt-2.5 leading-tight tracking-wide">
            {productName}
          </h2>

          {/* Kolom Title (Hanya muncul jika ada dan berbeda dengan judul utama agar tidak duplikat) */}
          {productTitle && productTitle.toLowerCase() !== productName.toLowerCase() && (
            <p className="text-xs sm:text-sm font-semibold text-emerald-800/90 mt-1">
              {productTitle}
            </p>
          )}

          {/* Info Tim & Tahun Produk (Hanya tampil jika ada/valid) */}
          {(teamText || yearText) && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {teamText && (
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-950 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold shadow-sm">
                  <Shield size={14} weight="bold" className="text-emerald-700" />
                  <span>{teamText}</span>
                </div>
              )}
              {yearText && (
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-950 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold shadow-sm">
                  <CalendarBlank size={14} weight="bold" className="text-emerald-700" />
                  <span>{yearText}</span>
                </div>
              )}
            </div>
          )}

          {/* Harga & Status Stok */}
          <div className="flex items-center gap-3 mt-2.5">
            <p className={`text-xl sm:text-2xl font-black ${isLimited ? 'text-amber-600 tracking-wider' : 'text-emerald-800'}`}>
              {displayPrice}
            </p>
            {isLimited && (
              <span className="px-2.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 text-xs font-black rounded-md uppercase tracking-wider">
                Edisi Koleksi (Tidak Dijual)
              </span>
            )}
            {isSoldOut && !isLimited && (
              <span className="px-2.5 py-0.5 bg-red-100 border border-red-300 text-red-700 text-xs font-black rounded-md uppercase tracking-wider">
                Stok Habis
              </span>
            )}
          </div>

          {/* Selector Pilihan Ukuran / Varian (cth: Poster A3, A2, A1) */}
          {variants && variants.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Pilihan Ukuran</span>
                  {selectedVariant ? (
                    <span className="text-emerald-700 font-bold normal-case text-xs">
                      : Ukuran {selectedVariant.size} ({formatRupiah(selectedVariant.price)})
                    </span>
                  ) : (
                    <span className="text-gray-400 font-normal normal-case text-[11px]">
                      (Klik untuk pilih ukuran)
                    </span>
                  )}
                </span>
                {selectedVariant && (
                  <button
                    type="button"
                    onClick={() => setSelectedVariant(null)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
                  >
                    Reset Harga
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {variants.map((v) => {
                  const isSelected = selectedVariant?.size === v.size;
                  return (
                    <button
                      key={v.size}
                      type="button"
                      onClick={() => setSelectedVariant(isSelected ? null : v)}
                      className={`py-2 px-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center relative ${
                        isSelected
                          ? 'bg-emerald-950 border-emerald-950 text-white shadow-md ring-2 ring-lime-400'
                          : 'bg-emerald-50/50 hover:bg-emerald-100/70 border-emerald-200 text-emerald-950 hover:border-emerald-400'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-1 right-1 text-lime-400">
                          <CheckCircle size={13} weight="fill" />
                        </span>
                      )}
                      <span className={`text-xs sm:text-sm font-black ${isSelected ? 'text-lime-300' : 'text-emerald-950'}`}>
                        Ukuran {v.size}
                      </span>
                      <span className={`text-[10px] sm:text-[11px] font-bold mt-0.5 ${isSelected ? 'text-emerald-200' : 'text-emerald-700'}`}>
                        {formatRupiah(v.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Deskripsi */}
          <p className="text-gray-600 text-xs sm:text-sm mt-3 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
            {product.desc || 'Merchandise resmi sepak bola berkualitas dari LOUIFOOTBALL.'}
          </p>

          {/* Info Khusus Edisi Limited */}
          {isLimited && (
            <div className="bg-amber-50 border border-amber-200/90 text-amber-900 text-xs rounded-xl p-3 flex items-start gap-2.5 mt-3">
              <span className="text-base leading-none">⭐</span>
              <div>
                <p className="font-bold">Edisi Koleksi Terbatas (Not For Sale)</p>
                <p className="text-[11px] text-amber-800/90 mt-0.5">
                  Produk ini merupakan rilisan edisi LIMITED khusus koleksi dan tidak dijual di online shop / marketplace.
                </p>
              </div>
            </div>
          )}

          {/* Opsi Pembelian */}
          <div className="mt-5 space-y-2">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-md transition cursor-pointer ${
                isLimited
                  ? 'bg-zinc-800 hover:bg-zinc-900 text-amber-300'
                  : isSoldOut
                  ? 'bg-zinc-800 hover:bg-zinc-900 text-lime-300'
                  : 'bg-emerald-800 hover:bg-emerald-900 text-lime-300'
              }`}
            >
              <WhatsappLogo size={20} weight="bold" className="text-green-400" />
              <span>
                {isLimited
                  ? 'Tanya Info via WhatsApp'
                  : isSoldOut
                  ? 'Tanya Restock via WhatsApp'
                  : selectedVariant
                  ? `Order Ukuran ${selectedVariant.size} via WhatsApp`
                  : 'Order via WhatsApp'}
              </span>
            </a>

            {/* Shopee & Tokopedia (Non-aktif jika Limited atau Sold Out) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {isLimited ? (
                <div
                  aria-disabled="true"
                  title="Produk edisi Limited tidak dijual di Shopee"
                  className="bg-gray-100 border border-gray-200 text-gray-400 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-not-allowed opacity-60 select-none"
                >
                  <ShoppingBagOpen size={16} weight="bold" className="text-gray-400" />
                  <span>Shopee (Tidak Dijual)</span>
                </div>
              ) : isSoldOut ? (
                <div
                  aria-disabled="true"
                  title="Produk telah habis terjual (Sold Out)"
                  className="bg-gray-100 border border-gray-200 text-gray-400 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-not-allowed opacity-60 select-none"
                >
                  <ShoppingBagOpen size={16} weight="bold" className="text-gray-400" />
                  <span>Shopee (Habis)</span>
                </div>
              ) : (
                <a
                  href="https://id.shp.ee/a5f6X4Wq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs transition cursor-pointer"
                >
                  <ShoppingBagOpen size={16} weight="bold" />
                  <span>Shopee Store</span>
                </a>
              )}

              {isLimited ? (
                <div
                  aria-disabled="true"
                  title="Produk edisi Limited tidak dijual di Tokopedia"
                  className="bg-gray-100 border border-gray-200 text-gray-400 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-not-allowed opacity-60 select-none"
                >
                  <Storefront size={16} weight="bold" className="text-gray-400" />
                  <span>Tokopedia (Tidak Dijual)</span>
                </div>
              ) : isSoldOut ? (
                <div
                  aria-disabled="true"
                  title="Produk telah habis terjual (Sold Out)"
                  className="bg-gray-100 border border-gray-200 text-gray-400 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-not-allowed opacity-60 select-none"
                >
                  <Storefront size={16} weight="bold" className="text-gray-400" />
                  <span>Tokopedia (Habis)</span>
                </div>
              ) : (
                <a
                  href="https://tk.tokopedia.com/ZSqEjQvMt/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs transition cursor-pointer"
                >
                  <Storefront size={16} weight="bold" />
                  <span>Tokopedia</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
