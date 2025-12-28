const InsightCard = ({ title, value, detail, trend }) => (
  <div className="p-6 transition bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</p>
    <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
    {detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
    {trend && (
      <p className={`mt-2 text-xs font-semibold ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
      </p>
    )}
  </div>
);

export default InsightCard;

