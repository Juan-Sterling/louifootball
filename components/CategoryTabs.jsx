'use client';

import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle } from '@phosphor-icons/react';
import { normalizeCategory } from '@/lib/utils';

const FALLBACK_CATEGORIES = [
  { id: 1, category: "stickers", spec: "Vinyl Waterproof • 7 cm", desc: "Bahan vinyl tebal tahan air, panas matahari, dan anti gores. Cocok untuk laptop, helm, dan tumbler." },
  { id: 2, category: "mini stickers", spec: "Vinyl Waterproof • 4 cm", desc: "Bahan vinyl mini tebal anti air, pas untuk casing handphone, binder, dan jurnal." },
  { id: 3, category: "keychains", spec: "Akrilik 3mm • 2 Sisi HD", desc: "Akrilik bening 3mm dengan cetak tajam 2 sisi definisi tinggi, dilengkapi ring putar anti karat." },
  { id: 4, category: "posters", spec: "Art Carton 260gr • 32x48 cm", desc: "Poster eksklusif kualitas cetak studio gallery tahan pudar untuk dekorasi dinding kamar." }
];

export default function CategoryTabs({
  categories,
  setCategories,
  activeCategory,
  onSelectCategory,
  isAvailableOnly,
  onToggleAvailableOnly,
}) {
  useEffect(() => {
    async function loadCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('id', { ascending: true });

        if (!error && data && data.length > 0) {
          setCategories(data);
        } else {
          setCategories(FALLBACK_CATEGORIES);
        }
      } catch {
        setCategories(FALLBACK_CATEGORIES);
      }
    }

    loadCategories();

    // Supabase Realtime Listener untuk tabel categories
    let channel;
    try {
      channel = supabase
        .channel('realtime_categories_next')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
          loadCategories();
        })
        .subscribe();
    } catch (e) {
      console.debug("Realtime categories not supported or enabled:", e);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [setCategories]);

  return (
    <div className="flex items-center justify-between gap-2 pb-2 mb-2">
      {/* Scrollable Category Tabs dengan Scrollbar Halus */}
      <div id="categoryTabs" className="flex items-center gap-2 overflow-x-auto category-scrollbar pb-1.5 flex-1 min-w-0 pr-1">
        {/* Tombol Semua */}
        <button
          onClick={() => onSelectCategory('all')}
          type="button"
          className={`cat-btn font-loui tracking-wider uppercase px-4 py-1.5 rounded-full text-xs whitespace-nowrap shadow cursor-pointer transition shrink-0 ${
            normalizeCategory(activeCategory) === 'all'
              ? 'bg-lime-400 text-emerald-950'
              : 'bg-emerald-950/80 border border-emerald-600/40 text-emerald-100 hover:bg-emerald-900'
          }`}
        >
          Semua
        </button>

        {/* Tombol Kategori Dinamis */}
        {categories.map((cat) => {
          const rawCategory = cat.category || '';
          const slug = normalizeCategory(rawCategory);
          if (!slug) return null;

          const isActive = normalizeCategory(activeCategory) === slug;
          const label = rawCategory.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

          return (
            <button
              key={cat.id || slug}
              onClick={() => onSelectCategory(slug)}
              type="button"
              className={`cat-btn font-loui tracking-wider uppercase px-4 py-1.5 rounded-full text-xs whitespace-nowrap shadow cursor-pointer transition shrink-0 ${
                isActive
                  ? 'bg-lime-400 text-emerald-950'
                  : 'bg-emerald-950/80 border border-emerald-600/40 text-emerald-100 hover:bg-emerald-900'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tombol Filter Tersedia (Pinned on the right) */}
      <div className="shrink-0 pl-1.5 border-l border-emerald-800/60 flex items-center">
        <button
          onClick={onToggleAvailableOnly}
          type="button"
          aria-pressed={isAvailableOnly}
          title={isAvailableOnly ? 'Menampilkan produk tersedia saja. Klik untuk melihat semua produk.' : 'Klik untuk hanya menampilkan produk yang tersedia (sembunyikan sold out)'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition cursor-pointer shadow-sm select-none shrink-0 ${
            isAvailableOnly
              ? 'bg-lime-400 text-emerald-950 font-black ring-2 ring-lime-300/50 shadow-md'
              : 'bg-emerald-950/90 border border-emerald-600/50 text-emerald-200 hover:bg-emerald-900 hover:text-white font-bold'
          }`}
        >
          <CheckCircle
            size={14}
            weight={isAvailableOnly ? 'fill' : 'bold'}
            className={isAvailableOnly ? 'text-emerald-950' : 'text-lime-400'}
          />
          <span>Tersedia</span>
        </button>
      </div>
    </div>
  );
}
