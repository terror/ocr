import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileImage, Copy, Download, Loader2, X } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { toast } from 'sonner';

interface Result {
  text: string;
  confidence: number;
  processingTime: number;
  filename: string;
  fileSize: string;
}

const LANGUAGE = 'eng';

const SUPPORTED_FORMATS: string[] = [
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/gif',
  'image/tiff',
  'image/webp'
];

const getFileSize = (size: number): string => {
  if (size < 1024) { 
    return `${size} B`;
  }

  if (size < 1024 * 1024) { 
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

const Dialog: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, onClose, children }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
};

const DropZone: React.FC<{
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}> = ({ onFileSelect, isProcessing, dragOver, onDragOver, onDragLeave, onDrop }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className={`border-2 border-dashed rounded-xl p-16 text-center transition-all cursor-pointer max-w-lg w-full ${
          dragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 scale-105'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:scale-105'
        } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
          className="hidden"
          disabled={isProcessing}
        />
        
        {isProcessing ? (
          <div className="space-y-4">
            <Loader2 className="h-16 w-16 mx-auto animate-spin" />
            <div>
              <p className="text-xl font-medium">Processing Image...</p>
              <p className="text-gray-500">Extracting text from your image</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-16 w-16 mx-auto text-gray-400" />
            <div>
              <p className="text-xl font-medium">Drop an image to extract text</p>
              <p className="text-gray-500">or click to browse</p>
              <p className="text-sm text-gray-400 mt-2">
                Supports PNG, JPEG, BMP, GIF, TIFF, WebP (max 10MB)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ResultDialog: React.FC<{
  onClose: () => void;
  previewUrl: string | null;
  result?: Result;
}> = ({ result, onClose, previewUrl }) => {
  const copyToClipboard = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.text);

      const button = document.querySelector('[data-copy-button]') as HTMLElement;

      if (button) {
        const original = button.textContent;

        button.textContent = 'Copied!';

        setTimeout(() => {
          button.textContent = original;
        }, 1000);
      }
    } catch (err) {
      toast.error('Failed to copy text');
    }
  };

  const downloadText = () => {
    if (!result) return;
    
    const blob = new Blob([result.text], { type: 'text/plain' });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-result-${Date.now()}.txt`;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    if (!result) return;
    
    const data = {
      ...result,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-result-${Date.now()}.json`;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={!!result} onClose={onClose}>
      {result && (
        <div className="flex h-[80vh]">
          <div className="w-1/2 bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-4">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Processed"
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            ) : (
              <div className="text-gray-500">
                <FileImage className="h-16 w-16 mx-auto mb-2" />
                <p>No preview available</p>
              </div>
            )}
          </div>
          
          <div className="w-1/2 flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-2">Results</h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>{result.filename} • {result.fileSize}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.confidence}%</div>
                  <div className="text-xs text-gray-500">Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{result.text.length}</div>
                  <div className="text-xs text-gray-500">Characters</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{result.processingTime.toFixed(1)}s</div>
                  <div className="text-xs text-gray-500">Time</div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Text</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {result.text.split('\n').length} lines
                  </span>
                  <button
                    onClick={copyToClipboard}
                    data-copy-button
                    className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </button>
                  <button
                    onClick={downloadText}
                    className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    TXT
                  </button>
                  <button
                    onClick={downloadJSON}
                    className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded"
                  >
                    JSON
                  </button>
                </div>
              </div>
              
              <textarea
                value={result.text}
                readOnly
                className="flex-1 w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none bg-white dark:bg-gray-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Extracted text will appear here..."
              />
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
};

const App: React.FC = () => {
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<Result | undefined>(undefined);

  const processOCR = async (file: File) => {
    setIsProcessing(true);
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
        fileSize: getFileSize(file.size)
      });
    } catch (error) {
      toast.error('Error processing image. Please try again with a different image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      toast.error('Unsupported file format. Please upload an image file (PNG, JPEG, BMP, GIF, TIFF, WebP)');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Please upload an image smaller than 10MB');
      return;
    }
    
    processOCR(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    setDragOver(false);

    const file = e.dataTransfer.files[0];

    if (file) { 
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

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
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <DropZone
        onFileSelect={handleFileSelect}
        isProcessing={isProcessing}
        dragOver={dragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
      
      <ResultDialog
        result={result}
        onClose={closeDialog}
        previewUrl={previewUrl}
      />
    </div>
  );
};

export default App;
