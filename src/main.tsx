import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Error boundary simple
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Root element no encontrado');
  throw new Error('Root element not found');
}

try {
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error('❌ Error rendering app:', error);
  rootElement.innerHTML = `
    <div style="color: #ef4444; padding: 20px; text-align: center; font-family: sans-serif; background: #0a0e1a; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
      <div>
        <h1 style="color: #eab308;">Error al cargar la aplicación</h1>
        <p style="color: #f3f4f6;">${error instanceof Error ? error.message : 'Unknown error'}</p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">Intenta limpiar el caché del navegador o usa otro navegador.</p>
        <pre style="font-size: 10px; color: #6b7280; text-align: left; overflow: auto; max-width: 90vw; margin: 20px auto;">${error instanceof Error ? error.stack : ''}</pre>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #eab308; color: black; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
          Recargar Página
        </button>
      </div>
    </div>
  `;
}
