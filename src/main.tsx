/**
 * HairMatch — App Entry Point
 *
 * Initializes i18n and renders the React app.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { initI18n } from './i18n';
import './index.css';

async function bootstrap() {
  // Initialize i18n before rendering
  await initI18n();

  const root = document.getElementById('root');
  if (!root) {
    throw new Error('Root element not found');
  }

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap().catch(console.error);
