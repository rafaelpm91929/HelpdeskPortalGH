 
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
//import './index.css';

// 🔥 Desactivar console.log en el dominio público (seguridad y limpieza en F12)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
if (!isLocal || import.meta.env.PROD) {
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
    console.warn = () => {};
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);