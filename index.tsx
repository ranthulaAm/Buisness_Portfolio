import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Suppress Vite/HMR WebSocket connection closed/failed errors & unhandled rejections
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const msg = args[0] || '';
    if (
      typeof msg === 'string' &&
      (msg.includes('width(-1)') || msg.includes('height(-1)') || msg.includes('should be greater than 0'))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };

  const isWebSocketError = (err: any) => {
    if (!err) return false;
    const msg = typeof err === 'string' ? err : (err.message || '');
    const stack = err.stack || '';
    return (
      msg.toLowerCase().includes('websocket') ||
      msg.toLowerCase().includes('closed without opened') ||
      stack.toLowerCase().includes('vite')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isWebSocketError(event.reason)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener('error', (event) => {
    if (isWebSocketError(event.error) || isWebSocketError(event.message)) {
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