import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import adminService from '../services/adminService';
import professorService from '../services/professorService';
import FormField from '../components/admin/FormField';

const UnifiedLogin = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('type') || 'student');
  const [formData, setFormData] = useState({
    studentId: '',
    professorEmail: '',
    adminUsername: '',
    adminPassword: ''
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && ['student', 'professor', 'admin'].includes(type)) {
      setActiveTab(type);
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const students = await adminService.getStudents();
      const student = students.find(
        (s) => s.student_id === formData.studentId.trim() || s.id.toString() === formData.studentId.trim() || s.id === formData.studentId.trim()
      );

      if (student) {
        const loginStudentId = student.student_id || student.id.toString();
        localStorage.setItem('studentId', loginStudentId);
        localStorage.setItem('studentInfo', JSON.stringify({
          id: student.id,
          student_id: student.student_id || student.id.toString(),
          name: student.name,
          email: student.email,
          major: student.major,
          cohort: student.cohort,
          advisor: student.advisor
        }));
        navigate(`/student/dashboard?studentId=${loginStudentId}`);
      } else {
        setError('Student ID not found. Please check your student ID and try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify student ID. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfessorLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const professor = await professorService.getProfessorByEmail(formData.professorEmail.trim());

      if (professor) {
        const professorId = professor.id.toString();
        localStorage.setItem('professorId', professorId);
        localStorage.setItem('professorInfo', JSON.stringify({
          id: professor.id,
          name: professor.name,
          email: professor.email
        }));
        navigate(`/professor/${professorId}/courses`);
      } else {
        setError('Professor email not found. Please check your email and try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify professor email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Hardcoded credentials as per requirements
    if (formData.adminUsername === 'admin' && formData.adminPassword === 'admin') {
      localStorage.setItem('adminId', 'admin');
      // Simulate API call delay
      setTimeout(() => {
        setIsLoading(false);
        navigate('/admin/dashboard');
      }, 500);
    } else {
      setIsLoading(false);
      setError('Invalid username or password.');
    }
  };

  const renderTabButton = (id, label) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setError(null);
      }}
      className={clsx(
        'flex-1 py-3 text-sm font-semibold transition-all duration-200 border-b-2',
        activeTab === id
          ? 'border-brand-600 text-brand-600 dark:text-brand-400'
          : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Please login to access your dashboard
          </p>
        </div>

        <div className="flex mb-8 border-b border-slate-200 dark:border-slate-800">
          {renderTabButton('student', 'Student')}
          {renderTabButton('professor', 'Professor')}
          {renderTabButton('admin', 'Admin')}
        </div>

        {error && (
          <div className="mb-6 p-3 text-sm text-rose-600 bg-rose-50 rounded-lg dark:bg-rose-500/10 dark:text-rose-400">
            {error}
          </div>
        )}

        {activeTab === 'student' && (
          <form onSubmit={handleStudentLogin} className="space-y-6">
            <FormField
              label="Student ID"
              name="studentId"
              type="text"
              value={formData.studentId}
              onChange={handleInputChange}
              placeholder="Enter your student ID"
              required
            />
            <button
              type="submit"
              disabled={isLoading || !formData.studentId.trim()}
              className="w-full px-4 py-3 text-sm font-semibold text-white rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Verifying...' : 'Login as Student'}
            </button>
          </form>
        )}

        {activeTab === 'professor' && (
          <form onSubmit={handleProfessorLogin} className="space-y-6">
            <FormField
              label="Email Address"
              name="professorEmail"
              type="email"
              value={formData.professorEmail}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              required
            />
            <button
              type="submit"
              disabled={isLoading || !formData.professorEmail.trim()}
              className="w-full px-4 py-3 text-sm font-semibold text-white rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Verifying...' : 'Login as Professor'}
            </button>
          </form>
        )}

        {activeTab === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <FormField
              label="Username"
              name="adminUsername"
              type="text"
              value={formData.adminUsername}
              onChange={handleInputChange}
              placeholder="admin"
              required
            />
            <FormField
              label="Password"
              name="adminPassword"
              type="password"
              value={formData.adminPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              required
            />
            <button
              type="submit"
              disabled={isLoading || !formData.adminUsername.trim() || !formData.adminPassword.trim()}
              className="w-full px-4 py-3 text-sm font-semibold text-white rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Verifying...' : 'Login as Admin'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Need help? Contact support
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLogin;
