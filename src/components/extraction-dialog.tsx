import { type Extraction } from '@/lib/types';
import { Copy, Download, FileImage } from 'lucide-react';
import { toast } from 'sonner';

import { Dialog } from './dialog';

export const ExtractionDialog: React.FC<{
  extraction?: Extraction;
  onClose: () => void;
  previewUrl: string | null;
}> = ({ extraction: result, onClose, previewUrl }) => {
  const copyToClipboard = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.text);

      const button = document.querySelector(
        '[data-copy-button]'
      ) as HTMLElement;

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
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });

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
        <div className='flex h-[80vh]'>
          <div className='flex w-1/2 items-center justify-center bg-gray-50 p-4 dark:bg-gray-800'>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt='Processed'
                className='max-h-full max-w-full rounded-lg object-contain shadow-lg'
              />
            ) : (
              <div className='text-gray-500'>
                <FileImage className='mx-auto mb-2 h-16 w-16' />
                <p>No preview available</p>
              </div>
            )}
          </div>

          <div className='flex w-1/2 flex-col'>
            <div className='border-b border-gray-200 p-6 dark:border-gray-700'>
              <h2 className='mb-2 text-xl font-semibold'>Results</h2>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                <p>
                  {result.filename} • {result.fileSize}
                </p>
              </div>

              <div className='mt-4 grid grid-cols-3 gap-4'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-green-600'>
                    {result.confidence}%
                  </div>
                  <div className='text-xs text-gray-500'>Confidence</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {result.text.length}
                  </div>
                  <div className='text-xs text-gray-500'>Characters</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-purple-600'>
                    {result.processingTime.toFixed(1)}s
                  </div>
                  <div className='text-xs text-gray-500'>Time</div>
                </div>
              </div>
            </div>

            <div className='flex flex-1 flex-col overflow-hidden p-6'>
              <div className='mb-3 flex items-center justify-between'>
                <span className='text-sm font-medium'>Text</span>
                <div className='flex items-center gap-2'>
                  <span className='text-xs text-gray-500'>
                    {result.text.split('\n').length} lines
                  </span>
                  <button
                    onClick={copyToClipboard}
                    data-copy-button
                    className='flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                  >
                    <Copy className='h-3 w-3' />
                    Copy
                  </button>
                  <button
                    onClick={downloadText}
                    className='flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                  >
                    <Download className='h-3 w-3' />
                    TXT
                  </button>
                  <button
                    onClick={downloadJSON}
                    className='rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                  >
                    JSON
                  </button>
                </div>
              </div>

              <textarea
                value={result.text}
                readOnly
                className='w-full flex-1 resize-none rounded-lg border border-gray-200 bg-white p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800'
                placeholder='Extracted text will appear here...'
              />
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
};
