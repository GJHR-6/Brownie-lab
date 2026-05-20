-- ============================================================
-- BROWNIE LAB — STORAGE: bucket product-images
-- Ejecutar DESPUÉS de 001_initial_schema.sql
-- ============================================================

-- Crear bucket público (imágenes de productos accesibles sin auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública (cualquiera puede ver imágenes de productos)
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Solo admin puede subir imágenes
CREATE POLICY "product_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

-- Solo admin puede eliminar imágenes
CREATE POLICY "product_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND public.is_admin());
