-- Ensure invoices bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for invoices bucket
CREATE POLICY "Authenticated users can view invoices"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoices' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Solicitantes can upload invoices"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'invoices' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Admins can delete invoices"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'invoices' AND
  auth.role() = 'authenticated'
);