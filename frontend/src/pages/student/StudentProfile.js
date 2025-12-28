import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import studentService from '../../services/studentService';
import useAsyncResource from '../../hooks/useAsyncResource';

const infoFields = [
  { key: 'student_id', label: 'Student ID', fallback: 'id' },
  { key: 'email', label: 'Email' },
  { key: 'advisor', label: 'Advisor' },
  { key: 'cohort', label: 'Cohort' },
  { key: 'major', label: 'Major' },
  { key: 'gpa', label: 'GPA' }
];

const StudentProfile = () => {
  const { studentId, theme, setTheme } = useOutletContext();
  const [fallbackData, setFallbackData] = useState(null);
  
  const loader = useCallback(() => studentService.getProfile(studentId), [studentId]);
  const { data, isLoading, error, refetch } = useAsyncResource(loader);

  // Load from localStorage on mount and when page becomes visible
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const storedInfo = localStorage.getItem('studentInfo');
        if (storedInfo) {
          const studentInfo = JSON.parse(storedInfo);
          if (studentInfo.student_id === studentId || studentInfo.id.toString() === studentId.toString()) {
            setFallbackData({
              id: studentInfo.id,
              student_id: studentInfo.student_id,
              name: studentInfo.name || '',
              email: studentInfo.email || '',
              major: studentInfo.major || '',
              cohort: studentInfo.cohort || '',
              advisor: studentInfo.advisor || '',
              gpa: studentInfo.gpa || 'N/A'
            });
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    };

    loadFromStorage();

    // Refresh when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetch();
        loadFromStorage();
      }
    };

    // Refresh when window gets focus
    const handleFocus = () => {
      refetch();
      loadFromStorage();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [studentId, refetch]);

  // Update fallback data when localStorage changes (from other tabs/windows)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'studentInfo') {
        try {
          const studentInfo = JSON.parse(e.newValue);
          if (studentInfo && (studentInfo.student_id === studentId || studentInfo.id.toString() === studentId.toString())) {
            setFallbackData({
              id: studentInfo.id,
              student_id: studentInfo.student_id,
              name: studentInfo.name || '',
              email: studentInfo.email || '',
              major: studentInfo.major || '',
              cohort: studentInfo.cohort || '',
              advisor: studentInfo.advisor || '',
              gpa: studentInfo.gpa || 'N/A'
            });
            // Also refetch from API
            refetch();
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [studentId, refetch]);

  // Use fallback data if API fails
  const profileData = data || fallbackData;

  if (isLoading && !fallbackData) return <LoadingState label="Loading profile..." />;
  if (error && !fallbackData && !profileData) return <ErrorState message="Unable to load profile." onRetry={refetch} />;
  
  if (!profileData) return <ErrorState message="Unable to load profile." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Student Profile</h2>
          <p className="text-sm text-slate-500">Basic information linked to your academic record.</p>
        </div>
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-xl bg-brand-600 hover:bg-brand-700"
        >
          Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Name</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{profileData.name || 'N/A'}</p>
          <p className="text-sm text-slate-500">{profileData.major || 'N/A'}</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Advisor</p>
          <p className="mt-2 text-lg font-semibold">{profileData.advisor || 'N/A'}</p>
          <p className="text-sm text-slate-500">Primary academic advisor</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Current GPA</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{profileData.gpa || 'N/A'}</p>
          <p className="text-sm text-slate-500">Updated with each term</p>
        </div>
      </div>

      <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
        <dl className="grid gap-4 md:grid-cols-2">
          {infoFields.map((field) => {
            const value = profileData[field.key] || (field.fallback ? profileData[field.fallback] : null);
            return (
              <div key={field.key} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {field.label}
                </dt>
                <dd className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                  {value || 'N/A'}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
};

export default StudentProfile;

