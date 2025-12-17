import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to get a signed URL for a file in private storage
 * @param filePath - The path stored in database (can be old public URL or just path)
 * @param bucket - Storage bucket name (default: 'invoices')
 * @param expiresIn - URL expiration in seconds (default: 3600 = 1 hour)
 */
export function useSignedUrl(
  filePath: string | null | undefined,
  bucket: string = 'invoices',
  expiresIn: number = 3600
) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) {
      setSignedUrl(null);
      return;
    }

    const getSignedUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        // Extract the file path from full URL if needed
        let path = filePath;
        
        // If it's a full URL, extract just the path
        if (filePath.includes('/storage/v1/object/public/')) {
          const parts = filePath.split('/storage/v1/object/public/invoices/');
          path = parts[1] || filePath;
        } else if (filePath.includes('/storage/v1/object/sign/')) {
          const parts = filePath.split('/storage/v1/object/sign/invoices/');
          path = parts[1]?.split('?')[0] || filePath;
        }

        const { data, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, expiresIn);

        if (signError) {
          throw signError;
        }

        setSignedUrl(data.signedUrl);
      } catch (err) {
        console.error('Error getting signed URL:', err);
        setError(err instanceof Error ? err.message : 'Error getting file URL');
        setSignedUrl(null);
      } finally {
        setLoading(false);
      }
    };

    getSignedUrl();
  }, [filePath, bucket, expiresIn]);

  return { signedUrl, loading, error };
}

/**
 * Utility function to get signed URL (non-hook version for use in handlers)
 */
export async function getSignedUrl(
  filePath: string | null | undefined,
  bucket: string = 'invoices',
  expiresIn: number = 3600
): Promise<string | null> {
  if (!filePath) return null;

  try {
    // Extract the file path from full URL if needed
    let path = filePath;
    
    if (filePath.includes('/storage/v1/object/public/')) {
      const parts = filePath.split('/storage/v1/object/public/invoices/');
      path = parts[1] || filePath;
    } else if (filePath.includes('/storage/v1/object/sign/')) {
      const parts = filePath.split('/storage/v1/object/sign/invoices/');
      path = parts[1]?.split('?')[0] || filePath;
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  } catch (err) {
    console.error('Error getting signed URL:', err);
    return null;
  }
}
