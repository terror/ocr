import { Loader2, Upload } from 'lucide-react';
import { useRef } from 'react';

export const DropZone: React.FC<{
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}> = ({
  onFileSelect,
  isProcessing,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <div
        className={`w-full max-w-lg cursor-pointer rounded-xl border-2 border-dashed p-16 text-center transition-all ${
          dragOver
            ? 'scale-105 border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-gray-300 hover:scale-105 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
        } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          onChange={(e) =>
            e.target.files?.[0] && onFileSelect(e.target.files[0])
          }
          className='hidden'
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className='space-y-4'>
            <Loader2 className='mx-auto h-16 w-16 animate-spin' />
            <div>
              <p className='text-xl font-medium'>Processing Image...</p>
              <p className='text-gray-500'>Extracting text from your image</p>
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            <Upload className='mx-auto h-16 w-16 text-gray-400' />
            <div>
              <p className='text-xl font-medium'>
                Drop an image to extract text
              </p>
              <p className='text-gray-500'>or click to browse</p>
              <p className='mt-2 text-sm text-gray-400'>
                Supports PNG, JPEG, BMP, GIF, TIFF, WebP (max 10MB)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
