'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CaretLeft, CaretRight, ArrowDown, SoccerBall } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { WA_NUMBER } from '@/lib/utils';

const FALLBACK_PROMOTIONS = [
  {
    id: 1,
    badge_main: "NEW RELEASE",
    badge_sub: "Edisi Terbatas",
    badge_color: "lime",
    title: "Stickers Edisi #12 Special World Cup 26",
    desc: "Koleksi edisi Piala Dunia 2026 dari LOUIFOOTBALL. Vinyl tebal anti air & tahan gores!",
    img: "https://res.cloudinary.com/og1jrvy3/image/upload/f_auto,q_auto,w_500/v1789012817/id-11134207-822wj-mpgrp31qsw7j64.webp",
    action_type: "edition",
    action_target: "12",
    btn_text: "Lihat di Katalog",
    sort_order: 1,
    is_active: true
  },
  {
    id: 2,
    badge_main: "POPULAR",
    badge_sub: "Akrilik HD",
    badge_color: "amber",
    title: "Gantungan Kunci Bintang Bola Dunia",
    desc: "Bahan akrilik premium 3mm cetak 2 sisi tajam dengan ring gantungan anti-karat. Bikin tas & kuncimu makin keren!",
    img: "https://res.cloudinary.com/og1jrvy3/image/upload/f_auto,q_auto,w_500/v1789010435/id-11134207-8224p-mhun2zrqdkp0af.webp",
    action_type: "category",
    action_target: "keychain",
    btn_text: "Lihat Koleksi Keychain",
    sort_order: 2,
    is_active: true
  },
  {
    id: 3,
    badge_main: "COLLECTOR",
    badge_sub: "Art Carton 260gr",
    badge_color: "purple",
    title: "Poster Estetik GOAT & Football Icons",
    desc: "Dekorasi dinding kamar dengan momen ikonik pesepak bola dunia. Kualitas cetak studio gallery tahan pudar!",
    img: "https://res.cloudinary.com/og1jrvy3/image/upload/f_auto,q_auto,w_500/v1789010178/545040561_17848000446557650_323288529526384965_n.jpg",
    action_type: "category",
    action_target: "poster",
    btn_text: "Lihat Koleksi Poster",
    sort_order: 3,
    is_active: true
  }
];

function getPromoTheme(color) {
  const c = (color || 'lime').toLowerCase().trim();
  switch (c) {
    case 'amber':
    case 'yellow':
    case 'orange':
      return {
        badgeMain: 'bg-amber-400 text-amber-950 font-black',
        badgeSub: 'bg-amber-950/80 text-amber-200 border border-amber-500/40',
        btn: 'bg-amber-400 sm:hover:bg-amber-300 active:bg-amber-500 text-amber-950',
      };
    case 'purple':
    case 'indigo':
    case 'violet':
      return {
        badgeMain: 'bg-purple-400 text-purple-950 font-black',
        badgeSub: 'bg-purple-950/80 text-purple-200 border border-purple-500/40',
        btn: 'bg-purple-400 sm:hover:bg-purple-300 active:bg-purple-500 text-purple-950',
      };
    case 'cyan':
    case 'blue':
      return {
        badgeMain: 'bg-cyan-400 text-cyan-950 font-black',
        badgeSub: 'bg-cyan-950/80 text-cyan-200 border border-cyan-500/40',
        btn: 'bg-cyan-400 sm:hover:bg-cyan-300 active:bg-cyan-500 text-cyan-950',
      };
    case 'rose':
    case 'red':
      return {
        badgeMain: 'bg-rose-400 text-rose-950 font-black',
        badgeSub: 'bg-rose-950/80 text-rose-200 border border-rose-500/40',
        btn: 'bg-rose-400 sm:hover:bg-rose-300 active:bg-rose-500 text-rose-950',
      };
    default:
      return {
        badgeMain: 'bg-lime-400 text-emerald-950 font-black',
        badgeSub: 'bg-emerald-800/80 text-lime-300 border border-emerald-600/60',
        btn: 'bg-lime-400 sm:hover:bg-lime-300 active:bg-lime-500 text-emerald-950',
      };
  }
}

export default function HeroCarousel({ onSelectCategory, onSelectEdition, onScrollToCatalog }) {
  const [promotions, setPromotions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchDeltaX = useRef(0);

  useEffect(() => {
    async function loadPromos() {
      try {
        const { data, error } = await supabase
          .from('promotions')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setPromotions(data);
        } else {
          setPromotions(FALLBACK_PROMOTIONS);
        }
      } catch {
        setPromotions(FALLBACK_PROMOTIONS);
      } finally {
        setIsLoading(false);
      }
    }
    loadPromos();
  }, []);

  // Auto slide
  useEffect(() => {
    if (isPaused || promotions.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, promotions.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
  }, [promotions.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % promotions.length);
  }, [promotions.length]);

  const handleAction = (promo) => {
    const type = (promo.action_type || '').toLowerCase().trim();
    const target = (promo.action_target || '').trim();

    if (type === 'edition' || type === 'filter_edition' || type === 'stiker_edition') {
      if (onSelectEdition) onSelectEdition(target);
      if (onScrollToCatalog) onScrollToCatalog();
    } else if (type === 'category' || type === 'filter_category') {
      if (onSelectCategory) onSelectCategory(target.toLowerCase());
      if (onScrollToCatalog) onScrollToCatalog();
    } else if (type === 'whatsapp' || type === 'wa') {
      const msg = encodeURIComponent(target || 'Halo LOUIFOOTBALL, saya tertarik dengan promo di website');
      window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
    } else if (type === 'url' || type === 'link') {
      if (target.startsWith('http://') || target.startsWith('https://')) {
        window.open(target, '_blank');
      } else {
        window.location.href = target;
      }
    } else {
      if (onScrollToCatalog) onScrollToCatalog();
    }
  };

  // Touch swipe support
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 50) {
      if (touchDeltaX.current > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  // 1. Loading State dengan Animasi Bola Berputar & Skeleton Seperti Versi Sebelumnya
  if (isLoading) {
    return (
      <section className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 mt-3 relative select-none overflow-hidden">
        <div className="w-full max-w-full relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 border border-emerald-500/50 text-white overflow-hidden shadow-lg min-w-0">
          {/* Ambient Light Background */}
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-lime-400/10 blur-2xl pointer-events-none" />

          {/* Skeleton Shimmer Loading Content */}
          <div className="w-full min-w-full max-w-full flex-shrink-0 box-border p-4 pb-8 sm:py-6 sm:px-16 md:px-20 lg:px-24 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-6 animate-pulse">
            <div className="w-full sm:w-3/5 flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-20 bg-lime-400/40 rounded-full" />
                <div className="h-4 w-24 bg-emerald-800/60 rounded-full" />
              </div>
              <div className="h-6 sm:h-8 w-4/5 bg-emerald-800/50 rounded-xl mb-2" />
              <div className="h-5 sm:h-6 w-3/5 bg-emerald-800/30 rounded-xl mb-3" />
              <div className="h-3.5 w-11/12 bg-emerald-800/25 rounded-md mb-1.5 hidden sm:block" />
              <div className="h-3.5 w-3/4 bg-emerald-800/25 rounded-md mb-4 hidden sm:block" />
              <div className="h-8 sm:h-9 w-36 bg-lime-400/40 rounded-xl" />
            </div>
            <div className="w-full sm:w-2/5 flex justify-center items-center">
              <div className="relative w-full max-w-[135px] sm:max-w-[180px] md:max-w-[210px] aspect-square bg-emerald-950/70 border border-emerald-500/30 rounded-2xl p-2 flex flex-col items-center justify-center shadow-md">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-emerald-500/30 border-t-lime-400 animate-spin flex items-center justify-center mb-2">
                  <SoccerBall size={22} weight="bold" className="text-lime-300 text-lg sm:text-xl" />
                </div>
                <span className="text-[10px] text-emerald-200/80 font-bold tracking-wider">
                  Memuat Promo...
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (promotions.length === 0) return null;

  const currentPromo = promotions[currentIndex] || promotions[0];
  const theme = getPromoTheme(currentPromo.badge_color);

  return (
    <section className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 mt-3 relative select-none overflow-hidden">
      {/* 2. Background Gradient & Ambient Light Lapangan Seperti Aslinya */}
      <div
        className="w-full max-w-full relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 border border-emerald-500/50 text-white overflow-hidden shadow-lg min-w-0"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Ambient Light Background */}
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-lime-400/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        {/* 3. Area Konten Slide dengan Padding Lebar (sm:px-16 md:px-20 lg:px-24) agar tidak mepet dengan tombol kiri/kanan */}
        <div className="w-full min-w-full max-w-full flex-shrink-0 box-border p-4 pb-8 sm:py-6 sm:px-16 md:px-20 lg:px-24 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-6 transition-opacity duration-300">
          
          {/* Teks Promo */}
          <div className="w-full sm:w-3/5 text-center sm:text-left flex flex-col items-center sm:items-start">
            {/* Badges */}
            <div className="flex items-center gap-1.5 mb-1.5">
              {currentPromo.badge_main && (
                <span className={`${theme.badgeMain} text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm`}>
                  {currentPromo.badge_main}
                </span>
              )}
              {currentPromo.badge_sub && (
                <span className={`${theme.badgeSub} text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                  {currentPromo.badge_sub}
                </span>
              )}
            </div>

            {/* Judul Promo */}
            <h1 className="text-base sm:text-xl lg:text-2xl font-black leading-snug sm:leading-tight text-white">
              {currentPromo.title}
            </h1>

            {/* Deskripsi Promo */}
            <p className="text-[11px] sm:text-xs text-emerald-100/90 mt-1 leading-relaxed max-w-md">
              {currentPromo.desc}
            </p>

            {/* Tombol Aksi CTA */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAction(currentPromo)}
                className={`${theme.btn} text-xs font-black px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5 sm:hover:scale-[1.02] active:scale-95 cursor-pointer`}
              >
                <ArrowDown size={15} weight="bold" />
                <span>{currentPromo.btn_text || 'Lihat Promo'}</span>
              </button>
            </div>
          </div>

          {/* Gambar Promo dengan Wadah Kotak Sesuai Desain Asli */}
          <div className="w-full sm:w-2/5 flex justify-center items-center">
            <div className="relative w-full max-w-[135px] sm:max-w-[180px] md:max-w-[210px] aspect-square bg-emerald-950/70 border border-emerald-500/40 rounded-2xl p-2 flex items-center justify-center shadow-md">
              <img
                src={currentPromo.img}
                alt={`${currentPromo.title} - LOUI Football`}
                className="w-full h-full object-contain rounded-xl drop-shadow pointer-events-none"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/400x400/022c22/34d399?text=LOUI+PROMO';
                }}
              />
            </div>
          </div>

        </div>

        {/* Tombol Panah Kiri / Kanan (Hanya Tampil di Layar Tablet/Desktop sm:flex) */}
        {promotions.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              type="button"
              aria-label="Slide Sebelumnya"
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-xl bg-emerald-950/80 hover:bg-lime-400 text-lime-300 hover:text-emerald-950 items-center justify-center backdrop-blur-md transition-all duration-200 border border-emerald-500/30 shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            >
              <CaretLeft size={20} weight="bold" />
            </button>

            <button
              onClick={handleNext}
              type="button"
              aria-label="Slide Berikutnya"
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-xl bg-emerald-950/80 hover:bg-lime-400 text-lime-300 hover:text-emerald-950 items-center justify-center backdrop-blur-md transition-all duration-200 border border-emerald-500/30 shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            >
              <CaretRight size={20} weight="bold" />
            </button>
          </>
        )}

        {/* Titik Navigasi (Indicators) di Bagian Bawah dengan Jarak Bersih */}
        {promotions.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {promotions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                type="button"
                aria-label={`Ke slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx ? 'w-5 bg-lime-400' : 'w-2 bg-white/40 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
