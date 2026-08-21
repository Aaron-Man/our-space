import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [coupleName, setCoupleName] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        const p = data as Profile;
        setProfile(p);
        setDisplayName(p.display_name || '');
        setCoupleName(p.couple_name || '');
        setAnniversaryDate(p.anniversary_date || '');
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const ext = file.name.split('.').pop();
    const path = `avatars/${profile.id}/${Date.now()}.${ext}`;
    const { data: uploadData } = await supabase.storage.from('images').upload(path, file);

    if (uploadData) {
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', profile.id);
      setProfile({ ...profile, avatar_url: urlData.publicUrl });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('profiles').upsert({
        id: user.id,
        display_name: displayName.trim(),
        couple_name: coupleName.trim(),
        anniversary_date: anniversaryDate || null,
        updated_at: new Date().toISOString(),
      });

      setMessage('保存成功！');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="section-title">⚙️ 设置</h1>

      <div className="max-w-lg space-y-6">
        {/* Avatar */}
        <div className="card">
          <h3 className="text-lg font-display font-semibold text-text-main mb-4">头像</h3>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="头像" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">👤</span>
              )}
            </div>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-outline text-sm"
              >
                更换头像
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              <p className="text-text-light text-xs mt-1">支持 JPG、PNG 格式</p>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <form onSubmit={handleSave} className="card">
          <h3 className="text-lg font-display font-semibold text-text-main mb-4">个人信息</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">昵称</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field"
                placeholder="你的昵称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">情侣空间名称</label>
              <input
                type="text"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                className="input-field"
                placeholder="比如：我们的小窝"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">纪念日</label>
              <input
                type="date"
                value={anniversaryDate}
                onChange={(e) => setAnniversaryDate(e.target.value)}
                className="input-field"
              />
            </div>

            {message && (
              <div className={`p-3 rounded-xl text-sm ${
                message.includes('成功') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {message}
              </div>
            )}

            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? '保存中...' : '保存设置'}
            </button>
          </div>
        </form>

        {/* Anniversary Counter */}
        {anniversaryDate && (
          <div className="card text-center">
            <h3 className="text-lg font-display font-semibold text-text-main mb-2">在一起</h3>
            <div className="text-4xl font-display font-bold text-gradient mb-1">
              {Math.floor((Date.now() - new Date(anniversaryDate).getTime()) / (1000 * 60 * 60 * 24))}
            </div>
            <p className="text-text-muted text-sm">天</p>
          </div>
        )}

        {/* Logout */}
        <div className="card">
          <button onClick={handleLogout} className="btn-danger w-full">
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
