const OutcomeCard = ({ outcome }) => (
  <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-xs font-semibold uppercase text-brand-500">{outcome.id}</p>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{outcome.title}</h3>
        <p className="text-sm text-slate-500">{outcome.description}</p>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-3xl font-semibold text-slate-900 dark:text-white">
          {outcome.performance}%
        </span>
        <p className="text-xs text-slate-500">Performance</p>
      </div>
    </div>
    <div className="mb-4">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Program Outcomes</p>
      <div className="flex flex-wrap gap-2 mt-2">
        {(outcome.program_outcomes || []).map((po) => (
          <span
            key={`${outcome.id}-${po.id}`}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {po.id}
            <span className="text-[10px] text-slate-400">W{po.weight}</span>
          </span>
        ))}
      </div>
    </div>
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Instructor note</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">{outcome.improvement_suggestion}</p>
    </div>
  </div>
);

export default OutcomeCard;

