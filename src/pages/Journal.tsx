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
      <div className="flex items-center justify-between mb-8">
        <h1 className="section-title mb-0">📖 日志</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-accent">
          {showForm ? '取消' : '+ 写日志'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8 animate-slide-up">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="标题"
            className="input-field mb-4"
            autoFocus
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="记录今天发生的事..."
            className="input-field mb-4 min-h-[200px] resize-y"
          />
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-text-muted text-sm">心情：</span>
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.label}
                type="button"
                onClick={() => setMood(mood === m.label ? '' : m.label)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 ${
                  mood === m.label
                    ? 'bg-accent-100 text-accent-dark border border-accent/30'
                    : 'bg-surface-warm text-text-muted hover:bg-accent-50'
                }`}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
          <button type="submit" disabled={submitting || !title.trim() || !content.trim()} className="btn-accent">
            {submitting ? '保存中...' : '保存日志'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">加载中...</p>
        </div>
      ) : journals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">📝</p>
          <p className="text-text-muted">还没有日志，写下第一篇吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {journals.map((j) => (
            <div key={j.id} className="card group animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <Link to={`/journal/${j.id}`} className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {j.mood && <span className="text-lg">{j.mood}</span>}
                    <h3 className="text-lg font-display font-semibold text-text-main group-hover:text-primary transition-colors">
                      {j.title}
                    </h3>
                  </div>
                  <p className="text-text-muted text-sm line-clamp-3 mb-3">{j.content}</p>
                  <p className="text-text-light text-xs">
                    {new Date(j.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </Link>
                <button
                  onClick={() => handleDelete(j.id)}
                  className="text-text-light hover:text-danger text-sm transition-colors flex-shrink-0"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
