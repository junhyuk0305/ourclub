export interface Applicant {
  id: string;
  recruitment_id: string;
  status: string;
  score: number | null;
  interviewer_note: string | null;
  interview_at: string | null;
  submitted_at: string;
  interview_questions: string[] | null;
  memos: { author: string; content: string; created_at: string }[] | null;
  tags: string[] | null;
  profiles: {
    name: string;
    email: string;
    phone: string | null;
    major: string | null;
    university: string | null;
    portfolio_url: string | null;
  } | null;
  answers: Record<string, string>;
}

export interface EmailModalState {
  applicant: Applicant;
  fromStage: string;
  toStage: string;
  subject: string;
  body: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  stage: string | null;
  subject: string;
  body: string;
}

export type SortKey = 'name' | 'submitted_at' | 'status' | 'score';
export type SortDir = 'asc' | 'desc';
