import { useState, useCallback, useEffect } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'students';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageCoursesModalOpen, setIsManageCoursesModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [managingCoursesUser, setManagingCoursesUser] = useState(null);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
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
  const [studentOptions, setStudentOptions] = useState({
    majors: [],
    cohorts: [],
    advisors: []
  });
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

  // Load student options from localStorage and merge with existing student and professor data
  useEffect(() => {
    const storedOptions = adminService.getStudentOptions();
    
    // Extract unique values from students
    const majorsFromStudents = studentsData && studentsData.length > 0 
      ? [...new Set(studentsData.filter(s => s.major).map(s => s.major))].sort()
      : [];
    
    const cohortsFromStudents = studentsData && studentsData.length > 0
      ? [...new Set(studentsData.filter(s => s.cohort).map(s => s.cohort))].sort()
      : [];
    
    const advisorsFromStudents = studentsData && studentsData.length > 0
      ? [...new Set(studentsData.filter(s => s.advisor).map(s => s.advisor))].sort()
      : [];
    
    // Extract advisor names from professors (professors can be advisors)
    const advisorsFromProfessors = professorsData && professorsData.length > 0
      ? [...new Set(professorsData.filter(p => p.name).map(p => p.name))].sort()
      : [];
    
    // Merge stored options with values from students and professors (avoid duplicates)
    const mergedOptions = {
      majors: [...new Set([...storedOptions.majors, ...majorsFromStudents])].sort(),
      cohorts: [...new Set([...storedOptions.cohorts, ...cohortsFromStudents])].sort(),
      advisors: [...new Set([...storedOptions.advisors, ...advisorsFromStudents, ...advisorsFromProfessors])].sort()
    };
    
    setStudentOptions(mergedOptions);
  }, [studentsData, professorsData]);

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

  const handleOpenManageCoursesModal = async (user) => {
    setManagingCoursesUser(user);
    setError(null);
    setSuccess(null);
    setIsManageCoursesModalOpen(true);
    
    // Load student enrollments
    setEnrollmentsLoading(true);
    try {
      console.log('[DEBUG] Loading enrollments for user:', user);
      const enrollments = await adminService.getStudentEnrollments(user.id);
      console.log('[DEBUG] Loaded enrollments:', enrollments);
      setStudentEnrollments(enrollments || []);
    } catch (err) {
      console.error('[DEBUG] Error loading enrollments:', err);
      setError(err.message || 'Failed to load student enrollments');
      setStudentEnrollments([]);
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const handleCloseManageCoursesModal = () => {
    setIsManageCoursesModalOpen(false);
    setManagingCoursesUser(null);
    setStudentEnrollments([]);
    setSelectedCourse('');
    setError(null);
    setSuccess(null);
  };

  const handleRemoveCourse = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to remove this course from the student?')) return;

    setError(null);
    setSuccess(null);

    try {
      console.log('[DEBUG] Removing course:', {
        studentId: managingCoursesUser.id,
        enrollmentId: enrollmentId
      });
      
      const response = await adminService.removeStudentFromCourse(managingCoursesUser.id, enrollmentId);
      console.log('[DEBUG] Remove course response:', response);
      
      setError(null);
      setSuccess('Course removed successfully!');
      
      // Wait a bit for backend to process
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Refresh enrollments
      console.log('[DEBUG] Refreshing enrollments after course removal...');
      const enrollments = await adminService.getStudentEnrollments(managingCoursesUser.id);
      console.log('[DEBUG] Refreshed enrollments after removal:', enrollments);
      setStudentEnrollments(Array.isArray(enrollments) ? enrollments : []);
      
      // Update localStorage if this is the currently logged in student
      const storedStudentId = localStorage.getItem('studentId');
      const managingStudentId = managingCoursesUser?.student_id || managingCoursesUser?.id?.toString();
      
      if (storedStudentId && managingStudentId && 
          (storedStudentId === managingStudentId || storedStudentId === managingCoursesUser?.id?.toString())) {
        setTimeout(async () => {
          try {
            const students = await adminService.getStudents();
            const updatedStudentData = students.find(
              (s) => s.id === managingCoursesUser?.id || 
                     s.student_id === managingStudentId || 
                     s.id.toString() === managingStudentId ||
                     (managingCoursesUser?.id && s.id === managingCoursesUser.id)
            );
            if (updatedStudentData) {
              localStorage.setItem('studentInfo', JSON.stringify({
                id: updatedStudentData.id,
                student_id: updatedStudentData.student_id || updatedStudentData.id.toString(),
                name: updatedStudentData.name,
                email: updatedStudentData.email,
                major: updatedStudentData.major,
                cohort: updatedStudentData.cohort,
                advisor: updatedStudentData.advisor
              }));
              window.dispatchEvent(new StorageEvent('storage', {
                key: 'studentInfo',
                newValue: localStorage.getItem('studentInfo')
              }));
              window.dispatchEvent(new CustomEvent('studentInfoUpdated'));
            }
          } catch (e) {
            // Ignore errors
          }
        }, 500);
      }
      
      // Refresh students list
      refetchStudents();
    } catch (err) {
      console.error('[DEBUG] ❌ Error removing course:', err);
      setSuccess(null);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to remove course';
      setError(errorMessage);
      console.error('[DEBUG] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
    }
  };

  const handleAddCourseFromManageModal = async () => {
    if (!selectedCourse) {
      setError('Please select a course');
      setSuccess(null);
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      console.log('[DEBUG] Adding course:', {
        studentId: managingCoursesUser.id,
        courseId: selectedCourse
      });
      
      const response = await adminService.assignStudentToCourse(managingCoursesUser.id, selectedCourse);
      console.log('[DEBUG] Course assignment response:', response);
      
      // Backend returns: {message: "...", enrollment: {...}}
      // Verify that backend actually created the enrollment
      if (response && response.enrollment) {
        console.log('[DEBUG] ✅ Backend created enrollment:', response.enrollment);
      } else if (response && (response.id || response.course_id)) {
        console.log('[DEBUG] ✅ Backend returned enrollment data (alternative format):', response);
      } else {
        console.warn('[DEBUG] ⚠️ Backend response does not contain enrollment data');
        console.warn('[DEBUG] Response:', response);
        // Still try to refresh enrollments in case it was created
      }
      
      // Clear error if any
      setError(null);
      setSuccess('Course assigned successfully!');
      
      // Wait a bit for backend to process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh enrollments with retry logic
      console.log('[DEBUG] Refreshing enrollments after course assignment...');
      let enrollments = [];
      let retries = 3;
      
      while (retries > 0) {
        try {
          enrollments = await adminService.getStudentEnrollments(managingCoursesUser.id);
          console.log('[DEBUG] Refreshed enrollments (attempt):', enrollments);
          
          // If we got enrollments and they include the new course, break
          if (Array.isArray(enrollments) && enrollments.length > 0) {
            const hasNewCourse = enrollments.some(e => 
              e.course?.id?.toString() === selectedCourse.toString() || 
              e.course_id?.toString() === selectedCourse.toString()
            );
            if (hasNewCourse || enrollments.length > studentEnrollments.length) {
              break;
            }
          }
          
          // If still no enrollments, wait and retry
          if (enrollments.length === 0 && retries > 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (err) {
          console.error('[DEBUG] Error refreshing enrollments:', err);
        }
        retries--;
      }
      
      console.log('[DEBUG] Final enrollments:', enrollments);
      setStudentEnrollments(Array.isArray(enrollments) ? enrollments : []);
      
      // Clear selected course
      setSelectedCourse('');
      
      // Update localStorage if this is the currently logged in student
      const storedStudentId = localStorage.getItem('studentId');
      const managingStudentId = managingCoursesUser?.student_id || managingCoursesUser?.id?.toString();
      
      if (storedStudentId && managingStudentId && 
          (storedStudentId === managingStudentId || storedStudentId === managingCoursesUser?.id?.toString())) {
        setTimeout(async () => {
          try {
            const students = await adminService.getStudents();
            const updatedStudentData = students.find(
              (s) => s.id === managingCoursesUser?.id || 
                     s.student_id === managingStudentId || 
                     s.id.toString() === managingStudentId ||
                     (managingCoursesUser?.id && s.id === managingCoursesUser.id)
            );
            if (updatedStudentData) {
              localStorage.setItem('studentInfo', JSON.stringify({
                id: updatedStudentData.id,
                student_id: updatedStudentData.student_id || updatedStudentData.id.toString(),
                name: updatedStudentData.name,
                email: updatedStudentData.email,
                major: updatedStudentData.major,
                cohort: updatedStudentData.cohort,
                advisor: updatedStudentData.advisor
              }));
              window.dispatchEvent(new StorageEvent('storage', {
                key: 'studentInfo',
                newValue: localStorage.getItem('studentInfo')
              }));
              window.dispatchEvent(new CustomEvent('studentInfoUpdated'));
            }
          } catch (e) {
            // Ignore errors
          }
        }, 500);
      }
      
      // Refresh students list
      refetchStudents();
    } catch (err) {
      setError(err.message || 'Failed to assign course');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (isStudentTab) {
        // Prepare formData - ensure all fields are included and trimmed
        const cleanedFormData = {
          name: formData.name?.trim() || '',
          email: formData.email?.trim() || '',
          student_id: formData.student_id?.trim() || '',
          major: formData.major?.trim() || '',
          cohort: formData.cohort?.trim() || '',
          advisor: formData.advisor?.trim() || ''
        };

        if (editingUser) {
          await adminService.updateStudent(editingUser.id, cleanedFormData);
          setSuccess('Student updated successfully!');
        } else {
          await adminService.createStudent(cleanedFormData);
          setSuccess('Student created successfully!');
        }
        
        // Close modal first
        handleCloseModal();
        
        // Refetch students data immediately to update the table
        await refetchStudents();
        
        // Update localStorage if this is the currently logged in student
        const storedStudentId = localStorage.getItem('studentId');
        const editingStudentId = editingUser?.student_id || editingUser?.id?.toString();
        
        if (storedStudentId && editingStudentId && 
            (storedStudentId === editingStudentId || storedStudentId === editingUser?.id?.toString())) {
          // Get the updated student data from the refetched list
          setTimeout(async () => {
            try {
              const students = await adminService.getStudents();
              const updatedStudentData = students.find(
                (s) => s.id === editingUser?.id || 
                       s.student_id === editingStudentId || 
                       s.id.toString() === editingStudentId ||
                       (editingUser?.id && s.id === editingUser.id)
              );
              if (updatedStudentData) {
                localStorage.setItem('studentInfo', JSON.stringify({
                  id: updatedStudentData.id,
                  student_id: updatedStudentData.student_id || updatedStudentData.id.toString(),
                  name: updatedStudentData.name,
                  email: updatedStudentData.email,
                  major: updatedStudentData.major,
                  cohort: updatedStudentData.cohort,
                  advisor: updatedStudentData.advisor
                }));
                // Trigger storage event for other tabs/windows
                window.dispatchEvent(new StorageEvent('storage', {
                  key: 'studentInfo',
                  newValue: localStorage.getItem('studentInfo')
                }));
                // Also dispatch custom event for same-tab listeners
                window.dispatchEvent(new CustomEvent('studentInfoUpdated'));
              }
            } catch (e) {
              // Ignore errors
            }
          }, 500);
        }
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
    { key: 'major', label: 'Major', render: (value) => value || 'N/A' },
    { key: 'cohort', label: 'Cohort', render: (value) => value || 'N/A' },
    { key: 'advisor', label: 'Advisor', render: (value) => value || 'N/A' }
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
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const studentId = row.student_id || row.id.toString();
                      localStorage.setItem('studentId', studentId);
                      // Save student info for quick access
                      localStorage.setItem('studentInfo', JSON.stringify({
                        id: row.id,
                        student_id: row.student_id || row.id.toString(),
                        name: row.name,
                        email: row.email,
                        major: row.major,
                        cohort: row.cohort,
                        advisor: row.advisor
                      }));
                      navigate(`/student/dashboard?studentId=${studentId}`);
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-brand-600 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-500/10"
                    title="View as Student"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleOpenManageCoursesModal(row)}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"
                  >
                    Manage Courses
                  </button>
                </div>
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
                type="select"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                options={studentOptions.majors.map(major => ({ value: major, label: major }))}
                placeholder="Select or enter major"
              />
              <FormField
                label="Cohort"
                name="cohort"
                type="select"
                value={formData.cohort}
                onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                options={studentOptions.cohorts.map(cohort => ({ value: cohort, label: cohort }))}
                placeholder="Select or enter cohort"
              />
              <FormField
                label="Advisor"
                name="advisor"
                type="select"
                value={formData.advisor}
                onChange={(e) => setFormData({ ...formData, advisor: e.target.value })}
                options={studentOptions.advisors.map(advisor => ({ value: advisor, label: advisor }))}
                placeholder="Select or enter advisor"
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
          isOpen={isManageCoursesModalOpen}
          onClose={handleCloseManageCoursesModal}
          title={`Manage Courses for ${managingCoursesUser?.name}`}
        >
          <div className="space-y-4">
            {/* Current Enrollments */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">
                Current Courses
              </h3>
              {enrollmentsLoading ? (
                <p className="text-sm text-slate-400 italic">Loading courses...</p>
              ) : studentEnrollments.length === 0 ? (
                <div>
                  <p className="text-sm text-slate-400 italic">No courses assigned yet.</p>
                  {process.env.NODE_ENV === 'development' && (
                    <p className="text-xs text-slate-400 mt-1">
                      Debug: enrollments array length = {studentEnrollments.length}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {studentEnrollments.map((enrollment) => {
                    console.log('[DEBUG] Rendering enrollment:', {
                      id: enrollment.id,
                      enrollmentId: enrollment.id,
                      course: enrollment.course,
                      courseId: enrollment.course?.id || enrollment.course_id
                    });
                    return (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {enrollment.course?.code || 'N/A'} - {enrollment.course?.name || 'N/A'}
                          </p>
                          {enrollment.status && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Status: {enrollment.status}
                            </p>
                          )}
                          {process.env.NODE_ENV === 'development' && (
                            <p className="text-xs text-slate-400 mt-1">
                              Enrollment ID: {enrollment.id}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            console.log('[DEBUG] Remove button clicked for enrollment:', enrollment.id);
                            handleRemoveCourse(enrollment.id);
                          }}
                          className="px-3 py-1.5 text-sm font-medium text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add New Course */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">
                Add New Course
              </h3>
              <FormField
                label="Course"
                name="course"
                type="select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                options={courses
                  .filter(course => !studentEnrollments.some(e => e.course?.id === course.id))
                  .map((course) => ({
                    value: course.id,
                    label: `${course.code} - ${course.name}`
                  }))}
                required
              />
              <button
                onClick={handleAddCourseFromManageModal}
                className="mt-3 w-full px-4 py-2 text-sm font-semibold text-white rounded-lg bg-brand-600 hover:bg-brand-700"
              >
                Add Course
              </button>
            </div>

            {success ? (
              <div className="p-3 text-sm text-emerald-600 bg-emerald-50 rounded-lg dark:bg-emerald-500/10 dark:text-emerald-400">
                {success}
              </div>
            ) : error ? (
              <div className="p-3 text-sm text-rose-600 bg-rose-50 rounded-lg dark:bg-rose-500/10 dark:text-rose-400">
                {error}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseManageCoursesModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Users;

