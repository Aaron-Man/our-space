import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Photo } from '../types';

/** 确保返回可用的图片 URL：已经是 http 则直接用，否则转为公开 URL */
function resolveImageUrl(imageUrlOrPath: string): string {
  if (imageUrlOrPath.startsWith('http')) {
    return imageUrlOrPath;
  }
  const { data } = supabase.storage.from('images').getPublicUrl(imageUrlOrPath);
  return data.publicUrl;
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });
      console.log('[Gallery] 获取照片列表:', { data, error });
      if (data) {
        const photoList = data as Photo[];
        setPhotos(photoList);
        // 解析图片 URL（数据库已存完整 URL 则直接用，否则转为公开 URL）
        const urls: Record<number, string> = {};
        for (const photo of photoList) {
          const url = resolveImageUrl(photo.image_url);
          urls[photo.id] = url;
          console.log(`[Gallery] 照片 id=${photo.id}, image_url=${photo.image_url}, resolvedUrl=${url}`);
        }
        console.log('[Gallery] imageUrls map:', urls);
        setImageUrls(urls);
      }
      if (error) console.error('[Gallery] 获取照片失败:', error);
    } catch (err) {
      console.error('[Gallery] 获取照片异常:', err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPhotos(); }, []);

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
      if (!user) {
        setError('请先登录');
        return;
      }

      // 确保 profiles 中存在记录，避免外键约束失败
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      if (!existingProfile) {
        await supabase.from('profiles').insert({ id: user.id });
      }

      const ext = file.name.split('.').pop();
      const path = `photos/${user.id}/${Date.now()}.${ext}`;
      console.log('[Gallery] 开始上传:', { path, fileSize: file.size, type: file.type });

      const { data: uploadData, error: uploadError } = await supabase.storage.from('images').upload(path, file);
      console.log('[Gallery] 上传结果:', { uploadData, uploadError });

      if (uploadError) {
        setError(`上传失败: ${uploadError.message}`);
        return;
      }

      if (uploadData) {
        // 直接存储 path，不再存储 public URL
        const { error: insertError } = await supabase.from('photos').insert({
          user_id: user.id,
          image_url: path,
          caption: caption.trim() || null,
        });

        if (insertError) {
          setError(`保存记录失败: ${insertError.message}`);
          return;
        }

        setCaption('');
        setPreviewUrl('');
        setShowUpload(false);
        await fetchPhotos();
      }
    } catch (err) {
      console.error('[Gallery] 上传异常:', err);
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

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-8">
        <h1 className="section-title mb-0">📷 相册</h1>
        <button onClick={() => setShowUpload(!showUpload)} className="btn-primary">
          {showUpload ? '取消' : '+ 上传照片'}
        </button>
      </div>

      {showUpload && (
        <div className="card mb-8 animate-slide-up">
          {previewUrl ? (
            <img src={previewUrl} alt="预览" className="w-full max-h-64 object-cover rounded-xl mb-4" />
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary transition-colors mb-4"
            >
              <div className="text-center">
                <p className="text-3xl mb-2">📷</p>
                <p className="text-text-muted text-sm">点击选择照片</p>
              </div>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="照片描述（可选）..."
            className="input-field mb-4"
          />
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleUpload}
            disabled={uploading || !previewUrl}
            className="btn-primary"
          >
            {uploading ? '上传中...' : '上传'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">加载中...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">📷</p>
          <p className="text-text-muted">还没有照片，上传第一张吧！</p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group cursor-pointer break-inside-avoid animate-fade-in"
              onClick={() => setSelectedPhoto(photo)}
            >
              {imageUrls[photo.id] ? (
                <img
                  src={imageUrls[photo.id]}
                  alt={photo.caption || ''}
                  className="w-full rounded-xl shadow-soft group-hover:shadow-medium transition-all"
                  onError={() => console.error('[Gallery] 图片加载失败:', imageUrls[photo.id])}
                />
              ) : (
                <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-xl flex items-end">
                <div className="p-3 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                  {photo.caption && (
                    <p className="text-white text-sm mb-1">{photo.caption}</p>
                  )}
                  <p className="text-white/70 text-xs">
                    {new Date(photo.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Preview Modal */}
      {selectedPhoto && imageUrls[selectedPhoto.id] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative max-w-3xl w-full animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <img
              src={imageUrls[selectedPhoto.id]}
              alt={selectedPhoto.caption || ''}
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
            {selectedPhoto.caption && (
              <p className="text-white text-center mt-4">{selectedPhoto.caption}</p>
            )}
            <button
              onClick={() => { handleDelete(selectedPhoto.id); setSelectedPhoto(null); }}
              className="absolute top-4 right-4 px-3 py-1 bg-danger/80 text-white rounded-lg text-sm hover:bg-danger transition-colors"
            >
              删除
            </button>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 left-4 px-3 py-1 bg-black/50 text-white rounded-lg text-sm hover:bg-black/70 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
