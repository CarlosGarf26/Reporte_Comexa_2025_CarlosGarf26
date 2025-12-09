import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga variables de .env localmente
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // En Vercel, a veces la variable está en process.env directamente durante el build,
  // no solo en el objeto devuelto por loadEnv.
  const apiKey = env.API_KEY || process.env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Inyectamos la variable en el código del cliente
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  };
});