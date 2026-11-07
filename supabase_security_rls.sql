-- ==============================================================================
-- LOUIFOOTBALL - SKRIP PENGATURAN ROW LEVEL SECURITY (RLS) SUPABASE
-- ==============================================================================
-- Jalankan skrip SQL ini di Supabase Dashboard -> SQL Editor
-- Skrip ini akan mengunci akses tulis (INSERT, UPDATE, DELETE) agar HANYA ADMIN yang sudah login
-- yang bisa memodifikasi data. Pengunjung publik tetap bisa membaca katalog (SELECT).
-- ==============================================================================

-- 1. AKTIFKAN ROW LEVEL SECURITY PADA SEMUA TABEL UTAMA
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS catalog_priorities ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. HAPUS POLICY LAMA (AGAR TIDAK TERJADI DUPLIKASI ATAU KONFLIK)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Authenticated users full access products" ON products;
DROP POLICY IF EXISTS "Enable all for authenticated users on products" ON products;

DROP POLICY IF EXISTS "Public can view categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users full access categories" ON categories;

DROP POLICY IF EXISTS "Public can view promotions" ON promotions;
DROP POLICY IF EXISTS "Authenticated users full access promotions" ON promotions;

DROP POLICY IF EXISTS "Public can view catalog_priorities" ON catalog_priorities;
DROP POLICY IF EXISTS "Authenticated users full access catalog_priorities" ON catalog_priorities;

-- ------------------------------------------------------------------------------
-- 3. KEBIJAKAN TABEL PRODUK (products)
-- Publik: Hanya boleh SELECT
-- Admin (Authenticated): Boleh SELECT, INSERT, UPDATE, DELETE
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can view products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users full access products"
  ON products
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. KEBIJAKAN TABEL KATEGORI (categories)
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can view categories"
  ON categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users full access categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 5. KEBIJAKAN TABEL PROMOSI / BANNER IKLAN (promotions)
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can view promotions"
  ON promotions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users full access promotions"
  ON promotions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 6. KEBIJAKAN TABEL PRIORITAS KATALOG (catalog_priorities)
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can view catalog_priorities"
  ON catalog_priorities
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users full access catalog_priorities"
  ON catalog_priorities
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

