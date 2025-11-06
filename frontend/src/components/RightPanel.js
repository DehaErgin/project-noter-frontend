import React, { useState } from 'react';
import './RightPanel.css';
import ComponentCard from './ComponentCard';
import GradeCalculatorFlow from './GradeCalculatorFlow';

const RightPanel = ({
  assessmentComponents,
  learningOutcomeComponents,
  programOutcomeComponents,
  setAssessmentComponents,
  setLearningOutcomeComponents
}) => {
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'flow'

  const handleDeleteConnection = (sourceComponentId, targetComponentId, percentageIndex, connectionType) => {
    if (connectionType === 'learning') {
      setAssessmentComponents(prev =>
        prev.map(comp => {
          if (comp.id === sourceComponentId) {
            return {
              ...comp,
              connections: (comp.connections || []).filter(
                conn => !(conn.type === 'learning' && 
                          conn.targetId === targetComponentId && 
                          conn.percentageIndex === percentageIndex)
              )
            };
          }
          return comp;
        })
      );
    } else if (connectionType === 'program') {
      setLearningOutcomeComponents(prev =>
        prev.map(comp => {
          if (comp.id === sourceComponentId) {
            return {
              ...comp,
              connections: (comp.connections || []).filter(
                conn => !(conn.type === 'program' && 
                          conn.targetId === targetComponentId && 
                          conn.percentageIndex === percentageIndex)
              )
            };
          }
          return comp;
        })
      );
    }
  };

  return (
    <div className="right-panel">
      <div className="view-mode-toggle">
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
          onUpdateAssessment={(updatedComponent) => {
            setAssessmentComponents(prev =>
              prev.map(comp =>
                comp.id === updatedComponent.id ? updatedComponent : comp
              )
            );
          }}
          onUpdateLearningOutcome={(updatedComponent) => {
            setLearningOutcomeComponents(prev =>
              prev.map(comp =>
                comp.id === updatedComponent.id ? updatedComponent : comp
              )
            );
          }}
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
                  onUpdate={(updatedComponent) => {
                    setAssessmentComponents(prev =>
                      prev.map(comp =>
                        comp.id === component.id ? updatedComponent : comp
                      )
                    );
                  }}
                  learningOutcomes={learningOutcomeComponents}
                  programOutcomes={programOutcomeComponents}
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
                  onUpdate={(updatedComponent) => {
                    setLearningOutcomeComponents(prev =>
                      prev.map(comp =>
                        comp.id === component.id ? updatedComponent : comp
                      )
                    );
                  }}
                  programOutcomes={programOutcomeComponents}
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
