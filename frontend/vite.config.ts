import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

dotenv.config();

const PUBLIC_IP = process.env.VITE_PUBLIC_IP || '192.168.26.97';
const BACKEND_URL = process.env.VITE_BACKEND_URL || `http://${PUBLIC_IP}:4000`;

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 5173,
        origin: process.env.VITE_FRONTEND_URL || `http://${PUBLIC_IP}:5173`,
        proxy: {
            '/api': {
                target: process.env.VITE_API_URL || `http://${PUBLIC_IP}:4000/api`,
                changeOrigin: true,
            },
            '/uploads': {
                target: process.env.VITE_IMAGE_BASE_URL || `http://${PUBLIC_IP}:4000`,
                changeOrigin: true,
            }
        },
        cors: true,
        headers: {
            'Access-Control-Allow-Origin': '*',
        }
    },
});