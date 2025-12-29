import { useState, useCallback, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import useAsyncResource from '../../hooks/useAsyncResource';
import adminService from '../../services/adminService';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import FormField from '../../components/admin/FormField';

const ProgramOutcomes = () => {
  const { adminId } = useOutletContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const [formData, setFormData] = useState({ code: '', description: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loader = useCallback(() => adminService.getProgramOutcomes(), []);
  const { data, isLoading, error: fetchError, refetch } = useAsyncResource(loader);

  useEffect(() => {
    if (editingPO) {
      setFormData({
        code: editingPO.code || '',
        description: editingPO.description || ''
      });
    } else {
      setFormData({ code: '', description: '' });
    }
  }, [editingPO]);

  const handleOpenModal = (po = null) => {
    setEditingPO(po);
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPO(null);
    setFormData({ code: '', description: '' });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingPO) {
        await adminService.updateProgramOutcome(editingPO.id, formData);
        setSuccess('Program Outcome updated successfully!');
      } else {
        await adminService.createProgramOutcome(formData);
        setSuccess('Program Outcome created successfully!');
      }
      setTimeout(() => {
        handleCloseModal();
        refetch();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to save Program Outcome');
    }
  };

  const handleDelete = async (po) => {
    if (!window.confirm(`Are you sure you want to delete "${po.code}"?`)) return;

    try {
      await adminService.deleteProgramOutcome(po.id);
      refetch();
    } catch (err) {
      alert(err.message || 'Failed to delete Program Outcome');
    }
  };

  if (isLoading) return <LoadingState label="Loading Program Outcomes..." />;
  if (fetchError) return <ErrorState message="Unable to load Program Outcomes." onRetry={refetch} />;

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'description', label: 'Description' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Program Outcomes</h2>
          <p className="text-sm text-slate-500">Manage all Program Outcomes (POs)</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-xl bg-brand-600 hover:bg-brand-700"
        >
          + Create PO
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        emptyMessage="No Program Outcomes found. Create your first PO."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPO ? 'Edit Program Outcome' : 'Create Program Outcome'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Code"
            name="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g., PO1, PO2"
            required
            error={error && error.includes('code') ? error : null}
          />
          <FormField
            label="Description"
            name="description"
            type="textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter the Program Outcome description"
            required
            rows={4}
            error={error && error.includes('description') ? error : null}
          />

          {error && !error.includes('code') && !error.includes('description') && (
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
              {editingPO ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProgramOutcomes;

