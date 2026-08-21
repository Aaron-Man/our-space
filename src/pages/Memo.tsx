import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Memo } from '../types';
import { MEMO_COLORS } from '../types';

export default function MemoPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [color, setColor] = useState(MEMO_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  const fetchMemos = async () => {
    try {
      const { data } = await supabase
        .from('memos')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (data) setMemos(data as Memo[]);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMemos(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('memos').insert({
        user_id: user.id,
        content: content.trim(),
        color,
        is_pinned: false,
      });

      setContent('');
      setColor(MEMO_COLORS[0]);
      setShowForm(false);
      fetchMemos();
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这条备忘？')) return;
    try {
      await supabase.from('memos').delete().eq('id', id);
      fetchMemos();
    } catch { /* ignore */ }
  };

  const togglePin = async (memo: Memo) => {
    try {
      await supabase.from('memos').update({ is_pinned: !memo.is_pinned }).eq('id', memo.id);
      fetchMemos();
    } catch { /* ignore */ }
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-8">
        <h1 className="section-title mb-0">📝 备忘录</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? '取消' : '+ 新建备忘'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8 animate-slide-up">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下要记住的事..."
            className="input-field mb-4 min-h-[100px] resize-none"
            autoFocus
          />
          <div className="flex items-center gap-2 mb-4">
            <span className="text-text-muted text-sm">颜色：</span>
            {MEMO_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all ${
                  color === c ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button type="submit" disabled={submitting || !content.trim()} className="btn-primary">
            {submitting ? '保存中...' : '保存'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">加载中...</p>
        </div>
      ) : memos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">📝</p>
          <p className="text-text-muted">还没有备忘，记下重要的事吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memos.map((memo) => (
            <div
              key={memo.id}
              className="relative rounded-2xl p-5 shadow-soft hover:shadow-medium transition-all animate-fade-in"
              style={{ backgroundColor: memo.color }}
            >
              {memo.is_pinned && (
                <span className="absolute top-3 right-3 text-xs">📌</span>
              )}
              <p className="text-text-main text-sm whitespace-pre-wrap mb-4 pr-6">
                {memo.content}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-text-light text-xs">
                  {new Date(memo.created_at).toLocaleDateString('zh-CN')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => togglePin(memo)}
                    className="text-text-light hover:text-primary text-xs transition-colors"
                  >
                    {memo.is_pinned ? '取消置顶' : '置顶'}
                  </button>
                  <button
                    onClick={() => handleDelete(memo.id)}
                    className="text-text-light hover:text-danger text-xs transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
