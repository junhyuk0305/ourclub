import React from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export default function ClubApply() {
  const { id } = useParams();

  return (
    <div className="bg-gray-50 min-h-screen py-12 border-b border-black">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-8">
          <Link to={`/clubs/${id}`} className="inline-flex items-center gap-2 font-bold text-gray-500 hover:text-black transition-colors mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> 동아리 소개로 돌아가기
          </Link>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">마제스티 14기 지원서</h1>
          <p className="text-gray-500 font-bold">지원서를 작성해주세요. 임시저장은 자동으로 이루어집니다.</p>
        </div>

        <div className="bg-white border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 mb-8">
          <h2 className="text-xl font-black border-b border-black pb-4 mb-6">기본 정보</h2>
          
          <div className="flex flex-col gap-6">
            <div>
              <label className="block font-bold mb-2">이름 (실명) <span className="text-orange-500">*</span></label>
              <input type="text" className="w-full border border-black p-4 font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all bg-gray-50" placeholder="홍길동" />
            </div>

            <div>
              <label className="block font-bold mb-2">연락처 <span className="text-orange-500">*</span></label>
              <input type="tel" className="w-full border border-black p-4 font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all bg-gray-50" placeholder="010-0000-0000" />
            </div>

            <div>
              <label className="block font-bold mb-2">포트폴리오 링크 (선택)</label>
              <input type="url" className="w-full border border-black p-4 font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all bg-gray-50" placeholder="Notion, GitHub, 개인 웹사이트 등" />
            </div>
          </div>

          <h2 className="text-xl font-black border-b border-black pb-4 mb-6 mt-12">서술형 문항</h2>
          
          <div className="flex flex-col gap-8">
            <div>
              <label className="block font-bold mb-2">1. 마제스티에 지원하게 된 동기를 작성해주세요. (500자 이내) <span className="text-orange-500">*</span></label>
              <textarea rows={5} className="w-full border border-black p-4 font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all bg-gray-50 resize-none" placeholder="내용을 입력해주세요."></textarea>
            </div>

            <div>
              <label className="block font-bold mb-2">2. 본인이 생각하는 장점과, 마제스티에서 어떤 역할을 할 수 있을지 서술해주세요. (500자 이내) <span className="text-orange-500">*</span></label>
              <textarea rows={5} className="w-full border border-black p-4 font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all bg-gray-50 resize-none" placeholder="내용을 입력해주세요."></textarea>
            </div>
          </div>
        </div>

        <div className="flex gap-4 border-t-2 border-black p-4 bg-white sticky bottom-0 z-50">
          <button className="flex-1 bg-white border border-black py-4 font-bold text-black hover:bg-gray-100 transition-colors">
            임시저장
          </button>
          <button className="flex-1 bg-orange-500 border border-black py-4 font-black text-black hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1">
            최종 제출하기
          </button>
        </div>
      </div>
    </div>
  );
}
