import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.png',
          'apple-touch-icon.png',
          'assets/aistudio/*.png'
        ],
        manifest: {
          id: '/',
          name: 'تدبيرة — كل جنيه ليه قيمة',
          short_name: 'تدبيرة',
          description: 'تدبيرة — تطبيق أندرويد مصري أصيل لتدبير ميزانية البيت والأكل والمصاريف. وفّر بذكاء، ودبّر بيتك، وخلي كل جنيه في مكانه.',
          theme_color: '#0D47A1',
          background_color: '#0D47A1',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          lang: 'ar',
          dir: 'rtl',
          icons: [
            {
              src: '/assets/aistudio/launchericon-48x48_08576b00.png',
              sizes: '48x48',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/assets/aistudio/launchericon-72x72_e4abd8ef.png',
              sizes: '72x72',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/assets/aistudio/launchericon-96x96_4d503cd4.png',
              sizes: '96x96',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/assets/aistudio/launchericon-144x144_b3711091.png',
              sizes: '144x144',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/assets/aistudio/launchericon-192x192_a1111b2e.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/assets/aistudio/launchericon-512x512_fdb81f54.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
