import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Status } from '../types';
import { MOOD_OPTIONS } from '../types';

/** 确保返回可用的图片 URL：已经是 http 则直接用，否则转为公开 URL */
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
        // 解析图片 URL（数据库已存完整 URL 则直接用，否则转为公开 URL）
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
      if (!user) {
        setError('请先登录');
        return;
      }

      let imageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        console.log('[Status] 开始上传图片:', { path, fileSize: imageFile.size, type: imageFile.type });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(path, imageFile);
        console.log('[Status] 上传结果:', { uploadData, uploadError });

        if (uploadError) {
          setError(`图片上传失败: ${uploadError.message}`);
          return;
        }

        if (uploadData) {
          // 直接存储 path，不再存储 public URL
          imageUrl = path;
        }
      }

      const { error: insertError } = await supabase.from('statuses').insert({
        user_id: user.id,
        content: content.trim(),
        mood: mood || null,
        image_url: imageUrl,
      });

      if (insertError) {
        setError(`发布失败: ${insertError.message}`);
        return;
      }

      setContent('');
      setMood('');
      setImageFile(null);
      setImagePreview('');
      setShowForm(false);
      fetchStatuses();
    } catch (err) {
      console.error('[Status] 发布异常:', err);
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="section-title mb-0">💭 状态</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? '取消' : '+ 发布状态'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8 animate-slide-up">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="此刻的心情..."
            className="input-field mb-4 min-h-[100px] resize-none"
            autoFocus
          />

          {imagePreview && (
            <div className="relative mb-4">
              <img src={imagePreview} alt="预览" className="w-32 h-32 object-cover rounded-xl" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(''); }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-danger text-white rounded-full text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-surface-warm rounded-xl text-text-muted text-sm hover:bg-primary-50 hover:text-primary transition-colors"
            >
              📷 添加图片
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

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

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}
          <button type="submit" disabled={submitting || !content.trim()} className="btn-primary">
            {submitting ? '发布中...' : '发布'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">加载中...</p>
        </div>
      ) : statuses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">🌟</p>
          <p className="text-text-muted">还没有状态，发布第一条吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {statuses.map((s) => (
            <div key={s.id} className="card animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-lg flex-shrink-0">
                    {s.mood || '💭'}
                  </div>
                  <div className="flex-1">
                    {s.mood && (
                      <span className="text-xs text-accent mb-1 inline-block">{s.mood}</span>
                    )}
                    <p className="text-text-main">{s.content}</p>
                    {s.image_url && imageUrls[s.id] && (
                      <img
                        src={imageUrls[s.id]}
                        alt=""
                        className="mt-3 max-w-xs rounded-xl shadow-soft"
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
