'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import {
  UploadSimple,
  CheckCircle,
  Trash,
  Spinner,
  ArrowSquareOut,
  WarningCircle,
  X,
  Camera,
  ArrowsClockwise,
} from '@phosphor-icons/react';

const DEFAULT_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'og1jrvy3';
const DEFAULT_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

export default function CloudinaryWidget({
  value,
  onChange,
  onDelete,
  label = 'Foto Produk',
  description = '',
  required = false,
  folder = 'louifootball product',
}) {
  const uniqueId = useId();
  const [cloudName, setCloudName] = useState(DEFAULT_CLOUD_NAME);
  const [uploadPreset, setUploadPreset] = useState(DEFAULT_UPLOAD_PRESET);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [currentPublicId, setCurrentPublicId] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [localPreview, setLocalPreview] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // Load saved Cloudinary config from localStorage if available
  useEffect(() => {
    try {
      const savedCloud = localStorage.getItem('loui_cloudinary_cloud_name');
      const savedPreset = localStorage.getItem('loui_cloudinary_upload_preset');
      const savedKey = localStorage.getItem('loui_cloudinary_api_key');
      const savedSecret = localStorage.getItem('loui_cloudinary_api_secret');

      if (savedCloud) setCloudName(savedCloud);
      if (savedPreset) setUploadPreset(savedPreset);
      if (savedKey) setApiKey(savedKey);
      if (savedSecret) setApiSecret(savedSecret);
    } catch {
      // ignore
    }
  }, []);

  // Upload file from device directly
  const uploadFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('File yang dipilih bukan gambar. Harap pilih file JPG, PNG, atau WEBP.');
      return;
    }

    setUploadError('');
    setIsUploading(true);

    // Instant local preview for immediate visual responsiveness
    const localUrl = URL.createObjectURL(file);
    setLocalPreview(localUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('cloud_name', cloudName);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder || 'louifootball product');
      if (apiKey) formData.append('api_key', apiKey);
      if (apiSecret) formData.append('api_secret', apiSecret);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal mengunggah foto.');
      }

      if (data.secure_url) {
        // Automatically set the Cloudinary URL and public_id into form
        setCurrentPublicId(data.public_id || '');
        onChange(data.secure_url, data.public_id);
        setLocalPreview('');
      } else {
        throw new Error('Tidak menerima URL gambar dari server.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Terjadi kesalahan saat mengunggah foto.');
      setLocalPreview('');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const displayImage = localPreview || value;

  return (
    <div className="space-y-2.5">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
          <Camera size={15} className="text-lime-400" />
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      </div>

      {description && (
        <p className="text-[11px] text-emerald-300/80 -mt-1">{description}</p>
      )}

      {/* Hidden File Input with Unique ID */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id={`device-photo-input-${uniqueId}`}
      />

      {/* Main Upload Dropzone Area */}
      {!displayImage ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[160px] ${
            isDragOver
              ? 'border-lime-400 bg-emerald-900/50 scale-[1.01]'
              : 'border-emerald-700/60 hover:border-lime-400/80 bg-emerald-950/60 hover:bg-emerald-900/30'
          } ${isUploading ? 'pointer-events-none opacity-80' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="relative">
                <Spinner size={36} className="animate-spin text-lime-400" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <UploadSimple size={18} className="text-lime-300" />
                </div>
              </div>
              <p className="text-xs font-bold text-white tracking-wide">
                Mengunggah foto dari perangkat...
              </p>
              <p className="text-[11px] text-emerald-300/80">
                Harap tunggu beberapa detik hingga proses upload selesai.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-900/80 border border-emerald-700/60 flex items-center justify-center text-lime-400 shadow-md">
                <UploadSimple size={24} weight="bold" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-white">
                  Klik untuk pilih foto dari perangkat atau seret foto ke sini
                </p>
                <p className="text-[11px] text-emerald-300/70 mt-0.5">
                  Format didukung: JPG, PNG, WEBP, atau AVIF
                </p>
              </div>
              <button
                type="button"
                className="mt-1 px-4 py-1.5 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 text-emerald-950 font-bold text-xs shadow-md hover:from-lime-300 hover:to-lime-400 transition"
              >
                Pilih File dari Laptop / Komputer
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Image Preview Box when image exists */
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 flex flex-col sm:flex-row items-center gap-4">
          {/* Thumbnail preview */}
          <div className="w-28 h-28 shrink-0 rounded-xl bg-emerald-900/60 border border-emerald-700/60 overflow-hidden relative group flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage}
              alt="Pratinjau Foto Produk"
              className="w-full h-full object-contain p-1"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-emerald-950/80 flex flex-col items-center justify-center p-2 text-center">
                <Spinner size={24} className="animate-spin text-lime-400 mb-1" />
                <span className="text-[10px] text-white font-medium">Mengunggah...</span>
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex-1 w-full min-w-0 space-y-2 text-left">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-900 border border-lime-400/40 text-lime-300 text-[11px] font-bold">
                <CheckCircle size={14} weight="fill" className="text-lime-400" />
                Foto Berhasil Diunggah
              </span>
            </div>

            {/* Cloudinary URL text */}
            <div className="p-2 rounded-lg bg-emerald-900/50 border border-emerald-800 text-[11px] font-mono text-emerald-200 truncate flex items-center justify-between gap-2">
              <span className="truncate">{value || 'URL sedang diproses...'}</span>
              {value && (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lime-400 hover:text-white shrink-0"
                  title="Lihat foto penuh"
                >
                  <ArrowSquareOut size={15} />
                </a>
              )}
            </div>

            {/* Change / Remove Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-emerald-200 hover:text-white border border-emerald-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <ArrowsClockwise size={14} />
                <span>Ganti Foto dari Perangkat</span>
              </button>

              <button
                type="button"
                disabled={isUploading}
                onClick={() => {
                  if (value && onDelete) {
                    onDelete(value, currentPublicId);
                  }
                  setCurrentPublicId('');
                  onChange('');
                  setLocalPreview('');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/40 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <Trash size={14} />
                <span>Hapus Foto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Feedback */}
      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in duration-200">
          <WarningCircle size={18} weight="fill" className="text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <strong className="block text-white mb-0.5">Gagal Mengunggah Foto:</strong>
            {uploadError}
          </div>
          <button
            type="button"
            onClick={() => setUploadError('')}
            className="text-rose-400 hover:text-white p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
