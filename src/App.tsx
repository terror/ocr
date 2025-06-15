import { DropZone } from '@/components/drop-zone';
import { ExtractionDialog } from '@/components/extraction-dialog';
import type { Extraction } from '@/lib/types';
import { getFileSize } from '@/lib/utils';
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';
import Tesseract from 'tesseract.js';

const LANGUAGE = 'eng';

const SUPPORTED_FORMATS: string[] = [
  'image/bmp',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/webp',
];

const App: React.FC = () => {
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<Extraction | undefined>(undefined);

  const extract = async (file: File) => {
    setProcessing(true);
    setResult(undefined);

    const startTime = Date.now();

    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);

    try {
      const result = await Tesseract.recognize(file, LANGUAGE);

      const processingTime = (Date.now() - startTime) / 1000;

      const confidence = Math.round(result.data.confidence);

      setResult({
        text: result.data.text,
        confidence,
        processingTime,
        filename: file.name,
        fileSize: getFileSize(file.size),
      });
    } catch (error) {
      toast.error('Failed to process image, please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      toast.error(
        'Unsupported file format. Please upload an image file (PNG, JPEG, BMP, GIF, TIFF, WebP)'
      );

      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Please upload an image smaller than 10MB');
      return;
    }

    extract(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      setDragOver(false);

      const file = e.dataTransfer.files[0];

      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const closeDialog = () => {
    setResult(undefined);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <DropZone
        onFileSelect={handleFileSelect}
        isProcessing={processing}
        dragOver={dragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />

      <ExtractionDialog
        extraction={result}
        onClose={closeDialog}
        previewUrl={previewUrl}
      />
    </div>
  );
};

export default App;
