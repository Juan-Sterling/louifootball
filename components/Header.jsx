'use client';

import React, { useRef } from 'react';
import { MagnifyingGlass, AddressBook, ChatCircleDots } from '@phosphor-icons/react';

export default function Header({ searchQuery, onSearchChange, onSearchSubmit, onResetHome, onOpenContact }) {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputRef.current) {
      inputRef.current.blur(); // Dismiss mobile virtual keyboard
    }
    if (onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    <header className="sticky-header border-b border-emerald-800/80 bg-emerald-950/90 backdrop-blur-md transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Baris Brand & Tombol Kontak Mobile */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          {/* Brand Logo & Title */}
          <button
            onClick={onResetHome}
            type="button"
            className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none"
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-emerald-500/40 shadow-md group-hover:scale-105 transition shrink-0 bg-emerald-900">
              <img
                src="https://res.cloudinary.com/og1jrvy3/image/upload/f_auto,q_auto,w_100/v1789010759/756654575_17897804865557650_2370756875670529296_n.jpg"
                alt="LOUIFOOTBALL"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/100x100/225717/ffffff?text=Loui';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black tracking-tight text-white leading-none group-hover:text-lime-300 transition">
                LOUI<span className="text-lime-400">FOOTBALL</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-emerald-300 font-semibold">
                Merchandise Catalog
              </span>
            </div>
          </button>

          {/* Tombol Kontak Mobile */}
          <button
            onClick={onOpenContact}
            type="button"
            className="sm:hidden flex items-center gap-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-lime-300 border border-emerald-600/60 text-xs font-bold px-3 py-1.5 rounded-full transition shadow"
          >
            <AddressBook size={16} weight="bold" />
            <span>Kontak Toko</span>
          </button>
        </div>

        {/* Search Bar Real-time */}
        <form onSubmit={handleSubmit} className="w-full sm:w-80 md:w-96 relative">
          <MagnifyingGlass
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-300 pointer-events-none"
          />
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari pemain, edisi (cth: #12), produk..."
            className="w-full bg-emerald-900/80 border border-emerald-600/70 rounded-full pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-emerald-300/70 focus:outline-none focus:ring-2 focus:ring-lime-400 [&::-webkit-search-cancel-button]:cursor-pointer"
          />
        </form>

        {/* Tombol Kontak Desktop */}
        <div className="hidden sm:block">
          <button
            onClick={onOpenContact}
            type="button"
            className="flex items-center gap-2 bg-emerald-900 hover:bg-emerald-800 text-lime-300 border border-emerald-600/60 text-xs sm:text-sm font-bold px-4 py-2 rounded-full transition shadow cursor-pointer"
          >
            <ChatCircleDots size={18} weight="bold" />
            <span>Hubungi Kami</span>
          </button>
        </div>

      </div>
    </header>
  );
}
