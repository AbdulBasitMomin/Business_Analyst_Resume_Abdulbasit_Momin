import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Me from './Me';
import './index.css';
import './me.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Me />
  </StrictMode>,
);
