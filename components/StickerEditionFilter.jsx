'use client';

import React, { useMemo } from 'react';
import { Faders, Star, CaretDown } from '@phosphor-icons/react';

export default function StickerEditionFilter({
  products,
  activeStickerEdition,
  onSelectEdition,
}) {
  const { specialEditions, numberedEditions } = useMemo(() => {
    const stickerProducts = products.filter((item) => {
      const cat = (item.category || item.categories?.category || '').toLowerCase().trim();
      return (cat === 'stiker' || item.category_id === 1) && item.edition && String(item.edition).trim() !== '';
    });

    const rawEditions = [...new Set(stickerProducts.map((item) => String(item.edition).trim()))];
    const specials = [];
    const numbered = [];

    rawEditions.forEach((ed) => {
      if (isNaN(ed)) {
        specials.push(ed);
      } else {
        numbered.push(parseInt(ed, 10));
      }
    });

    numbered.sort((a, b) => b - a); // Edisi terbaru ke terlama
    return { specialEditions: specials, numberedEditions: numbered };
  }, [products]);

  const isNumberedActive = !isNaN(activeStickerEdition) && activeStickerEdition !== 'all' && activeStickerEdition !== '';
  const isSpecialActive = specialEditions.some(
    (sp) => String(sp).trim().toLowerCase() === String(activeStickerEdition).trim().toLowerCase()
  );

  return (
    <div className="flex items-center gap-2 pb-2.5 mb-3 border-t border-emerald-800/40 pt-2.5 overflow-x-auto category-scrollbar">
      <span className="text-[11px] font-black text-lime-300 uppercase tracking-wider whitespace-nowrap flex items-center gap-1 shrink-0">
        <Faders size={14} weight="bold" /> Edisi:
      </span>

      <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
        {/* Tombol Semua */}
        <button
          onClick={() => onSelectEdition('all')}
          type="button"
          className={`edition-btn px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap shadow flex-shrink-0 cursor-pointer transition ${
            activeStickerEdition === 'all'
              ? 'bg-lime-400 text-emerald-950'
              : 'bg-emerald-950/80 border border-emerald-600/40 text-emerald-200 hover:bg-emerald-900'
          }`}
        >
          Semua
        </button>

        {/* Dropdown Edisi Bernomor (Angka) */}
        {numberedEditions.length > 0 && (
          <div className="relative flex-1 min-w-[120px] sm:max-w-[180px]">
            <select
              value={isNumberedActive ? activeStickerEdition : ''}
              onChange={(e) => onSelectEdition(e.target.value)}
              className={`w-full text-xs font-bold py-1.5 pl-3 pr-8 rounded-xl focus:outline-none appearance-none cursor-pointer shadow transition ${
                isNumberedActive
                  ? 'bg-lime-400 border border-lime-400 text-emerald-950 font-black'
                  : 'bg-emerald-950/90 border border-emerald-600/50 text-emerald-200 hover:border-emerald-500'
              }`}
            >
              <option value="" disabled className="bg-emerald-950 text-emerald-400 font-bold">
                Pilih Edisi
              </option>
              {numberedEditions.map((ed) => (
                <option key={ed} value={ed} className="bg-emerald-950 text-white font-bold">
                  Edisi #{ed}
                </option>
              ))}
            </select>
            <CaretDown
              size={12}
              weight="bold"
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                isNumberedActive ? 'text-emerald-950' : 'text-emerald-400'
              }`}
            />
          </div>
        )}

        {/* Dropdown Edisi Lainnya (Huruf: Special, Collab, dll) */}
        {specialEditions.length > 0 && (
          <div className="relative flex-1 min-w-[130px] sm:max-w-[190px]">
            <select
              value={isSpecialActive ? activeStickerEdition : ''}
              onChange={(e) => onSelectEdition(e.target.value)}
              className={`w-full text-xs font-bold py-1.5 pl-3 pr-8 rounded-xl focus:outline-none appearance-none cursor-pointer shadow transition ${
                isSpecialActive
                  ? 'bg-amber-400 border border-amber-400 text-amber-950 font-black'
                  : 'bg-emerald-950/90 border border-amber-400/50 text-amber-300 hover:border-amber-400'
              }`}
            >
              <option value="" disabled className="bg-emerald-950 text-amber-400 font-bold">
                Edisi Lainnya
              </option>
              {specialEditions.map((sp) => (
                <option key={sp} value={sp} className="bg-emerald-950 text-white font-bold">
                  {sp}
                </option>
              ))}
            </select>
            <CaretDown
              size={12}
              weight="bold"
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                isSpecialActive ? 'text-amber-950' : 'text-amber-400'
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
