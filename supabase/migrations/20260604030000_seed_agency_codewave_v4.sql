-- ─────────────────────────────────────────────────────────────────
-- 에이전시급 데모 페이지 v4 — 코드웨이브 (다크 테크 에디토리얼)
--   레퍼런스(위메이드·한화에너지·LG CNS·원텍) 톤을 '기존 위젯만으로' 재현:
--   풀블리드 Ken Burns 히어로 · 초대형 타이포 + 글자 리빌 · 비대칭 2단 에디토리얼
--   · 아웃라인(스트로크) 텍스트 · 다중 마퀴 밴드 · 대형 카운터 · 다크 리듬.
--   신규 위젯 추가 없음 — section/text/image/stats/timeline/faq/divider(ticker)/
--   layoutContainer/button/spacer 의 속성 조합만 사용.
--   payload: club_pages.blocks/draft = { "config":{...}, "blocks":[...] }
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_codewave_id uuid;
BEGIN
  SELECT id INTO v_codewave_id FROM public.clubs WHERE slug = 'codewave';
  IF v_codewave_id IS NULL THEN RAISE NOTICE 'codewave club not found — skip'; RETURN; END IF;

  DELETE FROM public.club_pages WHERE club_id = v_codewave_id;

  INSERT INTO public.club_pages (club_id, blocks, draft, published_at, updated_at)
  VALUES (v_codewave_id,
  $cw${
    "config": {
      "activeTheme": "custom:#f97316",
      "clubName": "CODEWAVE",
      "badgeText": "13기 모집중",
      "showFloatingBtn": true,
      "smoothScroll": true,
      "contentWidth": "full",
      "pageBgColor": "#07070b",
      "pageTitle": "코드웨이브 | 학생이 출시하는 진짜 제품",
      "pageDesc": "기획부터 배포까지 한 학기에 완성하는 학생 개발 동아리"
    },
    "blocks": [

      { "id": "c4-hero", "type": "section", "bgType": "image", "bgImage": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=2400&q=80", "bgKenBurns": "zoom", "bgGradOverlay": true, "bgOverlay": 58, "paddingY": 210, "paddingX": 56, "gap": 0, "maxWidth": 1320,
        "bgWatermark": { "text": "CODEWAVE", "fontSize": 360, "opacity": 6, "position": "center", "color": "#ffffff" },
        "rows": [ { "id": "c4-hero-r", "cols": 1, "gap": 0, "columns": [ { "id": "c4-hero-c", "widgets": [
          { "id": "c4-hero-ey", "type": "text", "seoTag": "p", "align": "left", "text": "STUDENT-BUILT PRODUCTS · SINCE 2018", "animation": "fadeIn", "animDuration": 0.8, "fontSize": 14, "fontWeight": 800, "textColor": "#f97316", "letterSpacing": 0.22, "lineHeight": 1.4, "paddingTop": 0, "paddingBottom": 26, "maxWidth": 1200 },
          { "id": "c4-hero-h1", "type": "text", "seoTag": "h1", "align": "left", "text": "코드로\n==진짜 제품==을\n출시한다", "textReveal": "char", "revealStagger": 0.018, "fontSize": 94, "fontWeight": 900, "textColor": "#ffffff", "highlightColor": "#f97316", "lineHeight": 1.03, "letterSpacing": -0.035, "paddingTop": 0, "paddingBottom": 30, "maxWidth": 1200 },
          { "id": "c4-hero-sub", "type": "text", "seoTag": "p", "align": "left", "text": "기획부터 배포까지 한 학기에. 끝나지 않는 사이드 프로젝트가 아니라,\n실사용자가 들어오는 서비스를 끝까지 만들어 출시합니다.", "animation": "blurIn", "animDuration": 1.0, "fontSize": 19, "fontWeight": 400, "textColor": "#cbd5e1", "lineHeight": 1.7, "paddingTop": 0, "paddingBottom": 38, "maxWidth": 620 },
          { "id": "c4-hero-btn", "type": "button", "text": "13기 지원하기", "actionUrl": "", "btnTemplate": "neon", "btnSize": "l", "btnBg": "#0a0a0a", "btnTextColor": "#f97316", "borderWidth": 2, "borderColor": "#f97316", "radius": 8, "btnShadow": "glow", "btnAnim": "slideUp", "paddingY": 4 },
          { "id": "c4-hero-scr", "type": "text", "seoTag": "p", "align": "left", "text": "SCROLL ↓", "animation": "fadeIn", "animDuration": 1.2, "fontSize": 12, "fontWeight": 700, "textColor": "rgba(255,255,255,0.5)", "letterSpacing": 0.25, "paddingTop": 44, "paddingBottom": 0 }
        ] } ] } ] },

      { "id": "c4-tick1", "type": "divider", "variant": "ticker", "tickerItems": ["PRODUCT", "ENGINEERING", "DESIGN", "GROWTH", "SHIP IT", "REAL USERS", "OPEN SOURCE", "MENTORSHIP"], "separator": "✦", "speed": 22, "tickerFontSize": 15, "paddingY": 20, "bgColor": "#f97316", "textColor": "#07070b", "accentColor": "rgba(7,7,11,0.4)", "tickerFade": true, "tickerPause": true },

      { "id": "c4-mani", "type": "section", "bgType": "color", "bgColor": "#07070b", "paddingY": 168, "paddingX": 56, "gap": 0, "maxWidth": 1320,
        "bgWatermark": { "text": "MAKE", "fontSize": 440, "opacity": 4, "position": "bottom-right", "color": "#f97316" },
        "rows": [ { "id": "c4-mani-r", "cols": 2, "gap": 56, "colRatios": [1, 2], "columns": [
          { "id": "c4-mani-c1", "widgets": [
            { "id": "c4-mani-lb", "type": "text", "seoTag": "p", "align": "left", "text": "(01)\n우리가 하는 일", "animation": "fadeIn", "fontSize": 14, "fontWeight": 800, "textColor": "#f97316", "letterSpacing": 0.08, "lineHeight": 1.6, "paddingTop": 12, "paddingBottom": 0 }
          ] },
          { "id": "c4-mani-c2", "widgets": [
            { "id": "c4-mani-h", "type": "text", "seoTag": "h2", "align": "left", "text": "스터디를 넘어, ==출시==까지 갑니다", "textReveal": "word", "revealStagger": 0.05, "fontSize": 54, "fontWeight": 900, "textColor": "#ffffff", "highlightColor": "#f97316", "lineHeight": 1.14, "letterSpacing": -0.025, "paddingTop": 0, "paddingBottom": 22, "maxWidth": 820 },
            { "id": "c4-mani-p", "type": "text", "seoTag": "p", "align": "left", "text": "4~5인 팀이 한 학기에 하나의 서비스를 기획·개발·배포까지 끝냅니다. 주간 코드 리뷰로 품질을 다듬고, 현업 멘토가 방향을 잡아줍니다. 결과물은 포트폴리오가 아니라 실제로 돌아가는 제품입니다.", "animation": "slideUp", "animEasing": "power", "animDuration": 0.8, "fontSize": 18, "fontWeight": 400, "textColor": "#94a3b8", "lineHeight": 1.85, "paddingTop": 0, "paddingBottom": 0, "maxWidth": 720 }
          ] }
        ] } ] },

      { "id": "c4-stats", "type": "stats", "layout": "strip", "cols": 4, "paddingY": 130, "bgColor": "#0d0d12", "valueColor": "#ffffff", "labelColor": "#71717a", "valueSize": 86, "labelSize": 14, "animate": true, "countDuration": 2.6,
        "items": [ { "id": "c4-s1", "value": "50+", "label": "출시 프로젝트" }, { "id": "c4-s2", "value": "240+", "label": "누적 멤버" }, { "id": "c4-s3", "value": "35+", "label": "현업 취업" }, { "id": "c4-s4", "value": "8년", "label": "운영 역사" } ] },

      { "id": "c4-feat1", "type": "section", "bgType": "color", "bgColor": "#07070b", "paddingY": 150, "paddingX": 56, "gap": 0, "maxWidth": 1320,
        "bgShape": { "type": "blob", "size": 620, "color": "#f97316", "x": 6, "y": 78, "opacity": 10 },
        "rows": [ { "id": "c4-feat1-r", "cols": 2, "gap": 64, "colRatios": [1, 1], "columns": [
          { "id": "c4-feat1-c1", "widgets": [ { "id": "c4-feat1-img", "type": "image", "src": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80", "alt": "MaeumLog 팀", "width": 100, "aspect": "4/5", "objectFit": "cover", "radius": 6, "align": "center" } ] },
          { "id": "c4-feat1-c2", "widgets": [
            { "id": "c4-feat1-ey", "type": "text", "seoTag": "p", "align": "left", "text": "FEATURED PROJECT — 01", "animation": "fadeIn", "fontSize": 13, "fontWeight": 800, "textColor": "#f97316", "letterSpacing": 0.18, "paddingTop": 24, "paddingBottom": 14 },
            { "id": "c4-feat1-h", "type": "text", "seoTag": "h2", "align": "left", "text": "MaeumLog\n감정 기록 PWA", "textReveal": "word", "revealStagger": 0.06, "fontSize": 46, "fontWeight": 900, "textColor": "#ffffff", "lineHeight": 1.12, "letterSpacing": -0.02, "paddingTop": 0, "paddingBottom": 18, "maxWidth": 560 },
            { "id": "c4-feat1-p", "type": "text", "seoTag": "p", "align": "left", "text": "출시 첫 달 1,200 DAU. 기획·디자인·개발·배포를 한 팀이 16주 만에 완성했습니다. 실제 사용자 피드백으로 두 번의 메이저 업데이트까지 이어졌습니다.", "animation": "blurIn", "animDuration": 0.9, "fontSize": 17, "fontWeight": 400, "textColor": "#94a3b8", "lineHeight": 1.8, "paddingTop": 0, "paddingBottom": 26, "maxWidth": 540 },
            { "id": "c4-feat1-btn", "type": "button", "text": "케이스 스터디", "actionUrl": "", "btnTemplate": "outline", "btnHover": "arrow", "btnSize": "m", "btnBg": "transparent", "btnTextColor": "#f97316", "borderWidth": 2, "borderColor": "#f97316", "radius": 8, "btnShadow": "none", "paddingY": 4 }
          ] }
        ] } ] },

      { "id": "c4-feat2", "type": "section", "bgType": "color", "bgColor": "#0d0d12", "paddingY": 150, "paddingX": 56, "gap": 0, "maxWidth": 1320,
        "rows": [ { "id": "c4-feat2-r", "cols": 2, "gap": 64, "colRatios": [1, 1], "columns": [
          { "id": "c4-feat2-c1", "widgets": [
            { "id": "c4-feat2-ey", "type": "text", "seoTag": "p", "align": "left", "text": "FEATURED PROJECT — 02", "animation": "fadeIn", "fontSize": 13, "fontWeight": 800, "textColor": "#f97316", "letterSpacing": 0.18, "paddingTop": 24, "paddingBottom": 14 },
            { "id": "c4-feat2-h", "type": "text", "seoTag": "h2", "align": "left", "text": "Routable\n캠퍼스 길찾기 API", "textReveal": "word", "revealStagger": 0.06, "fontSize": 46, "fontWeight": 900, "textColor": "#ffffff", "lineHeight": 1.12, "letterSpacing": -0.02, "paddingTop": 0, "paddingBottom": 18, "maxWidth": 560 },
            { "id": "c4-feat2-p", "type": "text", "seoTag": "p", "align": "left", "text": "교내 3개 학교가 채택한 실내 길찾기 엔진. 그래프 탐색과 타일 렌더링을 직접 구현하며 성능 최적화와 API 설계를 깊게 다뤘습니다.", "animation": "blurIn", "animDuration": 0.9, "fontSize": 17, "fontWeight": 400, "textColor": "#94a3b8", "lineHeight": 1.8, "paddingTop": 0, "paddingBottom": 26, "maxWidth": 540 },
            { "id": "c4-feat2-btn", "type": "button", "text": "케이스 스터디", "actionUrl": "", "btnTemplate": "outline", "btnHover": "arrow", "btnSize": "m", "btnBg": "transparent", "btnTextColor": "#f97316", "borderWidth": 2, "borderColor": "#f97316", "radius": 8, "btnShadow": "none", "paddingY": 4 }
          ] },
          { "id": "c4-feat2-c2", "widgets": [ { "id": "c4-feat2-img", "type": "image", "src": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80", "alt": "Routable", "width": 100, "aspect": "4/5", "objectFit": "cover", "radius": 6, "align": "center" } ] }
        ] } ] },

      { "id": "c4-quote", "type": "section", "bgType": "image", "bgImage": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2400&q=80", "bgKenBurns": "panL", "bgGradOverlay": true, "bgOverlay": 56, "paddingY": 200, "paddingX": 56, "gap": 0, "maxWidth": 1100,
        "rows": [ { "id": "c4-quote-r", "cols": 1, "columns": [ { "id": "c4-quote-c", "widgets": [
          { "id": "c4-quote-ey", "type": "text", "seoTag": "p", "align": "center", "text": "OUR PHILOSOPHY", "animation": "fadeIn", "fontSize": 13, "fontWeight": 800, "textColor": "#f97316", "letterSpacing": 0.2, "paddingTop": 0, "paddingBottom": 22 },
          { "id": "c4-quote-h", "type": "text", "seoTag": "h2", "align": "center", "text": "코드는 도구일 뿐,\n==문제를 푸는 것==이 본질이다", "textReveal": "char", "revealStagger": 0.02, "fontSize": 52, "fontWeight": 900, "textColor": "#ffffff", "highlightColor": "#f97316", "lineHeight": 1.2, "letterSpacing": -0.02, "paddingTop": 0, "paddingBottom": 0, "maxWidth": 980 }
        ] } ] } ] },

      { "id": "c4-tracks", "type": "section", "bgType": "color", "bgColor": "#07070b", "paddingY": 150, "paddingX": 56, "gap": 0, "maxWidth": 1320,
        "rows": [ { "id": "c4-tr-r", "cols": 3, "gap": 16, "colRatios": [1, 1, 1], "rowGap": 8, "cardStyle": "numbered", "cardAccent": "#f97316", "cardBg": "#0d0d12", "cardPadding": 32, "cardRadius": 14, "cardHover": "lift", "columns": [
          { "id": "c4-tr-c1", "widgets": [
            { "id": "c4-tr1-t", "type": "text", "seoTag": "h3", "align": "left", "text": "Frontend", "fontSize": 22, "fontWeight": 900, "textColor": "#ffffff", "lineHeight": 1.25, "paddingTop": 4, "paddingBottom": 8 },
            { "id": "c4-tr1-b", "type": "text", "seoTag": "p", "align": "left", "text": "React · TypeScript · 디자인 시스템. 컴포넌트 설계와 상태관리, 접근성까지 실서비스 수준으로 다룹니다.", "fontSize": 14, "fontWeight": 400, "textColor": "#94a3b8", "lineHeight": 1.7, "paddingTop": 0, "paddingBottom": 0 }
          ] },
          { "id": "c4-tr-c2", "widgets": [
            { "id": "c4-tr2-t", "type": "text", "seoTag": "h3", "align": "left", "text": "Backend", "fontSize": 22, "fontWeight": 900, "textColor": "#ffffff", "lineHeight": 1.25, "paddingTop": 4, "paddingBottom": 8 },
            { "id": "c4-tr2-b", "type": "text", "seoTag": "p", "align": "left", "text": "Node · PostgreSQL · 클라우드 배포. API 설계와 인증, 데이터 모델링과 CI/CD 파이프라인을 구축합니다.", "fontSize": 14, "fontWeight": 400, "textColor": "#94a3b8", "lineHeight": 1.7, "paddingTop": 0, "paddingBottom": 0 }
          ] },
          { "id": "c4-tr-c3", "widgets": [
            { "id": "c4-tr3-t", "type": "text", "seoTag": "h3", "align": "left", "text": "Product", "fontSize": 22, "fontWeight": 900, "textColor": "#ffffff", "lineHeight": 1.25, "paddingTop": 4, "paddingBottom": 8 },
            { "id": "c4-tr3-b", "type": "text", "seoTag": "p", "align": "left", "text": "유저 리서치 · 지표 설계 · 그로스. 만들 가치가 있는 것을 정의하고 출시 후 데이터로 검증합니다.", "fontSize": 14, "fontWeight": 400, "textColor": "#94a3b8", "lineHeight": 1.7, "paddingTop": 0, "paddingBottom": 0 }
          ] }
        ] } ] },

      { "id": "c4-tick2", "type": "divider", "variant": "ticker", "tickerItems": ["주간 코드 리뷰", "현업 멘토 40명", "데모데이", "해커톤", "오픈소스 기여", "스터디 트랙"], "separator": "/", "speed": 26, "tickerFontSize": 14, "paddingY": 18, "bgColor": "#0d0d12", "textColor": "#f97316", "accentColor": "rgba(249,115,22,0.4)", "tickerReverse": true, "tickerFade": true },

      { "id": "c4-proc", "type": "timeline", "title": "지원부터 합류까지", "layout": "horizontal", "nodeStyle": "bigNum", "activeColor": "#f97316", "lineColor": "#27272a", "paddingY": 130, "bgColor": "#0d0d12",
        "nodes": [ { "id": "c4-p1", "title": "서류 지원", "desc": "자기소개와 관심 분야" }, { "id": "c4-p2", "title": "코딩 과제", "desc": "기초 과제로 협업 핏 확인" }, { "id": "c4-p3", "title": "인터뷰", "desc": "팀과 30분 대화" }, { "id": "c4-p4", "title": "합류", "desc": "첫 프로젝트 매칭" } ] },

      { "id": "c4-big", "type": "section", "bgType": "color", "bgColor": "#07070b", "paddingY": 110, "paddingX": 32, "gap": 0,
        "rows": [ { "id": "c4-big-r", "cols": 1, "columns": [ { "id": "c4-big-c", "widgets": [
          { "id": "c4-big-t", "type": "text", "seoTag": "p", "align": "center", "text": "TIME TO BUILD", "animation": "zoomIn", "animDuration": 0.9, "fontSize": 116, "fontWeight": 900, "textColor": "transparent", "textStroke": 2, "textStrokeColor": "#f97316", "lineHeight": 1.0, "letterSpacing": -0.01, "paddingTop": 0, "paddingBottom": 0 }
        ] } ] } ] },

      { "id": "c4-faq", "type": "faq", "title": "FAQ", "faqStyle": "line", "faqNumbered": true, "qSize": 20, "qColor": "#ffffff", "aColor": "#94a3b8", "faqLineColor": "#1f1f29", "iconStyle": "arrow", "paddingY": 130, "bgColor": "#07070b",
        "items": [
          { "id": "c4-f1", "question": "개발 경험이 없어도 지원할 수 있나요?", "answer": "네. 기초 트랙과 멘토링으로 비전공자도 한 학기 안에 프로젝트를 완성합니다." },
          { "id": "c4-f2", "question": "활동 빈도는 어떻게 되나요?", "answer": "주 1회 정기 세션 2시간과 팀별 자율 협업으로 운영됩니다." },
          { "id": "c4-f3", "question": "회비가 있나요?", "answer": "학기당 운영비가 있으며 서버·도메인 등 실비로 사용됩니다." }
        ] },

      { "id": "c4-cta", "type": "section", "bgType": "image", "bgImage": "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&w=2400&q=80", "bgKenBurns": "zoom", "bgGradOverlay": true, "bgOverlay": 60, "paddingY": 180, "paddingX": 56, "gap": 0, "maxWidth": 1100,
        "bgWatermark": { "text": "JOIN US", "fontSize": 260, "opacity": 10, "position": "center", "color": "#ffffff" },
        "rows": [ { "id": "c4-cta-r", "cols": 1, "columns": [ { "id": "c4-cta-c", "widgets": [
          { "id": "c4-cta-h", "type": "text", "seoTag": "h2", "align": "center", "text": "13기,\n지금 함께할 사람을 찾습니다", "textReveal": "char", "revealStagger": 0.022, "fontSize": 60, "fontWeight": 900, "textColor": "#ffffff", "lineHeight": 1.12, "letterSpacing": -0.025, "paddingTop": 0, "paddingBottom": 30, "maxWidth": 900 },
          { "id": "c4-cta-btn", "type": "button", "text": "지원하기", "actionUrl": "", "btnTemplate": "solid", "btnHover": "lift", "btnSize": "l", "btnBg": "#f97316", "btnTextColor": "#07070b", "borderWidth": 0, "radius": 8, "btnShadow": "soft", "btnAnim": "slideUp", "paddingY": 4 }
        ] } ] } ] }
    ]
  }$cw$::jsonb,
  $cw${ "config": {}, "blocks": [] }$cw$::jsonb,
  now(), now());

  UPDATE public.club_pages SET draft = blocks WHERE club_id = v_codewave_id;
END $$;
