import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/andika/400.css';
import '@fontsource/andika/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/playwrite-fr-trad/400.css';
import './styles/tokens.css';
import './styles/global.css';
import './styles/jeu.css';
import './styles/maitresse.css';
import { App } from './App';

createRoot(document.getElementById('racine') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
