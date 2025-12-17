import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { getSignedUrl } from '@/hooks/useSignedUrl';

interface SecureFileLinkProps {
  filePath: string | null | undefined;
  label: string;
  bucket?: string;
}

export function SecureFileLink({ filePath, label, bucket = 'invoices' }: SecureFileLinkProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!filePath) return;
    
    setLoading(true);
    try {
      const signedUrl = await getSignedUrl(filePath, bucket);
      if (signedUrl) {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error opening file:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!filePath) return null;

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileText className="h-4 w-4 mr-2" />
      )}
      {label}
    </Button>
  );
}
