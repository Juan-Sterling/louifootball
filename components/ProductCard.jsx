'use client';

import React from 'react';
import { formatRupiah, getCategoryBadgeStyle } from '@/lib/utils';

export default function ProductCard({ product, onOpenModal }) {
  const badgeColor = getCategoryBadgeStyle(product.category);
  const productName = product.player_name || product.title || 'Produk Loui';
  const editionText = product.edition ? `Edisi #${product.edition}` : '';

  // Format Tim dan Tahun
  const teamText = product.team ? String(product.team).trim() : '';
  const yearText = product.year ? String(product.year).trim() : '';
  const teamYearParts = [];
  if (teamText) teamYearParts.push(teamText);
  if (yearText) teamYearParts.push(yearText);
  const teamYearDisplay = teamYearParts.join(' • ');

  const formattedPrice = formatRupiah(product.price);

  return (
    <div className="bg-white rounded-2xl p-3 flex flex-col justify-between hover:shadow-2xl transition duration-150 border-2 border-transparent hover:border-lime-400">
      <div>
        {/* Gambar Produk */}
        <div
          onClick={() => onOpenModal(product)}
          className="relative aspect-square rounded-xl bg-emerald-50 overflow-hidden mb-2.5 cursor-pointer group"
        >
          <span className={`absolute top-2 left-2 ${badgeColor} text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded shadow capitalize z-10`}>
            {product.category}
          </span>
          <img
            src={product.img}
            alt={productName}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/400x400/225717/ffffff?text=Loui';
            }}
          />
        </div>

        {/* Edisi */}
        {editionText ? (
          <p className="text-[10px] font-black text-amber-700 tracking-wider uppercase">
            {editionText}
          </p>
        ) : (
          <p className="text-[10px] font-black text-transparent select-none uppercase">-</p>
        )}

        {/* Nama Pemain / Produk */}
        <h3
          onClick={() => onOpenModal(product)}
          className="font-bold text-xs sm:text-sm text-gray-900 leading-snug line-clamp-2 mt-0.5 cursor-pointer hover:text-emerald-700 transition"
        >
          {productName}
        </h3>

        {/* Tim dan Tahun */}
        {teamYearDisplay ? (
          <p className="text-[11px] text-gray-500 mt-1 truncate font-medium" title={teamYearDisplay}>
            {teamYearDisplay}
          </p>
        ) : (
          <p className="text-[11px] text-transparent mt-1 select-none">-</p>
        )}
      </div>

      {/* Harga dan Tombol Detail */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <p className="text-emerald-950 font-black text-sm sm:text-base">{formattedPrice}</p>
        <button
          onClick={() => onOpenModal(product)}
          type="button"
          className="w-full mt-2 bg-emerald-800 hover:bg-emerald-900 text-lime-300 text-xs font-bold py-1.5 sm:py-2 rounded-xl transition cursor-pointer"
        >
          Lihat Detail
        </button>
      </div>
    </div>
  );
}
