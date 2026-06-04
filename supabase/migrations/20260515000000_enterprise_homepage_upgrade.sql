-- 데브 허슬러 엔터프라이즈급 홈페이지 업그레이드 v2
-- splitSection, quote, stats(cards), members(ring accent) 포함한 디자인 고도화 버전

DO $$
DECLARE
  v_club_id uuid;
  v_new_blocks jsonb;
BEGIN
  SELECT id INTO v_club_id
  FROM clubs
  WHERE name = '데브 허슬러'
  LIMIT 1;

  IF v_club_id IS NULL THEN
    RAISE NOTICE '데브 허슬러 클럽을 찾을 수 없습니다. 클럽을 먼저 생성하세요.';
    RETURN;
  END IF;

  v_new_blocks := '{
    "config": {
      "activeTheme": "black",
      "coverImg": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1920&q=80",
      "clubName": "데브 허슬러",
      "hashtag1": "개발",
      "hashtag2": "성장",
      "badgeText": "25기 모집중",
      "showFloatingBtn": true,
      "contentWidth": "1024",
      "pageBgColor": "#ffffff",
      "globalFont": "",
      "pageTitle": "데브 허슬러 | 코드로 성장하는 개발자 동아리",
      "pageDesc": "실전 프로젝트와 코드 리뷰로 함께 성장하는 개발자 커뮤니티, 데브 허슬러"
    },
    "blocks": [
      {
        "id": "b1", "type": "heroSlider", "height": 85, "autoPlay": true, "interval": 5000,
        "h1Size": 64, "subtitleSize": 18,
        "slides": [
          {
            "id": "s1", "bgType": "color", "bgValue": "#0a0a0a", "overlayOpacity": 0,
            "align": "center",
            "h1": "코드로 세상을\n바꾸는 사람들",
            "subtitle": "실전 프로젝트 · 코드 리뷰 · 현업 멘토링 · 네트워킹",
            "ctaText": "25기 지원하기", "ctaShow": true
          },
          {
            "id": "s2", "bgType": "image",
            "bgValue": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80",
            "overlayOpacity": 0.65,
            "align": "center",
            "h1": "함께 배우고\n같이 성장합니다",
            "subtitle": "2020년 창립 · 졸업생 200+ · 현업 취업 30+",
            "ctaText": "활동 더 보기", "ctaShow": true
          }
        ]
      },

      {
        "id": "b2", "type": "stats",
        "layout": "cards",
        "items": [
          { "id": "si1", "icon": "🎓", "value": "200+", "label": "누적 졸업생" },
          { "id": "si2", "icon": "🚀", "value": "50+",  "label": "완성된 프로젝트" },
          { "id": "si3", "icon": "💼", "value": "30+",  "label": "현업 취업 성공" },
          { "id": "si4", "icon": "📅", "value": "5년",  "label": "운영 역사" }
        ],
        "cols": 4,
        "bgColor": "#ffffff",
        "cardBg": "#fafafa",
        "borderColor": "#e5e7eb",
        "accentLine": true,
        "valueColor": "#111827",
        "labelColor": "#6b7280",
        "valueSize": 44,
        "labelSize": 13,
        "paddingY": 64,
        "animate": true
      },

      {
        "id": "b3", "type": "splitSection",
        "imgSide": "right",
        "imgRatio": "50",
        "imgRadius": 16,
        "imgMaxHeight": 520,
        "imgSrc": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
        "badge": "우리가 다른 이유",
        "heading": "단순 스터디가 아닌\n실전 프로덕트를 만듭니다",
        "headingSize": 40,
        "headingColor": "#0a0a0a",
        "body": "데브 허슬러는 매 기수마다 실제 사용자가 있는 서비스를 기획하고 개발합니다.\n\n기술 스택 선정부터 배포, 운영까지 — 현업 개발자가 경험하는 모든 과정을 함께 합니다.\n\n5년간 50개 이상의 프로젝트를 완성했고, 그중 일부는 현재도 운영 중입니다.",
        "bodySize": 16,
        "bodyColor": "#6b7280",
        "ctaText": "프로젝트 더 보기",
        "ctaRadius": 0,
        "bgColor": "#ffffff",
        "paddingY": 96,
        "gap": 72
      },

      {
        "id": "b4", "type": "splitSection",
        "imgSide": "left",
        "imgRatio": "50",
        "imgRadius": 16,
        "imgMaxHeight": 480,
        "imgSrc": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
        "badge": "코드 리뷰 문화",
        "heading": "매주 서로의 코드를\n리뷰합니다",
        "headingSize": 40,
        "headingColor": "#0a0a0a",
        "body": "주간 코드 리뷰 세션에서 팀원의 PR을 꼼꼼히 검토하고 피드백을 주고받습니다.\n\n리뷰어가 되는 과정에서 리뷰이보다 더 많이 배웁니다. 이것이 데브 허슬러가 빠르게 성장하는 비결입니다.",
        "bodySize": 16,
        "bodyColor": "#6b7280",
        "ctaText": "",
        "ctaRadius": 0,
        "bgColor": "#f9fafb",
        "paddingY": 96,
        "gap": 72
      },

      {
        "id": "b5", "type": "quote",
        "text": "데브 허슬러에서 6개월 동안 배운 것이 대학교 3년보다 많았습니다. 실전 프로젝트와 코드 리뷰가 저를 완전히 바꿔놓았습니다.",
        "attribution": "— 박○○, 22기 졸업 · 현 카카오 개발자",
        "avatarSrc": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
        "fontSize": 22,
        "textColor": "#111827",
        "accentColor": "",
        "bgColor": "#0a0a0a",
        "paddingY": 80,
        "align": "center",
        "maxWidth": 760
      },

      { "id": "b6", "type": "spacer", "height": 80 },

      {
        "id": "b7", "type": "text", "seoTag": "h2", "align": "center", "animation": "slideIn",
        "text": "기술 스택",
        "fontSize": 34, "fontWeight": 900, "textColor": "#0a0a0a",
        "lineHeight": 1.2, "paddingTop": 0, "paddingBottom": 12, "maxWidth": 720
      },
      {
        "id": "b8", "type": "text", "seoTag": "p", "align": "center",
        "text": "현업에서 실제로 사용하는 기술을 처음부터 함께 배웁니다.",
        "fontSize": 16, "fontWeight": 400, "textColor": "#6b7280",
        "lineHeight": 1.7, "paddingTop": 0, "paddingBottom": 40, "maxWidth": 520
      },
      {
        "id": "b9", "type": "layoutContainer", "cols": 2, "gap": 20, "paddingY": 0, "bgColor": "transparent",
        "cells": [
          {
            "id": "d1", "title": "Frontend",
            "text": "React · TypeScript · Next.js · Tailwind CSS\n\n프로덕션급 프론트엔드 개발 경험을 쌓습니다.",
            "align": "left", "bgColor": "#f9fafb", "titleColor": "#0a0a0a", "textColor": "#374151",
            "titleSize": 17, "textSize": 14, "padding": 28, "borderRadius": 8, "borderWidth": 1, "borderColor": "#e5e7eb", "imgSrc": ""
          },
          {
            "id": "d2", "title": "Backend",
            "text": "Node.js · FastAPI · PostgreSQL · Docker\n\n서버부터 DB 설계까지 직접 구현합니다.",
            "align": "left", "bgColor": "#f9fafb", "titleColor": "#0a0a0a", "textColor": "#374151",
            "titleSize": 17, "textSize": 14, "padding": 28, "borderRadius": 8, "borderWidth": 1, "borderColor": "#e5e7eb", "imgSrc": ""
          },
          {
            "id": "d3", "title": "DevOps",
            "text": "AWS · Vercel · GitHub Actions · CI/CD\n\n자동화 배포 파이프라인을 직접 구축합니다.",
            "align": "left", "bgColor": "#f9fafb", "titleColor": "#0a0a0a", "textColor": "#374151",
            "titleSize": 17, "textSize": 14, "padding": 28, "borderRadius": 8, "borderWidth": 1, "borderColor": "#e5e7eb", "imgSrc": ""
          },
          {
            "id": "d4", "title": "Collaboration",
            "text": "GitHub · Notion · Figma · Jira\n\n팀 협업과 프로젝트 관리 실전 경험을 쌓습니다.",
            "align": "left", "bgColor": "#f9fafb", "titleColor": "#0a0a0a", "textColor": "#374151",
            "titleSize": 17, "textSize": 14, "padding": 28, "borderRadius": 8, "borderWidth": 1, "borderColor": "#e5e7eb", "imgSrc": ""
          }
        ]
      },

      { "id": "b10", "type": "spacer", "height": 80 },

      {
        "id": "b11", "type": "text", "seoTag": "h2", "align": "center", "animation": "slideIn",
        "text": "활동 소개 영상",
        "fontSize": 34, "fontWeight": 900, "textColor": "#0a0a0a",
        "lineHeight": 1.2, "paddingTop": 0, "paddingBottom": 12, "maxWidth": 720
      },
      {
        "id": "b12", "type": "text", "seoTag": "p", "align": "center",
        "text": "데브 허슬러의 실제 활동 현장을 영상으로 만나보세요.",
        "fontSize": 16, "fontWeight": 400, "textColor": "#6b7280",
        "lineHeight": 1.7, "paddingTop": 0, "paddingBottom": 32, "maxWidth": 520
      },
      {
        "id": "b13", "type": "video",
        "url": "https://www.youtube.com/watch?v=Ke90Tje7VS0",
        "radius": 12, "paddingY": 0
      },

      { "id": "b14", "type": "spacer", "height": 80 },

      {
        "id": "b15", "type": "text", "seoTag": "h2", "align": "center", "animation": "slideUp",
        "text": "함께하는 멤버들",
        "fontSize": 34, "fontWeight": 900, "textColor": "#0a0a0a",
        "lineHeight": 1.2, "paddingTop": 0, "paddingBottom": 12, "maxWidth": 720
      },
      {
        "id": "b16", "type": "text", "seoTag": "p", "align": "center",
        "text": "열정 있는 개발자들이 함께 성장하고 있습니다.",
        "fontSize": 16, "fontWeight": 400, "textColor": "#6b7280",
        "lineHeight": 1.7, "paddingTop": 0, "paddingBottom": 48, "maxWidth": 480
      },
      {
        "id": "b17", "type": "members",
        "accentStyle": "ring",
        "items": [
          {
            "id": "m1", "name": "김준혁", "role": "회장 · 백엔드",
            "bio": "Node.js / PostgreSQL 전공. 사이드 프로젝트 10개 완성.",
            "imgSrc": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
            "sns": ""
          },
          {
            "id": "m2", "name": "이수현", "role": "부회장 · 프론트엔드",
            "bio": "React / TypeScript 전공. 스타트업 인턴 경험 보유.",
            "imgSrc": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face",
            "sns": ""
          },
          {
            "id": "m3", "name": "박민재", "role": "기술 리더 · 풀스택",
            "bio": "AWS / Docker 전문. CI/CD 파이프라인 구축 경험.",
            "imgSrc": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face",
            "sns": ""
          },
          {
            "id": "m4", "name": "최유진", "role": "디자인 리더 · UI/UX",
            "bio": "Figma 전문. 디자인 시스템 구축 및 사용자 리서치 담당.",
            "imgSrc": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=face",
            "sns": ""
          },
          {
            "id": "m5", "name": "정다은", "role": "DevOps 리더",
            "bio": "쿠버네티스 / Terraform 전공. 인프라 자동화 전문.",
            "imgSrc": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
            "sns": ""
          },
          {
            "id": "m6", "name": "윤태양", "role": "기획 리더 · PM",
            "bio": "프로젝트 매니지먼트 전공. Notion / Jira 도구 전문.",
            "imgSrc": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
            "sns": ""
          }
        ],
        "cols": 3,
        "imgStyle": "circle",
        "bgColor": "#ffffff",
        "cardBg": "#f9fafb",
        "paddingY": 0
      },

      { "id": "b18", "type": "spacer", "height": 80 },

      {
        "id": "b19", "type": "text", "seoTag": "h2", "align": "center", "animation": "slideUp",
        "text": "활동 갤러리",
        "fontSize": 34, "fontWeight": 900, "textColor": "#0a0a0a",
        "lineHeight": 1.2, "paddingTop": 0, "paddingBottom": 12, "maxWidth": 720
      },
      {
        "id": "b20", "type": "text", "seoTag": "p", "align": "center",
        "text": "스터디, 해커톤, 네트워킹까지. 데브 허슬러의 다양한 활동 현장입니다.",
        "fontSize": 16, "fontWeight": 400, "textColor": "#6b7280",
        "lineHeight": 1.7, "paddingTop": 0, "paddingBottom": 40, "maxWidth": 560
      },
      {
        "id": "b21", "type": "gallery",
        "images": [
          { "id": "g1", "src": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop", "alt": "팀 미팅" },
          { "id": "g2", "src": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop", "alt": "코딩 세션" },
          { "id": "g3", "src": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop", "alt": "해커톤" },
          { "id": "g4", "src": "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=600&fit=crop", "alt": "네트워킹 행사" },
          { "id": "g5", "src": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop", "alt": "프레젠테이션" },
          { "id": "g6", "src": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop", "alt": "개발 작업" },
          { "id": "g7", "src": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop", "alt": "코드 리뷰" },
          { "id": "g8", "src": "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop", "alt": "팀 워크샵" },
          { "id": "g9", "src": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&h=600&fit=crop", "alt": "수료식" }
        ],
        "cols": 3, "gap": 8, "radius": 8, "bgColor": "#ffffff", "paddingY": 0
      },

      { "id": "b22", "type": "spacer", "height": 80 },
      { "id": "b23", "type": "divider", "style": "solid", "color": "#e5e7eb", "thickness": 1, "width": 100, "paddingY": 0 },
      { "id": "b24", "type": "spacer", "height": 72 },

      {
        "id": "b25", "type": "text", "seoTag": "h2", "align": "center",
        "text": "모집 프로세스",
        "fontSize": 34, "fontWeight": 900, "textColor": "#0a0a0a",
        "lineHeight": 1.2, "paddingTop": 0, "paddingBottom": 8, "maxWidth": 720
      },
      {
        "id": "b26", "type": "text", "seoTag": "p", "align": "center",
        "text": "서류부터 최종 합격까지 약 2주가 소요됩니다.",
        "fontSize": 15, "fontWeight": 400, "textColor": "#9ca3af",
        "lineHeight": 1.6, "paddingTop": 0, "paddingBottom": 40, "maxWidth": 400
      },
      {
        "id": "b27", "type": "timeline", "title": "", "layout": "horizontal",
        "activeColor": "#0a0a0a", "lineColor": "#d1d5db",
        "nodes": [
          { "id": "n1", "title": "서류 지원",   "desc": "지원서 + 포트폴리오 제출" },
          { "id": "n2", "title": "서류 심사",   "desc": "3일 내 개별 결과 안내" },
          { "id": "n3", "title": "과제 전형",   "desc": "48시간 온라인 코딩 과제" },
          { "id": "n4", "title": "최종 면접",   "desc": "팀장단 면접 (30분)" },
          { "id": "n5", "title": "합격 발표",   "desc": "최종 합격을 축하합니다!" }
        ]
      },

      { "id": "b28", "type": "spacer", "height": 72 },

      {
        "id": "b29", "type": "faq", "title": "자주 묻는 질문", "iconStyle": "plus",
        "openBg": "#f3f4f6", "borderRadius": 8,
        "items": [
          {
            "id": "f1", "question": "지원 자격이 어떻게 되나요?",
            "answer": "대학교 재학생이라면 전공 불문 누구나 지원 가능합니다. 개발 경험이 없어도 열정이 있다면 환영합니다."
          },
          {
            "id": "f2", "question": "활동 기간은 어떻게 되나요?",
            "answer": "한 기수는 6개월(한 학기)로 운영됩니다. 매주 정기 모임이 있으며, 프로젝트 팀별로 추가 미팅을 진행합니다."
          },
          {
            "id": "f3", "question": "스택을 미리 알아야 하나요?",
            "answer": "기초적인 프로그래밍 지식만 있어도 충분합니다. 스터디와 팀 프로젝트를 통해 함께 배워나갑니다."
          },
          {
            "id": "f4", "question": "활동비가 있나요?",
            "answer": "반기 활동비 30,000원이 있습니다. 스터디 자료, 서버 비용, 네트워킹 행사 비용으로 사용됩니다."
          },
          {
            "id": "f5", "question": "취업 연계가 가능한가요?",
            "answer": "졸업 후에도 데브 허슬러 네트워크를 유지합니다. 현업 멘토 연결, 레퍼런스 체크, 채용 정보 공유 등 커리어 지원을 제공합니다."
          },
          {
            "id": "f6", "question": "포트폴리오가 없어도 지원할 수 있나요?",
            "answer": "포트폴리오가 없어도 지원 가능합니다. 지원 동기와 배우고 싶은 것을 구체적으로 작성해주시면 충분합니다."
          }
        ]
      },

      { "id": "b30", "type": "spacer", "height": 56 },
      {
        "id": "b31", "type": "button", "text": "25기 지원하기 →",
        "actionType": "modal",
        "btnSize": "l", "btnBg": "#0a0a0a", "btnTextColor": "#ffffff",
        "radius": 0, "paddingY": 56
      }
    ]
  }'::jsonb;

  IF EXISTS (SELECT 1 FROM club_pages WHERE club_id = v_club_id) THEN
    UPDATE club_pages
    SET blocks = v_new_blocks, published_at = now(), updated_at = now()
    WHERE club_id = v_club_id;
  ELSE
    INSERT INTO club_pages (club_id, blocks, published_at, updated_at)
    VALUES (v_club_id, v_new_blocks, now(), now());
  END IF;

  RAISE NOTICE '데브 허슬러 엔터프라이즈 홈페이지 v2 업그레이드 완료 (club_id: %)', v_club_id;
END;
$$;
