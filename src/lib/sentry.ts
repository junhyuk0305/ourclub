// Sentry 지연 로딩 래퍼 — 엔트리 번들에서 @sentry/react(특히 replay 통합)를 제외한다.
//
// @sentry/react + browserTracing + replay는 엔트리 청크에서 가장 무거운 조각(gzip 수십 KB)이고
// 첫 페인트에 필요하지 않다. 여기서만 동적 import 하므로 rollup이 별도 'sentry' 청크로 분리하고,
// initSentry()는 main.tsx가 렌더 직후(PROD에서만) 호출해 비동기로 로드·초기화한다.
// captureException()은 SDK 로드 전에 호출되면 조용히 무시한다(렌더 직후 짧은 공백뿐).
type SentryModule = typeof import('@sentry/react');

let sentry: SentryModule | null = null;

export async function initSentry(): Promise<void> {
  if (sentry) return;
  const S = await import('@sentry/react');
  S.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
    tracesSampleRate: 0.2,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      S.browserTracingIntegration(),
      S.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
  });
  sentry = S;
}

// ErrorBoundary 등에서 사용. SDK가 아직 로드되지 않았으면 무시.
export function captureException(error: unknown): void {
  sentry?.captureException(error);
}
