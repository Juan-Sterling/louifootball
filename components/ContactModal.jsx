'use client';

import React, { useEffect } from 'react';
import {
  X,
  ChatCircleText,
  WhatsappLogo,
  InstagramLogo,
  ShoppingBagOpen,
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
      <div className="bg-emerald-950 border-2 border-emerald-600 rounded-3xl max-w-sm w-full p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          type="button"
          aria-label="Tutup"
          className="absolute top-4 right-4 bg-emerald-900 hover:bg-emerald-800 text-emerald-300 p-2 rounded-full shadow cursor-pointer transition"
        >
          <X size={18} weight="bold" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-lime-400 text-emerald-950 rounded-2xl mx-auto flex items-center justify-center font-black text-xl mb-2 shadow">
            <ChatCircleText size={26} weight="bold" />
          </div>
          <h3 className="text-xl font-loui font-bold text-white tracking-wide uppercase">Hubungi LOUIFOOTBALL</h3>
          <p className="text-xs text-emerald-200/80 mt-1">
            Pilih saluran kontak atau marketplace resmi kami:
          </p>
        </div>

        <div className="space-y-2.5">
          {/* WhatsApp Admin */}
          <a
            href={`https://wa.me/${WA_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-2xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/60 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center text-xl">
                <WhatsappLogo size={22} weight="bold" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">WhatsApp Admin</p>
                <p className="text-[10px] text-emerald-300">Fast response order & custom</p>
              </div>
            </div>
            <CaretRight size={16} weight="bold" className="text-gray-400 group-hover:text-white transition" />
          </a>

          {/* Instagram */}
          <a
            href="https://instagram.com/louifootball"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-2xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/60 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center text-xl">
                <InstagramLogo size={22} weight="bold" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Instagram</p>
                <p className="text-[10px] text-emerald-300">@louifootball (Katalog & Info)</p>
              </div>
            </div>
            <CaretRight size={16} weight="bold" className="text-gray-400 group-hover:text-white transition" />
          </a>

          {/* Shopee Store */}
          <a
            href="https://id.shp.ee/a5f6X4Wq"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-2xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/60 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-xl">
                <ShoppingBagOpen size={22} weight="bold" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Shopee Store</p>
                <p className="text-[10px] text-emerald-300">Gratis ongkir & voucher</p>
              </div>
            </div>
            <CaretRight size={16} weight="bold" className="text-gray-400 group-hover:text-white transition" />
          </a>

          {/* Tokopedia Store */}
          <a
            href="https://tk.tokopedia.com/ZSqEjQvMt/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-2xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/60 transition group cursor-pointer"
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
