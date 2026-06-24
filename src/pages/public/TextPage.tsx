import React from 'react';

export default function TextPage({ title }: { title: string }) {
  return (
    <div className="p-8 md:p-16 max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-black text-ink mb-8 border-b border-sand-200 pb-4">{title}</h1>
      <div className="min-h-[40vh] bg-white border border-sand-200 rounded-card p-8 shadow-soft">
        {/* 여기에 텍스트 넣으세요 */}
        <p className="text-sand-500 font-medium">여기에 {title} 관련 상세 텍스트를 입력하세요.</p>
      </div>
    </div>
  );
}
