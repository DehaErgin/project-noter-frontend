import { useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import AssessmentList from '../../components/student/AssessmentList';
import studentService from '../../services/studentService';
import useAsyncResource from '../../hooks/useAsyncResource';

const StudentAssessments = () => {
  const { studentId } = useOutletContext();
  const loader = useCallback(() => studentService.getAssessments(studentId), [studentId]);
  const { data, isLoading, error } = useAsyncResource(loader);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Assessment → LO Connections</h2>
        <p className="text-sm text-slate-500">
          Track how each graded assessment contributes to your learning outcomes.
        </p>
      </div>
      {isLoading || error ? (
        <div className="p-8 text-center bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <p className="text-sm text-slate-400 italic">Waiting to upload data...</p>
        </div>
      ) : (
        <AssessmentList assessments={data || []} />
      )}
    </div>
  );
};

export default StudentAssessments;

