-- ─────────────────────────────────────────────────────────────────
-- 기업급 데모 페이지 v3 — 코드웨이브 / 프레임 / 바이브 디자인
--   현행 위젯(section·text·heroSlider·layoutContainer·stats·timeline·
--   faq·image·button·divider[line/ticker]·spacer·countdown)만으로 구성.
--   섹션 배경 장식(워터마크·데코 셰이프)·탭·캐러셀·통계 카운트업 활용.
--   데이터(JSON)만 — 렌더러/빌더 코드 변경 없음.
--   payload 형태: club_pages.blocks/draft = { "config":{...}, "blocks":[...] }
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_codewave_id uuid;
  v_frame_id    uuid;
  v_vibe_id     uuid;
BEGIN
  SELECT id INTO v_codewave_id FROM public.clubs WHERE slug = 'codewave';
  SELECT id INTO v_frame_id    FROM public.clubs WHERE slug = 'frame';
  SELECT id INTO v_vibe_id     FROM public.clubs WHERE slug = 'vibe-design';

  -- 멱등성: 기존 페이지 삭제 후 재삽입
  DELETE FROM public.club_pages WHERE club_id IN (v_codewave_id, v_frame_id, v_vibe_id);

  -- ════════════════ 코드웨이브 — 라이트/오렌지, 테크 SaaS 톤 ════════════════
  IF v_codewave_id IS NOT NULL THEN
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
      "pageBgColor": "#ffffff",
      "pageTitle": "코드웨이브 | 실전 프로덕트를 출시하는 개발 동아리",
      "pageDesc": "기획부터 배포까지 한 학기에 완성하는 학생 개발 동아리"
    },
    "blocks": [
      { "id": "cw-hero", "type": "heroSlider", "height": 84, "h1Size": 64, "subtitleSize": 19, "slideAnim": "fade", "autoPlay": false,
        "slides": [ { "id": "cw-s1", "bgType": "image", "bgValue": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=2400&q=80", "overlayOpacity": 64, "align": "left", "h1": "코드로\n==진짜 제품==을 만든다", "subtitle": "기획부터 배포까지 — 한 학기에 출시하는 학생 개발 동아리, 코드웨이브" } ] },

      { "id": "cw-tick", "type": "divider", "variant": "ticker", "tickerItems": ["창립 2018", "출시 프로젝트 50+", "현업 취업 35+", "누적 멤버 240+", "주간 코드 리뷰", "현업 멘토 40명"], "separator": "/", "speed": 24, "tickerFontSize": 13, "paddingY": 16, "bgColor": "#f97316", "textColor": "#ffffff", "accentColor": "rgba(255,255,255,0.5)", "tickerFade": true, "tickerPause": true },

      { "id": "cw-intro", "type": "section", "bgType": "color", "bgColor": "#ffffff", "paddingY": 112, "paddingX": 32, "gap": 18,
        "bgWatermark": { "text": "CODEWAVE", "fontSize": 270, "opacity": 5, "position": "center", "color": "#0f172a" },
        "rows": [ { "id": "cw-intro-r", "cols": 1, "gap": 24, "columns": [ { "id": "cw-intro-c", "widgets": [
          { "id": "cw-intro-t1", "type": "text", "seoTag": "h2", "align": "center", "text": "단순한 스터디가 아닙니다", "textReveal": "word", "revealStagger": 0.05, "fontSize": 44, "fontWeight": 900, "textColor": "#0f172a", "lineHeight": 1.2, "letterSpacing": -0.02, "paddingTop": 0, "paddingBottom": 18, "maxWidth": 860 },
          { "id": "cw-intro-t2", "type": "text", "seoTag": "p", "align": "center", "text": "실사용자가 들어오는 서비스를 직접 기획하고, 개발하고, 배포합니다.\n한 학기 안에 끝까지 — 끝나지 않는 사이드 프로젝트와는 다릅니다.", "animation": "blurIn", "animDuration": 0.9, "fontSize": 18, "textColor": "#64748b", "lineHeight": 1.85, "paddingTop": 0, "paddingBottom": 0, "maxWidth": 640 }
        ] } ] } ] },

      { "id": "cw-stats", "type": "stats", "layout": "strip", "cols": 4, "paddingY": 76, "bgColor": "#0f172a", "valueColor": "#ffffff", "labelColor": "#94a3b8", "valueSize": 54, "labelSize": 13, "animate": true, "countDuration": 2.2,
        "items": [ { "id": "cw-st1", "value": "50+", "label": "출시 프로젝트" }, { "id": "cw-st2", "value": "240+", "label": "누적 멤버" }, { "id": "cw-st3", "value": "35+", "label": "현업 취업" }, { "id": "cw-st4", "value": "8년", "label": "운영 역사" } ] },

      { "id": "cw-do", "type": "layoutContainer", "mode": "grid", "cols": 3, "gap": 20, "paddingY": 96, "paddingX": 40, "bgColor": "#f8fafc", "maxWidth": 1180,
        "cells": [
          { "id": "cw-do1", "title": "실전 프로젝트", "text": "4~5인 팀으로 한 학기에 한 개의 서비스를 기획부터 배포까지 완성합니다.", "align": "left", "bgColor": "#ffffff", "textColor": "#475569", "titleColor": "#0f172a", "titleSize": 19, "textSize": 14, "padding": 28, "borderRadius": 14, "borderWidth": 1, "borderColor": "#e2e8f0", "imgSrc": "", "imgPosition": "top", "imgHeight": 160 },
          { "id": "cw-do2", "title": "주간 코드 리뷰", "text": "PR 기반 동료 피드백으로 코드 품질과 협업 감각을 함께 키웁니다.", "align": "left", "bgColor": "#ffffff", "textColor": "#475569", "titleColor": "#0f172a", "titleSize": 19, "textSize": 14, "padding": 28, "borderRadius": 14, "borderWidth": 1, "borderColor": "#e2e8f0", "imgSrc": "", "imgPosition": "top", "imgHeight": 160 },
          { "id": "cw-do3", "title": "현업 멘토링", "text": "네카라쿠배 현직자 멘토와 1:1 커리어·기술 멘토링을 진행합니다.", "align": "left", "bgColor": "#ffffff", "textColor": "#475569", "titleColor": "#0f172a", "titleSize": 19, "textSize": 14, "padding": 28, "borderRadius": 14, "borderWidth": 1, "borderColor": "#e2e8f0", "imgSrc": "", "imgPosition": "top", "imgHeight": 160 }
        ] },

      { "id": "cw-feat", "type": "section", "bgType": "color", "bgColor": "#0f172a", "paddingY": 104, "paddingX": 48, "gap": 32,
        "bgShape": { "type": "blob", "size": 540, "color": "#f97316", "x": 94, "y": 16, "opacity": 14 },
        "rows": [ { "id": "cw-feat-r", "cols": 2, "gap": 48, "colRatios": [1, 1], "columns": [
          { "id": "cw-feat-c1", "widgets": [ { "id": "cw-feat-img", "type": "image", "src": "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=80", "alt": "대표 프로젝트", "width": 100, "aspect": "4/3", "objectFit": "cover", "radius": 16, "align": "center" } ] },
          { "id": "cw-feat-c2", "widgets": [
            { "id": "cw-feat-t0", "type": "text", "seoTag": "p", "text": "FEATURED PROJECT", "fontSize": 13, "fontWeight": 800, "textColor": "#f97316", "letterSpacing": 0.15, "paddingTop": 12, "paddingBottom": 8 },
            { "id": "cw-feat-t1", "type": "text", "seoTag": "h2", "text": "MaeumLog — 감정 기록 PWA", "fontSize": 34, "fontWeight": 900, "textColor": "#ffffff", "lineHeight": 1.25, "paddingTop": 0, "paddingBottom": 14 },
            { "id": "cw-feat-t2", "type": "text", "seoTag": "p", "text": "출시 첫 달 1,200 DAU를 달성한 감정 기록 앱. 기획·디자인·개발·배포까지 한 팀이 16주 만에 완성했습니다.", "fontSize": 16, "textColor": "#cbd5e1", "lineHeight": 1.8, "paddingTop": 0, "paddingBottom": 20 },
            { "id": "cw-feat-btn", "type": "button", "text": "케이스 스터디 보기", "actionUrl": "", "btnSize": "m", "btnBg": "#f97316", "btnTextColor": "#0f172a", "borderWidth": 0, "radius": 8, "btnShadow": "none", "paddingY": 4 }
          ] }
        ] } ] },

      { "id": "cw-track", "type": "layoutContainer", "mode": "tabs", "tabPosition": "top", "paddingY": 96, "bgColor": "#ffffff", "maxWidth": 980, "activeTabBg": "#f97316", "activeTabText": "#ffffff", "tabText": "#64748b", "tabBorderColor": "#e2e8f0",
        "cells": [
          { "id": "cw-tk1", "tabLabel": "Frontend", "title": "프론트엔드 트랙", "text": "React · TypeScript · 디자인 시스템. 컴포넌트 설계와 상태관리, 접근성까지 실서비스 수준으로 다룹니다.", "align": "left", "bgColor": "#ffffff", "textColor": "#475569", "titleColor": "#0f172a", "titleSize": 22, "textSize": 15, "padding": 8, "imgSrc": "" },
          { "id": "cw-tk2", "tabLabel": "Backend", "title": "백엔드 트랙", "text": "Node · PostgreSQL · 클라우드 배포. API 설계, 인증, 데이터 모델링과 CI/CD 파이프라인을 구축합니다.", "align": "left", "bgColor": "#ffffff", "textColor": "#475569", "titleColor": "#0f172a", "titleSize": 22, "textSize": 15, "padding": 8, "imgSrc": "" },
          { "id": "cw-tk3", "tabLabel": "Product", "title": "프로덕트 트랙", "text": "유저 리서치 · 지표 설계 · 그로스. 만들 가치가 있는 것을 정의하고 출시 후 데이터로 검증합니다.", "align": "left", "bgColor": "#ffffff", "textColor": "#475569", "titleColor": "#0f172a", "titleSize": 22, "textSize": 15, "padding": 8, "imgSrc": "" }
        ] },

      { "id": "cw-proc", "type": "timeline", "title": "지원부터 합류까지", "layout": "horizontal", "activeColor": "#f97316", "lineColor": "#0f172a", "paddingY": 92, "bgColor": "#f8fafc",
        "nodes": [ { "id": "cw-p1", "title": "서류 지원", "desc": "자기소개와 관심 분야" }, { "id": "cw-p2", "title": "코딩 과제", "desc": "기초 과제로 협업 핏 확인" }, { "id": "cw-p3", "title": "인터뷰", "desc": "팀과 30분 대화" }, { "id": "cw-p4", "title": "합류", "desc": "첫 프로젝트 매칭" } ] },

      { "id": "cw-faq", "type": "faq", "title": "자주 묻는 질문", "iconStyle": "plus", "openBg": "#fff7ed", "paddingY": 92, "borderRadius": 0,
        "items": [
          { "id": "cw-f1", "question": "개발 경험이 없어도 지원할 수 있나요?", "answer": "네. 기초 트랙과 멘토링으로 비전공자도 한 학기 안에 프로젝트를 완성합니다." },
          { "id": "cw-f2", "question": "활동 빈도는 어떻게 되나요?", "answer": "주 1회 정기 세션 2시간과 팀별 자율 협업으로 운영됩니다." },
          { "id": "cw-f3", "question": "회비가 있나요?", "answer": "학기당 운영비가 있으며 서버·도메인 등 실비로 사용됩니다." }
        ] },

      { "id": "cw-cta", "type": "section", "bgType": "image", "bgImage": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2400&q=80", "bgKenBurns": "zoom", "bgGradOverlay": true, "bgOverlay": 55, "paddingY": 132, "paddingX": 32, "gap": 22,
        "bgWatermark": { "text": "JOIN US", "fontSize": 220, "opacity": 12, "position": "center", "color": "#ffffff" },
        "rows": [ { "id": "cw-cta-r", "cols": 1, "columns": [ { "id": "cw-cta-c", "widgets": [
          { "id": "cw-cta-t1", "type": "text", "seoTag": "h2", "align": "center", "text": "13기, 지금 함께할 사람을 찾습니다", "textReveal": "char", "revealStagger": 0.025, "fontSize": 40, "fontWeight": 900, "textColor": "#ffffff", "lineHeight": 1.25, "paddingTop": 0, "paddingBottom": 18, "maxWidth": 760 },
          { "id": "cw-cta-btn", "type": "button", "text": "지원하기", "actionUrl": "", "btnSize": "l", "btnBg": "#0f172a", "btnTextColor": "#ffffff", "borderWidth": 0, "radius": 10, "btnShadow": "soft", "paddingY": 4 }
        ] } ] } ] }
    ]
  }$cw$::jsonb,
  $cw${
    "config": { "activeTheme": "custom:#f97316", "clubName": "CODEWAVE", "badgeText": "13기 모집중", "showFloatingBtn": true, "contentWidth": "full", "pageBgColor": "#ffffff", "pageTitle": "코드웨이브 | 실전 프로덕트를 출시하는 개발 동아리", "pageDesc": "기획부터 배포까지 한 학기에 완성하는 학생 개발 동아리" },
    "blocks": []
  }$cw$::jsonb,
  now(), now());
  -- draft 는 published 와 동일하게 맞춘다 (위 두 번째 인자를 실제 페이로드로 교체)
  UPDATE public.club_pages SET draft = blocks WHERE club_id = v_codewave_id;
  END IF;

  -- ════════════════ 프레임 — 다크 에디토리얼, 사진 중심 ════════════════
  IF v_frame_id IS NOT NULL THEN
  INSERT INTO public.club_pages (club_id, blocks, draft, published_at, updated_at)
  VALUES (v_frame_id,
  $fr${
    "config": {
      "activeTheme": "custom:#fbbf24",
      "clubName": "FRAME",
      "badgeText": "신입 부원 모집",
      "showFloatingBtn": true,
      "smoothScroll": true,
      "contentWidth": "full",
      "pageBgColor": "#0a0a0a",
      "pageTitle": "프레임 | 한 장의 사진으로 세상을 다시 보는 사람들",
      "pageDesc": "출사·전시·비평으로 함께 성장하는 사진 동아리"
    },
    "blocks": [
      { "id": "fr-hero", "type": "heroSlider", "height": 86, "h1Size": 66, "subtitleSize": 19, "slideAnim": "fade", "autoPlay": false,
        "slides": [ { "id": "fr-s1", "bgType": "image", "bgValue": "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=2400&q=80", "overlayOpacity": 52, "align": "left", "h1": "세상을\n==다시== 본다", "subtitle": "한 장의 사진으로 시선을 바꾸는 사람들 — 프레임" } ] },

      { "id": "fr-tick", "type": "divider", "variant": "ticker", "tickerItems": ["창립 2016", "정기 전시 24회", "공모전 수상 12건", "누적 멤버 180+", "월간 출사", "암실 워크숍"], "separator": "·", "speed": 26, "tickerFontSize": 13, "paddingY": 16, "bgColor": "#fbbf24", "textColor": "#0a0a0a", "accentColor": "rgba(10,10,10,0.45)", "tickerReverse": true, "tickerFade": true },

      { "id": "fr-intro", "type": "section", "bgType": "image", "bgImage": "https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?auto=format&fit=crop&w=2400&q=80", "bgKenBurns": "panR", "bgGradOverlay": true, "bgOverlay": 48, "paddingY": 148, "paddingX": 32, "gap": 18,
        "bgWatermark": { "text": "FRAME", "fontSize": 320, "opacity": 8, "position": "center", "color": "#ffffff" },
        "rows": [ { "id": "fr-intro-r", "cols": 1, "gap": 24, "columns": [ { "id": "fr-intro-c", "widgets": [
          { "id": "fr-intro-t1", "type": "text", "seoTag": "h2", "align": "center", "text": "잘 찍는 법이 아니라, ==보는 법==을 배웁니다", "textReveal": "word", "revealStagger": 0.05, "fontSize": 44, "fontWeight": 900, "textColor": "#ffffff", "lineHeight": 1.25, "letterSpacing": -0.02, "paddingTop": 0, "paddingBottom": 18, "maxWidth": 880 },
          { "id": "fr-intro-t2", "type": "text", "seoTag": "p", "align": "center", "text": "장비가 아니라 시선이 사진을 만듭니다.\n출사에서 찍고, 합평에서 깨지고, 전시에서 완성합니다.", "animation": "clipUp", "animDuration": 0.8, "fontSize": 18, "textColor": "#d4d4d4", "lineHeight": 1.85, "paddingTop": 0, "paddingBottom": 0, "maxWidth": 640 }
        ] } ] } ] },

      { "id": "fr-stats", "type": "stats", "layout": "strip", "cols": 4, "paddingY": 76, "bgColor": "#111111", "valueColor": "#fbbf24", "labelColor": "#a3a3a3", "valueSize": 54, "labelSize": 13, "animate": true, "countDuration": 2.6,
        "items": [ { "id": "fr-st1", "value": "24회", "label": "정기 전시" }, { "id": "fr-st2", "value": "180+", "label": "누적 멤버" }, { "id": "fr-st3", "value": "12건", "label": "공모전 수상" }, { "id": "fr-st4", "value": "9년", "label": "운영 역사" } ] },

      { "id": "fr-gallery", "type": "layoutContainer", "mode": "carousel", "cols": 3, "gap": 16, "paddingY": 96, "paddingX": 40, "bgColor": "#0a0a0a", "maxWidth": 1240, "autoplay": true, "interval": 4000, "activeTabBg": "#fbbf24",
        "cells": [
          { "id": "fr-g1", "title": "도시의 새벽", "text": "거리 · 2024", "align": "left", "bgColor": "#111111", "textColor": "#a3a3a3", "titleColor": "#ffffff", "titleSize": 16, "textSize": 12, "padding": 16, "borderRadius": 12, "borderWidth": 0, "borderColor": "#262626", "imgSrc": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80", "imgPosition": "top", "imgHeight": 240 },
          { "id": "fr-g2", "title": "고요한 산", "text": "풍경 · 2024", "align": "left", "bgColor": "#111111", "textColor": "#a3a3a3", "titleColor": "#ffffff", "titleSize": 16, "textSize": 12, "padding": 16, "borderRadius": 12, "borderWidth": 0, "borderColor": "#262626", "imgSrc": "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80", "imgPosition": "top", "imgHeight": 240 },
          { "id": "fr-g3", "title": "시선", "text": "인물 · 2023", "align": "left", "bgColor": "#111111", "textColor": "#a3a3a3", "titleColor": "#ffffff", "titleSize": 16, "textSize": 12, "padding": 16, "borderRadius": 12, "borderWidth": 0, "borderColor": "#262626", "imgSrc": "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=1200&q=80", "imgPosition": "top", "imgHeight": 240 },
          { "id": "fr-g4", "title": "빛과 구조", "text": "건축 · 2023", "align": "left", "bgColor": "#111111", "textColor": "#a3a3a3", "titleColor": "#ffffff", "titleSize": 16, "textSize": 12, "padding": 16, "borderRadius": 12, "borderWidth": 0, "borderColor": "#262626", "imgSrc": "https://images.unsplash.com/photo-1486718448742-163732cd1544?auto=format&fit=crop&w=1200&q=80", "imgPosition": "top", "imgHeight": 240 },
          { "id": "fr-g5", "title": "거리의 색", "text": "거리 · 2023", "align": "left", "bgColor": "#111111", "textColor": "#a3a3a3", "titleColor": "#ffffff", "titleSize": 16, "textSize": 12, "padding": 16, "borderRadius": 12, "borderWidth": 0, "borderColor": "#262626", "imgSrc": "https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&w=1200&q=80", "imgPosition": "top", "imgHeight": 240 }
        ] },

      { "id": "fr-genre", "type": "layoutContainer", "mode": "tabs", "tabPosition": "top", "paddingY": 96, "bgColor": "#0a0a0a", "maxWidth": 980, "activeTabBg": "#fbbf24", "activeTabText": "#0a0a0a", "tabText": "#a3a3a3", "tabBorderColor": "#262626",
        "cells": [
          { "id": "fr-ge1", "tabLabel": "인물", "title": "인물 · 포트레이트", "text": "조명과 거리, 그리고 관계. 사람의 한 순간을 담는 법을 배웁니다. 스튜디오 세션과 자연광 촬영을 함께 다룹니다.", "align": "left", "bgColor": "#0a0a0a", "textColor": "#d4d4d4", "titleColor": "#ffffff", "titleSize": 22, "textSize": 15, "padding": 8, "imgSrc": "" },
          { "id": "fr-ge2", "tabLabel": "거리", "title": "거리 · 스트리트", "text": "예측할 수 없는 순간을 기다리는 법. 도시를 읽고 결정적 순간을 포착하는 감각을 키웁니다.", "align": "left", "bgColor": "#0a0a0a", "textColor": "#d4d4d4", "titleColor": "#ffffff", "titleSize": 22, "textSize": 15, "padding": 8, "imgSrc": "" },
          { "id": "fr-ge3", "tabLabel": "풍경", "title": "풍경 · 랜드스케이프", "text": "빛의 시간을 읽고 기다립니다. 구도와 노출, 후보정까지 한 장의 완성도를 끌어올립니다.", "align": "left", "bgColor": "#0a0a0a", "textColor": "#d4d4d4", "titleColor": "#ffffff", "titleSize": 22, "textSize": 15, "padding": 8, "imgSrc": "" }
        ] },

      { "id": "fr-proc", "type": "timeline", "title": "활동은 이렇게 흐릅니다", "layout": "horizontal", "activeColor": "#fbbf24", "lineColor": "#fbbf24", "paddingY": 92, "bgColor": "#111111",
        "nodes": [ { "id": "fr-p1", "title": "월간 출사", "desc": "테마를 정해 함께 촬영" }, { "id": "fr-p2", "title": "합평", "desc": "서로의 사진을 비평" }, { "id": "fr-p3", "title": "셀렉·편집", "desc": "한 장을 고르고 다듬기" }, { "id": "fr-p4", "title": "전시", "desc": "반기 정기 전시로 마무리" } ] },

      { "id": "fr-faq", "type": "faq", "title": "자주 묻는 질문", "iconStyle": "arrow", "openBg": "#1c1917", "paddingY": 92, "borderRadius": 0,
        "items": [
          { "id": "fr-f1", "question": "DSLR이 꼭 있어야 하나요?", "answer": "아니요. 입문은 스마트폰으로도 충분합니다. 장비보다 시선을 먼저 배웁니다." },
          { "id": "fr-f2", "question": "사진 경험이 전혀 없어도 되나요?", "answer": "네. 기초 워크숍과 합평으로 처음 시작하는 분도 한 학기면 전시에 작품을 겁니다." },
          { "id": "fr-f3", "question": "활동은 얼마나 자주 하나요?", "answer": "월 1회 정기 출사와 격주 합평, 반기 전시로 운영됩니다." }
        ] },

      { "id": "fr-cta", "type": "section", "bgType": "color", "bgColor": "#fbbf24", "paddingY": 116, "paddingX": 32, "gap": 22,
        "bgWatermark": { "text": "SHOOT", "fontSize": 240, "opacity": 10, "position": "center", "color": "#0a0a0a" },
        "rows": [ { "id": "fr-cta-r", "cols": 1, "columns": [ { "id": "fr-cta-c", "widgets": [
          { "id": "fr-cta-t1", "type": "text", "seoTag": "h2", "align": "center", "text": "당신의 시선을 전시할 차례입니다", "textReveal": "word", "revealStagger": 0.06, "fontSize": 40, "fontWeight": 900, "textColor": "#0a0a0a", "lineHeight": 1.25, "paddingTop": 0, "paddingBottom": 18, "maxWidth": 760 },
          { "id": "fr-cta-btn", "type": "button", "text": "부원 지원하기", "actionUrl": "", "btnSize": "l", "btnBg": "#0a0a0a", "btnTextColor": "#ffffff", "borderWidth": 0, "radius": 10, "btnShadow": "soft", "paddingY": 4 }
        ] } ] } ] }
    ]
  }$fr$::jsonb,
  $fr${ "config": {}, "blocks": [] }$fr$::jsonb,
  now(), now());
  UPDATE public.club_pages SET draft = blocks WHERE club_id = v_frame_id;
  END IF;

  -- ════════════════ 바이브 디자인 — 라이트/핑크, 크리에이티브 ════════════════
  IF v_vibe_id IS NOT NULL THEN
  INSERT INTO public.club_pages (club_id, blocks, draft, published_at, updated_at)
  VALUES (v_vibe_id,
  $vb${
    "config": {
      "activeTheme": "custom:#ec4899",
      "clubName": "VIBE DESIGN",
      "badgeText": "9기 리크루팅",
      "showFloatingBtn": true,
      "smoothScroll": true,
      "contentWidth": "full",
      "pageBgColor": "#ffffff",
      "pageTitle": "바이브 디자인 | 브랜드와 경험을 디자인하는 크리에이티브 그룹",
      "pageDesc": "브랜딩·UXUI·모션을 실전 프로젝트로 다루는 디자인 동아리"
    },
    "blocks": [
      { "id": "vb-hero", "type": "heroSlider", "height": 84, "h1Size": 64, "subtitleSize": 19, "slideAnim": "fade", "autoPlay": false,
        "slides": [ { "id": "vb-s1", "bgType": "image", "bgValue": "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=2400&q=80", "overlayOpacity": 50, "align": "left", "h1": "브랜드에\n==감각==을 입히다", "subtitle": "브랜딩부터 UXUI, 모션까지 — 경험을 디자인하는 크리에이티브 그룹, 바이브 디자인" } ] },

      { "id": "vb-tick", "type": "divider", "variant": "ticker", "tickerItems": ["창립 2017", "클라이언트 프로젝트 40+", "수상 18건", "누적 멤버 210+", "주간 크리틱", "포트폴리오 데이"], "separator": "✶", "speed": 24, "tickerFontSize": 13, "paddingY": 16, "bgColor": "#ec4899", "textColor": "#ffffff", "accentColor": "rgba(255,255,255,0.55)", "tickerFade": true, "tickerPause": true },

      { "id": "vb-intro", "type": "section", "bgType": "color", "bgColor": "#ffffff", "paddingY": 112, "paddingX": 32, "gap": 18,
        "bgShape": { "type": "circle", "size": 460, "color": "#ec4899", "x": 12, "y": 22, "opacity": 10 },
        "bgWatermark": { "text": "VIBE", "fontSize": 300, "opacity": 5, "position": "bottom-right", "color": "#ec4899" },
        "rows": [ { "id": "vb-intro-r", "cols": 1, "gap": 24, "columns": [ { "id": "vb-intro-c", "widgets": [
          { "id": "vb-intro-t1", "type": "text", "seoTag": "h2", "align": "center", "text": "예쁜 것을 넘어, ==팔리는== 디자인", "textReveal": "char", "revealStagger": 0.03, "fontSize": 44, "fontWeight": 900, "textColor": "#0f172a", "lineHeight": 1.2, "letterSpacing": -0.02, "paddingTop": 0, "paddingBottom": 18, "maxWidth": 860 },
          { "id": "vb-intro-t2", "type": "text", "seoTag": "p", "align": "center", "text": "문제를 정의하고, 브랜드를 설계하고, 사용자의 경험으로 증명합니다.\n실제 클라이언트와 함께 결과로 말하는 디자인을 합니다.", "animation": "slideRight", "animEasing": "back", "animDuration": 0.7, "animDistance": 40, "fontSize": 18, "textColor": "#64748b", "lineHeight": 1.85, "paddingTop": 0, "paddingBottom": 0, "maxWidth": 640 }
        ] } ] } ] },

      { "id": "vb-stats", "type": "stats", "layout": "cards", "cols": 4, "paddingY": 80, "bgColor": "#fdf2f8", "valueColor": "#be185d", "labelColor": "#9d174d", "valueSize": 50, "labelSize": 13, "animate": true, "countDuration": 2.4, "cardBg": "#ffffff", "borderColor": "#fbcfe8", "accentLineColor": "#ec4899",
        "items": [ { "id": "vb-st1", "value": "40+", "label": "클라이언트 프로젝트" }, { "id": "vb-st2", "value": "210+", "label": "누적 멤버" }, { "id": "vb-st3", "value": "18건", "label": "디자인 어워드" }, { "id": "vb-st4", "value": "7년", "label": "운영 역사" } ] },

      { "id": "vb-svc", "type": "layoutContainer", "mode": "grid", "cols": 3, "gap": 20, "paddingY": 96, "paddingX": 40, "bgColor": "#ffffff", "maxWidth": 1180,
        "cells": [
          { "id": "vb-sv1", "title": "브랜드 아이덴티티", "text": "네이밍부터 로고, 컬러, 타이포까지 일관된 브랜드 시스템을 설계합니다.", "align": "left", "bgColor": "#fdf2f8", "textColor": "#831843", "titleColor": "#be185d", "titleSize": 19, "textSize": 14, "padding": 28, "borderRadius": 16, "borderWidth": 0, "borderColor": "#fbcfe8", "imgSrc": "", "imgPosition": "top", "imgHeight": 160 },
          { "id": "vb-sv2", "title": "UX · UI 디자인", "text": "리서치 기반으로 화면을 설계하고 프로토타입으로 검증합니다.", "align": "left", "bgColor": "#fdf2f8", "textColor": "#831843", "titleColor": "#be185d", "titleSize": 19, "textSize": 14, "padding": 28, "borderRadius": 16, "borderWidth": 0, "borderColor": "#fbcfe8", "imgSrc": "", "imgPosition": "top", "imgHeight": 160 },
          { "id": "vb-sv3", "title": "모션 · 인터랙션", "text": "브랜드에 생동감을 더하는 모션 그래픽과 마이크로 인터랙션을 다룹니다.", "align": "left", "bgColor": "#fdf2f8", "textColor": "#831843", "titleColor": "#be185d", "titleSize": 19, "textSize": 14, "padding": 28, "borderRadius": 16, "borderWidth": 0, "borderColor": "#fbcfe8", "imgSrc": "", "imgPosition": "top", "imgHeight": 160 }
        ] },

      { "id": "vb-feat", "type": "section", "bgType": "gradient", "bgGradient": { "from": "#ec4899", "to": "#a21caf", "angle": 130 }, "paddingY": 104, "paddingX": 48, "gap": 32,
        "bgShape": { "type": "blob", "size": 560, "color": "#ffffff", "x": 90, "y": 80, "opacity": 12 },
        "rows": [ { "id": "vb-feat-r", "cols": 2, "gap": 48, "colRatios": [1, 1], "columns": [
          { "id": "vb-feat-c2", "widgets": [
            { "id": "vb-feat-t0", "type": "text", "seoTag": "p", "text": "FEATURED WORK", "fontSize": 13, "fontWeight": 800, "textColor": "#fbcfe8", "letterSpacing": 0.15, "paddingTop": 12, "paddingBottom": 8 },
            { "id": "vb-feat-t1", "type": "text", "seoTag": "h2", "text": "로컬 카페 브랜드 리뉴얼", "fontSize": 34, "fontWeight": 900, "textColor": "#ffffff", "lineHeight": 1.25, "paddingTop": 0, "paddingBottom": 14 },
            { "id": "vb-feat-t2", "type": "text", "seoTag": "p", "text": "방문 전환율 38% 상승. 브랜드 전략부터 패키지, 공간 그래픽까지 6주 만에 통합 리뉴얼했습니다.", "fontSize": 16, "textColor": "#fce7f3", "lineHeight": 1.8, "paddingTop": 0, "paddingBottom": 20 },
            { "id": "vb-feat-btn", "type": "button", "text": "포트폴리오 보기", "actionUrl": "", "btnSize": "m", "btnBg": "#ffffff", "btnTextColor": "#be185d", "borderWidth": 0, "radius": 8, "btnShadow": "none", "paddingY": 4 }
          ] },
          { "id": "vb-feat-c1", "widgets": [ { "id": "vb-feat-img", "type": "image", "src": "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1400&q=80", "alt": "대표 작업", "width": 100, "aspect": "4/3", "objectFit": "cover", "radius": 16, "align": "center" } ] }
        ] } ] },

      { "id": "vb-proc", "type": "timeline", "title": "디자인 프로세스", "layout": "horizontal", "activeColor": "#ec4899", "lineColor": "#831843", "paddingY": 92, "bgColor": "#ffffff",
        "nodes": [ { "id": "vb-p1", "title": "Discover", "desc": "리서치와 문제 정의" }, { "id": "vb-p2", "title": "Define", "desc": "브랜드 전략 수립" }, { "id": "vb-p3", "title": "Design", "desc": "비주얼과 화면 설계" }, { "id": "vb-p4", "title": "Deliver", "desc": "검증과 핸드오프" } ] },

      { "id": "vb-faq", "type": "faq", "title": "자주 묻는 질문", "iconStyle": "plus", "openBg": "#fdf2f8", "paddingY": 92, "borderRadius": 0,
        "items": [
          { "id": "vb-f1", "question": "디자인 전공이 아니어도 되나요?", "answer": "네. 기획·마케팅 등 다양한 배경의 멤버가 함께합니다. 기초 툴 워크숍을 제공합니다." },
          { "id": "vb-f2", "question": "어떤 툴을 사용하나요?", "answer": "Figma를 중심으로 협업하며, 모션은 After Effects를 다룹니다." },
          { "id": "vb-f3", "question": "포트폴리오가 없어도 지원할 수 있나요?", "answer": "네. 지원서의 간단한 과제로 핏을 확인합니다. 함께 첫 포트폴리오를 만듭니다." }
        ] },

      { "id": "vb-cta", "type": "section", "bgType": "image", "bgImage": "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=2400&q=80", "bgKenBurns": "panL", "bgGradOverlay": true, "bgOverlay": 52, "paddingY": 132, "paddingX": 32, "gap": 22,
        "bgWatermark": { "text": "CREATE", "fontSize": 220, "opacity": 12, "position": "center", "color": "#ffffff" },
        "rows": [ { "id": "vb-cta-r", "cols": 1, "columns": [ { "id": "vb-cta-c", "widgets": [
          { "id": "vb-cta-t1", "type": "text", "seoTag": "h2", "align": "center", "text": "감각을 결과로 증명할 준비가 됐나요?", "textReveal": "word", "revealStagger": 0.05, "fontSize": 40, "fontWeight": 900, "textColor": "#ffffff", "lineHeight": 1.25, "paddingTop": 0, "paddingBottom": 18, "maxWidth": 760 },
          { "id": "vb-cta-btn", "type": "button", "text": "9기 지원하기", "actionUrl": "", "btnSize": "l", "btnBg": "#ffffff", "btnTextColor": "#be185d", "borderWidth": 0, "radius": 10, "btnShadow": "soft", "paddingY": 4 }
        ] } ] } ] }
    ]
  }$vb$::jsonb,
  $vb${ "config": {}, "blocks": [] }$vb$::jsonb,
  now(), now());
  UPDATE public.club_pages SET draft = blocks WHERE club_id = v_vibe_id;
  END IF;

END $$;
