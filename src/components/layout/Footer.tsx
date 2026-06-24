import React from 'react';
import { Link } from 'react-router-dom';
import { INFO_PAGES, INFO_CATEGORIES } from '../../data/infoPages';
import { usePublicStats } from '../../hooks/usePublicStats';

export const Footer = () => {
  const stats = usePublicStats();
  return (
  <footer className="bg-ink text-white mt-auto">
    <div className="max-w-6xl mx-auto px-8 pt-12 pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
      <div>
        <div className="font-black text-xl flex items-center gap-2 mb-4">
          <img src="/logo.svg" alt="" className="h-5 w-auto" />
          OURCLUB
        </div>
        <p className="text-sm font-medium text-white/70 leading-relaxed">
          동아리·학회의 운영과 성장을<br />돕는 플랫폼
        </p>
      </div>

      {INFO_CATEGORIES.map((category) => (
        <div key={category}>
          <h4 className="font-black text-xs tracking-widest text-white/60 mb-4 uppercase">{category}</h4>
          <div className="flex flex-col gap-2 text-sm font-medium text-white/55">
            {INFO_PAGES.filter((p) => p.category === category).map((p) => (
              <Link
                key={p.slug}
                to={`/${p.slug}`}
                className="hover:text-white transition-colors w-fit"
              >
                {p.footerLabel ?? p.title}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div className="border-t border-white/10 mx-8" />

    <div className="px-8 py-5 flex flex-col md:flex-row justify-between items-center text-xs font-bold tracking-widest text-white/45 gap-3">
      <span>© 2026 OURCLUB. ALL RIGHTS RESERVED.</span>
      <div className="flex gap-6">
        <span>운영 중인 단체 {stats?.clubs ?? 0}팀</span>
        <span>함께한 프로젝트 {stats?.completedProjects ?? 0}건</span>
      </div>
    </div>
    <div className="px-8 pb-5 text-center text-xs text-white/35 font-medium">
      본 웹사이트에 게시된 이메일 주소가 전자우편 수집 프로그램이나 그 밖의 기술적 장치를 이용하여 무단으로 수집되는 것을 거부하며, 이를 위반 시 정보통신망법에 의해 형사 처벌됨을 유념하시기 바랍니다.
    </div>
  </footer>
  );
};
