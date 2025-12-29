import { NavLink, Outlet, useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import clsx from 'clsx';
import studentService from '../../services/studentService';
import useAsyncResource from '../../hooks/useAsyncResource';

const navItems = [
  { to: '/student/dashboard', label: 'Dashboard' },
  { to: '/student/assessments', label: 'Assessments' },
  { to: '/student/learning-outcomes', label: 'Learning Outcomes' },
  { to: '/student/program-outcomes', label: 'Program Outcomes' },
  { to: '/student/profile', label: 'Profile' }
];

const StudentLayout = () => {
  const [theme, setTheme] = useState('light');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get studentId from URL parameter, localStorage, or default to 'current'
  const urlStudentId = searchParams.get('studentId');
  const storedStudentId = localStorage.getItem('studentId');
  const studentId = urlStudentId || storedStudentId || 'current';
  
  // Load student profile to display name in header
  const profileLoader = useCallback(() => {
    if (studentId && studentId !== 'current') {
      return studentService.getProfile(studentId).catch(() => {
        // Fallback to localStorage if API fails
        try {
          const storedInfo = localStorage.getItem('studentInfo');
          if (storedInfo) {
            const studentInfo = JSON.parse(storedInfo);
            if (studentInfo.student_id === studentId || studentInfo.id.toString() === studentId.toString()) {
              return {
                id: studentInfo.id,
                student_id: studentInfo.student_id,
                name: studentInfo.name || '',
                email: studentInfo.email || '',
                major: studentInfo.major || '',
                cohort: studentInfo.cohort || '',
                advisor: studentInfo.advisor || ''
              };
            }
          }
        } catch (e) {
          // Ignore localStorage errors
        }
        return null;
      });
    }
    return Promise.resolve(null);
  }, [studentId]);
  
  const { data: studentProfile, refetch: refetchProfile } = useAsyncResource(profileLoader);

  // Refresh profile when page becomes visible or gets focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && studentId && studentId !== 'current') {
        refetchProfile();
      }
    };

    const handleFocus = () => {
      if (studentId && studentId !== 'current') {
        refetchProfile();
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'studentInfo' && studentId && studentId !== 'current') {
        refetchProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [studentId, refetchProfile]);
  
  // If no studentId found, redirect to login
  useEffect(() => {
    if (!urlStudentId && !storedStudentId) {
      navigate('/student/login');
    }
  }, [urlStudentId, storedStudentId, navigate]);

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
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-brand-500">Student</p>
              <h1 className="text-2xl font-semibold">
                {studentProfile?.name ? `${studentProfile.name}'s Learning Analytics` : 'Learning Analytics Panel'}
              </h1>
              {(studentProfile?.student_id || studentProfile?.id) && (
                <p className="text-sm text-slate-500 mt-1">
                  Student ID: {studentProfile?.student_id || studentProfile?.id}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  localStorage.removeItem('studentId');
                  navigate('/student/login');
                }}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Logout
              </button>
              <button
                onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-xl bg-brand-600 hover:bg-brand-700"
              >
                {theme === 'light' ? 'Dark theme' : 'Light theme'}
              </button>
            </div>
          </div>
          <nav className="w-full border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap w-full max-w-6xl px-4 mx-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={`${item.to}?studentId=${studentId}`}
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
          <Outlet context={{ studentId, theme, setTheme }} />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;

