export const WA_NUMBER = "62895621072782";

export function formatRupiah(val) {
  if (!val) return 'Rp 0';
  const number = typeof val === 'number' ? val : parseInt(val.toString().replace(/[^0-9]/g, ''), 10) || 0;
  return `Rp ${number.toLocaleString('id-ID')}`;
}

export function getCategoryBadgeStyle(category) {
  const cat = (category || '').toLowerCase().trim();

  // Mini Stiker
  if (cat.includes('mini') && (cat.includes('stik') || cat.includes('stick'))) {
    return 'bg-cyan-700 text-cyan-100';
  }

  // Stiker reguler
  if (cat.includes('stik') || cat.includes('stick')) {
    return 'bg-emerald-700 text-lime-300';
  }

  // Keychain / Gantungan Kunci
  if (cat.includes('keychain') || cat.includes('kunci')) {
    return 'bg-amber-600 text-white';
  }

  // Poster
  if (cat.includes('poster')) {
    return 'bg-purple-700 text-white';
  }

  // Jersey
  if (cat.includes('jersey')) {
    return 'bg-rose-700 text-white';
  }

  // Apparel / Pakaian
  if (cat.includes('apparel') || cat.includes('baju') || cat.includes('kaos')) {
    return 'bg-blue-700 text-white';
  }

  // Aksesoris
  if (cat.includes('aksesoris') || cat.includes('accessori')) {
    return 'bg-teal-700 text-white';
  }

  return 'bg-emerald-800 text-white';
}
