import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Photo, PhotoCategory } from '../types';
import { CATEGORY_EMOJIS } from '../types';

function resolveImageUrl(imageUrlOrPath: string): string {
  if (imageUrlOrPath.startsWith('http')) {
    return imageUrlOrPath;
  }
  const { data } = supabase.storage.from('images').getPublicUrl(imageUrlOrPath);
  return data.publicUrl;
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<PhotoCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});

  // Category management state
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📷');

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        const photoList = data as Photo[];
        setPhotos(photoList);
        const urls: Record<number, string> = {};
        for (const photo of photoList) {
          urls[photo.id] = resolveImageUrl(photo.image_url);
        }
        setImageUrls(urls);
      }
      if (error) console.error('[Gallery] 获取照片失败:', error);
    } catch (err) {
      console.error('[Gallery] 获取照片异常:', err);
    } finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await supabase
        .from('photo_categories')
        .select('*')
        .order('sort_order');
      if (data) setCategories(data as PhotoCategory[]);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchPhotos();
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    // Check for duplicate
    if (categories.some((c) => c.name === newCatName.trim())) {
      alert('该分类已存在');
      return;
    }
    const { data, error } = await supabase
      .from('photo_categories')
      .insert({ name: newCatName.trim(), emoji: newCatEmoji, sort_order: categories.length })
      .select()
      .single();
    if (data && !error) {
      setCategories([...categories, data as PhotoCategory]);
      setNewCatName('');
      setNewCatEmoji('📷');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('确定删除该分类？已有照片的分类标签不会被删除。')) return;
    try {
      await supabase.from('photo_categories').delete().eq('id', id);
      setCategories(categories.filter((c) => c.id !== id));
    } catch { /* ignore */ }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('请先登录'); return; }

      const { data: existingProfile } = await supabase
        .from('profiles').select('id').eq('id', user.id).maybeSingle();
      if (!existingProfile) {
        await supabase.from('profiles').insert({ id: user.id });
      }

      const ext = file.name.split('.').pop();
      const path = `photos/${user.id}/${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage.from('images').upload(path, file);

      if (uploadError) { setError(`上传失败: ${uploadError.message}`); return; }

      if (uploadData) {
        const { error: insertError } = await supabase.from('photos').insert({
          user_id: user.id,
          image_url: path,
          caption: caption.trim() || null,
          category: category || null,
        });

        if (insertError) { setError(`保存记录失败: ${insertError.message}`); return; }

        setCaption('');
        setCategory('');
        setPreviewUrl('');
        setShowUpload(false);
        await fetchPhotos();
      }
    } catch (err) {
      setError(`上传异常: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally { setUploading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这张照片？')) return;
    try {
      await supabase.from('photos').delete().eq('id', id);
      fetchPhotos();
    } catch { /* ignore */ }
  };

  const filteredPhotos = selectedCategory
    ? photos.filter((p) => p.category === selectedCategory)
    : photos;

  // Count photos per category
  const categoryCounts: Record<string, number> = {};
  photos.forEach((p) => {
    if (p.category) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }
  });

  // Find emoji for a category name
  const getEmojiForCategory = (name: string) => {
    const cat = categories.find((c) => c.name === name);
    return cat?.emoji || '📷';
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title mb-0">
            <span className="text-gradient">📷 相册</span>
          </h1>
          <p className="text-text-light text-sm mt-1">珍藏我们的美好瞬间</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoryManager(!showCategoryManager)}
            className="btn-outline flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            管理分类
          </button>
          <button onClick={() => setShowUpload(!showUpload)} className="btn-primary flex items-center gap-2">
            {showUpload ? (
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
                上传照片
              </>
            )}
          </button>
        </div>
      </div>

      {/* Category Manager Panel */}
      {showCategoryManager && (
        <div className="card mb-6 animate-slide-up overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-lg">
              🏷️
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-text-main">分类管理</h3>
              <p className="text-text-light text-xs">添加或删除相册分类</p>
            </div>
            <button
              onClick={() => setShowCategoryManager(false)}
              className="text-text-light hover:text-text-main transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Add new category */}
          <div className="mb-4">
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="输入新分类名称..."
                className="input-field flex-1"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
              />
              <button
                onClick={handleAddCategory}
                className="btn-primary whitespace-nowrap"
                disabled={!newCatName.trim()}
              >
                添加
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-xs">选择图标：</span>
              <div className="flex flex-wrap gap-1">
                {CATEGORY_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewCatEmoji(emoji)}
                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                      newCatEmoji === emoji
                        ? 'bg-primary/20 ring-2 ring-primary scale-110'
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Existing categories */}
          {categories.length === 0 ? (
            <div className="text-center py-6 bg-white/30 rounded-xl">
              <p className="text-text-muted text-sm">还没有分类，先添加一个吧！</p>
              <p className="text-text-light text-xs mt-1">比如：日常、美食、旅行、自拍...</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="group flex items-center gap-1.5 px-3 py-2 bg-white/50 border border-white/50 rounded-xl hover:bg-primary/5 transition-all"
                >
                  <span>{cat.emoji}</span>
                  <span className="text-sm text-text-main">{cat.name}</span>
                  <span className="text-text-light text-xs">({categoryCounts[cat.name] || 0})</span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="ml-1 text-text-light hover:text-danger text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除分类"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prompt when no categories exist */}
      {!showCategoryManager && categories.length === 0 && !loading && (
        <div className="card mb-6 text-center border-2 border-dashed border-primary/30">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-teal-400/20 to-emerald-500/20 flex items-center justify-center">
            <span className="text-3xl">🏷️</span>
          </div>
          <p className="text-text-main font-medium mb-1">还没有相册分类</p>
          <p className="text-text-muted text-sm mb-4">先创建分类来整理你的照片</p>
          <button onClick={() => setShowCategoryManager(true)} className="btn-primary">
            🏷️ 去创建分类
          </button>
        </div>
      )}

      {/* Upload Panel */}
      {showUpload && (
        <div className="card mb-6 animate-slide-up overflow-hidden">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-lg">
              📸
            </div>
            <div>
              <h3 className="font-display font-bold text-text-main">上传新照片</h3>
              <p className="text-text-light text-xs">支持 JPG、PNG 格式</p>
            </div>
          </div>

          {previewUrl ? (
            <div className="relative mb-5 group">
              <img src={previewUrl} alt="预览" className="w-full max-h-72 object-cover rounded-2xl shadow-soft" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-2xl flex items-center justify-center">
                <button
                  onClick={() => { setPreviewUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl text-text-main text-sm font-medium hover:bg-white"
                >
                  更换照片
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 border-2 border-dashed border-primary/30 rounded-2xl flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all mb-5 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-text-muted text-sm font-medium">点击选择照片</p>
                <p className="text-text-light text-xs mt-1">或拖拽文件到此处</p>
              </div>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

          <div className="form-section">
            <label className="form-label">📝 照片描述</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="记录这个瞬间..."
              className="input-field"
            />
          </div>

          <div className="form-section">
            <label className="form-label">🏷️ 选择分类</label>
            {categories.length === 0 ? (
              <p className="text-text-light text-sm">
                还没有分类，
                <button
                  type="button"
                  onClick={() => setShowCategoryManager(true)}
                  className="text-primary font-medium hover:underline"
                >
                  去创建
                </button>
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(category === c.name ? '' : c.name)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 ${
                      category === c.name
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-sm'
                        : 'bg-white/50 text-text-muted hover:bg-primary/10 hover:text-primary-dark border border-white/50'
                    }`}
                  >
                    {c.emoji} {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <span>❌</span> {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading || !previewUrl}
            className="btn-primary w-full py-3"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                上传中...
              </span>
            ) : '✨ 上传照片'}
          </button>
        </div>
      )}

      {/* Category Filter */}
      {photos.length > 0 && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
              !selectedCategory
                ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-sm'
                : 'bg-white/50 text-text-muted hover:bg-primary/10 hover:text-primary-dark border border-white/50'
            }`}
          >
            🖼️ 全部
            <span className="ml-1 text-xs opacity-70">({photos.length})</span>
          </button>
          {categories.map((c) => {
            const count = categoryCounts[c.name] || 0;
            if (count === 0) return null;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.name)}
                className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                  selectedCategory === c.name
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-sm'
                    : 'bg-white/50 text-text-muted hover:bg-primary/10 hover:text-primary-dark border border-white/50'
                }`}
              >
                {c.emoji} {c.name}
                <span className="ml-1 text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Photo Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">加载中...</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <span className="text-4xl">📷</span>
          </div>
          <p className="text-text-muted font-medium">
            {selectedCategory ? '该分类还没有照片' : '还没有照片，上传第一张吧！'}
          </p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative group cursor-pointer break-inside-avoid animate-fade-in"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="relative overflow-hidden rounded-2xl shadow-soft group-hover:shadow-medium transition-all duration-300">
                {imageUrls[photo.id] ? (
                  <img
                    src={imageUrls[photo.id]}
                    alt={photo.caption || ''}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={() => console.error('[Gallery] 图片加载失败:', imageUrls[photo.id])}
                  />
                ) : (
                  <div className="w-full aspect-square bg-white/30 rounded-2xl flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                  </div>
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    {photo.caption && (
                      <p className="text-white text-sm font-medium mb-1 line-clamp-2">{photo.caption}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-white/70 text-xs">
                        {new Date(photo.created_at).toLocaleDateString('zh-CN')}
                      </p>
                      {photo.category && (
                        <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">
                          {getEmojiForCategory(photo.category)} {photo.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Preview Modal */}
      {selectedPhoto && imageUrls[selectedPhoto.id] && (
        <div className="modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="modal-backdrop" />
          <div className="relative max-w-4xl w-full animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-black/80 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={imageUrls[selectedPhoto.id]}
                alt={selectedPhoto.caption || ''}
                className="w-full max-h-[75vh] object-contain"
              />
              <div className="p-5 flex items-center justify-between">
                <div>
                  {selectedPhoto.caption && (
                    <p className="text-white font-medium">{selectedPhoto.caption}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-white/50 text-sm">
                      {new Date(selectedPhoto.created_at).toLocaleDateString('zh-CN', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                    {selectedPhoto.category && (
                      <span className="px-2 py-0.5 bg-white/10 rounded-full text-white/70 text-xs">
                        {getEmojiForCategory(selectedPhoto.category)} {selectedPhoto.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { handleDelete(selectedPhoto.id); setSelectedPhoto(null); }}
                    className="px-4 py-2 bg-red-500/80 text-white rounded-xl text-sm hover:bg-red-500 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    删除
                  </button>
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="px-4 py-2 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
