import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './styles/App.css'

console.log('Main.jsx: Starting app render');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found!');
  } else {
    console.log('Root element found, creating React root');
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log('React app rendered successfully');
  }
} catch (error) {
  console.error('Fatal error rendering app:', error);
  document.body.innerHTML = `<div style="padding: 20px; color: red;"><h1>Fatal Error</h1><p>${error.message}</p></div>`;
}

