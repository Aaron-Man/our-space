import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen relative">
      <Navbar />
      <main className="relative z-10 pt-14 sm:pt-16 pb-16 md:pb-0">
        <Outlet />
      </main>
      <footer className="relative z-10 border-t border-white/20 py-6 mt-12 backdrop-blur-sm bg-white/10 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 text-center">
          <p className="text-text-light text-sm font-body">
            Made with <span className="text-accent">♥</span> for us
          </p>
        </div>
      </footer>
    </div>
  );
}
