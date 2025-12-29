import { useState, useCallback, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import useAsyncResource from '../../hooks/useAsyncResource';
import adminService from '../../services/adminService';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import FormField from '../../components/admin/FormField';

const Courses = () => {
  const { adminId } = useOutletContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [assigningCourse, setAssigningCourse] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', description: '' });
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [professors, setProfessors] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loader = useCallback(() => adminService.getCourses(), []);
  const { data, isLoading, error: fetchError, refetch } = useAsyncResource(loader);

  const profLoader = useCallback(() => adminService.getProfessors(), []);
  const { data: profData, refetch: refetchProfessors } = useAsyncResource(profLoader);

  useEffect(() => {
    if (profData) {
      setProfessors(profData);
    }
  }, [profData]);

  useEffect(() => {
    if (editingCourse) {
      setFormData({
        code: editingCourse.code || '',
        name: editingCourse.name || '',
        description: editingCourse.description || ''
      });
    } else {
      setFormData({ code: '', name: '', description: '' });
    }
  }, [editingCourse]);

  const handleOpenModal = (course = null) => {
    setEditingCourse(course);
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
    setFormData({ code: '', name: '', description: '' });
    setError(null);
    setSuccess(null);
  };

  const handleOpenAssignModal = (course) => {
    setAssigningCourse(course);
    setSelectedProfessor(course.professor_id || '');
    setError(null);
    setSuccess(null);
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setAssigningCourse(null);
    setSelectedProfessor('');
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingCourse) {
        await adminService.updateCourse(editingCourse.id, formData);
        setSuccess('Course updated successfully!');
      } else {
        await adminService.createCourse(formData);
        setSuccess('Course created successfully!');
      }
      setTimeout(() => {
        handleCloseModal();
        refetch();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to save Course');
    }
  };

  const handleAssignProfessor = async () => {
    setError(null);
    setSuccess(null);

    if (!selectedProfessor) {
      setError('Please select a professor');
      return;
    }

    try {
      await adminService.assignProfessorToCourse(assigningCourse.id, selectedProfessor);
      setSuccess('Professor assigned successfully!');
      setTimeout(() => {
        handleCloseAssignModal();
        refetch();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to assign professor');
    }
  };

  const handleDelete = async (course) => {
    if (!window.confirm(`Are you sure you want to delete "${course.code}"?`)) return;

    try {
      await adminService.deleteCourse(course.id);
      refetch();
    } catch (err) {
      alert(err.message || 'Failed to delete Course');
    }
  };

  if (isLoading) return <LoadingState label="Loading Courses..." />;
  if (fetchError) return <ErrorState message="Unable to load Courses." onRetry={refetch} />;

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    {
      key: 'professor',
      label: 'Professor',
      render: (value, row) => row.professor_name || row.professor || 'Unassigned'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Courses</h2>
          <p className="text-sm text-slate-500">Manage courses and assign professors</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-xl bg-brand-600 hover:bg-brand-700"
        >
          + Create Course
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        emptyMessage="No Courses found. Create your first course."
        customActions={(row) => (
          <button
            onClick={() => handleOpenAssignModal(row)}
            className="px-3 py-1.5 text-sm font-medium text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
          >
            Assign Prof
          </button>
        )}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCourse ? 'Edit Course' : 'Create Course'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Course Code"
            name="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g., CS101, MATH201"
            required
          />
          <FormField
            label="Course Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter course name"
            required
          />
          <FormField
            label="Description"
            name="description"
            type="textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter course description"
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
              {editingCourse ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isAssignModalOpen}
        onClose={handleCloseAssignModal}
        title={`Assign Professor to ${assigningCourse?.code}`}
      >
        <div className="space-y-4">
          <FormField
            label="Professor"
            name="professor"
            type="select"
            value={selectedProfessor}
            onChange={(e) => setSelectedProfessor(e.target.value)}
            options={professors.map((prof) => ({
              value: prof.id,
              label: `${prof.name} (${prof.email})`
            }))}
            required
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
              onClick={handleCloseAssignModal}
              className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssignProfessor}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-brand-600 hover:bg-brand-700"
            >
              Assign
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Courses;

