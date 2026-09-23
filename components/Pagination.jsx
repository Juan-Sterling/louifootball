'use client';

import React from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage = 20,
  onPageChange,
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate pagination page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="mt-8 pt-6 border-t border-emerald-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Indikator info jumlah produk */}
      <p className="text-xs text-emerald-200/90 order-2 sm:order-1 font-medium">
        Menampilkan <span className="font-bold text-lime-400">{startItem} - {endItem}</span> dari{' '}
        <span className="font-bold text-white">{totalItems}</span> produk
      </p>

      {/* Kontrol Tombol Pagination */}
      <nav aria-label="Navigasi Halaman Katalog" className="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
        {/* Tombol Sebelumnya */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Halaman Sebelumnya"
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
            currentPage === 1
              ? 'bg-emerald-950/40 text-emerald-400/40 border border-emerald-800/30 cursor-not-allowed'
              : 'bg-emerald-950/90 text-emerald-100 border border-emerald-600/50 hover:bg-emerald-900 hover:text-white cursor-pointer active:scale-95'
          }`}
        >
          <CaretLeft size={14} weight="bold" />
          <span className="hidden xs:inline sm:inline">Sebelumnya</span>
        </button>

        {/* Angka Halaman */}
        <div className="flex items-center gap-1">
          {pages.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1.5 py-1 text-emerald-300 font-bold text-xs select-none"
                >
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'bg-lime-400 text-emerald-950 font-black shadow-md scale-105'
                    : 'bg-emerald-950/80 border border-emerald-600/40 text-emerald-100 hover:bg-emerald-900 hover:text-white'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Tombol Selanjutnya */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Halaman Selanjutnya"
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
            currentPage === totalPages
              ? 'bg-emerald-950/40 text-emerald-400/40 border border-emerald-800/30 cursor-not-allowed'
              : 'bg-emerald-950/90 text-emerald-100 border border-emerald-600/50 hover:bg-emerald-900 hover:text-white cursor-pointer active:scale-95'
          }`}
        >
          <span className="hidden xs:inline sm:inline">Selanjutnya</span>
          <CaretRight size={14} weight="bold" />
        </button>
      </nav>
    </div>
  );
}
