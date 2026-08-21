import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Journal } from '../types';
import { MOOD_OPTIONS } from '../types';

export default function JournalPage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchJournals = async () => {
    try {
      const { data } = await supabase
        .from('journals')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setJournals(data as Journal[]);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJournals(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('journals').insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        mood: mood || null,
      });

      setTitle('');
      setContent('');
      setMood('');
      setShowForm(false);
      fetchJournals();
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这篇日志？')) return;
    try {
      await supabase.from('journals').delete().eq('id', id);
      fetchJournals();
    } catch { /* ignore */ }
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title mb-0">
            <span className="text-gradient">📖 日志</span>
          </h1>
          <p className="text-text-light text-sm mt-1">记录生活的点点滴滴</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-accent flex items-center gap-2">
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
              写日志
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="card mb-8 animate-slide-up overflow-hidden">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white text-lg">
              ✏️
            </div>
            <div>
              <h3 className="font-display font-bold text-text-main">写一篇新日志</h3>
              <p className="text-text-light text-xs">用文字记录此刻的感受</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <label className="form-label">📌 标题</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给这篇日志取个名字..."
                className="input-field"
                autoFocus
              />
            </div>

            <div className="form-section">
              <label className="form-label">📝 内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="记录今天发生的事..."
                className="input-field min-h-[200px] resize-y"
              />
            </div>

            <div className="form-section">
              <label className="form-label">😊 心情</label>
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setMood(mood === m.label ? '' : m.label)}
                    className={`px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
                      mood === m.label
                        ? 'bg-gradient-to-r from-accent to-accent-dark text-white shadow-sm'
                        : 'bg-white/50 text-text-muted hover:bg-accent/10 hover:text-accent-dark border border-white/50'
                    }`}
                  >
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitting || !title.trim() || !content.trim()} className="btn-accent w-full py-3">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  保存中...
                </span>
              ) : '💾 保存日志'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">加载中...</p>
        </div>
      ) : journals.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
            <span className="text-4xl">📝</span>
          </div>
          <p className="text-text-muted font-medium">还没有日志，写下第一篇吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {journals.map((j) => (
            <div key={j.id} className="card group animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <Link to={`/journal/${j.id}`} className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    {j.mood && (
                      <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-base">
                        {j.mood}
                      </span>
                    )}
                    <h3 className="text-lg font-display font-semibold text-text-main group-hover:text-primary transition-colors">
                      {j.title}
                    </h3>
                  </div>
                  <p className="text-text-muted text-sm line-clamp-3 mb-3 leading-relaxed">{j.content}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-text-light text-xs">
                      {new Date(j.created_at).toLocaleDateString('zh-CN', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </span>
                    <span className="text-primary text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      查看详情 →
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => handleDelete(j.id)}
                  className="text-text-light hover:text-danger text-sm transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
