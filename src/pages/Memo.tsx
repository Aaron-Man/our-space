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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title mb-0">
            <span className="text-gradient">📝 备忘录</span>
          </h1>
          <p className="text-text-light text-sm mt-1">记录生活中的重要小事</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          {showForm ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              取消
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建备忘
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="card mb-8 animate-slide-up overflow-hidden">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-white text-lg">
              📌
            </div>
            <div>
              <h3 className="font-display font-bold text-text-main">新建备忘</h3>
              <p className="text-text-light text-xs">记下重要的事</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <label className="form-label">✏️ 内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="写下要记住的事..."
                className="input-field min-h-[120px] resize-none"
                autoFocus
              />
            </div>

            <div className="form-section">
              <label className="form-label">🎨 卡片颜色</label>
              <div className="flex items-center gap-3">
                {MEMO_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-xl transition-all duration-300 shadow-sm ${
                      color === c ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitting || !content.trim()} className="btn-primary w-full py-3">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  保存中...
                </span>
              ) : '📌 保存备忘'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">加载中...</p>
        </div>
      ) : memos.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <span className="text-4xl">📝</span>
          </div>
          <p className="text-text-muted font-medium">还没有备忘，记下重要的事吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memos.map((memo) => (
            <div
              key={memo.id}
              className="relative rounded-2xl p-5 shadow-soft hover:shadow-medium transition-all duration-300 animate-fade-in group border border-white/40"
              style={{ backgroundColor: memo.color }}
            >
              {memo.is_pinned && (
                <span className="absolute top-3 right-3 text-sm animate-float">📌</span>
              )}
              <p className="text-text-main text-sm whitespace-pre-wrap mb-4 pr-8 leading-relaxed">
                {memo.content}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-text-light text-xs">
                  {new Date(memo.created_at).toLocaleDateString('zh-CN')}
                </p>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => togglePin(memo)}
                    className="text-text-light hover:text-primary text-xs transition-colors px-2 py-1 rounded-lg hover:bg-white/50"
                  >
                    {memo.is_pinned ? '取消置顶' : '📌 置顶'}
                  </button>
                  <button
                    onClick={() => handleDelete(memo.id)}
                    className="text-text-light hover:text-danger text-xs transition-colors px-2 py-1 rounded-lg hover:bg-white/50"
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
