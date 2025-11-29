import { useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import POPerformanceChart from '../../components/student/POPerformanceChart';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import studentService from '../../services/studentService';
import useAsyncResource from '../../hooks/useAsyncResource';

const StudentProgramOutcomes = () => {
  const { studentId } = useOutletContext();
  const loader = useCallback(() => studentService.getProgramOutcomes(studentId), [studentId]);
  const { data, isLoading, error, refetch } = useAsyncResource(loader);

  if (isLoading) return <LoadingState label="Loading program outcomes..." />;
  if (error) return <ErrorState message="Program outcome data unavailable." onRetry={refetch} />;

  const poData = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Program Outcome Performance</h2>
        <p className="text-sm text-slate-500">
          Weighted PO scores derived from the learning outcomes linked to each program objective.
        </p>
      </div>
      <POPerformanceChart data={poData} />
      <div className="grid gap-4 md:grid-cols-3">
        {poData.map((po) => (
          <div
            key={po.id}
            className="p-4 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800"
          >
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{po.id}</p>
            <p className="text-lg font-semibold">{po.title}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{po.weighted_score}%</p>
            <p className="text-sm text-slate-500">Overall grade: {po.grade}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentProgramOutcomes;

