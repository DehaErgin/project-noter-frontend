import { useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import useAsyncResource from '../../hooks/useAsyncResource';
import adminService from '../../services/adminService';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

const Approvals = () => {
  const { adminId } = useOutletContext();
  const [processingId, setProcessingId] = useState(null);

  const loader = useCallback(() => adminService.getPendingApprovals(), []);
  const { data, isLoading, error, refetch } = useAsyncResource(loader);

  const handleApprove = async (approvalId) => {
    setProcessingId(approvalId);
    try {
      await adminService.approveRequest(approvalId);
      refetch();
    } catch (err) {
      alert(err.message || 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (approvalId) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;

    setProcessingId(approvalId);
    try {
      await adminService.rejectRequest(approvalId);
      refetch();
    } catch (err) {
      alert(err.message || 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) return <LoadingState label="Loading pending approvals..." />;
  if (error) return <ErrorState message="Unable to load approvals." onRetry={refetch} />;

  const approvals = data || [];

  const getTypeLabel = (type) => {
    const labels = {
      lo_po_mapping: 'LO ↔ PO Mapping',
      grade_condition: 'Grade Condition Change',
      course_modification: 'Course Modification',
      assessment_creation: 'Assessment Creation',
      lo_creation: 'Learning Outcome Creation'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      lo_po_mapping: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
      grade_condition: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
      course_modification: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300',
      assessment_creation: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
      lo_creation: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
    };
    return colors[type] || 'bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Pending Approvals</h2>
          <p className="text-sm text-slate-500">Review and approve or reject pending requests</p>
        </div>
        <button
          onClick={refetch}
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Refresh
        </button>
      </div>

      {approvals.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <p className="text-lg font-medium text-slate-900 dark:text-white">No pending approvals</p>
          <p className="mt-2 text-sm text-slate-500">All requests have been processed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getTypeColor(approval.type)}`}>
                      {getTypeLabel(approval.type)}
                    </span>
                    <span className="px-3 py-1 text-xs font-semibold text-amber-700 bg-amber-100 rounded-full dark:bg-amber-500/20 dark:text-amber-300">
                      Pending
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{approval.title || approval.description}</h3>
                  {approval.description && approval.description !== approval.title && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{approval.description}</p>
                  )}
                  <div className="mt-4 space-y-1 text-sm text-slate-500">
                    <p>
                      <span className="font-medium">Requested by:</span> {approval.requested_by_name || approval.requested_by}
                    </p>
                    <p>
                      <span className="font-medium">Date:</span>{' '}
                      {approval.created_at ? new Date(approval.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                    {approval.details && (
                      <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Details</p>
                        <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {typeof approval.details === 'object' ? JSON.stringify(approval.details, null, 2) : approval.details}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleApprove(approval.id)}
                    disabled={processingId === approval.id}
                    className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === approval.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(approval.id)}
                    disabled={processingId === approval.id}
                    className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === approval.id ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Approvals;

