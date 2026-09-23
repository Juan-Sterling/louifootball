export const WA_NUMBER = "62895621072782";

export function formatRupiah(val) {
  if (!val) return 'Rp 0';
  const number = typeof val === 'number' ? val : parseInt(val.toString().replace(/[^0-9]/g, ''), 10) || 0;
  return `Rp ${number.toLocaleString('id-ID')}`;
}

export function parseVariants(variants) {
  if (!variants) return null;
  let parsed = variants;
  if (typeof variants === 'string') {
    try {
      parsed = JSON.parse(variants);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  const cleaned = parsed
    .map((v) => ({
      size: String(v.size || v.name || '').trim(),
      price: typeof v.price === 'number' ? v.price : parseInt(String(v.price).replace(/[^0-9]/g, ''), 10) || 0,
    }))
    .filter((v) => v.size && v.price > 0);
  return cleaned.length > 0 ? cleaned : null;
}

export function getPriceRangeDisplay(variants, fallbackPrice) {
  const parsed = parseVariants(variants);
  if (parsed && parsed.length > 0) {
    const prices = parsed.map((v) => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) {
      return formatRupiah(minPrice);
    }
    return `${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}`;
  }
  return formatRupiah(fallbackPrice);
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

export function normalizeCategory(cat) {
  if (!cat) return '';
  const c = String(cat).toLowerCase().trim();
  if (c === 'all') return 'all';
  if (c.includes('mini') && (c.includes('stik') || c.includes('stick'))) return 'mini stickers';
  if (c.includes('stik') || c.includes('stick')) return 'stickers';
  if (c.includes('keychain') || c.includes('kunci')) return 'keychains';
  if (c.includes('poster')) return 'posters';
  if (c.includes('pin')) return 'pins';
  if (c.includes('jersey')) return 'jerseys';
  if (c.includes('apparel') || c.includes('baju') || c.includes('kaos')) return 'apparel';
  if (c.includes('aksesoris') || c.includes('accessori')) return 'accessories';
  return c;
}
