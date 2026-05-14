import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => (
  <footer className="bg-black text-white mt-auto">
    <div className="max-w-7xl mx-auto px-8 pt-12 pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
      <div>
        <div className="font-black text-xl flex items-center gap-2 mb-4">
          <span className="w-3 h-3 bg-white inline-block" />
          OURCLUB
        </div>
        <p className="text-sm font-medium text-gray-400 leading-relaxed">
          검증된 대학생 커리어<br />동아리 플랫폼
        </p>
      </div>

      <div>
        <h4 className="font-black text-xs tracking-widest text-gray-400 mb-4 uppercase">정책 및 약관</h4>
        <div className="flex flex-col gap-2 text-sm font-medium text-gray-500">
          <Link to="/privacy" className="hover:text-white transition-colors w-fit">개인정보처리방침</Link>
          <Link to="/terms"   className="hover:text-white transition-colors w-fit">서비스 이용약관</Link>
        </div>
      </div>

      <div>
        <h4 className="font-black text-xs tracking-widest text-gray-400 mb-4 uppercase">동아리용 서비스</h4>
        <div className="flex flex-col gap-2 text-sm font-medium text-gray-500">
          <Link to="/auth-process" className="hover:text-white transition-colors w-fit">인증 동아리 절차 안내</Link>
        </div>
      </div>

      <div>
        <h4 className="font-black text-xs tracking-widest text-gray-400 mb-4 uppercase">기업용 서비스</h4>
        <div className="flex flex-col gap-2 text-sm font-medium text-gray-500">
          <Link to="/corporate-join" className="hover:text-white transition-colors w-fit">기업 파트너 가입</Link>
          <Link to="/project-guide"  className="hover:text-white transition-colors w-fit">프로젝트 등록 방법</Link>
        </div>
      </div>
    </div>

    <div className="border-t border-gray-800 mx-8" />

    <div className="px-8 py-5 flex flex-col md:flex-row justify-between items-center text-xs font-bold tracking-widest text-gray-600 gap-3">
      <span>© 2026 OURCLUB. ALL RIGHTS RESERVED.</span>
      <div className="flex gap-6">
        <span>안전 보장 100%</span>
        <span>매칭 124팀</span>
      </div>
    </div>
    <div className="px-8 pb-5 text-center text-xs text-gray-700 font-medium">
      본 웹사이트에 게시된 이메일 주소가 전자우편 수집 프로그램이나 그 밖의 기술적 장치를 이용하여 무단으로 수집되는 것을 거부하며, 이를 위반 시 정보통신망법에 의해 형사 처벌됨을 유념하시기 바랍니다.
    </div>
  </footer>
);
