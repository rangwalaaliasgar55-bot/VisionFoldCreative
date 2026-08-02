import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { useContent } from '../context/ContentContext';

interface EditableImageProps {
  page: string;
  sectionKey: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
}

export const EditableImage: React.FC<EditableImageProps> = ({ page, sectionKey, fallbackSrc, alt, className = '' }) => {
  const { editMode, isAdmin, getValue, saveValue } = useContent();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const currentValue = useMemo(() => getValue(page, sectionKey, fallbackSrc), [fallbackSrc, getValue, page, sectionKey]);
  const [src, setSrc] = useState(currentValue);

  useEffect(() => {
    setSrc(currentValue);
  }, [currentValue]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ fileName: file.name, fileData: dataUrl, mimeType: file.type || 'image/png' }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Upload failed');
        }

        await saveValue(page, sectionKey, payload.url, 'image');
        setSrc(payload.url);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError('Failed to read image');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Image upload failed');
      setIsUploading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <img src={src || fallbackSrc} alt={alt} className="h-full w-full object-cover" />
      {isAdmin && editMode ? (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-[#0A0A0B]/70 text-sm font-semibold uppercase tracking-[0.2em] text-[#EDEDED]"
          >
            {isUploading ? 'Uploading…' : 'Replace image'}
            <ImagePlus className="ml-2 h-4 w-4" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
    </div>
  );
};
