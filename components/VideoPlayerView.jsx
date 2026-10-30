'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  House,
  Tag,
  Sparkle,
  ShareNetwork,
  Check,
} from '@phosphor-icons/react';
import Footer from '@/components/Footer';

export default function VideoPlayerView({ product }) {
  const [copied, setCopied] = useState(false);

  if (!product || !product.qr_video) {
    return (
      <div className="min-h-screen bg-[#07130b] text-white flex flex-col justify-between font-sans antialiased">
        {/* Header */}
        <header className="max-w-md mx-auto w-full pt-4 pb-2 px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-emerald-500/40 shadow-md bg-emerald-900 shrink-0">
              <img
                src="https://res.cloudinary.com/og1jrvy3/image/upload/f_auto,q_auto,w_100/v1789010759/756654575_17897804865557650_2370756875670529296_n.jpg"
                alt="LOUIFOOTBALL"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-loui tracking-wider text-white">
                LOUI<span className="text-lime-400">FOOTBALL</span>
              </span>
              <span className="text-[8px] uppercase tracking-widest text-emerald-300 font-semibold">
                Official Video Showcase
              </span>
            </div>
          </Link>
        </header>

        {/* Content */}
        <main className="max-w-md mx-auto w-full text-center py-12 px-4 bg-emerald-950/60 border border-emerald-800/60 rounded-3xl backdrop-blur-md shadow-2xl my-auto">
          <div className="w-16 h-16 bg-emerald-900/80 border border-emerald-600/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-300">
            <Sparkle size={32} weight="duotone" />
          </div>
          <h1 className="text-xl font-loui text-white tracking-wide uppercase mb-2">
            Video Belum Tersedia
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 leading-relaxed mb-6">
            Video eksklusif untuk produk ini belum diunggah atau tautan tidak valid. Silakan kunjungi katalog resmi kami untuk melihat koleksi lainnya.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-lime-400 to-emerald-400 text-emerald-950 font-bold px-6 py-3 rounded-full text-sm shadow-lg hover:shadow-lime-400/20 hover:scale-[1.02] transition"
          >
            <House size={18} weight="bold" />
            <span>Lihat Halaman Katalog</span>
          </Link>
        </main>

        {/* Footer (Sama seperti Halaman Utama) */}
        <Footer />
      </div>
    );
  }

  const productName = product.player_name || product.title || 'Koleksi Loui Football';
  const categoryName = product.categories?.category || product.category || 'Merchandise';
  const teamYearText = [product.team, product.year].filter(Boolean).join(' • ');

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${productName} - LOUIFOOTBALL`,
          text: `Tonton video eksklusif ${productName} dari LOUIFOOTBALL!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // User cancelled share or clipboard error
    }
  };

  return (
    <div className="min-h-screen bg-[#061009] text-white flex flex-col justify-between font-sans antialiased selection:bg-lime-400 selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#061009]/80 backdrop-blur-md border-b border-emerald-900/60 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-emerald-500/40 shadow-md bg-emerald-900 shrink-0 group-hover:scale-105 transition">
              <img
                src="https://res.cloudinary.com/og1jrvy3/image/upload/f_auto,q_auto,w_100/v1789010759/756654575_17897804865557650_2370756875670529296_n.jpg"
                alt="LOUIFOOTBALL"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-loui tracking-wider text-white leading-none">
                LOUI<span className="text-lime-400">FOOTBALL</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-emerald-300 font-semibold mt-0.5">
                Authentic Video Showcase
              </span>
            </div>
          </Link>

          <button
            onClick={handleShare}
            type="button"
            className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-lime-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 px-3 py-1.5 rounded-full transition shadow cursor-pointer"
            title="Bagikan Tautan"
          >
            {copied ? (
              <>
                <Check size={14} weight="bold" className="text-lime-400" />
                <span className="text-lime-400 font-medium">Tersalin!</span>
              </>
            ) : (
              <>
                <ShareNetwork size={14} weight="bold" />
                <span>Bagikan</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-lg mx-auto w-full px-4 py-4 sm:py-6 flex-1 flex flex-col justify-center">
        {/* Video Card */}
        <div className="bg-emerald-950/70 border border-emerald-700/60 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
          {/* Badge Video Header */}
          <div className="bg-gradient-to-r from-emerald-900/90 via-emerald-800/90 to-emerald-900/90 px-4 py-2 border-b border-emerald-700/50 flex items-center justify-center text-xs">
            <span className="text-lime-400 font-semibold tracking-wider">
              LOUIFOOTBALL VIDEO
            </span>
          </div>

          {/* Video Player Box (Bawaan Device / Browser) */}
          <div className="relative bg-black select-none flex items-center justify-center min-h-[300px] max-h-[70vh]">
            <video
              src={product.qr_video}
              controls
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              playsInline
              onContextMenu={(e) => e.preventDefault()}
              className="w-full h-auto max-h-[70vh] object-contain select-none"
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            />
          </div>

          {/* Product Details Info */}
          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-900/80 text-emerald-200 border border-emerald-700/60">
                <Tag size={12} weight="bold" />
                {categoryName}
              </span>
              {teamYearText && (
                <span className="text-[11px] text-emerald-300/80 font-medium">
                  {teamYearText}
                </span>
              )}
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight mb-1">
              {productName}
            </h1>

            {product.edition && (
              <p className="text-xs text-lime-400 font-medium uppercase tracking-wider mb-3">
                ★ {product.edition}
              </p>
            )}

            {/* Tombol Menuju Halaman Utama */}
            <div className="pt-3 border-t border-emerald-800/60">
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-300 hover:to-lime-400 text-emerald-950 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm shadow-lg hover:shadow-lime-400/20 hover:scale-[1.01] active:scale-[0.99] transition text-center cursor-pointer"
              >
                <House size={18} weight="bold" />
                <span>Lihat Halaman Katalog</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer (Sama seperti Halaman Utama) */}
      <Footer />
    </div>
  );
}
