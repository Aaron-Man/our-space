import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme, THEMES } from '../lib/ThemeContext';
import type { Profile } from '../types';

export default function SettingsPage() {
  const { currentTheme, setThemeById, customBgUrl, setCustomBg, clearCustomBg } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [coupleName, setCoupleName] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(customBgUrl);

  const extractStoragePath = (imageUrlOrPath: string): string => {
    if (imageUrlOrPath.startsWith('http')) {
      const match = imageUrlOrPath.match(/\/storage\/v1\/object\/(?:public|signed)\/images\/(.+)/);
      return match ? match[1] : imageUrlOrPath;
    }
    return imageUrlOrPath;
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        const p = data as Profile;
        setProfile(p);
        setDisplayName(p.display_name || '');
        setCoupleName(p.couple_name || '');
        setAnniversaryDate(p.anniversary_date || '');
        if (p.avatar_url) {
          const path = extractStoragePath(p.avatar_url);
          const { data: urlData } = await supabase.storage.from('images').createSignedUrl(path, 3600);
          if (urlData?.signedUrl) setAvatarUrl(urlData.signedUrl);
        }
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setAvatarError('');
    const ext = file.name.split('.').pop();
    const path = `avatars/${profile.id}/${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from('images').upload(path, file);
    if (uploadError) { setAvatarError(`头像上传失败: ${uploadError.message}`); return; }
    if (uploadData) {
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: path }).eq('id', profile.id);
      if (updateError) { setAvatarError(`保存头像失败: ${updateError.message}`); return; }
      const { data: urlData } = await supabase.storage.from('images').createSignedUrl(path, 3600);
      if (urlData?.signedUrl) setAvatarUrl(urlData.signedUrl);
      setProfile({ ...profile, avatar_url: path });
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setBgPreview(dataUrl);
      setCustomBg(dataUrl);
    };
    reader.readAsDataURL(file);
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
    } finally { setSaving(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const daysTogether = anniversaryDate
    ? Math.floor((Date.now() - new Date(anniversaryDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

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
      <div className="mb-6">
        <h1 className="section-title mb-0">
          <span className="text-gradient">⚙️ 设置</span>
        </h1>
        <p className="text-text-light text-sm mt-1">管理你的空间和偏好</p>
      </div>

      {/* Responsive centered layout */}
      <div className="max-w-4xl mx-auto">
        {/* Top row: Avatar + Anniversary side by side on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {/* Avatar Card - spans 2 cols on desktop */}
          <div className="card relative overflow-hidden md:col-span-2">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5" />
            <div className="relative">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="relative group flex-shrink-0">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent p-0.5 shadow-lg">
                    <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="头像" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">👤</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-110"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </div>
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <h3 className="text-xl font-display font-bold text-text-main mb-1 truncate">
                    {displayName || '未设置昵称'}
                  </h3>
                  {coupleName && (
                    <p className="text-accent text-sm font-medium mb-1 truncate">💕 {coupleName}</p>
                  )}
                  <p className="text-text-light text-xs">
                    {avatarError || '点击相机图标更换头像'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Anniversary Counter */}
          {anniversaryDate ? (
            <div className="card relative overflow-hidden text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-pink-50 to-accent/5" />
              <div className="relative py-2">
                <div className="text-2xl mb-1">💑</div>
                <p className="text-sm font-display font-bold text-text-main mb-2">在一起</p>
                <div className="text-5xl font-display font-bold text-gradient">
                  {daysTogether}
                </div>
                <p className="text-text-muted text-xs mt-1">天</p>
              </div>
            </div>
          ) : (
            /* Quick stats placeholder when no anniversary */
            <div className="card relative overflow-hidden text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/5" />
              <div className="relative py-2">
                <div className="text-2xl mb-1">💕</div>
                <p className="text-sm font-display font-bold text-text-main mb-2">我们的空间</p>
                <p className="text-text-muted text-xs">在个人信息中设置纪念日</p>
              </div>
            </div>
          )}
        </div>

        {/* Second row: two columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Theme Selector */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-base">
                🎨
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-text-main">背景主题</h3>
                <p className="text-text-light text-xs">选择喜欢的风格</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setThemeById(theme.id)}
                  className={`relative p-3 rounded-xl border-2 transition-all duration-300 text-left hover:scale-[1.02] ${
                    currentTheme.id === theme.id && !customBgUrl
                      ? 'border-primary shadow-md bg-primary/5'
                      : 'border-transparent bg-white/40 hover:bg-white/60 hover:border-gray-200'
                  }`}
                >
                  {currentTheme.id === theme.id && !customBgUrl && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="text-xl mb-1">{theme.emoji}</div>
                  <div className="font-display font-semibold text-text-main text-xs">{theme.name}</div>
                  <div className="text-text-light text-[10px] mt-0.5 leading-tight">{theme.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Background Upload */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-base">
                🖼️
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-text-main">自定义背景</h3>
                <p className="text-text-light text-xs">上传你喜欢的背景图</p>
              </div>
            </div>

            {bgPreview ? (
              <div className="relative group mb-3">
                <img
                  src={bgPreview}
                  alt="自定义背景"
                  className="w-full h-36 object-cover rounded-xl shadow-soft"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-xl flex items-center justify-center gap-2">
                  <button
                    onClick={() => bgFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-lg text-text-main text-xs font-medium hover:bg-white transition-all"
                  >
                    更换
                  </button>
                  <button
                    onClick={() => { setBgPreview(null); clearCustomBg(); }}
                    className="px-3 py-1.5 bg-red-500/80 backdrop-blur-sm text-white rounded-lg text-xs font-medium hover:bg-red-500 transition-all"
                  >
                    移除
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => bgFileInputRef.current?.click()}
                className="w-full h-36 border-2 border-dashed border-primary/30 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all mb-3 group"
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-text-muted text-xs font-medium">点击上传背景图</p>
                  <p className="text-text-light text-[10px] mt-0.5">建议 1920×1080，≤5MB</p>
                </div>
              </div>
            )}
            <input ref={bgFileInputRef} type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
            <p className="text-text-light text-[10px] text-center">
              {customBgUrl ? '✅ 正在使用自定义背景' : '选择主题或上传自定义背景'}
            </p>
          </div>
        </div>

        {/* Profile Info - full width */}
        <form onSubmit={handleSave} className="card mb-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-base">
              ✏️
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-text-main">个人信息</h3>
              <p className="text-text-light text-xs">设置你们的空间信息</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-section mb-0">
              <label className="form-label"><span className="mr-1">🏷️</span> 昵称</label>
              <input
                type="text" value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field" placeholder="你的昵称"
              />
              <p className="form-hint">显示在主页的名字</p>
            </div>
            <div className="form-section mb-0">
              <label className="form-label"><span className="mr-1">💕</span> 空间名称</label>
              <input
                type="text" value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                className="input-field" placeholder="我们的小窝"
              />
              <p className="form-hint">专属名称</p>
            </div>
            <div className="form-section mb-0">
              <label className="form-label"><span className="mr-1">📅</span> 纪念日</label>
              <input
                type="date" value={anniversaryDate}
                onChange={(e) => setAnniversaryDate(e.target.value)}
                className="input-field"
              />
              <p className="form-hint">特别的日期</p>
            </div>
          </div>

          {message && (
            <div className={`mt-4 p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
              message.includes('成功') ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              <span>{message.includes('成功') ? '✅' : '❌'}</span> {message}
            </div>
          )}

          <div className="mt-5">
            <button type="submit" disabled={saving} className="btn-primary w-full md:w-auto md:min-w-[200px] py-3">
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  保存中...
                </span>
              ) : '💾 保存设置'}
            </button>
          </div>
        </form>

        {/* Account */}
        <div className="card">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white text-base">
                🔐
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-text-main">账户</h3>
                <p className="text-text-light text-xs">管理登录状态</p>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-danger w-full sm:w-auto">
              🚪 退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
