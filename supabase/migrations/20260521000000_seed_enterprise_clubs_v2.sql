-- ─────────────────────────────────────────────────────────────────
-- 엔터프라이즈급 데모 동아리 4종 시드 v2
--   데브허슬러 / 코드웨이브 / 프레임 / 바이브디자인
-- 신규 위젯(ticker · featuredProject · featureList)을 포함한 전 위젯을
-- 활용해 "실제 기업 페이지 수준"으로 끌어올린 레퍼런스 페이지.
-- 데이터(JSON)만으로 구성 — 렌더러/빌더 코드 변경 없음.
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_devhustler_id uuid;
  v_codewave_id   uuid;
  v_frame_id      uuid;
  v_vibe_id       uuid;
BEGIN

  -- ──────────────── 1) clubs upsert (slug 기준) ────────────────
  INSERT INTO public.clubs (name, slug, type, logo_url, one_line_desc, is_certified)
  VALUES
    ('데브 허슬러',   'dev-hustler', '학회/프로젝트팀', NULL, '코드로 성장하는 개발자 커뮤니티',          true),
    ('코드웨이브',    'codewave',    '학회/프로젝트팀', NULL, '실전 프로덕트를 출시하는 개발 동아리',      true),
    ('프레임',        'frame',       '교내 동아리',     NULL, '한 장의 사진으로 세상을 다시 보는 사람들',  true),
    ('바이브 디자인', 'vibe-design', '연합 동아리',     NULL, '브랜드와 경험을 디자인하는 크리에이티브 그룹', true)
  ON CONFLICT (slug) DO UPDATE SET
    name          = EXCLUDED.name,
    type          = EXCLUDED.type,
    one_line_desc = EXCLUDED.one_line_desc,
    is_certified  = EXCLUDED.is_certified;

  SELECT id INTO v_devhustler_id FROM public.clubs WHERE slug = 'dev-hustler';
  SELECT id INTO v_codewave_id   FROM public.clubs WHERE slug = 'codewave';
  SELECT id INTO v_frame_id      FROM public.clubs WHERE slug = 'frame';
  SELECT id INTO v_vibe_id       FROM public.clubs WHERE slug = 'vibe-design';

  -- 멱등성: 기존 페이지 삭제 후 재삽입
  DELETE FROM public.club_pages
   WHERE club_id IN (v_devhustler_id, v_codewave_id, v_frame_id, v_vibe_id);

  -- ════════════════ A) 데브 허슬러 — 다크/네온, 신규위젯 풀활용 ════════════════
  INSERT INTO public.club_pages (club_id, blocks, published_at, updated_at)
  VALUES (
    v_devhustler_id,
    '{
      "config": {
        "activeTheme": "custom:#22d3ee",
        "clubName": "DEV HUSTLER",
        "badgeText": "25기 모집중",
        "showFloatingBtn": true,
        "contentWidth": "full",
        "pageBgColor": "#0a0a0f",
        "pageTitle": "데브 허슬러 | 코드로 성장하는 개발자 동아리",
        "pageDesc": "실전 프로젝트와 코드 리뷰로 함께 성장하는 개발자 커뮤니티"
      },
      "blocks": [
        {
          "id": "hero", "type": "heroSlider", "height": 82, "autoPlay": false,
          "h1Size": 60, "subtitleSize": 18, "slideAnim": "fade",
          "slides": [
            { "id": "s1", "bgType": "image",
              "bgValue": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=2400&q=80",
              "overlayOpacity": 55, "align": "left",
              "h1": "We ship\n==real== products.",
              "subtitle": "데브 허슬러 — 기획부터 배포까지, 학생이 만드는 진짜 서비스",
              "ctaText": "25기 지원하기", "ctaShow": true }
          ]
        },
        {
          "id": "ticker", "type": "ticker",
          "items": ["2020년 창립", "졸업생 200+", "현업 취업 30+", "완성 프로젝트 50+", "주간 코드 리뷰", "현업 멘토 풀 40명"],
          "separator": "//", "speed": 26, "fontSize": 13, "paddingY": 16,
          "bgColor": "#22d3ee", "textColor": "#0a0a0f", "accentColor": "rgba(10,10,15,0.4)"
        },
        {
          "id": "t1", "type": "text", "seoTag": "h2", "align": "center", "animation": "slideUp",
          "text": "단순한 공부 모임이 아닙니다",
          "fontSize": 40, "fontWeight": 900, "textColor": "#ffffff",
          "lineHeight": 1.2, "letterSpacing": -0.02,
          "paddingTop": 100, "paddingBottom": 16, "maxWidth": 760, "bgColor": "#0a0a0f"
        },
        {
          "id": "t2", "type": "text", "seoTag": "p", "align": "center",
          "text": "실제 사용자가 들어오는 서비스를 기획하고, 개발하고, 배포합니다.\n한 학기 안에 끝까지 — 끝나지 않는 사이드 프로젝트와는 다릅니다.",
          "fontSize": 18, "textColor": "#a1a1aa", "lineHeight": 1.85,
          "paddingTop": 0, "paddingBottom": 80, "maxWidth": 620, "bgColor": "#0a0a0f"
        },
        {
          "id": "stats", "type": "stats", "layout": "strip", "cols": 4, "paddingY": 64,
          "bgColor": "#0a0a0f", "valueSize": 46, "labelSize": 12,
          "valueColor": "#ffffff", "labelColor": "#71717a", "animate": true,
          "items": [
            { "id": "a", "value": "50", "suffix": "+", "label": "완성 프로젝트" },
            { "id": "b", "value": "200", "suffix": "+", "label": "누적 졸업생" },
            { "id": "c", "value": "30", "suffix": "+", "label": "현업 취업 성공" },
            { "id": "d", "value": "5", "suffix": "년", "label": "운영 역사" }
          ]
        },
        {
          "id": "feat1", "type": "featuredProject", "imgSide": "left",
          "label": "Featured Project", "badge": "24기 대표 프로젝트",
          "heading": "MaeumLog\n감정 기록 PWA",
          "body": "출시 첫 달 1,200 DAU를 달성한 감정 기록 앱. 기획·디자인·개발·배포까지 전 과정을 한 팀이 한 학기에 완성했습니다.",
          "metrics": [
            { "id": "m1", "k": "기간", "v": "16주" },
            { "id": "m2", "k": "스택", "v": "RN · Supabase" },
            { "id": "m3", "k": "결과", "v": "1.2k DAU" }
          ],
          "ctaText": "케이스 스터디", "ctaHref": "#",
          "imgSrc": "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=80",
          "accentColor": "#22d3ee", "panelColor": "#111118", "bgColor": "#0f0f17", "paddingY": 100
        },
        {
          "id": "fl1", "type": "featureList", "title": "이런 걸 합니다", "cols": 2,
          "iconStyle": "check", "accentColor": "#22d3ee", "textColor": "#d4d4d8",
          "bgColor": "#0a0a0f", "paddingY": 96, "maxWidth": 1000,
          "items": [
            { "id": "l1", "text": "주 1회 정기 세션 (2시간)", "sub": "기술 발표 · 페어 코딩 · 회고" },
            { "id": "l2", "text": "팀 단위 실전 프로젝트", "sub": "반기마다 1개 서비스 출시" },
            { "id": "l3", "text": "주간 코드 리뷰", "sub": "PR 기반 동료 피드백 문화" },
            { "id": "l4", "text": "현업 시니어 멘토링", "sub": "1:1 커리어·기술 멘토링" }
          ]
        },
        {
          "id": "q1", "type": "quote", "align": "center", "maxWidth": 780,
          "paddingY": 96, "bgColor": "#0f0f17",
          "text": "데브 허슬러에서 6개월 동안 배운 것이 대학교 3년보다 많았습니다. 실전 프로젝트와 코드 리뷰가 저를 완전히 바꿔놓았어요.",
          "fontSize": 22, "textColor": "#e4e4e7", "accentColor": "#22d3ee",
          "attribution": "— 23기 정현우, 現 네이버 백엔드"
        },
        {
          "id": "faq", "type": "faq", "title": "자주 묻는 질문",
          "iconStyle": "arrow", "openBg": "#18181b", "borderRadius": 8,
          "items": [
            { "id": "fq1", "question": "비전공자도 지원 가능한가요?",
              "answer": "네. 매 기수 약 40%가 비전공자입니다. 단 입회 전 자바스크립트/HTML 기초는 익히고 오시길 권장합니다." },
            { "id": "fq2", "question": "활동 빈도와 회비는?",
              "answer": "주 1회 정기 세션 + 팀별 자체 모임. 한 학기 회비 40,000원(서버비·간식)." },
            { "id": "fq3", "question": "포트폴리오가 없어도 되나요?",
              "answer": "괜찮습니다. 지원 동기와 배우고 싶은 것을 구체적으로 작성해주시면 충분합니다." }
          ]
        },
        {
          "id": "cta", "type": "button", "text": "25기 지원하기",
          "actionType": "modal", "btnSize": "l",
          "btnBg": "#22d3ee", "btnTextColor": "#0a0a0f",
          "radius": 999, "paddingY": 120, "bgColor": "#0a0a0f"
        }
      ]
    }'::jsonb,
    now(), now()
  );

  -- ════════════════ B) 코드웨이브 — 보라/그라디언트 ════════════════
  INSERT INTO public.club_pages (club_id, blocks, published_at, updated_at)
  VALUES (
    v_codewave_id,
    '{
      "config": {
        "activeTheme": "custom:#7c3aed",
        "clubName": "CODE WAVE",
        "badgeText": "13기 모집중",
        "showFloatingBtn": true,
        "contentWidth": "full",
        "pageBgColor": "#0a0a0f",
        "pageTitle": "CodeWave | 실전 프로덕트 빌딩 동아리",
        "pageDesc": "기획·디자인·개발·런칭까지. 학생이 만드는 진짜 프로덕트."
      },
      "blocks": [
        {
          "id": "h1", "type": "heroSlider", "height": 80, "autoPlay": true, "interval": 6000,
          "h1Size": 56, "subtitleSize": 17, "slideAnim": "fade",
          "slides": [
            { "id": "s1", "bgType": "gradient", "bgValue": "linear-gradient(135deg,#0f0f1a,#1e1b4b)",
              "overlayOpacity": 0, "align": "left",
              "h1": "Ship the web\nyou ==imagine==",
              "subtitle": "13기. 다음 학기, 당신이 만든 서비스가 실제로 돌아갑니다.",
              "ctaText": "13기 지원하기", "ctaShow": true }
          ]
        },
        {
          "id": "ticker", "type": "ticker",
          "items": ["출시 프로덕트 47개", "현역 시니어 멘토 200+", "주요 기업 합격률 92%", "13기 연속 운영"],
          "separator": "✦", "speed": 24, "fontSize": 13, "paddingY": 15,
          "bgColor": "#7c3aed", "textColor": "#ffffff", "accentColor": "rgba(255,255,255,0.45)"
        },
        {
          "id": "t1", "type": "text", "seoTag": "h2", "align": "center", "animation": "slideUp",
          "text": "우리가 만드는 건\n==진짜 프로덕트==입니다",
          "fontSize": 40, "fontWeight": 900, "fill": "gradient",
          "gradientFrom": "#a78bfa", "gradientTo": "#ec4899", "gradientAngle": 90,
          "highlightColor": "#fbbf24", "lineHeight": 1.15, "letterSpacing": -0.02,
          "paddingTop": 96, "paddingBottom": 20, "maxWidth": 760, "bgColor": "#0a0a0f"
        },
        {
          "id": "stat", "type": "stats", "layout": "strip", "cols": 4, "paddingY": 64,
          "bgColor": "#0a0a0f", "valueSize": 44, "labelSize": 12,
          "valueColor": "#ffffff", "labelColor": "#71717a", "animate": true,
          "items": [
            { "id": "a", "value": "47", "label": "출시된 프로덕트" },
            { "id": "b", "value": "200", "suffix": "+", "label": "현역 시니어 멘토" },
            { "id": "c", "value": "92", "suffix": "%", "label": "주요 기업 합격률" },
            { "id": "d", "value": "13", "suffix": "기", "label": "연속 운영" }
          ]
        },
        {
          "id": "tab1", "type": "layoutContainer", "mode": "tabs",
          "cols": 1, "gap": 24, "paddingY": 100, "paddingX": 48,
          "bgColor": "#0a0a0f", "maxWidth": 1200,
          "tabPosition": "top", "activeTabBg": "#7c3aed", "activeTabText": "#ffffff",
          "tabText": "#52525b", "tabRadius": 8,
          "bgWatermark": { "text": "STACK", "fontSize": 360, "opacity": 6, "color": "#7c3aed", "position": "center" },
          "cells": [
            { "id": "tf", "tabLabel": "FRONTEND", "title": "프로덕션급 프론트엔드",
              "text": "React · TypeScript · Next.js · Tailwind · Zustand\n\n실제 트래픽을 받아본 환경에서 학습합니다. CSR·SSR·ISR을 직접 비교하고 로딩 성능을 측정해 개선합니다.",
              "bgColor": "#18181b", "titleColor": "#ffffff", "textColor": "#a1a1aa",
              "titleSize": 22, "textSize": 14, "padding": 40, "borderRadius": 16, "borderWidth": 1, "borderColor": "#27272a", "align": "left", "imgSrc": "" },
            { "id": "tb", "tabLabel": "BACKEND", "title": "쓸 수 있는 서버를 짭니다",
              "text": "Node.js · Postgres · Redis · Docker · AWS\n\n인증·결제·큐·캐싱 같은 진짜 서버를 다룹니다. 트래픽이 늘면 어디가 먼저 터지는지 직접 부숴보고 고칩니다.",
              "bgColor": "#18181b", "titleColor": "#ffffff", "textColor": "#a1a1aa",
              "titleSize": 22, "textSize": 14, "padding": 40, "borderRadius": 16, "borderWidth": 1, "borderColor": "#27272a", "align": "left", "imgSrc": "" },
            { "id": "td", "tabLabel": "DEVOPS", "title": "혼자 배포 가능한 엔지니어",
              "text": "GitHub Actions · Terraform · Sentry\n\npush 한 번에 프로덕션까지 나가는 파이프라인을 직접 깝니다. 모니터링과 롤백을 본인 손으로 칠 수 있게 됩니다.",
              "bgColor": "#18181b", "titleColor": "#ffffff", "textColor": "#a1a1aa",
              "titleSize": 22, "textSize": 14, "padding": 40, "borderRadius": 16, "borderWidth": 1, "borderColor": "#27272a", "align": "left", "imgSrc": "" }
          ]
        },
        {
          "id": "feat", "type": "featuredProject", "imgSide": "right",
          "label": "Featured Launch", "badge": "월 매출 ₩4.1M",
          "heading": "Subwave\n구독 결제 SaaS",
          "body": "실제 결제가 일어나는 구독 관리 서비스. 토스페이먼츠 연동부터 정산까지, 운영되는 서비스를 학생이 만들었습니다.",
          "metrics": [
            { "id": "m1", "k": "스택", "v": "Nuxt · NestJS" },
            { "id": "m2", "k": "결제", "v": "Toss Payments" },
            { "id": "m3", "k": "MRR", "v": "₩4.1M" }
          ],
          "ctaText": "프로덕트 보기", "ctaHref": "#",
          "imgSrc": "https://images.unsplash.com/photo-1556745753-b2904692b3cd?auto=format&fit=crop&w=1400&q=80",
          "accentColor": "#a78bfa", "panelColor": "#13111f", "bgColor": "#1e1b4b", "paddingY": 100
        },
        {
          "id": "q1", "type": "quote", "align": "center", "maxWidth": 760,
          "paddingY": 96, "bgColor": "#0a0a0f",
          "text": "스타트업에서 1년 일한 친구를 만났는데, 코드웨이브에서 한 학기 한 작업이 그 친구가 1년 동안 한 작업과 비슷한 깊이였다.",
          "fontSize": 20, "textColor": "#e4e4e7", "accentColor": "#a78bfa",
          "attribution": "— 12기 이지원, 토스 백엔드"
        },
        {
          "id": "faq", "type": "faq", "title": "자주 묻는 질문",
          "iconStyle": "arrow", "openBg": "#18181b", "borderRadius": 8,
          "items": [
            { "id": "fq1", "question": "비전공자도 지원 가능한가요?",
              "answer": "네. 매 기수 약 40%가 비전공자입니다. 기초 강의를 따로 운영하지 않으므로 입회 전 자바스크립트/HTML 정도는 익히고 오시길 권장합니다." },
            { "id": "fq2", "question": "프로젝트 팀은 어떻게 결성되나요?",
              "answer": "지원 시 관심 분야를 받고, OT 후 약 1주 동안 자유롭게 매칭됩니다. 운영진은 인원 분배만 조율합니다." }
          ]
        },
        {
          "id": "cta", "type": "button", "text": "13기 지원하기",
          "actionType": "modal", "btnSize": "l",
          "btnBg": "#7c3aed", "btnTextColor": "#ffffff",
          "radius": 999, "paddingY": 120, "bgColor": "#0a0a0f"
        }
      ]
    }'::jsonb,
    now(), now()
  );

  -- ════════════════ C) 프레임 — 모노톤/에디토리얼 ════════════════
  INSERT INTO public.club_pages (club_id, blocks, published_at, updated_at)
  VALUES (
    v_frame_id,
    '{
      "config": {
        "activeTheme": "black",
        "clubName": "FRAME",
        "badgeText": "신입 부원 모집",
        "showFloatingBtn": true,
        "contentWidth": "full",
        "pageBgColor": "#fafaf9",
        "pageTitle": "FRAME | 한 장의 사진 동아리",
        "pageDesc": "필름과 디지털, 다큐와 패션 — 사진으로 세상을 다시 보는 사람들"
      },
      "blocks": [
        {
          "id": "h1", "type": "heroSlider", "height": 82, "h1Size": 68, "subtitleSize": 17, "slideAnim": "fade",
          "slides": [
            { "id": "s1", "bgType": "image",
              "bgValue": "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=2400&q=80",
              "overlayOpacity": 30, "align": "left",
              "h1": "We see\n==light==.",
              "subtitle": "프레임 — 2024년부터 매 학기 정기 전시를 여는 사진 동아리",
              "ctaText": "신입 부원 지원", "ctaShow": true }
          ]
        },
        {
          "id": "ticker", "type": "ticker",
          "items": ["2024년 창립", "학기마다 정기 전시", "한 권의 사진집", "필름 · 디지털", "다큐 · 패션 · 거리"],
          "separator": "—", "speed": 28, "fontSize": 12, "paddingY": 14,
          "bgColor": "#0a0a0a", "textColor": "#fafaf9", "accentColor": "rgba(250,250,249,0.35)"
        },
        {
          "id": "title1", "type": "text", "seoTag": "h2", "align": "center",
          "text": "사진은\n==한 번 보고== 끝나지 않습니다",
          "fontSize": 44, "fontWeight": 900, "textColor": "#0a0a0a", "highlightColor": "#0a0a0a",
          "lineHeight": 1.15, "letterSpacing": -0.02,
          "paddingTop": 120, "paddingBottom": 20, "maxWidth": 780
        },
        {
          "id": "subt1", "type": "text", "seoTag": "p", "align": "center",
          "text": "찰나에 멈춘 빛은 보는 사람의 시간을 늦춥니다.\n프레임은 그 늦춰지는 시간을 함께 들여다보는 사람들입니다.",
          "fontSize": 17, "textColor": "#525252", "lineHeight": 1.9,
          "paddingTop": 0, "paddingBottom": 100, "maxWidth": 620
        },
        {
          "id": "gallery", "type": "gallery", "layout": "featured", "cols": 3, "gap": 8, "radius": 4,
          "paddingY": 40, "bgColor": "#fafaf9",
          "images": [
            { "id": "g1", "src": "https://images.unsplash.com/photo-1500051638674-ff996a0ec29e?auto=format&fit=crop&w=1200&q=80" },
            { "id": "g2", "src": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80" },
            { "id": "g3", "src": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=900&q=80" },
            { "id": "g4", "src": "https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&w=900&q=80" },
            { "id": "g5", "src": "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=900&q=80" },
            { "id": "g6", "src": "https://images.unsplash.com/photo-1504198266287-1659872e6590?auto=format&fit=crop&w=900&q=80" }
          ]
        },
        {
          "id": "fl", "type": "featureList", "title": "프레임은 이렇게 활동합니다", "cols": 2,
          "iconStyle": "dot", "accentColor": "#0a0a0a", "textColor": "#3a3a3a",
          "bgColor": "#fafaf9", "paddingY": 100, "maxWidth": 1000,
          "items": [
            { "id": "l1", "text": "매주 한 주제로 촬영", "sub": "학기 말 한 권의 사진집으로 묶음" },
            { "id": "l2", "text": "주간 크리틱 세션", "sub": "서로의 컷에 솔직한 피드백" },
            { "id": "l3", "text": "학기 정기 전시", "sub": "외부 관객을 초대하는 오프라인 전시" },
            { "id": "l4", "text": "필름 · 디지털 자유", "sub": "라이카부터 미러리스까지 장비 무관" }
          ]
        },
        {
          "id": "feat", "type": "featuredProject", "imgSide": "left",
          "label": "Exhibition", "badge": "VOL.07",
          "heading": "사이의 거리",
          "body": "2025년 봄 정기 전시. 도시에서 사람과 사람 사이가 만드는 눈에 보이지 않는 거리를 30컷의 흑백 필름으로 담았습니다.",
          "metrics": [
            { "id": "m1", "k": "기간", "v": "2025 봄" },
            { "id": "m2", "k": "컷 수", "v": "30컷" },
            { "id": "m3", "k": "매체", "v": "흑백 필름" }
          ],
          "ctaText": "전시 보기", "ctaHref": "#",
          "imgSrc": "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=1400&q=80",
          "accentColor": "#0a0a0a", "panelColor": "#0a0a0a", "bgColor": "#e7e5e4", "paddingY": 110
        },
        {
          "id": "members", "type": "members", "cols": 4, "imgStyle": "square",
          "accentStyle": "top-line", "paddingY": 100, "bgColor": "#0a0a0a", "cardBg": "#161616",
          "items": [
            { "id": "m1", "name": "김지호", "role": "캡틴 · 다큐멘터리", "imgSrc": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80" },
            { "id": "m2", "name": "이수민", "role": "총무 · 패션/인물", "imgSrc": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80" },
            { "id": "m3", "name": "박지환", "role": "기획 · 도시/건축", "imgSrc": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80" },
            { "id": "m4", "name": "최은서", "role": "큐레이터 · 필름", "imgSrc": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80" }
          ]
        },
        {
          "id": "cta-frame", "type": "button", "text": "신입 부원 지원하기",
          "actionType": "modal", "btnSize": "l",
          "btnBg": "#0a0a0a", "btnTextColor": "#fafaf9",
          "radius": 0, "paddingY": 120, "bgColor": "#fafaf9"
        }
      ]
    }'::jsonb,
    now(), now()
  );

  -- ════════════════ D) 바이브 디자인 — 웜/에디토리얼 크리에이티브 ════════════════
  INSERT INTO public.club_pages (club_id, blocks, published_at, updated_at)
  VALUES (
    v_vibe_id,
    '{
      "config": {
        "activeTheme": "custom:#b8965a",
        "clubName": "VIBE DESIGN",
        "badgeText": "25기 모집 · D-12",
        "showFloatingBtn": true,
        "contentWidth": "full",
        "pageBgColor": "#faf8f5",
        "pageTitle": "VIBE | 브랜드·경험 디자인 동아리",
        "pageDesc": "브랜드 전략과 크리에이티브 디자인으로 시장을 이끄는 대학생 연합 동아리"
      },
      "blocks": [
        {
          "id": "hero", "type": "heroSlider", "height": 84, "autoPlay": false,
          "h1Size": 64, "subtitleSize": 18, "slideAnim": "fade",
          "slides": [
            { "id": "s1", "bgType": "image",
              "bgValue": "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=2400&q=90",
              "overlayOpacity": 40, "align": "left",
              "h1": "디자인으로\n==세상==을 설득합니다",
              "subtitle": "VIBE — 브랜드 전략과 크리에이티브로 시장을 이끄는 디자인 동아리",
              "ctaText": "25기 지원하기", "ctaShow": true }
          ]
        },
        {
          "id": "ticker", "type": "ticker",
          "items": ["브랜드 전략 동아리", "2019년 창립", "누적 프로젝트 32건", "현업 취업률 80%", "기업 파트너십 8곳", "25기 모집중"],
          "separator": "✦", "speed": 24, "fontSize": 13, "paddingY": 15,
          "bgColor": "#b8965a", "textColor": "#ffffff", "accentColor": "rgba(255,255,255,0.5)"
        },
        {
          "id": "split", "type": "splitSection", "imgSide": "right", "imgRatio": "50",
          "fullBleed": true, "minHeight": 560, "bgColor": "#2e2a5e", "paddingY": 80, "gap": 72,
          "imgSrc": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1600&q=80",
          "badge": "OUR PROCESS",
          "heading": "기획부터\n==런칭==까지\n한 학기 안에.",
          "headingSize": 48, "headingColor": "#ffffff",
          "body": "디스커버리 → 디자인 → 구현 → 배포 → 회고. 5단계를 매 학기 정확히 끝까지 돌립니다. 끝까지 안 가본 사이드 프로젝트의 답답함과는 다른 경험을 약속합니다.",
          "bodySize": 17, "bodyColor": "rgba(255,255,255,0.7)",
          "ctaText": "자세히 보기", "ctaShape": "circle-arrow", "ctaHref": ""
        },
        {
          "id": "stats", "type": "stats", "layout": "cards", "cols": 4, "paddingY": 88,
          "bgColor": "#faf8f5", "cardBg": "#ffffff", "borderColor": "#e8ded3",
          "valueSize": 50, "labelSize": 13,
          "valueColor": "#0e0e0e", "labelColor": "#7a7368", "animate": true, "accentLine": true,
          "items": [
            { "id": "a", "value": "32", "suffix": "+", "label": "누적 프로젝트" },
            { "id": "b", "value": "68", "suffix": "명", "label": "활동 인원" },
            { "id": "c", "value": "80", "suffix": "%", "label": "현업 취업률" },
            { "id": "d", "value": "6", "suffix": "년", "label": "활동 역사" }
          ]
        },
        {
          "id": "gallery", "type": "gallery", "layout": "featured", "cols": 3, "gap": 8, "radius": 8,
          "paddingY": 96, "bgColor": "#ffffff",
          "images": [
            { "id": "g1", "src": "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=85" },
            { "id": "g2", "src": "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=85" },
            { "id": "g3", "src": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=85" },
            { "id": "g4", "src": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=85" },
            { "id": "g5", "src": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=85" },
            { "id": "g6", "src": "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=900&q=85" }
          ]
        },
        {
          "id": "feat", "type": "featuredProject", "imgSide": "left",
          "label": "Featured Project", "badge": "24기 대표 프로젝트",
          "heading": "로컬 F&B 브랜드\n온도:씨 리뉴얼",
          "body": "6주간의 리서치와 아이덴티티 작업을 통해 신규 고객 유입률 40% 상승. 브랜드 전략부터 패키지 디자인, SNS 런칭 캠페인까지 전 과정을 주도했습니다.",
          "metrics": [
            { "id": "m1", "k": "기간", "v": "6주" },
            { "id": "m2", "k": "역할", "v": "브랜딩+디자인" },
            { "id": "m3", "k": "결과", "v": "유입 +40%" }
          ],
          "ctaText": "케이스 스터디", "ctaHref": "#",
          "imgSrc": "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1400&q=85",
          "accentColor": "#b8965a", "panelColor": "#0e0e0e", "bgColor": "#f0eae2", "paddingY": 104
        },
        {
          "id": "fl", "type": "featureList", "title": "매주 목요일, 이렇게 활동합니다", "cols": 2,
          "iconStyle": "dot", "accentColor": "#b8965a", "textColor": "#3a3a3a",
          "bgColor": "#ffffff", "paddingY": 100, "maxWidth": 1000,
          "items": [
            { "id": "l1", "text": "매주 목요일 저녁 브랜드 세션", "sub": "90분 · 실제 클라이언트 브리핑 기반" },
            { "id": "l2", "text": "기업 클라이언트 실전 프로젝트", "sub": "반기별 진행" },
            { "id": "l3", "text": "현업 브랜드 매니저 멘토링", "sub": "1:1 포트폴리오 리뷰" },
            { "id": "l4", "text": "연 1회 포트폴리오 전시회", "sub": "외부 관객·기업 초청" }
          ]
        },
        {
          "id": "members", "type": "members", "cols": 4, "imgStyle": "square",
          "accentStyle": "top-line", "paddingY": 100, "bgColor": "#0e0e0e", "cardBg": "#1a1a1a",
          "items": [
            { "id": "m1", "name": "김채원", "role": "회장 · 브랜드 전략", "imgSrc": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80" },
            { "id": "m2", "name": "박준호", "role": "부회장 · 크리에이티브", "imgSrc": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80" },
            { "id": "m3", "name": "이소연", "role": "기획팀장", "imgSrc": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80" },
            { "id": "m4", "name": "최민준", "role": "디자인팀장", "imgSrc": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80" }
          ]
        },
        {
          "id": "q1", "type": "quote", "align": "center", "maxWidth": 800,
          "paddingY": 110, "bgColor": "#f0eae2",
          "text": "VIBE에서 보낸 1년이 4년 대학생활 중 가장 밀도 있는 시간이었습니다. 클라이언트 앞에서 브리핑하던 그 경험이 지금의 저를 만들었어요.",
          "fontSize": 26, "textColor": "#0e0e0e", "accentColor": "#b8965a",
          "attribution": "— 23기 김채원, 現 HS애드 브랜드플래너",
          "avatarSrc": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
        },
        {
          "id": "faq", "type": "faq", "title": "자주 묻는 질문",
          "iconStyle": "plus", "openBg": "#f0eae2", "borderRadius": 8,
          "items": [
            { "id": "fq1", "question": "디자인 비전공자도 지원 가능한가요?",
              "answer": "네. 전공 무관하게 브랜드·디자인에 관심 있는 누구나 지원 가능합니다. 매 기수 약 절반이 비전공자입니다." },
            { "id": "fq2", "question": "활동 빈도와 회비는?",
              "answer": "매주 목요일 정기 세션 + 프로젝트별 자체 모임. 반기 활동비 50,000원(전시·재료·네트워킹)." },
            { "id": "fq3", "question": "포트폴리오가 필요한가요?",
              "answer": "필수는 아닙니다. 지원 동기와 디자인에 대한 관심을 보여주시면 충분합니다." }
          ]
        },
        {
          "id": "cta", "type": "button", "text": "25기 지원서 작성하기",
          "actionType": "modal", "btnSize": "l",
          "btnBg": "#b8965a", "btnTextColor": "#ffffff",
          "radius": 0, "paddingY": 120, "bgColor": "#faf8f5"
        }
      ]
    }'::jsonb,
    now(), now()
  );

  RAISE NOTICE '엔터프라이즈 동아리 4종 시드 완료 (dev-hustler: %, codewave: %, frame: %, vibe-design: %)',
    v_devhustler_id, v_codewave_id, v_frame_id, v_vibe_id;
END;
$$;
