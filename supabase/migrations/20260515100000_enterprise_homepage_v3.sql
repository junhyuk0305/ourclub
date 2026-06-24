-- Enterprise homepage v3: full-bleed design, featured gallery, fullBleed splitSection
DO $$
DECLARE
  v_club_id uuid;
  v_payload  jsonb;
  v_config   jsonb;
BEGIN
  SELECT id INTO v_club_id FROM clubs WHERE name = '데브 허슬러' LIMIT 1;
  IF v_club_id IS NULL THEN
    RAISE NOTICE 'Club "데브 허슬러" not found, skipping.';
    RETURN;
  END IF;

  v_config := '{"contentWidth":"full","activeTheme":"orange-500","pageBgColor":"#ffffff","clubName":"데브 허슬러","showFloatingBtn":true}'::jsonb;

  v_payload := jsonb_build_object('config', v_config, 'blocks', '[
    {
      "id": "b1", "type": "heroSlider",
      "slides": [
        {
          "id": "s1",
          "heading": "도전하는 개발자들의\n커뮤니티, 데브 허슬러",
          "subheading": "사이드 프로젝트부터 실전 팀 협업까지\n함께 성장하는 공간입니다.",
          "bgColor": "#0a0a0a",
          "headingColor": "#ffffff",
          "subheadingColor": "#a1a1aa",
          "ctaText": "지원하기",
          "ctaUrl": "",
          "ctaBg": "#f97316",
          "ctaColor": "#ffffff",
          "ctaRadius": 0,
          "overlayOpacity": 0.55,
          "height": 680,
          "align": "left"
        },
        {
          "id": "s2",
          "heading": "매 학기 20+\n실전 프로젝트 진행",
          "subheading": "아이디어 기획부터 배포까지\n전 과정을 팀으로 경험합니다.",
          "bgColor": "#111827",
          "headingColor": "#ffffff",
          "subheadingColor": "#9ca3af",
          "ctaText": "활동 보기",
          "ctaUrl": "",
          "ctaBg": "#ffffff",
          "ctaColor": "#000000",
          "ctaRadius": 0,
          "height": 680,
          "align": "center"
        }
      ],
      "autoplay": true,
      "interval": 5000
    },
    {
      "id": "b2", "type": "stats",
      "layout": "cards",
      "cols": 4,
      "bgColor": "#ffffff",
      "cardBg": "#f9fafb",
      "borderColor": "#e5e7eb",
      "accentLine": true,
      "paddingY": 72,
      "animate": true,
      "items": [
        { "id": "s1", "icon": "🚀", "value": 120, "suffix": "+", "label": "누적 프로젝트", "valueSize": 44, "labelSize": 13 },
        { "id": "s2", "icon": "👥", "value": 280, "suffix": "+", "label": "졸업 멤버 수", "valueSize": 44, "labelSize": 13 },
        { "id": "s3", "icon": "🏆", "value": 18,  "suffix": "회", "label": "수상 이력", "valueSize": 44, "labelSize": 13 },
        { "id": "s4", "icon": "📅", "value": 7,   "suffix": "년", "label": "운영 연수", "valueSize": 44, "labelSize": 13 }
      ]
    },
    {
      "id": "b3", "type": "splitSection",
      "fullBleed": true,
      "imgSide": "left",
      "imgRatio": "55",
      "imgSrc": "",
      "badge": "What We Do",
      "heading": "우리는 코딩을\n넘어 성장합니다",
      "headingSize": 40,
      "headingColor": "#111827",
      "body": "매주 진행되는 세션에서 실전 기술을 익히고,\n팀 프로젝트를 통해 협업 역량을 키웁니다.\n단순한 스터디가 아닌 진짜 제품을 만드는 경험입니다.",
      "bodySize": 16,
      "bodyColor": "#6b7280",
      "ctaText": "활동 소개 보기",
      "ctaUrl": "",
      "ctaRadius": 0,
      "bgColor": "#ffffff",
      "paddingY": 80,
      "gap": 64,
      "minHeight": 560
    },
    {
      "id": "b4", "type": "splitSection",
      "fullBleed": true,
      "imgSide": "right",
      "imgRatio": "50",
      "imgSrc": "",
      "badge": "Recruitment",
      "heading": "매 학기\n새 멤버를 모집합니다",
      "headingSize": 40,
      "headingColor": "#ffffff",
      "body": "서류 → 코딩 테스트 → 팀 인터뷰의\n3단계 전형을 통해 동료를 선발합니다.\n실력보다 열정과 성장 의지를 중시합니다.",
      "bodySize": 16,
      "bodyColor": "#9ca3af",
      "ctaText": "지원하기",
      "ctaUrl": "",
      "ctaRadius": 0,
      "bgColor": "#111827",
      "paddingY": 80,
      "gap": 64,
      "minHeight": 560
    },
    {
      "id": "b5", "type": "quote",
      "text": "데브 허슬러에서 만든 첫 프로젝트가 제 커리어의 전환점이 됐습니다. 단순히 코드를 짜는 게 아니라 ''어떻게 팀으로 일하는가''를 배웠습니다.",
      "attribution": "— 김민준, 21기 / 현 네이버 FE 엔지니어",
      "fontSize": 22,
      "textColor": "#f9fafb",
      "bgColor": "#0a0a0a",
      "paddingY": 96,
      "align": "center",
      "maxWidth": 760,
      "accentColor": "#f97316"
    },
    {
      "id": "b6", "type": "gallery",
      "layout": "featured",
      "cols": 3,
      "gap": 6,
      "radius": 4,
      "paddingY": 0,
      "bgColor": "#f4f4f5",
      "images": [
        { "id": "g1", "src": "", "alt": "해커톤 현장" },
        { "id": "g2", "src": "", "alt": "세미나" },
        { "id": "g3", "src": "", "alt": "팀 미팅" },
        { "id": "g4", "src": "", "alt": "발표" },
        { "id": "g5", "src": "", "alt": "MT" },
        { "id": "g6", "src": "", "alt": "졸업 파티" },
        { "id": "g7", "src": "", "alt": "프로젝트 발표" },
        { "id": "g8", "src": "", "alt": "워크샵" },
        { "id": "g9", "src": "", "alt": "네트워킹" }
      ]
    },
    {
      "id": "b7", "type": "stats",
      "layout": "strip",
      "cols": 3,
      "bgColor": "#f97316",
      "paddingY": 56,
      "animate": true,
      "items": [
        { "id": "t1", "value": 96, "suffix": "%", "label": "프로젝트 완료율", "valueSize": 52, "labelSize": 14, "valueColor": "#ffffff", "labelColor": "#ffffff" },
        { "id": "t2", "value": 4.8, "suffix": "/5", "label": "멤버 만족도", "valueSize": 52, "labelSize": 14, "valueColor": "#ffffff", "labelColor": "#ffffff" },
        { "id": "t3", "value": 73, "suffix": "%", "label": "취업 연계율", "valueSize": 52, "labelSize": 14, "valueColor": "#ffffff", "labelColor": "#ffffff" }
      ]
    },
    {
      "id": "b8", "type": "members",
      "cols": 4,
      "bgColor": "#ffffff",
      "cardBg": "#f9fafb",
      "paddingY": 80,
      "accentStyle": "ring",
      "imgStyle": "circle",
      "items": [
        { "id": "m1", "name": "박서연", "role": "회장 / PM", "bio": "서비스 기획 3년 / 스타트업 창업 경험", "imgSrc": "" },
        { "id": "m2", "name": "이준호", "role": "기술 리드 / FE", "bio": "React · TypeScript 전문, 오픈소스 기여자", "imgSrc": "" },
        { "id": "m3", "name": "김다은", "role": "디자인 리드", "bio": "Figma 마스터 / 브랜딩 프로젝트 다수", "imgSrc": "" },
        { "id": "m4", "name": "최민석", "role": "백엔드 리드", "bio": "Node.js · PostgreSQL · 클라우드 인프라", "imgSrc": "" }
      ]
    },
    {
      "id": "b9", "type": "timeline",
      "bgColor": "#0a0a0a",
      "textColor": "#f9fafb",
      "paddingY": 80,
      "items": [
        { "id": "t1", "period": "3월", "title": "신입 모집 & OT", "desc": "서류 → 코딩 테스트 → 팀 인터뷰 3단계 전형" },
        { "id": "t2", "period": "4–5월", "title": "스킬업 세션", "desc": "주 1회 기술 세션 (프론트엔드·백엔드·디자인)" },
        { "id": "t3", "period": "6월", "title": "팀 프로젝트 킥오프", "desc": "3–4인 팀 구성 후 실전 프로젝트 시작" },
        { "id": "t4", "period": "8월", "title": "데모데이", "desc": "전체 멤버 앞 발표 · 외부 심사위원 초청" },
        { "id": "t5", "period": "9월", "title": "2학기 시작", "desc": "상반기 팀 유지 또는 리셔플 후 심화 프로젝트" }
      ]
    },
    {
      "id": "b10", "type": "layoutContainer",
      "cols": 2,
      "bgColor": "#ffffff",
      "paddingY": 80,
      "gap": 24,
      "cells": [
        {
          "id": "c1",
          "heading": "모집 자격",
          "headingSize": 20,
          "headingColor": "#111827",
          "body": "• 전공 무관, 개발 의지가 있는 대학생\n• 매주 세션 참여 가능한 분\n• 팀 프로젝트에 적극적으로 기여할 의지",
          "bodySize": 15,
          "bodyColor": "#374151",
          "bg": "#f9fafb",
          "paddingY": 40,
          "paddingX": 40,
          "radius": 0
        },
        {
          "id": "c2",
          "heading": "지원 방법",
          "headingSize": 20,
          "headingColor": "#111827",
          "body": "① 지원서 작성 후 제출\n② 코딩 테스트 (온라인 1시간)\n③ 팀 인터뷰 (30분)\n\n매 학기 초 모집 공고를 확인하세요.",
          "bodySize": 15,
          "bodyColor": "#374151",
          "bg": "#fff7ed",
          "paddingY": 40,
          "paddingX": 40,
          "radius": 0
        }
      ]
    },
    {
      "id": "b11", "type": "faq",
      "bgColor": "#f9fafb",
      "paddingY": 80,
      "items": [
        { "id": "f1", "q": "비전공자도 지원할 수 있나요?", "a": "네, 전공 무관입니다. 단 기초적인 프로그래밍 개념을 이해하고 계신 분을 선호합니다. 온라인 강의 수준이면 충분합니다." },
        { "id": "f2", "q": "주당 활동 시간은 얼마나 되나요?", "a": "주 1회 세션(2시간) + 팀 프로젝트 자율 협업 시간입니다. 팀마다 다르지만 평균 주 4–6시간 정도 소요됩니다." },
        { "id": "f3", "q": "프로젝트는 어떻게 진행되나요?", "a": "3–4인 팀이 학기 중 하나의 제품을 기획·개발합니다. 스택은 자유이며, 멘토가 주기적으로 피드백을 제공합니다." },
        { "id": "f4", "q": "활동비나 장비 지원이 있나요?", "a": "클라우드 크레딧(AWS/GCP), Figma 프로, 일부 외부 행사 참가비를 지원합니다. 별도 회비는 없습니다." }
      ]
    },
    {
      "id": "b12", "type": "button",
      "text": "지금 지원하기",
      "bgColor": "#0a0a0a",
      "paddingY": 80,
      "align": "center",
      "variant": "filled",
      "size": "lg",
      "radius": 0
    }
  ]'::jsonb);

  IF EXISTS (SELECT 1 FROM club_pages WHERE club_id = v_club_id) THEN
    UPDATE club_pages
    SET blocks = v_payload, published_at = now(), updated_at = now()
    WHERE club_id = v_club_id;
  ELSE
    INSERT INTO club_pages (club_id, blocks, published_at, updated_at)
    VALUES (v_club_id, v_payload, now(), now());
  END IF;

  RAISE NOTICE 'Enterprise homepage v3 applied to club %', v_club_id;
END;
$$;
