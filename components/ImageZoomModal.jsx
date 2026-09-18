'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Minus, X } from '@phosphor-icons/react';

export default function ImageZoomModal({ isOpen, imgSrc, title, onClose }) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPanRef = useRef({ x: 0, y: 0 });
  const initialPinchDistRef = useRef(null);
  const initialPinchScaleRef = useRef(1);

  const MIN_ZOOM = 0.6;
  const MAX_ZOOM = 4.0;
  const ZOOM_STEP = 0.25;

  // Reset zoom on open/close
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, imgSrc]);

  const updateZoom = useCallback((newScale) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(newScale * 100) / 100));
    setScale(clamped);
    if (clamped <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, []);

  const handleZoomIn = () => updateZoom(scale + ZOOM_STEP);
  const handleZoomOut = () => updateZoom(scale - ZOOM_STEP);
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, scale, updateZoom, onClose]);

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPanRef.current = { ...pan };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: initialPanRef.current.x + dx,
        y: initialPanRef.current.y + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    updateZoom(scale + delta);
  };

  // Double click zoom toggle
  const handleDoubleClick = (e) => {
    e.preventDefault();
    if (scale > 1.2) {
      handleResetZoom();
    } else {
      updateZoom(2.0);
    }
  };

  // Touch pinch & pan
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      initialPanRef.current = { ...pan };
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      initialPinchDistRef.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPan({
        x: initialPanRef.current.x + dx,
        y: initialPanRef.current.y + dy,
      });
    } else if (e.touches.length === 2 && initialPinchDistRef.current) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = currentDist / initialPinchDistRef.current;
      updateZoom(initialPinchScaleRef.current * factor);
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      initialPinchDistRef.current = null;
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
    }
  };

  if (!isOpen || !imgSrc) return null;

  return (
    <div
      id="imageZoomModal"
      className="fixed inset-0 bg-black/95 backdrop-blur-md z-[70] flex flex-col items-center justify-between p-3 sm:p-5 select-none transition-opacity duration-200"
    >
      {/* Header Toolbar Modal Zoom */}
      <div className="w-full max-w-5xl flex items-center justify-between z-30 px-2 py-1">
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          <span className="text-xs sm:text-sm font-bold text-white/90 truncate">
            {title || 'Detail Gambar'}
          </span>
        </div>

        {/* Tombol Kontrol Zoom */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            type="button"
            aria-label="Perkecil"
            title="Zoom Out (-)"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-lime-400 hover:text-emerald-950 text-white flex items-center justify-center transition shadow cursor-pointer active:scale-95"
          >
            <Minus size={16} weight="bold" />
          </button>

          {/* Zoom Level Indicator */}
          <button
            onClick={handleResetZoom}
            type="button"
            title="Reset Ukuran (100%)"
            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-white/10 hover:bg-white/20 text-lime-300 font-mono text-xs sm:text-sm font-bold flex items-center justify-center transition cursor-pointer"
          >
            <span>{Math.round(scale * 100)}%</span>
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            type="button"
            aria-label="Perbesar"
            title="Zoom In (+)"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-lime-400 hover:text-emerald-950 text-white flex items-center justify-center transition shadow cursor-pointer active:scale-95"
          >
            <Plus size={16} weight="bold" />
          </button>

          {/* Tutup Modal Zoom */}
          <button
            onClick={onClose}
            type="button"
            aria-label="Tutup"
            title="Tutup (Esc)"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 hover:bg-rose-600 hover:text-white text-white flex items-center justify-center transition ml-1.5 shadow cursor-pointer active:scale-95"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
      </div>

      {/* Area Kanvas Gambar (Bisa Di-drag / Pan & Scroll Wheel Zoom) */}
      <div
        id="zoomViewport"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full flex-1 flex items-center justify-center overflow-hidden my-2 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <img
          src={imgSrc}
          alt="Zoom Preview"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
          className="max-w-[92vw] max-h-[85vh] object-contain drop-shadow-2xl select-none will-change-transform pointer-events-none"
        />
      </div>
    </div>
  );
}
