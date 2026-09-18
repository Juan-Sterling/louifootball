'use client';

import React from 'react';
import ProductCard from './ProductCard';
import { SoccerBall } from '@phosphor-icons/react';

export default function ProductGrid({ products, isLoading, onOpenModal }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Loading Spinner & Info */}
        <div className="col-span-full py-10 flex flex-col items-center justify-center text-center">
          <div className="relative w-16 h-16 mb-3 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-600/30 border-t-lime-400 animate-spin"></div>
            <img
              src="https://res.cloudinary.com/og1jrvy3/image/upload/f_auto,q_auto,w_100/v1789010759/756654575_17897804865557650_2370756875670529296_n.jpg"
              alt="Loading LOUIFOOTBALL"
              className="w-10 h-10 rounded-xl object-cover shadow-md"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/100x100/225717/ffffff?text=Loui';
              }}
            />
          </div>
          <p className="text-sm font-bold text-white tracking-wide">Memuat Katalog Produk...</p>
          <p className="text-xs text-emerald-200/80 mt-1">Mengambil koleksi terbaru dari database</p>
        </div>

        {/* Skeleton Cards Shimmer */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="bg-white/95 rounded-2xl p-3 flex flex-col justify-between border-2 border-emerald-800/30 animate-pulse shadow"
          >
            <div>
              <div className="aspect-square rounded-xl bg-emerald-950/10 mb-2.5 flex items-center justify-center">
                <SoccerBall size={32} className="animate-spin text-emerald-800/20" />
              </div>
              <div className="h-3 bg-emerald-950/10 rounded-full w-1/3 mb-2"></div>
              <div className="h-4 bg-emerald-950/15 rounded-full w-4/5 mb-1.5"></div>
              <div className="h-3 bg-emerald-950/10 rounded-full w-1/2 mb-3"></div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="h-4 bg-emerald-950/20 rounded-full w-2/5 mb-2"></div>
              <div className="h-8 bg-emerald-900/20 rounded-xl w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-16 h-16 bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-400">
          <SoccerBall size={32} />
        </div>
        <p className="text-base font-bold text-white">Produk tidak ditemukan</p>
        <p className="text-xs text-emerald-200/80 mt-1">Coba kata kunci pencarian lain atau pilih kategori berbeda.</p>
      </div>
    );
  }

  return (
    <div id="productGrid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onOpenModal={onOpenModal} />
      ))}
    </div>
  );
}
