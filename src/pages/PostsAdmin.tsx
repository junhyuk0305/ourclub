import React, { useEffect, useState } from 'react';
import { Edit3, Globe, Lock, Save, X, Loader, Check, Trash2 } from 'lucide-react';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabaseClient';

interface Post {
  id: string;
  title: string;
  content: string | null;
  author: string | null;
  is_published: boolean;
  view_count: number;
  created_at: string;
}

export default function PostsAdmin() {
  const { adminClubId } = useAdmin();
  const [posts, setPosts] = useState<Post[]>([]);
  const [fetching, setFetching] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!adminClubId) return;
    loadPosts(adminClubId);
  }, [adminClubId]);

  const loadPosts = async (clubId: string) => {
    setFetching(true);
    const { data } = await supabase
      .from('posts')
      .select('id, title, content, author, is_published, view_count, created_at')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });
    setPosts((data as Post[]) ?? []);
    setFetching(false);
  };

  const openNew = () => {
    setEditingPost(null);
    setIsNew(true);
    setTitle('');
    setContent('');
    setAuthor('');
  };

  const openEdit = (post: Post) => {
    setEditingPost(post);
    setIsNew(false);
    setTitle(post.title);
    setContent(post.content ?? '');
    setAuthor(post.author ?? '');
  };

  const closeEditor = () => {
    setEditingPost(null);
    setIsNew(false);
  };

  const handleSave = async (publish: boolean) => {
    if (!adminClubId || !title.trim()) return;
    setSaving(true);

    if (isNew) {
      const { data, error } = await supabase
        .from('posts')
        .insert({ club_id: adminClubId, title: title.trim(), content: content.trim() || null, author: author.trim() || null, is_published: publish, view_count: 0 })
        .select()
        .single();
      setSaving(false);
      if (error || !data) { showToast('저장 실패: ' + error?.message); return; }
      setPosts(prev => [data as Post, ...prev]);
    } else if (editingPost) {
      const { data, error } = await supabase
        .from('posts')
        .update({ title: title.trim(), content: content.trim() || null, author: author.trim() || null, is_published: publish })
        .eq('id', editingPost.id)
        .select()
        .single();
      setSaving(false);
      if (error || !data) { showToast('저장 실패: ' + error?.message); return; }
      setPosts(prev => prev.map(p => p.id === editingPost.id ? data as Post : p));
    }

    closeEditor();
    showToast(publish ? '포스트가 발행되었습니다.' : '임시저장되었습니다.');
  };

  const handleTogglePublish = async (post: Post) => {
    const next = !post.is_published;
    await supabase.from('posts').update({ is_published: next }).eq('id', post.id);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_published: next } : p));
    showToast(next ? '발행 처리되었습니다.' : '비공개 처리되었습니다.');
  };

  const handleDelete = async (id: string) => {
    await supabase.from('posts').delete().eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
    setDeleteId(null);
    showToast('포스트가 삭제되었습니다.');
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const isEditing = isNew || editingPost !== null;

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
            <button onClick={closeEditor} className="px-4 py-2 border border-black bg-white font-black hover:bg-gray-100 transition-colors text-sm flex items-center gap-1">
              <X className="w-4 h-4" /> 취소
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving || !title.trim()}
              className="px-4 py-2 border border-black bg-white font-black hover:bg-gray-100 text-sm disabled:opacity-50 flex items-center gap-1"
            >
              {saving && <Loader className="w-3 h-3 animate-spin" />} 임시저장
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving || !title.trim()}
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
                  <h2 className="text-4xl font-black mb-2">스토리 포스트 발행</h2>
                  <p className="text-gray-500 font-bold">동아리의 전문성과 활동을 보여주는 콘텐츠를 발행하세요.</p>
                </div>

                {fetching ? (
                  <div className="flex justify-center py-16"><Loader className="w-8 h-8 animate-spin text-orange-500" /></div>
                ) : posts.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 p-16 flex flex-col items-center gap-4 text-center">
                    <Edit3 className="w-12 h-12 text-gray-300" />
                    <p className="font-black text-gray-400 text-lg">작성된 포스트가 없습니다.</p>
                    <button onClick={openNew} className="px-6 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors">첫 포스트 작성하기</button>
                  </div>
                ) : (
                  <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-100 border-b-2 border-black">
                        <tr>
                          <th className="p-4 font-black">제목</th>
                          <th className="p-4 font-black">작성자</th>
                          <th className="p-4 font-black">상태</th>
                          <th className="p-4 font-black text-right">작성일 / 조회</th>
                          <th className="p-4 font-black text-center">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {posts.map(post => (
                          <tr key={post.id} className="hover:bg-orange-50 group">
                            <td className="p-4 font-black text-lg cursor-pointer group-hover:text-orange-600 transition-colors" onClick={() => openEdit(post)}>
                              {post.title}
                            </td>
                            <td className="p-4 font-bold text-gray-600">{post.author ?? '—'}</td>
                            <td className="p-4">
                              <button
                                onClick={() => handleTogglePublish(post)}
                                className={`px-3 py-1 font-bold text-xs flex items-center gap-1 w-max border transition-colors ${post.is_published ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'}`}
                              >
                                {post.is_published ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                {post.is_published ? '발행됨' : '임시저장'}
                              </button>
                            </td>
                            <td className="p-4 text-right">
                              <p className="font-bold text-sm">{new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
                              {post.is_published && <p className="text-xs text-gray-500 font-bold mt-1">조회 {post.view_count}</p>}
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
              <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col gap-6">
                <h2 className="text-2xl font-black flex items-center gap-2">
                  <Edit3 className="w-6 h-6 text-orange-500" />
                  {isNew ? '새 포스트 작성' : '포스트 수정'}
                </h2>
                <div className="flex flex-col gap-1">
                  <label className="font-black text-sm text-gray-500">작성자/팀</label>
                  <input
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    placeholder="예: 기획팀, 운영진"
                    className="w-full p-3 border border-gray-200 font-bold outline-none focus:border-orange-500 text-sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="제목을 입력하세요."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full text-4xl font-black outline-none border-b-2 border-transparent focus:border-black pb-2 placeholder:text-gray-200"
                />
                <textarea
                  placeholder="여기에 멋진 이야기를 작성하세요..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full h-96 font-medium outline-none resize-none text-lg leading-relaxed border border-gray-100 focus:border-orange-500 p-2 transition-colors"
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 삭제 확인 */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 w-full max-w-sm mx-4 flex flex-col gap-6">
            <h3 className="text-xl font-black">포스트를 삭제하시겠습니까?</h3>
            <p className="text-gray-500 font-bold text-sm">삭제된 포스트는 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 border-2 border-black font-black hover:bg-gray-100">취소</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3 bg-red-600 text-white font-black hover:bg-red-700">삭제</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-black text-white px-6 py-4 border border-white font-bold flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(249,115,22,0.5)]">
          <Check className="w-4 h-4 text-green-400" /> {toast}
        </div>
      )}
    </div>
  );
}
