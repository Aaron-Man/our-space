import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Order } from '../types';
import { ORDER_STATUS_MAP } from '../types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');

  const fetchOrders = async () => {
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, dish:dishes(*)')
        .order('created_at', { ascending: false });
      if (data) setOrders(data as Order[]);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  // Check for success modal on mount
  useEffect(() => {
    const checkNewOrder = sessionStorage.getItem('newOrderId');
    if (checkNewOrder && orders.length > 0) {
      const order = orders.find(o => o.id.toString() === checkNewOrder);
      if (order) {
        setLastOrder(order);
        setShowSuccessModal(true);
        sessionStorage.removeItem('newOrderId');
      }
    }
  }, [orders]);

  const handleStatusChange = async (id: number, status: Order['status']) => {
    try {
      await supabase.from('orders').update({ status }).eq('id', id);
      fetchOrders();
    } catch { /* ignore */ }
  };

  const handleUndoStatus = async (order: Order) => {
    // Define reverse flow
    const reverseFlow: Record<string, Order['status'] | null> = {
      pending: null,
      cooking: 'pending',
      done: 'cooking',
      cancelled: 'pending',
    };
    const prevStatus = reverseFlow[order.status];
    if (!prevStatus) return;
    
    try {
      await supabase.from('orders').update({ status: prevStatus }).eq('id', order.id);
      fetchOrders();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这条订单？')) return;
    try {
      await supabase.from('orders').delete().eq('id', id);
      fetchOrders();
    } catch { /* ignore */ }
  };

  const filteredOrders = filter ? orders.filter((o) => o.status === filter) : orders;

  // Filter by date range
  const getFilteredByDate = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return filteredOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      switch (dateRange) {
        case 'today':
          return orderDate >= today;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  const dateFilteredOrders = getFilteredByDate();

  // Statistics
  const stats = {
    total: dateFilteredOrders.length,
    pending: dateFilteredOrders.filter((o) => o.status === 'pending').length,
    cooking: dateFilteredOrders.filter((o) => o.status === 'cooking').length,
    done: dateFilteredOrders.filter((o) => o.status === 'done').length,
    cancelled: dateFilteredOrders.filter((o) => o.status === 'cancelled').length,
  };

  // Chart data - last 7 days
  const getLast7DaysData = () => {
    const today = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      const count = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.toDateString() === date.toDateString();
      }).length;
      data.push({ date: dateStr, count });
    }
    return data;
  };

  const getNextStatus = (current: Order['status']): Order['status'] | null => {
    const flow: Record<string, Order['status']> = {
      pending: 'cooking',
      cooking: 'done',
    };
    return flow[current] || null;
  };

  const getStatusOptions = (current: Order['status']): Array<{ status: Order['status']; label: string }> => {
    const options: Array<{ status: Order['status']; label: string }> = [];
    
    if (current !== 'done' && current !== 'cancelled') {
      const next = getNextStatus(current);
      if (next) {
        options.push({ status: next, label: ORDER_STATUS_MAP[next].label });
      }
    }
    
    // Add skip to done option
    if (current === 'pending') {
      options.push({ status: 'done', label: '✅ 完成' });
    }
    
    // Add cancel option
    if (current !== 'cancelled') {
      options.push({ status: 'cancelled', label: '❌ 取消' });
    }
    
    return options;
  };

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="section-title mb-0">
          <span className="text-gradient">📋 点菜记录</span>
        </h1>
        <p className="text-text-light text-sm mt-1">看看今天吃什么</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="card !py-3 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light text-xs">总订单</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
          </div>
        </div>
        <div className="card !py-3 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light text-xs">待制作</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <span className="text-xl">⏳</span>
            </div>
          </div>
        </div>
        <div className="card !py-3 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light text-xs">制作中</p>
              <p className="text-2xl font-bold text-green-600">{stats.cooking}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <span className="text-xl">🔥</span>
            </div>
          </div>
        </div>
        <div className="card !py-3 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light text-xs">已完成</p>
              <p className="text-2xl font-bold text-purple-600">{stats.done}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <span className="text-xl">✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Filter & View Mode */}
      <div className="card mb-5 !py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {(['today', 'week', 'month', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  dateRange === range
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white/50 text-text-muted hover:bg-primary/10'
                }`}
              >
                {{
                  today: '今天',
                  week: '近7天',
                  month: '近30天',
                  all: '全部'
                }[range]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list' ? 'bg-primary text-white' : 'bg-white/50 text-text-muted'
              }`}
            >
              📝 列表
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'chart' ? 'bg-primary text-white' : 'bg-white/50 text-text-muted'
              }`}
            >
              📊 图表
            </button>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-1 px-1">
        <button
          onClick={() => setFilter('')}
          className={`px-4 py-2 rounded-full text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
            !filter ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-sm' : 'bg-white/50 text-text-muted hover:bg-primary/10 border border-white/50'
          }`}
        >
          全部 ({dateFilteredOrders.length})
        </button>
        {(Object.entries(ORDER_STATUS_MAP) as [string, { label: string }][]).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
              filter === key ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-sm' : 'bg-white/50 text-text-muted hover:bg-primary/10 border border-white/50'
            }`}
          >
            {val.label} ({stats[key as keyof typeof stats] || 0})
          </button>
        ))}
      </div>

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="card mb-6 animate-fade-in">
          <h3 className="font-display font-bold text-text-main mb-4">📊 近7天点菜趋势</h3>
          <div className="space-y-3">
            {getLast7DaysData().map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-16 text-xs text-text-light text-right">{item.date}</div>
                <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden relative">
                  {item.count > 0 && (
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((item.count / Math.max(...getLast7DaysData().map(d => d.count))) * 100, 100)}%` }}
                    />
                  )}
                  {item.count > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-text-main">
                      {item.count} 单
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">加载中...</p>
        </div>
      ) : dateFilteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <span className="text-4xl">📋</span>
          </div>
          <p className="text-text-muted font-medium">
            {filter ? '该状态暂无订单' : '还没有订单，去菜谱页面点一道菜吧！'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {dateFilteredOrders.map((order) => {
            const statusInfo = ORDER_STATUS_MAP[order.status];
            const statusOptions = getStatusOptions(order.status);
            return (
              <div key={order.id} className="card animate-fade-in group hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-display font-semibold text-text-main">
                        {order.dish?.name || '未知菜品'}
                      </h3>
                      <span className={`badge-${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-text-light text-xs flex items-center gap-2 mb-1">
                      <span className="font-mono text-primary font-bold">#{order.custom_order_id || order.id}</span>
                      <span>•</span>
                      <span>{new Date(order.created_at).toLocaleString('zh-CN')}</span>
                    </p>
                    {order.note && (
                      <p className="text-text-muted text-sm flex items-center gap-1">
                        <span>📝</span> {order.note}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap sm:flex-col gap-2">
                    {/* Multiple action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {statusOptions.map((opt) => (
                        <button
                          key={opt.status}
                          onClick={() => handleStatusChange(order.id, opt.status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            opt.status === 'done' 
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : opt.status === 'cancelled'
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'btn-primary text-sm'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    
                    {/* Undo button */}
                    {order.status !== 'pending' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => handleUndoStatus(order)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 text-text-muted hover:bg-gray-300 transition-all"
                      >
                        ↩️ 撤销
                      </button>
                    )}
                    
                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                    >
                      🗑️ 删除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && lastOrder && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowSuccessModal(false)} />
          <div className="modal-content animate-bounce-in max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="text-center p-6">
              {/* Success Animation */}
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-pulse">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-display font-bold text-text-main mb-2">🎉 点菜成功！</h3>
              <p className="text-text-muted text-sm mb-4">
                已成功下单 <span className="text-primary font-bold">{lastOrder.dish?.name}</span>
              </p>
              
              <div className="bg-primary/5 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">订单号：</span>
                  <span className="font-mono font-bold text-primary">#{lastOrder.custom_order_id || lastOrder.id}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-text-muted">当前状态：</span>
                  <span className={`badge-${ORDER_STATUS_MAP[lastOrder.status].color}`}>
                    {ORDER_STATUS_MAP[lastOrder.status].label}
                  </span>
                </div>
                {lastOrder.note && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-text-light text-xs">📝 {lastOrder.note}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="btn-primary flex-1 py-2.5"
                >
                  ✅ 知道了
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    window.location.href = '/our-space/menu';
                  }}
                  className="btn-outline flex-1 py-2.5"
                >
                  继续点菜
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
