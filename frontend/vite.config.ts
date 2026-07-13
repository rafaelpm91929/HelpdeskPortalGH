import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const keyPath = path.resolve(__dirname, '../backend/ssl/key.pem');
const certPath = path.resolve(__dirname, '../backend/ssl/cert.pem');
const hasCert = fs.existsSync(keyPath) && fs.existsSync(certPath);

const httpsOptions = hasCert ? {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
} : undefined;

const PUBLIC_IP = process.env.VITE_PUBLIC_IP || '192.168.26.97';
const BACKEND_URL = process.env.VITE_BACKEND_URL || `http://${PUBLIC_IP}:4000`;

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 5173,
        https: httpsOptions,
        hmr: {
            host: PUBLIC_IP,
            protocol: hasCert ? 'wss' : 'ws',
        },
        origin: process.env.VITE_FRONTEND_URL || `${hasCert ? 'https' : 'http'}://${PUBLIC_IP}:5173`,
        proxy: {
            '/api': {
                target: process.env.VITE_API_URL || `${hasCert ? 'https' : 'http'}://${PUBLIC_IP}:4000/api`,
                changeOrigin: true,
                secure: false, // Permitir SSL autofirmado
            },
            '/uploads': {
                target: process.env.VITE_IMAGE_BASE_URL || `${hasCert ? 'https' : 'http'}://${PUBLIC_IP}:4000`,
                changeOrigin: true,
                secure: false, // Permitir SSL autofirmado
            }
        },
        cors: true,
        headers: {
            'Access-Control-Allow-Origin': '*',
        }
    },
});