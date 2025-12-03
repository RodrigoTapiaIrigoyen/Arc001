import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Error boundary simple
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

try {
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error('Error rendering app:', error);
  rootElement.innerHTML = `
    <div style="color: #ef4444; padding: 20px; text-align: center; font-family: sans-serif;">
      <h1>Error loading application</h1>
      <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
      <p style="font-size: 12px; color: #666; margin-top: 10px;">Try clearing your browser cache or using a different browser.</p>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #eab308; color: black; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
        Reload Page
      </button>
    </div>
  `;
}
