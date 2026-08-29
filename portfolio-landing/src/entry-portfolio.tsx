import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Portfolio from './Portfolio';
import './index.css';
import './fonts-inter.css';
import './portfolio.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Portfolio />
  </StrictMode>,
);
