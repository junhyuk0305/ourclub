import type { PostgrestError } from '@supabase/supabase-js';

// PostgREST 기본 max_rows. 이 상한 때문에 .range()/.limit() 없는 select 는
// 1000행을 넘으면 "조용히" 잘려서 집계·명단이 틀어진다. 아래 헬퍼로 우회한다.
const PAGE = 1000;

type Result<T> = { data: T[] | null; error: PostgrestError | null };

/**
 * 범위 페이지네이션으로 1000행 상한을 우회해 전체 행을 가져온다.
 * makeQuery 는 매 호출마다 `.range(from, to)` 를 적용한 "새" 쿼리를 반환해야 한다
 * (Supabase 쿼리 빌더는 1회용이라 재사용 불가).
 *
 * 출력은 행이 1000개 미만이면 기존과 100% 동일하고, 초과하면 잘리지 않은 전체를 돌려준다.
 */
export async function fetchAll<T>(
  makeQuery: (from: number, to: number) => PromiseLike<Result<T>>,
): Promise<{ data: T[]; error: PostgrestError | null }> {
  const all: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await makeQuery(from, from + PAGE - 1);
    if (error) return { data: all, error };
    const batch = data ?? [];
    all.push(...batch);
    if (batch.length < PAGE) break; // 마지막 페이지
    from += PAGE;
  }
  return { data: all, error: null };
}

/**
 * 큰 id 배열을 `.in()` 에 그대로 넣으면 GET URL 이 서버/프록시 한도를 넘어 요청이 거부될 수 있다.
 * id 배열을 청크로 나눠 조회한 뒤 병합한다. 각 청크도 fetchAll 로 전체 페이지네이션한다.
 */
export async function fetchAllIn<T>(
  ids: string[],
  makeQuery: (chunk: string[], from: number, to: number) => PromiseLike<Result<T>>,
  chunkSize = 150,
): Promise<{ data: T[]; error: PostgrestError | null }> {
  const all: T[] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { data, error } = await fetchAll<T>((from, to) => makeQuery(chunk, from, to));
    if (error) return { data: all, error };
    all.push(...data);
  }
  return { data: all, error: null };
}
