const WA_NUMBER = "62895621072782"; // Nomor WhatsApp Toko

const SUPABASE_URL = "https://dnnjcwhyyvcetswashku.supabase.co";
const SUPABASE_KEY = "sb_publishable__pCa3Ej5Z0G8Irhdw8sbcg_Se8C31Hy";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allProducts = [];
let allCategories = [];
let activeCategory = 'all';
let activeStickerEdition = 'all'; // State filter edisi stiker
let isAvailableOnly = false; // State filter produk tersedia (hide sold out)
let currentPage = 1; // Halaman aktif saat ini
const ITEMS_PER_PAGE = 20; // Maksimal produk per halaman

const productGrid = document.getElementById('productGrid');
const noResult = document.getElementById('noResult');
const searchInput = document.getElementById('searchInput');
const editionFilterContainer = document.getElementById('editionFilterContainer');
const editionButtons = document.getElementById('editionButtons');
const paginationContainer = document.getElementById('paginationContainer');
const paginationInfo = document.getElementById('paginationInfo');
const paginationRange = document.getElementById('paginationRange');
const paginationTotal = document.getElementById('paginationTotal');
const paginationButtons = document.getElementById('paginationButtons');

// Product Modal elements
const modal = document.getElementById('productModal');
const modalImg = document.getElementById('modalImg');
const modalImgLink = document.getElementById('modalImgLink');
const modalCategory = document.getElementById('modalCategory');
const modalEdition = document.getElementById('modalEdition');
const modalSpec = document.getElementById('modalSpec');
const modalTeam = document.getElementById('modalTeam');
const modalYear = document.getElementById('modalYear');
const modalTeamBadge = document.getElementById('modalTeamBadge');
const modalYearBadge = document.getElementById('modalYearBadge');
const modalTitle = document.getElementById('modalTitle');
const modalPrice = document.getElementById('modalPrice');
const modalDesc = document.getElementById('modalDesc');
const modalWaBtn = document.getElementById('modalWaBtn');

// Contact Modal
const contactModal = document.getElementById('contactModal');

// Tampilkan state loading (logo berputar + skeleton cards shimmer)
function showLoadingState() {
    productGrid.innerHTML = `
        <div class="col-span-full py-10 flex flex-col items-center justify-center text-center">
            <div class="relative w-16 h-16 mb-3 flex items-center justify-center">
                <div class="absolute inset-0 rounded-full border-4 border-emerald-600/30 border-t-lime-400 animate-spin"></div>
                <img src="https://res.cloudinary.com/og1jrvy3/image/upload/f_auto,q_auto,w_100/v1789010759/756654575_17897804865557650_2370756875670529296_n.jpg"
                    alt="Loading LOUIFOOTBALL"
                    class="w-10 h-10 rounded-xl object-cover shadow-md"
                    onerror="this.src='https://placehold.co/100x100/225717/ffffff?text=Loui'">
            </div>
            <p class="text-sm font-bold text-white tracking-wide">Memuat Katalog Produk...</p>
            <p class="text-xs text-emerald-200/80 mt-1">Mengambil koleksi terbaru dari database</p>
        </div>

        ${[1, 2, 3, 4].map(() => `
            <div class="bg-white/95 rounded-2xl p-3 flex flex-col justify-between border-2 border-emerald-800/30 animate-pulse shadow">
                <div>
                    <div class="aspect-square rounded-xl bg-emerald-950/10 mb-2.5 flex items-center justify-center">
                        <i class="ph-bold ph-soccer-ball animate-spin text-emerald-800/20 text-3xl"></i>
                    </div>
                    <div class="h-3 bg-emerald-950/10 rounded-full w-1/3 mb-2"></div>
                    <div class="h-4 bg-emerald-950/15 rounded-full w-4/5 mb-1.5"></div>
                    <div class="h-3 bg-emerald-950/10 rounded-full w-1/2 mb-3"></div>
                </div>
                <div class="mt-2 pt-2 border-t border-gray-100">
                    <div class="h-4 bg-emerald-950/20 rounded-full w-2/5 mb-2"></div>
                    <div class="h-8 bg-emerald-900/20 rounded-xl w-full"></div>
                </div>
            </div>
        `).join('')}
    `;
}

// Helper styling warna badge kategori dinamis
function getCategoryBadgeStyle(category) {
    const cat = (category || '').toLowerCase().trim();
    switch (cat) {
        case 'stiker':
        case 'stickers':
            return 'bg-emerald-700 text-lime-300';
        case 'mini sticker':
        case 'mini stickers':
        case 'mini stikers':
        case 'mini stiker':
            return 'bg-cyan-700 text-cyan-100';
        case 'keychain':
            return 'bg-amber-600 text-white';
        case 'poster':
            return 'bg-purple-700 text-white';
        case 'jersey':
            return 'bg-rose-700 text-white';
        case 'apparel':
            return 'bg-blue-700 text-white';
        case 'aksesoris':
            return 'bg-teal-700 text-white';
        default:
            return 'bg-emerald-800 text-white';
    }
}

// Muat daftar kategori dari tabel 'categories' Supabase
async function loadCategories() {
    try {
        const { data, error } = await supabaseClient
            .from('categories')
            .select('*')
            .order('id', { ascending: true });

        if (!error && data && data.length > 0) {
            allCategories = data;
            renderCategoryTabs(allCategories);
            return allCategories;
        } else if (error) {
            throw error;
        }
    } catch (err) {
        console.warn("Gagal memuat kategori dari Database, menggunakan data cadangan:", err);
        if (allCategories.length === 0) {
            allCategories = [
                { id: 1, category: "stiker", spec: "Vinyl Waterproof • 7 cm", desc: "Bahan vinyl tebal tahan air, panas matahari, dan anti gores. Cocok untuk laptop, helm, dan tumbler." },
                { id: 2, category: "mini stiker", spec: "Vinyl Waterproof • 4 cm", desc: "Bahan vinyl mini tebal anti air, pas untuk casing handphone, binder, dan jurnal." },
                { id: 3, category: "keychain", spec: "Akrilik 3mm • 2 Sisi HD", desc: "Akrilik bening 3mm dengan cetak tajam 2 sisi definisi tinggi, dilengkapi ring putar anti karat." },
                { id: 4, category: "poster", spec: "Art Carton 260gr • 32x48 cm", desc: "Poster eksklusif kualitas cetak studio gallery tahan pudar untuk dekorasi dinding kamar." }
            ];
            renderCategoryTabs(allCategories);
        }
        return allCategories;
    }
}

// Render tombol tabs kategori secara dinamis dari tabel categories
function renderCategoryTabs(categories) {
    const categoryTabsContainer = document.getElementById('categoryTabs');
    if (!categoryTabsContainer || !categories || categories.length === 0) return;

    let html = `
        <button id="cat-all" onclick="filterCategory('all', this)"
            class="cat-btn font-loui tracking-wider uppercase px-4 py-1.5 rounded-full ${activeCategory === 'all' ? 'bg-lime-400 text-emerald-950' : 'bg-emerald-950/80 border border-emerald-600/40 text-emerald-100 hover:bg-emerald-900'} text-xs whitespace-nowrap shadow cursor-pointer transition">
            Semua
        </button>
    `;

    categories.forEach(cat => {
        const rawCategory = cat.category || '';
        const slug = rawCategory.toLowerCase().trim();
        if (!slug) return;

        const btnId = `cat-${slug.replace(/\s+/g, '-')}`;
        const isActive = activeCategory === slug;
        const label = slug.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        html += `
            <button id="${btnId}" onclick="filterCategory('${slug}', this)"
                class="cat-btn font-loui tracking-wider uppercase px-4 py-1.5 rounded-full ${isActive ? 'bg-lime-400 text-emerald-950' : 'bg-emerald-950/80 border border-emerald-600/40 text-emerald-100 hover:bg-emerald-900'} text-xs whitespace-nowrap shadow cursor-pointer transition">
                ${label}
            </button>
        `;
    });

    categoryTabsContainer.innerHTML = html;
}

async function loadProducts() {
    showLoadingState();
    try {
        // Ambil data langsung dari tabel 'products' bersama relasi 'categories' di Database
        const { data, error } = await supabaseClient
            .from('products')
            .select('*, categories(*)');

        if (error || !data || data.length === 0) {
            throw error || new Error("Data dari Database kosong atau bermasalah");
        }

        allProducts = data.map(item => {
            const catObj = item.categories || allCategories.find(c => c.id === item.category_id) || {};
            const playerName = item.player_name || item.title || 'Produk Loui';
            return {
                ...item,
                player_name: playerName,
                title: playerName,
                category: (catObj.category || item.category || 'lainnya').toLowerCase().trim(),
                team: item.team ? String(item.team).trim() : '',
                year: item.year ? String(item.year).trim() : '',
                spec: catObj.spec || item.spec || 'Koleksi Resmi',
                desc: catObj.desc || item.desc || 'Merchandise resmi sepak bola berkualitas dari LOUIFOOTBALL.'
            };
        });
    } catch (error) {
        console.warn("Gagal mengambil data dari Database, beralih ke products.json:", error);
        try {
            const res = await fetch('products.json');
            const fallbackData = await res.json();
            allProducts = fallbackData.map(item => {
                const playerName = item.player_name || item.title || 'Produk Loui';
                return {
                    ...item,
                    player_name: playerName,
                    title: playerName,
                    category: (item.category || '').toLowerCase().trim(),
                    team: item.team ? String(item.team).trim() : '',
                    year: item.year ? String(item.year).trim() : '',
                    spec: item.spec || 'Koleksi Resmi',
                    desc: item.desc || ''
                };
            });
        } catch (fallbackError) {
            console.error("Gagal membaca products.json:", fallbackError);
        }
    }

    // Urutkan: produk sold out di paling bawah, tampilan default ('all') prioritaskan pemain terkenal
    allProducts = sortCatalogProducts(allProducts, 'all');

    buildStickerEditionButtons();
    renderProducts();
}

function isItemSoldOut(item) {
    if (!item) return false;
    if (typeof item.is_sold_out === 'boolean') return item.is_sold_out;
    return String(item.sold_out || '').trim().toUpperCase() === 'Y';
}

function isLeicesterCity(item) {
    if (!item) return false;
    const team = String(item.team || '').toLowerCase();
    const title = String(item.title || '').toLowerCase();
    return team.includes('leicester') || title.includes('leicester') || title.includes('indofoxes');
}

function getFamousPlayerRank(item) {
    if (!item) return -1;
    const text = `${item.player_name || ''} ${item.title || ''}`.toLowerCase();

    // MSN tidak dimasukkan ke sorting pemain terkenal
    if (text.includes('msn')) {
        return -1;
    }

    // Exclude Ronaldo Nazario / R9
    const isR9 = text.includes('nazario') || /\br9\b/.test(text);

    if (!isR9 && (text.includes('cristiano ronaldo') || /\bcr7\b/.test(text))) {
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
    return -1;
}

function compareEdition(a, b) {
    const isSpecialA = isNaN(a.edition) && Boolean(a.edition);
    const isSpecialB = isNaN(b.edition) && Boolean(b.edition);
    if (isSpecialA && !isSpecialB) return -1;
    if (!isSpecialA && isSpecialB) return 1;
    const edA = parseInt(a.edition, 10) || 0;
    const edB = parseInt(b.edition, 10) || 0;
    return edB - edA;
}

function sortCatalogProducts(items, category = 'all') {
    if (!Array.isArray(items)) return [];
    const isAll = !category || category === 'all';

    return [...items].sort((a, b) => {
        // 1. Sold out selalu di paling bawah di seluruh kategori
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
        if (isAll) {
            const rankA = getFamousPlayerRank(a);
            const rankB = getFamousPlayerRank(b);
            const isFamA = rankA !== -1;
            const isFamB = rankB !== -1;

            if (isFamA !== isFamB) {
                return isFamA ? -1 : 1;
            }

            if (isFamA && isFamB) {
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

// Generate tombol filter edisi berdasarkan data stiker yang ada
function buildStickerEditionButtons() {
    const stickerProducts = allProducts.filter(item => {
        const cat = item.category || item.categories?.category || '';
        return (cat === 'stiker' || item.category_id === 1) && item.edition && String(item.edition).trim() !== '';
    });

    const rawEditions = [...new Set(stickerProducts.map(item => String(item.edition).trim()))];
    const specialEditions = [];
    const numberedEditions = [];

    rawEditions.forEach(ed => {
        if (isNaN(ed)) {
            specialEditions.push(ed);
        } else {
            numberedEditions.push(parseInt(ed, 10));
        }
    });

    numberedEditions.sort((a, b) => b - a); // Edisi 30, 29, ..., 1

    let html = `
        <button id="btn-ed-all" onclick="selectEditionTab('all', this)"
            class="edition-btn px-3 py-1.5 rounded-xl bg-lime-400 text-emerald-950 text-xs font-black whitespace-nowrap shadow flex-shrink-0 cursor-pointer">
            Semua
        </button>
    `;

    // Dropdown Khusus Edisi Bernomor (Angka)
    if (numberedEditions.length > 0) {
        html += `
            <div class="relative flex-1 min-w-[120px] sm:max-w-[180px]">
                <select id="numberedEditionDropdown" onchange="selectEditionDropdown(this.value)"
                    class="w-full bg-emerald-950/90 border border-emerald-600/50 text-emerald-200 text-xs font-bold py-1.5 pl-3 pr-8 rounded-xl focus:outline-none appearance-none cursor-pointer shadow">
                    <option value="" disabled selected>Pilih Edisi</option>
                    ${numberedEditions.map(ed => `<option value="${ed}" class="bg-emerald-950 text-white font-bold">Edisi #${ed}</option>`).join('')}
                </select>
                <i class="ph-bold ph-caret-down absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none text-xs"></i>
            </div>
        `;
    }

    // Dropdown Edisi Lainnya (Huruf: Special, Collab, dll)
    if (specialEditions.length > 0) {
        html += `
            <div class="relative flex-1 min-w-[130px] sm:max-w-[190px]">
                <select id="otherEditionDropdown" onchange="selectOtherEditionDropdown(this.value)"
                    class="w-full bg-emerald-950/90 border border-amber-400/50 text-amber-300 text-xs font-bold py-1.5 pl-3 pr-8 rounded-xl focus:outline-none appearance-none cursor-pointer shadow">
                    <option value="" disabled selected>Edisi Lainnya</option>
                    ${specialEditions.map(sp => `<option value="${sp}" class="bg-emerald-950 text-white font-bold">${sp}</option>`).join('')}
                </select>
                <i class="ph-bold ph-caret-down absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none text-xs"></i>
            </div>
        `;
    }

    editionButtons.innerHTML = html;
}

// Handler saat tombol Semua diklik
function selectEditionTab(edition, btnElement) {
    activeStickerEdition = edition;
    searchInput.value = '';
    currentPage = 1;

    // Reset tombol Semua
    document.querySelectorAll('.edition-btn').forEach(btn => {
        btn.className = 'edition-btn px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-600/40 text-emerald-200 text-xs font-bold whitespace-nowrap hover:bg-emerald-900 flex-shrink-0 cursor-pointer';
    });
    if (btnElement) {
        btnElement.className = 'edition-btn px-3 py-1.5 rounded-xl bg-lime-400 text-emerald-950 text-xs font-black whitespace-nowrap shadow flex-shrink-0 cursor-pointer';
    }

    // Reset dropdown nomor
    const numSelectEl = document.getElementById('numberedEditionDropdown');
    if (numSelectEl) {
        numSelectEl.selectedIndex = 0;
        numSelectEl.className = 'w-full bg-emerald-950/90 border border-emerald-600/50 text-emerald-200 text-xs font-bold py-1.5 pl-3 pr-8 rounded-xl focus:outline-none appearance-none cursor-pointer shadow';
    }

    // Reset dropdown edisi lainnya
    const otherSelectEl = document.getElementById('otherEditionDropdown');
    if (otherSelectEl) {
        otherSelectEl.selectedIndex = 0;
        otherSelectEl.className = 'w-full bg-emerald-950/90 border border-amber-400/50 text-amber-300 text-xs font-bold py-1.5 pl-3 pr-8 rounded-xl focus:outline-none appearance-none cursor-pointer shadow';
    }

    renderProducts();
}

// Handler saat dropdown edisi angka dipilih
function selectEditionDropdown(val) {
    if (!val) return;
    activeStickerEdition = val;
    searchInput.value = '';
    currentPage = 1;

    // Reset tombol Semua
    const btnAll = document.getElementById('btn-ed-all');
    if (btnAll) {
        btnAll.className = 'edition-btn px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-600/40 text-emerald-200 text-xs font-bold whitespace-nowrap hover:bg-emerald-900 flex-shrink-0 cursor-pointer';
    }

    // Aktifkan dropdown nomor
    const numSelectEl = document.getElementById('numberedEditionDropdown');
    if (numSelectEl) {
        numSelectEl.className = 'w-full bg-lime-400 border border-lime-400 text-emerald-950 text-xs font-black py-1.5 pl-3 pr-8 rounded-xl focus:outline-none shadow appearance-none cursor-pointer';
    }

    // Reset dropdown edisi lainnya
    const otherSelectEl = document.getElementById('otherEditionDropdown');
    if (otherSelectEl) {
        otherSelectEl.selectedIndex = 0;
        otherSelectEl.className = 'w-full bg-emerald-950/90 border border-amber-400/50 text-amber-300 text-xs font-bold py-1.5 pl-3 pr-8 rounded-xl focus:outline-none appearance-none cursor-pointer shadow';
    }

    renderProducts();
}

// Handler saat dropdown edisi lainnya (huruf) dipilih
function selectOtherEditionDropdown(val) {
    if (!val) return;
    activeStickerEdition = val;
    searchInput.value = '';
    currentPage = 1;

    // Reset tombol Semua
    const btnAll = document.getElementById('btn-ed-all');
    if (btnAll) {
        btnAll.className = 'edition-btn px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-600/40 text-emerald-200 text-xs font-bold whitespace-nowrap hover:bg-emerald-900 flex-shrink-0 cursor-pointer';
    }

    // Reset dropdown nomor
    const numSelectEl = document.getElementById('numberedEditionDropdown');
    if (numSelectEl) {
        numSelectEl.selectedIndex = 0;
        numSelectEl.className = 'w-full bg-emerald-950/90 border border-emerald-600/50 text-emerald-200 text-xs font-bold py-1.5 pl-3 pr-8 rounded-xl focus:outline-none appearance-none cursor-pointer shadow';
    }

    // Aktifkan dropdown edisi lainnya
    const otherSelectEl = document.getElementById('otherEditionDropdown');
    if (otherSelectEl) {
        otherSelectEl.className = 'w-full bg-amber-400 border border-amber-400 text-amber-950 text-xs font-black py-1.5 pl-3 pr-8 rounded-xl focus:outline-none shadow appearance-none cursor-pointer';
    }

    renderProducts();
}

// Handler saat admin/user memilih dari dropdown
function handleOlderEditionChange(selectEl) {
    const val = selectEl.value;
    if (!val) return;

    // Reset warna tombol biasa
    document.querySelectorAll('.edition-btn').forEach(btn => {
        btn.className = 'edition-btn px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-emerald-200 text-xs font-bold whitespace-nowrap hover:bg-emerald-900';
    });

    // Aktifkan gaya visual pada select dropdown
    selectEl.className = 'edition-btn appearance-none bg-lime-400 text-emerald-950 text-xs font-black py-1 pl-2.5 pr-6 rounded-lg shadow focus:outline-none cursor-pointer';

    filterStickerEdition(val, selectEl);
}

function toggleAvailableOnly() {
    isAvailableOnly = !isAvailableOnly;
    currentPage = 1;
    const btn = document.getElementById('btnAvailableOnly');
    const icon = document.getElementById('iconAvailableOnly');
    if (btn) {
        if (isAvailableOnly) {
            btn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition cursor-pointer shadow-md select-none shrink-0 bg-lime-400 text-emerald-950 font-black ring-2 ring-lime-300/50";
            if (icon) {
                icon.className = "ph-fill ph-check-circle text-emerald-950";
            }
        } else {
            btn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition cursor-pointer shadow-sm select-none shrink-0 bg-emerald-950/90 border border-emerald-600/50 text-emerald-200 hover:bg-emerald-900 hover:text-white font-bold";
            if (icon) {
                icon.className = "ph-bold ph-check-circle text-lime-400";
            }
        }
    }
    renderProducts();
}

function renderProducts() {
    const query = searchInput.value.toLowerCase().trim();
    productGrid.innerHTML = '';

    const filtered = allProducts.filter(item => {
        // Filter produk tersedia jika aktif
        if (isAvailableOnly) {
            const isSold = String(item.sold_out || '').trim().toUpperCase() === 'Y';
            if (isSold) return false;
        }

        // Filter kategori utama
        const matchCat = (activeCategory === 'all' || item.category === activeCategory);

        // Sub-filter edisi khusus stiker
        let matchStickerEd = true;
        if (activeCategory === 'stiker' && activeStickerEdition !== 'all') {
            matchStickerEd = String(item.edition).trim().toLowerCase() === String(activeStickerEdition).trim().toLowerCase();
        }

        // Pencarian teks
        const titleMatch = (item.player_name || item.title || '').toLowerCase().includes(query);
        const edRaw = item.edition ? String(item.edition).trim() : '';
        const edLower = edRaw.toLowerCase();
        const isSpecialEd = edLower === 'special' || edLower === 'spesial';
        const editionMatch = edRaw
            ? (
                edLower === query ||
                edLower.includes(query) ||
                `edisi ${edLower}`.includes(query) ||
                `#${edLower}`.includes(query) ||
                (isSpecialEd && (query.includes('special') || query.includes('spesial')))
              )
            : false;
        const teamMatch = item.team ? item.team.toLowerCase().includes(query) : false;
        const yearMatch = item.year ? item.year.toLowerCase().includes(query) : false;
        const descMatch = (item.desc ?? '').toLowerCase().includes(query);

        return matchCat && matchStickerEd && (titleMatch || editionMatch || teamMatch || yearMatch || descMatch);
    });

    if (filtered.length === 0) {
        noResult.classList.remove('hidden');
        if (paginationContainer) {
            paginationContainer.classList.add('hidden');
            paginationContainer.classList.remove('flex');
        }
        return;
    }
    noResult.classList.add('hidden');

    const sorted = sortCatalogProducts(filtered, activeCategory);
    const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) currentPage = 1;

    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = sorted.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    paginatedItems.forEach(item => {
        const badgeColor = getCategoryBadgeStyle(item.category);
        const productName = item.player_name || item.title || 'Produk Loui';
        const isNumericEdition = item.edition && !isNaN(item.edition);
        const editionText = item.edition
            ? isNumericEdition
                ? `Edisi #${item.edition}`
                : `Edisi ${item.edition}`
            : '';

        // Format Tim dan Tahun (menggantikan spesifikasi)
        const teamText = item.team ? String(item.team).trim() : '';
        const yearText = item.year ? String(item.year).trim() : '';
        const teamYearParts = [];
        if (teamText) teamYearParts.push(teamText);
        if (yearText) teamYearParts.push(yearText);
        const teamYearDisplay = teamYearParts.join(' • ');

        const isSoldOut = isItemSoldOut(item);
        const isLimited = String(item.edition || '').trim().toUpperCase() === 'LIMITED';
        const card = document.createElement('div');
        card.className = `bg-white rounded-2xl p-3 flex flex-col justify-between hover:shadow-2xl transition duration-150 border-2 ${
            isSoldOut ? 'border-zinc-200/80' : 'border-transparent hover:border-lime-400'
        }`;
        const formattedPrice = isLimited ? 'LIMITED' : getPriceRangeDisplay(item.variants, item.price);
        card.innerHTML = `
          <div>
            <div class="relative aspect-square rounded-xl bg-emerald-50 overflow-hidden mb-2.5 cursor-pointer group" onclick="openModalById('${item.id}')">
              <span class="absolute top-2 left-2 ${badgeColor} text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded shadow capitalize z-10">${item.category}</span>
              ${isSoldOut ? `
                <div class="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center p-2 backdrop-blur-[1px]">
                  <span class="px-3 py-1 bg-red-600/90 text-white text-[11px] sm:text-xs font-black tracking-widest uppercase rounded-lg shadow-lg border border-red-400/50">
                    SOLD OUT
                  </span>
                </div>
              ` : ''}
              <img src="${item.img}" alt="${productName}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
            </div>
            
            <p class="text-[10px] font-black text-amber-700 tracking-wider uppercase">${editionText}</p>
            <h3 class="font-loui text-sm sm:text-base text-gray-900 leading-snug line-clamp-2 mt-0.5 cursor-pointer hover:text-emerald-700 transition tracking-wide" onclick="openModalById('${item.id}')">${productName}</h3>
            ${teamYearDisplay ? `<p class="text-[11px] text-gray-500 mt-1 truncate font-medium" title="${teamYearDisplay}">${teamYearDisplay}</p>` : '<p class="text-[11px] text-transparent mt-1 select-none">-</p>'}
          </div>
          <div class="mt-3 pt-2 border-t border-gray-100">
            <p class="${isLimited ? 'text-amber-600 font-black tracking-wider' : 'text-emerald-950 font-black'} text-sm sm:text-base">${formattedPrice}</p>
            <button onclick="openModalById('${item.id}')" class="w-full mt-2 bg-emerald-800 hover:bg-emerald-900 text-lime-300 text-xs font-bold py-1.5 sm:py-2 rounded-xl transition cursor-pointer">
              Lihat Detail
            </button>
          </div>
        `;
        productGrid.appendChild(card);
    });

    renderPaginationControls(sorted.length, totalPages);
}

function renderPaginationControls(totalItems, totalPages) {
    if (!paginationContainer) return;
    if (totalPages <= 1) {
        paginationContainer.classList.add('hidden');
        paginationContainer.classList.remove('flex');
        return;
    }

    paginationContainer.classList.remove('hidden');
    paginationContainer.classList.add('flex');

    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

    if (paginationRange) paginationRange.textContent = `${startItem} - ${endItem}`;
    if (paginationTotal) paginationTotal.textContent = totalItems;

    if (!paginationButtons) return;

    const pages = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (currentPage <= 4) {
            pages.push(1, 2, 3, 4, 5, '...', totalPages);
        } else if (currentPage >= totalPages - 3) {
            pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
    }

    let html = `
        <button onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}
            class="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                currentPage === 1
                    ? 'bg-emerald-950/40 text-emerald-400/40 border border-emerald-800/30 cursor-not-allowed'
                    : 'bg-emerald-950/90 text-emerald-100 border border-emerald-600/50 hover:bg-emerald-900 hover:text-white cursor-pointer active:scale-95'
            }">
            <i class="ph-bold ph-caret-left"></i>
            <span class="hidden xs:inline sm:inline">Sebelumnya</span>
        </button>
        <div class="flex items-center gap-1">
    `;

    pages.forEach(p => {
        if (p === '...') {
            html += `<span class="px-1.5 py-1 text-emerald-300 font-bold text-xs select-none">...</span>`;
        } else {
            const isActive = p === currentPage;
            html += `
                <button onclick="goToPage(${p})"
                    class="min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                        isActive
                            ? 'bg-lime-400 text-emerald-950 font-black shadow-md scale-105'
                            : 'bg-emerald-950/80 border border-emerald-600/40 text-emerald-100 hover:bg-emerald-900 hover:text-white'
                    }">
                    ${p}
                </button>
            `;
        }
    });

    html += `
        </div>
        <button onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}
            class="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                currentPage === totalPages
                    ? 'bg-emerald-950/40 text-emerald-400/40 border border-emerald-800/30 cursor-not-allowed'
                    : 'bg-emerald-950/90 text-emerald-100 border border-emerald-600/50 hover:bg-emerald-900 hover:text-white cursor-pointer active:scale-95'
            }">
            <span class="hidden xs:inline sm:inline">Selanjutnya</span>
            <i class="ph-bold ph-caret-right"></i>
        </button>
    `;

    paginationButtons.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderProducts();
    const mainEl = document.querySelector('main');
    if (mainEl) {
        const header = document.querySelector('header');
        const offset = header ? header.offsetHeight : 70;
        const top = mainEl.getBoundingClientRect().top + window.scrollY - offset - 10;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
}

function parseVariants(variants) {
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
        .map(v => ({
            size: String(v.size || v.name || '').trim(),
            price: typeof v.price === 'number' ? v.price : parseInt(String(v.price).replace(/[^0-9]/g, ''), 10) || 0
        }))
        .filter(v => v.size && v.price > 0);
    return cleaned.length > 0 ? cleaned : null;
}

function getPriceRangeDisplay(variants, fallbackPrice) {
    const parsed = parseVariants(variants);
    if (parsed && parsed.length > 0) {
        const prices = parsed.map(v => v.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        if (minPrice === maxPrice) {
            return formatRupiah(minPrice);
        }
        return `${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}`;
    }
    return formatRupiah(fallbackPrice);
}

function formatRupiah(val) {
    if (!val) return 'Rp 0';
    const number = typeof val === 'number' ? val : parseInt(val.toString().replace(/[^0-9]/g, ''), 10) || 0;
    return `Rp ${number.toLocaleString('id-ID')}`;
}

function openModalById(id) {
    const item = allProducts.find(p => String(p.id) === String(id));
    if (!item) return;

    const isLimited = String(item.edition || '').trim().toUpperCase() === 'LIMITED';
    const isSoldOut = isItemSoldOut(item);
    const displayPrice = isLimited ? 'LIMITED' : formatRupiah(item.price);
    const productName = item.player_name || item.title || 'Produk Loui';

    modalTitle.innerText = productName;
    modalPrice.innerText = displayPrice;
    if (isLimited) {
        modalPrice.className = "text-xl sm:text-2xl font-black text-amber-600 tracking-wider";
    } else {
        modalPrice.className = "text-xl sm:text-2xl font-black text-emerald-800";
    }
    modalDesc.innerText = item.desc || '-';
    modalCategory.innerText = item.category || '';
    const isNumericEdition = item.edition && !isNaN(item.edition);
    const editionTextDisplay = item.edition ? (isNumericEdition ? `Edisi #${item.edition}` : `Edisi ${item.edition}`) : '';
    modalEdition.innerText = editionTextDisplay;
    if (modalEdition) {
        if (item.edition) {
            modalEdition.classList.remove('hidden');
        } else {
            modalEdition.classList.add('hidden');
        }
    }

    // Tampilkan Team & Year (spec disembunyikan sesuai permintaan)
    if (modalTeam && modalTeamBadge) {
        if (item.team && String(item.team).trim()) {
            modalTeam.innerText = item.team.trim();
            modalTeamBadge.classList.remove('hidden');
            modalTeamBadge.classList.add('inline-flex');
        } else {
            modalTeamBadge.classList.add('hidden');
            modalTeamBadge.classList.remove('inline-flex');
        }
    }

    if (modalYear && modalYearBadge) {
        if (item.year && String(item.year).trim()) {
            modalYear.innerText = item.year.trim();
            modalYearBadge.classList.remove('hidden');
            modalYearBadge.classList.add('inline-flex');
        } else {
            modalYearBadge.classList.add('hidden');
            modalYearBadge.classList.remove('inline-flex');
        }
    }

    modalImg.src = item.img;
    if (modalImgLink && modalImgLink.tagName === 'A') {
        modalImgLink.href = item.img;
    }

    const editionText = item.edition
        ? isNumericEdition
            ? `(Edisi #${item.edition})`
            : `(Edisi ${item.edition})`
        : '';
    const teamYearParts = [];
    if (item.team && String(item.team).trim()) teamYearParts.push(`Tim/Klub: ${item.team.trim()}`);
    if (item.year && String(item.year).trim()) teamYearParts.push(`Musim: ${item.year.trim()}`);
    const teamYearWaText = teamYearParts.length > 0 ? `\n${teamYearParts.join('\n')}` : '';

    const msg = isLimited
        ? encodeURIComponent(`Halo LOUIFOOTBALL, saya ingin bertanya tentang edisi koleksi terbatas:

*${productName}* ${editionText}${teamYearWaText}
Status: Edisi Limited (Koleksi / Tidak Dijual)`)
        : isSoldOut
        ? encodeURIComponent(`Halo LOUIFOOTBALL, saya ingin bertanya tentang stok produk:

*${productName}* ${editionText}${teamYearWaText}
Status: Sold Out

Apakah produk ini akan restock kembali?`)
        : encodeURIComponent(`Halo LOUIFOOTBALL, saya ingin memesan:

*${productName}* ${editionText}${teamYearWaText}
Harga: ${displayPrice}

Apakah stok masih ada?`);

    modalWaBtn.href = `https://wa.me/${WA_NUMBER}?text=${msg}`;
    if (isLimited) {
        modalWaBtn.className = "w-full bg-zinc-800 hover:bg-zinc-900 text-amber-300 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-md transition";
        modalWaBtn.innerHTML = '<i class="ph-bold ph-whatsapp-logo text-lg text-green-400"></i> Tanya Info via WhatsApp';
    } else if (isSoldOut) {
        modalWaBtn.className = "w-full bg-zinc-800 hover:bg-zinc-900 text-lime-300 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-md transition";
        modalWaBtn.innerHTML = '<i class="ph-bold ph-whatsapp-logo text-lg text-green-400"></i> Tanya Restock via WhatsApp';
    } else {
        modalWaBtn.className = "w-full bg-emerald-800 hover:bg-emerald-900 text-lime-300 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-md transition";
        modalWaBtn.innerHTML = '<i class="ph-bold ph-whatsapp-logo text-lg text-green-400"></i> Order via WhatsApp';
    }

    // Shopee & Tokopedia buttons
    const shopeeBtn = document.getElementById('modalShopeeBtn');
    const tokpedBtn = document.getElementById('modalTokopediaBtn');
    if (shopeeBtn && tokpedBtn) {
        if (isLimited) {
            shopeeBtn.className = "bg-gray-100 border border-gray-200 text-gray-400 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-not-allowed opacity-60 select-none";
            shopeeBtn.removeAttribute('href');
            shopeeBtn.title = "Produk edisi Limited tidak dijual di Shopee";
            shopeeBtn.innerHTML = '<i class="ph-bold ph-shopping-bag-open text-base text-gray-400"></i> Shopee (Tidak Dijual)';

            tokpedBtn.className = "bg-gray-100 border border-gray-200 text-gray-400 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-not-allowed opacity-60 select-none";
            tokpedBtn.removeAttribute('href');
            tokpedBtn.title = "Produk edisi Limited tidak dijual di Tokopedia";
            tokpedBtn.innerHTML = '<i class="ph-bold ph-storefront text-base text-gray-400"></i> Tokopedia (Tidak Dijual)';
        } else if (isSoldOut) {
            shopeeBtn.className = "bg-gray-100 border border-gray-200 text-gray-400 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-not-allowed opacity-60 select-none";
            shopeeBtn.removeAttribute('href');
            shopeeBtn.title = "Produk telah habis terjual (Sold Out)";
            shopeeBtn.innerHTML = '<i class="ph-bold ph-shopping-bag-open text-base text-gray-400"></i> Shopee (Habis)';

            tokpedBtn.className = "bg-gray-100 border border-gray-200 text-gray-400 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-not-allowed opacity-60 select-none";
            tokpedBtn.removeAttribute('href');
            tokpedBtn.title = "Produk telah habis terjual (Sold Out)";
            tokpedBtn.innerHTML = '<i class="ph-bold ph-storefront text-base text-gray-400"></i> Tokopedia (Habis)';
        } else {
            shopeeBtn.className = "bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs transition cursor-pointer";
            shopeeBtn.href = "https://id.shp.ee/a5f6X4Wq";
            shopeeBtn.title = "";
            shopeeBtn.innerHTML = '<i class="ph-bold ph-shopping-bag-open text-base"></i> Shopee Store';

            tokpedBtn.className = "bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs transition cursor-pointer";
            tokpedBtn.href = "https://tk.tokopedia.com/ZSqEjQvMt/";
            tokpedBtn.title = "";
            tokpedBtn.innerHTML = '<i class="ph-bold ph-storefront text-base text-emerald-600"></i> Tokopedia Store';
        }
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function openContactModal() {
    contactModal.classList.remove('hidden');
    contactModal.classList.add('flex');
}

function closeContactModal() {
    contactModal.classList.add('hidden');
    contactModal.classList.remove('flex');
}

// ==========================================
// IMAGE ZOOM LIGHTBOX MODAL
// ==========================================
const imageZoomModal = document.getElementById('imageZoomModal');
const zoomImg = document.getElementById('zoomImg');
const zoomViewport = document.getElementById('zoomViewport');
const zoomLevelIndicator = document.getElementById('zoomLevelIndicator');
const zoomProductTitle = document.getElementById('zoomProductTitle');

let currentZoomScale = 1;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 4.0;
const ZOOM_STEP = 0.25;

let zoomPanX = 0;
let zoomPanY = 0;
let isZoomDragging = false;
let zoomDragStartX = 0;
let zoomDragStartY = 0;
let zoomInitialPanX = 0;
let zoomInitialPanY = 0;

let initialPinchDistance = null;
let initialPinchScale = 1;

function applyZoomTransform(animate = false) {
    if (!zoomImg) return;
    zoomImg.style.transition = animate ? 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none';
    zoomImg.style.transform = `translate(${zoomPanX}px, ${zoomPanY}px) scale(${currentZoomScale})`;
    if (zoomLevelIndicator) {
        zoomLevelIndicator.innerText = `${Math.round(currentZoomScale * 100)}%`;
    }
}

function openImageZoomModal(customImgSrc, customTitle) {
    const src = customImgSrc || (modalImg ? modalImg.src : '');
    const title = customTitle || (modalTitle ? modalTitle.innerText : 'Detail Gambar');

    if (!src) return;

    if (zoomImg) zoomImg.src = src;
    if (zoomProductTitle) zoomProductTitle.innerText = title;

    currentZoomScale = 1;
    zoomPanX = 0;
    zoomPanY = 0;
    applyZoomTransform(false);

    if (imageZoomModal) {
        imageZoomModal.classList.remove('hidden');
        imageZoomModal.classList.add('flex');
    }
}

function closeImageZoomModal() {
    if (!imageZoomModal) return;
    imageZoomModal.classList.add('hidden');
    imageZoomModal.classList.remove('flex');
    currentZoomScale = 1;
    zoomPanX = 0;
    zoomPanY = 0;
    applyZoomTransform(false);
}

function setZoomScale(newScale) {
    const clampedScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(newScale * 100) / 100));
    if (clampedScale === currentZoomScale) return;

    if (clampedScale <= 1) {
        zoomPanX = 0;
        zoomPanY = 0;
    }
    currentZoomScale = clampedScale;
    applyZoomTransform(true);
}

function zoomInImage() {
    setZoomScale(currentZoomScale + ZOOM_STEP);
}

function zoomOutImage() {
    setZoomScale(currentZoomScale - ZOOM_STEP);
}

function resetImageZoom() {
    currentZoomScale = 1;
    zoomPanX = 0;
    zoomPanY = 0;
    applyZoomTransform(true);
}

// Event listeners untuk Zoom Viewport (Drag, Wheel, Touch Pinch)
if (zoomViewport) {
    zoomViewport.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isZoomDragging = true;
        zoomDragStartX = e.clientX;
        zoomDragStartY = e.clientY;
        zoomInitialPanX = zoomPanX;
        zoomInitialPanY = zoomPanY;
        zoomViewport.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isZoomDragging) return;
        const deltaX = e.clientX - zoomDragStartX;
        const deltaY = e.clientY - zoomDragStartY;
        zoomPanX = zoomInitialPanX + deltaX;
        zoomPanY = zoomInitialPanY + deltaY;
        applyZoomTransform(false);
    });

    window.addEventListener('mouseup', () => {
        if (isZoomDragging) {
            isZoomDragging = false;
            if (zoomViewport) zoomViewport.style.cursor = 'grab';
        }
    });

    zoomViewport.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    zoomViewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
        setZoomScale(currentZoomScale + delta);
    }, { passive: false });

    zoomViewport.addEventListener('dblclick', (e) => {
        e.preventDefault();
        if (currentZoomScale > 1.2) {
            resetImageZoom();
        } else {
            setZoomScale(2);
        }
    });

    zoomViewport.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isZoomDragging = true;
            zoomDragStartX = e.touches[0].clientX;
            zoomDragStartY = e.touches[0].clientY;
            zoomInitialPanX = zoomPanX;
            zoomInitialPanY = zoomPanY;
        } else if (e.touches.length === 2) {
            isZoomDragging = false;
            initialPinchDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialPinchScale = currentZoomScale;
        }
    }, { passive: true });

    zoomViewport.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && isZoomDragging) {
            const deltaX = e.touches[0].clientX - zoomDragStartX;
            const deltaY = e.touches[0].clientY - zoomDragStartY;
            zoomPanX = zoomInitialPanX + deltaX;
            zoomPanY = zoomInitialPanY + deltaY;
            applyZoomTransform(false);
        } else if (e.touches.length === 2 && initialPinchDistance) {
            const currentDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const scaleFactor = currentDistance / initialPinchDistance;
            setZoomScale(initialPinchScale * scaleFactor);
        }
    }, { passive: true });

    zoomViewport.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            initialPinchDistance = null;
        }
        if (e.touches.length === 0) {
            isZoomDragging = false;
        }
    }, { passive: true });
}

// Filter Kategori Utama
function filterCategory(category, btnElement) {
    activeCategory = category;
    activeStickerEdition = 'all';
    searchInput.value = '';
    currentPage = 1;

    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.className = 'cat-btn px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-600/40 text-emerald-100 text-xs font-bold whitespace-nowrap hover:bg-emerald-900';
    });
    if (btnElement) {
        btnElement.className = 'cat-btn px-4 py-1.5 rounded-full bg-lime-400 text-emerald-950 text-xs font-black whitespace-nowrap shadow';
    } else {
        const targetBtn = document.getElementById(`cat-${category.replace(/\s+/g, '-')}`) || document.getElementById('cat-all');
        if (targetBtn) {
            targetBtn.className = 'cat-btn px-4 py-1.5 rounded-full bg-lime-400 text-emerald-950 text-xs font-black whitespace-nowrap shadow';
        }
    }

    // Tampilkan sub-filter hanya jika kategori "stiker" dipilih
    if (activeCategory === 'stiker') {
        editionFilterContainer.classList.remove('hidden');
        editionFilterContainer.classList.add('flex');
        resetEditionBtnStyles('all');
    } else {
        editionFilterContainer.classList.add('hidden');
        editionFilterContainer.classList.remove('flex');
    }

    renderProducts();
}

// Sub-filter edisi khusus stiker
function filterStickerEdition(edition, btnElement) {
    activeStickerEdition = edition;
    searchInput.value = '';

    document.querySelectorAll('.edition-btn').forEach(btn => {
        btn.className = 'edition-btn px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-emerald-200 text-xs font-bold whitespace-nowrap hover:bg-emerald-900';
    });
    btnElement.className = 'edition-btn px-3 py-1 rounded-lg bg-lime-400 text-emerald-950 text-xs font-black whitespace-nowrap shadow';

    renderProducts();
}

function resetEditionBtnStyles(targetEdition) {
    document.querySelectorAll('.edition-btn').forEach(btn => {
        btn.className = 'edition-btn px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-emerald-200 text-xs font-bold whitespace-nowrap hover:bg-emerald-900';
    });
    const firstBtn = editionButtons.querySelector('button');
    if (firstBtn && targetEdition === 'all') {
        firstBtn.className = 'edition-btn px-3 py-1 rounded-lg bg-lime-400 text-emerald-950 text-xs font-black whitespace-nowrap shadow';
    }
}

// Helper smooth scroll ke katalog dengan offset sticky header
function scrollToCatalog() {
    const header = document.querySelector('header');
    const headerOffset = header ? header.offsetHeight : 70;
    const targetElement = document.querySelector('main') || document.getElementById('productGrid');

    if (targetElement) {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + scrollY - headerOffset - 10;

        window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
        });
    }
}

// Klik tombol promo dari Hero Section
function triggerHeroFilter(edition) {
    const stikerBtn = document.getElementById('cat-stiker');
    filterCategory('stiker', stikerBtn);

    activeStickerEdition = edition;
    document.querySelectorAll('.edition-btn').forEach(btn => {
        if (btn.innerText.includes(edition)) {
            btn.className = 'edition-btn px-3 py-1 rounded-lg bg-lime-400 text-emerald-950 text-xs font-black whitespace-nowrap shadow';
        } else {
            btn.className = 'edition-btn px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-emerald-200 text-xs font-bold whitespace-nowrap hover:bg-emerald-900';
        }
    });

    renderProducts();
    scrollToCatalog();
}

// Reset Total saat Logo Diklik
function resetToHome(event) {
    if (event) event.preventDefault();

    searchInput.value = '';
    activeCategory = 'all';
    activeStickerEdition = 'all';
    currentPage = 1;

    // Sembunyikan sub-filter edisi
    editionFilterContainer.classList.add('hidden');
    editionFilterContainer.classList.remove('flex');

    const catButtons = document.querySelectorAll('.cat-btn');
    catButtons.forEach((btn, index) => {
        if (index === 0) {
            btn.className = 'cat-btn px-4 py-1.5 rounded-full bg-lime-400 text-emerald-950 text-xs font-black whitespace-nowrap shadow';
        } else {
            btn.className = 'cat-btn px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-600/40 text-emerald-100 text-xs font-bold whitespace-nowrap hover:bg-emerald-900';
        }
    });

    renderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleSearch() {
    currentPage = 1;
    renderProducts();
}

function handleSearchSubmit(event) {
    if (event) event.preventDefault();
    if (searchInput) {
        searchInput.blur(); // Menutup virtual keyboard mobile saat submit/Enter
    }
    renderProducts();
    scrollToCatalog();
}

if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchInput.blur(); // Menutup virtual keyboard mobile saat tekan tombol Enter
            renderProducts();
            scrollToCatalog();
        }
    });

    // Menangani ketika tombol silang (clear/cancel) bawaan type="search" diklik
    searchInput.addEventListener('search', () => {
        renderProducts();
    });
}

// Tutup modal dengan tombol Escape atau shortcut zoom keyboard
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (imageZoomModal && !imageZoomModal.classList.contains('hidden')) {
            closeImageZoomModal();
            return;
        }
        closeModal();
        closeContactModal();
    } else if (imageZoomModal && !imageZoomModal.classList.contains('hidden')) {
        if (e.key === '+' || e.key === '=') {
            zoomInImage();
        } else if (e.key === '-' || e.key === '_') {
            zoomOutImage();
        } else if (e.key === '0') {
            resetImageZoom();
        }
    }
});

// Inisialisasi Katalog Produk & Kategori secara berurutan
async function initCatalogData() {
    await loadCategories();
    await loadProducts();
}
initCatalogData();

// Realtime Listener jika ada penambahan / pembaruan kategori langsung dari Supabase Table Editor
try {
    supabaseClient
        .channel('realtime_categories_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
            await loadCategories();
            renderProducts();
        })
        .subscribe();
} catch (e) {
    console.debug("Supabase realtime categories subscription not active:", e);
}

// ==========================================
// HERO SECTION CAROUSEL & PROMOTIONS (SUPABASE)
// ==========================================
const heroTrack = document.getElementById('heroTrack');
const heroSliderContainer = document.getElementById('heroSliderContainer');
const heroPrevBtn = document.getElementById('heroPrevBtn');
const heroNextBtn = document.getElementById('heroNextBtn');
const heroDots = document.getElementById('heroDots');

let allPromotions = [];
let totalHeroSlides = 0;
let currentHeroSlide = 1;
let isTransitioning = false;
let autoSlideInterval = null;
let transitionSafetyTimeout = null;

// Tampilkan state loading skeleton untuk hero carousel
function showHeroLoadingState() {
    if (!heroTrack) return;
    heroTrack.style.transition = 'none';
    heroTrack.style.transform = 'translateX(0%)';

    // Sembunyikan tombol navigasi dan dots saat loading
    if (heroPrevBtn) heroPrevBtn.style.display = 'none';
    if (heroNextBtn) heroNextBtn.style.display = 'none';
    if (heroDots) heroDots.classList.add('hidden');

    heroTrack.innerHTML = `
        <div id="heroLoadingSkeleton"
            class="w-full min-w-full max-w-full flex-shrink-0 box-border p-4 pb-7 sm:py-6 sm:px-16 md:px-20 lg:px-24 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-6 animate-pulse">
            <div class="w-full sm:w-3/5 flex flex-col items-center sm:items-start text-center sm:text-left">
                <div class="flex items-center gap-2 mb-2">
                    <div class="h-4 w-20 bg-lime-400/40 rounded-full"></div>
                    <div class="h-4 w-24 bg-emerald-800/60 rounded-full"></div>
                </div>
                <div class="h-6 sm:h-8 w-4/5 bg-emerald-800/50 rounded-xl mb-2"></div>
                <div class="h-5 sm:h-6 w-3/5 bg-emerald-800/30 rounded-xl mb-3"></div>
                <div class="h-3.5 w-11/12 bg-emerald-800/25 rounded-md mb-1.5 hidden sm:block"></div>
                <div class="h-3.5 w-3/4 bg-emerald-800/25 rounded-md mb-4 hidden sm:block"></div>
                <div class="h-8 sm:h-9 w-36 bg-lime-400/40 rounded-xl"></div>
            </div>
            <div class="w-full sm:w-2/5 flex justify-center items-center">
                <div
                    class="relative w-full max-w-[135px] sm:max-w-[180px] md:max-w-[210px] aspect-square bg-emerald-950/70 border border-emerald-500/30 rounded-2xl p-2 flex flex-col items-center justify-center shadow-md">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-emerald-500/30 border-t-lime-400 animate-spin flex items-center justify-center mb-2">
                        <i class="ph-bold ph-soccer-ball text-lime-300 text-lg sm:text-xl"></i>
                    </div>
                    <span class="text-[10px] text-emerald-200/80 font-bold tracking-wider">Memuat Promo...</span>
                </div>
            </div>
        </div>
    `;
}

// Tema warna lencana & tombol sesuai badge_color
function getPromotionTheme(color) {
    const c = (color || 'lime').toLowerCase().trim();
    if (c === 'amber' || c === 'yellow' || c === 'orange') {
        return {
            badgeMain: 'bg-amber-400 text-amber-950',
            badgeSub: 'bg-emerald-800/80 text-lime-300 border border-emerald-600/60',
            btn: 'bg-amber-400 sm:hover:bg-amber-300 active:bg-amber-500 text-amber-950'
        };
    }
    if (c === 'purple' || c === 'violet' || c === 'indigo') {
        return {
            badgeMain: 'bg-purple-400 text-purple-950',
            badgeSub: 'bg-emerald-800/80 text-lime-300 border border-emerald-600/60',
            btn: 'bg-purple-400 sm:hover:bg-purple-300 active:bg-purple-500 text-purple-950'
        };
    }
    if (c === 'cyan' || c === 'teal' || c === 'sky' || c === 'blue') {
        return {
            badgeMain: 'bg-cyan-400 text-cyan-950',
            badgeSub: 'bg-emerald-800/80 text-lime-300 border border-emerald-600/60',
            btn: 'bg-cyan-400 sm:hover:bg-cyan-300 active:bg-cyan-500 text-cyan-950'
        };
    }
    if (c === 'rose' || c === 'red') {
        return {
            badgeMain: 'bg-rose-500 text-white',
            badgeSub: 'bg-emerald-800/80 text-lime-300 border border-emerald-600/60',
            btn: 'bg-rose-500 sm:hover:bg-rose-400 active:bg-rose-600 text-white'
        };
    }
    // Default lime
    return {
        badgeMain: 'bg-lime-400 text-emerald-950',
        badgeSub: 'bg-emerald-800/80 text-lime-300 border border-emerald-600/60',
        btn: 'bg-lime-400 sm:hover:bg-lime-300 active:bg-lime-500 text-emerald-950'
    };
}

// Handler aksi tombol promo
function handlePromotionAction(actionType, actionTarget) {
    if (!actionType) return;
    const type = (actionType || '').toLowerCase().trim();
    const target = (actionTarget || '').trim();

    if (type === 'edition' || type === 'filter_edition' || type === 'stiker_edition') {
        triggerHeroFilter(target);
    } else if (type === 'category' || type === 'filter_category') {
        const targetCat = target.toLowerCase();
        let catBtn = document.getElementById(`cat-${targetCat.replace(/\s+/g, '-')}`);
        if (!catBtn && targetCat === 'all') catBtn = document.getElementById('cat-all');
        filterCategory(targetCat, catBtn || document.querySelector('.cat-btn'));
        scrollToCatalog();
    } else if (type === 'url' || type === 'link') {
        if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('//')) {
            window.open(target, '_blank');
        } else {
            window.location.href = target;
        }
    } else if (type === 'whatsapp' || type === 'wa') {
        const msg = encodeURIComponent(target || 'Halo LOUIFOOTBALL, saya tertarik dengan promo di website');
        window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
    } else {
        if (!isNaN(target) && target !== '') {
            triggerHeroFilter(target);
        } else {
            scrollToCatalog();
        }
    }
}

// State pendeteksi gesture tap vs swipe khusus tombol promo di mobile & desktop
let promoPointerStartX = 0;
let promoPointerStartY = 0;
let promoPointerMoved = false;
let lastPromoActionTime = 0;

function onPromoPointerDown(e) {
    promoPointerStartX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    promoPointerStartY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    promoPointerMoved = false;
}

function onPromoPointerMove(e) {
    const curX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const curY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    if (Math.abs(curX - promoPointerStartX) > 8 || Math.abs(curY - promoPointerStartY) > 8) {
        promoPointerMoved = true;
    }
}

function onPromoPointerUp(index, e) {
    // Jika hanya tap (bukan gerakan swipe), langsung eksekusi tanpa menunggu click sintetis mobile
    if (!promoPointerMoved) {
        executePromoAction(index, e);
    }
}

function executePromoAction(index, event) {
    const now = Date.now();
    // Debounce 400ms agar jika pointerup dan click terpanggil bersamaan, hanya dieksekusi 1 kali
    if (now - lastPromoActionTime < 400) return;
    lastPromoActionTime = now;

    if (event) {
        if (event.stopPropagation) event.stopPropagation();
    }
    const promo = allPromotions[index];
    if (!promo) return;
    handlePromotionAction(promo.action_type, promo.action_target);
}

// Fallback untuk backward compatibility
function triggerPromoActionByIndex(index, event) {
    executePromoAction(index, event);
}

// Render data promosi ke dalam DOM
function renderPromotions(promotions) {
    if (!heroTrack) return;
    heroTrack.innerHTML = '';

    totalHeroSlides = promotions.length;

    if (totalHeroSlides === 0) {
        if (heroPrevBtn) heroPrevBtn.style.display = 'none';
        if (heroNextBtn) heroNextBtn.style.display = 'none';
        if (heroDots) heroDots.classList.add('hidden');
        return;
    }

    // Render masing-masing slide promo
    promotions.forEach((promo, index) => {
        const theme = getPromotionTheme(promo.badge_color);
        const slide = document.createElement('div');
        slide.className = 'w-full min-w-full max-w-full flex-shrink-0 box-border p-4 pb-7 sm:py-6 sm:px-16 md:px-20 lg:px-24 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-6';

        slide.innerHTML = `
            <div class="w-full sm:w-3/5 text-center sm:text-left flex flex-col items-center sm:items-start">
                <div class="flex items-center gap-1.5 mb-1.5">
                    ${promo.badge_main ? `
                        <span class="${theme.badgeMain} text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                            ${promo.badge_main}
                        </span>
                    ` : ''}
                    ${promo.badge_sub ? `
                        <span class="${theme.badgeSub} text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full">
                            ${promo.badge_sub}
                        </span>
                    ` : ''}
                </div>
                <h1 class="text-base sm:text-xl lg:text-2xl font-black leading-snug sm:leading-tight text-white">
                    ${promo.title}
                </h1>
                <p class="text-[11px] sm:text-xs text-emerald-100/90 mt-1 leading-relaxed max-w-md">
                    ${promo.desc}
                </p>
                <div class="mt-3 flex items-center gap-2">
                    <button type="button"
                        onpointerdown="onPromoPointerDown(event)"
                        onpointermove="onPromoPointerMove(event)"
                        onpointerup="onPromoPointerUp(${index}, event)"
                        onclick="executePromoAction(${index}, event)"
                        style="touch-action: manipulation;"
                        class="${theme.btn} text-xs font-black px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5 sm:hover:scale-[1.02] active:scale-95 cursor-pointer touch-manipulation select-auto">
                        <i class="ph-bold ph-arrow-down text-sm pointer-events-none"></i>
                        <span class="pointer-events-none">${promo.btn_text || 'Lihat Promo'}</span>
                    </button>
                </div>
            </div>
            <div class="w-full sm:w-2/5 flex justify-center items-center">
                <div class="relative w-full max-w-[135px] sm:max-w-[180px] md:max-w-[210px] aspect-square bg-emerald-950/70 border border-emerald-500/40 rounded-2xl p-2 flex items-center justify-center shadow-md">
                    <img src="${promo.img}"
                        alt="${promo.title} - LOUI Football"
                        class="w-full h-full object-contain rounded-xl drop-shadow pointer-events-none"
                        onerror="this.src='https://placehold.co/400x400/022c22/34d399?text=LOUI+PROMO'">
                </div>
            </div>
        `;
        heroTrack.appendChild(slide);
    });

    // Inisialisasi Carousel
    setupHeroCarousel(totalHeroSlides);
}

// Inisialisasi logika Carousel (Clones & Controls)
function setupHeroCarousel(totalSlides) {
    stopAutoSlide();

    if (totalSlides <= 1) {
        if (heroPrevBtn) heroPrevBtn.style.display = 'none';
        if (heroNextBtn) heroNextBtn.style.display = 'none';
        if (heroDots) heroDots.classList.add('hidden');
        heroTrack.style.transition = 'none';
        heroTrack.style.transform = 'translateX(0%)';
        return;
    }

    // Render Dots
    if (heroDots) {
        heroDots.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.onclick = () => goToHeroSlide(i);
            dot.className = i === 0 ? "w-5 h-1.5 rounded-full bg-lime-400 transition-all" : "w-2 h-1.5 rounded-full bg-white/40 hover:bg-white/80 transition-all";
            dot.setAttribute('aria-label', `Slide ${i + 1}`);
            heroDots.appendChild(dot);
        }
        heroDots.classList.remove('hidden');
    }

    // Gandakan (clone) slide pertama ke akhir & slide terakhir ke awal untuk infinite loop mulus
    const slides = Array.from(heroTrack.children);
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);

    heroTrack.appendChild(firstClone);
    heroTrack.insertBefore(lastClone, slides[0]);

    // Kembalikan ke kelas responsive Tailwind: 'hidden sm:flex' (tersembunyi di mobile, tampil di desktop)
    if (heroPrevBtn) heroPrevBtn.style.display = '';
    if (heroNextBtn) heroNextBtn.style.display = '';

    currentHeroSlide = 1;
    heroTrack.style.transition = 'none';
    heroTrack.style.transform = `translateX(-${currentHeroSlide * 100}%)`;
    void heroTrack.offsetHeight;
    heroTrack.style.transition = '';

    updateDots();
    startAutoSlide();
}

function updateDots() {
    if (!heroDots || totalHeroSlides <= 1) return;
    const activeDotIndex = (currentHeroSlide - 1 + totalHeroSlides) % totalHeroSlides;
    const dots = heroDots.querySelectorAll('button');
    dots.forEach((dot, index) => {
        if (index === activeDotIndex) {
            dot.className = "w-5 h-1.5 rounded-full bg-lime-400 transition-all";
        } else {
            dot.className = "w-2 h-1.5 rounded-full bg-white/40 hover:bg-white/80 transition-all";
        }
    });
}

function handleTransitionEnd() {
    if (!isTransitioning || totalHeroSlides <= 1) return;

    // Jika sampai di clone slide 1 (setelah slide terakhir), teleport secara tak terlihat ke slide 1 asli
    if (currentHeroSlide === totalHeroSlides + 1) {
        heroTrack.style.transition = 'none';
        currentHeroSlide = 1;
        heroTrack.style.transform = `translateX(-${currentHeroSlide * 100}%)`;
        void heroTrack.offsetHeight;
    }
    // Jika sampai di clone slide terakhir (sebelum slide 1), teleport ke slide terakhir asli
    else if (currentHeroSlide === 0) {
        heroTrack.style.transition = 'none';
        currentHeroSlide = totalHeroSlides;
        heroTrack.style.transform = `translateX(-${currentHeroSlide * 100}%)`;
        void heroTrack.offsetHeight;
    }

    isTransitioning = false;
    if (transitionSafetyTimeout) {
        clearTimeout(transitionSafetyTimeout);
        transitionSafetyTimeout = null;
    }
}

if (heroTrack) {
    heroTrack.addEventListener('transitionend', (e) => {
        if (e.target === heroTrack && e.propertyName === 'transform') {
            handleTransitionEnd();
        }
    });
}

function moveToSlide(targetIndex) {
    if (totalHeroSlides <= 1) return;
    isTransitioning = true;
    currentHeroSlide = targetIndex;
    heroTrack.style.transition = 'transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1)';
    heroTrack.style.transform = `translateX(-${currentHeroSlide * 100}%)`;
    updateDots();

    clearTimeout(transitionSafetyTimeout);
    transitionSafetyTimeout = setTimeout(() => {
        if (isTransitioning) {
            handleTransitionEnd();
        }
    }, 320);
}

function nextHeroSlide() {
    if (isTransitioning || totalHeroSlides <= 1) return;
    moveToSlide(currentHeroSlide + 1);
}

function prevHeroSlide() {
    if (isTransitioning || totalHeroSlides <= 1) return;
    moveToSlide(currentHeroSlide - 1);
}

function goToHeroSlide(targetIndex) {
    if (isTransitioning || totalHeroSlides <= 1) return;
    const currentActive = (currentHeroSlide - 1 + totalHeroSlides) % totalHeroSlides;
    if (targetIndex === currentActive) return;

    if (currentActive === totalHeroSlides - 1 && targetIndex === 0) {
        nextHeroSlide();
        return;
    }
    if (currentActive === 0 && targetIndex === totalHeroSlides - 1) {
        prevHeroSlide();
        return;
    }

    moveToSlide(targetIndex + 1);
}

function startAutoSlide() {
    stopAutoSlide();
    if (totalHeroSlides > 1) {
        autoSlideInterval = setInterval(nextHeroSlide, 5000);
    }
}

function stopAutoSlide() {
    if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
    }
}

// Auto-slide dan gesture swipe mobile
if (heroSliderContainer) {
    heroSliderContainer.addEventListener('mouseenter', stopAutoSlide);
    heroSliderContainer.addEventListener('mouseleave', startAutoSlide);

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    heroSliderContainer.addEventListener('touchstart', e => {
        // Jangan interupsi atau tangkap sentuhan jika jari menyentuh tombol di dalam carousel
        if (e.target && e.target.closest && e.target.closest('button')) {
            return;
        }
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
        stopAutoSlide();
    }, { passive: true });

    heroSliderContainer.addEventListener('touchend', e => {
        if (e.target && e.target.closest && e.target.closest('button')) {
            startAutoSlide();
            return;
        }
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchStartX - touchEndX;
        const deltaY = touchStartY - touchEndY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35) {
            if (deltaX > 0) {
                nextHeroSlide();
            } else {
                prevHeroSlide();
            }
        }
        startAutoSlide();
    }, { passive: true });
}

// Ambil data promosi dari tabel 'promotions' di Supabase
async function loadPromotions() {
    showHeroLoadingState();
    try {
        const { data, error } = await supabaseClient
            .from('promotions')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
            throw error || new Error("Data promosi kosong atau gagal dimuat dari Supabase");
        }

        allPromotions = data;
    } catch (err) {
        console.warn("Gagal memuat promosi dari Database, beralih ke promo default:", err);
        allPromotions = [
            {
                id: 1,
                badge_main: "NEW RELEASE",
                badge_sub: "Edisi Terbatas",
                badge_color: "lime",
                title: "Stickers Edisi #12 Special World Cup 26",
                desc: "Koleksi edisi Piala Dunia 2026 dari LOUIFOOTBALL. Vinyl tebal anti air & tahan gores!",
                img: "https://res.cloudinary.com/og1jrvy3/image/upload/f_auto,q_auto,w_500/v1789012817/id-11134207-822wj-mpgrp31qsw7j64.webp",
                action_type: "edition",
                action_target: "12",
                btn_text: "Lihat di Katalog",
                sort_order: 1,
                is_active: true
            },
            {
                id: 2,
                badge_main: "POPULAR",
                badge_sub: "Akrilik HD",
                badge_color: "amber",
                title: "Gantungan Kunci Bintang Bola Dunia",
                desc: "Bahan akrilik premium 3mm cetak 2 sisi tajam dengan ring gantungan anti-karat. Bikin tas & kuncimu makin keren!",
                img: "https://res.cloudinary.com/og1jrvy3/image/upload/f_auto,q_auto,w_500/v1789010435/id-11134207-8224p-mhun2zrqdkp0af.webp",
                action_type: "category",
                action_target: "keychain",
                btn_text: "Lihat Koleksi Keychain",
                sort_order: 2,
                is_active: true
            },
            {
                id: 3,
                badge_main: "COLLECTOR",
                badge_sub: "Art Carton 260gr",
                badge_color: "purple",
                title: "Poster Estetik GOAT & Football Icons",
                desc: "Dekorasi dinding kamar dengan momen ikonik pesepak bola dunia. Kualitas cetak studio gallery tahan pudar!",
                img: "https://res.cloudinary.com/og1jrvy3/image/upload/f_auto,q_auto,w_500/v1789010178/545040561_17848000446557650_323288529526384965_n.jpg",
                action_type: "category",
                action_target: "poster",
                btn_text: "Lihat Koleksi Poster",
                sort_order: 3,
                is_active: true
            }
        ];
    }

    renderPromotions(allPromotions);
}

// Inisialisasi awal pemuatan data promosi
loadPromotions();

