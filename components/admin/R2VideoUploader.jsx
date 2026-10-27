'use client';

import React, { useState, useRef } from 'react';
import {
  VideoCamera,
  Play,
  Trash,
  CheckCircle,
  WarningCircle,
  Spinner,
  Copy,
  Check,
  ArrowClockwise,
  UploadSimple,
  ShieldCheck,
} from '@phosphor-icons/react';
import { encodeProductId } from '@/lib/utils';

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

export default function R2VideoUploader({
  videoUrl,
  onChange,
  onDelete,
  productId = null,
  disabled = false,
}) {
  const fileInputRef = useRef(null);
  const xhrRef = useRef(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Dapatkan URL landing page untuk produk ini dengan kode terenkripsi aman
  const videoCode = encodeProductId(productId);
  const landingUrl = typeof window !== 'undefined' && videoCode
    ? `${window.location.origin}/v/${videoCode}`
    : '';

  const handleCopyLink = async () => {
    if (!landingUrl) return;
    try {
      await navigator.clipboard.writeText(landingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    setUploadError('');

    // 1. Validasi Tipe File (Harus Video)
    const mime = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    const isVideoMime = mime.startsWith('video/');
    const isVideoExt = /\.(mp4|webm|mov|mkv|avi|3gp)$/i.test(name);

    if (!isVideoMime && !isVideoExt) {
      setUploadError('Format file tidak didukung. Harap pilih file video yang valid (MP4, WebM, atau MOV).');
      return;
    }

    // 2. Validasi Ukuran (Maksimal 100MB)
    if (file.size > MAX_VIDEO_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadError(`Ukuran video (${sizeMB} MB) melebihi batas maksimal 100 MB.`);
      return;
    }

    // Mulai proses upload
    uploadVideoToServer(file);
  };

  const uploadVideoToServer = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatusText('Menyiapkan izin upload...');

    try {
      // 1. Minta Presigned URL dari backend
      const presignedRes = await fetch('/api/r2/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'video/mp4',
          fileSize: file.size,
        }),
      });

      const presignedData = await presignedRes.json();

      if (!presignedRes.ok || !presignedData.uploadUrl) {
        throw new Error(presignedData.error || 'Gagal menyiapkan link upload video.');
      }

      const { uploadUrl, key, publicUrl } = presignedData;

      // 2. Upload file langsung via XMLHttpRequest
      setUploadStatusText('Mengunggah video... 0%');

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percent);
            if (percent < 100) {
              setUploadStatusText(`Mengunggah video... ${percent}%`);
            } else {
              setUploadStatusText('Transfer data selesai. Memproses di server...');
            }
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Server menolak upload (HTTP ${xhr.status}).`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Koneksi internet terputus saat mengunggah video. Silakan coba lagi.'));
        };

        xhr.ontimeout = () => {
          reject(new Error('Koneksi upload waktu habis (timeout).'));
        };

        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
        xhr.send(file);
      });

      // 3. Verifikasi integritas fisik file
      setUploadStatusText('Memverifikasi integritas file video...');

      const verifyRes = await fetch('/api/r2/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(
          verifyData.error ||
            'Verifikasi gagal: File video tidak ditemukan atau kosong. Harap upload ulang.'
        );
      }

      // Berhasil 100% dan terverifikasi
      setUploadStatusText('Video berhasil tersimpan!');
      setUploadProgress(100);
      onChange(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Terjadi kesalahan saat mengunggah video.');
    } finally {
      setIsUploading(false);
      xhrRef.current = null;
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      setIsUploading(false);
      setUploadStatusText('');
      setUploadProgress(0);
      setUploadError('Upload video dibatalkan.');
    }
  };

  const handleRemoveVideo = () => {
    if (disabled || isUploading) return;
    const confirmDelete = window.confirm('Apakah Anda yakin ingin menghapus video ini dari produk?');
    if (!confirmDelete) return;

    if (onDelete) {
      onDelete();
    } else {
      onChange('');
    }
    setUploadError('');
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        onChange={(e) => handleFileSelect(e.target.files?.[0])}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Jika sudah ada video */}
      {videoUrl ? (
        <div className="border border-emerald-700/60 bg-emerald-950/40 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-lime-400">
              <ShieldCheck size={18} weight="fill" />
              <span>Video Siap Digunakan</span>
            </div>
            <button
              type="button"
              onClick={handleRemoveVideo}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-800/40 transition cursor-pointer"
              title="Hapus Video"
            >
              <Trash size={14} weight="bold" />
              <span>Hapus Video</span>
            </button>
          </div>

          {/* Video Preview Player */}
          <div className="relative bg-black rounded-xl overflow-hidden border border-emerald-800/50 max-h-56 flex items-center justify-center">
            <video
              src={videoUrl}
              controls
              controlsList="nodownload"
              disablePictureInPicture
              playsInline
              onContextMenu={(e) => e.preventDefault()}
              className="max-h-56 w-auto max-w-full mx-auto"
            />
          </div>

          {/* Kotak Link Landing Page & Tombol Salin */}
          {productId ? (
            <div className="bg-emerald-900/50 border border-emerald-700/50 rounded-xl p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider block">
                  Tautan QR Landing Page:
                </span>
                <p className="text-xs text-white font-mono truncate select-all">
                  {landingUrl}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 bg-lime-400 hover:bg-lime-300 text-emerald-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow transition cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check size={14} weight="bold" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} weight="bold" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-emerald-300/80 italic">
              ℹ️ Tautan QR Landing Page akan siap setelah produk ini disimpan.
            </p>
          )}

          {/* Tombol Ganti Video */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-emerald-200 hover:text-white bg-emerald-900/60 hover:bg-emerald-800/60 border border-emerald-700/60 py-2 rounded-xl transition cursor-pointer"
          >
            <ArrowClockwise size={14} weight="bold" />
            <span>Ganti File Video</span>
          </button>
        </div>
      ) : (
        /* Jika belum ada video (Dropzone) */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !isUploading) setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (!disabled && !isUploading) {
              handleFileSelect(e.dataTransfer.files?.[0]);
            }
          }}
          onClick={() => {
            if (!disabled && !isUploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
            isDragOver
              ? 'border-lime-400 bg-emerald-900/40'
              : 'border-emerald-700/60 bg-emerald-950/20 hover:border-emerald-500 hover:bg-emerald-900/20'
          } ${disabled || isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-900/80 border border-emerald-600/50 flex items-center justify-center mx-auto mb-2 text-lime-400">
            <VideoCamera size={26} weight="duotone" />
          </div>
          <p className="text-sm font-semibold text-white">
            Klik untuk memilih video atau seret file ke sini
          </p>
          <p className="text-xs text-emerald-300/70 mt-1">
            Format: MP4, WebM, MOV • Maksimal 100 MB
          </p>
        </div>
      )}

      {/* Progress Bar & Status Saat Upload */}
      {isUploading && (
        <div className="bg-emerald-950/90 border border-emerald-600/80 rounded-2xl p-4 shadow-xl space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-lime-300 flex items-center gap-1.5">
              <Spinner size={15} className="animate-spin text-lime-400" />
              <span>{uploadStatusText}</span>
            </span>
            <span className="font-mono font-bold text-white">{uploadProgress}%</span>
          </div>

          {/* Bar Progress */}
          <div className="w-full h-2.5 bg-emerald-900/80 rounded-full overflow-hidden border border-emerald-700/50">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-lime-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-emerald-300/80">
              Mohon tunggu hingga proses verifikasi selesai...
            </span>
            <button
              type="button"
              onClick={handleCancelUpload}
              className="text-[11px] text-red-400 hover:text-red-300 underline font-medium cursor-pointer"
            >
              Batalkan
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="p-3 bg-red-950/60 border border-red-700/60 rounded-xl flex items-start gap-2 text-xs text-red-200">
          <WarningCircle size={16} weight="fill" className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-300">Upload Gagal</p>
            <p className="mt-0.5 text-red-200/90 leading-relaxed">{uploadError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
