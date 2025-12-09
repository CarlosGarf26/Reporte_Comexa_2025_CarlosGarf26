import React, { useEffect } from 'react';

interface ImageModalProps {
  isOpen: boolean;
  imageUrl?: string;
  title: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ isOpen, imageUrl, title, onClose }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-opacity animate-fadeIn" onClick={onClose}>
      <div 
        className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-800 truncate pr-4">Original: {title}</h3>
          <div className="flex gap-2">
            <a 
              href={imageUrl} 
              download={`original-${title || 'reporte'}.png`}
              className="p-2 hover:bg-blue-50 text-blue-600 rounded-full transition-colors flex items-center gap-1 text-sm font-medium"
              title="Descargar Imagen Original"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span className="hidden sm:inline">Descargar Imagen</span>
            </a>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt="Reporte Original" 
            className="max-w-full h-auto object-contain shadow-md rounded"
          />
        </div>
      </div>
    </div>
  );
};