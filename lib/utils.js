import Sqids from 'sqids';

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

// Default catalog priority rules fallback (mirrors original hardcoded rules)
export const DEFAULT_CATALOG_PRIORITIES = [
  { id: 1, type: 'top', target_type: 'player', target_value: 'cristiano ronaldo', label: 'Cristiano Ronaldo', sort_order: 1, is_active: true },
  { id: 2, type: 'top', target_type: 'player', target_value: 'messi', label: 'Lionel Messi', sort_order: 2, is_active: true },
  { id: 3, type: 'top', target_type: 'player', target_value: 'haaland', label: 'Erling Haaland', sort_order: 3, is_active: true },
  { id: 4, type: 'top', target_type: 'player', target_value: 'mbappe', label: 'Kylian Mbappe', sort_order: 4, is_active: true },
  { id: 5, type: 'top', target_type: 'player', target_value: 'neymar', label: 'Neymar Jr', sort_order: 5, is_active: true },
  { id: 6, type: 'top', target_type: 'player', target_value: 'yamal', label: 'Lamine Yamal', sort_order: 6, is_active: true },
  { id: 7, type: 'top', target_type: 'player', target_value: 'bellingham', label: 'Jude Bellingham', sort_order: 7, is_active: true },
  { id: 8, type: 'bottom', target_type: 'team', target_value: 'leicester', label: 'Leicester City FC', sort_order: 1, is_active: true },
  { id: 9, type: 'bottom', target_type: 'keyword', target_value: 'indofoxes', label: 'Indofoxes Merchandise', sort_order: 2, is_active: true },
];

export function isItemMatchingPriorityRule(item, rule) {
  if (!item || !rule || rule.is_active === false) return false;
  const targetType = rule.target_type || 'keyword';
  const val = String(rule.target_value || '').toLowerCase().trim();
  if (!val) return false;

  const title = String(item.title || '').toLowerCase();
  const playerName = String(item.player_name || '').toLowerCase();
  const team = String(item.team || '').toLowerCase();
  const year = String(item.year || '').toLowerCase().trim();
  const desc = String(item.desc || '').toLowerCase();
  const combinedPlayerText = `${playerName} ${title}`.toLowerCase();

  switch (targetType) {
    case 'player': {
      // Exclude trio MSN if matching a single player unless rule explicitly is 'msn'
      if (val !== 'msn' && combinedPlayerText.includes('msn')) {
        return false;
      }
      // Khusus jika rule mencari Cristiano Ronaldo, jangan match Ronaldo Nazario / R9
      if (val.includes('ronaldo') && !val.includes('nazario')) {
        const isRonaldoNazario = combinedPlayerText.includes('nazario') || /\br9\b/.test(combinedPlayerText);
        if (isRonaldoNazario) return false;
      }
      // CR7 alias check
      if (val.includes('ronaldo') || val.includes('cr7')) {
        if (/\bcr7\b/.test(combinedPlayerText) || combinedPlayerText.includes('cristiano ronaldo')) {
          return true;
        }
      }
      // Messi alias check
      if (val.includes('messi')) {
        if (/\bmessi\b/.test(combinedPlayerText) || combinedPlayerText.includes('lionel messi')) {
          return true;
        }
      }
      // Yamal / Lamine alias check
      if (val.includes('yamal') || val.includes('lamine')) {
        if (combinedPlayerText.includes('yamal') || combinedPlayerText.includes('lamine')) {
          return true;
        }
      }
      // Bellingham alias check
      if (val.includes('bellingham') || val.includes('jude')) {
        if (combinedPlayerText.includes('bellingham') || combinedPlayerText.includes('jude')) {
          return true;
        }
      }
      // General player matching (player_name or title)
      return playerName.includes(val) || title.includes(val);
    }

    case 'team': {
      return team.includes(val) || title.includes(val);
    }

    case 'year': {
      return year === val;
    }

    case 'product': {
      return String(item.id) === String(rule.target_value).trim();
    }

    case 'keyword':
    default: {
      return title.includes(val) || playerName.includes(val) || team.includes(val) || desc.includes(val);
    }
  }
}

export function findMatchingPriority(item, rules, type = 'top') {
  if (!item || !Array.isArray(rules) || rules.length === 0) return null;
  const filteredRules = rules
    .filter((r) => r && r.type === type && r.is_active !== false)
    .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));

  for (const rule of filteredRules) {
    if (isItemMatchingPriorityRule(item, rule)) {
      return {
        rule,
        sortOrder: Number(rule.sort_order) || 0,
      };
    }
  }
  return null;
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

export function sortCatalogProducts(items, activeCategory = 'all', priorityRules = null) {
  if (!Array.isArray(items)) return [];
  const normalizedCat = normalizeCategory(activeCategory);
  const isAllCategory = !normalizedCat || normalizedCat === 'all';
  const effectiveRules = Array.isArray(priorityRules) ? priorityRules : [];

  return [...items].sort((a, b) => {
    // 1. Sold out selalu berada di paling bawah di seluruh kategori
    const soldA = isItemSoldOut(a);
    const soldB = isItemSoldOut(b);
    if (soldA !== soldB) {
      return soldA ? 1 : -1;
    }

    // 2. Bottom Priority Items (Skenario A: posisi di atas sold out, urutan 1 lebih atas, urutan lebih besar makin ke bawah mendekati sold out)
    if (!soldA && !soldB) {
      const matchBotA = findMatchingPriority(a, effectiveRules, 'bottom');
      const matchBotB = findMatchingPriority(b, effectiveRules, 'bottom');
      const isBotA = Boolean(matchBotA);
      const isBotB = Boolean(matchBotB);

      if (isBotA !== isBotB) {
        return isBotA ? 1 : -1;
      }

      if (isBotA && isBotB) {
        // Sesama Bottom (Skenario A): nomor urut kecil lebih atas dari nomor urut besar
        const rankDiff = matchBotA.sortOrder - matchBotB.sortOrder;
        if (rankDiff !== 0) return rankDiff;
        const edDiff = compareEdition(a, b);
        if (edDiff !== 0) return edDiff;
        return (a.id || 0) - (b.id || 0);
      }
    }

    // 3. Di tampilan default ('all' / 'semua'), prioritaskan produk Top di bagian awal/atas melintasi semua edisi
    if (isAllCategory) {
      const matchTopA = findMatchingPriority(a, effectiveRules, 'top');
      const matchTopB = findMatchingPriority(b, effectiveRules, 'top');
      const isTopA = Boolean(matchTopA);
      const isTopB = Boolean(matchTopB);

      if (isTopA !== isTopB) {
        return isTopA ? -1 : 1;
      }

      if (isTopA && isTopB) {
        // Antara sesama produk Top:
        // Prioritaskan edisi terbaru (Special/Limited -> Edisi 12 -> Edisi 10 -> ...)
        // Pada edisi yang sama, urutkan sesuai prioritas bintang/admin (sort_order kecil lebih dulu):
        const edDiff = compareEdition(a, b);
        if (edDiff !== 0) return edDiff;
        const rankDiff = matchTopA.sortOrder - matchTopB.sortOrder;
        if (rankDiff !== 0) return rankDiff;
        return (a.id || 0) - (b.id || 0);
      }
    }

    // 4. Urutkan berdasarkan edisi (spesial/terbaru lebih dulu)
    const edDiff = compareEdition(a, b);
    if (edDiff !== 0) return edDiff;

    // Jika pada edisi yang sama ada produk Top Priority, tetap tampilkan produk Top lebih dulu
    const matchTopA = findMatchingPriority(a, effectiveRules, 'top');
    const matchTopB = findMatchingPriority(b, effectiveRules, 'top');
    const isTopA = Boolean(matchTopA);
    const isTopB = Boolean(matchTopB);

    if (isTopA !== isTopB) {
      return isTopA ? -1 : 1;
    }
    if (isTopA && isTopB && matchTopA.sortOrder !== matchTopB.sortOrder) {
      return matchTopA.sortOrder - matchTopB.sortOrder;
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

/**
 * Mengoptimalkan URL gambar Cloudinary agar selalu menggunakan transformasi f_auto,q_auto
 * untuk menghemat bandwidth pengguna dan mempercepat load time browser.
 * Fungsi ini idempotent (aman dipanggil berkali-kali tanpa duplikasi parameter).
 *
 * @param {string} url - URL gambar asli
 * @param {string} [extraTransform=''] - Transformasi tambahan opsional (misal: 'w_500' atau 'w_100')
 * @returns {string} URL yang telah dioptimasi dengan f_auto,q_auto
 */
export function optimizeCloudinaryUrl(url, extraTransform = '') {
  if (!url || typeof url !== 'string') return url || '';
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url;
  }

  const uploadToken = '/image/upload/';
  const uploadIndex = url.indexOf(uploadToken);
  if (uploadIndex === -1) return url;

  const prefix = url.substring(0, uploadIndex + uploadToken.length);
  const remainder = url.substring(uploadIndex + uploadToken.length);

  const segments = remainder.split('/');
  const firstSeg = segments[0] || '';

  const isVersion = /^v\d+$/.test(firstSeg);
  const hasTransformationSyntax =
    !isVersion &&
    (firstSeg.includes(',') || /^[a-z]{1,4}_[a-zA-Z0-9_\-.:]+/.test(firstSeg));

  if (hasTransformationSyntax) {
    const transList = firstSeg.split(',').map((t) => t.trim()).filter(Boolean);
    const hasFAuto = transList.some((t) => t.startsWith('f_'));
    const hasQAuto = transList.some((t) => t.startsWith('q_'));

    const newTransList = [];
    if (!hasFAuto) newTransList.push('f_auto');
    if (!hasQAuto) newTransList.push('q_auto');
    newTransList.push(...transList);

    if (extraTransform) {
      const extraList = extraTransform.split(',').map((t) => t.trim()).filter(Boolean);
      for (const et of extraList) {
        if (!newTransList.includes(et)) {
          newTransList.push(et);
        }
      }
    }

    segments[0] = newTransList.join(',');
    return prefix + segments.join('/');
  }

  const baseTrans = ['f_auto', 'q_auto'];
  if (extraTransform) {
    const extraList = extraTransform.split(',').map((t) => t.trim()).filter(Boolean);
    for (const et of extraList) {
      if (!baseTrans.includes(et)) {
        baseTrans.push(et);
      }
    }
  }

  return `${prefix}${baseTrans.join(',')}/${remainder}`;
}

// Inisialisasi Sqids dengan alphabet unik acak khusus Loui Football
const LOUI_QR_ALPHABET = 'qVYtTa3IsSRKDMXpEOdFvolChU1iw094Nybu6xcBeQAPn87HWGf5Jj2zgrZLmk';
const sqidsInstance = new Sqids({
  minLength: 8,
  alphabet: LOUI_QR_ALPHABET,
});

/**
 * Mengubah ID numerik produk menjadi kode acak aman anti-tebak (misal: 156 -> 'KcHFHTuw')
 */
export function encodeProductId(id) {
  const numId = parseInt(String(id || ''), 10);
  if (isNaN(numId) || numId <= 0) return '';
  try {
    return sqidsInstance.encode([numId]);
  } catch {
    return '';
  }
}

/**
 * Mengembalikan kode acak menjadi ID numerik produk asli
 * Menggunakan validasi kanonikal ketat (mencegah modifikasi huruf / tebakan)
 */
export function decodeProductId(code) {
  if (!code || typeof code !== 'string') return null;
  const trimmed = code.trim();
  try {
    const numbers = sqidsInstance.decode(trimmed);
    if (!numbers || numbers.length === 0) return null;
    // Strict verification: pastikan hasil decode saat di-encode ulang menghasilkan string yang sama persis
    if (sqidsInstance.encode(numbers) !== trimmed) return null;
    return numbers[0];
  } catch {
    return null;
  }
}

