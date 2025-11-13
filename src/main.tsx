import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { Provider } from 'react-redux'
import { store } from './store/index.ts'
import './index.css'

chrome.devtools.panels.create(
  "Hydration Error Detector",
  "icon-48.png",
  "index.html",
  (panel) => {
    console.log("✅ DevTools panel created:", panel);
  }
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
