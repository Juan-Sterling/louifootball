'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CaretLeft, CaretRight, ArrowRight } from '@phosphor-icons/react';
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

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 w-full">
        <div className="w-full bg-emerald-950/80 border border-emerald-600/40 rounded-3xl p-6 sm:p-10 animate-pulse h-56 sm:h-72"></div>
      </section>
    );
  }

  if (promotions.length === 0) return null;

  const currentPromo = promotions[currentIndex] || promotions[0];
  const theme = getPromoTheme(currentPromo.badge_color);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 w-full">
      <div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900/90 via-emerald-950/95 to-zinc-950 border border-emerald-500/30 shadow-2xl backdrop-blur-sm"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full min-h-[260px] sm:min-h-[290px] flex items-center">
          <div className="w-full p-5 sm:p-8 md:p-10 flex flex-col-reverse sm:flex-row items-center justify-between gap-5 sm:gap-8 transition-opacity duration-300">
            
            {/* Teks Promo */}
            <div className="w-full sm:w-3/5 text-center sm:text-left flex flex-col items-center sm:items-start">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs tracking-wider shadow ${theme.badgeMain}`}>
                  {currentPromo.badge_main}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wide backdrop-blur-sm ${theme.badgeSub}`}>
                  {currentPromo.badge_sub}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-tight tracking-tight mb-2 sm:mb-3">
                {currentPromo.title}
              </h1>

              {/* Desc */}
              <p className="text-emerald-200/90 text-xs sm:text-sm leading-relaxed mb-4 max-w-xl">
                {currentPromo.desc}
              </p>

              {/* CTA Button */}
              <button
                onClick={() => handleAction(currentPromo)}
                type="button"
                className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer ${theme.btn}`}
              >
                <span>{currentPromo.btn_text || 'Lihat Koleksi'}</span>
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>

            {/* Gambar Promo */}
            <div className="w-full sm:w-2/5 flex items-center justify-center">
              <div className="relative w-36 h-36 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 p-2.5 flex items-center justify-center shadow-xl">
                <img
                  src={currentPromo.img}
                  alt={currentPromo.title}
                  className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition duration-300"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Tombol Panah Kiri / Kanan (Hanya Desktop sm:flex) */}
        {promotions.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              type="button"
              aria-label="Slide Sebelumnya"
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-xl bg-emerald-950/80 hover:bg-lime-400 text-lime-300 hover:text-emerald-950 items-center justify-center backdrop-blur-md transition border border-emerald-500/30 shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            >
              <CaretLeft size={20} weight="bold" />
            </button>

            <button
              onClick={handleNext}
              type="button"
              aria-label="Slide Berikutnya"
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-xl bg-emerald-950/80 hover:bg-lime-400 text-lime-300 hover:text-emerald-950 items-center justify-center backdrop-blur-md transition border border-emerald-500/30 shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            >
              <CaretRight size={20} weight="bold" />
            </button>
          </>
        )}

        {/* Titik Navigasi (Indicators) */}
        {promotions.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {promotions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                type="button"
                aria-label={`Ke slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx ? 'w-6 bg-lime-400' : 'w-2 bg-emerald-700/60 hover:bg-emerald-500'
                }`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
