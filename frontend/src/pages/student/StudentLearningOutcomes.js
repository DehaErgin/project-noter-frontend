import { useState, useCallback, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import OutcomeCard from '../../components/student/OutcomeCard';
import studentService from '../../services/studentService';
import useAsyncResource from '../../hooks/useAsyncResource';

const StudentLearningOutcomes = () => {
  const { studentId } = useOutletContext();
  const [selectedCourseId, setSelectedCourseId] = useState('');

  // Debug: Log studentId when component mounts or studentId changes
  useEffect(() => {
    console.group('[DEBUG] StudentLearningOutcomes - ID Check');
    console.log('studentId from context:', studentId);
    console.log('studentId type:', typeof studentId);
    console.log('localStorage studentId:', localStorage.getItem('studentId'));
    
    // Check for ID mismatch
    try {
      const storedInfo = localStorage.getItem('studentInfo');
      if (storedInfo) {
        const studentInfo = JSON.parse(storedInfo);
        console.warn('[DEBUG] ID MISMATCH CHECK:');
        console.warn('  - Context studentId:', studentId);
        console.warn('  - localStorage studentInfo.id:', studentInfo.id);
        console.warn('  - localStorage studentInfo.student_id:', studentInfo.student_id);
        console.warn('  - If admin used student.id but student logged in with student_id, courses won\'t show!');
      }
    } catch (e) {
      // Ignore
    }
    console.groupEnd();
  }, [studentId]);

  // Load courses
  const coursesLoader = useCallback(() => {
    console.log('[DEBUG] StudentLearningOutcomes - Loading courses for studentId:', studentId);
    return studentService.getCourses(studentId);
  }, [studentId]);
  const { data: coursesData, isLoading: coursesLoading, refetch: refetchCourses } = useAsyncResource(coursesLoader);
  const courses = coursesData || [];

  // Refresh courses when page becomes visible, gets focus, or storage changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetchCourses();
      }
    };

    const handleFocus = () => {
      refetchCourses();
    };

    const handleStorageChange = (e) => {
      // Refresh courses when studentInfo is updated (e.g., after course assignment)
      // This works for cross-tab communication
      if (e.key === 'studentInfo' || e.key === null) {
        refetchCourses();
      }
    };

    const handleCustomStorageEvent = () => {
      // Handle custom event dispatched from same tab (e.g., after course assignment in admin)
      refetchCourses();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);
    // Listen to custom event for same-tab updates
    window.addEventListener('studentInfoUpdated', handleCustomStorageEvent);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('studentInfoUpdated', handleCustomStorageEvent);
    };
  }, [refetchCourses]);

  // Load learning outcomes for selected course
  const outcomesLoader = useCallback(() => {
    if (!selectedCourseId) return Promise.resolve([]);
    return studentService.getLearningOutcomes(studentId, selectedCourseId);
  }, [studentId, selectedCourseId]);
  
  const { data, isLoading, error } = useAsyncResource(outcomesLoader);

  const outcomes = data || [];
  const hasData = outcomes.length > 0 && !error && !isLoading && selectedCourseId;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">LO → PO Mapping</h2>
        <p className="text-sm text-slate-500">
          Select a course to review how each learning outcome contributes to your program outcomes and instructor feedback.
        </p>
      </div>

      {/* Course Selection */}
      <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="course-select" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Select Course
          </label>
          <button
            onClick={() => refetchCourses()}
            disabled={coursesLoading}
            className="px-3 py-1 text-xs font-medium text-brand-600 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-500/10 disabled:opacity-50"
          >
            {coursesLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        <select
          id="course-select"
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
          disabled={coursesLoading}
        >
          <option value="">-- Select a course --</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.name}
            </option>
          ))}
        </select>
        {coursesLoading && (
          <p className="mt-2 text-sm text-slate-400 italic">Loading courses...</p>
        )}
        {!coursesLoading && courses.length === 0 && (
          <div className="mt-2">
            <p className="text-sm text-slate-400 italic">No courses available</p>
            <p className="text-xs text-slate-400 mt-1">
              If you just assigned a course, check browser console (F12) for errors or contact administrator.
            </p>
          </div>
        )}
        {!coursesLoading && courses.length > 0 && (
          <p className="mt-2 text-xs text-slate-400">
            {courses.length} course{courses.length !== 1 ? 's' : ''} available
          </p>
        )}
      </div>

      {/* Learning Outcomes */}
      {!selectedCourseId ? (
        <div className="p-8 text-center bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <p className="text-sm text-slate-400 italic">Please select a course to view learning outcomes</p>
        </div>
      ) : hasData ? (
        <div className="grid gap-4 md:grid-cols-2">
          {outcomes.map((outcome) => (
            <OutcomeCard key={outcome.id} outcome={outcome} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
            <p className="text-sm text-slate-400 italic">Waiting to upload data...</p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
            <p className="text-sm text-slate-400 italic">Waiting to upload data...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLearningOutcomes;

