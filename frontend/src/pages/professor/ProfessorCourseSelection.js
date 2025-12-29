import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import professorService from '../../services/professorService';
import useAsyncResource from '../../hooks/useAsyncResource';

const ProfessorCourseSelection = () => {
  const navigate = useNavigate();
  const { professorId: pathProfessorId } = useParams();
  const [searchParams] = useSearchParams();
  const [professorInfo, setProfessorInfo] = useState(null);
  
  // Support both path params (new) and query params (legacy)
  const professorId = pathProfessorId || searchParams.get('professorId') || localStorage.getItem('professorId');
  
  // Redirect legacy query param URLs to new path-based URLs
  useEffect(() => {
    if (!pathProfessorId && professorId) {
      navigate(`/professor/${professorId}/courses`, { replace: true });
    }
  }, [pathProfessorId, professorId, navigate]);
  
  // Load professor info from backend
  useEffect(() => {
    if (professorId) {
      // Try to load from backend first
      professorService.getProfessor(professorId)
        .then(professor => {
          const info = {
            id: professor.id,
            name: professor.name,
            email: professor.email
          };
          setProfessorInfo(info);
          localStorage.setItem('professorId', professorId);
          localStorage.setItem('professorInfo', JSON.stringify(info));
        })
        .catch(() => {
          // Fallback to localStorage if backend fails
          try {
            const storedInfo = localStorage.getItem('professorInfo');
            if (storedInfo) {
              setProfessorInfo(JSON.parse(storedInfo));
            }
          } catch (e) {
            // Ignore errors
          }
        });
    } else {
      // No professor ID, redirect to login
      navigate('/professor/login');
    }
  }, [professorId, navigate]);

  // Load courses assigned to this professor using proper backend endpoint
  const coursesLoader = useCallback(() => {
    if (!professorId) return Promise.resolve([]);
    return professorService.getProfessorCourses(professorId);
  }, [professorId]);
  
  const { data: coursesData, isLoading: coursesLoading } = useAsyncResource(coursesLoader);
  const courses = coursesData || [];

  const handleCourseSelect = (courseId) => {
    navigate(`/professor/${professorId}/courses/${courseId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('professorId');
    localStorage.removeItem('professorInfo');
    navigate('/professor/login');
  };

  if (!professorId) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-4xl p-8">
        {/* Header */}
        <div className="mb-8 p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {professorInfo?.name ? `Welcome, ${professorInfo.name}` : 'Welcome, Professor'}
              </h1>
              {professorInfo?.email && (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {professorInfo.email}
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold text-slate-700 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Course Selection */}
        <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-2xl font-semibold mb-2 text-slate-900 dark:text-white">
            Select a Course
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Choose a course to access the grade calculator
          </p>

          {coursesLoading ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400 italic">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400 italic">No courses assigned to you yet.</p>
              <p className="text-xs text-slate-400 mt-2">Please contact administrator to assign courses.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => handleCourseSelect(course.id)}
                  className="p-6 text-left bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border-2 border-transparent hover:border-brand-500 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {course.code}
                    </h3>
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {course.name}
                  </p>
                  {course.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                      Click to open →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessorCourseSelection;

