import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ReportData } from "../types";

// Inicializar el cliente.
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

**DICCIONARIO TÉCNICO**:
Hardware: culcas, expansoras, conexiones, prowatch, transfer, esclusa, sensor, cámaras, cableado, panel, batería, tren, cajas, resistencia, RCC, CIISS, MC, BA, IR, respaldo.
Verbos: falla, comunicación, operación, remplazo, restableciendo, revisa, instala, acude, encuentra, validar, procede, ayuda, pruebas.

Si un campo está vacío o ilegible, déjalo como cadena vacía.
Evalúa la legibilidad del 1 al 10 en 'confidenceScore'.
`;

const reportSchema = {
  type: Type.OBJECT,
  properties: {
    inmueble: { type: Type.STRING, description: "Nombre del inmueble" },
    sirh: { type: Type.STRING, description: "Sede / Zona / SIRH" },
    atencion: { type: Type.STRING, description: "Nombre del cliente en campo ATENCIÓN" },
    fecha: { type: Type.STRING, description: "Fecha del reporte" },
    tecnicos: { type: Type.STRING, description: "Nombres de los técnicos" },
    reporto: { type: Type.STRING, description: "Nombre de quien reportó" },
    folio: { type: Type.STRING, description: "Folio de Comexa / Task / RFQ" },
    folioCliente: { type: Type.STRING, description: "Folio de Cliente" },
    folioReporte: { type: Type.STRING, description: "Folio numérico en color rojo" },
    tipoMantenimiento: { type: Type.STRING, description: "Texto de casillas marcadas en Mantenimiento" },
    fallaReportada: { type: Type.STRING, description: "Transcripción literal de Falla Reportada" },
    condicionesEncontradas: { type: Type.STRING, description: "Transcripción literal de Condiciones" },
    trabajoRealizado: { type: Type.STRING, description: "Transcripción literal completa de Trabajo Realizado" },
    materiales: { type: Type.STRING, description: "Material o Refacciones" },
    equipoInstalado: { type: Type.STRING, description: "Lista de equipos instalados con serie" },
    equipoRetirado: { type: Type.STRING, description: "Lista de equipos retirados con serie" },
    clasificacion: { type: Type.STRING, description: "Casillas marcadas en Clasificación" },
    estatusFinal: { type: Type.STRING, description: "Casillas marcadas en Estado Final" },
    verificacionOperacion: { type: Type.STRING, description: "Casillas marcadas en Operación" },
    recepcion: { type: Type.STRING, description: "Nombre en campo Recepción" },
    observaciones: { type: Type.STRING, description: "Observaciones y/o Comentarios" },
    evaluacion: { type: Type.STRING, description: "Datos de evaluación" },
    horaEntrada: { type: Type.STRING, description: "Hora de entrada" },
    horaSalida: { type: Type.STRING, description: "Hora de salida" },
    confidenceScore: { type: Type.INTEGER, description: "Puntaje de legibilidad 1-10" }
  },
  required: ["inmueble", "fecha", "trabajoRealizado", "confidenceScore"]
};

// Función auxiliar para esperar
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para detectar errores de tiempo/cuota/red
const isTransientError = (error: any) => {
  const status = error.status || error.response?.status || error.statusCode;
  const msg = (error.message || '').toLowerCase();
  
  return (
    status === 429 || 
    status === 503 || 
    status === 504 ||
    msg.includes('429') || 
    msg.includes('quota') || 
    msg.includes('exhausted') || 
    msg.includes('too many') || 
    msg.includes('time') ||     // Catch "Timed out" or "Time limit"
    msg.includes('overloaded') || // Catch "Model is overloaded"
    msg.includes('fetch failed')
  );
};

// Helper para extraer JSON sucio
const extractJSON = (text: string): string => {
  let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return clean.substring(firstBrace, lastBrace + 1);
  }
  return clean;
};

// --- NUEVA FUNCIÓN DE DIAGNÓSTICO ---
export async function validateApiKey(): Promise<{ status: 'ok' | 'blocked' | 'quota' | 'error', message: string }> {
  if (!process.env.API_KEY || process.env.API_KEY.length < 10) {
    return { status: 'blocked', message: 'No se detectó ninguna API Key configurada.' };
  }

  try {
    // Hacemos una petición mínima para probar la llave (1 token)
    await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: 'ping' }] },
    });
    return { status: 'ok', message: 'Conectado correctamente.' };
  } catch (error: any) {
    const msg = (error.message || '').toLowerCase();
    const status = error.status || error.response?.status;

    // Detección específica de API deshabilitada
    if (msg.includes('disabled') || msg.includes('enable') || msg.includes('not been used')) {
      return { status: 'blocked', message: 'La API "Google Generative AI" no está habilitada en tu Google Cloud Console.' };
    }

    if (msg.includes('key') || status === 400 || status === 403) {
      return { status: 'blocked', message: 'La API Key es inválida, ha sido revocada o el proyecto de Google Cloud está cerrado.' };
    }
    if (msg.includes('quota') || msg.includes('429') || status === 429) {
      return { status: 'quota', message: 'Se ha agotado la cuota gratuita de la API.' };
    }
    if (msg.includes('fetch') || msg.includes('network')) {
      return { status: 'error', message: 'Error de conexión a internet. No se pudo validar la llave.' };
    }
    
    return { status: 'error', message: `Error desconocido al validar llave: ${msg}` };
  }
}

export async function processReportImage(base64Data: string, mimeType: string, requestedModel: string = 'gemini-2.5-flash'): Promise<{ data: ReportData, score: number }> {
  // 1. Validación estricta de API Key
  if (!process.env.API_KEY || process.env.API_KEY.includes("API_KEY") || process.env.API_KEY.length < 5) {
    throw new Error("⚠️ Falta API Key. Configúrala en tu entorno.");
  }

  const cleanBase64 = base64Data.split(',')[1] || base64Data;
  
  // ESTRATEGIA DE FALLBACK AGRESIVA:
  // Si falla el primer intento, cambiamos INMEDIATAMENTE a Flash (el más rápido y estable).
  // Solo intentamos Pro una vez si se solicitó explícitamente.
  let modelsToTry = [requestedModel];
  
  if (requestedModel !== 'gemini-2.5-flash') {
    modelsToTry.push('gemini-2.5-flash'); // Primer fallback
    modelsToTry.push('gemini-2.5-flash'); // Segundo fallback (reintento)
  } else {
    modelsToTry.push('gemini-2.5-flash'); // Reintento simple
  }

  let lastError: any;

  for (let i = 0; i < modelsToTry.length; i++) {
    const modelName = modelsToTry[i];
    try {
      console.log(`Intento ${i + 1}/${modelsToTry.length} usando ${modelName}...`);
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            { inlineData: { mimeType: mimeType, data: cleanBase64 } },
            { text: "Analiza la imagen adjunta. Extrae los datos del formulario MR-14 y devuélvelos EXCLUSIVAMENTE en formato JSON." }
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
      if (!resultText) throw new Error("Respuesta vacía del servidor.");

      const jsonStr = extractJSON(resultText);
      let parsed: any;
      
      try {
        parsed = JSON.parse(jsonStr);
      } catch (e) {
        console.warn(`JSON corrupto con ${modelName}:`, jsonStr);
        throw new Error("Error de formato JSON en la respuesta.");
      }

      return {
        data: parsed as ReportData,
        score: parsed.confidenceScore || 5
      };

    } catch (error: any) {
      console.warn(`Fallo con modelo ${modelName}:`, error);
      lastError = error;

      // Si es un error transitorio (tiempo, red, cuota), esperamos antes de reintentar
      if (isTransientError(error)) {
        console.log("Detectado error de tiempo/red/cuota. Esperando 10 segundos para enfriar...");
        // Espera larga para dar tiempo a que se recupere la cuota o el servidor
        await delay(10000); 
      } else {
        // Si es otro error (ej. imagen inválida), esperamos menos
        await delay(2000);
      }
      
      // Continuamos al siguiente modelo en la lista...
    }
  }

  // Diagnóstico final detallado para el usuario
  const msg = (lastError.message || '').toLowerCase();
  const status = lastError.status || lastError.response?.status || lastError.statusCode;
  
  let title = "Error de Procesamiento";
  let description = "Ocurrió un error desconocido. Verifica tu imagen y conexión.";

  // Clasificación de errores más específica
  if (msg.includes("time") || msg.includes("timeout") || status === 504) {
    title = "⏳ TIEMPO DE ESPERA AGOTADO (TIMEOUT)";
    if (msg.includes("gateway")) description = "El servidor tardó demasiado en responder (504 Gateway Timeout).";
    else if (msg.includes("fetch")) description = "Tu conexión a internet se interrumpió o es muy lenta.";
    else description = "Google AI tardó demasiado procesando la imagen.";
  } 
  else if (msg.includes("quota") || msg.includes("429") || msg.includes("exhausted") || status === 429) {
    title = "🛑 LÍMITE DE CUOTA EXCEDIDO (429)";
    description = "Se ha alcanzado el límite de uso gratuito de la API de Google.";
  } 
  else if (msg.includes("overloaded") || status === 503) {
    title = "🔥 SERVIDOR SOBRECARGADO (503)";
    description = "El modelo de IA tiene demasiada demanda en este momento. Inténtalo de nuevo en unos minutos.";
  } 
  else if (msg.includes("disabled") || msg.includes("enable")) {
    title = "⛔ API DESHABILITADA";
    description = "Debes ir a Google Cloud Console y habilitar la 'Google Generative AI API' para tu proyecto.";
  }
  else if (msg.includes("api key") || status === 403) {
    title = "🔑 API KEY INVÁLIDA (403)";
    description = "La llave de acceso (API Key) es incorrecta, no tiene permisos o el proyecto de facturación no está vinculado.";
  } 
  else if (msg.includes("fetch") || msg.includes("network")) {
    title = "🌐 ERROR DE CONEXIÓN";
    description = "No se pudo establecer conexión con los servidores de Google. Verifica tu Wifi o Datos.";
  } 
  else if (msg.includes("json") || msg.includes("parse")) {
    title = "🧩 ERROR DE LECTURA (JSON)";
    description = "La IA no pudo estructurar los datos correctamente. Probablemente la imagen no es clara o no es un reporte válido.";
  }

  // Lanzar error con formato amigable + detalle técnico
  const technicalDetail = status ? `[Código: ${status}]` : `[${msg.slice(0, 50)}...]`;
  throw new Error(`${title}: ${description} ${technicalDetail}`);
}