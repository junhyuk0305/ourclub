import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

// Sentry는 엔트리 번들에서 제외하고 첫 페인트 이후 비동기 로드(PROD 전용).
if (import.meta.env.PROD) {
  import('./lib/sentry').then((m) => m.initSentry()).catch(() => {});
}
