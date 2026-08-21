import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Travel } from '../types';
import { TRAVEL_STATUS_MAP } from '../types';

export default function TravelPage() {
  const [travels, setTravels] = useState<Travel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', destination: '', start_date: '', end_date: '',
    status: 'planning' as Travel['status'], notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const fetchTravels = async () => {
    try {
      const { data } = await supabase
        .from('travels')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setTravels(data as Travel[]);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTravels(); }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.destination.trim()) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let coverImage: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `travels/${user.id}/${Date.now()}.${ext}`;
        const { data: uploadData } = await supabase.storage.from('images').upload(path, imageFile);
        if (uploadData) {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
          coverImage = urlData.publicUrl;
        }
      }

      await supabase.from('travels').insert({
        user_id: user.id,
        title: form.title.trim(),
        destination: form.destination.trim(),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status,
        notes: form.notes.trim() || null,
        cover_image: coverImage,
      });

      setForm({ title: '', destination: '', start_date: '', end_date: '', status: 'planning', notes: '' });
      setImageFile(null);
      setImagePreview('');
      setShowForm(false);
      fetchTravels();
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这条旅行计划？')) return;
    try {
      await supabase.from('travels').delete().eq('id', id);
      fetchTravels();
    } catch { /* ignore */ }
  };

  const handleStatusChange = async (id: number, status: Travel['status']) => {
    try {
      await supabase.from('travels').update({ status }).eq('id', id);
      fetchTravels();
    } catch { /* ignore */ }
  };

  const getNextStatus = (current: Travel['status']): Travel['status'] | null => {
    const flow: Record<string, Travel['status']> = { planning: 'ongoing', ongoing: 'completed' };
    return flow[current] || null;
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title mb-0">
            <span className="text-gradient">✈️ 旅行计划</span>
          </h1>
          <p className="text-text-light text-sm mt-1">规划我们的下一段旅程</p>
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
              新建计划
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="card mb-8 animate-slide-up overflow-hidden">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg">
              ✈️
            </div>
            <div>
              <h3 className="font-display font-bold text-text-main">创建旅行计划</h3>
              <p className="text-text-light text-xs">开始规划美好旅程</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div className="form-section mb-0">
                <label className="form-label">🏷️ 旅行标题</label>
                <input
                  type="text" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="比如：暑假日本行" className="input-field"
                />
              </div>
              <div className="form-section mb-0">
                <label className="form-label">📍 目的地</label>
                <input
                  type="text" value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  placeholder="想去哪里？" className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div className="form-section mb-0">
                <label className="form-label">📅 出发日期</label>
                <input
                  type="date" value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="form-section mb-0">
                <label className="form-label">📅 返回日期</label>
                <input
                  type="date" value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">📝 备注</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="旅行备注（可选）..."
                className="input-field min-h-[80px] resize-none"
              />
            </div>

            <div className="form-section">
              <label className="form-label">📷 封面图片</label>
              {imagePreview ? (
                <div className="relative inline-block group">
                  <img src={imagePreview} alt="预览" className="w-40 h-28 object-cover rounded-2xl shadow-soft" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(''); }}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-danger text-white rounded-full text-sm flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 bg-white/50 border border-white/50 rounded-xl text-text-muted text-sm hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  选择封面图
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>

            <button type="submit" disabled={submitting || !form.title.trim() || !form.destination.trim()} className="btn-primary w-full py-3">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  创建中...
                </span>
              ) : '🚀 创建计划'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">加载中...</p>
        </div>
      ) : travels.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <span className="text-4xl">✈️</span>
          </div>
          <p className="text-text-muted font-medium">还没有旅行计划，规划下一段旅程吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {travels.map((travel) => {
            const statusInfo = TRAVEL_STATUS_MAP[travel.status];
            const nextStatus = getNextStatus(travel.status);
            return (
              <div key={travel.id} className="card animate-fade-in group overflow-hidden">
                {travel.cover_image && (
                  <img
                    src={travel.cover_image}
                    alt={travel.title}
                    className="w-full h-44 object-cover rounded-2xl mb-4 group-hover:scale-[1.02] transition-transform duration-300"
                  />
                )}
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-display font-semibold text-text-main">{travel.title}</h3>
                  <span className={`badge-${statusInfo.color}`}>{statusInfo.label}</span>
                </div>
                <p className="text-text-muted text-sm mb-1 flex items-center gap-1">
                  <span>📍</span> {travel.destination}
                </p>
                {(travel.start_date || travel.end_date) && (
                  <p className="text-text-light text-xs mb-2 flex items-center gap-1">
                    <span>📅</span> {travel.start_date || '?'} ~ {travel.end_date || '?'}
                  </p>
                )}
                {travel.notes && (
                  <p className="text-text-muted text-sm mb-3 leading-relaxed">{travel.notes}</p>
                )}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100/50">
                  {nextStatus && (
                    <button
                      onClick={() => handleStatusChange(travel.id, nextStatus)}
                      className="btn-primary text-sm"
                    >
                      {TRAVEL_STATUS_MAP[nextStatus].label}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(travel.id)}
                    className="text-text-light hover:text-danger text-sm transition-colors ml-auto opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
