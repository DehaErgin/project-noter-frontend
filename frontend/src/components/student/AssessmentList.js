import clsx from 'clsx';

const AssessmentList = ({ assessments = [] }) => {
  if (!assessments.length) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
        <p className="text-sm text-slate-400 italic">Waiting to upload data...</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="text-xs uppercase border-b bg-slate-50 dark:bg-slate-800/70 border-slate-100 dark:border-slate-700 text-slate-500">
            <tr>
              <th className="px-6 py-3 font-semibold">Assessment</th>
              <th className="px-6 py-3 font-semibold">Type</th>
              <th className="px-6 py-3 font-semibold">Grade</th>
              <th className="px-6 py-3 font-semibold">Weight</th>
              <th className="px-6 py-3 font-semibold">Learning Outcomes</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800">
            {assessments.map((assessment) => (
              <tr key={assessment.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900 dark:text-white">{assessment.title}</p>
                  <p className="text-xs text-slate-500">{assessment.description}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {assessment.type}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                  {assessment.grade ?? assessment.score ?? 'N/A'}%
                </td>
                <td className="px-6 py-4 text-slate-500">{Math.round(assessment.weight * 100)}%</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {(assessment.learning_outcomes || []).map((lo) => (
                      <span
                        key={lo.id}
                        className={clsx(
                          'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
                          'bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-100'
                        )}
                      >
                        {lo.id} · {lo.contribution}%
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssessmentList;

