import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/status', label: '状态', icon: '💭' },
  { path: '/journal', label: '日志', icon: '📖' },
  { path: '/menu', label: '菜谱', icon: '🍳' },
  { path: '/orders', label: '点菜', icon: '📋' },
  { path: '/travel', label: '旅行', icon: '✈️' },
  { path: '/memo', label: '备忘', icon: '📝' },
  { path: '/gallery', label: '相册', icon: '📷' },
  { path: '/settings', label: '设置', icon: '⚙️' },
];

// Bottom tab bar items (most frequently used)
const bottomTabs = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/menu', label: '菜谱', icon: '🍳' },
  { path: '/journal', label: '日志', icon: '📖' },
  { path: '/gallery', label: '相册', icon: '📷' },
  { path: '/settings', label: '更多', icon: '⚙️' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-xl border-b border-white/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-lg sm:text-xl">🏡</span>
              <span className="font-brand font-semibold text-base sm:text-lg lg:text-xl tracking-wider text-gradient">
                金晨晓院
              </span>
            </Link>

            {/* Desktop nav (md+) */}
            <div className="hidden md:flex items-center gap-0.5 overflow-x-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-2 lg:px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary-dark shadow-sm border border-primary/10'
                        : 'text-text-muted hover:text-text-main hover:bg-white/40'
                    }`}
                  >
                    <span className="mr-0.5 lg:mr-1">{item.icon}</span>
                    <span className="hidden lg:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile hamburger - shows when bottom tab doesn't cover current page */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-text-muted hover:text-primary transition-colors rounded-xl hover:bg-white/40"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu (for pages not in bottom tabs) */}
        {isOpen && (
          <div className="md:hidden bg-white/90 backdrop-blur-xl border-t border-white/30 animate-fade-in">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary-dark'
                        : 'text-text-muted hover:text-text-main hover:bg-white/40'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Tab Bar (mobile only) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/80 backdrop-blur-xl border-t border-white/30 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {bottomTabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex flex-col items-center justify-center py-2 px-2 min-w-[56px] transition-all duration-200 ${
                  isActive
                    ? 'text-primary-dark scale-105'
                    : 'text-text-muted'
                }`}
              >
                <span className={`text-xl mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {tab.icon}
                </span>
                <span className={`text-[10px] font-medium leading-tight ${isActive ? 'font-semibold' : ''}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-1 w-5 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
