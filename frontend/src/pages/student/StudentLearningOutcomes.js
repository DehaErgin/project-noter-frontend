import { useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import OutcomeCard from '../../components/student/OutcomeCard';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import studentService from '../../services/studentService';
import useAsyncResource from '../../hooks/useAsyncResource';

const StudentLearningOutcomes = () => {
  const { studentId } = useOutletContext();
  const loader = useCallback(() => studentService.getLearningOutcomes(studentId), [studentId]);
  const { data, isLoading, error, refetch } = useAsyncResource(loader);

  if (isLoading) return <LoadingState label="Fetching learning outcomes..." />;
  if (error) return <ErrorState message="Learning outcome data unavailable." onRetry={refetch} />;

  const outcomes = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">LO → PO Mapping</h2>
        <p className="text-sm text-slate-500">
          Review how each learning outcome contributes to your program outcomes and instructor feedback.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {outcomes.map((outcome) => (
          <OutcomeCard key={outcome.id} outcome={outcome} />
        ))}
      </div>
    </div>
  );
};

export default StudentLearningOutcomes;

