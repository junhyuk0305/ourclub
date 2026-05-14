-- 데브 허슬러 클럽 홈페이지 페이지 데이터 시드
-- clubs 테이블에서 '데브 허슬러' 클럽 ID를 조회해 club_pages에 upsert합니다.

DO $$
DECLARE
  v_club_id uuid;
BEGIN
  SELECT id INTO v_club_id
  FROM clubs
  WHERE name = '데브 허슬러'
  LIMIT 1;

  IF v_club_id IS NULL THEN
    RAISE NOTICE '데브 허슬러 클럽을 찾을 수 없습니다. 클럽을 먼저 생성하세요.';
    RETURN;
  END IF;

  INSERT INTO club_pages (club_id, blocks, published_at, updated_at)
  VALUES (
    v_club_id,
    '{
      "config": {
        "activeTheme": "black",
        "coverImg": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1920&q=80",
        "clubName": "데브 허슬러",
        "hashtag1": "개발",
        "hashtag2": "성장",
        "badgeText": "25기 모집중",
        "showFloatingBtn": true,
        "contentWidth": "860",
        "pageBgColor": "#ffffff",
        "pageTitle": "데브 허슬러 | 코드로 성장하는 개발자 동아리",
        "pageDesc": "실전 프로젝트와 코드 리뷰로 함께 성장하는 개발자 커뮤니티, 데브 허슬러"
      },
      "blocks": [
        {
          "id": "1", "type": "heroSlider", "height": 72, "autoPlay": true, "interval": 5000,
          "h1Size": 56, "subtitleSize": 18,
          "slides": [
            { "id": "s1", "bgType": "color", "bgValue": "#0a0a0a", "overlayOpacity": 0,
              "align": "center", "h1": "코드로 세상을\n바꾸는 사람들",
              "subtitle": "실전 프로젝트 · 코드 리뷰 · 현업 멘토링 · 네트워킹",
              "ctaText": "25기 지원하기", "ctaShow": true },
            { "id": "s2", "bgType": "color", "bgValue": "#111827", "overlayOpacity": 0,
              "align": "center", "h1": "함께 배우고\n같이 성장합니다",
              "subtitle": "2020년 창립 · 졸업생 200+ · 현업 취업 30+",
              "ctaText": "활동 더 보기", "ctaShow": true }
          ]
        },
        {
          "id": "2", "type": "text", "seoTag": "h2", "align": "center", "animation": "slideUp",
          "text": "실전으로 배우는\n개발 동아리",
          "fontSize": 44, "fontWeight": 900, "textColor": "#0a0a0a",
          "lineHeight": 1.2, "letterSpacing": -0.02,
          "paddingTop": 72, "paddingBottom": 16, "maxWidth": 680
        },
        {
          "id": "3", "type": "text", "seoTag": "p", "align": "center",
          "text": "단순한 공부 모임이 아닙니다.\n데브 허슬러는 실제 서비스를 기획하고, 개발하고, 배포합니다.",
          "fontSize": 17, "fontWeight": 400, "textColor": "#6b7280",
          "lineHeight": 1.8, "paddingTop": 0, "paddingBottom": 56, "maxWidth": 560
        },
        {
          "id": "4", "type": "layoutContainer", "cols": 3, "gap": 16, "paddingY": 0, "bgColor": "#000000",
          "cells": [
            { "id": "c1", "title": "실전 프로젝트",
              "text": "팀 단위로 실제 서비스를 기획하고 개발합니다.\n배포까지 경험하는 풀사이클 개발.",
              "align": "left", "bgColor": "#000000", "titleColor": "#ffffff", "textColor": "#9ca3af",
              "titleSize": 20, "textSize": 14, "padding": 36, "borderRadius": 0, "borderWidth": 0, "borderColor": "#1f2937", "imgSrc": "" },
            { "id": "c2", "title": "주간 코드 리뷰",
              "text": "매주 서로의 코드를 리뷰합니다.\n동료 피드백으로 빠르게 성장하세요.",
              "align": "left", "bgColor": "#111827", "titleColor": "#ffffff", "textColor": "#9ca3af",
              "titleSize": 20, "textSize": 14, "padding": 36, "borderRadius": 0, "borderWidth": 0, "borderColor": "#1f2937", "imgSrc": "" },
            { "id": "c3", "title": "현업 멘토링",
              "text": "시니어 개발자와 1:1 멘토링.\n취업과 커리어 전략을 함께 설계합니다.",
              "align": "left", "bgColor": "#1f2937", "titleColor": "#ffffff", "textColor": "#9ca3af",
              "titleSize": 20, "textSize": 14, "padding": 36, "borderRadius": 0, "borderWidth": 0, "borderColor": "#1f2937", "imgSrc": "" }
          ]
        },
        { "id": "5", "type": "divider", "style": "solid", "color": "#e5e7eb", "thickness": 1, "width": 100, "paddingY": 56 },
        {
          "id": "6", "type": "text", "seoTag": "h2", "align": "center", "animation": "slideIn",
          "text": "무엇을 배우나요?",
          "fontSize": 34, "fontWeight": 900, "textColor": "#0a0a0a",
          "lineHeight": 1.2, "paddingTop": 0, "paddingBottom": 32, "maxWidth": 720
        },
        {
          "id": "7", "type": "layoutContainer", "cols": 2, "gap": 20, "paddingY": 0, "bgColor": "transparent",
          "cells": [
            { "id": "d1", "title": "Frontend",
              "text": "React · TypeScript · Next.js · Tailwind CSS\n\n프로덕션급 프론트엔드 개발 경험을 쌓습니다.",
              "align": "left", "bgColor": "#f9fafb", "titleColor": "#0a0a0a", "textColor": "#374151",
              "titleSize": 17, "textSize": 14, "padding": 28, "borderRadius": 8, "borderWidth": 1, "borderColor": "#e5e7eb", "imgSrc": "" },
            { "id": "d2", "title": "Backend",
              "text": "Node.js · FastAPI · PostgreSQL · Docker\n\n서버부터 DB 설계까지 직접 구현합니다.",
              "align": "left", "bgColor": "#f9fafb", "titleColor": "#0a0a0a", "textColor": "#374151",
              "titleSize": 17, "textSize": 14, "padding": 28, "borderRadius": 8, "borderWidth": 1, "borderColor": "#e5e7eb", "imgSrc": "" },
            { "id": "d3", "title": "DevOps",
              "text": "AWS · Vercel · GitHub Actions · CI/CD\n\n자동화 배포 파이프라인을 직접 구축합니다.",
              "align": "left", "bgColor": "#f9fafb", "titleColor": "#0a0a0a", "textColor": "#374151",
              "titleSize": 17, "textSize": 14, "padding": 28, "borderRadius": 8, "borderWidth": 1, "borderColor": "#e5e7eb", "imgSrc": "" },
            { "id": "d4", "title": "Collaboration",
              "text": "GitHub · Notion · Figma · Jira\n\n팀 협업과 프로젝트 관리 실전 경험을 쌓습니다.",
              "align": "left", "bgColor": "#f9fafb", "titleColor": "#0a0a0a", "textColor": "#374151",
              "titleSize": 17, "textSize": 14, "padding": 28, "borderRadius": 8, "borderWidth": 1, "borderColor": "#e5e7eb", "imgSrc": "" }
          ]
        },
        { "id": "8", "type": "spacer", "height": 64 },
        {
          "id": "9", "type": "layoutContainer", "cols": 4, "gap": 0, "paddingY": 56, "bgColor": "#0a0a0a",
          "cells": [
            { "id": "st1", "title": "200+", "text": "누적 졸업생", "align": "center",
              "bgColor": "#0a0a0a", "titleColor": "#ffffff", "textColor": "#6b7280",
              "titleSize": 40, "textSize": 13, "padding": 24, "borderRadius": 0, "borderWidth": 0, "borderColor": "transparent", "imgSrc": "" },
            { "id": "st2", "title": "50+", "text": "완성된 프로젝트", "align": "center",
              "bgColor": "#0a0a0a", "titleColor": "#ffffff", "textColor": "#6b7280",
              "titleSize": 40, "textSize": 13, "padding": 24, "borderRadius": 0, "borderWidth": 0, "borderColor": "transparent", "imgSrc": "" },
            { "id": "st3", "title": "30+", "text": "현업 취업 성공", "align": "center",
              "bgColor": "#0a0a0a", "titleColor": "#ffffff", "textColor": "#6b7280",
              "titleSize": 40, "textSize": 13, "padding": 24, "borderRadius": 0, "borderWidth": 0, "borderColor": "transparent", "imgSrc": "" },
            { "id": "st4", "title": "5년", "text": "운영 역사", "align": "center",
              "bgColor": "#0a0a0a", "titleColor": "#ffffff", "textColor": "#6b7280",
              "titleSize": 40, "textSize": 13, "padding": 24, "borderRadius": 0, "borderWidth": 0, "borderColor": "transparent", "imgSrc": "" }
          ]
        },
        { "id": "10", "type": "divider", "style": "solid", "color": "#e5e7eb", "thickness": 1, "width": 100, "paddingY": 56 },
        {
          "id": "11", "type": "text", "seoTag": "h2", "align": "center",
          "text": "모집 프로세스",
          "fontSize": 34, "fontWeight": 900, "textColor": "#0a0a0a",
          "lineHeight": 1.2, "paddingTop": 0, "paddingBottom": 8, "maxWidth": 720
        },
        {
          "id": "12", "type": "timeline", "title": "", "layout": "horizontal",
          "activeColor": "#0a0a0a", "lineColor": "#d1d5db",
          "nodes": [
            { "id": "n1", "title": "서류 지원", "desc": "지원서 + 포트폴리오 제출" },
            { "id": "n2", "title": "서류 심사", "desc": "3일 내 개별 결과 안내" },
            { "id": "n3", "title": "과제 전형", "desc": "48시간 온라인 코딩 과제" },
            { "id": "n4", "title": "최종 면접", "desc": "팀장단 면접 (30분)" },
            { "id": "n5", "title": "합격 발표", "desc": "최종 합격을 축하합니다!" }
          ]
        },
        { "id": "13", "type": "spacer", "height": 64 },
        {
          "id": "14", "type": "faq", "title": "자주 묻는 질문", "iconStyle": "plus",
          "openBg": "#f3f4f6", "borderRadius": 8,
          "items": [
            { "id": "f1", "question": "지원 자격이 어떻게 되나요?",
              "answer": "대학교 재학생이라면 전공 불문 누구나 지원 가능합니다. 개발 경험이 없어도 열정이 있다면 환영합니다." },
            { "id": "f2", "question": "활동 기간은 어떻게 되나요?",
              "answer": "한 기수는 6개월(한 학기)로 운영됩니다. 매주 정기 모임이 있으며, 프로젝트 팀별로 추가 미팅을 진행합니다." },
            { "id": "f3", "question": "스택을 미리 알아야 하나요?",
              "answer": "기초적인 프로그래밍 지식만 있어도 충분합니다. 스터디와 팀 프로젝트를 통해 함께 배워나갑니다." },
            { "id": "f4", "question": "활동비가 있나요?",
              "answer": "반기 활동비 30,000원이 있습니다. 스터디 자료, 서버 비용, 네트워킹 행사 비용으로 사용됩니다." },
            { "id": "f5", "question": "취업 연계가 가능한가요?",
              "answer": "졸업 후에도 데브 허슬러 네트워크를 유지합니다. 현업 멘토 연결, 레퍼런스 체크, 채용 정보 공유 등 커리어 지원을 제공합니다." },
            { "id": "f6", "question": "포트폴리오가 없어도 지원할 수 있나요?",
              "answer": "포트폴리오가 없어도 지원 가능합니다. 지원 동기와 배우고 싶은 것을 구체적으로 작성해주시면 충분합니다." }
          ]
        },
        { "id": "15", "type": "spacer", "height": 48 },
        {
          "id": "16", "type": "button", "text": "25기 지원하기", "actionType": "modal",
          "btnSize": "l", "btnBg": "#0a0a0a", "btnTextColor": "#ffffff", "radius": 0, "paddingY": 48
        }
      ]
    }'::jsonb,
    now(),
    now()
  )
  ON CONFLICT (club_id)
  DO UPDATE SET
    blocks = EXCLUDED.blocks,
    published_at = EXCLUDED.published_at,
    updated_at = now();

  RAISE NOTICE '데브 허슬러 페이지 데이터 시드 완료 (club_id: %)', v_club_id;
END;
$$;
