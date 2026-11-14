import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './i18n';
import './styles/rtl.css';
import { SocketProvider } from './Context/SocketContext';
import { CurrencyProvider } from './Context/CurrencyContext';


// Capture PWA beforeinstallprompt globally
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPwaPrompt = e;
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <SocketProvider>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </SocketProvider>
  </BrowserRouter>
);
