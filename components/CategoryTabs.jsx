'use client';

import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const FALLBACK_CATEGORIES = [
  { id: 1, category: "stiker", spec: "Vinyl Waterproof • 7 cm", desc: "Bahan vinyl tebal tahan air, panas matahari, dan anti gores. Cocok untuk laptop, helm, dan tumbler." },
  { id: 2, category: "mini stiker", spec: "Vinyl Waterproof • 4 cm", desc: "Bahan vinyl mini tebal anti air, pas untuk casing handphone, binder, dan jurnal." },
  { id: 3, category: "keychain", spec: "Akrilik 3mm • 2 Sisi HD", desc: "Akrilik bening 3mm dengan cetak tajam 2 sisi definisi tinggi, dilengkapi ring putar anti karat." },
  { id: 4, category: "poster", spec: "Art Carton 260gr • 32x48 cm", desc: "Poster eksklusif kualitas cetak studio gallery tahan pudar untuk dekorasi dinding kamar." }
];

export default function CategoryTabs({ categories, setCategories, activeCategory, onSelectCategory }) {
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
    <div id="categoryTabs" className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
      {/* Tombol Semua */}
      <button
        onClick={() => onSelectCategory('all')}
        type="button"
        className={`cat-btn px-4 py-1.5 rounded-full text-xs whitespace-nowrap shadow cursor-pointer transition ${
          activeCategory === 'all'
            ? 'bg-lime-400 text-emerald-950 font-black'
            : 'bg-emerald-950/80 border border-emerald-600/40 text-emerald-100 font-bold hover:bg-emerald-900'
        }`}
      >
        Semua
      </button>

      {/* Tombol Kategori Dinamis */}
      {categories.map((cat) => {
        const rawCategory = cat.category || '';
        const slug = rawCategory.toLowerCase().trim();
        if (!slug) return null;

        const isActive = activeCategory === slug;
        const label = slug.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        return (
          <button
            key={cat.id || slug}
            onClick={() => onSelectCategory(slug)}
            type="button"
            className={`cat-btn px-4 py-1.5 rounded-full text-xs whitespace-nowrap shadow cursor-pointer transition ${
              isActive
                ? 'bg-lime-400 text-emerald-950 font-black'
                : 'bg-emerald-950/80 border border-emerald-600/40 text-emerald-100 font-bold hover:bg-emerald-900'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
