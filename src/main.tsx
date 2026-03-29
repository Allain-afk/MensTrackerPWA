import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/index.css';
import './app/styles/animations.css';

const CHUNK_RELOAD_KEY = 'mens-tracker:chunk-reload-at';

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();

  const lastReloadAt = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0);
  if (Date.now() - lastReloadAt < 10_000) {
    console.error('Route chunk failed to load after an automatic reload attempt.', event);
    return;
  }

  window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(<App />);
