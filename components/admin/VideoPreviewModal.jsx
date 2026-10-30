'use client';

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ArrowSquareOut,
  VideoCamera,
  ShieldCheck,
  Tag,
} from '@phosphor-icons/react';
import { useToast } from './Toast';
import { encodeProductId } from '@/lib/utils';

export default function VideoPreviewModal({ isOpen, onClose, product }) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !product || !product.qr_video) return null;

  const videoCode = encodeProductId(product.id);
  const landingUrl = typeof window !== 'undefined' && videoCode
    ? `${window.location.origin}/v/${videoCode}`
    : '';

  const productName = product.player_name || product.title || 'Produk';
  const categoryName = product.categories?.category || product.category || 'Produk';

  const handleCopyLink = async () => {
    if (!landingUrl) return;
    try {
      await navigator.clipboard.writeText(landingUrl);
      setCopied(true);
      showToast('Tautan QR video berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Gagal menyalin link.', 'error');
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-emerald-950 border border-emerald-700/80 rounded-3xl max-w-xl w-full text-white shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-emerald-800/80 flex items-center justify-between bg-emerald-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-lime-400 text-emerald-950 flex items-center justify-center font-bold">
              <VideoCamera size={18} weight="fill" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Preview Video QR
              </h3>
              <p className="text-[11px] text-emerald-300">
                #{product.id} • {productName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-full bg-emerald-900 hover:bg-emerald-800 text-emerald-300 hover:text-white transition"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Video Player Box (Bawaan Device / Browser) */}
          <div className="relative bg-black rounded-2xl overflow-hidden border border-emerald-800 flex items-center justify-center max-h-[50vh] shadow-inner select-none">
            <video
              src={product.qr_video}
              controls
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              playsInline
              onContextMenu={(e) => e.preventDefault()}
              className="max-h-[50vh] w-auto max-w-full mx-auto"
            />
          </div>

          {/* Kotak Link yang akan dijadikan QR */}
          <div className="bg-emerald-900/60 border border-emerald-700/60 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-lime-400 flex items-center gap-1.5">
                <ShieldCheck size={14} weight="fill" />
                <span>Link Halaman untuk Digenerate ke QR Code:</span>
              </span>
              <span className="text-[10px] text-emerald-300/80 font-mono">
                Tujuan Scan Pembeli
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={landingUrl}
                className="w-full bg-emerald-950/80 border border-emerald-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 inline-flex items-center gap-1.5 bg-lime-400 hover:bg-lime-300 text-emerald-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={16} weight="bold" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} weight="bold" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-emerald-300/70">
              💡 Salin link di atas dan tempelkan ke aplikasi pembuat QR code untuk mencetak stiker atau kartu produk.
            </p>
          </div>

          {/* Info Tambahan */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200/80 pt-1">
            <span className="inline-flex items-center gap-1">
              <Tag size={13} weight="bold" />
              <span>Kategori: {categoryName}</span>
            </span>

            <a
              href={videoCode ? `/v/${videoCode}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-lime-400 hover:text-lime-300 hover:underline"
            >
              <span>Buka Tampilan Halaman</span>
              <ArrowSquareOut size={13} weight="bold" />
            </a>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-emerald-800/80 bg-emerald-900/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 text-xs font-semibold rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
