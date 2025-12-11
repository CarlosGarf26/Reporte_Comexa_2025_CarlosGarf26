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
    confidenceScore: { type: Type.NUMBER, description: "Puntaje de legibilidad 1-10" }
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
    msg.includes('time') ||     
    msg.includes('overloaded') || 
    msg.includes('fetch failed')
  );
};

// Helper para extraer JSON sucio
const extractJSON = (text: string): string => {
  // Eliminar bloques de código markdown si existen
  let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  // Buscar el primer '{' y el último '}' para asegurar que es un objeto válido
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return clean.substring(firstBrace, lastBrace + 1);
  }
  return clean;
};

// --- FUNCIÓN DE DIAGNÓSTICO ---
export async function validateApiKey(): Promise<{ status: 'ok' | 'blocked' | 'quota' | 'error', message: string }> {
  if (!process.env.API_KEY || process.env.API_KEY.length < 10) {
    return { status: 'blocked', message: 'No se detectó ninguna API Key configurada.' };
  }

  try {
    await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: 'ping' }] },
    });
    return { status: 'ok', message: 'Conectado correctamente.' };
  } catch (error: any) {
    const msg = (error.message || '').toLowerCase();
    const status = error.status || error.response?.status;

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
  if (!process.env.API_KEY || process.env.API_KEY.includes("API_KEY") || process.env.API_KEY.length < 5) {
    throw new Error("⚠️ Falta API Key. Configúrala en tu entorno.");
  }

  const cleanBase64 = base64Data.split(',')[1] || base64Data;
  
  let modelsToTry = [requestedModel];
  if (requestedModel !== 'gemini-2.5-flash') {
    modelsToTry.push('gemini-2.5-flash'); 
    modelsToTry.push('gemini-2.5-flash');
  } else {
    modelsToTry.push('gemini-2.5-flash');
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

      // Validación de Seguridad Estricta
      const candidate = response.candidates?.[0];
      if (candidate?.finishReason !== "STOP" && candidate?.finishReason !== undefined) {
         // Si se detuvo por SAFETY u otra razón, lanzamos error específico
         if (candidate?.finishReason === "SAFETY") {
             throw new Error("El modelo bloqueó la imagen por filtros de seguridad (Safety Filter).");
         }
         if (candidate?.finishReason === "RECITATION") {
             throw new Error("El modelo detectó contenido con copyright (Recitation).");
         }
      }

      const resultText = response.text;
      if (!resultText) throw new Error("Respuesta vacía del servidor (Posible bloqueo de seguridad o error de red).");

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

      if (isTransientError(error)) {
        const waitTime = i === 0 ? 5000 : 10000;
        console.log(`Detectado error temporal (429/503). Esperando ${waitTime/1000}s...`);
        await delay(waitTime); 
      } else {
        await delay(2000);
      }
    }
  }

  const msg = (lastError.message || '').toLowerCase();
  const status = lastError.status || lastError.response?.status || lastError.statusCode;
  
  let title = "Error de Procesamiento";
  let description = "Ocurrió un error desconocido. Verifica tu imagen.";

  if (msg.includes("time") || msg.includes("timeout") || status === 504) {
    title = "⏳ TIEMPO AGOTADO";
    description = "El servidor tardó demasiado. Intenta con una imagen más pequeña.";
  } 
  else if (msg.includes("quota") || msg.includes("429") || status === 429) {
    title = "🛑 CUOTA EXCEDIDA (429)";
    description = "Límite de peticiones alcanzado.";
  } 
  else if (msg.includes("safety") || msg.includes("blocked")) {
    title = "🛡️ BLOQUEO DE SEGURIDAD";
    description = "Google AI clasificó la imagen como insegura.";
  }
  else if (msg.includes("json")) {
    title = "🧩 ERROR DE LECTURA";
    description = "La IA no pudo estructurar los datos. Imagen ilegible.";
  }

  const technicalDetail = status ? `[Código: ${status}]` : `[${msg.slice(0, 50)}...]`;
  throw new Error(`${title}: ${description} ${technicalDetail}`);
}