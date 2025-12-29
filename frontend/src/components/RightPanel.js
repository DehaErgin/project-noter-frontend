import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  onUpdateLearningOutcome
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine view mode from URL
  const viewMode = location.pathname === '/flow-view' ? 'flow' : 'cards';
  
  // Initialize URL on first render if not set
  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/card-view', { replace: true });
    }
  }, [location.pathname, navigate]);

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
          onClick={() => navigate('/card-view')}
        >
          📋 Card View
        </button>
        <button
          className={`toggle-button ${viewMode === 'flow' ? 'active' : ''}`}
          onClick={() => navigate('/flow-view')}
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
          {assessmentComponents.length > 0 ? (
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
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No assessment components yet. Add one from the left panel.</p>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default RightPanel;
