import React from 'react';
import ReactDOM from 'react-dom/client';

// Suppress Vite/HMR WebSocket connection closed/failed errors & unhandled rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (
      event.reason.message === 'WebSocket closed without opened.' ||
      (typeof event.reason.message === 'string' && event.reason.message.includes('WebSocket')) ||
      (typeof event.reason === 'string' && event.reason.includes('WebSocket')) ||
      (event.reason.stack && event.reason.stack.includes('vite'))
    )) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
  window.addEventListener('error', (event) => {
    if (event.message && (
      event.message.includes('WebSocket') ||
      event.message.includes('vite')
    )) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

import App from './App';
import { SERVICES, PORTFOLIO_ITEMS } from './constants';
import { HelmetProvider } from 'react-helmet-async';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// --- Asset Preloading Logic (Non-blocking) ---
const preloadImages = () => {
  const imageUrls = [
    'https://raw.githubusercontent.com/ranthulaAm/App/main/img/logo.png', // Logo
    ...SERVICES.map(s => s.image),
    ...PORTFOLIO_ITEMS.map(p => p.img)
  ];

  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
    // We do not await this, just start the browser download
  });
};

// Start preloading in background
preloadImages();

// Render immediately to prevent white/black screen
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);