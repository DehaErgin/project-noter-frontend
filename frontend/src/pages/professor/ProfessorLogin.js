import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import FormField from '../../components/admin/FormField';

const ProfessorLogin = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Check if professor exists by trying to get the professor list and find the email
      const professors = await adminService.getProfessors();
      const professor = professors.find(
        (p) => p.email && p.email.toLowerCase().trim() === email.toLowerCase().trim()
      );

      if (professor) {
        // Professor found, save to localStorage and navigate
        const professorId = professor.id.toString();
        localStorage.setItem('professorId', professorId);
        // Also save professor info for quick access
        localStorage.setItem('professorInfo', JSON.stringify({
          id: professor.id,
          name: professor.name,
          email: professor.email
        }));
        navigate(`/professor/courses?professorId=${professorId}`);
      } else {
        setError('Professor email not found. Please check your email and try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify professor email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Professor Login</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Enter your email to access your grade calculator
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
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
            disabled={isLoading || !email.trim()}
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

export default ProfessorLogin;

