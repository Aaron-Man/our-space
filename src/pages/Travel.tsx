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
      <div className="flex items-center justify-between mb-8">
        <h1 className="section-title mb-0">✈️ 旅行计划</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? '取消' : '+ 新建计划'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="旅行标题 *" className="input-field"
            />
            <input
              type="text" value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              placeholder="目的地 *" className="input-field"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-text-muted text-sm mb-1 block">出发日期</label>
              <input
                type="date" value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-text-muted text-sm mb-1 block">返回日期</label>
              <input
                type="date" value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="旅行备注（可选）..."
            className="input-field mb-4 min-h-[80px] resize-none"
          />

          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-surface-warm rounded-xl text-text-muted text-sm hover:bg-primary-50 hover:text-primary transition-colors"
            >
              📷 添加封面图
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>

          {imagePreview && (
            <div className="relative mb-4">
              <img src={imagePreview} alt="预览" className="w-40 h-28 object-cover rounded-xl" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(''); }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-danger text-white rounded-full text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          )}

          <button type="submit" disabled={submitting || !form.title.trim() || !form.destination.trim()} className="btn-primary">
            {submitting ? '创建中...' : '创建计划'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">加载中...</p>
        </div>
      ) : travels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">✈️</p>
          <p className="text-text-muted">还没有旅行计划，规划下一段旅程吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {travels.map((travel) => {
            const statusInfo = TRAVEL_STATUS_MAP[travel.status];
            const nextStatus = getNextStatus(travel.status);
            return (
              <div key={travel.id} className="card animate-fade-in">
                {travel.cover_image && (
                  <img
                    src={travel.cover_image}
                    alt={travel.title}
                    className="w-full h-40 object-cover rounded-xl mb-4"
                  />
                )}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-display font-semibold text-text-main">{travel.title}</h3>
                  <span className={`badge-${statusInfo.color}`}>{statusInfo.label}</span>
                </div>
                <p className="text-text-muted text-sm mb-1">📍 {travel.destination}</p>
                {(travel.start_date || travel.end_date) && (
                  <p className="text-text-light text-xs mb-2">
                    {travel.start_date || '?'} ~ {travel.end_date || '?'}
                  </p>
                )}
                {travel.notes && (
                  <p className="text-text-muted text-sm mb-3">{travel.notes}</p>
                )}
                <div className="flex gap-2 mt-3">
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
                    className="text-text-light hover:text-danger text-sm transition-colors"
                  >
                    删除
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
