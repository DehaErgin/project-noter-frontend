import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import FormField from '../../components/admin/FormField';

const StudentLogin = () => {
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Check if student exists by trying to get the student list and find the ID
      const students = await adminService.getStudents();
      const student = students.find(
        (s) => s.student_id === studentId.trim() || s.id.toString() === studentId.trim() || s.id === studentId.trim()
      );

      if (student) {
        // Student found, save to localStorage and navigate
        const loginStudentId = student.student_id || student.id.toString();
        localStorage.setItem('studentId', loginStudentId);
        // Also save student info for quick access
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Student Login</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Enter your student ID to access your dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="Student ID"
            name="studentId"
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="Enter your student ID"
            required
            error={error}
          />

          {error && (
            <div className="p-3 text-sm text-rose-600 bg-rose-50 rounded-lg dark:bg-rose-500/10 dark:text-rose-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !studentId.trim()}
            className="w-full px-4 py-3 text-sm font-semibold text-white rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Need help? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;

