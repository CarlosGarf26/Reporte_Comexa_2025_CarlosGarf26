import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ReportData } from "../types";

// Inicializar el cliente. Usamos directamente process.env.API_KEY como indican las guías
// Nota: process.env.API_KEY es reemplazado por Vite durante el build (ver vite.config.ts)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Eres un experto en digitalización de documentos técnicos "MR-14" de COMEXA. 
Tu tarea es realizar una transcripción COMPLETA, LITERAL y FIDEDIGNA.
Analiza el documento (imagen o PDF) y extrae datos para cada casilla del formato.

INSTRUCCIONES ESPECÍFICAS:
1. **Folio Rojo**: En la esquina superior derecha suele haber un número en color rojo (ej. 67029). Extráelo en 'folioReporte'.
2. **Atención**: Busca el campo "ATENCIÓN" (suele contener el nombre del Banco o Cliente, ej. Banamex, Santander).
3. **Folios**: Distingue entre 'Folio de Cliente' y 'Folio de Comexa' (a veces llamado RFQ, TASK).
4. **Mantenimiento**: Identifica qué casilla (Preventivo, Correctivo, Proyecto, etc.) tiene una 'X' o marca.
5. **Textos Largos**: Transcribe TODO el contenido de 'Falla Reportada', 'Condiciones', 'Trabajo Realizado' y 'Observaciones'. NO RESUMAS.
6. **Tablas**: En 'Equipo Instalado' y 'Retirado', concatena modelo y serie.
7. **Checkboxes Inferiores**:
   - Clasificación (Electrónica, Mecánica, etc.)
   - Estado Final (Reparación Total, Parcial, etc.)
   - Verificación de Operación (Centralizado, Local, Alarmas, etc.)
   - Evaluación (Tiempo, Dominio, Actitud).
8. **Firmas**: Intenta leer el nombre en 'Recepción' y 'Técnicos'.

**DICCIONARIO TÉCNICO Y VOCABULARIO FRECUENTE**:
Utiliza la siguiente lista de palabras clave para interpretar textos manuscritos difusos. Si encuentras un texto ambiguo que se asemeja a una de estas palabras, prioriza estas opciones:

- **Hardware y Dispositivos**: culcas, expansoras, conexiones, dispositivo, prowatch, transfer, esclusa, sensor, cámaras, cableado, panel, batería, tren, cajas, resistencia, RCC, CIISS, MC, BA, IR, respaldo.
- **Acciones y Verbos**: falla, comunicación, operación, remplazo, restableciendo, restablecimiento, revisa, revisión, instala, instalación, acude, encuentra, validar, validando, procede, ayuda, pruebas, función.
- **Materiales y Entorno**: estaño, estañado, asalto, señal, patio, incendio, gerente, soldadura.
- **Específicos**: MR-14, COMEXA, SIRH.

Si un campo está vacío o ilegible, déjalo como cadena vacía.
Evalúa la legibilidad del 1 al 10.
`;

const reportSchema = {
  type: Type.OBJECT,
  properties: {
    inmueble: { type: Type.STRING, description: "Nombre del inmueble" },
    sirh: { type: Type.STRING, description: "Sede / Zona / SIRH" },
    atencion: { type: Type.STRING, description: "Nombre del cliente en campo ATENCIÓN (ej. Banamex)" },
    fecha: { type: Type.STRING, description: "Fecha del reporte" },
    tecnicos: { type: Type.STRING, description: "Nombres de los técnicos" },
    reporto: { type: Type.STRING, description: "Nombre de quien reportó (Campo 'REPORTÓ')" },
    folio: { type: Type.STRING, description: "Folio de Comexa / Task / RFQ" },
    folioCliente: { type: Type.STRING, description: "Folio de Cliente" },
    folioReporte: { type: Type.STRING, description: "Folio numérico en color rojo (esquina superior derecha)" },
    
    tipoMantenimiento: { type: Type.STRING, description: "Texto de casillas marcadas en Mantenimiento (Preventivo, Correctivo, etc.)" },
    
    fallaReportada: { type: Type.STRING, description: "Transcripción literal de Falla Reportada" },
    condicionesEncontradas: { type: Type.STRING, description: "Transcripción literal de Condiciones" },
    trabajoRealizado: { type: Type.STRING, description: "Transcripción literal completa de Trabajo Realizado" },
    materiales: { type: Type.STRING, description: "Material o Refacciones" },
    
    equipoInstalado: { type: Type.STRING, description: "Lista de equipos instalados con serie" },
    equipoRetirado: { type: Type.STRING, description: "Lista de equipos retirados con serie" },
    
    clasificacion: { type: Type.STRING, description: "Casillas marcadas en Clasificación (Electrónica, Mecánica, etc)" },
    estatusFinal: { type: Type.STRING, description: "Casillas marcadas en Estado Final" },
    verificacionOperacion: { type: Type.STRING, description: "Casillas marcadas en 'Se verifica correcta operación' (Alarmas, CCTV, etc)" },
    
    recepcion: { type: Type.STRING, description: "Nombre en campo Recepción" },
    observaciones: { type: Type.STRING, description: "Observaciones y/o Comentarios" },
    evaluacion: { type: Type.STRING, description: "Datos de evaluación (Tiempo, Dominio, Actitud)" },
    
    horaEntrada: { type: Type.STRING, description: "Hora de entrada" },
    horaSalida: { type: Type.STRING, description: "Hora de salida" },
    
    confidenceScore: { type: Type.INTEGER, description: "Puntaje de legibilidad 1-10" }
  },
  required: ["inmueble", "fecha", "trabajoRealizado", "confidenceScore"]
};

// Función auxiliar para esperar
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function processReportImage(base64Data: string, mimeType: string): Promise<{ data: ReportData, score: number }> {
  // 1. Validación estricta de API Key antes de intentar nada
  if (!process.env.API_KEY || process.env.API_KEY.includes("API_KEY")) {
    console.error("API Key Missing or Invalid:", process.env.API_KEY);
    throw new Error("⚠️ API Key no configurada correctamente. Asegúrate de haber agregado la variable 'API_KEY' en el panel de Vercel y REDESPLEGADO el proyecto.");
  }

  const cleanBase64 = base64Data.split(',')[1] || base64Data;
  const MAX_RETRIES = 3;
  let lastError: any;

  console.log("Iniciando petición a Gemini con modelo gemini-2.5-flash...");

  // Bucle de reintentos
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64
              }
            },
            {
              text: "Extrae todos los datos del reporte de servicio técnico MR-14 adjunto. Sé literal."
            }
          ]
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: reportSchema,
          temperature: 0.1,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
        }
      });

      const resultText = response.text;
      if (!resultText) {
        console.warn("Respuesta vacía de Gemini:", response);
        throw new Error("La IA no devolvió texto. Posible bloqueo de seguridad o imagen ilegible.");
      }

      // Limpieza robusta del JSON (eliminar bloques markdown ```json ... ``` si existen)
      const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(cleanJson);
      } catch (e) {
        console.error("Error de formato JSON:", cleanJson);
        throw new Error("La respuesta de la IA no tiene un formato válido. Intenta con una imagen más clara.");
      }

      const score = parsed.confidenceScore || 5;
      const { confidenceScore, ...dataOnly } = parsed;

      return {
        data: dataOnly as ReportData,
        score: score
      };

    } catch (error: any) {
      lastError = error;
      
      // Si el error es 429 (Too Many Requests) o 503 (Server Error), esperamos y reintentamos
      if (error.status === 429 || error.status === 503) {
        console.warn(`Intento ${attempt} fallido (${error.status}). Reintentando en ${attempt * 2}s...`);
        if (attempt < MAX_RETRIES) {
           await delay(attempt * 2000); // Esperar 2s, 4s, 6s...
           continue; // Ir al siguiente intento
        }
      }
      
      // Si es otro error o se acabaron los intentos, rompemos el bucle
      break;
    }
  }

  // Si llegamos aquí, es que fallaron todos los intentos
  console.error("Error processing report with Gemini after retries:", lastError);
    
  // Manejo de errores específicos para dar feedback útil al usuario
  if (lastError.message?.includes("API key") || lastError.status === 403) {
    throw new Error("⚠️ API Key inválida o no autorizada. Verifica tu configuración en Vercel (Environment Variables).");
  }
  if (lastError.status === 404) {
    throw new Error("⚠️ El modelo 'gemini-2.5-flash' no está disponible para tu API Key. Verifica si tienes acceso o cambia a un modelo estable.");
  }
  if (lastError.status === 429) {
    throw new Error("⏳ Cuota excedida. El sistema está muy ocupado, intenta subir menos archivos a la vez.");
  }
  if (lastError.status === 503) {
    throw new Error("📡 Servicio de Google temporalmente no disponible. Intenta más tarde.");
  }
  if (lastError.message?.includes("fetch failed") || lastError.message?.includes("NetworkError")) {
      throw new Error("🌐 Error de red. Verifica tu conexión a internet o firewall corporativo.");
  }

  // Si es un error genérico, pasar el mensaje original
  throw new Error(lastError.message || "Error inesperado al procesar el reporte.");
}