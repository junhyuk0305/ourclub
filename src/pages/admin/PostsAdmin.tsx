import React, { useEffect, useRef, useState } from 'react';
import { Edit3, Globe, Lock, Save, X, Loader, Check, Trash2, ImagePlus, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { MarkdownEditor } from '../../components/ui/MarkdownEditor';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';

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
  const [posts, setPosts] = useState<Post[]>([]);
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
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, content, author, images, is_published, view_count, created_at')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });

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

    const payload = {
      club_id: adminClubId,
      title: title.trim(),
      content: content.trim() || null,
      author: author.trim() || null,
      images,
      is_published: publish,
    };

    if (isNew) {
      const { data, error } = await supabase
        .from('posts')
        .insert({ ...payload, view_count: 0 })
        .select()
        .single();
      setSaving(false);
      if (error || !data) {
        showToast('저장 실패: ' + (error?.message ?? '알 수 없는 오류'));
        return;
      }
      setPosts(prev => [normalizePost(data), ...prev]);
    } else if (editingPost) {
      const { data, error } = await supabase
        .from('posts')
        .update(payload)
        .eq('id', editingPost.id)
        .select()
        .single();
      setSaving(false);
      if (error || !data) {
        showToast('저장 실패: ' + (error?.message ?? '알 수 없는 오류'));
        return;
      }
      setPosts(prev => prev.map(p => p.id === editingPost.id ? normalizePost(data) : p));
    }

    closeEditor();
    showToast(publish ? '포스트가 발행되었습니다.' : '임시저장되었습니다.');
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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
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
      <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
        <AdminHeader />
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-64 border-r border-black bg-white flex flex-col p-4 shrink-0">
            <AdminSidebar />
          </aside>
          <main className="flex-1 flex items-center justify-center">
            <Loader className="w-8 h-8 animate-spin text-orange-500" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminHeader>
        {!isEditing ? (
          <button
            onClick={openNew}
            className="ml-4 px-6 py-2 border border-black bg-orange-500 font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-px active:shadow-none active:translate-y-1 transition-all text-sm flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" /> 새 포스트 작성
          </button>
        ) : (
          <div className="flex gap-2 ml-4">
            <button
              onClick={closeEditor}
              disabled={saving}
              className="px-4 py-2 border border-black bg-white font-black hover:bg-gray-100 transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
            >
              <X className="w-4 h-4" /> 취소
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving || !title.trim() || uploading}
              className="px-4 py-2 border border-black bg-white font-black hover:bg-gray-100 text-sm disabled:opacity-50 flex items-center gap-1"
            >
              {saving && <Loader className="w-3 h-3 animate-spin" />} 임시저장
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving || !title.trim() || uploading}
              className="px-6 py-2 border border-black bg-black text-white font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-px active:shadow-none active:translate-y-1 transition-all text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" /> 저장 및 발행
            </button>
          </div>
        )}
      </AdminHeader>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        <main className="flex-1 bg-gray-100 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">
            {!isEditing ? (
              <>
                <div>
                  <h2 className="text-4xl font-black mb-2">포스트 관리</h2>
                  <p className="text-gray-500 font-bold">동아리의 전문성과 활동을 보여주는 콘텐츠를 발행하세요.</p>
                </div>

                {/* 로딩 */}
                {fetching && (
                  <div className="flex justify-center py-16">
                    <Loader className="w-8 h-8 animate-spin text-orange-500" />
                  </div>
                )}

                {/* 불러오기 실패 */}
                {!fetching && fetchError && (
                  <div className="flex flex-col items-center gap-4 py-16 text-center">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                    <p className="font-black text-gray-500">포스트를 불러오지 못했습니다.</p>
                    <button
                      onClick={() => adminClubId && loadPosts(adminClubId)}
                      className="px-6 py-2 border-2 border-black font-black text-sm hover:bg-orange-500 transition-colors"
                    >
                      다시 시도
                    </button>
                  </div>
                )}

                {/* 빈 상태 */}
                {!fetching && !fetchError && posts.length === 0 && (
                  <div className="border-2 border-dashed border-gray-300 p-16 flex flex-col items-center gap-4 text-center">
                    <Edit3 className="w-12 h-12 text-gray-300" />
                    <p className="font-black text-gray-400 text-lg">작성된 포스트가 없습니다.</p>
                    <button
                      onClick={openNew}
                      className="px-6 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors"
                    >
                      첫 포스트 작성하기
                    </button>
                  </div>
                )}

                {/* 목록 */}
                {!fetching && !fetchError && posts.length > 0 && (
                  <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-100 border-b-2 border-black">
                        <tr>
                          <th className="p-4 font-black">제목</th>
                          <th className="p-4 font-black">작성자</th>
                          <th className="p-4 font-black text-center">이미지</th>
                          <th className="p-4 font-black">상태</th>
                          <th className="p-4 font-black text-right">작성일 / 조회</th>
                          <th className="p-4 font-black text-center">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {posts.map(post => (
                          <tr key={post.id} className="hover:bg-orange-50 group">
                            <td
                              className="p-4 font-black text-base cursor-pointer group-hover:text-orange-600 transition-colors max-w-xs truncate"
                              onClick={() => openEdit(post)}
                            >
                              {post.title}
                            </td>
                            <td className="p-4 font-bold text-gray-600">{post.author || '—'}</td>
                            <td className="p-4 text-center">
                              {post.images.length > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500">
                                  <ImageIcon className="w-3.5 h-3.5" /> {post.images.length}
                                </span>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => handleTogglePublish(post)}
                                className={`px-3 py-1 font-bold text-xs flex items-center gap-1 w-max border transition-colors ${
                                  post.is_published
                                    ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                                }`}
                              >
                                {post.is_published ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                {post.is_published ? '발행됨' : '임시저장'}
                              </button>
                            </td>
                            <td className="p-4 text-right">
                              <p className="font-bold text-sm">
                                {post.created_at
                                  ? new Date(post.created_at).toLocaleDateString('ko-KR')
                                  : '—'}
                              </p>
                              {post.is_published && (
                                <p className="text-xs text-gray-500 font-bold mt-1">
                                  조회 {post.view_count ?? 0}
                                </p>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setDeleteId(post.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              /* ── 에디터 ── */
              <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col gap-6">
                <h2 className="text-2xl font-black flex items-center gap-2">
                  <Edit3 className="w-6 h-6 text-orange-500" />
                  {isNew ? '새 포스트 작성' : '포스트 수정'}
                </h2>

                {/* 작성자 */}
                <div className="flex flex-col gap-1">
                  <label className="font-black text-xs text-gray-500 uppercase tracking-wider">작성자 / 팀</label>
                  <input
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    placeholder="예: 기획팀, 운영진"
                    maxLength={50}
                    className="w-full p-3 border border-gray-200 font-bold outline-none focus:border-orange-500 text-sm"
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
                    className="w-full text-4xl font-black outline-none border-b-2 border-transparent focus:border-black pb-2 placeholder:text-gray-200"
                  />
                  {!title.trim() && (
                    <p className="text-xs text-red-400 font-bold">제목은 필수입니다.</p>
                  )}
                </div>

                {/* 마크다운 에디터 */}
                <div className="flex flex-col gap-1">
                  <label className="font-black text-xs text-gray-500 uppercase tracking-wider">본문 (Markdown)</label>
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
                    <label className="font-black text-xs text-gray-500 uppercase tracking-wider">
                      이미지 첨부 ({images.length}/{MAX_IMAGES})
                      <span className="ml-2 text-gray-400 normal-case font-medium">JPG·PNG·GIF·WEBP · 최대 {MAX_FILE_SIZE_MB}MB</span>
                    </label>
                    {images.length < MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-black text-xs font-black hover:bg-orange-50 transition-colors disabled:opacity-50"
                      >
                        {uploading
                          ? <Loader className="w-3.5 h-3.5 animate-spin" />
                          : <ImagePlus className="w-3.5 h-3.5" />
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
                          className="relative group w-32 h-32 border-2 border-black overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gray-100"
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
                            className="absolute top-1 right-1 bg-black/70 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] font-bold text-center py-0.5">
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
                          className="w-32 h-32 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:border-orange-400 hover:bg-orange-50 transition-colors disabled:opacity-50"
                        >
                          {uploading && i === 0
                            ? <Loader className="w-6 h-6 text-orange-400 animate-spin" />
                            : <ImagePlus className="w-6 h-6 text-gray-300" />
                          }
                          <span className="text-[10px] font-bold text-gray-400">추가</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center justify-center gap-2 w-full py-8 border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-colors disabled:opacity-50"
                    >
                      {uploading
                        ? <Loader className="w-6 h-6 text-orange-400 animate-spin" />
                        : <ImagePlus className="w-6 h-6 text-gray-400" />
                      }
                      <span className="text-sm font-bold text-gray-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 w-full max-w-sm mx-4 flex flex-col gap-6">
            <h3 className="text-xl font-black">포스트를 삭제하시겠습니까?</h3>
            <p className="text-gray-500 font-bold text-sm">삭제된 포스트는 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 border-2 border-black font-black hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-3 bg-red-600 text-white font-black hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-black text-white px-6 py-4 border border-white font-bold flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(249,115,22,0.5)]">
          <Check className="w-4 h-4 text-green-400" /> {toast}
        </div>
      )}
    </div>
  );
}
