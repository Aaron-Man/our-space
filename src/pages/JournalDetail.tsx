import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Journal } from '../types';

export default function JournalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchJournal();
  }, [id]);

  const fetchJournal = async () => {
    try {
      const { data } = await supabase
        .from('journals')
        .select('*')
        .eq('id', id)
        .single();
      if (data) setJournal(data as Journal);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('确定删除这篇日志？')) return;
    try {
      await supabase.from('journals').delete().eq('id', id);
      navigate('/journal');
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">加载中...</p>
        </div>
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="page-container text-center py-12">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-text-muted">日志不存在</p>
        <Link to="/journal" className="btn-primary mt-4 inline-block">返回日志列表</Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Link to="/journal" className="text-primary hover:text-primary-dark text-sm mb-6 inline-block">
        ← 返回日志列表
      </Link>

      <article className="card animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          {journal.mood && <span className="text-2xl">{journal.mood}</span>}
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-text-main">
              {journal.title}
            </h1>
            <p className="text-text-light text-sm mt-1">
              {new Date(journal.created_at).toLocaleDateString('zh-CN', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {journal.cover_image && (
          <img
            src={journal.cover_image}
            alt=""
            className="w-full max-h-96 object-cover rounded-xl mb-6"
          />
        )}

        <div className="prose prose-sm max-w-none text-text-main leading-relaxed whitespace-pre-wrap">
          {journal.content}
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
          <button onClick={handleDelete} className="btn-danger text-sm">
            删除日志
          </button>
        </div>
      </article>
    </div>
  );
}
