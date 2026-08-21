import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Dish, Category } from '../types';
import { DIFFICULTY_LABELS } from '../types';

export default function MenuPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [orderModal, setOrderModal] = useState<Dish | null>(null);
  const [orderNote, setOrderNote] = useState('');
  const [ordering, setOrdering] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '', description: '', category_id: 0, ingredients: '',
    difficulty: 1, image_url: '', available: true,
  });
  const [newCategory, setNewCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [_imageFile, setImageFile] = useState<File | null>(null);

  const fetchData = async () => {
    try {
      const [dishRes, catRes] = await Promise.all([
        supabase.from('dishes').select('*, category:categories(*)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order'),
      ]);
      if (dishRes.data) setDishes(dishRes.data as Dish[]);
      if (catRes.data) setCategories(catRes.data as Category[]);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredDishes = selectedCategory
    ? dishes.filter((d) => d.category_id === selectedCategory)
    : dishes;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split('.').pop();
    const path = `dishes/${user.id}/${Date.now()}.${ext}`;
    const { data: uploadData } = await supabase.storage.from('images').upload(path, file);
    if (uploadData) {
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const { data } = await supabase
      .from('categories')
      .insert({ name: newCategory.trim(), sort_order: categories.length })
      .select()
      .single();
    if (data) {
      setCategories([...categories, data as Category]);
      setNewCategory('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category_id) return;
    setSubmitting(true);

    try {
      const { data } = await supabase.from('dishes').insert({
        name: form.name.trim(),
        description: form.description.trim() || null,
        category_id: form.category_id,
        ingredients: form.ingredients.trim() || null,
        difficulty: form.difficulty,
        image_url: form.image_url || null,
        available: form.available,
      }).select().single();

      if (data) {
        setDishes([data as Dish, ...dishes]);
        setForm({ name: '', description: '', category_id: 0, ingredients: '', difficulty: 1, image_url: '', available: true });
        setImageFile(null);
        setShowForm(false);
      }
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  const handleDeleteDish = async (id: number) => {
    if (!confirm('确定删除这道菜？')) return;
    try {
      await supabase.from('dishes').delete().eq('id', id);
      setDishes(dishes.filter((d) => d.id !== id));
    } catch { /* ignore */ }
  };

  const handleOrder = async () => {
    if (!orderModal) return;
    setOrdering(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('orders').insert({
        user_id: user.id,
        dish_id: orderModal.id,
        note: orderNote.trim() || null,
        status: 'pending',
      });

      setOrderModal(null);
      setOrderNote('');
      alert('点菜成功！');
    } catch {
      alert('点菜失败，请重试');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-8">
        <h1 className="section-title mb-0">🍳 菜谱</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? '取消' : '+ 添加菜品'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="菜名 *" className="input-field"
            />
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
              className="input-field"
            >
              <option value={0}>选择分类 *</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="描述" className="input-field mb-4 min-h-[80px] resize-none"
          />

          <input
            type="text" value={form.ingredients}
            onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
            placeholder="食材（逗号分隔）" className="input-field mb-4"
          />

          <div className="flex items-center gap-4 mb-4">
            <span className="text-text-muted text-sm">难度：</span>
            {[1, 2, 3, 4, 5].map((d) => (
              <button
                key={d} type="button"
                onClick={() => setForm({ ...form, difficulty: d })}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  form.difficulty === d
                    ? 'bg-primary-100 text-primary-dark border border-primary/30'
                    : 'bg-surface-warm text-text-muted hover:bg-primary-50'
                }`}
              >
                {DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-surface-warm rounded-xl text-text-muted text-sm hover:bg-primary-50 hover:text-primary transition-colors"
            >
              📷 添加图片
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            {form.image_url && (
              <span className="text-success text-sm">图片已上传</span>
            )}
          </div>

          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox" checked={form.available}
              onChange={(e) => setForm({ ...form, available: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-text-muted text-sm">可点</span>
          </label>

          <button type="submit" disabled={submitting || !form.name.trim() || !form.category_id} className="btn-primary">
            {submitting ? '添加中...' : '添加菜品'}
          </button>

          {/* Category Management */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-text-muted text-sm mb-2">管理分类：</p>
            <div className="flex gap-2">
              <input
                type="text" value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="新分类名称"
                className="input-field flex-1"
              />
              <button type="button" onClick={handleAddCategory} className="btn-outline text-sm">
                添加分类
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
              !selectedCategory
                ? 'bg-primary-100 text-primary-dark border border-primary/30'
                : 'bg-surface-warm text-text-muted hover:bg-primary-50'
            }`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                selectedCategory === cat.id
                  ? 'bg-primary-100 text-primary-dark border border-primary/30'
                  : 'bg-surface-warm text-text-muted hover:bg-primary-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Dish Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">加载中...</p>
        </div>
      ) : filteredDishes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">🍽️</p>
          <p className="text-text-muted">
            {selectedCategory ? '该分类暂无菜品' : '菜单还是空的，添加第一道菜吧！'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDishes.map((dish) => (
            <div key={dish.id} className="card group">
              {dish.image_url && (
                <img
                  src={dish.image_url}
                  alt={dish.name}
                  className="w-full h-40 object-cover rounded-xl mb-4"
                />
              )}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-display font-semibold text-text-main group-hover:text-primary transition-colors">
                    {dish.name}
                  </h3>
                  {dish.category && (
                    <span className="badge-primary text-xs mt-1">{dish.category.name}</span>
                  )}
                  {dish.description && (
                    <p className="text-text-muted text-sm mt-2 line-clamp-2">{dish.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-text-light text-xs">
                      难度 {'★'.repeat(dish.difficulty)}{'☆'.repeat(5 - dish.difficulty)}
                    </span>
                  </div>
                  {dish.ingredients && (
                    <p className="text-text-light text-xs mt-1">食材：{dish.ingredients}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {dish.available && (
                  <button onClick={() => setOrderModal(dish)} className="btn-primary text-sm flex-1">
                    点这道菜
                  </button>
                )}
                <button
                  onClick={() => handleDeleteDish(dish.id)}
                  className="text-text-light hover:text-danger text-sm transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Modal */}
      {orderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOrderModal(null)} />
          <div className="relative bg-surface-card rounded-2xl shadow-medium p-6 max-w-md w-full animate-bounce-in">
            <h3 className="text-xl font-display font-bold text-text-main mb-4">
              确认点菜
            </h3>
            <div className="mb-4">
              <p className="text-primary text-lg font-semibold">{orderModal.name}</p>
              {orderModal.category && (
                <p className="text-text-muted text-sm">{orderModal.category.name} · 难度 {'★'.repeat(orderModal.difficulty)}</p>
              )}
            </div>
            <textarea
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              placeholder="备注（可选）：比如不要辣、多加点葱..."
              className="input-field mb-4 min-h-[80px] resize-none"
            />
            <div className="flex gap-3">
              <button onClick={handleOrder} disabled={ordering} className="btn-primary flex-1">
                {ordering ? '提交中...' : '确认点菜'}
              </button>
              <button onClick={() => { setOrderModal(null); setOrderNote(''); }} className="btn-outline">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
