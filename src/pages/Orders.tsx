import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Order } from '../types';
import { ORDER_STATUS_MAP } from '../types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

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

  const handleStatusChange = async (id: number, status: Order['status']) => {
    try {
      await supabase.from('orders').update({ status }).eq('id', id);
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

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    cooking: orders.filter((o) => o.status === 'cooking').length,
    done: orders.filter((o) => o.status === 'done').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  const getNextStatus = (current: Order['status']): Order['status'] | null => {
    const flow: Record<string, Order['status']> = {
      pending: 'cooking',
      cooking: 'done',
    };
    return flow[current] || null;
  };

  return (
    <div className="page-container">
      <h1 className="section-title">📋 点菜记录</h1>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setFilter('')}
          className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
            !filter ? 'bg-primary-100 text-primary-dark border border-primary/30' : 'bg-surface-warm text-text-muted hover:bg-primary-50'
          }`}
        >
          全部 ({statusCounts.all})
        </button>
        {(Object.entries(ORDER_STATUS_MAP) as [string, { label: string }][]).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
              filter === key ? 'bg-primary-100 text-primary-dark border border-primary/30' : 'bg-surface-warm text-text-muted hover:bg-primary-50'
            }`}
          >
            {val.label} ({statusCounts[key as keyof typeof statusCounts] || 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">加载中...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-text-muted">
            {filter ? '该状态暂无订单' : '还没有订单，去菜谱页面点一道菜吧！'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusInfo = ORDER_STATUS_MAP[order.status];
            const nextStatus = getNextStatus(order.status);
            return (
              <div key={order.id} className="card animate-fade-in">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-display font-semibold text-text-main">
                        {order.dish?.name || '未知菜品'}
                      </h3>
                      <span className={`badge-${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    {order.note && (
                      <p className="text-text-muted text-sm mb-1">备注：{order.note}</p>
                    )}
                    <p className="text-text-light text-xs">
                      {new Date(order.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {nextStatus && (
                      <button
                        onClick={() => handleStatusChange(order.id, nextStatus)}
                        className="btn-primary text-sm"
                      >
                        {ORDER_STATUS_MAP[nextStatus].label}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="text-text-light hover:text-danger text-sm transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
