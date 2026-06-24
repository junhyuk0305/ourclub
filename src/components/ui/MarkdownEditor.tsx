import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';

const SYNTAX_TIPS = [
  { syntax: '# 제목', desc: '큰 제목 (H1)' },
  { syntax: '## 제목', desc: '중간 제목 (H2)' },
  { syntax: '### 제목', desc: '작은 제목 (H3)' },
  { syntax: '**굵게**', desc: '굵은 텍스트' },
  { syntax: '*기울임*', desc: '기울임 텍스트' },
  { syntax: '- 항목', desc: '글머리 목록' },
  { syntax: '1. 항목', desc: '번호 목록' },
  { syntax: '> 인용문', desc: '인용구' },
  { syntax: '`코드`', desc: '인라인 코드' },
  { syntax: '---', desc: '구분선' },
];

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = '마크다운으로 모집 요강을 작성하세요...',
  minHeight = 280,
}: MarkdownEditorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="border border-sand-200 rounded-card overflow-hidden">
      {/* 헤더 바 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-sand-200 bg-sand-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-sand-500 uppercase tracking-wider">작성</span>
          <span className="text-sand-300 text-xs">|</span>
          <span className="text-xs font-black text-brand uppercase tracking-wider">미리보기</span>
        </div>

        {/* ? 툴팁 버튼 */}
        <div className="relative">
          <button
            type="button"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="p-1 text-sand-400 hover:text-brand transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {showTooltip && (
            <div className="absolute right-0 top-7 z-50 bg-white border border-sand-200 rounded-card shadow-soft-lg w-56 p-3">
              <p className="text-xs font-black text-sand-600 mb-2 uppercase tracking-wider">마크다운 문법</p>
              <div className="flex flex-col gap-1.5">
                {SYNTAX_TIPS.map(tip => (
                  <div key={tip.syntax} className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-sand-100 px-1.5 py-0.5 text-brand border border-sand-200 rounded-md shrink-0">
                      {tip.syntax}
                    </code>
                    <span className="text-xs text-sand-500 font-medium">{tip.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 스플릿 뷰: 좌측 입력 | 우측 실시간 미리보기 */}
      <div className="flex" style={{ minHeight }}>
        {/* 좌측: 마크다운 입력 */}
        <div className="flex-1 border-r border-sand-200 relative">
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            spellCheck={false}
            className="w-full h-full p-4 font-mono text-sm outline-none resize-none bg-white leading-relaxed text-sand-600"
            style={{ minHeight }}
          />
          {!value && (
            <div className="absolute bottom-3 right-3 pointer-events-none">
              <span className="text-[10px] text-sand-300 font-bold">마크다운 입력</span>
            </div>
          )}
        </div>

        {/* 우측: 실시간 렌더링 미리보기 */}
        <div className="flex-1 p-4 bg-sand-50 overflow-y-auto" style={{ minHeight }}>
          {value.trim() ? (
            <MarkdownViewer content={value} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-2xl">✍️</span>
              <p className="text-xs text-sand-300 font-bold leading-relaxed">
                왼쪽에 내용을 입력하면<br />여기에 실시간으로 표시됩니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
