import React, { useState, useEffect, ErrorInfo, ReactNode } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultsTable } from './components/ResultsTable';
import { MobileReportCard } from './components/MobileReportCard';
import { ReportCard } from './components/ReportCard';
import { ExportActions } from './components/ExportActions';
import { ImageModal } from './components/ImageModal';
import { ProcessedReport, ReportData, INITIAL_REPORT_DATA, DEFAULT_LOGO } from './types';
import { processReportImage } from './services/geminiService';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-red-100 max-w-md w-full text-center">
             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.008v.008H12v-.008Z" />
                </svg>
             </div>
             <h2 className="text-xl font-bold text-slate-800 mb-2">Algo salió mal</h2>
             <p className="text-slate-500 text-sm mb-6">
               Ocurrió un error inesperado en la aplicación. Por favor recarga la página.
             </p>
             <button 
               onClick={() => window.location.reload()}
               className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors w-full"
             >
               Recargar Página
             </button>
             {this.state.error && (
               <details className="mt-4 text-left text-xs text-slate-400 bg-slate-50 p-2 rounded overflow-auto max-h-32">
                 <summary>Detalles técnicos</summary>
                 <pre className="mt-1 whitespace-pre-wrap">{this.state.error.toString()}</pre>
               </details>
             )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Subcomponente para manejar PDFs de forma segura y compatible ---
const PdfViewer: React.FC<{ base64: string }> = ({ base64 }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    try {
      // 1. Limpiar y extraer la data pura en Base64
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

      // 2. Decodificar Base64 a binario
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 3. Crear Blob especificando explícitamente el tipo PDF
      const blob = new Blob([bytes], { type: 'application/pdf' });
      
      // 4. Crear URL del Blob
      url = URL.createObjectURL(blob);
      setBlobUrl(url);
    } catch (e) {
      console.error("Error al generar blob del PDF", e);
    }

    // Limpieza de memoria al desmontar componente
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [base64]);

  if (!blobUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-900">
        <div className="text-center">
          <svg className="animate-spin h-6 w-6 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xs">Preparando PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-slate-200 group">
      {/* Usamos <object> que es más robusto para plugins que iframe, con fallback */}
      <object
        data={blobUrl}
        type="application/pdf"
        className="w-full h-full block"
      >
        {/* Contenido Fallback si el navegador bloquea la vista embebida */}
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-800 text-slate-300">
          <svg className="w-12 h-12 mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="mb-4 text-sm font-medium">El navegador no puede mostrar este PDF aquí.</p>
          <a 
            href={blobUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg"
          >
            Abrir PDF en pestaña nueva
          </a>
        </div>
      </object>

      {/* Botón flotante siempre disponible para abrir externamente */}
      <a 
        href={blobUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 right-4 p-2 bg-slate-900/90 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-black"
        title="Abrir en ventana externa"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </a>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [reports, setReports] = useState<ProcessedReport[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [viewingReport, setViewingReport] = useState<ProcessedReport | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'document'>('table');
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  // Set initial active report if none selected
  useEffect(() => {
    if (!activeReportId && reports.length > 0) {
      setActiveReportId(reports[0].id);
    }
  }, [reports, activeReportId]);

  // Robust ID generator to prevent collisions and "overwriting"
  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleFiles = async (files: File[]) => {
    setIsProcessing(true);
    setProcessingCount(0);
    
    // Create placeholder entries with unique IDs
    const newReports: ProcessedReport[] = files.map(f => ({
      id: generateId(), 
      filename: f.name,
      status: 'processing',
      confidenceScore: 0,
      data: { ...INITIAL_REPORT_DATA }
    }));

    // APPEND new reports to existing ones (do not replace)
    setReports(prev => [...prev, ...newReports]);
    
    // Auto-select the first NEW report so the user sees something happening
    if (newReports.length > 0) {
      setActiveReportId(newReports[0].id);
      // Switch to document view automatically on upload for better UX
      if (files.length === 1 && viewMode === 'table' && reports.length === 0) {
        setViewMode('document');
      }
    }

    // Process files SEQUENTIALLY to avoid Rate Limits (429)
    // Using a for loop with await ensures we process one after another
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reportId = newReports[i].id;
      
      try {
        const base64 = await fileToBase64(file);
        
        // Immediately save the image/pdf so the user can view it while processing
        setReports(prev => prev.map(r => 
          r.id === reportId 
            ? { ...r, originalImage: base64 } 
            : r
        ));

        // Call Service
        const { data, score } = await processReportImage(base64, file.type);
        
        // Update success
        setReports(prev => prev.map(r => 
          r.id === reportId 
            ? { ...r, status: 'completed', confidenceScore: score, data: data } 
            : r
        ));
      } catch (error: any) {
        console.error("Failed to process", file.name, error);
        const errorMsg = error.message || "Error desconocido al procesar";
        
        setReports(prev => prev.map(r => 
          r.id === reportId 
            ? { ...r, status: 'error', errorMsg: errorMsg } 
            : r
        ));
      } finally {
        setProcessingCount(prev => prev + 1);
      }
    }

    setIsProcessing(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpdateReport = (id: string, field: keyof ReportData, value: string) => {
    setReports(prev => prev.map(r => 
      r.id === id 
        ? { ...r, data: { ...r.data, [field]: value } }
        : r
    ));
    // Focus on the one being edited
    setActiveReportId(id);
  };

  const handleDeleteReport = (id: string) => {
    if(window.confirm("¿Estás seguro de eliminar este reporte?")) {
      setReports(prev => {
        const filtered = prev.filter(r => r.id !== id);
        // If we deleted the active one, switch to another
        if (activeReportId === id) {
            setActiveReportId(filtered.length > 0 ? filtered[0].id : null);
        }
        return filtered;
      });
    }
  };

  // Calculate Stats
  const completedReports = reports.filter(r => r.status === 'completed');
  const avgConfidence = completedReports.length > 0 
    ? Math.round(completedReports.reduce((acc, curr) => acc + curr.confidenceScore, 0) / completedReports.length * 10) / 10
    : 0;

  return (
    <div className="min-h-screen flex flex-col font-sans relative bg-slate-50 overflow-x-hidden">
      
      {/* Global Background Watermark */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none select-none">
        <img 
          src={DEFAULT_LOGO}
          alt="Fondo Comexa" 
          className="w-[80%] md:w-[60%] max-w-4xl opacity-[0.05] mix-blend-multiply grayscale filter object-contain"
        />
      </div>

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <img 
               src={DEFAULT_LOGO} 
               alt="COMEXA" 
               className="h-16 w-auto object-contain mix-blend-multiply"
             />
             <div>
               <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">Capturación Reportes CMX</h1>
               <span className="text-xs text-comexa-accent font-semibold tracking-wide">Mesa CMX traduciendo</span>
             </div>
          </div>
          <div className="text-right hidden sm:block">
             <p className="text-xs text-slate-500 uppercase font-medium">Sesión Actual</p>
             <p className="text-sm font-semibold text-slate-800">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-grow p-4 sm:p-6 lg:p-8 relative z-10 transition-all duration-300 ${viewMode === 'document' && reports.length > 0 ? 'max-w-[98%]' : 'max-w-7xl'} mx-auto w-full`}>
        <div className="space-y-6">
          
          <div className={`${viewMode === 'document' && reports.length > 0 ? 'flex flex-col gap-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}`}>
            
            {/* Upload Area */}
            <div className={`${viewMode === 'document' && reports.length > 0 ? 'w-full lg:max-w-xl' : 'lg:col-span-1'} space-y-4`}>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-4 border border-slate-100">
                <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-comexa-accent rounded-full"></span>
                  Cargar Archivos
                </h2>
                <FileUpload onFilesSelected={handleFiles} disabled={isProcessing} />
              </div>

              {/* Stats Mini Card */}
              {reports.length > 0 && viewMode === 'table' && (
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-4 border border-slate-100 grid grid-cols-2 divide-x divide-slate-100">
                   <div className="px-4 text-center">
                      <p className="text-xs text-slate-500 uppercase font-medium">Reportes</p>
                      <p className="text-2xl font-bold text-slate-800">{completedReports.length}</p>
                   </div>
                   <div className="px-4 text-center">
                      <p className="text-xs text-slate-500 uppercase font-medium">Confianza Promedio</p>
                      <div className="flex items-center justify-center gap-1">
                        <p className={`text-2xl font-bold ${avgConfidence >= 8 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {avgConfidence}
                        </p>
                        <span className="text-xs text-slate-400">/10</span>
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* Results Area */}
            <div className={`${viewMode === 'document' && reports.length > 0 ? 'w-full' : 'lg:col-span-2'} flex flex-col h-full min-h-[400px]`}>
              
              {/* Toolbar Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 bg-slate-50/50 p-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-800">Reportes Procesados</h2>
                  
                  {/* View Toggle */}
                  <div className="flex bg-white/90 backdrop-blur-sm rounded-lg p-1 border border-slate-200 shadow-sm">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        viewMode === 'table' 
                          ? 'bg-comexa-blue text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Vista Tabla
                    </button>
                    <button
                      onClick={() => setViewMode('document')}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        viewMode === 'document' 
                          ? 'bg-comexa-blue text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Vista Documento
                    </button>
                  </div>
                </div>
                <ExportActions reports={completedReports} />
              </div>
              
              <div className="flex-grow">
                {reports.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100/50 backdrop-blur-sm rounded-xl border-2 border-dashed border-slate-200 p-12">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4 text-slate-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      <p>Sube imágenes para ver los datos aquí.</p>
                   </div>
                ) : (
                  <>
                    {viewMode === 'table' ? (
                      <>
                        <div className="hidden md:block h-full">
                           <ResultsTable 
                              reports={reports} 
                              onUpdateReport={handleUpdateReport} 
                              onDeleteReport={handleDeleteReport}
                              onViewImage={setViewingReport}
                           />
                        </div>
                        <div className="md:hidden space-y-4">
                          {reports.map(report => (
                            <MobileReportCard 
                              key={report.id} 
                              report={report} 
                              onUpdateReport={handleUpdateReport}
                              onDeleteReport={handleDeleteReport}
                              onViewImage={setViewingReport}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      // Document View (Side-by-Side Pairs for ALL reports)
                      <div className="flex flex-col gap-12 pb-20">
                        {reports.map((report, index) => (
                           <div key={report.id} className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start relative border-b-2 border-slate-200 pb-12 last:border-0">
                              
                              {/* Left Column: Original Document */}
                              {/* STICKY positioning keeps it visible while scrolling the long form on the right */}
                              <div className="h-[600px] xl:h-[calc(100vh-8rem)] xl:sticky xl:top-24 bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 flex flex-col z-10">
                                <div className="bg-slate-900 p-3 flex justify-between items-center border-b border-slate-700 shrink-0">
                                   <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-400">
                                       <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                     </svg>
                                     Documento Original ({index + 1}/{reports.length})
                                   </h3>
                                   <span className="text-slate-400 text-xs truncate max-w-[200px]">
                                     {report.filename}
                                   </span>
                                </div>
                                
                                <div className="flex-grow bg-slate-700/50 flex items-center justify-center overflow-hidden relative p-0">
                                   {report.originalImage ? (
                                      (report.originalImage.match(/application\/pdf/i) || report.filename.toLowerCase().endsWith('.pdf')) ? (
                                         // Use the new PdfViewer component for safe rendering
                                         <PdfViewer base64={report.originalImage} />
                                      ) : (
                                         <img 
                                           src={report.originalImage} 
                                           alt="Original" 
                                           className="w-full h-full object-contain p-4"
                                         />
                                      )
                                   ) : (
                                      <div className="text-slate-400 text-sm flex flex-col items-center">
                                        <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        <p>Cargando...</p>
                                      </div>
                                   )}
                                </div>
                              </div>

                              {/* Right Column: Report Card */}
                              <div className="min-w-0">
                                <div 
                                    key={report.id} 
                                    id={`card-${report.id}`}
                                    className={`transition-all duration-300 transform ${
                                      activeReportId === report.id 
                                        ? 'ring-2 ring-blue-500 shadow-xl rounded-lg' 
                                        : ''
                                    }`}
                                >
                                    {report.status === 'error' ? (
                                      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                                        <svg className="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                                        </svg>
                                        <h3 className="text-red-800 font-bold mb-1">Error al procesar</h3>
                                        <p className="text-red-600 text-sm">{report.errorMsg}</p>
                                        <button 
                                          onClick={() => handleDeleteReport(report.id)}
                                          className="mt-4 text-red-700 underline text-sm hover:text-red-900"
                                        >
                                          Eliminar
                                        </button>
                                      </div>
                                    ) : (
                                      <ReportCard
                                        report={report}
                                        onUpdateReport={handleUpdateReport}
                                        onDeleteReport={handleDeleteReport}
                                        onViewImage={setViewingReport}
                                        isActive={activeReportId === report.id}
                                        onClick={() => setActiveReportId(report.id)}
                                      />
                                    )}
                                </div>
                              </div>
                           </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {isProcessing && (
                <div className="fixed bottom-8 right-8 z-50 p-4 bg-slate-900 text-white rounded-lg flex items-center gap-3 shadow-2xl animate-bounce-subtle">
                  <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">Procesando...</span>
                    <span className="text-xs text-slate-400">{processingCount} completados de {reports.length}</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* Image Modal */}
      <ImageModal 
        isOpen={!!viewingReport}
        imageUrl={viewingReport?.originalImage}
        title={viewingReport?.data.inmueble || 'Reporte'}
        onClose={() => setViewingReport(null)}
      />

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-sm border-t border-slate-200 mt-auto py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-1 text-slate-400 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043-3.296 3.745 3.745 0 0 1 1.593-3.068C20.37 9.63 21.232 10.732 21 12Z" />
              </svg>
              <span>Desarrollado con Gemini 2.5 AI</span>
            </div>
            <p className="text-xs text-slate-300">© {new Date().getFullYear()} COMEXA. Uso interno exclusivo.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;