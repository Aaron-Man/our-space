import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Status } from '../types';
import { getRandomQuote, type Quote } from '../data/quotes';

export default function Home() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteIndex, setQuoteIndex] = useState<number>(-1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({ statuses: 0, journals: 0, orders: 0, memos: 0 });
  const [recentStatus, setRecentStatus] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshQuote = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      const { quote: q, index } = getRandomQuote(quoteIndex);
      setQuote(q);
      setQuoteIndex(index);
      setIsRefreshing(false);
    }, 300);
  }, [quoteIndex]);

  useEffect(() => {
    const { quote: q, index } = getRandomQuote();
    setQuote(q);
    setQuoteIndex(index);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statusesRes, journalsRes, ordersRes, memosRes] = await Promise.all([
        supabase.from('statuses').select('*').order('created_at', { ascending: false }).limit(3),
        supabase.from('journals').select('*', { count: 'exact' }).limit(1),
        supabase.from('orders').select('*', { count: 'exact' }).limit(1),
        supabase.from('memos').select('*', { count: 'exact' }).limit(1),
      ]);

      if (statusesRes.data) setRecentStatus(statusesRes.data as Status[]);
      setStats({
        statuses: statusesRes.count || 0,
        journals: journalsRes.count || 0,
        orders: ordersRes.count || 0,
        memos: memosRes.count || 0,
      });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Hero */}
      <section className="text-center py-6 sm:py-10 md:py-14">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
          <div className="decorative-line" />
          <span className="text-primary/60 text-xs sm:text-sm">✦</span>
          <div className="decorative-line" />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl brand-title mb-2 animate-float">
          金晨晓院
        </h1>
        <p className="text-xs sm:text-sm text-text-light font-brand tracking-[0.3em] mb-1">
          JIN CHEN XIAO YUAN
        </p>
        <div className="flex items-center justify-center gap-2 mb-4 sm:mb-5">
          <div className="h-px w-6 bg-primary/20" />
          <span className="text-accent/60 text-[10px]">◆</span>
          <div className="h-px w-6 bg-accent/20" />
        </div>
        <div className="relative group cursor-pointer mb-5 sm:mb-6" onClick={refreshQuote} title="点击换一句">
          <p className={`text-base sm:text-lg md:text-xl text-text-muted font-body mb-1 transition-opacity duration-300 ${isRefreshing ? 'opacity-0' : 'opacity-100'} animate-fade-in`}>
            {quote?.text_cn || quote?.text}
          </p>
          {(quote?.author || quote?.origin) && (
            <p className={`text-xs text-text-light transition-opacity duration-300 ${isRefreshing ? 'opacity-0' : 'opacity-100'}`}>
              —— {quote?.author || quote?.origin}
            </p>
          )}
          <span className="absolute -right-6 top-0 text-text-light/0 group-hover:text-text-light/50 transition-all text-sm" title="换一句">
            ↻
          </span>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
          <Link to="/menu" className="btn-primary text-center">
            🍳 今天吃什么
          </Link>
          <Link to="/journal" className="btn-accent text-center">
            📖 写日志
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <Link to="/status" className="card text-center group">
          <div className="text-3xl font-display font-bold text-primary mb-1 group-hover:scale-110 transition-transform">
            {stats.statuses}
          </div>
          <div className="text-text-muted text-sm">条状态</div>
        </Link>
        <Link to="/journal" className="card text-center group">
          <div className="text-3xl font-display font-bold text-accent mb-1 group-hover:scale-110 transition-transform">
            {stats.journals}
          </div>
          <div className="text-text-muted text-sm">篇日志</div>
        </Link>
        <Link to="/orders" className="card text-center group">
          <div className="text-3xl font-display font-bold text-success mb-1 group-hover:scale-110 transition-transform">
            {stats.orders}
          </div>
          <div className="text-text-muted text-sm">次点菜</div>
        </Link>
        <Link to="/memo" className="card text-center group">
          <div className="text-3xl font-display font-bold text-warning mb-1 group-hover:scale-110 transition-transform">
            {stats.memos}
          </div>
          <div className="text-text-muted text-sm">条备忘</div>
        </Link>
      </section>

      {/* Recent Status */}
      {recentStatus.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">最新动态</h2>
            <Link to="/status" className="text-primary text-sm hover:text-primary-dark transition-colors">
              查看全部 →
            </Link>
          </div>
          <div className="space-y-4">
            {recentStatus.map((s) => (
              <div key={s.id} className="card">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary flex-shrink-0">
                    {s.mood ? s.mood.charAt(0) : '💭'}
                  </div>
                  <div className="flex-1">
                    <p className="text-text-main">{s.content}</p>
                    <p className="text-text-light text-sm mt-1">
                      {new Date(s.created_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Links */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/travel" className="card group">
          <div className="flex items-center gap-4">
            <span className="text-4xl group-hover:animate-bounce">✈️</span>
            <div>
              <h3 className="text-lg font-display font-semibold text-text-main group-hover:text-primary transition-colors">
                旅行计划
              </h3>
              <p className="text-text-muted text-sm">规划我们的下一段旅程</p>
            </div>
          </div>
        </Link>
        <Link to="/gallery" className="card group">
          <div className="flex items-center gap-4">
            <span className="text-4xl group-hover:animate-bounce">📷</span>
            <div>
              <h3 className="text-lg font-display font-semibold text-text-main group-hover:text-primary transition-colors">
                相册
              </h3>
              <p className="text-text-muted text-sm">珍藏我们的美好瞬间</p>
            </div>
          </div>
        </Link>
        <Link to="/memo" className="card group">
          <div className="flex items-center gap-4">
            <span className="text-4xl group-hover:animate-bounce">📝</span>
            <div>
              <h3 className="text-lg font-display font-semibold text-text-main group-hover:text-primary transition-colors">
                备忘录
              </h3>
              <p className="text-text-muted text-sm">记录生活中的小事</p>
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}
