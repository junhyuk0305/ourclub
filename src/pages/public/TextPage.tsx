import React from 'react';

export default function TextPage({ title }: { title: string }) {
  return (
    <div className="p-8 md:p-16 max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-black mb-8 border-b border-black pb-4">{title}</h1>
      <div className="min-h-[40vh] bg-gray-50 border border-black p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {/* 여기에 텍스트 넣으세요 */}
        <p className="text-gray-500 font-medium">여기에 {title} 관련 상세 텍스트를 입력하세요.</p>
      </div>
    </div>
  );
}
