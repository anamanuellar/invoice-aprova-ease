-- Make the invoices bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'invoices';

-- Ensure proper RLS policies exist for storage.objects
-- Allow authenticated users to view their own files
CREATE POLICY "Users can view own invoice files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoices' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow gestores, financeiros, and admins to view all invoice files
CREATE POLICY "Managers and finance can view all invoice files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoices' 
  AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('gestor', 'financeiro', 'admin'))
  )
);

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload own invoice files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'invoices' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own files
CREATE POLICY "Users can update own invoice files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'invoices' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own invoice files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'invoices' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);