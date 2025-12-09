
import React, { useState } from 'react';
import { ProcessedReport, ReportData, DEFAULT_LOGO } from '../types';

interface ReportCardProps {
  report: ProcessedReport;
  onUpdateReport: (id: string, field: keyof ReportData, value: string) => void;
  onDeleteReport: (id: string) => void;
  onViewImage: (report: ProcessedReport) => void;
  isActive?: boolean;
  onClick?: () => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onUpdateReport, onDeleteReport, onViewImage, isActive, onClick }) => {
  const [bgMode, setBgMode] = useState<'watermark' | 'original'>('watermark');
  
  // Helper for checkboxes (visual only, toggles string inclusion)
  const toggleCheckbox = (field: keyof ReportData, value: string) => {
    const current = report.data[field] || '';
    if (current.includes(value)) {
      onUpdateReport(report.id, field, current.replace(value, '').trim());
    } else {
      onUpdateReport(report.id, field, `${current} ${value}`.trim());
    }
  };

  const isChecked = (field: keyof ReportData, value: string) => {
    return (report.data[field] || '').toLowerCase().includes(value.toLowerCase());
  };

  // Dynamic Styles based on background mode
  const inputBgClass = bgMode === 'original' ? 'bg-white/40 focus:bg-white/90' : 'bg-white/90 focus:bg-white';
  const containerBgClass = bgMode === 'original' ? 'bg-slate-50' : 'bg-white';
  
  // Specific style for large text areas to ensure readability against any background
  const textAreaStyle = "bg-white/60 focus:bg-white outline-none resize-none font-medium text-blue-950 rounded-sm p-1 transition-colors hover:bg-white/80";

  return (
    <div 
        className={`relative text-black w-full mb-8 font-sans text-xs border rounded-lg overflow-hidden transition-all duration-300 ${containerBgClass} ${isActive ? 'border-blue-500 shadow-2xl ring-4 ring-blue-500/10 z-10' : 'border-slate-300 shadow-lg hover:shadow-xl'}`}
        onClick={onClick}
    >
      
      {/* Active Indicator Strip */}
      {isActive && (
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-blue-600 z-30"></div>
      )}

      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden select-none">
        {bgMode === 'watermark' ? (
           <img 
             src={DEFAULT_LOGO}
             alt="Watermark" 
             className="w-[60%] opacity-[0.08] mix-blend-multiply grayscale filter"
           />
        ) : (
           report.originalImage && (
             <img 
               src={report.originalImage} 
               alt="Original Scan" 
               className="w-full h-full object-cover opacity-60"
             />
           )
        )}
      </div>

      {/* Toolbar */}
      <div className={`relative z-20 border-b border-slate-300 p-2 flex justify-between items-center no-print print:hidden backdrop-blur-sm ${isActive ? 'bg-blue-50/90' : 'bg-slate-100/95'}`}>
        <div className="flex items-center gap-2 pl-3">
           <div className={`w-3 h-3 rounded-full ${report.confidenceScore >= 8 ? 'bg-green-500' : 'bg-amber-500'}`} title={`Confianza: ${report.confidenceScore}/10`}></div>
           <span className="font-bold text-slate-700 text-sm">
             {report.data.inmueble || report.filename || 'Nuevo Reporte'}
           </span>
           {isActive && <span className="ml-2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">EDITANDO</span>}
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setBgMode(prev => prev === 'watermark' ? 'original' : 'watermark'); }} 
            className="flex items-center gap-1 text-slate-700 hover:text-blue-800 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors font-semibold border border-slate-300 bg-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            {bgMode === 'watermark' ? 'Fondo: Marca de Agua' : 'Fondo: Escaneo Original'}
          </button>
          
          <div className="w-px h-6 bg-slate-300 mx-1"></div>

          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onViewImage(report); }} 
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors font-semibold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Ver Original
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onDeleteReport(report.id); }} 
            className="flex items-center gap-1 text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded transition-colors font-semibold cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
            Eliminar
          </button>
        </div>
      </div>

      <div className="relative z-10 p-2 sm:p-4">
        <div className={`border-4 border-blue-900 p-1 transition-colors duration-300 ${inputBgClass}`}>
          
          {/* HEADER */}
          <div className="flex border-b-2 border-blue-900 pb-1 mb-1">
            <div className="w-24 flex-shrink-0 flex items-center justify-center p-1">
               <img src={DEFAULT_LOGO} alt="COMEXA" className="w-full h-auto object-contain mix-blend-multiply" />
            </div>
            <div className="flex-grow text-center flex flex-col justify-center px-2">
              <h1 className="font-bold text-blue-900 text-sm sm:text-base leading-tight">INTEGRADORES Y DESARROLLADORES EN SISTEMAS ELECTRÓNICOS</h1>
              <p className="font-bold text-blue-900 text-[10px] sm:text-xs bg-slate-100/50 mt-1">CABLEADO ESTRUCTURADO, REDES, CANALIZACIONES, VOZ Y DATOS</p>
            </div>
            <div className="w-32 flex-shrink-0 flex flex-col items-end justify-start p-1">
               <input 
                 type="text" 
                 value={report.data.folioReporte || ''} 
                 onChange={(e) => onUpdateReport(report.id, 'folioReporte', e.target.value)}
                 className={`text-red-600 font-bold text-xl text-right w-full outline-none ${inputBgClass}`}
                 placeholder="67029"
               />
               <span className="text-blue-900 font-bold text-sm">MR-14</span>
            </div>
          </div>

          {/* INFO GRID */}
          <div className="grid grid-cols-12 gap-0 border-2 border-blue-900 mb-1">
            
            {/* Column 1: Site Info */}
            <div className="col-span-12 md:col-span-5 border-b md:border-b-0 md:border-r border-blue-900 p-1 space-y-1">
              <div className="flex items-center">
                <label className="font-bold w-20 text-blue-900">INMUEBLE:</label>
                <input type="text" value={report.data.inmueble} onChange={e => onUpdateReport(report.id, 'inmueble', e.target.value)} className={`flex-grow border-b border-gray-400 px-1 outline-none font-medium uppercase ${inputBgClass}`} />
              </div>
              <div className="flex items-center gap-1">
                 <div className="flex items-center flex-grow">
                   <label className="font-bold text-blue-900 mr-1">SEDE/ZONA:</label>
                   <input type="text" value={report.data.sirh} onChange={e => onUpdateReport(report.id, 'sirh', e.target.value)} className={`flex-grow border-b border-gray-400 px-1 outline-none uppercase bg-white`} />
                 </div>
                 <div className="flex items-center w-24">
                   <label className="font-bold text-blue-900 mr-1 text-[10px]">SIRH:</label>
                   <input type="text" className={`w-full border-b border-gray-400 px-1 outline-none bg-white`} placeholder="" />
                 </div>
              </div>
              <div className="flex items-center">
                <label className="font-bold w-20 text-blue-900">REPORTÓ:</label>
                <input type="text" value={report.data.reporto || ''} onChange={e => onUpdateReport(report.id, 'reporto', e.target.value)} className={`flex-grow border-b border-gray-400 px-1 outline-none uppercase ${inputBgClass}`} />
              </div>
              <div className="flex items-center">
                <label className="font-bold w-20 text-blue-900">FECHA:</label>
                <input type="text" value={report.data.fecha} onChange={e => onUpdateReport(report.id, 'fecha', e.target.value)} className={`flex-grow border-b border-gray-400 px-1 outline-none ${inputBgClass}`} />
              </div>
              <div className="flex items-center">
                <label className="font-bold w-32 text-blue-900 text-[10px]">FOLIO DE CLIENTE:</label>
                <input type="text" value={report.data.folioCliente || ''} onChange={e => onUpdateReport(report.id, 'folioCliente', e.target.value)} className={`flex-grow border-b border-gray-400 px-1 outline-none font-mono ${inputBgClass}`} />
              </div>
              <div className="flex items-center">
                <label className="font-bold w-32 text-blue-900 text-[10px]">FOLIO DE COMEXA:</label>
                <input type="text" value={report.data.folio} onChange={e => onUpdateReport(report.id, 'folio', e.target.value)} className={`flex-grow border-b border-gray-400 px-1 outline-none font-mono ${inputBgClass}`} />
              </div>
            </div>

            {/* Column 2: Tech Info */}
            <div className="col-span-12 md:col-span-4 border-b md:border-b-0 md:border-r border-blue-900 p-1 space-y-1">
               <div className="flex items-center">
                 <label className="font-bold mr-1 text-blue-900">ATENCIÓN</label>
                 <input 
                   type="text" 
                   value={report.data.atencion || ''}
                   onChange={e => onUpdateReport(report.id, 'atencion', e.target.value)}
                   className={`flex-grow border-b border-gray-400 px-1 outline-none uppercase ${inputBgClass}`} 
                   placeholder="BANAMEX" 
                 />
               </div>
               <div className="flex items-center">
                 <label className="font-bold mr-1 text-blue-900">FECHA:</label>
                 <input type="text" value={report.data.fecha} readOnly className="flex-grow border-b border-gray-400 bg-transparent px-1 outline-none" />
               </div>
               <div className="flex items-center gap-1 text-[10px]">
                 <label className="font-bold text-blue-900">HORARIO DE:</label>
                 <input type="text" value={report.data.horaEntrada} onChange={e => onUpdateReport(report.id, 'horaEntrada', e.target.value)} className={`w-16 border-b border-gray-400 px-1 outline-none text-center ${inputBgClass}`} />
                 <label className="font-bold text-blue-900">A:</label>
                 <input type="text" value={report.data.horaSalida} onChange={e => onUpdateReport(report.id, 'horaSalida', e.target.value)} className={`w-16 border-b border-gray-400 px-1 outline-none text-center ${inputBgClass}`} />
               </div>
               <div className="mt-2">
                 <label className="font-bold text-blue-900 block text-[10px] mb-1">NOMBRE(S) TÉCNICO(S)</label>
                 <textarea 
                    value={report.data.tecnicos}
                    onChange={e => onUpdateReport(report.id, 'tecnicos', e.target.value)}
                    className={`w-full h-16 border border-gray-300 p-1 outline-none resize-none uppercase text-xs ${inputBgClass}`}
                 />
               </div>
            </div>

            {/* Column 3: Checkboxes */}
            <div className="col-span-12 md:col-span-3 p-1 flex flex-col justify-center space-y-2 pl-4">
               {['MANTENIMIENTO PREVENTIVO', 'MANTENIMIENTO CORRECTIVO', 'PROYECTO', 'TRABAJO ADICIONAL', 'OTROS'].map((label) => (
                 <div key={label} className="flex items-center justify-between cursor-pointer hover:bg-blue-50/50 rounded px-1" onClick={() => toggleCheckbox('tipoMantenimiento', label)}>
                   <span className="text-[9px] font-bold text-blue-900 leading-tight w-32">{label}</span>
                   <div className={`w-5 h-5 border border-blue-900 flex items-center justify-center ${isChecked('tipoMantenimiento', label) ? 'bg-blue-200' : inputBgClass}`}>
                      {isChecked('tipoMantenimiento', label) && <span className="text-black font-bold">X</span>}
                   </div>
                 </div>
               ))}
            </div>
          </div>

          {/* FALLA REPORTADA */}
          <div className={`border border-blue-900 mb-1 ${inputBgClass}`}>
            <div className="flex items-start p-1">
               <label className="font-bold text-blue-900 mr-2 whitespace-nowrap">FALLA REPORTADA:</label>
               <textarea 
                 value={report.data.fallaReportada} 
                 onChange={e => onUpdateReport(report.id, 'fallaReportada', e.target.value)}
                 className={`w-full ${textAreaStyle} text-sm`}
                 style={{ minHeight: '2rem' }}
               />
            </div>
          </div>

          {/* CONDICIONES */}
          <div className={`border border-blue-900 mb-1 ${inputBgClass}`}>
            <div className="flex items-start p-1">
               <label className="font-bold text-blue-900 mr-2 whitespace-nowrap text-[10px]">CONDICIONES QUE SE ENCUENTRA:</label>
               <textarea 
                 value={report.data.condicionesEncontradas} 
                 onChange={e => onUpdateReport(report.id, 'condicionesEncontradas', e.target.value)}
                 className={`w-full ${textAreaStyle} text-sm`}
                 style={{ minHeight: '2rem' }}
               />
            </div>
          </div>

          {/* TRABAJO REALIZADO */}
          <div className={`border border-blue-900 mb-1 relative bg-white`}>
            <div className="absolute top-1 left-1 font-bold text-blue-900 text-[10px]">TRABAJO REALIZADO:</div>
            <div className="pt-5 p-1">
               <textarea 
                  value={report.data.trabajoRealizado} 
                  onChange={e => onUpdateReport(report.id, 'trabajoRealizado', e.target.value)}
                  className={`w-full h-32 leading-relaxed text-sm ${textAreaStyle}`}
               />
            </div>
          </div>

          {/* MATERIAL */}
          <div className={`border border-blue-900 mb-1 ${inputBgClass}`}>
            <div className="flex items-start p-1">
               <label className="font-bold text-blue-900 mr-2 whitespace-nowrap text-[10px]">MATERIAL O REFACCIONES:</label>
               <input 
                 type="text"
                 value={report.data.materiales} 
                 onChange={e => onUpdateReport(report.id, 'materiales', e.target.value)}
                 className="w-full bg-transparent outline-none font-medium text-blue-950"
               />
            </div>
          </div>

          {/* EQUIPO TABLES */}
          <div className="grid grid-cols-2 gap-1 mb-1">
             {/* INSTALADO */}
             <div className="border border-blue-900">
                <div className="flex border-b border-blue-900 bg-blue-50/80">
                   <div className="w-2/3 p-1 font-bold text-blue-900 text-[10px] border-r border-blue-900">EQUIPO INSTALADO</div>
                   <div className="w-1/3 p-1 font-bold text-blue-900 text-[10px]">No. DE SERIE</div>
                </div>
                <div className="h-20 p-1 flex">
                   <textarea 
                      value={report.data.equipoInstalado}
                      onChange={e => onUpdateReport(report.id, 'equipoInstalado', e.target.value)} 
                      className={`w-full h-full resize-none outline-none text-xs font-mono ${inputBgClass}`}
                      placeholder="Descripción   |   Serie"
                   />
                </div>
             </div>
             {/* RETIRADO */}
             <div className="border border-blue-900">
                <div className="flex border-b border-blue-900 bg-blue-50/80">
                   <div className="w-2/3 p-1 font-bold text-blue-900 text-[10px] border-r border-blue-900">EQUIPO RETIRADO</div>
                   <div className="w-1/3 p-1 font-bold text-blue-900 text-[10px]">No. DE SERIE</div>
                </div>
                 <div className="h-20 p-1 flex">
                   <textarea 
                      value={report.data.equipoRetirado}
                      onChange={e => onUpdateReport(report.id, 'equipoRetirado', e.target.value)} 
                      className={`w-full h-full resize-none outline-none text-xs font-mono ${inputBgClass}`}
                      placeholder="Descripción   |   Serie"
                   />
                </div>
             </div>
          </div>

          {/* BOTTOM SECTION */}
          <div className="border-2 border-blue-900 grid grid-cols-12">
             
             {/* LEFT COLUMN (Checks) */}
             <div className="col-span-12 md:col-span-6 border-r border-blue-900">
                <div className="flex border-b border-blue-900">
                   {/* CLASIFICACION */}
                   <div className="w-1/2 p-2 border-r border-blue-900">
                      <div className="font-bold text-blue-900 text-center text-[10px] mb-1">CLASIFICACIÓN</div>
                      {['ELECTRÓNICA', 'MECÁNICA', 'OPERATIVA', 'INEXISTENTE'].map(c => (
                         <div key={c} className="flex items-center gap-1 mb-1 cursor-pointer hover:bg-blue-50/50" onClick={() => toggleCheckbox('clasificacion', c)}>
                            <div className={`w-3 h-3 border border-blue-900 flex items-center justify-center ${isChecked('clasificacion', c) ? 'bg-blue-600' : inputBgClass}`}>
                               {isChecked('clasificacion', c) && <div className="w-1 h-1 bg-white rounded-full"></div>}
                            </div>
                            <span className="text-[9px]">{c}</span>
                         </div>
                      ))}
                   </div>
                   {/* ESTADO FINAL */}
                   <div className="w-1/2 p-2">
                      <div className="font-bold text-blue-900 text-center text-[10px] mb-1">ESTADO FINAL</div>
                       {['REPARACIÓN TOTAL', 'REPARACIÓN PARCIAL', 'PENDIENTE', 'PENDIENTE POR TERCEROS'].map(c => (
                         <div key={c} className="flex items-center gap-1 mb-1 cursor-pointer hover:bg-blue-50/50" onClick={() => toggleCheckbox('estatusFinal', c)}>
                            <div className={`w-3 h-3 border border-blue-900 flex items-center justify-center ${isChecked('estatusFinal', c) ? 'bg-blue-600' : inputBgClass}`}>
                               {isChecked('estatusFinal', c) && <div className="w-1 h-1 bg-white rounded-full"></div>}
                            </div>
                            <span className="text-[9px]">{c}</span>
                         </div>
                      ))}
                   </div>
                </div>
                <div className="p-1 border-b border-blue-900 h-24">
                   <div className="font-bold text-blue-900 text-[10px] text-center mb-1">OBSERVACIONES Y/O COMENTARIOS</div>
                   <textarea 
                      value={report.data.observaciones}
                      onChange={e => onUpdateReport(report.id, 'observaciones', e.target.value)}
                      className={`w-full h-full ${textAreaStyle} text-xs`} 
                   />
                </div>
                <div className="p-2 h-20 flex items-end justify-center">
                   <div className="border-t border-black w-3/4 text-center text-[10px]">NOMBRE Y FIRMA DEL TÉCNICO</div>
                </div>
             </div>

             {/* RIGHT COLUMN (Verify & Sign) */}
             <div className="col-span-12 md:col-span-6">
                <div className="p-1 border-b border-blue-900">
                   <div className="font-bold text-blue-900 text-[10px] mb-1">SE VERIFICA LA CORRECTA OPERACIÓN DEL SISTEMA:</div>
                   <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      {['CENTRALIZADO', 'LOCAL', 'ALARMAS', 'CONTROL DE ACCESO', 'EQUIPO ANÁLOGICO', 'EQUIPO IP', 'CCTV', 'INCENDIO'].map(v => (
                         <div key={v} className="flex items-center gap-1 cursor-pointer hover:bg-blue-50/50" onClick={() => toggleCheckbox('verificacionOperacion', v)}>
                            <div className={`w-3 h-3 border border-blue-900 flex items-center justify-center ${isChecked('verificacionOperacion', v) ? 'bg-blue-600' : inputBgClass}`}>
                               {isChecked('verificacionOperacion', v) && <span className="text-white text-[8px]">✓</span>}
                            </div>
                            <span className="text-[9px]">{v}</span>
                         </div>
                      ))}
                   </div>
                </div>
                <div className="p-1 border-b border-blue-900">
                   <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-blue-900 text-blue-900">RECEPCIÓN:</span>
                      <input type="text" value={report.data.recepcion || ''} onChange={e => onUpdateReport(report.id, 'recepcion', e.target.value)} className={`flex-grow border-b border-gray-400 outline-none text-xs uppercase bg-white`} />
                   </div>
                   <div className="flex gap-2 text-[10px]">
                      <span className="font-bold text-blue-900">HORA ENTRADA:</span>
                      <span className="border-b border-gray-400 w-16 text-center">{report.data.horaEntrada}</span>
                      <span className="font-bold text-blue-900">HORA SALIDA:</span>
                      <span className="border-b border-gray-400 w-16 text-center">{report.data.horaSalida}</span>
                   </div>
                </div>
                <div className="flex h-32">
                   <div className="w-1/2 border-r border-blue-900 p-1 flex flex-col justify-between">
                      <div className="text-[10px] font-bold text-blue-900 text-center bg-slate-100/50 mb-1">EVALUACION</div>
                      <div className="space-y-1">
                         <div className="flex justify-between items-center text-[8px]">
                            <span>TIEMPO ATENCIÓN:</span>
                            <div className="flex gap-1">
                               <label className="flex items-center cursor-pointer"><input type="checkbox" checked={isChecked('evaluacion', 'TIEMPO: CORTO')} onChange={() => toggleCheckbox('evaluacion', 'TIEMPO: CORTO')} />C</label>
                               <label className="flex items-center cursor-pointer"><input type="checkbox" checked={isChecked('evaluacion', 'TIEMPO: BUENO')} onChange={() => toggleCheckbox('evaluacion', 'TIEMPO: BUENO')} />B</label>
                               <label className="flex items-center cursor-pointer"><input type="checkbox" checked={isChecked('evaluacion', 'TIEMPO: EXCESIVO')} onChange={() => toggleCheckbox('evaluacion', 'TIEMPO: EXCESIVO')} />E</label>
                            </div>
                         </div>
                         <div className="flex justify-between items-center text-[8px]">
                            <span>DOMINIO TRABAJO:</span>
                            <div className="flex gap-1">
                               <label className="flex items-center cursor-pointer"><input type="checkbox" checked={isChecked('evaluacion', 'DOMINIO: EXCELENTE')} onChange={() => toggleCheckbox('evaluacion', 'DOMINIO: EXCELENTE')} />E</label>
                               <label className="flex items-center cursor-pointer"><input type="checkbox" checked={isChecked('evaluacion', 'DOMINIO: BUENO')} onChange={() => toggleCheckbox('evaluacion', 'DOMINIO: BUENO')} />B</label>
                               <label className="flex items-center cursor-pointer"><input type="checkbox" checked={isChecked('evaluacion', 'DOMINIO: MALO')} onChange={() => toggleCheckbox('evaluacion', 'DOMINIO: MALO')} />M</label>
                            </div>
                         </div>
                      </div>
                   </div>
                   <div className="w-1/2 p-1 flex items-end justify-center relative">
                       <div className="absolute top-1 right-1 text-[8px] text-gray-400">SELLO</div>
                       <div className="border-t border-black w-full text-center text-[8px] leading-tight">
                          NOMBRE, SELLO Y FIRMA DEL FUNCIONARIO<br/>QUE RECIBE EL SISTEMA
                       </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
        
        {/* Footer Text */}
        <div className="text-center text-[8px] text-blue-900 mt-1 font-bold">
           CORPORACIÓN COMEXA TEL: 55 5685-7830, 55 5685-7837, 800-2 COMEXA<br/>
           comexa@comexa.com.mx
        </div>
      </div>
    </div>
  );
};
