-- 활동 증명서(certificates)
-- 운영진이 부원에게 공식 증명서를 발급하고, 부원은 마이페이지에서 PDF로 내려받는다.
-- 발급 시점의 정보(이름·동아리명·기수·직책·출석률)를 스냅샷으로 동결한다.
--   → 부원이 이후 탈퇴하거나 명단이 바뀌어도 발급된 증명서는 불변.

create table if not exists public.certificates (
  id                uuid primary key default gen_random_uuid(),
  club_id           uuid not null references public.clubs(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  member_id         uuid references public.club_members(id) on delete set null,
  cert_no           text not null unique,        -- 증명서 번호(검증용)
  title             text not null,               -- 증명서 제목 (예: 활동 수료증)
  body              text not null,               -- 운영진이 입력한 본문
  -- 발급 시점 스냅샷
  recipient_name    text not null,
  club_name         text not null,
  generation        text,
  position          text,
  attendance_rate   int,                         -- 발급 시점 출석률(참고, null 가능)
  issued_by         uuid references auth.users(id),
  issued_at         timestamptz not null default now()
);

create index if not exists certificates_recipient_idx on public.certificates(recipient_user_id);
create index if not exists certificates_club_idx on public.certificates(club_id);

alter table public.certificates enable row level security;

-- SELECT: 수령자 본인 / 발급 동아리 운영진 / global_admin
create policy "certificates_select" on public.certificates
  for select using (
    recipient_user_id = auth.uid()
    or exists (
      select 1 from public.club_members cm
      where cm.club_id = certificates.club_id
        and cm.user_id = auth.uid()
        and cm.role = '운영진'
    )
    or exists (select 1 from public.global_admins where id = auth.uid())
  );

-- INSERT: 발급 동아리 운영진 / global_admin
drop policy if exists "certificates_insert" on public.certificates;
create policy "certificates_insert" on public.certificates
  for insert with check (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = certificates.club_id
        and cm.user_id = auth.uid()
        and cm.role = '운영진'
    )
    or exists (select 1 from public.global_admins where id = auth.uid())
  );

-- DELETE: 발급 동아리 운영진 / global_admin (발급 취소)
drop policy if exists "certificates_delete" on public.certificates;
create policy "certificates_delete" on public.certificates
  for delete using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = certificates.club_id
        and cm.user_id = auth.uid()
        and cm.role = '운영진'
    )
    or exists (select 1 from public.global_admins where id = auth.uid())
  );

-- UPDATE 정책 없음 → 발급된 증명서는 수정 불가(불변)
