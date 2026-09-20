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
    name: '', description: '', category_ids: [] as number[], ingredients: '',
    difficulty: 1, image_url: '', available: true,
  });
  const [editingDishId, setEditingDishId] = useState<number | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [_imageFile, setImageFile] = useState<File | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [dragDishIdx, setDragDishIdx] = useState<number | null>(null);
  const [dragOverDishIdx, setDragOverDishIdx] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      // Fetch categories first
      const catRes = await supabase.from('categories').select('*').order('sort_order');
      if (catRes.data) {
        const loadedCats = catRes.data as Category[];
        // Auto-initialize category sort_order if all are 0
        if (loadedCats.length > 1 && loadedCats.every((c) => !c.sort_order)) {
          const updates = loadedCats.map((c, i) =>
            supabase.from('categories').update({ sort_order: i }).eq('id', c.id)
          );
          await Promise.all(updates);
          loadedCats.forEach((c, i) => { c.sort_order = i; });
        }
        setCategories(loadedCats);
      }

      // Fetch dishes separately to avoid join issues
      const dishRes = await supabase.from('dishes').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
      if (dishRes.data) {
        const loadedDishes = dishRes.data as Dish[];
        // Auto-initialize sort_order if all are 0 (after migration)
        if (loadedDishes.length > 1 && loadedDishes.every((d) => !d.sort_order)) {
          const updates = loadedDishes.map((d, i) =>
            supabase.from('dishes').update({ sort_order: i }).eq('id', d.id)
          );
          await Promise.all(updates);
          loadedDishes.forEach((d, i) => { d.sort_order = i; });
        }
        // Try to load dish_categories for multi-category support
        try {
          const dcRes = await supabase.from('dish_categories').select('dish_id, category_id');
          if (dcRes.data) {
            // Group by dish_id
            const dcMap = new Map<number, number[]>();
            dcRes.data.forEach((dc) => {
              if (!dcMap.has(dc.dish_id)) dcMap.set(dc.dish_id, []);
              dcMap.get(dc.dish_id)!.push(dc.category_id);
            });
            // Attach categories to dishes
            loadedDishes.forEach((d) => {
              const catIds = dcMap.get(d.id) || [];
              d.categories = catIds.map((cid) => catRes.data?.find((c) => c.id === cid)).filter(Boolean) as Category[];
              // Keep backward compat: set category_id to first category
              if (d.categories.length > 0) {
                d.category_id = d.categories[0].id;
                d.category = d.categories[0];
              }
            });
          }
        } catch {
          // Fallback to single category
          loadedDishes.forEach((d) => {
            if (d.category_id) {
              d.category = catRes.data?.find((c) => c.id === d.category_id) || null;
              d.categories = d.category ? [d.category] : [];
            }
          });
        }
        setDishes(loadedDishes);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredDishes = selectedCategory
    ? dishes.filter((d) => d.categories?.some((c) => c.id === selectedCategory))
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
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: newCategory.trim(), sort_order: categories.length })
      .select()
      .single();
    if (error) {
      console.error('添加分类失败:', error);
      alert('添加分类失败: ' + error.message);
      return;
    }
    if (data) {
      setCategories([...categories, data as Category]);
      setNewCategory('');
    }
  };

  const handleMoveCategory = async (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || toIdx < 0 || toIdx >= categories.length) return;
    const newCats = [...categories];
    const [moved] = newCats.splice(fromIdx, 1);
    newCats.splice(toIdx, 0, moved);
    // Reassign sort_order based on new positions
    const updates = newCats.map((cat, i) =>
      supabase.from('categories').update({ sort_order: i }).eq('id', cat.id)
    );
    setCategories(newCats);
    await Promise.all(updates);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.category_ids.length === 0) return;
    setSubmitting(true);

    try {
      let dishId: number;
      if (editingDishId) {
        // Update existing dish
        const { data } = await supabase.from('dishes').update({
          name: form.name.trim(),
          description: form.description.trim() || null,
          ingredients: form.ingredients.trim() || null,
          difficulty: form.difficulty,
          image_url: form.image_url || null,
          available: form.available,
        }).eq('id', editingDishId).select().single();

        if (data) {
          dishId = editingDishId;
          // Update dish_categories
          await supabase.from('dish_categories').delete().eq('dish_id', dishId);
          if (form.category_ids.length > 0) {
            await supabase.from('dish_categories').insert(
              form.category_ids.map((cid) => ({ dish_id: dishId, category_id: cid }))
            );
          }
          // Refresh to get updated categories
          await fetchData();
        }
      } else {
        // Insert new dish
        const maxOrder = dishes.length > 0 ? Math.max(...dishes.map((d) => d.sort_order || 0)) : -1;
        const { data } = await supabase.from('dishes').insert({
          name: form.name.trim(),
          description: form.description.trim() || null,
          ingredients: form.ingredients.trim() || null,
          difficulty: form.difficulty,
          image_url: form.image_url || null,
          available: form.available,
          sort_order: maxOrder + 1,
        }).select().single();

        if (data) {
          dishId = data.id;
          // Insert dish_categories
          if (form.category_ids.length > 0) {
            await supabase.from('dish_categories').insert(
              form.category_ids.map((cid) => ({ dish_id: dishId, category_id: cid }))
            );
          }
          // Refresh to get updated categories
          await fetchData();
        }
      }
      resetForm();
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', category_ids: [], ingredients: '', difficulty: 1, image_url: '', available: true });
    setEditingDishId(null);
    setImageFile(null);
    setShowForm(false);
  };

  const handleEditDish = (dish: Dish) => {
    setForm({
      name: dish.name,
      description: dish.description || '',
      category_ids: dish.categories?.map((c) => c.id) || [],
      ingredients: dish.ingredients || '',
      difficulty: dish.difficulty,
      image_url: dish.image_url || '',
      available: dish.available,
    });
    setEditingDishId(dish.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      // Generate random order ID (8 digits)
      const randomOrderId = Math.floor(10000000 + Math.random() * 90000000).toString();

      const { data } = await supabase.from('orders').insert({
        user_id: user.id,
        dish_id: orderModal.id,
        note: orderNote.trim() || null,
        status: 'pending',
        custom_order_id: randomOrderId,
      }).select().single();

      // Store order ID for success modal
      if (data) {
        sessionStorage.setItem('newOrderId', data.id.toString());
      }

      setOrderModal(null);
      setOrderNote('');
      
      // Navigate to orders page to show success modal
      window.location.href = '/our-space/orders';
    } catch {
      alert('点菜失败，请重试');
    } finally {
      setOrdering(false);
    }
  };

  const handleEditCategory = async (id: number) => {
    if (!editCatName.trim()) return;
    try {
      const { data } = await supabase.from('categories').update({ name: editCatName.trim() }).eq('id', id).select().single();
      if (data) {
        setCategories(categories.map((c) => c.id === id ? { ...c, name: data.name } : c));
      }
    } catch { /* ignore */ }
    setEditingCatId(null);
    setEditCatName('');
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('确定删除该分类？已有菜品的分类将变为未分类。')) return;
    try {
      await supabase.from('categories').delete().eq('id', id);
      setCategories(categories.filter((c) => c.id !== id));
      if (selectedCategory === id) setSelectedCategory(null);
    } catch { /* ignore */ }
  };

  const handleMoveDish = async (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || toIdx < 0 || toIdx >= filteredDishes.length) return;
    const newFiltered = [...filteredDishes];
    const [moved] = newFiltered.splice(fromIdx, 1);
    newFiltered.splice(toIdx, 0, moved);
    // Update the main dishes array to match new order
    const newDishes = [...dishes];
    newFiltered.forEach((fd) => {
      const idx = newDishes.findIndex((d) => d.id === fd.id);
      if (idx !== -1) newDishes[idx] = fd;
    });
    // Reassign sort_order
    const updates = newFiltered.map((d, i) =>
      supabase.from('dishes').update({ sort_order: i }).eq('id', d.id)
    );
    setDishes(newDishes);
    await Promise.all(updates);
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="section-title mb-0">
            <span className="text-gradient">🍳 菜谱</span>
          </h1>
          <p className="text-text-light text-sm mt-1">今天吃什么？</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowCategoryManager(!showCategoryManager)}
            className="btn-outline flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            管理分类
          </button>
          <button onClick={() => { if (showForm && editingDishId) { resetForm(); } else { setShowForm(!showForm); } }} className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-none">
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
              <p className="text-text-light text-xs">拖拽分类调整顺序</p>
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

          {/* Existing categories - drag to reorder */}
          {categories.length === 0 ? (
            <div className="text-center py-6 bg-white/30 rounded-xl">
              <p className="text-text-muted text-sm">还没有分类，先添加一个吧！</p>
              <p className="text-text-light text-xs mt-1">比如：家常菜、凉菜、汤类、主食...</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {categories.map((cat, idx) => (
                <div
                  key={cat.id}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
                  onDragEnd={() => {
                    if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
                      handleMoveCategory(dragIdx, dragOverIdx);
                    }
                    setDragIdx(null);
                    setDragOverIdx(null);
                  }}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing
                    ${dragIdx === idx ? 'opacity-40 scale-95 border-primary/30 bg-primary/5' : ''}
                    ${dragOverIdx === idx && dragIdx !== idx ? 'border-primary/50 bg-primary/5 shadow-sm' : 'border-white/50 bg-white/50 hover:bg-white/70'}
                  `}
                >
                  {/* Drag handle */}
                  <div className="flex flex-col items-center text-text-light/50 group-hover:text-text-light transition-colors flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                      <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                    </svg>
                  </div>
                  {/* Category number */}
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                    {idx + 1}
                  </span>
                  {/* Category info / edit input */}
                  {editingCatId === cat.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        className="input-field py-1 text-sm flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); handleEditCategory(cat.id); }
                          if (e.key === 'Escape') { setEditingCatId(null); setEditCatName(''); }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleEditCategory(cat.id); }}
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                        title="保存"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setEditingCatId(null); setEditCatName(''); }}
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-text-light hover:bg-text-light/10 transition-colors flex-shrink-0"
                        title="取消"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-text-main flex-1">{cat.name}</span>
                      <span className="text-text-light text-xs">{dishes.filter((d) => d.categories?.some((c) => c.id === cat.id)).length} 道菜</span>
                      {/* Edit */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingCatId(cat.id); setEditCatName(cat.name); }}
                        className="w-6 h-6 flex items-center justify-center text-text-light hover:text-primary opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                        title="编辑分类"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="w-6 h-6 flex items-center justify-center text-text-light hover:text-danger opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                        title="删除分类"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
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
              <h3 className="font-display font-bold text-text-main">{editingDishId ? '编辑菜品' : '添加新菜品'}</h3>
              <p className="text-text-light text-xs">{editingDishId ? '修改菜品信息' : '丰富我们的菜谱'}</p>
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
                <label className="form-label">📂 分类 <span className="text-text-muted font-normal">（可多选）</span></label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const selected = form.category_ids.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          const ids = selected
                            ? form.category_ids.filter((id) => id !== c.id)
                            : [...form.category_ids, c.id];
                          setForm({ ...form, category_ids: ids });
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 ${
                          selected
                            ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-sm'
                            : 'bg-white/50 text-text-muted hover:bg-primary/10 hover:text-primary-dark border border-white/50'
                        }`}
                      >
                        {selected && '✓ '}{c.name}
                      </button>
                    );
                  })}
                  {categories.length === 0 && (
                    <span className="text-text-muted text-sm">请先添加分类</span>
                  )}
                </div>
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

            <button type="submit" disabled={submitting || !form.name.trim() || form.category_ids.length === 0} className="btn-primary w-full py-3">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {editingDishId ? '保存中...' : '添加中...'}
                </span>
              ) : editingDishId ? '✅ 保存修改' : '✨ 添加菜品'}
            </button>

          </form>
        </div>
      )}

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-1 px-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
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
              className={`px-4 py-2 rounded-full text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDishes.map((dish, idx) => (
            <div
              key={dish.id}
              draggable
              onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragDishIdx(idx); }}
              onDragOver={(e) => { e.preventDefault(); setDragOverDishIdx(idx); }}
              onDragEnd={() => {
                if (dragDishIdx !== null && dragOverDishIdx !== null && dragDishIdx !== dragOverDishIdx) {
                  handleMoveDish(dragDishIdx, dragOverDishIdx);
                }
                setDragDishIdx(null);
                setDragOverDishIdx(null);
              }}
              className={`card group cursor-grab active:cursor-grabbing transition-all duration-200
                ${dragDishIdx === idx ? 'opacity-40 scale-95 ring-2 ring-primary/30' : ''}
                ${dragOverDishIdx === idx && dragDishIdx !== idx ? 'ring-2 ring-primary/50 shadow-medium' : ''}
              `}
            >
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
                  {dish.categories && dish.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dish.categories.map((c) => (
                        <span key={c.id} className="badge-primary text-xs">{c.name}</span>
                      ))}
                    </div>
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
              <div className="flex items-center justify-between gap-1 mt-4 pt-3 border-t border-gray-100/50">
                {/* Drag handle */}
                <div className="text-text-light/40 group-hover:text-text-light/70 transition-colors flex-shrink-0" title="拖拽排序">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                  </svg>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditDish(dish)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-light hover:text-blue-500 hover:bg-blue-50 transition-all"
                    title="编辑"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {dish.available && (
                    <button
                      onClick={() => setOrderModal(dish)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-text-light hover:text-primary hover:bg-primary/10 transition-all"
                      title="点这道菜"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteDish(dish.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-light hover:text-danger hover:bg-red-50 transition-all"
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
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
                {orderModal.categories && orderModal.categories.length > 0 ? (
                  <p className="text-text-muted text-sm mt-1">
                    {orderModal.categories.map((c) => c.name).join(' · ')} · 难度 {'★'.repeat(orderModal.difficulty)}
                  </p>
                ) : (
                  <p className="text-text-muted text-sm mt-1">
                    难度 {'★'.repeat(orderModal.difficulty)}
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
