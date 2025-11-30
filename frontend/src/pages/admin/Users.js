import { useState, useCallback, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import useAsyncResource from '../../hooks/useAsyncResource';
import adminService from '../../services/adminService';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import FormField from '../../components/admin/FormField';
import clsx from 'clsx';

const Users = () => {
  const { adminId } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'students';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [assigningUser, setAssigningUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    student_id: '',
    major: '',
    cohort: '',
    advisor: ''
  });
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isStudentTab = activeTab === 'students';

  const studentsLoader = useCallback(() => adminService.getStudents(), []);
  const { data: studentsData, isLoading: studentsLoading, error: studentsError, refetch: refetchStudents } = useAsyncResource(
    studentsLoader
  );

  const professorsLoader = useCallback(() => adminService.getProfessors(), []);
  const { data: professorsData, isLoading: professorsLoading, error: professorsError, refetch: refetchProfessors } = useAsyncResource(
    professorsLoader
  );

  const coursesLoader = useCallback(() => adminService.getCourses(), []);
  const { data: coursesData } = useAsyncResource(coursesLoader);

  useEffect(() => {
    if (coursesData) {
      setCourses(coursesData);
    }
  }, [coursesData]);

  useEffect(() => {
    if (editingUser) {
      if (isStudentTab) {
        setFormData({
          name: editingUser.name || '',
          email: editingUser.email || '',
          student_id: editingUser.student_id || editingUser.id || '',
          major: editingUser.major || '',
          cohort: editingUser.cohort || '',
          advisor: editingUser.advisor || ''
        });
      } else {
        setFormData({
          name: editingUser.name || '',
          email: editingUser.email || ''
        });
      }
    } else {
      setFormData({
        name: '',
        email: '',
        student_id: '',
        major: '',
        cohort: '',
        advisor: ''
      });
    }
  }, [editingUser, isStudentTab]);

  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      student_id: '',
      major: '',
      cohort: '',
      advisor: ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleOpenAssignModal = (user) => {
    setAssigningUser(user);
    setSelectedCourse('');
    setError(null);
    setSuccess(null);
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setAssigningUser(null);
    setSelectedCourse('');
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (isStudentTab) {
        if (editingUser) {
          await adminService.updateStudent(editingUser.id, formData);
          setSuccess('Student updated successfully!');
        } else {
          await adminService.createStudent(formData);
          setSuccess('Student created successfully!');
        }
        setTimeout(() => {
          handleCloseModal();
          refetchStudents();
        }, 1000);
      } else {
        if (editingUser) {
          await adminService.updateProfessor(editingUser.id, formData);
          setSuccess('Professor updated successfully!');
        } else {
          await adminService.createProfessor(formData);
          setSuccess('Professor created successfully!');
        }
        setTimeout(() => {
          handleCloseModal();
          refetchProfessors();
        }, 1000);
      }
    } catch (err) {
      setError(err.message || `Failed to save ${isStudentTab ? 'Student' : 'Professor'}`);
    }
  };

  const handleAssignCourse = async () => {
    setError(null);
    setSuccess(null);

    if (!selectedCourse) {
      setError('Please select a course');
      return;
    }

    try {
      await adminService.assignStudentToCourse(assigningUser.id, selectedCourse);
      setSuccess('Student assigned to course successfully!');
      setTimeout(() => {
        handleCloseAssignModal();
        refetchStudents();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to assign student to course');
    }
  };

  const handleDelete = async (user) => {
    const userType = isStudentTab ? 'Student' : 'Professor';
    if (!window.confirm(`Are you sure you want to delete this ${userType.toLowerCase()}?`)) return;

    try {
      if (isStudentTab) {
        await adminService.deleteStudent(user.id);
        refetchStudents();
      } else {
        await adminService.deleteProfessor(user.id);
        refetchProfessors();
      }
    } catch (err) {
      alert(err.message || `Failed to delete ${userType}`);
    }
  };

  // Only show loading/error for the active tab
  const isLoading = isStudentTab ? studentsLoading : professorsLoading;
  const fetchError = isStudentTab ? studentsError : professorsError;
  const data = isStudentTab ? studentsData : professorsData;
  const refetch = isStudentTab ? refetchStudents : refetchProfessors;

  if (isLoading) return <LoadingState label={`Loading ${isStudentTab ? 'Students' : 'Professors'}...`} />;
  if (fetchError) return <ErrorState message={`Unable to load ${isStudentTab ? 'Students' : 'Professors'}.`} onRetry={refetch} />;

  const studentColumns = [
    { key: 'student_id', label: 'Student ID', render: (value, row) => value || row.id },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'major', label: 'Major' },
    { key: 'cohort', label: 'Cohort' }
  ];

  const professorColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
  ];

  const columns = isStudentTab ? studentColumns : professorColumns;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">User Management</h2>
          <p className="text-sm text-slate-500">Manage students and professors</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-xl bg-brand-600 hover:bg-brand-700"
        >
          + Create {isStudentTab ? 'Student' : 'Professor'}
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setSearchParams({ tab: 'students' })}
          className={clsx(
            'px-4 py-2 text-sm font-semibold transition border-b-2 -mb-px',
            isStudentTab
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          Students
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'professors' })}
          className={clsx(
            'px-4 py-2 text-sm font-semibold transition border-b-2 -mb-px',
            !isStudentTab
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          Professors
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        emptyMessage={`No ${isStudentTab ? 'Students' : 'Professors'} found. Create your first ${isStudentTab ? 'student' : 'professor'}.`}
        customActions={
          isStudentTab
            ? (row) => (
                <button
                  onClick={() => handleOpenAssignModal(row)}
                  className="px-3 py-1.5 text-sm font-medium text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                >
                  Assign Course
                </button>
              )
            : null
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingUser ? `Edit ${isStudentTab ? 'Student' : 'Professor'}` : `Create ${isStudentTab ? 'Student' : 'Professor'}`}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {isStudentTab && (
            <FormField
              label="Student ID"
              name="student_id"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              placeholder="Enter student ID"
              required
            />
          )}
          <FormField
            label="Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter full name"
            required
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email address"
            required
          />
          {isStudentTab && (
            <>
              <FormField
                label="Major"
                name="major"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                placeholder="Enter major"
              />
              <FormField
                label="Cohort"
                name="cohort"
                value={formData.cohort}
                onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                placeholder="Enter cohort"
              />
              <FormField
                label="Advisor"
                name="advisor"
                value={formData.advisor}
                onChange={(e) => setFormData({ ...formData, advisor: e.target.value })}
                placeholder="Enter advisor name"
              />
            </>
          )}

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
              {editingUser ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {isStudentTab && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={handleCloseAssignModal}
          title={`Assign Course to ${assigningUser?.name}`}
        >
          <div className="space-y-4">
            <FormField
              label="Course"
              name="course"
              type="select"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              options={courses.map((course) => ({
                value: course.id,
                label: `${course.code} - ${course.name}`
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
                onClick={handleAssignCourse}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-brand-600 hover:bg-brand-700"
              >
                Assign
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Users;

