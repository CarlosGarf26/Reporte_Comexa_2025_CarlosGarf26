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
  public state: ErrorBoundaryState = { hasError: false, error: null };

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
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);
      setBlobUrl(url);
    } catch (e) {
      console.error("Error al generar blob del PDF", e);
    }
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
      <object data={blobUrl} type="application/pdf" className="w-full h-full block">
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-800 text-slate-300">
          <p className="mb-4 text-sm font-medium">El navegador no puede mostrar este PDF aquí.</p>
          <a href={blobUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg">
            Abrir PDF en pestaña nueva
          </a>
        </div>
      </object>
      <a href={blobUrl} target="_blank" rel="noopener noreferrer" className="absolute top-4 right-4 p-2 bg-slate-900/90 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-black" title="Abrir en ventana externa">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </a>
    </div>
  );
};

// Helper for waiting
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const AppContent: React.FC = () => {
  const [reports, setReports] = useState<ProcessedReport[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [viewingReport, setViewingReport] = useState<ProcessedReport | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'document'>('table');
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Procesando...");
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  
  // API Key Status State
  const [keyStatus, setKeyStatus] = useState<'checking' | 'ok' | 'blocked' | 'quota' | 'error'>('checking');
  const [keyMessage, setKeyMessage] = useState('');

  // Validar API Key SOLO localmente al iniciar para no gastar cuota ni provocar 429
  useEffect(() => {
    if (!process.env.API_KEY || process.env.API_KEY.length < 10) {
      setKeyStatus('blocked');
      setKeyMessage('No se detectó ninguna API Key configurada en Vercel.');
    } else {
      setKeyStatus('ok');
      setKeyMessage('Lista para procesar.');
    }
  }, []);

  useEffect(() => {
    if (!activeReportId && reports.length > 0) {
      setActiveReportId(reports[0].id);
    }
  }, [reports, activeReportId]);

  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleRetry = async (report: ProcessedReport) => {
     if (!report.originalImage) return;
     
     // Set to processing
     setReports(prev => prev.map(r => 
        r.id === report.id ? { ...r, status: 'processing', errorMsg: undefined } : r
     ));
     
     setIsProcessing(true);
     setStatusMessage("Reintentando con Flash (más rápido)...");
     
     try {
        const mimeType = report.originalImage.startsWith('data:application/pdf') ? 'application/pdf' : 'image/jpeg';
        // Force simple flash for retries usually safer
        const { data, score } = await processReportImage(report.originalImage, mimeType, 'gemini-2.5-flash');
        
        setReports(prev => prev.map(r => 
          r.id === report.id 
            ? { ...r, status: 'completed', confidenceScore: score, data: data } 
            : r
        ));
     } catch (error: any) {
        setReports(prev => prev.map(r => 
          r.id === report.id 
            ? { ...r, status: 'error', errorMsg: error.message } 
            : r
        ));
     } finally {
        setIsProcessing(false);
        setStatusMessage("Listo.");
     }
  };

  const handleFiles = async (files: File[]) => {
    setIsProcessing(true);
    setProcessingCount(0);
    setStatusMessage("Iniciando carga...");
    
    const newReports: ProcessedReport[] = files.map(f => ({
      id: generateId(), 
      filename: f.name,
      status: 'processing',
      confidenceScore: 0,
      data: { ...INITIAL_REPORT_DATA }
    }));

    setReports(prev => [...prev, ...newReports]);
    
    if (newReports.length > 0) {
      setActiveReportId(newReports[0].id);
      if (files.length === 1 && viewMode === 'table' && reports.length === 0) {
        setViewMode('document');
      }
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reportId = newReports[i].id;
      
      try {
        const base64 = await fileToBase64(file);
        
        setReports(prev => prev.map(r => 
          r.id === reportId 
            ? { ...r, originalImage: base64 } 
            : r
        ));

        if (selectedModel === 'manual') {
          setStatusMessage(`Preparando ficha manual para ${file.name}...`);
          await wait(500); 
          setReports(prev => prev.map(r => 
            r.id === reportId 
              ? { ...r, status: 'completed', confidenceScore: 0, data: { ...INITIAL_REPORT_DATA } } 
              : r
          ));
          continue; 
        }

        // Mayor tiempo de espera entre archivos para evitar error 429
        const waitTime = selectedModel.includes('pro') ? 15000 : 3000;
        if (i > 0) {
          setStatusMessage(`Pausando ${waitTime/1000}s para evitar saturación... (${files.length - i} restantes)`);
          await wait(waitTime); 
        }

        setStatusMessage(`Analizando ${file.name} con IA...`);
        
        const { data, score } = await processReportImage(base64, file.type, selectedModel);
        
        setReports(prev => prev.map(r => 
          r.id === reportId 
            ? { ...r, status: 'completed', confidenceScore: score, data: data } 
            : r
        ));
      } catch (error: any) {
        console.error("Failed to process", file.name, error);
        setReports(prev => prev.map(r => 
          r.id === reportId 
            ? { ...r, status: 'error', errorMsg: error.message || "Error desconocido" } 
            : r
        ));
      } finally {
        setProcessingCount(prev => prev + 1);
      }
    }

    setIsProcessing(false);
    setStatusMessage("Procesando...");
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
    setActiveReportId(id);
  };

  const handleDeleteReport = (id: string) => {
    if(window.confirm("¿Estás seguro de eliminar este reporte?")) {
      setReports(prev => {
        const filtered = prev.filter(r => r.id !== id);
        if (activeReportId === id) {
            setActiveReportId(filtered.length > 0 ? filtered[0].id : null);
        }
        return filtered;
      });
    }
  };

  const completedReports = reports.filter(r => r.status === 'completed');
  const avgConfidence = completedReports.length > 0 
    ? Math.round(completedReports.reduce((acc, curr) => acc + curr.confidenceScore, 0) / completedReports.length * 10) / 10
    : 0;

  return (
    <div className="min-h-screen flex flex-col font-sans relative bg-slate-50 overflow-x-hidden">
      
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none select-none">
        <img 
          src={DEFAULT_LOGO}
          alt="Fondo Comexa" 
          className="w-[80%] md:w-[60%] max-w-4xl opacity-[0.05] mix-blend-multiply grayscale filter object-contain"
        />
      </div>

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
             <div className="flex flex-col items-end">
               <div className="flex items-center gap-2 mb-1">
                 {keyStatus === 'ok' && (
                   <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold border border-green-200">
                     <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                     Conectado
                   </span>
                 )}
                 {keyStatus === 'checking' && (
                   <span className="text-xs text-slate-400">Verificando sistema...</span>
                 )}
               </div>
             </div>
             <p className="text-sm font-semibold text-slate-800 mt-1">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </header>

      {/* Banner de Diagnóstico de API Key */}
      {(keyStatus === 'blocked' || keyStatus === 'quota') && (
        <div className={`border-b p-3 text-center relative z-20 ${keyStatus === 'blocked' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-2">
            <p className={`text-sm font-bold flex items-center gap-2 ${keyStatus === 'blocked' ? 'text-red-700' : 'text-orange-800'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
              </svg>
              <span>{keyStatus === 'blocked' ? 'API KEY BLOQUEADA O INVÁLIDA' : 'CUOTA AGOTADA'}</span>
            </p>
            <p className={`text-sm ${keyStatus === 'blocked' ? 'text-red-600' : 'text-orange-700'}`}>{keyMessage}</p>
            
            {keyStatus === 'quota' ? (
                <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded-full text-xs font-bold border transition-colors bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200">
                  Activar Plan de Pago (Billing)
                </a>
            ) : (
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded-full text-xs font-bold border transition-colors bg-red-100 text-red-800 border-red-300 hover:bg-red-200">
                  Solucionar en Google
                </a>
            )}
          </div>
        </div>
      )}

      <main className={`flex-grow p-4 sm:p-6 lg:p-8 relative z-10 transition-all duration-300 ${viewMode === 'document' && reports.length > 0 ? 'max-w-[98%]' : 'max-w-7xl'} mx-auto w-full`}>
        <div className="space-y-6">
          <div className={`${viewMode === 'document' && reports.length > 0 ? 'flex flex-col gap-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}`}>
            <div className={`${viewMode === 'document' && reports.length > 0 ? 'w-full lg:max-w-xl' : 'lg:col-span-1'} space-y-4`}>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-4 border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <span className="w-1 h-4 bg-comexa-accent rounded-full"></span>
                      Cargar Archivos
                    </h2>
                    <div className="flex items-center gap-2">
                       <label htmlFor="model-select" className="text-xs text-slate-500 font-medium">Cerebro IA:</label>
                       <select 
                         id="model-select"
                         value={selectedModel}
                         onChange={(e) => setSelectedModel(e.target.value)}
                         disabled={isProcessing}
                         className="text-xs border border-slate-300 rounded-md py-1 px-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                       >
                         <option value="gemini-2.5-flash">⚡ Flash (Rápido)</option>
                         <option value="gemini-3-pro-preview">🧠 Pro (Inteligente)</option>
                         <option value="manual">✍️ Manual (Sin IA)</option>
                       </select>
                    </div>
                </div>
                <FileUpload onFilesSelected={handleFiles} disabled={isProcessing || keyStatus === 'blocked'} />
                <p className="text-[10px] text-slate-400 mt-2 text-center">* Si la IA falla, selecciona "Manual" para capturar tú mismo.</p>
              </div>

              {reports.length > 0 && viewMode === 'table' && (
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-4 border border-slate-100 grid grid-cols-2 divide-x divide-slate-100">
                   <div className="px-4 text-center">
                      <p className="text-xs text-slate-500 uppercase font-medium">Reportes</p>
                      <p className="text-2xl font-bold text-slate-800">{completedReports.length}</p>
                   </div>
                   <div className="px-4 text-center">
                      <p className="text-xs text-slate-500 uppercase font-medium">Confianza Promedio</p>
                      <div className="flex items-center justify-center gap-1">
                        <p className={`text-2xl font-bold ${avgConfidence >= 8 ? 'text-green-600' : 'text-yellow-600'}`}>{avgConfidence}</p>
                        <span className="text-xs text-slate-400">/10</span>
                      </div>
                   </div>
                </div>
              )}
            </div>

            <div className={`${viewMode === 'document' && reports.length > 0 ? 'w-full' : 'lg:col-span-2'} flex flex-col h-full min-h-[400px]`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 bg-slate-50/50 p-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-800">Reportes Procesados</h2>
                  <div className="flex bg-white/90 backdrop-blur-sm rounded-lg p-1 border border-slate-200 shadow-sm">
                    <button onClick={() => setViewMode('table')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${viewMode === 'table' ? 'bg-comexa-blue text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Vista Tabla</button>
                    <button onClick={() => setViewMode('document')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${viewMode === 'document' ? 'bg-comexa-blue text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Vista Documento</button>
                  </div>
                </div>
                <ExportActions reports={completedReports} />
              </div>
              
              <div className="flex-grow">
                {reports.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100/50 backdrop-blur-sm rounded-xl border-2 border-dashed border-slate-200 p-12">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                      <p>Sube imágenes para ver los datos aquí.</p>
                   </div>
                ) : (
                  <>
                    {viewMode === 'table' ? (
                      <>
                        <div className="hidden md:block h-full">
                           <ResultsTable reports={reports} onUpdateReport={handleUpdateReport} onDeleteReport={handleDeleteReport} onViewImage={setViewingReport} />
                        </div>
                        <div className="md:hidden space-y-4">
                          {reports.map(report => (
                            <MobileReportCard key={report.id} report={report} onUpdateReport={handleUpdateReport} onDeleteReport={handleDeleteReport} onViewImage={setViewingReport} />
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-12 pb-20">
                        {reports.map((report, index) => (
                           <div key={report.id} className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start relative border-b-2 border-slate-200 pb-12 last:border-0">
                              <div className="h-[600px] xl:h-[calc(100vh-8rem)] xl:sticky xl:top-24 bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 flex flex-col z-10">
                                <div className="bg-slate-900 p-3 flex justify-between items-center border-b border-slate-700 shrink-0">
                                   <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-400"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /></svg>
                                     Documento Original ({index + 1}/{reports.length})
                                   </h3>
                                   <span className="text-slate-400 text-xs truncate max-w-[200px]">{report.filename}</span>
                                </div>
                                <div className="flex-grow bg-slate-700/50 flex items-center justify-center overflow-hidden relative p-0">
                                   {report.originalImage ? (
                                      (report.originalImage.match(/application\/pdf/i) || report.filename.toLowerCase().endsWith('.pdf')) ? (
                                         <PdfViewer base64={report.originalImage} />
                                      ) : (
                                         <img src={report.originalImage} alt="Original" className="w-full h-full object-contain p-4" />
                                      )
                                   ) : (
                                      <div className="text-slate-400 text-sm flex flex-col items-center">
                                        <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        <p>Cargando...</p>
                                      </div>
                                   )}
                                </div>
                              </div>
                              <div className="min-w-0">
                                <div key={report.id} id={`card-${report.id}`} className={`transition-all duration-300 transform ${activeReportId === report.id ? 'ring-2 ring-blue-500 shadow-xl rounded-lg' : ''}`}>
                                    {report.status === 'error' ? (
                                      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                                        <svg className="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                                        <h3 className="text-red-800 font-bold mb-1">Error al procesar</h3>
                                        <p className="text-red-600 text-sm mb-3">{report.errorMsg}</p>
                                        {report.errorMsg?.includes('Cuota') ? (
                                           <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className="inline-block bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-xs font-bold transition-colors mb-3">Gestionar Pagos en Google Cloud</a>
                                        ) : report.errorMsg?.includes('API Key') ? (
                                           <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="inline-block bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-xs font-bold transition-colors mb-3">Conseguir Nueva Llave</a>
                                        ) : null}
                                        <div className="flex justify-center gap-4">
                                          <button onClick={() => handleDeleteReport(report.id)} className="text-red-700 underline text-sm hover:text-red-900">Eliminar</button>
                                          <button onClick={() => handleRetry(report)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 shadow-sm flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                            Reintentar con Flash
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <ReportCard report={report} onUpdateReport={handleUpdateReport} onDeleteReport={handleDeleteReport} onViewImage={setViewingReport} isActive={activeReportId === report.id} onClick={() => setActiveReportId(report.id)} />
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
                  <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{statusMessage}</span>
                    <span className="text-xs text-slate-400">{processingCount} completados de {reports.length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <ImageModal isOpen={!!viewingReport} imageUrl={viewingReport?.originalImage} title={viewingReport?.data.inmueble || 'Reporte'} onClose={() => setViewingReport(null)} />
      <footer className="bg-white/90 backdrop-blur-sm border-t border-slate-200 mt-auto py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-1 text-slate-400 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1 1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.593-3.068C20.37 9.63 21.232 10.732 21 12Z" /></svg>
              <span>Desarrollado por Juan Carlos Garfias con Gemini 2.5 AI</span>
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