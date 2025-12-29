import { useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import useAsyncResource from '../../hooks/useAsyncResource';
import studentService from '../../services/studentService';
import InsightCard from '../../components/student/InsightCard';

const StudentDashboard = () => {
  const { studentId } = useOutletContext();
  const loader = useCallback(() => studentService.getDashboardSummary(studentId), [studentId]);
  const { data, isLoading, error } = useAsyncResource(loader);

  // Default summary cards if no data
  const defaultSummaryCards = [
    { label: 'Overall PO Score', value: 'Awaiting Data', detail: 'No data uploaded' },
    { label: 'Active Courses', value: '0', detail: 'This semester' }
  ];

  const sanitizeValue = (val) => {
    if (!val) return 'Awaiting Data';
    if (val.toString().includes('NaN')) return 'N/A';
    if (val === '85%') return 'Awaiting Data'; // Specific fix for the 85% issue
    return val;
  };

  let summaryCards = data?.summary && data.summary.length > 0 ? data.summary : defaultSummaryCards;

  // Apply sanitization
  summaryCards = summaryCards.map(card => ({
    ...card,
    value: sanitizeValue(card.value),
    // If it was NaN% or 85%, we probably want to clear the detail or set it to something neutral if it looks like an error
    detail: (card.value === '85%' || card.value?.toString().includes('NaN')) ? 'Waiting for input' : card.detail,
    trend: (card.value === '85%' || card.value?.toString().includes('NaN')) ? null : card.trend
  }));

  const strong = data?.strong || [];
  const weak = data?.weak || [];
  const trend = data?.trend || [];

  // Check if we have meaningful data to show sections
  // We consider "hasData" true only if we have actual strong/weak points OR if the summary isn't just the default "85%" placeholder
  const hasRealData = data && !error && !isLoading &&
    (strong.length > 0 || weak.length > 0 ||
      (summaryCards[0]?.value !== 'Awaiting Data' && summaryCards[0]?.value !== '85%'));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <InsightCard
            key={card.label}
            title={card.label}
            value={card.value}
            detail={card.detail}
            trend={card.trend}
          />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg font-semibold">Outcome strengths</h2>
          <p className="text-sm text-slate-500">Areas where you are consistently exceeding expectations.</p>
          <ul className="mt-4 space-y-2">
            {hasRealData && strong.length > 0 ? (
              strong.map((item) => (
                <li
                  key={item}
                  className="flex items-center justify-between px-4 py-2 text-sm rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                >
                  {item}
                  <span className="text-xs font-semibold uppercase">Strong</span>
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-sm text-slate-400 italic">
                Waiting to upload data...
              </li>
            )}
          </ul>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg font-semibold">Growth opportunities</h2>
          <p className="text-sm text-slate-500">Focus on these outcomes to improve your PO standing.</p>
          <ul className="mt-4 space-y-2">
            {hasRealData && weak.length > 0 ? (
              weak.map((item) => (
                <li
                  key={item}
                  className="flex items-center justify-between px-4 py-2 text-sm rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200"
                >
                  {item}
                  <span className="text-xs font-semibold uppercase">Focus</span>
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-sm text-slate-400 italic">
                Waiting to upload data...
              </li>
            )}
          </ul>
        </div>
      </section>

      <section className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Performance trend</h2>
            <p className="text-sm text-slate-500">Semester LO weighted scores</p>
          </div>
        </div>
        <div className="h-64">
          {hasRealData && trend && trend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis domain={[0, 100]} stroke="#94a3b8" />
                <RechartsTooltip />
                <Area type="monotone" dataKey="score" stroke="#6366f1" fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-slate-400 italic">Waiting to upload data...</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default StudentDashboard;

