-- ─────────────────────────────────────────────────────────────────
-- 에이전시급 데모 페이지 v4 — 스파이크 (라이트 브루탈리스트 / 임팩트 스포츠)
--   코드웨이브(다크 테크)·데브허슬러(블루 브루탈)와 의도적으로 다른 톤:
--   크림 배경 · 잉크 블랙 · 임팩트 오렌지 · 하드 오프셋 그림자 · 두꺼운 검정 보더
--   · 초대형 타이포 + 글자 리빌 · 아웃라인 텍스트 · 다중 마퀴.
--   차별화: Ken Burns 는 '히어로'가 아니라 '중간 풀블리드 코트 밴드'에, 히어로/CTA 는 플랫 볼드 컬러.
--   신규 위젯 추가 없음 — section/text/image/stats/timeline/faq/divider(ticker)/
--   layoutContainer/button 의 속성 조합만 사용.
--   payload: club_pages.blocks/draft = { "config":{...}, "blocks":[...] }
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_sp_id uuid;
BEGIN
  SELECT id INTO v_sp_id FROM public.clubs WHERE slug = 'spike';
  IF v_sp_id IS NULL THEN RAISE NOTICE 'spike club not found — skip'; RETURN; END IF;

  DELETE FROM public.club_pages WHERE club_id = v_sp_id;

  INSERT INTO public.club_pages (club_id, blocks, draft, published_at, updated_at)
  VALUES (v_sp_id,
  $sp${
    "config": {
      "activeTheme": "custom:#ea580c",
      "clubName": "SPIKE",
      "badgeText": "2025 시즌 모집중",
      "showFloatingBtn": true,
      "smoothScroll": true,
      "contentWidth": "full",
      "pageBgColor": "#f5f3ec",
      "pageTitle": "스파이크 | 코트 위에서 증명하는 대학 배구 동아리",
      "pageDesc": "주 2회 훈련, 3대학 연합 리그 — 체육관에서 만들어지는 가장 진한 우정"
    },
    "blocks": [

      { "id": "sp-hero", "type": "section", "bgType": "color", "bgColor": "#f5f3ec", "paddingY": 190, "paddingX": 56, "gap": 0, "maxWidth": 1320,
        "bgShape": { "type": "circle", "size": 560, "color": "#ea580c", "x": 90, "y": 16, "opacity": 14 },
        "bgWatermark": { "text": "SPIKE", "fontSize": 380, "opacity": 5, "position": "bottom-right", "color": "#0a0a0a" },
        "rows": [ { "id": "sp-hero-r", "cols": 1, "gap": 0, "columns": [ { "id": "sp-hero-c", "widgets": [
          { "id": "sp-hero-ey", "type": "text", "seoTag": "p", "align": "left", "text": "EST. 2014 — DIG · SET · SPIKE", "animation": "fadeIn", "animDuration": 0.8, "fontSize": 14, "fontWeight": 800, "textColor": "#ea580c", "letterSpacing": 0.2, "lineHeight": 1.4, "paddingTop": 0, "paddingBottom": 26, "maxWidth": 1200 },
          { "id": "sp-hero-h1", "type": "text", "seoTag": "h1", "align": "left", "text": "우리는\n==코트==에서 증명한다", "textReveal": "char", "revealStagger": 0.018, "fontSize": 102, "fontWeight": 900, "textColor": "#0a0a0a", "highlightColor": "#ea580c", "lineHeight": 0.98, "letterSpacing": -0.045, "paddingTop": 0, "paddingBottom": 30, "maxWidth": 1200 },
          { "id": "sp-hero-sub", "type": "text", "seoTag": "p", "align": "left", "text": "주 1회 모여 공만 치고 끝나는 동아리가 아닙니다. 주 2회 정기 훈련과 3대학 연합 리그 —\n스파이크는 체육관에서 진짜 팀이 됩니다.", "animation": "blurIn", "animDuration": 1.0, "fontSize": 19, "fontWeight": 400, "textColor": "#44443d", "lineHeight": 1.7, "paddingTop": 0, "paddingBottom": 38, "maxWidth": 600 },
          { "id": "sp-hero-btn", "type": "button", "text": "2025 시즌 합류하기", "actionUrl": "", "btnTemplate": "hard", "btnSize": "l", "btnBg": "#ea580c", "btnTextColor": "#ffffff", "borderWidth": 2, "borderColor": "#0a0a0a", "radius": 0, "btnShadow": "hard", "btnAnim": "slideUp", "paddingY": 4 }
        ] } ] } ] },

      { "id": "sp-tick1", "type": "divider", "variant": "ticker", "tickerItems": ["GAME ON", "SET · SPIKE · WIN", "연합 리그", "주 2회 훈련", "DIG IT UP", "NO EXCUSES", "체육관 19:00", "ONE TEAM"], "separator": "◆", "speed": 20, "tickerFontSize": 15, "paddingY": 20, "bgColor": "#0a0a0a", "textColor": "#f5f3ec", "accentColor": "#ea580c", "tickerFade": true, "tickerPause": true },

      { "id": "sp-mani", "type": "section", "bgType": "color", "bgColor": "#ffffff", "paddingY": 164, "paddingX": 56, "gap": 0, "maxWidth": 1320,
        "rows": [ { "id": "sp-mani-r", "cols": 2, "gap": 56, "colRatios": [1, 2], "columns": [
          { "id": "sp-mani-c1", "widgets": [
            { "id": "sp-mani-lb", "type": "text", "seoTag": "p", "align": "left", "text": "(01)\nWHO WE ARE", "animation": "fadeIn", "fontSize": 14, "fontWeight": 800, "textColor": "#ea580c", "letterSpacing": 0.12, "lineHeight": 1.6, "paddingTop": 10, "paddingBottom": 0 }
          ] },
          { "id": "sp-mani-c2", "widgets": [
            { "id": "sp-mani-h", "type": "text", "seoTag": "h2", "align": "left", "text": "취미가 아니라, ==진짜 팀==입니다", "textReveal": "word", "revealStagger": 0.05, "fontSize": 56, "fontWeight": 900, "textColor": "#0a0a0a", "highlightColor": "#ea580c", "lineHeight": 1.1, "letterSpacing": -0.03, "paddingTop": 0, "paddingBottom": 22, "maxWidth": 840 },
            { "id": "sp-mani-p", "type": "text", "seoTag": "p", "align": "left", "text": "화·목 정기 훈련으로 매주 호흡을 맞춥니다. 춘계·추계 3대학 연합 리그에서 직접 코트에 서고, 한 경기의 피드백으로 다음 훈련을 시작합니다. 구경만 하다 끝나는 시즌은 여기 없습니다.", "animation": "slideUp", "animEasing": "power", "animDuration": 0.8, "fontSize": 18, "fontWeight": 400, "textColor": "#52514a", "lineHeight": 1.85, "paddingTop": 0, "paddingBottom": 0, "maxWidth": 720 }
          ] }
        ] } ] },

      { "id": "sp-stats", "type": "stats", "layout": "strip", "cols": 4, "paddingY": 128, "bgColor": "#0a0a0a", "valueColor": "#f5f3ec", "labelColor": "#fb923c", "valueSize": 92, "labelSize": 14, "animate": true, "countDuration": 2.6,
        "items": [ { "id": "sp-s1", "value": "3회", "label": "연합 리그 우승" }, { "id": "sp-s2", "value": "320+", "label": "누적 부원" }, { "id": "sp-s3", "value": "11년", "label": "이어진 동아리" }, { "id": "sp-s4", "value": "주2회", "label": "정기 훈련" } ] },

      { "id": "sp-court", "type": "section", "bgType": "image", "bgImage": "https://images.unsplash.com/photo-1592656094267-764a45160876?auto=format&fit=crop&w=2400&q=80", "bgKenBurns": "zoom", "bgGradOverlay": true, "bgOverlay": 54, "paddingY": 188, "paddingX": 56, "gap": 0, "maxWidth": 1100,
        "rows": [ { "id": "sp-court-r", "cols": 1, "columns": [ { "id": "sp-court-c", "widgets": [
          { "id": "sp-court-ey", "type": "text", "seoTag": "p", "align": "center", "text": "OUR ONLY RULE", "animation": "fadeIn", "fontSize": 13, "fontWeight": 800, "textColor": "#fdba74", "letterSpacing": 0.22, "paddingTop": 0, "paddingBottom": 22 },
          { "id": "sp-court-h", "type": "text", "seoTag": "h2", "align": "center", "text": "==DIG.== ==SET.== ==SPIKE.==", "textReveal": "word", "revealStagger": 0.08, "fontSize": 64, "fontWeight": 900, "textColor": "#ffffff", "highlightColor": "#ffffff", "lineHeight": 1.1, "letterSpacing": -0.02, "paddingTop": 0, "paddingBottom": 0, "maxWidth": 980 }
        ] } ] } ] },

      { "id": "sp-do", "type": "layoutContainer", "mode": "grid", "cols": 3, "gap": 18, "paddingY": 150, "paddingX": 56, "bgColor": "#f5f3ec", "maxWidth": 1280, "cellHover": "lift", "cellAnimation": "slideUp",
        "cells": [
          { "id": "sp-do1", "title": "주 2회 정기 훈련", "text": "화·목 19:00 학내 체육관. 기초 클래스부터 실전 세트 플레이까지 단계별로 함께합니다.", "align": "left", "bgColor": "#ffffff", "textColor": "#52514a", "titleColor": "#0a0a0a", "titleSize": 21, "textSize": 14, "padding": 30, "borderRadius": 0, "borderWidth": 2, "borderColor": "#0a0a0a", "imgSrc": "" },
          { "id": "sp-do2", "title": "3대학 연합 리그", "text": "춘계·추계 정기 리그와 지역 컵 대회. 실제 코트에서 직접 뛰며 시즌을 완성합니다.", "align": "left", "bgColor": "#ffffff", "textColor": "#52514a", "titleColor": "#0a0a0a", "titleSize": 21, "textSize": 14, "padding": 30, "borderRadius": 0, "borderWidth": 2, "borderColor": "#0a0a0a", "imgSrc": "" },
          { "id": "sp-do3", "title": "코트 밖 우정", "text": "월 1회 회식·MT·OB 매치까지. 졸업해도 이어지는 가장 진한 네트워크가 남습니다.", "align": "left", "bgColor": "#ffffff", "textColor": "#52514a", "titleColor": "#0a0a0a", "titleSize": 21, "textSize": 14, "padding": 30, "borderRadius": 0, "borderWidth": 2, "borderColor": "#0a0a0a", "imgSrc": "" }
        ] },

      { "id": "sp-big", "type": "section", "bgType": "color", "bgColor": "#f5f3ec", "paddingY": 104, "paddingX": 32, "gap": 0,
        "rows": [ { "id": "sp-big-r", "cols": 1, "columns": [ { "id": "sp-big-c", "widgets": [
          { "id": "sp-big-t", "type": "text", "seoTag": "p", "align": "center", "text": "GAME ON", "animation": "zoomIn", "animDuration": 0.9, "fontSize": 124, "fontWeight": 900, "textColor": "transparent", "textStroke": 2, "textStrokeColor": "#0a0a0a", "lineHeight": 1.0, "letterSpacing": -0.02, "paddingTop": 0, "paddingBottom": 0 }
        ] } ] } ] },

      { "id": "sp-feat", "type": "section", "bgType": "color", "bgColor": "#ffffff", "paddingY": 150, "paddingX": 56, "gap": 0, "maxWidth": 1320,
        "rows": [ { "id": "sp-feat-r", "cols": 2, "gap": 64, "colRatios": [1, 1], "columns": [
          { "id": "sp-feat-c1", "widgets": [
            { "id": "sp-feat-ey", "type": "text", "seoTag": "p", "align": "left", "text": "SEASON — 2024", "animation": "fadeIn", "fontSize": 13, "fontWeight": 800, "textColor": "#ea580c", "letterSpacing": 0.18, "paddingTop": 24, "paddingBottom": 14 },
            { "id": "sp-feat-h", "type": "text", "seoTag": "h2", "align": "left", "text": "춘계 결승\n풀세트 우승", "textReveal": "word", "revealStagger": 0.06, "fontSize": 46, "fontWeight": 900, "textColor": "#0a0a0a", "lineHeight": 1.1, "letterSpacing": -0.025, "paddingTop": 0, "paddingBottom": 18, "maxWidth": 560 },
            { "id": "sp-feat-p", "type": "text", "seoTag": "p", "align": "left", "text": "한양·고려·연세 3대학 연합 리그 결승. 2세트를 먼저 내주고도 끝까지 따라붙어 풀세트 끝에 우리가 이겼습니다. 한 학기의 훈련이 마지막 한 점으로 증명된 경기였습니다.", "animation": "blurIn", "animDuration": 0.9, "fontSize": 17, "fontWeight": 400, "textColor": "#52514a", "lineHeight": 1.8, "paddingTop": 0, "paddingBottom": 26, "maxWidth": 540 },
            { "id": "sp-feat-btn", "type": "button", "text": "경기 하이라이트 →", "actionUrl": "", "btnTemplate": "outline", "btnSize": "m", "btnBg": "transparent", "btnTextColor": "#0a0a0a", "borderWidth": 2, "borderColor": "#0a0a0a", "radius": 0, "btnShadow": "none", "paddingY": 4 }
          ] },
          { "id": "sp-feat-c2", "widgets": [ { "id": "sp-feat-img", "type": "image", "src": "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1400&q=80", "alt": "2024 춘계 결승", "width": 100, "aspect": "4/3", "objectFit": "cover", "radius": 0, "align": "center" } ] }
        ] } ] },

      { "id": "sp-tick2", "type": "divider", "variant": "ticker", "tickerItems": ["서브", "리시브", "토스", "스파이크", "블로킹", "원팀 → 한 점"], "separator": "/", "speed": 26, "tickerFontSize": 14, "paddingY": 18, "bgColor": "#ea580c", "textColor": "#0a0a0a", "accentColor": "rgba(10,10,10,0.45)", "tickerReverse": true, "tickerFade": true },

      { "id": "sp-proc", "type": "timeline", "title": "합류까지 4단계", "layout": "horizontal", "activeColor": "#ea580c", "lineColor": "#0a0a0a", "paddingY": 130, "bgColor": "#f5f3ec",
        "nodes": [ { "id": "sp-p1", "title": "지원", "desc": "포지션·경험 무관 한 줄" }, { "id": "sp-p2", "title": "체험 훈련", "desc": "화·목 체육관에서 같이" }, { "id": "sp-p3", "title": "대화", "desc": "팀과 30분" }, { "id": "sp-p4", "title": "첫 시즌", "desc": "바로 코트로" } ] },

      { "id": "sp-faq", "type": "faq", "title": "자주 묻는 질문", "iconStyle": "plus", "openBg": "#ffffff", "paddingY": 120, "borderRadius": 0,
        "items": [
          { "id": "sp-f1", "question": "초보자도 가능한가요?", "answer": "네. 매 시즌 약 30%가 입회 전 배구 경험이 없습니다. 기초 클래스를 별도로 운영해 첫 훈련부터 함께합니다." },
          { "id": "sp-f2", "question": "회비와 활동비가 얼마인가요?", "answer": "학기당 회비 60,000원(체육관 대관·유니폼·간식). 합숙·리그 출전 시 별도 비용이 발생합니다." },
          { "id": "sp-f3", "question": "여자 부원도 활동 가능한가요?", "answer": "네. 혼성 팀과 여자부 팀을 별도로 운영하고, 리그도 혼성·여자부 둘 다 출전합니다." }
        ] },

      { "id": "sp-cta", "type": "section", "bgType": "color", "bgColor": "#ea580c", "paddingY": 168, "paddingX": 56, "gap": 0, "maxWidth": 1100,
        "bgWatermark": { "text": "JOIN", "fontSize": 300, "opacity": 12, "position": "center", "color": "#ffffff" },
        "rows": [ { "id": "sp-cta-r", "cols": 1, "columns": [ { "id": "sp-cta-c", "widgets": [
          { "id": "sp-cta-h", "type": "text", "seoTag": "h2", "align": "center", "text": "지금, ==코트로== 나올 시간입니다", "textReveal": "char", "revealStagger": 0.022, "fontSize": 60, "fontWeight": 900, "textColor": "#ffffff", "highlightColor": "#0a0a0a", "lineHeight": 1.1, "letterSpacing": -0.03, "paddingTop": 0, "paddingBottom": 30, "maxWidth": 900 },
          { "id": "sp-cta-btn", "type": "button", "text": "2025 시즌 합류하기", "actionUrl": "", "btnTemplate": "hard", "btnSize": "l", "btnBg": "#0a0a0a", "btnTextColor": "#ffffff", "borderWidth": 2, "borderColor": "#0a0a0a", "radius": 0, "btnShadow": "hard", "btnAnim": "slideUp", "paddingY": 4 }
        ] } ] } ] }
    ]
  }$sp$::jsonb,
  $sp${ "config": {}, "blocks": [] }$sp$::jsonb,
  now(), now());

  UPDATE public.club_pages SET draft = blocks WHERE club_id = v_sp_id;
END $$;
