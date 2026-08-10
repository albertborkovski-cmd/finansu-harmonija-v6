import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx?version=schedule-save-v2';
import './index.css?v=4-footer';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
