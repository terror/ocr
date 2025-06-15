import { X } from 'lucide-react';

export const Dialog: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, onClose, children }) => {
  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <div className='fixed inset-0 bg-black/50' onClick={onClose} />
      <div className='relative mx-4 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-900'>
        <button onClick={onClose} className='absolute top-4 right-4 z-10'>
          <X className='h-4 w-4' />
        </button>
        {children}
      </div>
    </div>
  );
};
