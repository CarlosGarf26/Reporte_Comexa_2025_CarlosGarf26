
import React from 'react';
import { ProcessedReport } from '../types';

interface ExportActionsProps {
  reports: ProcessedReport[];
}

export const ExportActions: React.FC<ExportActionsProps> = ({ reports }) => {
  const hasData = reports.length > 0;

  const downloadCSV = () => {
    if (!hasData) return;
    
    // Headers updated with ALL fields matching the MR-14 form structure
    const headers = [
      "Folio Reporte (Rojo)", 
      "Folio Comexa", 
      "Folio Cliente",
      "Inmueble", 
      "SIRH",
      "Atención (Cliente/Banco)", 
      "Fecha", 
      "Reportó", 
      "Técnicos", 
      "Tipo Mantenimiento",
      "Falla Reportada", 
      "Condiciones Encontradas", 
      "Trabajo Realizado", 
      "Materiales", 
      "Equipo Instalado", 
      "Equipo Retirado",
      "Clasificación",
      "Estado Final",
      "Verificación Operación",
      "Observaciones",
      "Recepción",
      "Evaluación",
      "Hora Entrada", 
      "Hora Salida", 
      "Confianza"
    ];

    // Helper to safely escape CSV fields (handle quotes and newlines)
    const escape = (text: string | undefined) => {
      if (!text) return '""';
      return `"${text.replace(/"/g, '""')}"`;
    };

    // Map data to csv rows including all new fields
    const rows = reports.map(r => [
      escape(r.data.folioReporte),
      escape(r.data.folio),
      escape(r.data.folioCliente),
      escape(r.data.inmueble),
      escape(r.data.sirh),
      escape(r.data.atencion),
      escape(r.data.fecha),
      escape(r.data.reporto),
      escape(r.data.tecnicos),
      escape(r.data.tipoMantenimiento),
      escape(r.data.fallaReportada),
      escape(r.data.condicionesEncontradas),
      escape(r.data.trabajoRealizado),
      escape(r.data.materiales),
      escape(r.data.equipoInstalado),
      escape(r.data.equipoRetirado),
      escape(r.data.clasificacion),
      escape(r.data.estatusFinal),
      escape(r.data.verificacionOperacion),
      escape(r.data.observaciones),
      escape(r.data.recepcion),
      escape(r.data.evaluacion),
      escape(r.data.horaEntrada),
      escape(r.data.horaSalida),
      r.confidenceScore
    ]);

    // Add BOM (\uFEFF) so Excel recognizes UTF-8 encoding correctly (fixes accents/ñ)
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reportes_comexa_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!hasData) return;
    
    // Format for pasting into Spreadsheet (Tab separated)
    // Updated order to match CSV roughly
    const rows = reports.map(r => [
      r.data.folioReporte,
      r.data.folio,
      r.data.inmueble,
      r.data.atencion,
      r.data.fecha,
      r.data.tecnicos,
      r.data.fallaReportada.replace(/\n/g, ' '),
      r.data.trabajoRealizado.replace(/\n/g, ' '),
      r.data.equipoInstalado,
      r.data.equipoRetirado,
      r.data.observaciones.replace(/\n/g, ' ')
    ].join("\t")).join("\n");

    navigator.clipboard.writeText(rows).then(() => {
      alert("¡Datos principales copiados al portapapeles!");
    });
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={copyToClipboard}
        disabled={!hasData}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5" />
        </svg>
        Copiar Resumen
      </button>

      <button
        onClick={downloadCSV}
        disabled={!hasData}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Descargar Excel (CSV)
      </button>
    </div>
  );
};