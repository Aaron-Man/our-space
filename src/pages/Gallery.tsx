import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Photo } from '../types';

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fetchPhotos = async () => {
    try {
      const { data } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setPhotos(data as Photo[]);
    } catch { /* ignore */ }
    finally { setLoading(false); }
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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ext = file.name.split('.').pop();
      const path = `photos/${user.id}/${Date.now()}.${ext}`;
      const { data: uploadData } = await supabase.storage.from('images').upload(path, file);

      if (uploadData) {
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);

        await supabase.from('photos').insert({
          user_id: user.id,
          image_url: urlData.publicUrl,
          caption: caption.trim() || null,
        });

        setCaption('');
        setPreviewUrl('');
        setShowUpload(false);
        fetchPhotos();
      }
    } catch { /* ignore */ }
    finally { setUploading(false); }
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
              <img
                src={photo.image_url}
                alt={photo.caption || ''}
                className="w-full rounded-xl shadow-soft group-hover:shadow-medium transition-all"
              />
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
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative max-w-3xl w-full animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.image_url}
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
