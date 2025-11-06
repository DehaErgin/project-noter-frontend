import React from 'react';
import './LeftPanel.css';
import ComponentSection from './ComponentSection';

const LeftPanel = ({
  assessmentComponents,
  learningOutcomeComponents,
  programOutcomeComponents,
  isAssessmentCollapsed,
  isLearningOutcomeCollapsed,
  isProgramOutcomeCollapsed,
  setIsAssessmentCollapsed,
  setIsLearningOutcomeCollapsed,
  setIsProgramOutcomeCollapsed,
  onAddAssessment,
  onAddLearningOutcome,
  onRemoveAssessment,
  onRemoveLearningOutcome
}) => {
  return (
    <div className="left-panel">
      <div className="panel-content">
        {/* Assessment Components Section */}
        <ComponentSection
          title="Assessment Components"
          items={assessmentComponents}
          isCollapsed={isAssessmentCollapsed}
          setIsCollapsed={setIsAssessmentCollapsed}
          onAddItem={onAddAssessment}
          onRemoveItem={onRemoveAssessment}
          addButtonText="Enter assessment component name"
          placeholder="Assessment component name"
          showDetail={false}
        />

        {/* Learning Outcome Components Section */}
        <ComponentSection
          title="Learning Outcome Components"
          items={learningOutcomeComponents}
          isCollapsed={isLearningOutcomeCollapsed}
          setIsCollapsed={setIsLearningOutcomeCollapsed}
          onAddItem={onAddLearningOutcome}
          onRemoveItem={onRemoveLearningOutcome}
          addButtonText="Enter learning outcome name"
          placeholder="Learning outcome name"
          showDetail={true}
          detailPlaceholder="Enter detail"
        />

        {/* Program Outcome Components Section */}
        <ComponentSection
          title="Program Outcome Components"
          items={programOutcomeComponents}
          isCollapsed={isProgramOutcomeCollapsed}
          setIsCollapsed={setIsProgramOutcomeCollapsed}
          onAddItem={null}
          showAddButton={false}
          showDetail={true}
          isStatic={true}
        />
      </div>
    </div>
  );
};

export default LeftPanel;
