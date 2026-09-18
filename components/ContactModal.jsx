'use client';

import React, { useEffect } from 'react';
import {
  X,
  WhatsappLogo,
  InstagramLogo,
  TiktokLogo,
  Storefront,
  CaretRight,
} from '@phosphor-icons/react';
import { WA_NUMBER } from '@/lib/utils';

export default function ContactModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-emerald-950/95 border border-emerald-500/40 rounded-3xl max-w-sm w-full p-5 sm:p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          type="button"
          aria-label="Tutup"
          className="absolute top-4 right-4 text-emerald-300 hover:text-white transition cursor-pointer"
        >
          <X size={20} weight="bold" />
        </button>

        <h3 className="text-lg font-black text-white mb-1">Hubungi LOUIFOOTBALL</h3>
        <p className="text-xs text-emerald-200/80 mb-5">
          Tanyakan stok, custom stiker, atau pemesanan langsung lewat kontak kami:
        </p>

        <div className="space-y-2.5">
          {/* WhatsApp */}
          <a
            href={`https://wa.me/${WA_NUMBER}?text=Halo%20LOUIFOOTBALL,%20saya%20ingin%20bertanya%20tentang%20merchandise%20katalog`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-2xl bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-600/40 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center text-xl">
                <WhatsappLogo size={22} weight="bold" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">WhatsApp Admin</p>
                <p className="text-[10px] text-emerald-300">Fast Response</p>
              </div>
            </div>
            <CaretRight size={16} weight="bold" className="text-gray-400 group-hover:text-white transition" />
          </a>

          {/* Instagram */}
          <a
            href="https://instagram.com/louifootball"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-2xl bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-600/40 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center text-xl">
                <InstagramLogo size={22} weight="bold" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Instagram</p>
                <p className="text-[10px] text-emerald-300">@louifootball</p>
              </div>
            </div>
            <CaretRight size={16} weight="bold" className="text-gray-400 group-hover:text-white transition" />
          </a>

          {/* TikTok */}
          <a
            href="https://tiktok.com/@louifootball"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-2xl bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-600/40 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl">
                <TiktokLogo size={22} weight="bold" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">TikTok Official</p>
                <p className="text-[10px] text-emerald-300">Video & Katalog Baru</p>
              </div>
            </div>
            <CaretRight size={16} weight="bold" className="text-gray-400 group-hover:text-white transition" />
          </a>

          {/* Tokopedia */}
          <a
            href="https://tokopedia.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-2xl bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-600/40 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-lime-400 flex items-center justify-center text-xl">
                <Storefront size={22} weight="bold" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Tokopedia Store</p>
                <p className="text-[10px] text-emerald-300">Cashback & cicilan resmi</p>
              </div>
            </div>
            <CaretRight size={16} weight="bold" className="text-gray-400 group-hover:text-white transition" />
          </a>
        </div>
      </div>
    </div>
  );
}
