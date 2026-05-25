-- Allow anonymous users to insert orders via the public checkout flow
CREATE POLICY "pedidos_public_insert"
  ON public.pedidos FOR INSERT
  TO anon
  WITH CHECK (true);
