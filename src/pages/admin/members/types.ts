export type MemberStatus = '활동중' | '수료' | '탈퇴' | '활동정지';

export interface Member {
  id: string;
  role: '운영진' | '부원';
  generation: string | null;
  position: string | null;
  role_function: string | null;
  status: MemberStatus;
  joined_at: string;
  display_name: string | null;
  display_university: string | null;
  profiles: { name: string; email: string; major: string | null; university: string | null; academic_status: string | null } | null;
  attendanceRate?: number | null;
}

export type CustomFieldType = 'text' | 'textarea' | 'number' | 'select' | 'date';

export const CUSTOM_FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: '단답',
  textarea: '장문',
  number: '숫자',
  select: '단일선택',
  date: '날짜',
};

export interface CustomField {
  id: string;
  name: string;
  display_order: number;
  field_type: CustomFieldType;
  options: string[];
  required: boolean;
}

export interface NewCustomField {
  name: string;
  field_type: CustomFieldType;
  options: string[];
  required: boolean;
}
