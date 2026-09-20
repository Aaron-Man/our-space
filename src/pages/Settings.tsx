import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme, THEMES } from '../lib/ThemeContext';
import type { Profile } from '../types';

export default function SettingsPage() {
  const { currentTheme, setThemeById, customBgUrls, addCustomBg, removeCustomBg, selectedBgIndex, setSelectedBgIndex, isRotating, setIsRotating } = useTheme();
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
  
  // User management states
  const [showUserManager, setShowUserManager] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserDisplayName, setNewUserDisplayName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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
        setIsAdmin(p.is_admin || false);  // 检查是否是管理员
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
    
    if (customBgUrls.length >= 9) {
      alert('最多只能上传9张背景图');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      addCustomBg(dataUrl);
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

  // User management functions
  const fetchUsers = async () => {
    setUserLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'list' }),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);
      
      setUsers(result.users || []);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      alert(`获取用户列表失败: ${err.message}\n\n提示：只有管理员可以查看用户列表`);
    } finally {
      setUserLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserDisplayName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) return;
    
    setUserLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'create',
          displayName: newUserDisplayName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword.trim(),
        }),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);
      
      setNewUserDisplayName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setShowAddUserForm(false);
      fetchUsers();
      alert('用户创建成功！');
    } catch (err: any) {
      alert(`创建用户失败: ${err.message}\n\n提示：只有管理员可以创建用户`);
    } finally {
      setUserLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定删除此用户？此操作不可恢复。')) return;
    
    setUserLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'delete',
          userId: userId,
        }),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);
      
      fetchUsers();
      alert('用户已删除');
    } catch (err: any) {
      alert(`删除用户失败: ${err.message}\n\n提示：只有管理员可以删除用户`);
    } finally {
      setUserLoading(false);
    }
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
        <h1 className="section-title mb-2">
          <span className="text-gradient">️ 设置</span>
        </h1>
        <p className="text-text-light text-sm">管理你的空间和偏好，打造专属的艺术角落</p>
      </div>
  
      {/* Responsive centered layout */}
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Top row: Avatar + Anniversary side by side on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Avatar Card - spans 2 cols on desktop */}
          <div className="card relative overflow-hidden md:col-span-2 group hover:shadow-lg transition-all duration-300 bg-white/40 backdrop-blur-md border border-white/60">
            {/* Subtle gradient accent */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-400/10 to-transparent rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-purple-400/10 to-transparent rounded-full blur-2xl" />
            
            <div className="relative p-4 flex items-center gap-4">
              {/* Avatar with subtle glow */}
              <div className="relative group/avatar flex-shrink-0">
                {/* Outer glow ring */}
                <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-blue-400/30 via-purple-400/20 to-pink-400/30 opacity-60 blur-md group-hover/avatar:opacity-90 transition-opacity duration-300" />
                
                {/* Main avatar container */}
                <div className="relative w-20 h-20 rounded-xl bg-white/80 backdrop-blur-sm p-0.5 shadow-lg group-hover/avatar:scale-105 transition-transform duration-300">
                  <div className="w-full h-full rounded-lg bg-white flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="头像" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl"></span>
                    )}
                  </div>
                </div>
                
                {/* Camera button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 transition-all border-2 border-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </div>
              
              {/* User info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-display font-bold text-text-main mb-1.5 truncate">
                  {displayName || '未设置昵称'}
                </h3>
                {coupleName && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50 mb-1.5">
                    <span className="text-sm"></span>
                    <span className="text-accent text-xs font-medium">{coupleName}</span>
                  </div>
                )}
                <p className="text-text-light text-xs">
                  {avatarError || '点击相机图标更换头像'}
                </p>
              </div>
            </div>
          </div>
  
          {/* Anniversary Counter - Compact & Elegant */}
          {anniversaryDate ? (
            <div className="card relative overflow-hidden text-center group hover:shadow-lg transition-all duration-300 bg-white/40 backdrop-blur-md border border-white/60">
              {/* Subtle accent */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-gradient-to-br from-pink-400/15 to-purple-400/10 rounded-full blur-2xl" />
              
              <div className="relative p-4">
                {/* Heart emoji */}
                <div className="text-2xl mb-2">💕</div>
                
                {/* Title */}
                <p className="text-xs font-display font-bold text-text-main mb-2">在一起</p>
                
                {/* Days counter */}
                <div className="relative inline-block mb-1.5">
                  <div className="text-4xl font-display font-bold bg-gradient-to-br from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    {daysTogether}
                  </div>
                </div>
                
                {/* Unit */}
                <p className="text-text-muted text-[10px]">天</p>
              </div>
            </div>
          ) : (
            /* Quick stats placeholder when no anniversary */
            <div className="card relative overflow-hidden text-center group hover:shadow-lg transition-all duration-300 bg-white/40 backdrop-blur-md border border-white/60">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl" />
              
              <div className="relative p-4">
                <div className="text-2xl mb-2">💖</div>
                <p className="text-xs font-display font-bold text-text-main mb-1">我们的空间</p>
                <p className="text-text-muted text-[10px]">在个人信息中设置纪念日</p>
              </div>
            </div>
          )}
        </div>

        {/* Second row: Theme + Custom Background */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Theme Selector */}
          <div className="card group hover:shadow-lg transition-all duration-300 bg-white/40 backdrop-blur-md border border-white/60">
            <div className="p-4 border-b border-gray-100/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-sm shadow-sm">
                  
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold text-text-main">背景主题</h3>
                  <p className="text-text-light text-[10px] mt-0.5">选择喜欢的风格，共{THEMES.length}种</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2.5">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setThemeById(theme.id)}
                    className={`relative p-2.5 rounded-lg border-2 transition-all duration-300 text-left hover:scale-[1.02] ${
                      currentTheme.id === theme.id
                        ? 'border-blue-400 shadow-md bg-blue-50/50'
                        : 'border-transparent bg-white/30 hover:bg-white/50 hover:border-gray-200/50'
                    }`}
                  >
                    {currentTheme.id === theme.id && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-blue-400 rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="text-xl mb-1.5">{theme.emoji}</div>
                    <div className="font-display font-semibold text-text-main text-[10px] leading-tight mb-0.5">{theme.name}</div>
                    <div className="text-text-light text-[9px] leading-tight line-clamp-1">{theme.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Background Upload */}
          <div className="card group hover:shadow-lg transition-all duration-300 bg-white/40 backdrop-blur-md border border-white/60">
            <div className="p-4 border-b border-gray-100/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-400 flex items-center justify-center text-white text-sm shadow-sm">
                  ️
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold text-text-main">自定义背景</h3>
                  <p className="text-text-light text-[10px] mt-0.5">上传多张背景图，可轮换播放</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              {/* Rotation toggle */}
              {customBgUrls.length > 1 && (
                <div className="mb-3 p-2.5 bg-blue-50/50 rounded-lg border border-blue-200/50">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRotating}
                      onChange={(e) => setIsRotating(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-text-main">🔄 轮换播放（每30秒）</span>
                  </label>
                </div>
              )}

              {/* Upload button */}
              <div
                onClick={() => bgFileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-blue-300/50 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all mb-3 group/upload"
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-gradient-to-br from-blue-400/20 to-purple-400/20 flex items-center justify-center group-hover/upload:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-text-muted text-xs font-medium">点击上传背景图</p>
                  <p className="text-text-light text-[9px] mt-0.5">最多9张，每张≤5MB</p>
                </div>
              </div>
              <input ref={bgFileInputRef} type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />

              {/* Background images grid */}
              {customBgUrls.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] text-text-muted font-medium">已上传 {customBgUrls.length} 张</p>
                  <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                    {customBgUrls.map((url, index) => (
                      <div key={index} className="relative group/bg aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-400 transition-all shadow-sm hover:shadow-md">
                        <img src={url} alt={`背景 ${index + 1}`} className="w-full h-full object-cover" />
                        
                        {/* Selection indicator */}
                        {!isRotating && selectedBgIndex === index && (
                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                        
                        {/* Action buttons */}
                        <div className="absolute inset-0 bg-black/0 group-hover/bg:bg-black/20 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover/bg:opacity-100">
                          {!isRotating && selectedBgIndex !== index && (
                            <button
                              onClick={() => setSelectedBgIndex(index)}
                              className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-[9px] font-medium hover:bg-white transition-all shadow-sm"
                            >
                              使用
                            </button>
                          )}
                          <button
                            onClick={() => removeCustomBg(index)}
                            className="px-2 py-1 bg-red-500/80 backdrop-blur-sm text-white rounded text-[9px] font-medium hover:bg-red-500 transition-all shadow-sm"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-text-light text-[9px] text-center">
                    {isRotating ? '🎬 正在轮换播放' : `✅ 当前使用第 ${selectedBgIndex !== null ? selectedBgIndex + 1 : 1} 张`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info - full width */}
        <form onSubmit={handleSave} className="card group hover:shadow-lg transition-all duration-300 bg-white/40 backdrop-blur-md border border-white/60">
          <div className="p-4 border-b border-gray-100/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm shadow-sm">
                ✏️
              </div>
              <div>
                <h3 className="text-sm font-display font-bold text-text-main">个人信息</h3>
                <p className="text-text-light text-[10px] mt-0.5">设置你们的空间信息</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="form-section mb-0">
                <label className="form-label"><span className="mr-1">🏷️</span> 昵称</label>
                <input
                  type="text" value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-field" placeholder="你的昵称"
                />
              </div>
              <div className="form-section mb-0">
                <label className="form-label"><span className="mr-1"></span> 空间名称</label>
                <input
                  type="text" value={coupleName}
                  onChange={(e) => setCoupleName(e.target.value)}
                  className="input-field" placeholder="我们的小窝"
                />
              </div>
              <div className="form-section mb-0">
                <label className="form-label"><span className="mr-1"></span> 纪念日</label>
                <input
                  type="date" value={anniversaryDate}
                  onChange={(e) => setAnniversaryDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            {message && (
              <div className={`mt-3 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                message.includes('成功') ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
              }`}>
                <span>{message.includes('成功') ? '✅' : ''}</span> {message}
              </div>
            )}

            <div className="mt-3">
              <button type="submit" disabled={saving} className="btn-primary w-full md:w-auto md:min-w-[200px] py-2.5">
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    保存中...
                  </span>
                ) : '💾 保存设置'}
              </button>
            </div>
          </div>
        </form>

        {/* User Management - Only visible to admins */}
        {isAdmin && (
          <div className="card group hover:shadow-lg transition-all duration-300 bg-white/40 backdrop-blur-md border border-white/60">
            <div className="p-4 border-b border-gray-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm shadow-sm">
                    👥
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-bold text-text-main">用户管理</h3>
                    <p className="text-text-light text-[10px] mt-0.5">管理系统中的用户</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUserManager(!showUserManager);
                    if (!showUserManager) fetchUsers();
                  }}
                  className="btn-outline text-xs px-3 py-1.5"
                >
                  {showUserManager ? '收起' : '管理用户'}
                </button>
              </div>
            </div>

            {showUserManager && (
            <div className="p-4">
              {/* Add User Button */}
              <div className="mb-4">
                <button
                  onClick={() => setShowAddUserForm(!showAddUserForm)}
                  className="btn-primary w-full py-2.5 text-sm"
                >
                  {showAddUserForm ? '取消添加' : '+ 添加新用户'}
                </button>
              </div>

              {/* Add User Form */}
              {showAddUserForm && (
                <form onSubmit={handleAddUser} className="mb-4 p-4 bg-white/50 rounded-xl border border-white/50">
                  <h4 className="text-sm font-medium text-text-main mb-3">新用户信息</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="form-label text-xs">用户名</label>
                      <input
                        type="text"
                        value={newUserDisplayName}
                        onChange={(e) => setNewUserDisplayName(e.target.value)}
                        placeholder="请输入用户名"
                        className="input-field text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label text-xs">邮箱</label>
                      <input
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="input-field text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label text-xs">密码</label>
                      <input
                        type="password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="至少6位"
                        className="input-field text-sm"
                        required
                        minLength={6}
                      />
                    </div>
                    <button type="submit" disabled={userLoading} className="btn-primary w-full py-2">
                      {userLoading ? '创建中...' : '✅ 创建用户'}
                    </button>
                  </div>
                </form>
              )}

              {/* Users List */}
              {userLoading ? (
                <div className="text-center py-6">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-text-muted text-xs">加载中...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-text-muted text-sm">暂无用户</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {users.map((user, idx) => {
                    // Format created date
                    const createdDate = user.created_at 
                      ? new Date(user.created_at).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : '未知';
                    
                    return (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-white/30 rounded-lg border border-white/50 hover:bg-white/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-text-main truncate">
                                  {user.display_name || user.email?.split('@')[0] || '未命名'}
                                </p>
                                {user.is_admin && (
                                  <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded font-medium">
                                    👑 管理员
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-text-light truncate mb-1">{user.email}</p>
                              <p className="text-[10px] text-text-muted flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {createdDate}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="ml-3 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs hover:bg-red-200 transition-colors flex-shrink-0"
                          disabled={userLoading}
                        >
                          🗑️ 删除
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Account */}
        <div className="card group hover:shadow-lg transition-all duration-300 bg-white/40 backdrop-blur-md border border-white/60">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2.5 flex-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white text-sm shadow-sm">
                
              </div>
              <div>
                <h3 className="text-sm font-display font-bold text-text-main">账户</h3>
                <p className="text-text-light text-[10px] mt-0.5">管理登录状态</p>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-danger w-full sm:w-auto px-6 py-2.5">
               退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
