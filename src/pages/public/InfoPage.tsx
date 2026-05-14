import React from 'react';
import { Link } from 'react-router-dom';

interface Section {
  heading: string;
  body: string;
}

interface InfoPageProps {
  title: string;
  category: string;       // 예: "정책 및 약관" | "동아리용 서비스" | "기업용 서비스"
  updatedAt?: string;     // 예: "2026.05.01"
  sections: Section[];
}

export default function InfoPage({ title, category, updatedAt, sections }: InfoPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* 페이지 헤더 */}
      <div className="border-b border-black bg-black text-white px-8 md:px-16 py-10">
        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">{category}</p>
        <h1 className="text-3xl md:text-4xl font-black">{title}</h1>
        {updatedAt && (
          <p className="mt-3 text-sm text-gray-500 font-medium">최종 업데이트: {updatedAt}</p>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-8 md:px-16 py-12 flex flex-col lg:flex-row gap-12">
        {/* 목차 사이드바 */}
        <aside className="lg:w-56 shrink-0">
          <div className="lg:sticky lg:top-8">
            <p className="text-xs font-black tracking-widest text-gray-400 uppercase mb-4">목차</p>
            <nav className="flex flex-col gap-1">
              {sections.map((s, i) => (
                <a
                  key={i}
                  href={`#section-${i + 1}`}
                  className="text-sm font-medium text-gray-500 hover:text-black transition-colors py-1 border-l-2 border-transparent hover:border-black pl-3"
                >
                  {i + 1}. {s.heading}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* 본문 */}
        <main className="flex-1 min-w-0">
          {sections.map((s, i) => (
            <section key={i} id={`section-${i + 1}`} className="mb-10 scroll-mt-8">
              <h2 className="text-lg font-black mb-3 flex items-center gap-3">
                <span className="w-6 h-6 bg-black text-white text-xs font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                {s.heading}
              </h2>
              <div className="bg-gray-50 border border-black p-6 text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-line shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                {s.body}
              </div>
            </section>
          ))}

          {/* 뒤로 가기 */}
          <div className="mt-12 pt-8 border-t border-black">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-black border border-black px-5 py-3 hover:bg-black hover:text-white transition-colors"
            >
              ← 홈으로 돌아가기
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
