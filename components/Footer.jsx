import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-12 py-8 text-center text-xs text-emerald-200/70 border-t border-emerald-800/40 bg-emerald-950/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-1.5">
        <p className="font-black text-sm tracking-wider text-white">LOUIFOOTBALL</p>
        <p className="text-[11px] text-emerald-300/80">
          Toko merchandise sepak bola karya suporter untuk pecinta bola di seluruh Indonesia.
        </p>
        <p className="text-[10px] text-emerald-400/50 mt-1">
          &copy; {new Date().getFullYear()} LOUIFOOTBALL. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
