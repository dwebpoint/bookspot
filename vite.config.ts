import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        babel({
            presets: [reactCompilerPreset()],
            include: /\.[jt]sx$/,
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    oxc: {
        jsx: { runtime: 'automatic' },
    },
    server: {
        host: "0.0.0.0",
        port: 5173,
        strictPort: false,
        origin: process.env.DDEV_PRIMARY_URL_WITHOUT_PORT
            ? `${process.env.DDEV_PRIMARY_URL_WITHOUT_PORT}:5173`
            : undefined,
        cors: {
            origin: /https?:\/\/([A-Za-z0-9\-\\.]+)?(\.ddev\.site)(?::\d+)?$/,
        },
    },
});
