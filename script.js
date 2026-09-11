const WA_NUMBER = "62895621072782"; // Nomor WhatsApp Toko

const SUPABASE_URL = "https://dnnjcwhyyvcetswashku.supabase.co";
const SUPABASE_KEY = "sb_publishable__pCa3Ej5Z0G8Irhdw8sbcg_Se8C31Hy";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allProducts = [];
let activeCategory = 'all';
let activeStickerEdition = 'all'; // State filter edisi stiker

const productGrid = document.getElementById('productGrid');
const noResult = document.getElementById('noResult');
const searchInput = document.getElementById('searchInput');
const editionFilterContainer = document.getElementById('editionFilterContainer');
const editionButtons = document.getElementById('editionButtons');

// Product Modal elements
const modal = document.getElementById('productModal');
const modalImg = document.getElementById('modalImg');
const modalImgLink = document.getElementById('modalImgLink');
const modalCategory = document.getElementById('modalCategory');
const modalEdition = document.getElementById('modalEdition');
const modalSpec = document.getElementById('modalSpec');
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

async function loadProducts() {
    showLoadingState();
    try {
        // Ambil data langsung dari tabel 'products' di Database
        const { data, error } = await supabaseClient
            .from('products')
            .select('*');

        if (error || !data || data.length === 0) {
            throw error || new Error("Data dari Database kosong atau bermasalah");
        }

        allProducts = data;
    } catch (error) {
        console.warn("Gagal mengambil data dari Database, beralih ke products.json:", error);
        try {
            const res = await fetch('products.json');
            allProducts = await res.json();
        } catch (fallbackError) {
            console.error("Gagal membaca products.json:", fallbackError);
        }
    }

    // Urutkan edisi TERBARU ke TERLAMA otomatis
    allProducts.sort((a, b) => {
        const edA = parseInt(a.edition) || 0;
        const edB = parseInt(b.edition) || 0;
        return edB - edA;
    });

    buildStickerEditionButtons();
    renderProducts();
}

// Generate tombol filter edisi berdasarkan data stiker yang ada
function buildStickerEditionButtons() {
    const stickerProducts = allProducts.filter(item => item.category === 'stiker' && item.edition);
    const editions = [...new Set(stickerProducts.map(item => item.edition))];

    // Urutkan edisi dari terbesar ke terkecil
    editions.sort((a, b) => (parseInt(b) || 0) - (parseInt(a) || 0));

    editionButtons.innerHTML = `
        <button onclick="filterStickerEdition('all', this)" class="edition-btn px-3 py-1 rounded-lg bg-lime-400 text-emerald-950 text-xs font-black whitespace-nowrap shadow">
            Semua Edisi
        </button>
    `;

    editions.forEach(ed => {
        editionButtons.innerHTML += `
            <button onclick="filterStickerEdition('${ed}', this)" class="edition-btn px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-emerald-200 text-xs font-bold whitespace-nowrap hover:bg-emerald-900">
                Edisi #${ed}
            </button>
        `;
    });
}

function renderProducts() {
    const query = searchInput.value.toLowerCase().trim();
    productGrid.innerHTML = '';

    const filtered = allProducts.filter(item => {
        // Filter kategori utama
        const matchCat = (activeCategory === 'all' || item.category === activeCategory);

        // Sub-filter edisi khusus stiker
        let matchStickerEd = true;
        if (activeCategory === 'stiker' && activeStickerEdition !== 'all') {
            matchStickerEd = item.edition === activeStickerEdition;
        }

        // Pencarian teks
        const titleMatch = item.title.toLowerCase().includes(query);
        const editionMatch = item.edition ? (`edisi ${item.edition}`.includes(query) || `#${item.edition}`.includes(query) || item.edition.toString() === query) : false;
        const teamMatch = item.team ? item.team.toLowerCase().includes(query) : false;
        const descMatch = (item.desc ?? '').toLowerCase().includes(query);

        return matchCat && matchStickerEd && (titleMatch || editionMatch || teamMatch || descMatch);
    });

    if (filtered.length === 0) {
        noResult.classList.remove('hidden');
        return;
    }
    noResult.classList.add('hidden');

    filtered.forEach(item => {
        const badgeColor = item.category === 'stiker' ? 'bg-emerald-700 text-lime-300' :
            item.category === 'mini stiker' ? 'bg-cyan-700 text-cyan-100' :
                item.category === 'keychain' ? 'bg-amber-600 text-white' :
                    'bg-purple-700 text-white';

        const editionText = item.edition ? `Edisi #${item.edition}` : '';

        const card = document.createElement('div');
        card.className = "bg-white rounded-2xl p-3 flex flex-col justify-between hover:shadow-2xl transition duration-150 border-2 border-transparent hover:border-lime-400";
        const formattedPrice = formatRupiah(item.price);
        card.innerHTML = `
          <div>
            <div class="relative aspect-square rounded-xl bg-emerald-50 overflow-hidden mb-2.5 cursor-pointer group" onclick="openModalById('${item.id}')">
              <span class="absolute top-2 left-2 ${badgeColor} text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded shadow capitalize z-10">${item.category}</span>
              <img src="${item.img}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
            </div>
            
            <p class="text-[10px] font-black text-amber-700 tracking-wider uppercase">${editionText}</p>
            <h3 class="font-bold text-xs sm:text-sm text-gray-900 leading-snug line-clamp-2 mt-0.5 cursor-pointer hover:text-emerald-700 transition" onclick="openModalById('${item.id}')">${item.title}</h3>
            <p class="text-[11px] text-gray-500 mt-1">${item.spec}</p>
          </div>
          <div class="mt-3 pt-2 border-t border-gray-100">
            <p class="text-emerald-950 font-black text-sm sm:text-base">${formattedPrice}</p>
            <button onclick="openModalById('${item.id}')" class="w-full mt-2 bg-emerald-800 hover:bg-emerald-900 text-lime-300 text-xs font-bold py-1.5 sm:py-2 rounded-xl transition cursor-pointer">
              Lihat Detail
            </button>
          </div>
        `;
        productGrid.appendChild(card);
    });
}

function formatRupiah(val) {
    if (!val) return 'Rp. 0';
    // Ambil hanya karakter angka jika sewaktu-waktu ada string/simbol yang masuk
    const number = typeof val === 'number' ? val : parseInt(val.toString().replace(/[^0-9]/g, ''), 10) || 0;
    return `Rp. ${number.toLocaleString('id-ID')}`;
}

function openModalById(id) {
    const item = allProducts.find(p => String(p.id) === String(id));
    if (!item) return;
    const displayPrice = formatRupiah(item.price);

    modalTitle.innerText = item.title;
    modalPrice.innerText = displayPrice;
    modalDesc.innerText = item.desc || '-';
    modalCategory.innerText = item.category || '';
    modalSpec.innerText = item.spec || '';
    modalEdition.innerText = item.edition ? `Edisi #${item.edition}` : '';

    modalImg.src = item.img;
    modalImgLink.href = item.img;

    const editionText = item.edition ? `(Edisi #${item.edition})` : '';
    const msg = encodeURIComponent(`Halo LOUIFOOTBALL, saya ingin memesan:

*${item.title}* ${editionText}
Harga: ${displayPrice}

Apakah stok masih ada?`);
    modalWaBtn.href = `https://wa.me/${WA_NUMBER}?text=${msg}`;

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

// Filter Kategori Utama
function filterCategory(category, btnElement) {
    activeCategory = category;
    activeStickerEdition = 'all';
    searchInput.value = '';

    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.className = 'cat-btn px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-600/40 text-emerald-100 text-xs font-bold whitespace-nowrap hover:bg-emerald-900';
    });
    btnElement.className = 'cat-btn px-4 py-1.5 rounded-full bg-lime-400 text-emerald-950 text-xs font-black whitespace-nowrap shadow';

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
    renderProducts();
}

// Tutup modal dengan tombol Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeContactModal();
    }
});

loadProducts();

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

