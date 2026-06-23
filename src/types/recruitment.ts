export type QuestionType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'select'
  | 'multiselect'
  | 'file'
  | 'source'
  | 'consent';

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  pattern?: string;
  consentText?: string;
  acceptTypes?: string;
}

/**
 * `recruitments` DB row의 단일 진실원천(canonical) 타입.
 * 각 화면/컴포넌트는 자기 쿼리가 select하는 컬럼만 `Pick<RecruitmentRow, ...>`로 골라 쓴다.
 * (nullable은 보수적으로 — 어느 한 곳이라도 nullable이면 nullable로 통일)
 */
export interface RecruitmentRow {
  id: string;
  title: string;
  generation: string | null;
  status: string | null;
  category: string | null;
  short_desc: string | null;
  description: string | null;
  deadline: string | null;
  recruit_start_date: string | null;
  targets: string | null;
  location: string | null;
  regular_meeting: string | null;
  hashtags: string[] | null;
  created_at: string;
  form_version: number;
  pipeline_stages: string[] | null;
  applicant_count: number;
  passed_count: number;
  form_schema: unknown[];
  deployed_form_schema: unknown[] | null;
}

export const DEFAULT_SOURCE_OPTIONS = ['SNS', '홈페이지', '에브리타임', '링커리어', '기타'];

export const EMAIL_PATTERN = '^[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\\.)+[A-Za-z]{2,}$';
export const PHONE_PATTERN = '^010\\d{7,8}$';

export const QUESTION_TYPE_META: Record<QuestionType, { label: string; icon: string; description: string }> = {
  text:        { label: '단답형',     icon: 'Type',        description: '한 줄 짧은 답변' },
  textarea:    { label: '장문형',     icon: 'AlignLeft',   description: '여러 줄 긴 답변' },
  number:      { label: '숫자',       icon: 'Hash',        description: '정수형 숫자 (지원자 수, 기수 등)' },
  email:       { label: '이메일',     icon: 'Mail',        description: '이메일 형식 자동 검증' },
  phone:       { label: '전화번호',   icon: 'Phone',       description: '010으로 시작하는 휴대폰 번호' },
  select:      { label: '단일 선택',  icon: 'CircleDot',   description: '여러 옵션 중 하나만 선택' },
  multiselect: { label: '다중 선택',  icon: 'CheckSquare', description: '여러 옵션 중 여러 개 선택' },
  file:        { label: '파일 첨부',  icon: 'Paperclip',   description: '포트폴리오, 이력서 등 파일 업로드' },
  source:      { label: '지원경로',   icon: 'Compass',     description: 'SNS · 홈페이지 · 에브리타임 등' },
  consent:     { label: '동의 항목',  icon: 'ShieldCheck', description: '개인정보 수집 · 이용 동의' },
};

/**
 * 신규 공고 생성 시 자동으로 들어가는 기본 질문 세트.
 * 스펙: 자기소개(장문형), 지원경로, 개인정보 동의.
 * (이름·연락처·이메일은 ClubApply에서 별도 기본 정보로 수집)
 */
export function defaultFormSchema(): Question[] {
  return [
    {
      id: 'seed-intro',
      type: 'textarea',
      title: '간단한 자기소개와 지원 동기를 알려주세요.',
      description: '본인을 한 문단 정도로 소개하고, 왜 이 동아리에 지원하는지 적어주세요.',
      required: true,
    },
    {
      id: 'seed-source',
      type: 'source',
      title: '지원 경로',
      description: '어떻게 이 공고를 알게 되셨나요?',
      options: [...DEFAULT_SOURCE_OPTIONS],
      required: true,
    },
    {
      id: 'seed-consent',
      type: 'consent',
      title: '개인정보 수집·이용 동의',
      consentText: '본 지원서에 기재한 개인정보(이름·연락처·이메일·답변 등)를 모집 절차 진행 및 결과 통지 목적으로 수집·이용하는 데 동의합니다.',
      required: true,
    },
  ];
}

export function makeQuestion(type: QuestionType): Question {
  const base: Question = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    type,
    title: QUESTION_TYPE_META[type].label,
    required: false,
  };
  switch (type) {
    case 'email':
      return { ...base, title: '이메일', pattern: EMAIL_PATTERN, required: true };
    case 'phone':
      return { ...base, title: '연락처', pattern: PHONE_PATTERN, required: true };
    case 'select':
      return { ...base, title: '단일 선택 질문', options: ['옵션 1', '옵션 2'] };
    case 'multiselect':
      return { ...base, title: '다중 선택 질문', options: ['옵션 1', '옵션 2'] };
    case 'source':
      return { ...base, title: '지원 경로', options: [...DEFAULT_SOURCE_OPTIONS], required: true };
    case 'consent':
      return {
        ...base,
        title: '개인정보 수집·이용 동의',
        consentText: '본 지원서에 기재한 개인정보를 모집 절차 및 결과 통지 목적으로 수집·이용하는 데 동의합니다.',
        required: true,
      };
    case 'file':
      return { ...base, title: '파일 첨부', acceptTypes: '.pdf,.docx,.zip,.png,.jpg' };
    case 'number':
      return { ...base, title: '숫자 질문', min: 0 };
    default:
      return base;
  }
}

// ── 채용 메인 페이지 (Phase 5) ───────────────────────────────────────────

export type SloganPosition =
  | 'in-left' | 'in-center' | 'in-right'
  | 'out-left' | 'out-center' | 'out-right';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface RecruitPageSettings {
  brand_color: string;
  tagline: string;
  hero: {
    enabled: boolean;
    slogan: string;
    thumbnail_url: string;
    slogan_position: SloganPosition;
  };
  recruitments: {
    enabled: boolean;
    title: string;
  };
  story: {
    enabled: boolean;
    title: string;
    description: string;
  };
  reviews: {
    enabled: boolean;
    title: string;
  };
  faq: {
    enabled: boolean;
    title: string;
    items: FAQItem[];
  };
}

export const DEFAULT_RECRUIT_PAGE: RecruitPageSettings = {
  brand_color: '#F97316',
  tagline: '',
  hero: {
    enabled: true,
    slogan: '함께 성장할\n인재를 찾습니다.',
    thumbnail_url: '',
    slogan_position: 'in-left',
  },
  recruitments: {
    enabled: true,
    title: '진행 중인 공고',
  },
  story: {
    enabled: true,
    title: '동아리 스토리',
    description: '우리가 어떤 일을, 어떤 마음으로 하는지 들려드릴게요.',
  },
  reviews: {
    enabled: true,
    title: '후기 및 평점',
  },
  faq: {
    enabled: true,
    title: '자주 묻는 질문',
    items: [
      { question: '활동 기간은 어떻게 되나요?', answer: '한 학기(약 4개월) 단위로 활동합니다.' },
      { question: '오프라인 모임은 얼마나 자주 있나요?', answer: '주 1회 정기 모임이 있고, 프로젝트 기간에는 추가 모임이 있을 수 있습니다.' },
    ],
  },
};

export function mergeRecruitPage(input: unknown): RecruitPageSettings {
  if (!input || typeof input !== 'object') return DEFAULT_RECRUIT_PAGE;
  const i = input as Partial<RecruitPageSettings>;
  return {
    brand_color: i.brand_color || DEFAULT_RECRUIT_PAGE.brand_color,
    tagline: typeof i.tagline === 'string' ? i.tagline : DEFAULT_RECRUIT_PAGE.tagline,
    hero: { ...DEFAULT_RECRUIT_PAGE.hero, ...(i.hero ?? {}) },
    recruitments: { ...DEFAULT_RECRUIT_PAGE.recruitments, ...(i.recruitments ?? {}) },
    story: { ...DEFAULT_RECRUIT_PAGE.story, ...(i.story ?? {}) },
    reviews: { ...DEFAULT_RECRUIT_PAGE.reviews, ...(i.reviews ?? {}) },
    faq: {
      ...DEFAULT_RECRUIT_PAGE.faq,
      ...(i.faq ?? {}),
      items: Array.isArray(i.faq?.items) ? i.faq!.items : DEFAULT_RECRUIT_PAGE.faq.items,
    },
  };
}

export function validateAnswer(q: Question, value: string): string | null {
  if (q.required && !value.trim()) return `'${q.title}' 항목은 필수입니다.`;
  if (!value.trim()) return null;
  if (q.type === 'email' && !new RegExp(EMAIL_PATTERN).test(value)) {
    return `'${q.title}'에 올바른 이메일 형식을 입력해주세요.`;
  }
  if (q.type === 'phone') {
    const digits = value.replace(/\D/g, '');
    if (!new RegExp(PHONE_PATTERN).test(digits)) {
      return `'${q.title}'에 올바른 휴대폰 번호 (010으로 시작)를 입력해주세요.`;
    }
  }
  if (q.type === 'number') {
    const n = Number(value);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return `'${q.title}'은 정수 숫자만 입력 가능합니다.`;
    if (q.min !== undefined && n < q.min) return `'${q.title}'은 ${q.min} 이상이어야 합니다.`;
    if (q.max !== undefined && n > q.max) return `'${q.title}'은 ${q.max} 이하이어야 합니다.`;
  }
  if (q.type === 'consent' && q.required && value !== '동의함') {
    return `'${q.title}'에 동의해야 지원할 수 있습니다.`;
  }
  return null;
}
