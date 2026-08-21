import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen relative">
      <Navbar />
      <main className="relative z-10 pt-16">
        <Outlet />
      </main>
      <footer className="relative z-10 border-t border-gray-100 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-text-light text-sm font-body">
            Made with <span className="text-accent">♥</span> for us
          </p>
        </div>
      </footer>
    </div>
  );
}
