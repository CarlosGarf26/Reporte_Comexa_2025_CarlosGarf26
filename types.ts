
export interface ProcessedReport {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  confidenceScore: number; // 1-10
  data: ReportData;
  originalImage?: string; // Base64
  errorMsg?: string;
}

export interface ReportData {
  inmueble: string;
  sirh: string;
  atencion?: string; // New field for Client/Bank Name (e.g. Banamex)
  fecha: string;
  tecnicos: string;
  folio: string; // Folio de Comexa / Task
  folioReporte?: string; // Folio Rojo en esquina
  folioCliente?: string;
  reporto?: string; // Persona que reportó
  tipoMantenimiento: string; // Preventivo, Correctivo, Proyecto, etc.
  fallaReportada: string;
  condicionesEncontradas: string;
  trabajoRealizado: string;
  materiales: string;
  equipoInstalado: string;
  equipoRetirado: string;
  observaciones: string;
  horaEntrada: string;
  horaSalida: string;
  estatusFinal: string;
  recepcion?: string;
  clasificacion?: string;
  evaluacion?: string;
  verificacionOperacion?: string; // Checks de operación del sistema
}

export const INITIAL_REPORT_DATA: ReportData = {
  inmueble: '',
  sirh: '',
  atencion: '',
  fecha: '',
  tecnicos: '',
  folio: '',
  folioReporte: '',
  folioCliente: '',
  reporto: '',
  tipoMantenimiento: '',
  fallaReportada: '',
  condicionesEncontradas: '',
  trabajoRealizado: '',
  materiales: '',
  equipoInstalado: '',
  equipoRetirado: '',
  observaciones: '',
  horaEntrada: '',
  horaSalida: '',
  estatusFinal: '',
  recepcion: '',
  clasificacion: '',
  evaluacion: '',
  verificacionOperacion: ''
};

// Logo SVG en formato Data URI para prevenir errores 404 si falta el archivo
export const DEFAULT_LOGO = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%231e3a8a%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2270%22%20font-family%3D%22sans-serif%22%20font-size%3D%2260%22%20font-weight%3D%22bold%22%20fill%3D%22white%22%20text-anchor%3D%22middle%22%3EC%3C%2Ftext%3E%3C%2Fsvg%3E";
