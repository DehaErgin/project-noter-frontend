import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

const POPerformanceChart = ({ data = [] }) => (
  <div className="grid gap-6 md:grid-cols-2">
    <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
      <h3 className="mb-4 text-sm font-semibold uppercase text-slate-500">Radar Overview</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="title" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar
              name="Weighted Score"
              dataKey="weighted_score"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.45}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
      <h3 className="mb-4 text-sm font-semibold uppercase text-slate-500">Bar Comparison</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="id" tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="weighted_score" fill="#818cf8" name="Weighted Score" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

export default POPerformanceChart;

