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

export function isItemSoldOut(item) {
  if (!item) return false;
  if (typeof item.is_sold_out === 'boolean') return item.is_sold_out;
  return String(item.sold_out || '').trim().toUpperCase() === 'Y';
}

export function isLeicesterCity(item) {
  if (!item) return false;
  const team = String(item.team || '').toLowerCase();
  const title = String(item.title || '').toLowerCase();
  return team.includes('leicester') || title.includes('leicester') || title.includes('indofoxes');
}

export function getFamousPlayerRank(item) {
  if (!item) return -1;
  const text = `${item.player_name || ''} ${item.title || ''}`.toLowerCase();

  // MSN tidak dimasukkan ke sorting pemain terkenal
  if (text.includes('msn')) {
    return -1;
  }

  // Exclude Ronaldo Nazario / R9 dari pencarian Cristiano Ronaldo
  const isRonaldoNazario = text.includes('nazario') || /\br9\b/.test(text);

  if (!isRonaldoNazario && (text.includes('cristiano ronaldo') || /\bcr7\b/.test(text))) {
    return 0; // Cristiano Ronaldo
  }
  if (text.includes('lionel messi') || /\bmessi\b/.test(text)) {
    return 1; // Lionel Messi
  }
  if (text.includes('haaland')) {
    return 2; // Erling Haaland
  }
  if (text.includes('mbappe')) {
    return 3; // Kylian Mbappe
  }
  if (text.includes('neymar')) {
    return 4; // Neymar Jr.
  }
  if (text.includes('yamal') || text.includes('lamine')) {
    return 5; // Lamine Yamal
  }
  if (text.includes('jude') || text.includes('bellingham')) {
    return 6; // Jude Bellingham
  }
  return -1;
}

export function compareEdition(a, b) {
  const isSpecialA = isNaN(a.edition) && Boolean(a.edition);
  const isSpecialB = isNaN(b.edition) && Boolean(b.edition);
  if (isSpecialA && !isSpecialB) return -1;
  if (!isSpecialA && isSpecialB) return 1;
  const edA = parseInt(a.edition, 10) || 0;
  const edB = parseInt(b.edition, 10) || 0;
  return edB - edA;
}

export function sortCatalogProducts(items, activeCategory = 'all') {
  if (!Array.isArray(items)) return [];
  const normalizedCat = normalizeCategory(activeCategory);
  const isAllCategory = !normalizedCat || normalizedCat === 'all';

  return [...items].sort((a, b) => {
    // 1. Sold out selalu berada di paling bawah di seluruh kategori
    const soldA = isItemSoldOut(a);
    const soldB = isItemSoldOut(b);
    if (soldA !== soldB) {
      return soldA ? 1 : -1;
    }

    // 2. Untuk LEICESTER CITY FC, taruh di atas sold out (posisi paling bawah di antara produk yang tersedia)
    if (!soldA && !soldB) {
      const leiA = isLeicesterCity(a);
      const leiB = isLeicesterCity(b);
      if (leiA !== leiB) {
        return leiA ? 1 : -1;
      }
    }

    // 3. Di tampilan default ('all' / 'semua'), prioritaskan pemain terkenal di bagian awal/atas
    if (isAllCategory) {
      const rankA = getFamousPlayerRank(a);
      const rankB = getFamousPlayerRank(b);
      const isFamA = rankA !== -1;
      const isFamB = rankB !== -1;

      if (isFamA !== isFamB) {
        return isFamA ? -1 : 1;
      }

      if (isFamA && isFamB) {
        // Antara sesama pemain terkenal:
        // Prioritaskan edisi terbaru (Special/Limited -> Edisi 12 -> Edisi 10 -> ...)
        // Pada edisi yang sama (seperti Edisi 12), urutkan sesuai prioritas bintang:
        // Cristiano Ronaldo -> Lionel Messi -> Haaland -> Mbappe -> Neymar -> Lamine Yamal
        const edDiff = compareEdition(a, b);
        if (edDiff !== 0) return edDiff;
        if (rankA !== rankB) return rankA - rankB;
        return (a.id || 0) - (b.id || 0);
      }
    }

    // 3. Urutkan berdasarkan edisi (spesial/terbaru lebih dulu)
    const edDiff = compareEdition(a, b);
    if (edDiff !== 0) return edDiff;

    // Jika pada edisi yang sama ada pemain terkenal, tetap tampilkan pemain terkenal lebih dulu
    const rankA = getFamousPlayerRank(a);
    const rankB = getFamousPlayerRank(b);
    const hasRankA = rankA !== -1;
    const hasRankB = rankB !== -1;
    if (hasRankA !== hasRankB) {
      return hasRankA ? -1 : 1;
    }
    if (hasRankA && hasRankB && rankA !== rankB) {
      return rankA - rankB;
    }

    return (a.id || 0) - (b.id || 0);
  });
}

export function getCloudinaryFolderByCategory(categoryId, categoryName = '') {
  const id = Number(categoryId);
  const cat = String(categoryName || '').toLowerCase().trim();

  // 1. Stickers
  if (id === 1 || ((cat.includes('stik') || cat.includes('stick')) && !cat.includes('mini'))) {
    return 'louifootball product/1. Stickers';
  }
  // 2. Mini Stickers
  if (id === 2 || cat.includes('mini')) {
    return 'louifootball product/2. Mini Stickers';
  }
  // 3. Keychains
  if (id === 3 || cat.includes('keychain') || cat.includes('kunci')) {
    return 'louifootball product/3. Keychains';
  }
  // 4. Poster
  if (id === 4 || cat.includes('poster')) {
    return 'louifootball product/4. Poster';
  }
  // 5. Pin
  if (id === 5 || cat.includes('pin')) {
    return 'louifootball product/5. Pin';
  }

  return 'louifootball product';
}

export function getPromoTheme(color) {
  const c = (color || 'lime').toLowerCase().trim();
  switch (c) {
    case 'amber':
    case 'yellow':
    case 'orange':
      return {
        badgeMain: 'bg-amber-400 text-amber-950 font-black',
        badgeSub: 'bg-amber-950/80 text-amber-200 border border-amber-500/40',
        btn: 'bg-amber-400 sm:hover:bg-amber-300 active:bg-amber-500 text-amber-950',
        accentBorder: 'border-amber-500/50',
        accentBg: 'bg-amber-500/10',
        dot: 'bg-amber-400',
      };
    case 'purple':
    case 'indigo':
    case 'violet':
      return {
        badgeMain: 'bg-purple-400 text-purple-950 font-black',
        badgeSub: 'bg-purple-950/80 text-purple-200 border border-purple-500/40',
        btn: 'bg-purple-400 sm:hover:bg-purple-300 active:bg-purple-500 text-purple-950',
        accentBorder: 'border-purple-500/50',
        accentBg: 'bg-purple-500/10',
        dot: 'bg-purple-400',
      };
    case 'cyan':
    case 'blue':
      return {
        badgeMain: 'bg-cyan-400 text-cyan-950 font-black',
        badgeSub: 'bg-cyan-950/80 text-cyan-200 border border-cyan-500/40',
        btn: 'bg-cyan-400 sm:hover:bg-cyan-300 active:bg-cyan-500 text-cyan-950',
        accentBorder: 'border-cyan-500/50',
        accentBg: 'bg-cyan-500/10',
        dot: 'bg-cyan-400',
      };
    case 'rose':
    case 'red':
      return {
        badgeMain: 'bg-rose-400 text-rose-950 font-black',
        badgeSub: 'bg-rose-950/80 text-rose-200 border border-rose-500/40',
        btn: 'bg-rose-400 sm:hover:bg-rose-300 active:bg-rose-500 text-rose-950',
        accentBorder: 'border-rose-500/50',
        accentBg: 'bg-rose-500/10',
        dot: 'bg-rose-400',
      };
    default:
      return {
        badgeMain: 'bg-lime-400 text-emerald-950 font-black',
        badgeSub: 'bg-emerald-800/80 text-lime-300 border border-emerald-600/60',
        btn: 'bg-lime-400 sm:hover:bg-lime-300 active:bg-lime-500 text-emerald-950',
        accentBorder: 'border-lime-500/50',
        accentBg: 'bg-lime-500/10',
        dot: 'bg-lime-400',
      };
  }
}
