import { useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import POPerformanceChart from '../../components/student/POPerformanceChart';
import studentService from '../../services/studentService';
import useAsyncResource from '../../hooks/useAsyncResource';

const StudentProgramOutcomes = () => {
  const { studentId } = useOutletContext();
  const loader = useCallback(() => studentService.getProgramOutcomes(studentId), [studentId]);
  const { data, isLoading, error } = useAsyncResource(loader);

  const poData = data || [];
  const hasData = poData.length > 0 && !error && !isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Program Outcome Performance</h2>
        <p className="text-sm text-slate-500">
          Weighted PO scores derived from the learning outcomes linked to each program objective.
        </p>
      </div>
      {hasData ? (
        <>
          <POPerformanceChart data={poData} />
          <div className="grid gap-4 md:grid-cols-3">
            {poData.map((po) => (
              <div
                key={po.id}
                className="p-4 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800"
              >
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{po.id}</p>
                <p className="text-lg font-semibold">{po.title}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {(po.weighted_score === 85 || po.weighted_score === '85') ? 'Awaiting Data' : `${po.weighted_score}%`}
                </p>
                <p className="text-sm text-slate-500">
                  Overall grade: {(po.weighted_score === 85 || po.weighted_score === '85') ? 'N/A' : po.grade}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
              <div className="flex items-center justify-center h-72">
                <p className="text-sm text-slate-400 italic">Waiting to upload data...</p>
              </div>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
              <div className="flex items-center justify-center h-72">
                <p className="text-sm text-slate-400 italic">Waiting to upload data...</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800"
              >
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">PO{i}</p>
                <p className="text-lg font-semibold text-slate-400 italic">Awaiting Data</p>
                <p className="text-3xl font-bold text-slate-300">--</p>
                <p className="text-sm text-slate-400">Overall grade: --</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentProgramOutcomes;

