import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Status } from '../types';
import { MOOD_OPTIONS } from '../types';

function resolveImageUrl(imageUrlOrPath: string): string {
  if (imageUrlOrPath.startsWith('http')) {
    return imageUrlOrPath;
  }
  const { data } = supabase.storage.from('images').getPublicUrl(imageUrlOrPath);
  return data.publicUrl;
}

export default function StatusPage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});

  const fetchStatuses = async () => {
    try {
      const { data } = await supabase
        .from('statuses')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        const list = data as Status[];
        setStatuses(list);
        const urls: Record<number, string> = {};
        for (const s of list) {
          if (s.image_url) {
            urls[s.id] = resolveImageUrl(s.image_url);
          }
        }
        setImageUrls(urls);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStatuses(); }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('请先登录'); return; }

      let imageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(path, imageFile);

        if (uploadError) { setError(`图片上传失败: ${uploadError.message}`); return; }
        if (uploadData) { imageUrl = path; }
      }

      const { error: insertError } = await supabase.from('statuses').insert({
        user_id: user.id,
        content: content.trim(),
        mood: mood || null,
        image_url: imageUrl,
      });

      if (insertError) { setError(`发布失败: ${insertError.message}`); return; }

      setContent('');
      setMood('');
      setImageFile(null);
      setImagePreview('');
      setShowForm(false);
      fetchStatuses();
    } catch (err) {
      setError(`发布异常: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这条状态？')) return;
    try {
      await supabase.from('statuses').delete().eq('id', id);
      fetchStatuses();
    } catch { /* ignore */ }
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title mb-0">
            <span className="text-gradient">💭 状态</span>
          </h1>
          <p className="text-text-light text-sm mt-1">分享此刻的心情</p>
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
              发布状态
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="card mb-8 animate-slide-up overflow-hidden">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-lg">
              💭
            </div>
            <div>
              <h3 className="font-display font-bold text-text-main">发布新状态</h3>
              <p className="text-text-light text-xs">记录此刻的想法和心情</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <label className="form-label">✍️ 内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="此刻的心情..."
                className="input-field min-h-[120px] resize-none"
                autoFocus
              />
            </div>

            {imagePreview && (
              <div className="form-section">
                <label className="form-label">🖼️ 图片预览</label>
                <div className="relative inline-block group">
                  <img src={imagePreview} alt="预览" className="w-40 h-40 object-cover rounded-2xl shadow-soft" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(''); }}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-danger text-white rounded-full text-sm flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <div className="form-section">
              <label className="form-label">📷 添加图片</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-white/50 border border-white/50 rounded-xl text-text-muted text-sm hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                选择图片
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
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

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <span>❌</span> {error}
              </div>
            )}

            <button type="submit" disabled={submitting || !content.trim()} className="btn-primary w-full py-3">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  发布中...
                </span>
              ) : '🚀 发布状态'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">加载中...</p>
        </div>
      ) : statuses.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <span className="text-4xl">🌟</span>
          </div>
          <p className="text-text-muted font-medium">还没有状态，发布第一条吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {statuses.map((s) => (
            <div key={s.id} className="card animate-fade-in group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                    {s.mood || '💭'}
                  </div>
                  <div className="flex-1">
                    {s.mood && (
                      <span className="text-xs text-accent font-medium mb-1 inline-block">{s.mood}</span>
                    )}
                    <p className="text-text-main leading-relaxed">{s.content}</p>
                    {s.image_url && imageUrls[s.id] && (
                      <img
                        src={imageUrls[s.id]}
                        alt=""
                        className="mt-3 max-w-xs rounded-2xl shadow-soft"
                        onError={() => console.error('[Status] 图片加载失败:', imageUrls[s.id])}
                      />
                    )}
                    <p className="text-text-light text-sm mt-2">
                      {new Date(s.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
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
