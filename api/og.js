// 동아리 페이지 링크 공유용 동적 Open Graph 메타태그.
// SPA는 크롤러가 JS를 실행하지 않아 동아리별 미리보기 이미지를 못 만든다.
// vercel.json의 rewrite가 크롤러(User-Agent) 요청만 이 함수로 보내고,
// 일반 사용자는 그대로 index.html(SPA)을 받는다.

const SITE = 'https://ourclub-univ.com';
const DEFAULT_IMAGE = `${SITE}/og-image.png`;
const DEFAULT_TITLE = 'OURCLUB — 동아리·학회 운영부터 기업 프로젝트까지';
const DEFAULT_DESC = '동아리·학회를 위한 운영 플랫폼. 우리 동아리 홈페이지와 운영 관리부터 기업과의 실전 프로젝트까지 한 곳에서.';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function html({ title, description, image, url }) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(url)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="OURCLUB" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:locale" content="ko_KR" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(image)}" />
</head>
<body><a href="${esc(url)}">${esc(title)}</a></body>
</html>`;
}

export default async function handler(req, res) {
  const slug = String(req.query.slug || '').replace(/[^a-z0-9-]/gi, '');
  const url = slug ? `${SITE}/clubs/${slug}` : SITE;

  let payload = { title: DEFAULT_TITLE, description: DEFAULT_DESC, image: DEFAULT_IMAGE, url };

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (slug && supabaseUrl && anonKey) {
    try {
      const r = await fetch(
        `${supabaseUrl}/rest/v1/clubs?slug=eq.${encodeURIComponent(slug)}&select=name,one_line_desc,logo_url&limit=1`,
        { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }
      );
      if (r.ok) {
        const rows = await r.json();
        const club = Array.isArray(rows) ? rows[0] : null;
        if (club) {
          payload = {
            title: `${club.name} — OURCLUB`,
            description: club.one_line_desc || DEFAULT_DESC,
            image: club.logo_url || DEFAULT_IMAGE,
            url,
          };
        }
      }
    } catch {
      // 조회 실패 시 기본 메타태그로 폴백
    }
  }

  // 크롤러 캐시 + 우리 측 CDN 캐시(10분)
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=86400');
  res.status(200).send(html(payload));
}
