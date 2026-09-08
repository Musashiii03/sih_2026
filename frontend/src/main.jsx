import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './index.css';

// Global error handler
window.addEventListener('error', (event) => {
  console.error('[GLOBAL ERROR]', event.error);
  console.error('[GLOBAL ERROR STACK]', event.error?.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[UNHANDLED REJECTION]', event.reason);
});

const root = document.getElementById('root');
if (!root) {
  document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: monospace;">ERROR: Root element not found</div>';
} else {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>,
  );
}

