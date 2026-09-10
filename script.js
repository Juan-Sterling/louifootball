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
        const descMatch = item.desc.toLowerCase().includes(query);

        return matchCat && matchStickerEd && (titleMatch || editionMatch || teamMatch || descMatch);
    });

    if (filtered.length === 0) {
        noResult.classList.remove('hidden');
        return;
    }
    noResult.classList.add('hidden');

    filtered.forEach(item => {
        const badgeColor = item.category === 'stiker' ? 'bg-emerald-700 text-lime-300' :
            item.category === 'keychain' ? 'bg-amber-600 text-white' : 'bg-purple-700 text-white';

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
    document.getElementById('productGrid').scrollIntoView({ behavior: 'smooth' });
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

// LOGIKA SLIDER / CAROUSEL (SEAMLESS INFINITE LOOP)
const heroTrack = document.getElementById('heroTrack');
const heroSliderContainer = document.getElementById('heroSliderContainer');
const originalSlides = Array.from(heroTrack.children);
const totalHeroSlides = originalSlides.length; // 3
let currentHeroSlide = 1; // Mulai dari slide 1 asli (posisi indeks 1 karena ada clone di indeks 0)
let isTransitioning = false;
let autoSlideInterval = null;
let transitionSafetyTimeout = null;

// Gandakan (clone) slide pertama ke akhir & slide terakhir ke awal untuk infinite loop mulus
const firstClone = originalSlides[0].cloneNode(true);
const lastClone = originalSlides[totalHeroSlides - 1].cloneNode(true);
heroTrack.appendChild(firstClone);
heroTrack.insertBefore(lastClone, originalSlides[0]);

// Atur posisi awal di slide 1 tanpa animasi
heroTrack.style.transition = 'none';
heroTrack.style.transform = `translateX(-${currentHeroSlide * 100}%)`;
void heroTrack.offsetHeight;
heroTrack.style.transition = '';

function updateDots() {
    const activeDotIndex = (currentHeroSlide - 1 + totalHeroSlides) % totalHeroSlides;
    const dots = document.querySelectorAll('#heroDots button');
    dots.forEach((dot, index) => {
        if (index === activeDotIndex) {
            dot.className = "w-5 h-1.5 rounded-full bg-lime-400 transition-all";
        } else {
            dot.className = "w-2 h-1.5 rounded-full bg-white/40 hover:bg-white/80 transition-all";
        }
    });
}

function handleTransitionEnd() {
    if (!isTransitioning) return;

    // Jika sampai di clone slide 1 (setelah slide 3), teleport secara tak terlihat ke slide 1 asli
    if (currentHeroSlide === totalHeroSlides + 1) {
        heroTrack.style.transition = 'none';
        currentHeroSlide = 1;
        heroTrack.style.transform = `translateX(-${currentHeroSlide * 100}%)`;
        void heroTrack.offsetHeight;
    }
    // Jika sampai di clone slide 3 (sebelum slide 1), teleport ke slide 3 asli
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

heroTrack.addEventListener('transitionend', (e) => {
    if (e.target === heroTrack && e.propertyName === 'transform') {
        handleTransitionEnd();
    }
});

function moveToSlide(targetIndex) {
    isTransitioning = true;
    currentHeroSlide = targetIndex;
    heroTrack.style.transition = 'transform 500ms cubic-bezier(0.25, 1, 0.5, 1)';
    heroTrack.style.transform = `translateX(-${currentHeroSlide * 100}%)`;
    updateDots();

    // Timeout pengaman jika transitionend terlewatkan (misal saat tab diminimalkan)
    clearTimeout(transitionSafetyTimeout);
    transitionSafetyTimeout = setTimeout(() => {
        if (isTransitioning) {
            handleTransitionEnd();
        }
    }, 550);
}

function nextHeroSlide() {
    if (isTransitioning) return;
    moveToSlide(currentHeroSlide + 1);
}

function prevHeroSlide() {
    if (isTransitioning) return;
    moveToSlide(currentHeroSlide - 1);
}

function goToHeroSlide(targetIndex) {
    if (isTransitioning) return;
    const currentActive = (currentHeroSlide - 1 + totalHeroSlides) % totalHeroSlides;
    if (targetIndex === currentActive) return;

    // Transisi mulus jika loncat antar ujung
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
    autoSlideInterval = setInterval(nextHeroSlide, 5000);
}

function stopAutoSlide() {
    if (autoSlideInterval) clearInterval(autoSlideInterval);
}

// Auto-slide dan jeda saat mouse hover
if (heroSliderContainer) {
    heroSliderContainer.addEventListener('mouseenter', stopAutoSlide);
    heroSliderContainer.addEventListener('mouseleave', startAutoSlide);

    // Dukungan Touch Swipe untuk Layar HP yang Akurat & Lancar (Tidak Mengganggu Scroll Halaman)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    heroSliderContainer.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
        stopAutoSlide();
    }, { passive: true });

    heroSliderContainer.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchStartX - touchEndX;
        const deltaY = touchStartY - touchEndY;

        // Hanya picu slide jika gerakan horizontal lebih dominan daripada vertical scroll
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
            if (deltaX > 0) {
                nextHeroSlide();
            } else {
                prevHeroSlide();
            }
        }
        startAutoSlide();
    }, { passive: true });
}

startAutoSlide();
