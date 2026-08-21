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
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [orderModal, setOrderModal] = useState<Dish | null>(null);
  const [orderNote, setOrderNote] = useState('');
  const [ordering, setOrdering] = useState(false);

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

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('确定删除该分类？已有菜品的分类将变为未分类。')) return;
    try {
      await supabase.from('categories').delete().eq('id', id);
      setCategories(categories.filter((c) => c.id !== id));
      if (selectedCategory === id) setSelectedCategory(null);
    } catch { /* ignore */ }
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title mb-0">
            <span className="text-gradient">🍳 菜谱</span>
          </h1>
          <p className="text-text-light text-sm mt-1">今天吃什么？</p>
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
                添加菜品
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
              📂
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-text-main">分类管理</h3>
              <p className="text-text-light text-xs">添加或删除菜品分类</p>
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
          <div className="flex gap-2 mb-4">
            <input
              type="text" value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="输入新分类名称..."
              className="input-field flex-1"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
            />
            <button type="button" onClick={handleAddCategory} className="btn-primary whitespace-nowrap" disabled={!newCategory.trim()}>
              添加
            </button>
          </div>

          {/* Existing categories */}
          {categories.length === 0 ? (
            <div className="text-center py-6 bg-white/30 rounded-xl">
              <p className="text-text-muted text-sm">还没有分类，先添加一个吧！</p>
              <p className="text-text-light text-xs mt-1">比如：家常菜、凉菜、汤类、主食...</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="group flex items-center gap-1 px-3 py-2 bg-white/50 border border-white/50 rounded-xl hover:bg-primary/5 transition-all"
                >
                  <span className="text-sm text-text-main">{cat.name}</span>
                  <span className="text-text-light text-xs">({dishes.filter((d) => d.category_id === cat.id).length})</span>
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

      {/* Prompt to create categories when none exist */}
      {!showCategoryManager && categories.length === 0 && !loading && (
        <div className="card mb-6 text-center border-2 border-dashed border-primary/30">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-teal-400/20 to-emerald-500/20 flex items-center justify-center">
            <span className="text-3xl">📂</span>
          </div>
          <p className="text-text-main font-medium mb-1">还没有菜品分类</p>
          <p className="text-text-muted text-sm mb-4">先创建分类，再添加菜品</p>
          <button onClick={() => setShowCategoryManager(true)} className="btn-primary">
            📂 去创建分类
          </button>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="card mb-8 animate-slide-up overflow-hidden">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white text-lg">
              🍽️
            </div>
            <div>
              <h3 className="font-display font-bold text-text-main">添加新菜品</h3>
              <p className="text-text-light text-xs">丰富我们的菜谱</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div className="form-section mb-0">
                <label className="form-label">🏷️ 菜名</label>
                <input
                  type="text" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="比如：红烧肉" className="input-field"
                />
              </div>
              <div className="form-section mb-0">
                <label className="form-label">📂 分类</label>
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
            </div>

            <div className="form-section">
              <label className="form-label">📝 描述</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="描述一下这道菜..." className="input-field min-h-[80px] resize-none"
              />
            </div>

            <div className="form-section">
              <label className="form-label">🥬 食材</label>
              <input
                type="text" value={form.ingredients}
                onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                placeholder="食材（逗号分隔）" className="input-field"
              />
            </div>

            <div className="form-section">
              <label className="form-label">⭐ 难度</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((d) => (
                  <button
                    key={d} type="button"
                    onClick={() => setForm({ ...form, difficulty: d })}
                    className={`px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
                      form.difficulty === d
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-sm'
                        : 'bg-white/50 text-text-muted hover:bg-primary/10 hover:text-primary-dark border border-white/50'
                    }`}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">📷 菜品图片</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 bg-white/50 border border-white/50 rounded-xl text-text-muted text-sm hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  选择图片
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                {form.image_url && (
                  <span className="text-success text-sm flex items-center gap-1">✅ 图片已上传</span>
                )}
              </div>
            </div>

            <div className="form-section">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox" checked={form.available}
                  onChange={(e) => setForm({ ...form, available: e.target.checked })}
                  className="w-5 h-5 accent-primary rounded"
                />
                <span className="text-text-main text-sm font-medium">可点（显示在菜谱中）</span>
              </label>
            </div>

            <button type="submit" disabled={submitting || !form.name.trim() || !form.category_id} className="btn-primary w-full py-3">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  添加中...
                </span>
              ) : '✨ 添加菜品'}
            </button>

          </form>
        </div>
      )}

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
              !selectedCategory
                ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-sm'
                : 'bg-white/50 text-text-muted hover:bg-primary/10 hover:text-primary-dark border border-white/50'
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
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-sm'
                  : 'bg-white/50 text-text-muted hover:bg-primary/10 hover:text-primary-dark border border-white/50'
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
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
          <p className="text-text-muted font-medium">
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
                  className="w-full h-44 object-cover rounded-2xl mb-4 group-hover:scale-[1.02] transition-transform duration-300"
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
                    <p className="text-text-muted text-sm mt-2 line-clamp-2 leading-relaxed">{dish.description}</p>
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
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100/50">
                {dish.available && (
                  <button onClick={() => setOrderModal(dish)} className="btn-primary text-sm flex-1">
                    点这道菜
                  </button>
                )}
                <button
                  onClick={() => handleDeleteDish(dish.id)}
                  className="text-text-light hover:text-danger text-sm transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Modal */}
      {orderModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => { setOrderModal(null); setOrderNote(''); }} />
          <div className="modal-content animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white text-lg">
                  🍽️
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-text-main">确认点菜</h3>
                  <p className="text-text-light text-xs">选好就下单！</p>
                </div>
              </div>
            </div>
            <div className="modal-body">
              <div className="p-4 bg-primary/5 rounded-2xl mb-4">
                <p className="text-primary text-lg font-bold">{orderModal.name}</p>
                {orderModal.category && (
                  <p className="text-text-muted text-sm mt-1">
                    {orderModal.category.name} · 难度 {'★'.repeat(orderModal.difficulty)}
                  </p>
                )}
              </div>
              <div className="form-section">
                <label className="form-label">📝 备注</label>
                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="比如不要辣、多加点葱..."
                  className="input-field min-h-[80px] resize-none"
                />
              </div>
            </div>
            <div className="modal-footer">
              <div className="flex gap-3">
                <button onClick={handleOrder} disabled={ordering} className="btn-primary flex-1 py-3">
                  {ordering ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      提交中...
                    </span>
                  ) : '🎉 确认点菜'}
                </button>
                <button onClick={() => { setOrderModal(null); setOrderNote(''); }} className="btn-outline py-3">
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
