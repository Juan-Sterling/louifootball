'use client';

import React, { useState } from 'react';
import { WarningCircle, Trash, X, Spinner, Star, ArrowDown } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { useToast } from './Toast';

export default function PriorityDeleteModal({
  isOpen,
  onClose,
  priority,
  onSuccess,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  if (!isOpen || !priority) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('catalog_priorities')
        .delete()
        .eq('id', priority.id);

      if (error) throw error;

      showToast(`Aturan prioritas "${priority.label}" berhasil dihapus.`, 'success');
      if (onSuccess) onSuccess(priority.id);
      onClose();
    } catch (err) {
      console.error('Error deleting priority:', err);
      showToast(`Gagal menghapus prioritas: ${err.message || 'Terjadi kesalahan sistem.'}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const isTop = priority.type === 'top';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-emerald-950 border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-rose-400">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <WarningCircle size={24} weight="fill" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Hapus Aturan Prioritas?</h3>
              <p className="text-xs text-rose-300/80">Tindakan ini permanen dan tidak dapat dibatalkan.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Priority Details Card */}
        <div className="p-3.5 rounded-xl bg-emerald-900/40 border border-emerald-700/40 space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isTop
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {isTop ? <Star size={12} weight="fill" /> : <ArrowDown size={12} weight="bold" />}
              {isTop ? 'TOP Priority' : 'BOTTOM Priority'}
            </span>
            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">
              {priority.target_type}
            </span>
          </div>

          <div className="font-bold text-white text-sm">{priority.label}</div>
          <div className="text-xs text-emerald-300/80 font-mono">
            target: {priority.target_value}
          </div>
          {priority.notes && (
            <div className="text-xs text-emerald-400/70 italic">
              Catatan: {priority.notes}
            </div>
          )}
        </div>

        <p className="text-xs text-emerald-300/80 leading-relaxed">
          Setelah dihapus, produk yang bersangkutan tidak akan lagi diprioritaskan di posisi{' '}
          <strong>{isTop ? 'teratas' : 'terbawah'}</strong> katalog.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-emerald-700/60 text-emerald-300 hover:text-white hover:bg-emerald-900/50 text-xs font-semibold transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold text-xs shadow-lg shadow-rose-950/50 hover:from-rose-600 hover:to-red-700 transition cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Spinner size={16} className="animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash size={16} weight="bold" />
                <span>Hapus Prioritas</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

