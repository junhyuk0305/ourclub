/* TEMP dev-only preview harness for ClubPageRenderer widgets. Remove before ship.
   Renders the actual enterprise seed page data (data-only) so you can review all
   4 club pages exactly as the published page will look. */
import { useState } from 'react';
import { ClubPageRenderer } from '../../components/ClubPageRenderer';
import { seedPages } from './__seedPages';

const SLUGS: { slug: string; label: string }[] = [
  { slug: 'dev-hustler', label: '데브허슬러' },
  { slug: 'codewave', label: '코드웨이브' },
  { slug: 'frame', label: '프레임' },
  { slug: 'vibe-design', label: '바이브디자인' },
];

export default function BuilderPreview() {
  const [slug, setSlug] = useState('vibe-design');
  const page = seedPages[slug];

  return (
    <div className="relative">
      {/* club switcher (preview only) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] flex gap-1 bg-white/90 backdrop-blur border-2 border-black p-1 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
        {SLUGS.map(s => (
          <button key={s.slug} onClick={() => { setSlug(s.slug); window.scrollTo(0, 0); }}
            className={`px-3 py-1.5 text-xs font-black transition-colors ${slug === s.slug ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            {s.label}
          </button>
        ))}
      </div>
      {/* back button mock (matches published ClubDetail) */}
      <div className="fixed top-4 left-4 z-[60]">
        <button className="flex items-center gap-1.5 px-3 py-2 bg-white/80 backdrop-blur border border-black/20 font-bold text-xs rounded-full">← 목록으로</button>
      </div>

      <ClubPageRenderer
        key={slug}
        blocks={page.blocks}
        config={page.config}
        activeRecruit={{ id: 'x', generation: page.config.badgeText || '모집', deadline: null }}
        onApply={() => {}}
      />
    </div>
  );
}
