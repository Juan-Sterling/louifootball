'use client';

import React from 'react';
import {
  WhatsappLogo,
  InstagramLogo,
  ShoppingBagOpen,
  Storefront,
} from '@phosphor-icons/react';
import { WA_NUMBER } from '@/lib/utils';

export default function Footer() {
  return (
    <footer className="bg-emerald-950/95 border-t border-emerald-700/50 mt-10 py-8 text-white backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <span className="font-loui text-xl sm:text-2xl tracking-wider">
            LOUI<span className="text-lime-400">FOOTBALL</span>
          </span>
        </div>
        <p className="text-xs text-emerald-200/80 max-w-md mx-auto">
          Toko merchandise sepak bola karya suporter untuk pecinta bola di seluruh Indonesia.
        </p>

        {/* Tombol Kontak & Marketplace Footer */}
        <div className="flex flex-wrap justify-center items-center gap-2.5 pt-2">
          <a
            href={`https://wa.me/${WA_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-emerald-600/50 transition cursor-pointer"
          >
            <WhatsappLogo size={18} weight="bold" className="text-green-400" />
            <span>WhatsApp</span>
          </a>
          <a
            href="https://instagram.com/louifootball"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-emerald-600/50 transition cursor-pointer"
          >
            <InstagramLogo size={18} weight="bold" className="text-pink-400" />
            <span>Instagram</span>
          </a>
          <a
            href="https://id.shp.ee/a5f6X4Wq"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-emerald-600/50 transition cursor-pointer"
          >
            <ShoppingBagOpen size={18} weight="bold" className="text-orange-400" />
            <span>Shopee</span>
          </a>
          <a
            href="https://tk.tokopedia.com/ZSqEjQvMt/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-emerald-600/50 transition cursor-pointer"
          >
            <Storefront size={18} weight="bold" className="text-lime-400" />
            <span>Tokopedia</span>
          </a>
        </div>

        <div className="pt-4 border-t border-emerald-800/60 text-[11px] text-emerald-300/60">
          &copy; {new Date().getFullYear()} LOUIFOOTBALL. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
