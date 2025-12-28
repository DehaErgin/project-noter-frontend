import { useState, useCallback, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import useAsyncResource from '../../hooks/useAsyncResource';
import adminService from '../../services/adminService';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import FormField from '../../components/admin/FormField';

const LearningOutcomes = () => {
  const { adminId } = useOutletContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [editingLO, setEditingLO] = useState(null);
  const [connectingLO, setConnectingLO] = useState(null);
  const [formData, setFormData] = useState({ code: '', description: '' });
  const [poConnections, setPOConnections] = useState([]);
  const [programOutcomes, setProgramOutcomes] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loader = useCallback(() => adminService.getLearningOutcomes(), []);
  const { data, isLoading, error: fetchError, refetch } = useAsyncResource(loader);

  const poLoader = useCallback(() => adminService.getProgramOutcomes(), []);
  const { data: poData, refetch: refetchPOs } = useAsyncResource(poLoader);

  useEffect(() => {
    if (poData) {
      setProgramOutcomes(poData);
    }
  }, [poData]);

  useEffect(() => {
    if (editingLO) {
      setFormData({
        code: editingLO.code || '',
        description: editingLO.description || ''
      });
    } else {
      setFormData({ code: '', description: '' });
    }
  }, [editingLO]);

  useEffect(() => {
    if (connectingLO && programOutcomes.length > 0) {
      loadConnections();
    }
  }, [connectingLO, programOutcomes]);

  const loadConnections = async () => {
    try {
      const connections = await adminService.getLOPOConnections(connectingLO.id);
      const connectionsMap = {};
      connections.forEach((conn) => {
        connectionsMap[conn.po_id] = conn.weight;
      });

      const initialConnections = programOutcomes.map((po) => ({
        po_id: po.id,
        po_code: po.code,
        weight: connectionsMap[po.id] || 0
      }));
      setPOConnections(initialConnections);
    } catch (err) {
      setPOConnections(
        programOutcomes.map((po) => ({
          po_id: po.id,
          po_code: po.code,
          weight: 0
        }))
      );
    }
  };

  const handleOpenModal = (lo = null) => {
    setEditingLO(lo);
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLO(null);
    setFormData({ code: '', description: '' });
    setError(null);
    setSuccess(null);
  };

  const handleOpenConnectionModal = (lo) => {
    setConnectingLO(lo);
    setError(null);
    setSuccess(null);
    setIsConnectionModalOpen(true);
  };

  const handleCloseConnectionModal = () => {
    setIsConnectionModalOpen(false);
    setConnectingLO(null);
    setPOConnections([]);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingLO) {
        await adminService.updateLearningOutcome(editingLO.id, formData);
        setSuccess('Learning Outcome updated successfully!');
      } else {
        await adminService.createLearningOutcome(formData);
        setSuccess('Learning Outcome created successfully!');
      }
      setTimeout(() => {
        handleCloseModal();
        refetch();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to save Learning Outcome');
    }
  };

  const handleSaveConnections = async () => {
    setError(null);
    setSuccess(null);

    const connections = poConnections
      .filter((conn) => conn.weight > 0)
      .map((conn) => ({
        po_id: conn.po_id,
        weight: parseInt(conn.weight)
      }));

    try {
      await adminService.updateLOPOConnections(connectingLO.id, connections);
      setSuccess('Connections saved successfully!');
      setTimeout(() => {
        handleCloseConnectionModal();
        refetch();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to save connections');
    }
  };

  const handleDelete = async (lo) => {
    if (!window.confirm(`Are you sure you want to delete "${lo.code}"?`)) return;

    try {
      await adminService.deleteLearningOutcome(lo.id);
      refetch();
    } catch (err) {
      alert(err.message || 'Failed to delete Learning Outcome');
    }
  };

  const updateConnectionWeight = (poId, weight) => {
    setPOConnections(
      poConnections.map((conn) => (conn.po_id === poId ? { ...conn, weight: parseInt(weight) || 0 } : conn))
    );
  };

  if (isLoading) return <LoadingState label="Loading Learning Outcomes..." />;
  if (fetchError) return <ErrorState message="Unable to load Learning Outcomes." onRetry={refetch} />;

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'description', label: 'Description' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Learning Outcomes</h2>
          <p className="text-sm text-slate-500">Manage all Learning Outcomes (LOs) and their PO connections</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-xl bg-brand-600 hover:bg-brand-700"
        >
          + Create LO
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        emptyMessage="No Learning Outcomes found. Create your first LO."
        customActions={(row) => (
          <button
            onClick={() => handleOpenConnectionModal(row)}
            className="px-3 py-1.5 text-sm font-medium text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
          >
            Connect PO
          </button>
        )}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingLO ? 'Edit Learning Outcome' : 'Create Learning Outcome'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Code"
            name="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g., LO1, LO2"
            required
          />
          <FormField
            label="Description"
            name="description"
            type="textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter the Learning Outcome description"
            required
            rows={4}
          />

          {error && (
            <div className="p-3 text-sm text-rose-600 bg-rose-50 rounded-lg dark:bg-rose-500/10 dark:text-rose-400">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-emerald-600 bg-emerald-50 rounded-lg dark:bg-emerald-500/10 dark:text-emerald-400">
              {success}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-brand-600 hover:bg-brand-700"
            >
              {editingLO ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isConnectionModalOpen}
        onClose={handleCloseConnectionModal}
        title={`Connect LO to POs: ${connectingLO?.code}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Set the weight (1-5) for each Program Outcome connection. Leave 0 to remove connection.
          </p>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {poConnections.map((conn) => (
              <div key={conn.po_id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{conn.po_code}</p>
                </div>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={conn.weight}
                  onChange={(e) => updateConnectionWeight(conn.po_id, e.target.value)}
                  className="w-20 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
                  placeholder="0-5"
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 text-sm text-rose-600 bg-rose-50 rounded-lg dark:bg-rose-500/10 dark:text-rose-400">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-emerald-600 bg-emerald-50 rounded-lg dark:bg-emerald-500/10 dark:text-emerald-400">
              {success}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseConnectionModal}
              className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveConnections}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-brand-600 hover:bg-brand-700"
            >
              Save Connections
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LearningOutcomes;

