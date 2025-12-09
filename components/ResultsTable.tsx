
import React from 'react';
import { ProcessedReport, ReportData } from '../types';

interface ResultsTableProps {
  reports: ProcessedReport[];
  onUpdateReport: (id: string, field: keyof ReportData, value: string) => void;
  onDeleteReport: (id: string) => void;
  onViewImage: (report: ProcessedReport) => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ reports, onUpdateReport, onDeleteReport, onViewImage }) => {
  if (reports.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 min-w-[50px]">Conf.</th>
              <th className="px-4 py-3 min-w-[120px]">Sede / Inmueble</th>
              <th className="px-4 py-3 min-w-[100px]">Fecha</th>
              <th className="px-4 py-3 min-w-[100px]">Tipo Mant.</th>
              <th className="px-4 py-3 min-w-[150px]">Falla Reportada</th>
              <th className="px-4 py-3 min-w-[150px]">Condiciones</th>
              <th className="px-4 py-3 min-w-[200px]">Trabajo Realizado</th>
              <th className="px-4 py-3 min-w-[150px]">Materiales / Equipo</th>
              <th className="px-4 py-3 min-w-[150px]">Observaciones</th>
              <th className="px-4 py-3 min-w-[80px]">Hora</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-slate-50 group transition-colors">
                
                {/* Confidence Score Indicator */}
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center justify-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white
                        ${report.confidenceScore >= 8 ? 'bg-green-500' : 
                          report.confidenceScore >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      title={`Confianza: ${report.confidenceScore}/10`}
                    >
                      {report.confidenceScore}
                    </div>
                  </div>
                </td>

                {/* Sede / Inmueble */}
                <td className="p-2 align-top">
                  <input 
                    type="text" 
                    value={report.data.inmueble}
                    onChange={(e) => onUpdateReport(report.id, 'inmueble', e.target.value)}
                    className="w-full bg-transparent border-transparent focus:border-blue-500 focus:ring-0 rounded px-2 py-1 hover:bg-white border hover:border-slate-200 transition-colors font-medium"
                    placeholder="Inmueble"
                  />
                  <input 
                     type="text"
                     placeholder="SIRH"
                     value={report.data.sirh}
                     onChange={(e) => onUpdateReport(report.id, 'sirh', e.target.value)}
                     className="w-full text-xs text-slate-400 bg-transparent border-transparent focus:border-blue-500 focus:ring-0 rounded px-2 py-0 mt-1 hover:bg-white border hover:border-slate-200"
                  />
                  <input 
                    type="text" 
                    value={report.data.tecnicos}
                    onChange={(e) => onUpdateReport(report.id, 'tecnicos', e.target.value)}
                    className="w-full text-xs text-slate-500 bg-transparent border-transparent focus:border-blue-500 focus:ring-0 rounded px-2 py-0 mt-1 hover:bg-white border hover:border-slate-200"
                    placeholder="Técnicos"
                  />
                </td>

                {/* Fecha */}
                <td className="p-2 align-top">
                   <input 
                    type="text" 
                    value={report.data.fecha}
                    onChange={(e) => onUpdateReport(report.id, 'fecha', e.target.value)}
                    className="w-full bg-transparent border-transparent focus:border-blue-500 focus:ring-0 rounded px-2 py-1 hover:bg-white border hover:border-slate-200"
                  />
                  <input 
                    type="text" 
                    value={report.data.folio}
                    onChange={(e) => onUpdateReport(report.id, 'folio', e.target.value)}
                    className="w-full bg-transparent border-transparent focus:border-blue-500 focus:ring-0 rounded px-2 py-1 mt-1 hover:bg-white border hover:border-slate-200 font-mono text-xs"
                    placeholder="Folio"
                  />
                </td>

                {/* Tipo Mant. */}
                <td className="p-2 align-top">
                  <input 
                    type="text"
                    value={report.data.tipoMantenimiento}
                    onChange={(e) => onUpdateReport(report.id, 'tipoMantenimiento', e.target.value)}
                    className="w-full bg-transparent border-transparent focus:border-blue-500 focus:ring-0 rounded px-2 py-1 hover:bg-white border hover:border-slate-200 text-xs"
                    placeholder="Tipo..."
                  />
                </td>

                {/* Falla Reportada */}
                <td className="p-2 align-top">
                   <textarea 
                    value={report.data.fallaReportada}
                    onChange={(e) => onUpdateReport(report.id, 'fallaReportada', e.target.value)}
                    rows={3}
                    className="w-full bg-transparent border-transparent focus:border-blue-500 focus:ring-0 rounded px-2 py-1 hover:bg-white border hover:border-slate-200 resize-none text-xs leading-tight"
                    placeholder="Falla..."
                  />
                </td>

                {/* Condiciones */}
                <td className="p-2 align-top">
                   <textarea 
                    value={report.data.condicionesEncontradas}
                    onChange={(e) => onUpdateReport(report.id, 'condicionesEncontradas', e.target.value)}
                    rows={3}
                    className="w-full bg-transparent border-transparent focus:border-blue-500 focus:ring-0 rounded px-2 py-1 hover:bg-white border hover:border-slate-200 resize-none text-xs leading-tight"
                    placeholder="Condiciones..."
                  />
                </td>

                {/* Trabajo Realizado */}
                <td className="p-2 align-top">
                   <textarea 
                    value={report.data.trabajoRealizado}
                    onChange={(e) => onUpdateReport(report.id, 'trabajoRealizado', e.target.value)}
                    rows={4}
                    className="w-full bg-transparent border-transparent focus:border-blue-500 focus:ring-0 rounded px-2 py-1 hover:bg-white border hover:border-slate-200 resize-none text-xs leading-tight"
                  />
                </td>

                {/* Materiales & Equipos */}
                <td className="p-2 align-top">
                   <textarea 
                    value={report.data.materiales}
                    onChange={(e) => onUpdateReport(report.id, 'materiales', e.target.value)}
                    rows={2}
                    className="w-full bg-transparent border-transparent focus:border-blue-500 focus:ring-0 rounded px-2 py-1 hover:bg-white border hover:border-slate-200 resize-none text-xs mb-1"
                    placeholder="Materiales"
                  />
                  <input 
                    type="text"
                    value={report.data.equipoInstalado}
                    onChange={(e) => onUpdateReport(report.id, 'equipoInstalado', e.target.value)}
                    className="w-full text-xs text-green-600 bg-transparent border-transparent focus:border-blue-500 focus:ring-0 rounded px-2 py-0 hover:bg-white border hover:border-slate-200 placeholder-green-600/50"
                    placeholder="Eq. Instalado"
                  />
                  <input 
                    type="text"
                    value={report.data.equipoRetirado}
                    onChange={(e) => onUpdateReport(report.id, 'equipoRetirado', e.target.value)}
                    className="w-full text-xs text-red-600 bg-transparent border-transparent focus:border-blue-500 focus:ring-0 rounded px-2 py-0 mt-1 hover:bg-white border hover:border-slate-200 placeholder-red-600/50"
                    placeholder="Eq. Retirado"
                  />
                </td>

                 {/* Observaciones */}
                 <td className="p-2 align-top">
                   <textarea 
                    value={report.data.observaciones}
                    onChange={(e) => onUpdateReport(report.id, 'observaciones', e.target.value)}
                    rows={3}
                    className="w-full bg-transparent border-transparent focus:border-blue-500 focus:ring-0 rounded px-2 py-1 hover:bg-white border hover:border-slate-200 resize-none text-xs leading-tight"
                    placeholder="Obs..."
                  />
                </td>

                {/* Horas */}
                <td className="p-2 align-top">
                   <input 
                    type="text" 
                    value={report.data.horaEntrada}
                    onChange={(e) => onUpdateReport(report.id, 'horaEntrada', e.target.value)}
                    className="w-full bg-transparent border-transparent focus:border-blue-500 focus:ring-0 rounded px-2 py-1 hover:bg-white border hover:border-slate-200 text-center text-xs"
                    placeholder="Entrada"
                  />
                  <input 
                    type="text" 
                    value={report.data.horaSalida}
                    onChange={(e) => onUpdateReport(report.id, 'horaSalida', e.target.value)}
                    className="w-full bg-transparent border-transparent focus:border-blue-500 focus:ring-0 rounded px-2 py-1 mt-1 hover:bg-white border hover:border-slate-200 text-center text-xs"
                    placeholder="Salida"
                  />
                </td>

                <td className="px-4 py-3 text-right align-top">
                  <div className="flex flex-col items-end gap-2">
                    <button 
                      onClick={() => onViewImage(report)}
                      className="text-slate-400 hover:text-comexa-accent p-1 rounded-md hover:bg-blue-50 transition-colors"
                      title="Ver Original"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => onDeleteReport(report.id)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
