import React, { useCallback } from 'react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, disabled }) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files) as File[];
    validateAndPass(droppedFiles);
  }, [disabled, onFilesSelected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || !e.target.files) return;
    const selectedFiles = Array.from(e.target.files) as File[];
    validateAndPass(selectedFiles);
    // Reset value to allow selecting same files again if needed
    e.target.value = '';
  };

  const validateAndPass = (files: File[]) => {
    // Filter for images and PDF
    const validFiles = files.filter(f => 
      f.type.startsWith('image/') || f.type === 'application/pdf'
    );
    
    if (validFiles.length > 5) {
      alert("Por favor, selecciona máximo 5 archivos a la vez.");
      onFilesSelected(validFiles.slice(0, 5));
    } else if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 
        ${disabled 
          ? 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed' 
          : 'border-comexa-accent bg-blue-50/50 hover:bg-blue-50 hover:border-comexa-blue cursor-pointer'
        }`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <input 
        type="file" 
        multiple 
        accept="image/*,application/pdf"
        className="hidden" 
        id="file-upload"
        onChange={handleChange}
        disabled={disabled}
      />
      <label htmlFor="file-upload" className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}>
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-white rounded-full shadow-sm text-comexa-accent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-slate-900">
              Sube tus reportes aquí
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Arrastra imágenes o PDF (Máximo 5 archivos)
            </p>
          </div>
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-comexa-blue text-white shadow-sm hover:bg-blue-900 transition-colors">
            Seleccionar archivos
          </span>
        </div>
      </label>
    </div>
  );
};