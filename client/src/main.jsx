import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import App from './App';
import { CartProvider } from './context/CartContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <App />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#16171c',
              color: '#fff',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              padding: '0.75rem 1rem',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>
);
