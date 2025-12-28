import { NavLink, Outlet, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/program-outcomes', label: 'Program Outcomes' },
  { to: '/admin/learning-outcomes', label: 'Learning Outcomes' },
  { to: '/admin/courses', label: 'Courses' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/student-options', label: 'Student Options' },
  { to: '/admin/approvals', label: 'Approvals' }
];

const AdminLayout = () => {
  const [theme, setTheme] = useState('light');
  const [searchParams] = useSearchParams();
  const adminId = searchParams.get('adminId') || 'current';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div
      className={clsx(
        'min-h-screen',
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      )}
    >
      <div className="flex flex-col min-h-screen">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:bg-slate-900/80 dark:border-slate-800">
          <div className="flex items-center justify-between w-full max-w-6xl px-6 py-4 mx-auto">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-brand-500">Admin</p>
              <h1 className="text-2xl font-semibold">Administration Panel</h1>
            </div>
            <button
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-xl bg-brand-600 hover:bg-brand-700"
            >
              {theme === 'light' ? 'Dark theme' : 'Light theme'}
            </button>
          </div>
          <nav className="w-full border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap w-full max-w-6xl px-4 mx-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'px-4 py-3 text-sm font-semibold transition border-b-2 -mb-px',
                      isActive
                        ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        </header>
        <main className="flex-1 w-full max-w-6xl px-4 py-8 mx-auto">
          <Outlet context={{ adminId, theme, setTheme }} />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

