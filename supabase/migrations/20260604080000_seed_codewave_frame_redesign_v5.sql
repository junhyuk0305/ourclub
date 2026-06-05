-- ─────────────────────────────────────────────────────────────────
-- 데모 페이지 v5 — 코드웨이브 / 프레임 '완전 신규' 재기획
--   기존 디자인(코드웨이브 다크테크 v4 · 프레임 모노벤토) 미사용.
--   - 코드웨이브: 라이트 블루프린트 에디토리얼(아이보리/화이트 + 인디고 #4f46e5,
--     IBM Plex Sans, 비대칭 그리드, 패럴랙스 쇼케이스, 빅넘버 가로 타임라인).
--   - 프레임: 웜 필름 갤러리(아이보리 #f7f3ec + 잉크/앰버 #b45309, 함렛 명조,
--     패럴랙스 필름 히어로, 이미지 3연작, 세로 링 타임라인).
--   신규 위젯 0 — section/text/image/stats/timeline/faq/divider(ticker)/button/countdown 의
--   속성 조합 + Track A~C(프리셋 필드) + Track B(섹션 bgParallax)만 사용.
--   payload: club_pages.blocks/draft = { "config":{...}, "blocks":[...] }
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_codewave_id uuid;
  v_frame_id    uuid;
BEGIN
  SELECT id INTO v_codewave_id FROM public.clubs WHERE slug = 'codewave';
  SELECT id INTO v_frame_id    FROM public.clubs WHERE slug = 'frame';

  -- ════════════════════ 코드웨이브 — 라이트 블루프린트 ════════════════════
  IF v_codewave_id IS NULL THEN
    RAISE NOTICE 'codewave club not found — skip';
  ELSE
    DELETE FROM public.club_pages WHERE club_id = v_codewave_id;
    INSERT INTO public.club_pages (club_id, blocks, draft, published_at, updated_at)
    VALUES (v_codewave_id,
    $cw${
      "config": {
        "activeTheme": "custom:#4f46e5",
        "clubName": "CODEWAVE",
        "badgeText": "14기 모집중",
        "showFloatingBtn": true,
        "smoothScroll": true,
        "contentWidth": "full",
        "pageBgColor": "#ffffff",
        "globalFont": "'IBM Plex Sans KR', sans-serif",
        "pageTitle": "코드웨이브 | 한 학기에 출시까지",
        "pageDesc": "기획부터 배포까지, 실사용자가 들어오는 제품을 끝까지 만드는 학생 개발 동아리"
      },
      "blocks": [

        { "id": "cw5-hero", "type": "section", "bgType": "color", "bgColor": "#f5f6fb", "paddingY": 200, "paddingX": 56, "gap": 0, "maxWidth": 1320,
          "bgWatermark": { "text": "BUILD", "fontSize": 380, "opacity": 5, "position": "center", "color": "#4f46e5" },
          "rows": [ { "id": "cw5-hero-r", "cols": 1, "gap": 0, "columns": [ { "id": "cw5-hero-c", "widgets": [
            { "id": "cw5-hero-ey", "type": "text", "seoTag": "p", "align": "left", "text": "STUDENT DEVELOPERS · SHIP REAL PRODUCTS", "animation": "fadeIn", "animDuration": 0.8, "fontSize": 14, "fontWeight": 800, "textColor": "#4f46e5", "letterSpacing": 0.22, "lineHeight": 1.4, "paddingTop": 0, "paddingBottom": 26, "maxWidth": 1200 },
            { "id": "cw5-hero-h1", "type": "text", "seoTag": "h1", "align": "left", "text": "한 학기에\n==출시==까지\n끝낸다", "textReveal": "char", "revealStagger": 0.02, "fontSize": 90, "fontWeight": 900, "textColor": "#0b1020", "highlightColor": "#4f46e5", "lineHeight": 1.05, "letterSpacing": -0.035, "paddingTop": 0, "paddingBottom": 30, "maxWidth": 1200 },
            { "id": "cw5-hero-sub", "type": "text", "seoTag": "p", "align": "left", "text": "끝나지 않는 사이드 프로젝트는 그만. 4~5인 팀이 기획부터 배포까지,\n실사용자가 들어오는 서비스를 한 학기에 완성합니다.", "animation": "slideUp", "animEasing": "power", "animDuration": 0.8, "fontSize": 19, "fontWeight": 400, "textColor": "#475569", "lineHeight": 1.7, "paddingTop": 0, "paddingBottom": 38, "maxWidth": 640 },
            { "id": "cw5-hero-btn", "type": "button", "text": "14기 지원하기", "actionUrl": "", "btnTemplate": "solid", "btnSize": "l", "btnBg": "#4f46e5", "btnTextColor": "#ffffff", "borderWidth": 0, "radius": 10, "btnShadow": "soft", "btnAnim": "slideUp", "paddingY": 4 }
          ] } ] } ] },

        { "id": "cw5-tick", "type": "divider", "variant": "ticker", "tickerItems": ["PRODUCT", "ENGINEERING", "DESIGN", "SHIP IT", "REAL USERS", "GROWTH", "CODE REVIEW", "MENTORSHIP"], "separator": "/", "speed": 22, "tickerFontSize": 14, "paddingY": 18, "bgColor": "#4f46e5", "textColor": "#ffffff", "accentColor": "rgba(255,255,255,0.45)", "tickerFade": true, "tickerPause": true },

        { "id": "cw5-mani", "type": "section", "bgType": "color", "bgColor": "#ffffff", "paddingY": 150, "paddingX": 56, "gap": 0, "maxWidth": 1320,
          "rows": [ { "id": "cw5-mani-r", "cols": 2, "gap": 56, "colRatios": [1, 2], "columns": [
            { "id": "cw5-mani-c1", "widgets": [
              { "id": "cw5-mani-lb", "type": "text", "seoTag": "p", "align": "left", "text": "(01)\n우리가 하는 일", "animation": "fadeIn", "fontSize": 14, "fontWeight": 800, "textColor": "#4f46e5", "letterSpacing": 0.08, "lineHeight": 1.6, "paddingTop": 12, "paddingBottom": 0 }
            ] },
            { "id": "cw5-mani-c2", "widgets": [
              { "id": "cw5-mani-h", "type": "text", "seoTag": "h2", "align": "left", "text": "스터디를 넘어, ==출시==까지 갑니다", "textReveal": "word", "revealStagger": 0.05, "fontSize": 50, "fontWeight": 900, "textColor": "#0b1020", "highlightColor": "#4f46e5", "lineHeight": 1.16, "letterSpacing": -0.025, "paddingTop": 0, "paddingBottom": 22, "maxWidth": 820 },
              { "id": "cw5-mani-p", "type": "text", "seoTag": "p", "align": "left", "text": "한 학기에 한 팀이 하나의 서비스를 기획·개발·배포까지 끝냅니다. 매주 코드 리뷰로 품질을 다듬고, 현업 멘토가 방향을 잡아줍니다. 학기가 끝나면 손에 남는 건 포트폴리오가 아니라 실제로 돌아가는 제품입니다.", "animation": "slideUp", "animEasing": "power", "animDuration": 0.8, "fontSize": 18, "fontWeight": 400, "textColor": "#475569", "lineHeight": 1.85, "paddingTop": 0, "paddingBottom": 0, "maxWidth": 720 }
            ] }
          ] } ] },

        { "id": "cw5-prog", "type": "section", "bgType": "color", "bgColor": "#f5f6fb", "paddingY": 130, "paddingX": 56, "gap": 44, "maxWidth": 1320,
          "rows": [
            { "id": "cw5-prog-rh", "cols": 1, "gap": 0, "columns": [ { "id": "cw5-prog-ch", "widgets": [
              { "id": "cw5-prog-ey", "type": "text", "seoTag": "p", "align": "left", "text": "(02) 프로그램", "fontSize": 14, "fontWeight": 800, "textColor": "#4f46e5", "letterSpacing": 0.08, "lineHeight": 1.5, "paddingTop": 0, "paddingBottom": 10 },
              { "id": "cw5-prog-h", "type": "text", "seoTag": "h2", "align": "left", "text": "세 가지 방식으로 함께 만듭니다", "animation": "slideUp", "fontSize": 40, "fontWeight": 900, "textColor": "#0b1020", "lineHeight": 1.2, "letterSpacing": -0.02, "paddingTop": 0, "paddingBottom": 0 }
            ] } ] },
            { "id": "cw5-prog-rc", "cols": 3, "gap": 24, "cardStyle": "accentTop", "cardAccent": "#4f46e5", "cardPadding": 30, "cardRadius": 14, "cardBg": "#ffffff", "cardHover": "lift", "columns": [
              { "id": "cw5-prog-c1", "widgets": [
                { "id": "cw5-prog-t1", "type": "text", "seoTag": "h3", "align": "left", "text": "팀 프로젝트", "fontSize": 22, "fontWeight": 800, "textColor": "#0b1020", "lineHeight": 1.3, "paddingTop": 0, "paddingBottom": 10 },
                { "id": "cw5-prog-d1", "type": "text", "seoTag": "p", "align": "left", "text": "4~5인 팀이 한 학기 동안 하나의 제품을 기획·개발·배포까지 끝냅니다.", "fontSize": 15, "fontWeight": 400, "textColor": "#64748b", "lineHeight": 1.7, "paddingTop": 0, "paddingBottom": 0 }
              ] },
              { "id": "cw5-prog-c2", "widgets": [
                { "id": "cw5-prog-t2", "type": "text", "seoTag": "h3", "align": "left", "text": "코드 리뷰", "fontSize": 22, "fontWeight": 800, "textColor": "#0b1020", "lineHeight": 1.3, "paddingTop": 0, "paddingBottom": 10 },
                { "id": "cw5-prog-d2", "type": "text", "seoTag": "p", "align": "left", "text": "매주 PR 리뷰로 서로의 코드를 읽고, 더 나은 구조를 함께 찾습니다.", "fontSize": 15, "fontWeight": 400, "textColor": "#64748b", "lineHeight": 1.7, "paddingTop": 0, "paddingBottom": 0 }
              ] },
              { "id": "cw5-prog-c3", "widgets": [
                { "id": "cw5-prog-t3", "type": "text", "seoTag": "h3", "align": "left", "text": "현업 멘토링", "fontSize": 22, "fontWeight": 800, "textColor": "#0b1020", "lineHeight": 1.3, "paddingTop": 0, "paddingBottom": 10 },
                { "id": "cw5-prog-d3", "type": "text", "seoTag": "p", "align": "left", "text": "현업 개발자가 기술 선택과 제품 방향을 함께 점검해 줍니다.", "fontSize": 15, "fontWeight": 400, "textColor": "#64748b", "lineHeight": 1.7, "paddingTop": 0, "paddingBottom": 0 }
              ] }
            ] }
          ] },

        { "id": "cw5-stats", "type": "stats", "layout": "strip", "cols": 4, "paddingY": 120, "bgColor": "#0b1020", "valueColor": "#ffffff", "labelColor": "#94a3b8", "valueSize": 78, "labelSize": 14, "animate": true, "countDuration": 2.2,
          "items": [
            { "id": "cw5-st1", "icon": "", "value": "32", "label": "누적 출시 제품" },
            { "id": "cw5-st2", "icon": "", "value": "80%", "label": "현업 취업률" },
            { "id": "cw5-st3", "icon": "", "value": "14", "label": "기수" },
            { "id": "cw5-st4", "icon": "", "value": "240+", "label": "거쳐간 멤버" }
          ] },

        { "id": "cw5-show", "type": "section", "bgType": "image", "bgImage": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2400&q=80", "bgParallax": 22, "bgOverlay": 42, "bgGradOverlay": true, "paddingY": 200, "paddingX": 56, "gap": 0, "maxWidth": 1320,
          "rows": [ { "id": "cw5-show-r", "cols": 1, "gap": 0, "columns": [ { "id": "cw5-show-c", "widgets": [
            { "id": "cw5-show-ey", "type": "text", "seoTag": "p", "align": "center", "text": "(03) 결과물", "animation": "fadeIn", "fontSize": 14, "fontWeight": 800, "textColor": "#c7d2fe", "letterSpacing": 0.18, "lineHeight": 1.5, "paddingTop": 0, "paddingBottom": 18 },
            { "id": "cw5-show-h", "type": "text", "seoTag": "h2", "align": "center", "text": "포트폴리오가 아니라,\n==돌아가는 제품==", "textReveal": "word", "revealStagger": 0.05, "fontSize": 56, "fontWeight": 900, "textColor": "#ffffff", "highlightColor": "#a5b4fc", "lineHeight": 1.15, "letterSpacing": -0.02, "paddingTop": 0, "paddingBottom": 20 },
            { "id": "cw5-show-p", "type": "text", "seoTag": "p", "align": "center", "text": "데모데이에서 끝나지 않습니다. 실제 사용자가 가입하고, 피드백이 쌓이고,\n다음 학기 팀이 그 위에서 다시 개선합니다.", "animation": "fadeIn", "fontSize": 18, "fontWeight": 400, "textColor": "#e2e8f0", "lineHeight": 1.8, "paddingTop": 0, "paddingBottom": 0, "maxWidth": 680 }
          ] } ] } ] },

        { "id": "cw5-proc-h", "type": "section", "bgType": "color", "bgColor": "#ffffff", "paddingY": 120, "paddingX": 56, "gap": 0, "maxWidth": 1320,
          "rows": [ { "id": "cw5-proc-hr", "cols": 1, "gap": 0, "columns": [ { "id": "cw5-proc-hc", "widgets": [
            { "id": "cw5-proc-ey", "type": "text", "seoTag": "p", "align": "left", "text": "(04) 합류까지", "fontSize": 14, "fontWeight": 800, "textColor": "#4f46e5", "letterSpacing": 0.08, "lineHeight": 1.5, "paddingTop": 0, "paddingBottom": 10 },
            { "id": "cw5-proc-h2", "type": "text", "seoTag": "h2", "align": "left", "text": "지원부터 킥오프까지 4단계", "animation": "slideUp", "fontSize": 40, "fontWeight": 900, "textColor": "#0b1020", "lineHeight": 1.2, "letterSpacing": -0.02, "paddingTop": 0, "paddingBottom": 0 }
          ] } ] } ] },

        { "id": "cw5-timeline", "type": "timeline", "title": "", "layout": "horizontal", "nodeStyle": "bigNum", "activeColor": "#4f46e5", "lineColor": "#e2e8f0", "nodeAnim": "slideUp", "nodeStagger": 0.12,
          "nodes": [
            { "id": "cw5-tn1", "title": "지원서 접수", "desc": "관심 분야와 만들고 싶은 것을 적어 주세요." },
            { "id": "cw5-tn2", "title": "코딩 과제", "desc": "가벼운 미니 과제로 함께 일하는 방식을 봅니다." },
            { "id": "cw5-tn3", "title": "팀 인터뷰", "desc": "운영진·기존 멤버와 편하게 대화합니다." },
            { "id": "cw5-tn4", "title": "합류 & 킥오프", "desc": "팀을 배정받고 첫 스프린트를 시작합니다." }
          ] },

        { "id": "cw5-faq", "type": "faq", "title": "자주 묻는 질문", "faqStyle": "line", "iconStyle": "arrow", "faqNumbered": true, "qSize": 19, "qColor": "#0b1020", "aColor": "#475569", "faqLineColor": "#e2e8f0",
          "items": [
            { "id": "cw5-fq1", "question": "개발 경험이 거의 없어도 되나요?", "answer": "기초 문법을 한 번이라도 다뤄봤다면 충분합니다. 나머지는 팀과 코드 리뷰로 빠르게 따라옵니다." },
            { "id": "cw5-fq2", "question": "어떤 기술 스택을 쓰나요?", "answer": "팀이 만들 제품에 맞춰 정합니다. 웹은 주로 React/Node, 모바일·데이터 팀도 매 학기 열립니다." },
            { "id": "cw5-fq3", "question": "활동 시간은 얼마나 되나요?", "answer": "주 1회 정기 모임 + 팀별 작업. 학기 중반 이후는 출시 준비로 조금 더 바빠집니다." },
            { "id": "cw5-fq4", "question": "비전공자도 지원할 수 있나요?", "answer": "물론입니다. 전공보다 '끝까지 만들어 보고 싶다'는 마음을 더 봅니다." }
          ] },

        { "id": "cw5-cd", "type": "countdown", "label": "14기 지원 마감까지", "expiredText": "14기 모집이 마감되었습니다", "endAt": "2026-09-15T23:59", "bgColor": "#0b1020", "textColor": "#ffffff", "accentColor": "#818cf8", "paddingY": 90 },

        { "id": "cw5-cta", "type": "section", "bgType": "color", "bgColor": "#4f46e5", "paddingY": 150, "paddingX": 56, "gap": 0, "maxWidth": 1320,
          "bgWatermark": { "text": "JOIN", "fontSize": 420, "opacity": 9, "position": "center", "color": "#ffffff" },
          "rows": [ { "id": "cw5-cta-r", "cols": 1, "gap": 0, "columns": [ { "id": "cw5-cta-c", "widgets": [
            { "id": "cw5-cta-ey", "type": "text", "seoTag": "p", "align": "center", "text": "NEXT SEMESTER", "animation": "fadeIn", "fontSize": 13, "fontWeight": 800, "textColor": "#c7d2fe", "letterSpacing": 0.22, "lineHeight": 1.4, "paddingTop": 0, "paddingBottom": 18 },
            { "id": "cw5-cta-h", "type": "text", "seoTag": "h2", "align": "center", "text": "다음 학기, 당신의 제품을\n==출시==하세요", "textReveal": "char", "revealStagger": 0.02, "fontSize": 54, "fontWeight": 900, "textColor": "#ffffff", "highlightColor": "#fde68a", "lineHeight": 1.15, "letterSpacing": -0.02, "paddingTop": 0, "paddingBottom": 32 },
            { "id": "cw5-cta-btn", "type": "button", "text": "14기 지원하기", "actionUrl": "", "btnTemplate": "solid", "btnSize": "l", "btnBg": "#ffffff", "btnTextColor": "#4f46e5", "borderWidth": 0, "radius": 10, "btnShadow": "hard", "btnAnim": "slideUp", "paddingY": 0 }
          ] } ] } ] }

      ]
    }$cw$::jsonb,
    $cw${"config":{}}$cw$::jsonb,  -- placeholder, overwritten below
    now(), now());

    -- draft = blocks (동일 스냅샷으로 발행 == 초안)
    UPDATE public.club_pages SET draft = blocks WHERE club_id = v_codewave_id;
    RAISE NOTICE '코드웨이브 v5 시드 완료';
  END IF;

  -- ════════════════════ 프레임 — 웜 필름 갤러리 ════════════════════
  IF v_frame_id IS NULL THEN
    RAISE NOTICE 'frame club not found — skip';
  ELSE
    DELETE FROM public.club_pages WHERE club_id = v_frame_id;
    INSERT INTO public.club_pages (club_id, blocks, draft, published_at, updated_at)
    VALUES (v_frame_id,
    $fr${
      "config": {
        "activeTheme": "custom:#b45309",
        "clubName": "FRAME",
        "badgeText": "9기 모집",
        "showFloatingBtn": true,
        "smoothScroll": true,
        "contentWidth": "full",
        "pageBgColor": "#f7f3ec",
        "globalFont": "'Hahmlet', serif",
        "pageTitle": "프레임 | 한 장의 사진 동아리",
        "pageDesc": "매 학기 한 권의 사진집을 함께 만드는 교내 사진 동아리"
      },
      "blocks": [

        { "id": "fr5-hero", "type": "section", "bgType": "image", "bgImage": "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=2400&q=80", "bgParallax": 20, "bgOverlay": 44, "bgGradOverlay": true, "paddingY": 220, "paddingX": 56, "gap": 0, "maxWidth": 1280,
          "rows": [ { "id": "fr5-hero-r", "cols": 1, "gap": 0, "columns": [ { "id": "fr5-hero-c", "widgets": [
            { "id": "fr5-hero-ey", "type": "text", "seoTag": "p", "align": "left", "text": "PHOTOGRAPHY · SINCE 2017", "animation": "fadeIn", "animDuration": 0.8, "fontSize": 14, "fontWeight": 700, "textColor": "#fbbf24", "letterSpacing": 0.22, "lineHeight": 1.4, "paddingTop": 0, "paddingBottom": 26 },
            { "id": "fr5-hero-h1", "type": "text", "seoTag": "h1", "align": "left", "text": "한 장의 사진으로\n==시간==을 멈춘다", "textReveal": "char", "revealStagger": 0.022, "fontSize": 82, "fontWeight": 800, "textColor": "#ffffff", "highlightColor": "#f59e0b", "lineHeight": 1.1, "letterSpacing": -0.02, "paddingTop": 0, "paddingBottom": 28, "maxWidth": 1100 },
            { "id": "fr5-hero-sub", "type": "text", "seoTag": "p", "align": "left", "text": "찰나에 멈춘 빛은 보는 사람의 시간을 늦춥니다.\n프레임은 그 늦춰지는 시간을 함께 들여다보는 사람들입니다.", "animation": "blurIn", "animDuration": 1.0, "fontSize": 19, "fontWeight": 400, "textColor": "#e7e5e4", "lineHeight": 1.8, "paddingTop": 0, "paddingBottom": 38, "maxWidth": 620 },
            { "id": "fr5-hero-btn", "type": "button", "text": "9기 지원하기", "actionUrl": "", "btnTemplate": "solid", "btnSize": "l", "btnBg": "#b45309", "btnTextColor": "#ffffff", "borderWidth": 0, "radius": 4, "btnShadow": "none", "btnAnim": "slideUp", "paddingY": 4 }
          ] } ] } ] },

        { "id": "fr5-mani", "type": "section", "bgType": "color", "bgColor": "#f7f3ec", "paddingY": 160, "paddingX": 56, "gap": 0, "maxWidth": 1000,
          "rows": [ { "id": "fr5-mani-r", "cols": 1, "gap": 0, "columns": [ { "id": "fr5-mani-c", "widgets": [
            { "id": "fr5-mani-ey", "type": "text", "seoTag": "p", "align": "left", "text": "(01) 우리는", "animation": "fadeIn", "fontSize": 14, "fontWeight": 700, "textColor": "#b45309", "letterSpacing": 0.1, "lineHeight": 1.5, "paddingTop": 0, "paddingBottom": 18 },
            { "id": "fr5-mani-h", "type": "text", "seoTag": "h2", "align": "left", "text": "사진은 ==기억==이 아니라\n다시 보는 ==연습==입니다", "textReveal": "word", "revealStagger": 0.05, "fontSize": 46, "fontWeight": 800, "textColor": "#1c1917", "highlightColor": "#b45309", "lineHeight": 1.3, "letterSpacing": -0.01, "paddingTop": 0, "paddingBottom": 26, "maxWidth": 900 },
            { "id": "fr5-mani-p", "type": "text", "seoTag": "p", "align": "left", "text": "매 학기 한 가지 주제를 정해 부원 전체가 매주 촬영합니다. 같은 도시, 같은 사람을 저마다 다르게 담고, 학기 말에는 그 사진들을 모아 한 권의 사진집으로 묶습니다.", "animation": "slideUp", "animEasing": "power", "animDuration": 0.8, "fontSize": 18, "fontWeight": 400, "textColor": "#57534e", "lineHeight": 1.9, "paddingTop": 0, "paddingBottom": 0, "maxWidth": 860 }
          ] } ] } ] },

        { "id": "fr5-gal", "type": "section", "bgType": "color", "bgColor": "#efe9df", "paddingY": 120, "paddingX": 56, "gap": 40, "maxWidth": 1280,
          "rows": [
            { "id": "fr5-gal-rh", "cols": 1, "gap": 0, "columns": [ { "id": "fr5-gal-ch", "widgets": [
              { "id": "fr5-gal-ey", "type": "text", "seoTag": "p", "align": "left", "text": "(02) 지난 학기", "fontSize": 14, "fontWeight": 700, "textColor": "#b45309", "letterSpacing": 0.1, "lineHeight": 1.5, "paddingTop": 0, "paddingBottom": 10 },
              { "id": "fr5-gal-h", "type": "text", "seoTag": "h2", "align": "left", "text": "우리가 본 것들", "animation": "slideUp", "fontSize": 40, "fontWeight": 800, "textColor": "#1c1917", "lineHeight": 1.2, "paddingTop": 0, "paddingBottom": 0 }
            ] } ] },
            { "id": "fr5-gal-ri", "cols": 3, "gap": 20, "columns": [
              { "id": "fr5-gal-c1", "widgets": [
                { "id": "fr5-gal-i1", "type": "image", "src": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80", "alt": "산", "width": 100, "align": "center", "aspect": "3/4", "objectFit": "cover", "radius": 2, "paddingTop": 0, "paddingBottom": 0, "paddingLeft": 0, "paddingRight": 0 }
              ] },
              { "id": "fr5-gal-c2", "widgets": [
                { "id": "fr5-gal-i2", "type": "image", "src": "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80", "alt": "거리", "width": 100, "align": "center", "aspect": "3/4", "objectFit": "cover", "radius": 2, "paddingTop": 0, "paddingBottom": 0, "paddingLeft": 0, "paddingRight": 0 }
              ] },
              { "id": "fr5-gal-c3", "widgets": [
                { "id": "fr5-gal-i3", "type": "image", "src": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80", "alt": "밤", "width": 100, "align": "center", "aspect": "3/4", "objectFit": "cover", "radius": 2, "paddingTop": 0, "paddingBottom": 0, "paddingLeft": 0, "paddingRight": 0 }
              ] }
            ] }
          ] },

        { "id": "fr5-stats", "type": "stats", "layout": "strip", "cols": 3, "paddingY": 110, "bgColor": "#1c1917", "valueColor": "#f59e0b", "labelColor": "#a8a29e", "valueSize": 72, "labelSize": 14, "animate": true, "countDuration": 2.0,
          "items": [
            { "id": "fr5-st1", "icon": "", "value": "8", "label": "정기 전시" },
            { "id": "fr5-st2", "icon": "", "value": "14", "label": "발간 사진집" },
            { "id": "fr5-st3", "icon": "", "value": "120+", "label": "거쳐간 부원" }
          ] },

        { "id": "fr5-quote", "type": "section", "bgType": "image", "bgImage": "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=2400&q=80", "bgKenBurns": "zoom", "bgOverlay": 50, "paddingY": 180, "paddingX": 56, "gap": 0, "maxWidth": 1000,
          "rows": [ { "id": "fr5-quote-r", "cols": 1, "gap": 0, "columns": [ { "id": "fr5-quote-c", "widgets": [
            { "id": "fr5-quote-h", "type": "text", "seoTag": "h2", "align": "center", "text": "빛은 기다리는 사람에게만\n머문다", "textReveal": "word", "revealStagger": 0.06, "fontSize": 50, "fontWeight": 800, "textColor": "#ffffff", "lineHeight": 1.3, "letterSpacing": -0.01, "paddingTop": 0, "paddingBottom": 16 },
            { "id": "fr5-quote-c2", "type": "text", "seoTag": "p", "align": "center", "text": "— 프레임이 매주 출사에서 배우는 한 가지", "animation": "fadeIn", "fontSize": 15, "fontWeight": 400, "textColor": "#d6d3d1", "lineHeight": 1.6, "paddingTop": 0, "paddingBottom": 0 }
          ] } ] } ] },

        { "id": "fr5-proc-h", "type": "section", "bgType": "color", "bgColor": "#f7f3ec", "paddingY": 120, "paddingX": 56, "gap": 0, "maxWidth": 1000,
          "rows": [ { "id": "fr5-proc-hr", "cols": 1, "gap": 0, "columns": [ { "id": "fr5-proc-hc", "widgets": [
            { "id": "fr5-proc-ey", "type": "text", "seoTag": "p", "align": "left", "text": "(03) 함께하기까지", "fontSize": 14, "fontWeight": 700, "textColor": "#b45309", "letterSpacing": 0.1, "lineHeight": 1.5, "paddingTop": 0, "paddingBottom": 10 },
            { "id": "fr5-proc-h2", "type": "text", "seoTag": "h2", "align": "left", "text": "지원부터 첫 출사까지", "animation": "slideUp", "fontSize": 40, "fontWeight": 800, "textColor": "#1c1917", "lineHeight": 1.2, "paddingTop": 0, "paddingBottom": 0 }
          ] } ] } ] },

        { "id": "fr5-timeline", "type": "timeline", "title": "", "layout": "vertical-left", "nodeStyle": "ring", "activeColor": "#b45309", "lineColor": "#1c1917", "nodeAnim": "fadeIn", "nodeStagger": 0.12,
          "nodes": [
            { "id": "fr5-tn1", "title": "포트폴리오 제출", "desc": "잘 찍은 사진이 아니라, 가장 아끼는 사진 3장을 보내주세요." },
            { "id": "fr5-tn2", "title": "사진 인터뷰", "desc": "그 사진을 왜 찍었는지 이야기를 나눕니다." },
            { "id": "fr5-tn3", "title": "첫 출사 동행", "desc": "한 번의 정기 출사에 함께 나가 봅니다." },
            { "id": "fr5-tn4", "title": "정식 합류", "desc": "이번 학기 주제 팀에 합류해 사진집을 함께 만듭니다." }
          ] },

        { "id": "fr5-faq", "type": "faq", "title": "자주 묻는 질문", "faqStyle": "boxed", "iconStyle": "plus", "openBg": "#f5ede0", "borderRadius": 0, "qSize": 17,
          "items": [
            { "id": "fr5-fq1", "question": "좋은 카메라가 꼭 필요한가요?", "answer": "아니요. 스마트폰으로 시작하는 부원도 많습니다. 장비보다 매주 한 컷씩 쌓는 꾸준함을 봅니다." },
            { "id": "fr5-fq2", "question": "사진을 한 번도 배운 적이 없어요.", "answer": "괜찮습니다. 매주 출사와 합평으로 빠르게 늘고, 선배들이 곁에서 함께 봐줍니다." },
            { "id": "fr5-fq3", "question": "활동은 얼마나 자주 하나요?", "answer": "주 1회 정기 출사 또는 합평 모임이 기본이고, 학기 말에는 사진집·전시 준비가 더해집니다." },
            { "id": "fr5-fq4", "question": "회비가 있나요?", "answer": "사진집 인쇄와 전시 대관을 위한 소액 학기 회비가 있습니다. 지원 시 자세히 안내합니다." }
          ] },

        { "id": "fr5-cd", "type": "countdown", "label": "9기 모집 마감까지", "expiredText": "9기 모집이 마감되었습니다", "endAt": "2026-09-10T23:59", "bgColor": "#1c1917", "textColor": "#f5f5f4", "accentColor": "#f59e0b", "paddingY": 90 },

        { "id": "fr5-cta", "type": "section", "bgType": "color", "bgColor": "#b45309", "paddingY": 150, "paddingX": 56, "gap": 0, "maxWidth": 1280,
          "bgWatermark": { "text": "FRAME", "fontSize": 360, "opacity": 9, "position": "center", "color": "#ffffff" },
          "rows": [ { "id": "fr5-cta-r", "cols": 1, "gap": 0, "columns": [ { "id": "fr5-cta-c", "widgets": [
            { "id": "fr5-cta-h", "type": "text", "seoTag": "h2", "align": "center", "text": "다음 한 장은\n당신의 ==프레임==입니다", "textReveal": "char", "revealStagger": 0.02, "fontSize": 52, "fontWeight": 800, "textColor": "#ffffff", "highlightColor": "#fde68a", "lineHeight": 1.2, "letterSpacing": -0.01, "paddingTop": 0, "paddingBottom": 32 },
            { "id": "fr5-cta-btn", "type": "button", "text": "9기 지원하기", "actionUrl": "", "btnTemplate": "solid", "btnSize": "l", "btnBg": "#1c1917", "btnTextColor": "#ffffff", "borderWidth": 0, "radius": 4, "btnShadow": "hard", "btnAnim": "slideUp", "paddingY": 0 }
          ] } ] } ] }

      ]
    }$fr$::jsonb,
    $fr${"config":{}}$fr$::jsonb,  -- placeholder, overwritten below
    now(), now());

    UPDATE public.club_pages SET draft = blocks WHERE club_id = v_frame_id;
    RAISE NOTICE '프레임 v5 시드 완료';
  END IF;

END $$;
