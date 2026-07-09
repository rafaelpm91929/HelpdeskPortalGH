/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PUBLIC_IP: string;
    readonly VITE_API_URL: string;
    readonly VITE_IMAGE_BASE_URL: string;
    readonly VITE_FRONTEND_URL: string;
    readonly VITE_BACKEND_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}