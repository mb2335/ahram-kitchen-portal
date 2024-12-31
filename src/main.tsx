import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      // Check for updates every 5 minutes
      setInterval(() => {
        registration.update();
      }, 300000);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);