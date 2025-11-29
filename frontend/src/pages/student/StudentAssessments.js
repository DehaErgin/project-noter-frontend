import { useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import AssessmentList from '../../components/student/AssessmentList';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import studentService from '../../services/studentService';
import useAsyncResource from '../../hooks/useAsyncResource';

const StudentAssessments = () => {
  const { studentId } = useOutletContext();
  const loader = useCallback(() => studentService.getAssessments(studentId), [studentId]);
  const { data, isLoading, error, refetch } = useAsyncResource(loader);

  if (isLoading) return <LoadingState label="Loading assessments..." />;
  if (error) return <ErrorState message="Unable to load assessments." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Assessment → LO Connections</h2>
        <p className="text-sm text-slate-500">
          Track how each graded assessment contributes to your learning outcomes.
        </p>
      </div>
      <AssessmentList assessments={data || []} />
    </div>
  );
};

export default StudentAssessments;

