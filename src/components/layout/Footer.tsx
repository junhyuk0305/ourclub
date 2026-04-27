import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => (
  <footer className="border-t border-black bg-white flex flex-col mt-auto">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b border-black divide-y md:divide-y-0 md:divide-x divide-black">
      <div className="p-8">
        <div className="font-black text-xl flex items-center gap-2 mb-4">
          <span className="w-3 h-3 bg-black inline-block"></span>
          OURCLUB
        </div>
        <p className="text-sm font-medium text-gray-600 mb-6">검증된 대학생 커리어 동아리 플랫폼</p>
      </div>
      
      <div className="p-8 group relative bg-gray-50 hover:bg-white transition-colors">
        <div className="absolute top-0 left-0 w-full h-1 bg-black translate-y-[-1px] hidden group-hover:block"></div>
        <h4 className="font-black mb-4">정책 및 약관</h4>
        <div className="flex flex-col gap-2 text-sm font-medium text-gray-600">
          <Link to="/privacy" className="hover:text-orange-500 border-b border-transparent hover:border-orange-500 w-fit pb-0.5">개인정보처리방침</Link>
          <Link to="/terms" className="hover:text-orange-500 border-b border-transparent hover:border-orange-500 w-fit pb-0.5">서비스 이용약관</Link>
        </div>
      </div>
      
      <div className="p-8 group relative bg-gray-50 hover:bg-white transition-colors">
        <div className="absolute top-0 left-0 w-full h-1 bg-black translate-y-[-1px] hidden group-hover:block"></div>
        <h4 className="font-black mb-4">동아리용 서비스</h4>
        <div className="flex flex-col gap-2 text-sm font-medium text-gray-600">
          <Link to="/auth-process" className="hover:text-orange-500 border-b border-transparent hover:border-orange-500 w-fit pb-0.5">인증 동아리 절차안내</Link>
        </div>
      </div>

      <div className="p-8 group relative bg-gray-50 hover:bg-white transition-colors">
        <div className="absolute top-0 left-0 w-full h-1 bg-black translate-y-[-1px] hidden group-hover:block"></div>
        <h4 className="font-black mb-4">기업용 서비스</h4>
        <div className="flex flex-col gap-2 text-sm font-medium text-gray-600">
          <Link to="/corporate-join" className="hover:text-orange-500 border-b border-transparent hover:border-orange-500 w-fit pb-0.5">기업 파트너 가입</Link>
          <Link to="/project-guide" className="hover:text-orange-500 border-b border-transparent hover:border-orange-500 w-fit pb-0.5">프로젝트 등록 방법</Link>
        </div>
      </div>
    </div>
    
    <div className="p-6 bg-black text-white flex flex-col md:flex-row justify-between items-center text-xs font-bold tracking-widest gap-4">
      <span>© 2026 OURCLUB. ALL RIGHTS RESERVED.</span>
      <div className="flex gap-6">
        <span>안전 보장 100%</span>
        <span>매칭 124팀</span>
      </div>
    </div>
  </footer>
);
