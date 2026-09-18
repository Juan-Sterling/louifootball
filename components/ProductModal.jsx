'use client';

import React, { useEffect } from 'react';
import {
  X,
  MagnifyingGlassPlus,
  Shield,
  CalendarBlank,
  WhatsappLogo,
  ShoppingBagOpen,
  Storefront,
} from '@phosphor-icons/react';
import { formatRupiah, WA_NUMBER } from '@/lib/utils';

export default function ProductModal({ product, isOpen, onClose, onOpenZoom }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const playerName = product.player_name ? String(product.player_name).trim() : '';
  const productTitle = product.title ? String(product.title).trim() : '';
  const productName = playerName || productTitle || 'Produk Loui';
  const displayPrice = formatRupiah(product.price);
  const editionText = product.edition ? `(Edisi #${product.edition})` : '';

  const titleWaText = productTitle && productTitle !== playerName ? `\nJudul: ${productTitle}` : '';

  const teamYearParts = [];
  if (product.team && String(product.team).trim()) teamYearParts.push(`Tim/Klub: ${product.team.trim()}`);
  if (product.year && String(product.year).trim()) teamYearParts.push(`Musim: ${product.year.trim()}`);
  const teamYearWaText = teamYearParts.length > 0 ? `\n${teamYearParts.join('\n')}` : '';

  const msg = encodeURIComponent(`Halo LOUIFOOTBALL, saya ingin memesan:

*${productName}* ${editionText}${titleWaText}${teamYearWaText}
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
        <div className="relative w-full bg-zinc-950 flex items-center justify-center p-4 min-h-[260px] max-h-[380px] sm:max-h-[420px] overflow-hidden border-b border-gray-200">
          <img
            src={product.img}
            alt={productName}
            onClick={() => onOpenZoom(product.img, productName)}
            title="Klik untuk memperbesar gambar"
            className="w-full h-full max-h-[360px] sm:max-h-[400px] object-contain drop-shadow-md rounded-lg cursor-zoom-in hover:scale-[1.01] transition duration-200"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/600x600/225717/ffffff?text=Loui';
            }}
          />

          <button
            onClick={() => onOpenZoom(product.img, productName)}
            type="button"
            className="absolute bottom-3 right-3 bg-black/75 hover:bg-lime-400 hover:text-emerald-950 text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm transition shadow cursor-pointer active:scale-95"
          >
            <MagnifyingGlassPlus size={16} weight="bold" />
            <span>Buka Resolusi Penuh</span>
          </button>
        </div>

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
                  Edisi #{product.edition}
                </span>
              )}
            </div>
          </div>

          {/* Judul Produk / Nama Pemain */}
          <h2 className="text-lg sm:text-xl font-black text-gray-950 mt-2.5 leading-tight">
            {productName}
          </h2>

          {/* Kolom Title (Muncul jika ada dan tidak kosong) */}
          {product.title && String(product.title).trim() && (
            <p className="text-xs sm:text-sm font-semibold text-emerald-800/90 mt-1">
              {String(product.title).trim()}
            </p>
          )}

          {/* Info Tim & Tahun Produk (Menggantikan Spec) */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {product.team && (
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-950 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold shadow-sm">
                <Shield size={14} weight="bold" className="text-emerald-700" />
                <span>{product.team}</span>
              </div>
            )}
            {product.year && (
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-950 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold shadow-sm">
                <CalendarBlank size={14} weight="bold" className="text-emerald-700" />
                <span>{product.year}</span>
              </div>
            )}
          </div>

          {/* Harga */}
          <p className="text-2xl font-black text-emerald-800 mt-2.5">{displayPrice}</p>

          {/* Deskripsi */}
          <p className="text-gray-600 text-xs sm:text-sm mt-3 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
            {product.desc || 'Merchandise resmi sepak bola berkualitas dari LOUIFOOTBALL.'}
          </p>

          {/* Opsi Pembelian */}
          <div className="mt-5 space-y-2">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-lime-300 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-md transition cursor-pointer"
            >
              <WhatsappLogo size={20} weight="bold" className="text-green-400" />
              <span>Order via WhatsApp</span>
            </a>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href="https://shopee.co.id"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs transition"
              >
                <ShoppingBagOpen size={16} weight="bold" />
                <span>Shopee Store</span>
              </a>

              <a
                href="https://tokopedia.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs transition"
              >
                <Storefront size={16} weight="bold" />
                <span>Tokopedia</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
