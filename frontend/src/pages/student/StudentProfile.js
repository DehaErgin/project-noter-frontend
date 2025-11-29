import { useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import studentService from '../../services/studentService';
import useAsyncResource from '../../hooks/useAsyncResource';

const infoFields = [
  { key: 'id', label: 'Student ID' },
  { key: 'email', label: 'Email' },
  { key: 'advisor', label: 'Advisor' },
  { key: 'cohort', label: 'Cohort' },
  { key: 'major', label: 'Major' },
  { key: 'gpa', label: 'GPA' }
];

const StudentProfile = () => {
  const { studentId, theme, setTheme } = useOutletContext();
  const loader = useCallback(() => studentService.getProfile(studentId), [studentId]);
  const { data, isLoading, error, refetch } = useAsyncResource(loader);

  if (isLoading) return <LoadingState label="Loading profile..." />;
  if (error) return <ErrorState message="Unable to load profile." onRetry={refetch} />;

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
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{data.name}</p>
          <p className="text-sm text-slate-500">{data.major}</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Advisor</p>
          <p className="mt-2 text-lg font-semibold">{data.advisor}</p>
          <p className="text-sm text-slate-500">Primary academic advisor</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Current GPA</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{data.gpa}</p>
          <p className="text-sm text-slate-500">Updated with each term</p>
        </div>
      </div>

      <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
        <dl className="grid gap-4 md:grid-cols-2">
          {infoFields.map((field) => (
            <div key={field.key} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {field.label}
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                {data[field.key]}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export default StudentProfile;

