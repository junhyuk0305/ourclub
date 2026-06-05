import { Inbox, ShieldCheck, ShieldX } from 'lucide-react';
import { Applicant } from './types';

// ── 지원서 탭 (개인정보 동의 현황 포함) ───────────────────────────────────
export function ApplicationTabContent({ applicant, consentEntries }: { applicant: Applicant; consentEntries: [string, string][] }) {
  const allEntries = Object.entries(applicant.answers ?? {});
  const nonConsentEntries = allEntries.filter(([k]) => !consentEntries.some(([ck]) => ck === k));

  return (
    <div className="p-8 flex flex-col gap-5">
      {allEntries.length === 0 ? (
        <div className="text-center py-12 text-gray-400 font-bold">
          <Inbox className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          제출된 응답이 없습니다.
        </div>
      ) : (
        <>
          {nonConsentEntries.map(([key, val]) => (
            <div key={key} className="border border-black p-6 bg-orange-50">
              <h4 className="font-black text-sm text-orange-600 mb-2">{key}</h4>
              <p className="font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">{renderAnswer(val)}</p>
            </div>
          ))}

          {/* 개인정보 동의 현황 - 지원서 아래 */}
          {consentEntries.length > 0 && (
            <div className="border-2 border-blue-300 bg-blue-50 p-6 mt-2">
              <h4 className="font-black text-sm mb-3 flex items-center gap-2 text-blue-800">
                <ShieldCheck className="w-4 h-4" /> 개인정보 동의 현황
              </h4>
              <div className="flex flex-col gap-2">
                {consentEntries.map(([key, val]) => {
                  const agreed = val === '동의함' || val === '동의' || val === 'true';
                  return (
                    <div key={key} className={`flex items-center gap-2 p-3 border ${agreed ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                      {agreed
                        ? <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                        : <ShieldX className="w-4 h-4 text-red-500 shrink-0" />}
                      <span className="font-bold text-sm flex-1">{key}</span>
                      <span className={`text-xs font-black px-2 py-0.5 ${agreed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {agreed ? '동의' : '미동의'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function renderAnswer(val: string) {
  // 파일 형식 (filename|url)인 경우 링크로
  if (val && val.includes('|') && /https?:\/\//.test(val)) {
    const [name, url] = val.split('|');
    return <a href={url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{name}</a>;
  }
  return val;
}
