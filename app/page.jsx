'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import CategoryTabs from '@/components/CategoryTabs';
import StickerEditionFilter from '@/components/StickerEditionFilter';
import ProductGrid from '@/components/ProductGrid';
import ProductModal from '@/components/ProductModal';
import ImageZoomModal from '@/components/ImageZoomModal';
import ContactModal from '@/components/ContactModal';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import fallbackProducts from '@/products.json';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeStickerEdition, setActiveStickerEdition] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [zoomState, setZoomState] = useState({ isOpen: false, imgSrc: '', title: '' });
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Load products from Supabase
  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(*)');

        if (error || !data || data.length === 0) {
          throw error || new Error('Data empty');
        }

        const mapped = data.map((item) => {
          const catObj = item.categories || {};
          const playerName = item.player_name ? String(item.player_name).trim() : '';
          const productTitle = item.title ? String(item.title).trim() : '';
          const resolvedPlayerName = playerName || productTitle || 'Produk Loui';
          const soldOutVal = item.sold_out ? String(item.sold_out).trim() : '';
          const rawYear = item.year ? String(item.year).trim() : '';
          const isYearValid = rawYear && rawYear.toLowerCase() !== 'null' && rawYear.toLowerCase() !== 'undefined' && rawYear !== '-';
          const cleanYear = isYearValid ? rawYear : '';

          const rawTeam = item.team ? String(item.team).trim() : '';
          const isTeamValid = rawTeam && rawTeam.toLowerCase() !== 'null' && rawTeam.toLowerCase() !== 'undefined' && rawTeam !== '-';
          const cleanTeam = isTeamValid ? rawTeam : '';

          return {
            ...item,
            player_name: resolvedPlayerName,
            title: productTitle,
            sold_out: soldOutVal,
            is_sold_out: soldOutVal.toUpperCase() === 'Y',
            category: (catObj.category || item.category || 'lainnya').toLowerCase().trim(),
            team: cleanTeam,
            year: cleanYear,
            spec: catObj.spec || item.spec || 'Koleksi Resmi',
            desc: catObj.desc || item.desc || 'Merchandise resmi sepak bola berkualitas dari LOUIFOOTBALL.',
          };
        });

        // Urutkan: edisi spesial di paling atas, lalu edisi bernomor terbaru ke terlama
        mapped.sort((a, b) => {
          const isSpecialA = isNaN(a.edition) && Boolean(a.edition);
          const isSpecialB = isNaN(b.edition) && Boolean(b.edition);
          if (isSpecialA && !isSpecialB) return -1;
          if (!isSpecialA && isSpecialB) return 1;
          const edA = parseInt(a.edition, 10) || 0;
          const edB = parseInt(b.edition, 10) || 0;
          return edB - edA;
        });

        setProducts(mapped);
      } catch (err) {
        console.warn('Gagal memuat produk dari Supabase, beralih ke fallback lokal:', err);
        const mappedFallback = (fallbackProducts || []).map((item) => {
          const playerName = item.player_name || item.title || 'Produk Loui';
          return {
            ...item,
            player_name: playerName,
            title: playerName,
            category: (item.category || '').toLowerCase().trim(),
            team: item.team ? String(item.team).trim() : '',
            year: item.year ? String(item.year).trim() : '',
            spec: item.spec || 'Koleksi Resmi',
            desc: item.desc || '',
          };
        });
        setProducts(mappedFallback);
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, []);

  const scrollToCatalog = useCallback(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      const header = document.querySelector('header');
      const offset = header ? header.offsetHeight : 70;
      const top = mainEl.getBoundingClientRect().top + window.scrollY - offset - 10;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }, []);

  // Filter handlers
  const handleSelectCategory = useCallback((cat) => {
    setActiveCategory(cat);
    setActiveStickerEdition('all');
    setSearchQuery('');
  }, []);

  const handleSelectEdition = useCallback((ed) => {
    setActiveStickerEdition(ed);
    setSearchQuery('');
  }, []);

  const handleHeroSelectEdition = useCallback((ed) => {
    setActiveCategory('stiker');
    setActiveStickerEdition(ed);
    setSearchQuery('');
    setTimeout(scrollToCatalog, 100);
  }, [scrollToCatalog]);

  const handleResetHome = useCallback(() => {
    setSearchQuery('');
    setActiveCategory('all');
    setActiveStickerEdition('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Filtered products calculation
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return products.filter((item) => {
      // Kategori utama
      const matchCat = activeCategory === 'all' || item.category === activeCategory;

      // Sub-filter edisi stiker
      let matchStickerEd = true;
      if (activeCategory === 'stiker' && activeStickerEdition !== 'all') {
        matchStickerEd = String(item.edition).trim().toLowerCase() === String(activeStickerEdition).trim().toLowerCase();
      }

      // Pencarian teks
      const name = (item.player_name || item.title || '').toLowerCase();
      const titleMatch = name.includes(query);
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
      const descMatch = (item.desc || '').toLowerCase().includes(query);

      return matchCat && matchStickerEd && (titleMatch || editionMatch || teamMatch || yearMatch || descMatch);
    });
  }, [products, activeCategory, activeStickerEdition, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Sticky */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={scrollToCatalog}
        onResetHome={handleResetHome}
        onOpenContact={() => setIsContactOpen(true)}
      />

      {/* Hero Carousel Section */}
      <HeroCarousel
        onSelectCategory={handleSelectCategory}
        onSelectEdition={handleHeroSelectEdition}
        onScrollToCatalog={scrollToCatalog}
      />

      {/* Main Catalog Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 w-full">
        {/* Kategori Tabs */}
        <CategoryTabs
          categories={categories}
          setCategories={setCategories}
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
        />

        {/* Sub-filter Edisi Stiker (hanya tampil saat kategori stiker aktif) */}
        {activeCategory === 'stiker' && (
          <StickerEditionFilter
            products={products}
            activeStickerEdition={activeStickerEdition}
            onSelectEdition={handleSelectEdition}
          />
        )}

        {/* Grid Produk */}
        <ProductGrid
          products={filteredProducts}
          isLoading={isLoading}
          onOpenModal={(product) => setSelectedProduct(product)}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Modal Detail Produk */}
      <ProductModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onOpenZoom={(imgSrc, title) => {
          setZoomState({ isOpen: true, imgSrc, title });
        }}
      />

      {/* Modal Image Zoom Lightbox */}
      <ImageZoomModal
        isOpen={zoomState.isOpen}
        imgSrc={zoomState.imgSrc}
        title={zoomState.title}
        onClose={() => setZoomState({ isOpen: false, imgSrc: '', title: '' })}
      />

      {/* Modal Kontak Toko */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}
