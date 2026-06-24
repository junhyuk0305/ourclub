-- ─────────────────────────────────────────────────────────────────
-- 데모 동아리 3종 시드 (CodeWave / Frame / Spike)
-- WIDGET_CRITERIA.md §6의 Top 5 강화 기능을 보여주는 레퍼런스 페이지.
-- 신규 위젯은 추가 안 함. layoutContainer(워터마크/셰이프/탭/캐러셀/
-- colSpan/cell-href) + text(gradient/highlight) + splitSection(ctaShape)
-- 옵션 조합으로 구성.
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_codewave_id uuid;
  v_frame_id    uuid;
  v_spike_id    uuid;
BEGIN

  -- ──────────────── 1) clubs upsert ────────────────
  INSERT INTO public.clubs (name, slug, type, logo_url, one_line_desc, is_certified)
  VALUES
    ('코드웨이브', 'codewave', '학회/프로젝트팀', NULL, '실전 프로젝트로 성장하는 개발자 커뮤니티', true),
    ('프레임',     'frame',    '교내 동아리',    NULL, '한 장의 사진으로 세상을 다시 보는 사람들',  true),
    ('스파이크',   'spike',    '연합 동아리',    NULL, '체육관에서 만들어지는 가장 진한 우정',     true)
  ON CONFLICT (slug) DO UPDATE SET
    name          = EXCLUDED.name,
    type          = EXCLUDED.type,
    one_line_desc = EXCLUDED.one_line_desc,
    is_certified  = EXCLUDED.is_certified;

  SELECT id INTO v_codewave_id FROM public.clubs WHERE slug = 'codewave';
  SELECT id INTO v_frame_id    FROM public.clubs WHERE slug = 'frame';
  SELECT id INTO v_spike_id    FROM public.clubs WHERE slug = 'spike';

  -- club_pages 는 club_id 에 UNIQUE 가 없으므로, 멱등성을 위해 기존 행을 삭제 후 재삽입
  DELETE FROM public.club_pages
   WHERE club_id IN (v_codewave_id, v_frame_id, v_spike_id);

  -- ──────────────── 2-A) 코드웨이브 — 다크/그라디언트, 탭 모드 + 워터마크 ────────────────
  INSERT INTO public.club_pages (club_id, blocks, published_at, updated_at)
  VALUES (
    v_codewave_id,
    '{
      "config": {
        "activeTheme": "custom:#7c3aed",
        "coverImg": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80",
        "clubName": "CODE WAVE",
        "hashtag1": "개발",
        "hashtag2": "프로덕트",
        "badgeText": "13기 모집중",
        "showFloatingBtn": true,
        "contentWidth": "full",
        "pageBgColor": "#0a0a0f",
        "pageTitle": "CodeWave | 실전 프로덕트 빌딩 동아리",
        "pageDesc": "기획·디자인·개발·런칭까지. 학생이 만드는 진짜 프로덕트."
      },
      "blocks": [
        {
          "id": "h1", "type": "heroSlider", "height": 78, "autoPlay": true, "interval": 6000,
          "h1Size": 56, "subtitleSize": 17, "slideAnim": "fade",
          "slides": [
            { "id": "s1", "bgType": "gradient", "bgValue": "linear-gradient(135deg,#0f0f1a,#1e1b4b)",
              "overlayOpacity": 0, "align": "left",
              "h1": "Ship the\nweb you\n==imagine==",
              "subtitle": "13기. 다음 학기, 당신이 만든 서비스가 실제로 돌아갑니다.",
              "ctaText": "13기 지원하기", "ctaShow": true }
          ]
        },
        {
          "id": "t1", "type": "text", "seoTag": "h2", "align": "center", "animation": "slideUp",
          "text": "우리가 만드는 건\n==진짜 프로덕트==입니다",
          "fontSize": 40, "fontWeight": 900, "fill": "gradient",
          "gradientFrom": "#a78bfa", "gradientTo": "#ec4899", "gradientAngle": 90,
          "highlightColor": "#fbbf24",
          "lineHeight": 1.15, "letterSpacing": -0.02,
          "paddingTop": 96, "paddingBottom": 20, "maxWidth": 760,
          "bgColor": "#0a0a0f"
        },
        {
          "id": "t2", "type": "text", "seoTag": "p", "align": "center",
          "text": "기획에서 런칭까지, 한 학기 안에 끝냅니다.\n실제로 사용자가 들어오는 서비스를 함께 만듭니다.",
          "fontSize": 18, "textColor": "#a1a1aa", "lineHeight": 1.8,
          "paddingTop": 0, "paddingBottom": 80, "maxWidth": 640, "bgColor": "#0a0a0f"
        },
        {
          "id": "stat", "type": "stats", "layout": "strip", "cols": 4, "paddingY": 64,
          "bgColor": "#0a0a0f", "valueSize": 44, "labelSize": 12,
          "valueColor": "#ffffff", "labelColor": "#71717a", "animate": true,
          "items": [
            { "id": "a", "value": "47", "label": "출시된 프로덕트", "icon": "" },
            { "id": "b", "value": "200+", "label": "현역 시니어 멘토 풀", "icon": "" },
            { "id": "c", "value": "92%", "label": "주요 기업 합격률", "icon": "" },
            { "id": "d", "value": "13기", "label": "이어진 연속 운영", "icon": "" }
          ]
        },
        {
          "id": "tab1", "type": "layoutContainer", "mode": "tabs",
          "cols": 1, "gap": 24, "paddingY": 100, "paddingX": 48,
          "bgColor": "#0a0a0f", "maxWidth": 1280,
          "tabPosition": "top", "activeTabBg": "#7c3aed", "activeTabText": "#ffffff",
          "tabText": "#52525b", "tabRadius": 8,
          "bgWatermark": { "text": "STACK", "fontSize": 380, "opacity": 6, "color": "#7c3aed", "position": "center" },
          "cells": [
            { "id": "tf", "tabLabel": "FRONTEND",
              "title": "프로덕션급 프론트엔드",
              "text": "React · TypeScript · Next.js · Tailwind · Zustand\n\n실제 사용자 트래픽을 받아본 적 있는 환경에서 학습합니다. CSR·SSR·ISR을 직접 비교하고, 페이지 로딩 성능을 측정해 개선합니다.",
              "bgColor": "#18181b", "titleColor": "#ffffff", "textColor": "#a1a1aa",
              "titleSize": 22, "textSize": 14, "padding": 40, "borderRadius": 16, "borderWidth": 1, "borderColor": "#27272a",
              "align": "left", "imgSrc": "" },
            { "id": "tb", "tabLabel": "BACKEND",
              "title": "쓸 수 있는 서버를 짭니다",
              "text": "Node.js · Postgres · Redis · Docker · GCP/AWS\n\n인증, 결제, 큐, 캐싱 같은 \"진짜 서버\"를 다룹니다. 트래픽이 늘면 어디가 먼저 터지는지 직접 부숴보고 고칩니다.",
              "bgColor": "#18181b", "titleColor": "#ffffff", "textColor": "#a1a1aa",
              "titleSize": 22, "textSize": 14, "padding": 40, "borderRadius": 16, "borderWidth": 1, "borderColor": "#27272a",
              "align": "left", "imgSrc": "" },
            { "id": "td", "tabLabel": "DEVOPS",
              "title": "혼자 배포 가능한 엔지니어",
              "text": "GitHub Actions · Terraform · CloudWatch · Sentry\n\n로컬에서 push 한 번에 프로덕션까지 나가는 파이프라인을 직접 깝니다. 모니터링과 롤백을 본인 손으로 칠 수 있게 됩니다.",
              "bgColor": "#18181b", "titleColor": "#ffffff", "textColor": "#a1a1aa",
              "titleSize": 22, "textSize": 14, "padding": 40, "borderRadius": 16, "borderWidth": 1, "borderColor": "#27272a",
              "align": "left", "imgSrc": "" },
            { "id": "tm", "tabLabel": "MOBILE",
              "title": "스토어까지 보내봅니다",
              "text": "React Native · Expo · 앱 빌드 자동화\n\n웹만 만들다 보면 잊는 \"앱 심사\"의 디테일까지 경험합니다. iOS·Android 양쪽 스토어 등록을 직접 해봅니다.",
              "bgColor": "#18181b", "titleColor": "#ffffff", "textColor": "#a1a1aa",
              "titleSize": 22, "textSize": 14, "padding": 40, "borderRadius": 16, "borderWidth": 1, "borderColor": "#27272a",
              "align": "left", "imgSrc": "" }
          ]
        },
        {
          "id": "split1", "type": "splitSection",
          "imgSide": "right", "imgRatio": "50", "fullBleed": true, "minHeight": 560,
          "bgColor": "#1e1b4b", "paddingY": 80, "gap": 64,
          "imgSrc": "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80",
          "badge": "OUR PROCESS",
          "heading": "기획부터\n==런칭==까지\n한 학기 안에.",
          "headingSize": 40, "headingColor": "#ffffff",
          "body": "디스커버리 → 디자인 → 구현 → 배포 → 회고. 5단계를 매 학기 정확히 끝까지 돌립니다. 끝까지 안 가본 사이드 프로젝트의 답답함과는 다른 경험을 약속합니다.",
          "bodySize": 18, "bodyColor": "#c7d2fe",
          "ctaText": "GO",
          "ctaShape": "circle-arrow",
          "ctaHref": ""
        },
        {
          "id": "car1", "type": "layoutContainer", "mode": "carousel",
          "cols": 3, "gap": 20, "paddingY": 100, "paddingX": 48,
          "bgColor": "#0a0a0f", "maxWidth": 1280,
          "autoplay": true, "interval": 5000,
          "activeTabBg": "#7c3aed",
          "cellHover": "scale",
          "cells": [
            { "id": "p1", "title": "MaeumLog",
              "text": "감정 기록 PWA · 출시 첫 달 1.2k DAU\n\nReact Native · Supabase · GPT-4o-mini",
              "imgPosition": "top", "imgHeight": 200,
              "imgSrc": "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=900&q=80",
              "bgColor": "#18181b", "titleColor": "#ffffff", "textColor": "#a1a1aa",
              "titleSize": 17, "textSize": 13, "padding": 20, "borderRadius": 16, "borderWidth": 1, "borderColor": "#27272a",
              "showArrow": true, "href": "#" },
            { "id": "p2", "title": "Studyboost",
              "text": "스터디 모집 매칭 · 누적 매칭 2,400건\n\nNext.js · Postgres · Stripe",
              "imgPosition": "top", "imgHeight": 200,
              "imgSrc": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80",
              "bgColor": "#18181b", "titleColor": "#ffffff", "textColor": "#a1a1aa",
              "titleSize": 17, "textSize": 13, "padding": 20, "borderRadius": 16, "borderWidth": 1, "borderColor": "#27272a",
              "showArrow": true, "href": "#" },
            { "id": "p3", "title": "Subwave",
              "text": "구독 결제 SaaS · 월 매출 ₩4.1M\n\nNuxt · NestJS · Toss Payments",
              "imgPosition": "top", "imgHeight": 200,
              "imgSrc": "https://images.unsplash.com/photo-1556745753-b2904692b3cd?auto=format&fit=crop&w=900&q=80",
              "bgColor": "#18181b", "titleColor": "#ffffff", "textColor": "#a1a1aa",
              "titleSize": 17, "textSize": 13, "padding": 20, "borderRadius": 16, "borderWidth": 1, "borderColor": "#27272a",
              "showArrow": true, "href": "#" },
            { "id": "p4", "title": "Bandcamp",
              "text": "인디 밴드 굿즈 커머스 · 결제 시연 완료\n\nRemix · Cloudflare · Stripe",
              "imgPosition": "top", "imgHeight": 200,
              "imgSrc": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80",
              "bgColor": "#18181b", "titleColor": "#ffffff", "textColor": "#a1a1aa",
              "titleSize": 17, "textSize": 13, "padding": 20, "borderRadius": 16, "borderWidth": 1, "borderColor": "#27272a",
              "showArrow": true, "href": "#" }
          ]
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
              "answer": "네. 매 기수 약 40%가 비전공자입니다. 단, \"기초 강의\"를 따로 운영하지 않으므로 입회 전 자율적으로 자바스크립트/HTML 정도는 익히고 오시길 권장합니다." },
            { "id": "fq2", "question": "프로젝트 팀은 어떻게 결성되나요?",
              "answer": "지원 시 관심 분야(웹/모바일/AI/인프라)를 받고, OT 후 약 1주 동안 자유롭게 매칭됩니다. 운영진은 팀당 인원 분배만 조율하고 강제로 팀을 정하지 않습니다." },
            { "id": "fq3", "question": "활동 빈도와 회비는 어떻게 되나요?",
              "answer": "주 1회 정기 모임(2시간) + 팀별 자체 모임. 한 학기 회비 40,000원(서버비/간식)." }
          ]
        },
        {
          "id": "cta", "type": "button", "text": "13기 지원하기",
          "actionType": "modal",
          "btnSize": "l", "btnBg": "#7c3aed", "btnTextColor": "#ffffff",
          "radius": 999, "paddingY": 120, "bgColor": "#0a0a0f"
        }
      ]
    }'::jsonb,
    now(), now()
  )
  ;


  -- ──────────────── 2-B) 프레임 — 모노톤/벤토(colSpan), bgShape ────────────────
  INSERT INTO public.club_pages (club_id, blocks, published_at, updated_at)
  VALUES (
    v_frame_id,
    '{
      "config": {
        "activeTheme": "black",
        "coverImg": "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1920&q=80",
        "clubName": "FRAME",
        "hashtag1": "사진",
        "hashtag2": "전시",
        "badgeText": "신입 부원 모집",
        "showFloatingBtn": true,
        "contentWidth": "full",
        "pageBgColor": "#fafaf9",
        "pageTitle": "FRAME | 한 장의 사진 동아리",
        "pageDesc": "필름과 디지털, 다큐와 패션 — 사진으로 세상을 다시 보는 사람들"
      },
      "blocks": [
        {
          "id": "h1", "type": "heroSlider", "height": 78, "h1Size": 68, "subtitleSize": 17,
          "slideAnim": "fade",
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
          "id": "title1", "type": "text", "seoTag": "h2", "align": "center",
          "text": "사진은\n==한 번 보고== 끝나지 않습니다",
          "fontSize": 44, "fontWeight": 900,
          "textColor": "#0a0a0a", "highlightColor": "#0a0a0a",
          "lineHeight": 1.15, "letterSpacing": -0.02,
          "paddingTop": 120, "paddingBottom": 20, "maxWidth": 780,
          "textShadow": "",
          "textStroke": 0
        },
        {
          "id": "subt1", "type": "text", "seoTag": "p", "align": "center",
          "text": "찰나에 멈춘 빛은 보는 사람의 시간을 늦춥니다.\n프레임은 그 \"늦춰지는 시간\"을 함께 들여다보는 사람들입니다.",
          "fontSize": 17, "textColor": "#525252", "lineHeight": 1.9,
          "paddingTop": 0, "paddingBottom": 100, "maxWidth": 620
        },
        {
          "id": "bento1", "type": "layoutContainer", "mode": "grid",
          "cols": 4, "gap": 8, "paddingY": 0, "paddingX": 32,
          "rowHeight": 280, "maxWidth": 1440,
          "bgColor": "#fafaf9",
          "cellAnimation": "fadeIn", "cellHover": "scale",
          "cells": [
            { "id": "g1", "imgPosition": "bg", "bgOverlay": 0, "colSpan": 2, "rowSpan": 2,
              "imgSrc": "https://images.unsplash.com/photo-1500051638674-ff996a0ec29e?auto=format&fit=crop&w=1200&q=80",
              "title": "spring 2025", "text": "신촌, 4월의 첫 햇살",
              "titleColor": "#ffffff", "textColor": "#e5e5e5", "titleSize": 20, "textSize": 13,
              "align": "left", "padding": 28, "borderRadius": 4, "borderWidth": 0, "borderColor": "transparent" },
            { "id": "g2", "imgPosition": "bg", "bgOverlay": 0, "colSpan": 2, "rowSpan": 1,
              "imgSrc": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
              "title": "", "text": "", "padding": 0, "borderRadius": 4, "borderWidth": 0, "borderColor": "transparent" },
            { "id": "g3", "imgPosition": "bg", "bgOverlay": 0,
              "imgSrc": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=900&q=80",
              "title": "", "text": "", "padding": 0, "borderRadius": 4, "borderWidth": 0, "borderColor": "transparent" },
            { "id": "g4", "imgPosition": "bg", "bgOverlay": 0,
              "imgSrc": "https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&w=900&q=80",
              "title": "", "text": "", "padding": 0, "borderRadius": 4, "borderWidth": 0, "borderColor": "transparent" }
          ]
        },
        {
          "id": "shape1", "type": "layoutContainer", "mode": "grid",
          "cols": 2, "gap": 64, "paddingY": 160, "paddingX": 80,
          "bgColor": "#fafaf9", "maxWidth": 1280,
          "bgShape": { "type": "circle", "size": 720, "color": "#fde047", "opacity": 80, "x": 78, "y": 50, "zOrder": "back" },
          "cells": [
            { "id": "v1", "title": "VISION",
              "text": "프레임은 \"한 학기에 한 권의 사진집\"을 만드는 동아리입니다.\n매 학기 한 가지 주제를 정해 부원 전체가 매주 촬영하고, 학기 말 함께 한 권의 사진집으로 묶습니다.",
              "titleSize": 24, "textSize": 15, "titleColor": "#0a0a0a", "textColor": "#404040",
              "align": "left", "bgColor": "transparent", "padding": 24, "borderRadius": 0,
              "borderWidth": 0, "borderColor": "transparent", "imgSrc": "" },
            { "id": "v2", "title": "VOICE",
              "text": "정답이 정해진 사진은 없습니다.\n각자의 보는 방식이 다르다는 걸 인정하고, 매주 서로의 컷에 대해 솔직한 피드백을 주고받는 시간을 가집니다.",
              "titleSize": 24, "textSize": 15, "titleColor": "#0a0a0a", "textColor": "#404040",
              "align": "left", "bgColor": "transparent", "padding": 24, "borderRadius": 0,
              "borderWidth": 0, "borderColor": "transparent", "imgSrc": "" }
          ]
        },
        {
          "id": "split2", "type": "splitSection",
          "imgSide": "left", "imgRatio": "60", "fullBleed": false,
          "bgColor": "#0a0a0a", "paddingY": 120, "gap": 80,
          "imgSrc": "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=1400&q=80",
          "imgRadius": 0, "imgMaxHeight": 620,
          "badge": "EXHIBITION",
          "heading": "VOL.07\n사이의 거리",
          "headingSize": 40, "headingColor": "#fafaf9",
          "body": "2025년 봄 정기 전시. 도시에서 사람과 사람 사이가 만드는 \"눈에 보이지 않는 거리\"를 30컷의 흑백 필름으로 담았습니다.",
          "bodySize": 17, "bodyColor": "#a3a3a3",
          "ctaText": "전시 자세히 보기", "ctaShape": "underline", "ctaHref": "#"
        },
        {
          "id": "car2", "type": "layoutContainer", "mode": "carousel",
          "cols": 3, "gap": 24, "paddingY": 120, "paddingX": 64,
          "bgColor": "#fafaf9", "maxWidth": 1440,
          "autoplay": false,
          "cellHover": "lift",
          "cells": [
            { "id": "m1", "title": "김지호", "text": "캡틴 · 19학번 · 디자인학과\n\n주로 다큐멘터리. 첫 사진집 《도시의 새벽》(2024)",
              "imgPosition": "top", "imgHeight": 280,
              "imgSrc": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80",
              "bgColor": "#ffffff", "titleColor": "#0a0a0a", "textColor": "#525252",
              "titleSize": 18, "textSize": 13, "padding": 20, "borderRadius": 4, "borderWidth": 1, "borderColor": "#e5e5e5",
              "align": "left", "showArrow": false },
            { "id": "m2", "title": "이수민", "text": "총무 · 20학번 · 인문학부\n\n패션·인물 사진. 잡지 인턴 출신.",
              "imgPosition": "top", "imgHeight": 280,
              "imgSrc": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
              "bgColor": "#ffffff", "titleColor": "#0a0a0a", "textColor": "#525252",
              "titleSize": 18, "textSize": 13, "padding": 20, "borderRadius": 4, "borderWidth": 1, "borderColor": "#e5e5e5",
              "align": "left", "showArrow": false },
            { "id": "m3", "title": "박지환", "text": "기획 · 21학번 · 시각디자인학과\n\n도시·건축 사진. 인스타 35k 팔로워.",
              "imgPosition": "top", "imgHeight": 280,
              "imgSrc": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
              "bgColor": "#ffffff", "titleColor": "#0a0a0a", "textColor": "#525252",
              "titleSize": 18, "textSize": 13, "padding": 20, "borderRadius": 4, "borderWidth": 1, "borderColor": "#e5e5e5",
              "align": "left", "showArrow": false },
            { "id": "m4", "title": "최은서", "text": "큐레이터 · 22학번 · 사진학과\n\n필름 전문. 라이카 M6 사용.",
              "imgPosition": "top", "imgHeight": 280,
              "imgSrc": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80",
              "bgColor": "#ffffff", "titleColor": "#0a0a0a", "textColor": "#525252",
              "titleSize": 18, "textSize": 13, "padding": 20, "borderRadius": 4, "borderWidth": 1, "borderColor": "#e5e5e5",
              "align": "left", "showArrow": false }
          ]
        },
        {
          "id": "cta-frame", "type": "button", "text": "신입 부원 지원하기",
          "actionType": "modal",
          "btnSize": "l", "btnBg": "#0a0a0a", "btnTextColor": "#fafaf9",
          "radius": 0, "paddingY": 120, "bgColor": "#fafaf9"
        }
      ]
    }'::jsonb,
    now(), now()
  )
  ;


  -- ──────────────── 2-C) 스파이크 — 임팩트/오렌지, 링크행 + 원형CTA ────────────────
  INSERT INTO public.club_pages (club_id, blocks, published_at, updated_at)
  VALUES (
    v_spike_id,
    '{
      "config": {
        "activeTheme": "orange-500",
        "coverImg": "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1920&q=80",
        "clubName": "SPIKE",
        "hashtag1": "배구",
        "hashtag2": "리그",
        "badgeText": "2025 시즌 모집",
        "showFloatingBtn": true,
        "contentWidth": "full",
        "pageBgColor": "#ffffff",
        "pageTitle": "SPIKE | 대학 배구 동아리",
        "pageDesc": "체육관에서 만들어지는 가장 진한 우정"
      },
      "blocks": [
        {
          "id": "h1", "type": "heroSlider", "height": 78, "h1Size": 72, "subtitleSize": 17,
          "slideAnim": "fade",
          "slides": [
            { "id": "s1", "bgType": "image",
              "bgValue": "https://images.unsplash.com/photo-1592656094267-764a45160876?auto=format&fit=crop&w=2400&q=80",
              "overlayOpacity": 45, "align": "left",
              "h1": "Game on.\n==Game on.==\nGame on.",
              "subtitle": "지난 시즌 3대학 연합 리그 우승 — 우리는 이긴 적 있고, 또 이깁니다.",
              "ctaText": "2025 시즌 합류", "ctaShow": true }
          ]
        },
        {
          "id": "stat", "type": "stats", "layout": "cards", "cols": 4, "paddingY": 64,
          "bgColor": "#ffffff", "cardBg": "#fff7ed", "borderColor": "#fed7aa",
          "valueSize": 40, "labelSize": 12,
          "valueColor": "#9a3412", "labelColor": "#78716c", "animate": true, "accentLine": true,
          "items": [
            { "id": "a", "value": "3", "label": "연합 리그 우승" },
            { "id": "b", "value": "48", "label": "활동 부원" },
            { "id": "c", "value": "11년", "label": "이어진 동아리" },
            { "id": "d", "value": "주2회", "label": "정기 훈련" }
          ]
        },
        {
          "id": "linkrows", "type": "layoutContainer", "mode": "grid",
          "cols": 1, "gap": 0, "paddingY": 80, "paddingX": 32,
          "bgColor": "#fafaf9", "maxWidth": 1080,
          "cellHover": "border",
          "bgWatermark": { "text": "SPIKE", "fontSize": 320, "opacity": 5, "color": "#ea580c", "position": "top-right" },
          "cells": [
            { "id": "r1", "title": "TRAINING", "text": "주 2회 정기 훈련 · 화·목 19:00 — 학내 체육관",
              "titleSize": 20, "textSize": 13, "titleColor": "#0a0a0a", "textColor": "#525252",
              "bgColor": "#ffffff", "padding": 32, "borderRadius": 0,
              "borderWidth": 1, "borderColor": "#e5e5e5",
              "align": "left", "showArrow": true, "href": "#", "imgSrc": "" },
            { "id": "r2", "title": "LEAGUE", "text": "5월·11월 정기 리그 · 3대학 연합 + 지역 컵 대회",
              "titleSize": 20, "textSize": 13, "titleColor": "#0a0a0a", "textColor": "#525252",
              "bgColor": "#ffffff", "padding": 32, "borderRadius": 0,
              "borderWidth": 1, "borderColor": "#e5e5e5",
              "align": "left", "showArrow": true, "href": "#", "imgSrc": "" },
            { "id": "r3", "title": "COMMUNITY", "text": "월 1회 회식·MT·OB 매치 · 졸업해도 이어지는 네트워크",
              "titleSize": 20, "textSize": 13, "titleColor": "#0a0a0a", "textColor": "#525252",
              "bgColor": "#ffffff", "padding": 32, "borderRadius": 0,
              "borderWidth": 1, "borderColor": "#e5e5e5",
              "align": "left", "showArrow": true, "href": "#", "imgSrc": "" }
          ]
        },
        {
          "id": "bento", "type": "layoutContainer", "mode": "grid",
          "cols": 3, "gap": 12, "paddingY": 100, "paddingX": 32,
          "bgColor": "#ffffff", "rowHeight": 240, "maxWidth": 1440,
          "cells": [
            { "id": "p1", "imgPosition": "bg", "bgOverlay": 50, "colSpan": 2, "rowSpan": 2,
              "imgSrc": "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1600&q=80",
              "title": "2024 결승 매치", "text": "한양·고려·연세 3대학 연합 리그. 풀세트 끝에 우리가 이겼다.",
              "titleColor": "#ffffff", "textColor": "#fff7ed", "titleSize": 24, "textSize": 14,
              "align": "left", "padding": 36, "borderRadius": 0, "borderWidth": 0, "borderColor": "transparent" },
            { "id": "p2", "imgPosition": "bg", "bgOverlay": 30,
              "imgSrc": "https://images.unsplash.com/photo-1576858574144-9ae1ebcf5ae5?auto=format&fit=crop&w=900&q=80",
              "title": "", "text": "", "padding": 0, "borderRadius": 0, "borderWidth": 0, "borderColor": "transparent" },
            { "id": "p3", "imgPosition": "bg", "bgOverlay": 30,
              "imgSrc": "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=900&q=80",
              "title": "", "text": "", "padding": 0, "borderRadius": 0, "borderWidth": 0, "borderColor": "transparent" }
          ]
        },
        {
          "id": "split3", "type": "splitSection",
          "imgSide": "right", "imgRatio": "50", "fullBleed": true, "minHeight": 520,
          "bgColor": "#0a0a0a", "paddingY": 80, "gap": 64,
          "imgSrc": "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1400&q=80",
          "badge": "2025 ROSTER",
          "heading": "이번 시즌,\n==너==를 기다린다.",
          "headingSize": 44, "headingColor": "#ffffff",
          "body": "포지션 무관. 경험 무관. 자세만 보겠습니다. 매주 화·목 저녁 체육관에서 만나는 게, 한 학기 가장 즐거운 일이 되도록 만들 자신이 있습니다.",
          "bodySize": 17, "bodyColor": "#d4d4d8",
          "ctaText": "JOIN",
          "ctaShape": "circle-arrow", "ctaHref": ""
        },
        {
          "id": "timeline", "type": "timeline", "title": "2025 시즌 일정",
          "layout": "horizontal", "activeColor": "#ea580c", "lineColor": "#d1d5db",
          "paddingY": 100, "bgColor": "#ffffff",
          "nodes": [
            { "id": "n1", "title": "3월", "desc": "신규 부원 OT · 첫 합동 훈련" },
            { "id": "n2", "title": "5월", "desc": "춘계 3대학 연합 리그" },
            { "id": "n3", "title": "7월", "desc": "여름 합숙 · 지역 컵 대회" },
            { "id": "n4", "title": "9월", "desc": "복귀 훈련 · 신입 2차 모집" },
            { "id": "n5", "title": "11월", "desc": "추계 정기 리그 · 결승" }
          ]
        },
        {
          "id": "faq", "type": "faq", "title": "자주 묻는 질문",
          "iconStyle": "plus", "openBg": "#fff7ed", "borderRadius": 8,
          "items": [
            { "id": "fq1", "question": "초보자도 가능한가요?",
              "answer": "네. 매 시즌 약 30%가 입회 전 배구 경험이 없습니다. 기초 클래스를 별도로 운영합니다." },
            { "id": "fq2", "question": "회비와 활동비가 얼마인가요?",
              "answer": "학기당 회비 60,000원(체육관 대관·유니폼·간식). 합숙·리그 출전 시 별도." },
            { "id": "fq3", "question": "여자 부원도 활동 가능한가요?",
              "answer": "네. 혼성 팀과 여자부 팀을 별도로 운영합니다. 리그도 혼성·여자부 둘 다 출전합니다." }
          ]
        },
        {
          "id": "cta", "type": "button", "text": "2025 시즌 합류하기",
          "actionType": "modal",
          "btnSize": "l", "btnBg": "#ea580c", "btnTextColor": "#ffffff",
          "radius": 0, "paddingY": 120, "bgColor": "#ffffff"
        }
      ]
    }'::jsonb,
    now(), now()
  )
  ;


  RAISE NOTICE '데모 동아리 3종 시드 완료 (codewave: %, frame: %, spike: %)',
    v_codewave_id, v_frame_id, v_spike_id;
END;
$$;
