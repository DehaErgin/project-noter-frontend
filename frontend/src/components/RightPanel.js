import React, { useState } from 'react';
import './RightPanel.css';
import ComponentCard from './ComponentCard';
import GradeCalculatorFlow from './GradeCalculatorFlow';

const RightPanel = ({
  assessmentComponents,
  learningOutcomeComponents,
  programOutcomeComponents,
  setAssessmentComponents,
  setLearningOutcomeComponents,
  onUpdateAssessment,
  onUpdateLearningOutcome,
  courseStudents
}) => {
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'flow'

  const handleDeleteConnection = (sourceComponentId, targetComponentId, percentageIndex, connectionType) => {
    // ... (logic remains the same, assuming flow view handles its own complex updates properly or will be updated later)
    // For now, let's keep setAssessmentComponents as is for flow, but Cards should use persistence.
    if (connectionType === 'learning') {
      setAssessmentComponents(prev =>
        prev.map(comp => {
          // ... (keep existing logic)
          if (comp.id === sourceComponentId) {
            const updated = {
              ...comp,
              connections: (comp.connections || []).filter(
                conn => !(conn.type === 'learning' &&
                  conn.targetId === targetComponentId &&
                  conn.percentageIndex === percentageIndex)
              )
            };
            // Side effect: update persistence if possible?
            // For now, just state update. Flow view seems to be complex.
            onUpdateAssessment && onUpdateAssessment(updated);
            return updated;
          }
          return comp;
        })
      );
    } else if (connectionType === 'program') {
      setLearningOutcomeComponents(prev =>
        prev.map(comp => {
          if (comp.id === sourceComponentId) {
            const updated = {
              ...comp,
              connections: (comp.connections || []).filter(
                conn => !(conn.type === 'program' &&
                  conn.targetId === targetComponentId &&
                  conn.percentageIndex === percentageIndex)
              )
            };
            onUpdateLearningOutcome && onUpdateLearningOutcome(updated);
            return updated;
          }
          return comp;
        })
      );
    }
  };

  return (
    <div className="right-panel">
      <div className="view-mode-toggle">
        {/* ... */}
        <button
          className={`toggle-button ${viewMode === 'cards' ? 'active' : ''}`}
          onClick={() => setViewMode('cards')}
        >
          📋 Card View
        </button>
        <button
          className={`toggle-button ${viewMode === 'flow' ? 'active' : ''}`}
          onClick={() => setViewMode('flow')}
        >
          🌊 Flow View
        </button>
      </div>

      {viewMode === 'flow' ? (
        <GradeCalculatorFlow
          assessmentComponents={assessmentComponents}
          learningOutcomeComponents={learningOutcomeComponents}
          programOutcomeComponents={programOutcomeComponents}
          onUpdateAssessment={onUpdateAssessment || ((updatedComponent) => {
            setAssessmentComponents(prev =>
              prev.map(comp =>
                comp.id === updatedComponent.id ? updatedComponent : comp
              )
            );
          })}
          onUpdateLearningOutcome={onUpdateLearningOutcome || ((updatedComponent) => {
            setLearningOutcomeComponents(prev =>
              prev.map(comp =>
                comp.id === updatedComponent.id ? updatedComponent : comp
              )
            );
          })}
          onDeleteConnection={handleDeleteConnection}
          setAssessmentComponents={setAssessmentComponents}
          setLearningOutcomeComponents={setLearningOutcomeComponents}
        />
      ) : (
        <div className="panel-content">
          {/* Assessment Components Cards */}
          {assessmentComponents.length > 0 && (
            <div className="cards-section">
              <h3 className="section-title">Assessment Components</h3>
              <div className="cards-grid">
                {assessmentComponents.map((component) => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    type="assessment"
                    onUpdate={onUpdateAssessment || ((updatedComponent) => {
                      setAssessmentComponents(prev =>
                        prev.map(comp =>
                          comp.id === component.id ? updatedComponent : comp
                        )
                      );
                    })}
                    learningOutcomes={learningOutcomeComponents}
                    programOutcomes={programOutcomeComponents}
                    courseStudents={courseStudents}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Learning Outcome Components Cards */}
          {learningOutcomeComponents.length > 0 && (
            <div className="cards-section">
              <h3 className="section-title">Learning Outcome Components</h3>
              <div className="cards-grid">
                {learningOutcomeComponents.map((component) => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    type="learning"
                    assessments={assessmentComponents}
                    onUpdate={onUpdateLearningOutcome || ((updatedComponent) => {
                      setLearningOutcomeComponents(prev =>
                        prev.map(comp =>
                          comp.id === component.id ? updatedComponent : comp
                        )
                      );
                    })}
                    programOutcomes={programOutcomeComponents}
                    courseStudents={courseStudents}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Program Outcome Components Cards */}
          {programOutcomeComponents.length > 0 && (
            <div className="cards-section">
              <h3 className="section-title">Program Outcome Components</h3>
              <div className="cards-grid">
                {programOutcomeComponents.map((component) => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    type="program"
                    isStatic={true}
                    learningOutcomes={learningOutcomeComponents}
                    assessments={assessmentComponents}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RightPanel;
