import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // 무거운 vendor를 안정적인 별도 청크로 분리(브라우저 캐싱·병렬 로딩 개선).
          // lazy 라우트에서만 쓰는 vendor(recharts/xlsx)는 해당 청크가 lazy로만 참조되어
          // 초기 로드에 포함되지 않는다. Sentry는 동적 import(src/lib/sentry.ts)라 자동 분리됨.
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('@sentry')) return 'sentry';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory-vendor')) return 'charts';
            if (id.includes('/xlsx/')) return 'xlsx';
            if (id.includes('react-router') || id.includes('/@remix-run/')) return 'router';
            if (id.includes('/react-dom/') || id.includes('/scheduler/') || /\/react\/[^n]/.test(id)) return 'react';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
