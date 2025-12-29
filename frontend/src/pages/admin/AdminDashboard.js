import { useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Link } from 'react-router-dom';
import useAsyncResource from '../../hooks/useAsyncResource';
import adminService from '../../services/adminService';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

const StatCard = ({ title, value, icon, link, color = 'brand' }) => {
  const colorClasses = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
  };

  const content = (
    <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
};

const AdminDashboard = () => {
  const { adminId } = useOutletContext();
  const loader = useCallback(() => adminService.getDashboardSummary(), []);
  const { data, isLoading, error, refetch } = useAsyncResource(loader);

  if (isLoading) return <LoadingState label="Loading dashboard..." />;
  if (error) return <ErrorState message="Unable to load dashboard data." onRetry={refetch} />;

  const stats = data?.stats || {};
  const pendingApprovals = data?.pending_approvals || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
        <p className="text-sm text-slate-500">System statistics and pending approvals</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Students"
          value={stats.students || 0}
          icon="👥"
          link="/admin/users?tab=students"
          color="brand"
        />
        <StatCard
          title="Professors"
          value={stats.professors || 0}
          icon="👨‍🏫"
          link="/admin/users?tab=professors"
          color="emerald"
        />
        <StatCard
          title="Courses"
          value={stats.courses || 0}
          icon="📚"
          link="/admin/courses"
          color="amber"
        />
        <StatCard
          title="Program Outcomes"
          value={stats.program_outcomes || 0}
          icon="🎯"
          link="/admin/program-outcomes"
          color="brand"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Learning Outcomes"
          value={stats.learning_outcomes || 0}
          icon="📊"
          link="/admin/learning-outcomes"
          color="emerald"
        />
        <StatCard
          title="Pending Approvals"
          value={pendingApprovals.length}
          icon="⏳"
          link="/admin/approvals"
          color={pendingApprovals.length > 0 ? 'rose' : 'amber'}
        />
      </div>

      {pendingApprovals.length > 0 && (
        <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Pending Approvals</h3>
            <Link
              to="/admin/approvals"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-2">
            {pendingApprovals.slice(0, 5).map((approval) => (
              <div
                key={approval.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {approval.type} - {approval.description}
                  </p>
                  <p className="text-xs text-slate-500">Requested by {approval.requested_by}</p>
                </div>
                <span className="px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-100 rounded dark:bg-amber-500/20 dark:text-amber-300">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

