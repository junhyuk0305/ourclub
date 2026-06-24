import React, { useEffect, useRef, useState } from 'react';
import { Edit3, Globe, Lock, Save, X, Loader, Check, Trash2, ImagePlus, Image as ImageIcon, AlertCircle, Eye } from 'lucide-react';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { MarkdownEditor } from '../../components/ui/MarkdownEditor';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { fetchAll } from '../../lib/fetchAll';
import { useIncremental } from '../../lib/useIncremental';
import { formatDate } from '../../lib/format';

interface Post {
  id: string;
  title: string;
  content: string | null;
  author: string | null;
  images: string[];
  is_published: boolean;
  view_count: number;
  created_at: string;
}

const MAX_IMAGES = 3;
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function PostsAdmin() {
  const { adminClubId } = useAdmin();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  // 점진 렌더: 게시물이 많아도 한꺼번에 마운트하지 않는다(적으면 전부 렌더 = 동작 동일).
  const { count: shownCount, sentinelRef } = useIncremental<HTMLTableRowElement>(posts.length, posts.length);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [toastLink, setToastLink] = useState<{ href: string; label: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adminClubId) {
      loadPosts(adminClubId);
    } else {
      // adminClubId가 아직 없으면 AdminContext 로딩 중 — fetching은 유지
    }
  }, [adminClubId]);

  const loadPosts = async (clubId: string) => {
    setFetching(true);
    setFetchError(false);
    const { data, error } = await fetchAll<any>((from, to) => supabase
      .from('posts')
      .select('id, title, content, author, images, is_published, view_count, created_at')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .range(from, to));

    if (error) {
      setFetchError(true);
      setFetching(false);
      return;
    }

    setPosts(
      (data ?? []).map(p => ({
        ...p,
        images: Array.isArray(p.images) ? (p.images as string[]).filter(Boolean) : [],
      })) as Post[]
    );
    setFetching(false);
  };

  const openNew = () => {
    setEditingPost(null);
    setIsNew(true);
    setTitle('');
    setContent('');
    setAuthor('');
    setImages([]);
  };

  const openEdit = (post: Post) => {
    setEditingPost(post);
    setIsNew(false);
    setTitle(post.title);
    setContent(post.content ?? '');
    setAuthor(post.author ?? '');
    setImages(Array.isArray(post.images) ? post.images.filter(Boolean) : []);
  };

  const closeEditor = () => {
    setEditingPost(null);
    setIsNew(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // input 초기화를 먼저 해서 같은 파일 재선택 허용
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file || !adminClubId) return;

    if (images.length >= MAX_IMAGES) {
      showToast(`이미지는 최대 ${MAX_IMAGES}개까지만 첨부할 수 있습니다.`);
      return;
    }

    // 파일 타입 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast('JPG, PNG, GIF, WEBP 형식만 업로드할 수 있습니다.');
      return;
    }

    // 파일 크기 검증 (5MB)
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showToast(`이미지 파일은 ${MAX_FILE_SIZE_MB}MB 이하만 업로드할 수 있습니다.`);
      return;
    }

    setUploading(true);

    // 확장자 안전하게 추출
    const ext = file.name.includes('.')
      ? file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      : 'jpg';
    const path = `${adminClubId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      showToast('이미지 업로드 실패: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path);
    if (!urlData?.publicUrl) {
      showToast('이미지 URL을 가져오지 못했습니다.');
      setUploading(false);
      return;
    }

    setImages(prev => [...prev, urlData.publicUrl]);
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (publish: boolean) => {
    if (!adminClubId || !title.trim()) return;
    setSaving(true);

    const basePayload = {
      club_id: adminClubId,
      title: title.trim(),
      content: content.trim() || null,
      author: author.trim() || null,
      images,
      is_published: publish,
    };

    let savedId: string | null = null;

    if (isNew) {
      const { data, error } = await supabase
        .from('posts')
        .insert({ ...basePayload, author_id: user?.id ?? null, view_count: 0 })
        .select()
        .single();
      setSaving(false);
      if (error || !data) {
        showToast('저장 실패: ' + (error?.message ?? '알 수 없는 오류'));
        return;
      }
      savedId = data.id;
      setPosts(prev => [normalizePost(data), ...prev]);
    } else if (editingPost) {
      const { data, error } = await supabase
        .from('posts')
        .update(basePayload)
        .eq('id', editingPost.id)
        .select()
        .single();
      setSaving(false);
      if (error || !data) {
        showToast('저장 실패: ' + (error?.message ?? '알 수 없는 오류'));
        return;
      }
      savedId = editingPost.id;
      setPosts(prev => prev.map(p => p.id === editingPost.id ? normalizePost(data) : p));
    }

    closeEditor();
    showToast(
      publish ? '포스트가 발행되었습니다.' : '임시저장되었습니다.',
      publish && savedId ? { href: `/stories/${savedId}`, label: '공개 페이지에서 보기 →' } : undefined
    );
  };

  const handleTogglePublish = async (post: Post) => {
    const next = !post.is_published;
    // 낙관적 업데이트
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_published: next } : p));

    const { error } = await supabase
      .from('posts')
      .update({ is_published: next })
      .eq('id', post.id);

    if (error) {
      // 실패 시 롤백
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_published: !next } : p));
      showToast('상태 변경 실패: ' + error.message);
      return;
    }
    showToast(next ? '발행 처리되었습니다.' : '비공개 처리되었습니다.');
  };

  const handleDelete = async (id: string) => {
    setDeleteId(null);
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      showToast('삭제 실패: ' + error.message);
      return;
    }
    setPosts(prev => prev.filter(p => p.id !== id));
    showToast('포스트가 삭제되었습니다.');
  };

  const showToast = (msg: string, link?: { href: string; label: string }) => {
    setToast(msg);
    setToastLink(link ?? null);
    setTimeout(() => { setToast(''); setToastLink(null); }, 4000);
  };

  // DB에서 온 raw 데이터 정규화
  const normalizePost = (raw: Record<string, unknown>): Post => ({
    id: raw.id as string,
    title: (raw.title as string) ?? '',
    content: (raw.content as string | null) ?? null,
    author: (raw.author as string | null) ?? null,
    images: Array.isArray(raw.images) ? (raw.images as string[]).filter(Boolean) : [],
    is_published: Boolean(raw.is_published),
    view_count: Number(raw.view_count ?? 0),
    created_at: (raw.created_at as string) ?? '',
  });

  const isEditing = isNew || editingPost !== null;

  // adminClubId 없을 때 (Context 로딩 중)
  if (!adminClubId && fetching) {
    return (
      <div className="flex flex-col h-screen bg-sand-50 overflow-hidden font-sans">
        <AdminHeader />
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-64 border-r border-sand-200 bg-white flex flex-col p-4 shrink-0">
            <AdminSidebar />
          </aside>
          <main className="flex-1 flex items-center justify-center">
            <LoadingScreen />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-sand-50 overflow-hidden font-sans">
      <AdminHeader>
        {!isEditing ? (
          <button
            onClick={openNew}
            className="ml-4 px-6 py-2 btn-grad text-white font-black rounded-ctl shadow-btn hover:-translate-y-0.5 transition-transform text-sm flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" strokeWidth={2.5} /> 새 포스트 작성
          </button>
        ) : (
          <div className="flex gap-2 ml-4">
            <button
              onClick={closeEditor}
              disabled={saving}
              className="px-4 py-2 border border-sand-300 bg-white text-sand-600 font-black rounded-ctl hover:bg-sand-50 transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
            >
              <X className="w-4 h-4" strokeWidth={2.5} /> 취소
            </button>
            {!isNew && editingPost?.is_published && (
              <a
                href={`/stories/${editingPost.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-sand-300 bg-white text-sand-600 font-black rounded-ctl hover:bg-brand-tint text-sm flex items-center gap-1 transition-colors"
              >
                <Eye className="w-4 h-4" strokeWidth={2.5} /> 미리보기
              </a>
            )}
            <button
              onClick={() => handleSave(false)}
              disabled={saving || !title.trim() || uploading}
              className="px-4 py-2 border border-sand-300 bg-white text-sand-600 font-black rounded-ctl hover:bg-sand-50 text-sm disabled:opacity-50 flex items-center gap-1"
            >
              {saving && <Loader className="w-3 h-3 animate-spin" strokeWidth={2.5} />} 임시저장
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving || !title.trim() || uploading}
              className="px-6 py-2 btn-grad text-white font-black rounded-ctl shadow-btn hover:-translate-y-0.5 transition-transform text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader className="w-4 h-4 animate-spin" strokeWidth={2.5} />}
              <Save className="w-4 h-4" strokeWidth={2.5} /> 저장 및 발행
            </button>
          </div>
        )}
      </AdminHeader>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-sand-200 bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        <main className="flex-1 bg-sand-50 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">
            {!isEditing ? (
              <>
                <div>
                  <h2 className="text-4xl font-black mb-2 text-ink">포스트 관리</h2>
                  <p className="text-sand-500 font-bold">동아리의 전문성과 활동을 보여주는 콘텐츠를 발행하세요.</p>
                </div>

                {/* 로딩 */}
                {fetching && (
                  <div className="flex justify-center py-16">
                    <Loader className="w-8 h-8 animate-spin text-brand" strokeWidth={2.5} />
                  </div>
                )}

                {/* 불러오기 실패 */}
                {!fetching && fetchError && (
                  <div className="flex flex-col items-center gap-4 py-16 text-center">
                    <AlertCircle className="w-10 h-10 text-bad-fg" strokeWidth={2.5} />
                    <p className="font-black text-sand-500">포스트를 불러오지 못했습니다.</p>
                    <button
                      onClick={() => adminClubId && loadPosts(adminClubId)}
                      className="px-6 py-2 border border-sand-300 rounded-ctl font-black text-sm text-sand-600 hover:bg-brand-tint transition-colors"
                    >
                      다시 시도
                    </button>
                  </div>
                )}

                {/* 빈 상태 */}
                {!fetching && !fetchError && posts.length === 0 && (
                  <div className="border border-dashed border-sand-300 rounded-card p-16 flex flex-col items-center gap-4 text-center">
                    <Edit3 className="w-12 h-12 text-sand-300" strokeWidth={2.5} />
                    <p className="font-black text-sand-400 text-lg">작성된 포스트가 없습니다.</p>
                    <button
                      onClick={openNew}
                      className="px-6 py-3 btn-grad text-white font-black rounded-ctl shadow-btn hover:-translate-y-0.5 transition-transform"
                    >
                      첫 포스트 작성하기
                    </button>
                  </div>
                )}

                {/* 목록 */}
                {!fetching && !fetchError && posts.length > 0 && (
                  <div className="bg-white border border-sand-200 rounded-card shadow-soft overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-sand-50 border-b border-sand-200">
                        <tr>
                          <th className="p-4 font-black text-sand-500">제목</th>
                          <th className="p-4 font-black text-sand-500">작성자</th>
                          <th className="p-4 font-black text-sand-500 text-center">이미지</th>
                          <th className="p-4 font-black text-sand-500">상태</th>
                          <th className="p-4 font-black text-sand-500 text-right">작성일 / 조회</th>
                          <th className="p-4 font-black text-sand-500 text-center">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sand-200">
                        {posts.slice(0, shownCount).map(post => (
                          <tr key={post.id} className="hover:bg-sand-50 group">
                            <td
                              className="p-4 font-black text-base text-ink cursor-pointer group-hover:text-brand transition-colors max-w-xs truncate"
                              onClick={() => openEdit(post)}
                            >
                              {post.title}
                            </td>
                            <td className="p-4 font-bold text-sand-600">{post.author || '—'}</td>
                            <td className="p-4 text-center">
                              {post.images.length > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-sand-500">
                                  <ImageIcon className="w-3.5 h-3.5" strokeWidth={2.5} /> {post.images.length}
                                </span>
                              ) : (
                                <span className="text-sand-300 text-xs">—</span>
                              )}
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => handleTogglePublish(post)}
                                className={`px-3 py-1 rounded-ctl font-bold text-xs flex items-center gap-1 w-max transition-colors ${
                                  post.is_published
                                    ? 'bg-ok-bg text-ok-fg hover:opacity-80'
                                    : 'bg-off-bg text-off-fg hover:opacity-80'
                                }`}
                              >
                                {post.is_published ? <Globe className="w-3 h-3" strokeWidth={2.5} /> : <Lock className="w-3 h-3" strokeWidth={2.5} />}
                                {post.is_published ? '발행됨' : '임시저장'}
                              </button>
                            </td>
                            <td className="p-4 text-right">
                              <p className="font-bold text-sm text-ink">
                                {post.created_at ? formatDate(post.created_at) : '—'}
                              </p>
                              {post.is_published && (
                                <p className="text-xs text-sand-500 font-bold mt-1">
                                  조회 {post.view_count ?? 0}
                                </p>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {post.is_published && (
                                  <a
                                    href={`/stories/${post.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    title="공개 페이지에서 보기"
                                    className="p-2 text-sand-400 hover:text-brand hover:bg-brand-tint transition-colors rounded-ctl"
                                  >
                                    <Eye className="w-4 h-4" strokeWidth={2.5} />
                                  </a>
                                )}
                                <button
                                  onClick={() => setDeleteId(post.id)}
                                  className="p-2 text-sand-400 hover:text-bad-fg hover:bg-bad-bg transition-colors rounded-ctl"
                                >
                                  <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {shownCount < posts.length && (
                          <tr ref={sentinelRef}>
                            <td colSpan={7} className="text-center py-4 text-sand-400 font-bold text-sm">
                              <Loader className="w-4 h-4 animate-spin inline-block mr-2" strokeWidth={2.5} />
                              {posts.length - shownCount}개 더 불러오는 중…
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              /* ── 에디터 ── */
              <div className="bg-white border border-sand-200 rounded-card shadow-soft p-8 flex flex-col gap-6">
                <h2 className="text-2xl font-black text-ink flex items-center gap-2">
                  <Edit3 className="w-6 h-6 text-brand" strokeWidth={2.5} />
                  {isNew ? '새 포스트 작성' : '포스트 수정'}
                </h2>

                {/* 작성자 */}
                <div className="flex flex-col gap-1">
                  <label className="font-black text-xs text-sand-500 uppercase tracking-wider">작성자 / 팀</label>
                  <input
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    placeholder="예: 기획팀, 운영진"
                    maxLength={50}
                    className="w-full p-3 border border-sand-300 rounded-ctl font-bold text-sm field"
                  />
                </div>

                {/* 제목 */}
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    placeholder="제목을 입력하세요."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    maxLength={200}
                    className="w-full text-4xl font-black text-ink outline-none border-b border-transparent focus:border-brand pb-2 placeholder:text-sand-300"
                  />
                  {!title.trim() && (
                    <p className="text-xs text-bad-fg font-bold">제목은 필수입니다.</p>
                  )}
                </div>

                {/* 마크다운 에디터 */}
                <div className="flex flex-col gap-1">
                  <label className="font-black text-xs text-sand-500 uppercase tracking-wider">본문 (Markdown)</label>
                  <MarkdownEditor
                    value={content}
                    onChange={setContent}
                    placeholder="여기에 멋진 이야기를 작성하세요..."
                    minHeight={320}
                  />
                </div>

                {/* 이미지 업로드 */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-xs text-sand-500 uppercase tracking-wider">
                      이미지 첨부 ({images.length}/{MAX_IMAGES})
                      <span className="ml-2 text-sand-400 normal-case font-medium">JPG·PNG·GIF·WEBP · 최대 {MAX_FILE_SIZE_MB}MB</span>
                    </label>
                    {images.length < MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-sand-300 rounded-ctl text-xs font-black text-sand-600 hover:bg-brand-tint transition-colors disabled:opacity-50"
                      >
                        {uploading
                          ? <Loader className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />
                          : <ImagePlus className="w-3.5 h-3.5" strokeWidth={2.5} />
                        }
                        이미지 추가
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_TYPES.join(',')}
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  {images.length > 0 ? (
                    <div className="flex gap-3 flex-wrap">
                      {images.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative group w-32 h-32 border border-sand-200 rounded-card overflow-hidden shadow-soft bg-sand-100"
                        >
                          <img
                            src={url}
                            alt={`첨부 이미지 ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={e => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-ink/70 text-white p-1 rounded-ctl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-bad-fg"
                          >
                            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-ink/50 text-white text-[10px] font-bold text-center py-0.5">
                            {idx + 1}
                          </div>
                        </div>
                      ))}

                      {/* 빈 슬롯 */}
                      {Array.from({ length: MAX_IMAGES - images.length }).map((_, i) => (
                        <button
                          key={`empty-${i}`}
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="w-32 h-32 border border-dashed border-sand-300 rounded-card flex flex-col items-center justify-center gap-1 hover:border-brand hover:bg-brand-tint transition-colors disabled:opacity-50"
                        >
                          {uploading && i === 0
                            ? <Loader className="w-6 h-6 text-brand-peach animate-spin" strokeWidth={2.5} />
                            : <ImagePlus className="w-6 h-6 text-sand-300" strokeWidth={2.5} />
                          }
                          <span className="text-[10px] font-bold text-sand-400">추가</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center justify-center gap-2 w-full py-8 border border-dashed border-sand-300 rounded-card hover:border-brand hover:bg-brand-tint transition-colors disabled:opacity-50"
                    >
                      {uploading
                        ? <Loader className="w-6 h-6 text-brand-peach animate-spin" strokeWidth={2.5} />
                        : <ImagePlus className="w-6 h-6 text-sand-400" strokeWidth={2.5} />
                      }
                      <span className="text-sm font-bold text-sand-400">
                        이미지를 클릭하여 추가 (최대 {MAX_IMAGES}개, {MAX_FILE_SIZE_MB}MB 이하)
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40">
          <div className="bg-white border border-sand-200 rounded-card shadow-soft-lg p-8 w-full max-w-sm mx-4 flex flex-col gap-6">
            <h3 className="text-xl font-black text-ink">포스트를 삭제하시겠습니까?</h3>
            <p className="text-sand-500 font-bold text-sm">삭제된 포스트는 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 border border-sand-300 rounded-ctl font-black text-sand-600 hover:bg-sand-50"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-3 bg-red-500 text-white font-black rounded-ctl hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-ink text-white px-6 py-4 rounded-card font-bold flex items-center gap-3 shadow-soft-lg">
          <Check className="w-4 h-4 text-ok-fg shrink-0" strokeWidth={2.5} />
          <span>{toast}</span>
          {toastLink && (
            <a
              href={toastLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-brand-peach hover:text-white transition-colors whitespace-nowrap"
            >
              {toastLink.label}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
