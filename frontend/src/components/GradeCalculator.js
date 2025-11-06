import React, { useState } from 'react';
import './GradeCalculator.css';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';

const GradeCalculator = () => {
  // State management for all components
  const [assessmentComponents, setAssessmentComponents] = useState([]);
  const [learningOutcomeComponents, setLearningOutcomeComponents] = useState([]);
  const [programOutcomeComponents] = useState([
    { id: 1, name: 'Program Outcome 1', detail: 'Program Outcome 1 Description' },
    { id: 2, name: 'Program Outcome 2', detail: 'Program Outcome 2 Description' }
  ]);

  // Collapsible states
  const [isAssessmentCollapsed, setIsAssessmentCollapsed] = useState(false);
  const [isLearningOutcomeCollapsed, setIsLearningOutcomeCollapsed] = useState(false);
  const [isProgramOutcomeCollapsed, setIsProgramOutcomeCollapsed] = useState(false);

  // Add new assessment component
  const addAssessmentComponent = (name) => {
    const newComponent = {
      id: Date.now(),
      name,
      grades: [],
      percentages: [],
      connections: []
    };
    setAssessmentComponents([...assessmentComponents, newComponent]);
  };

  // Add new learning outcome component
  const addLearningOutcomeComponent = (name, detail) => {
    const newComponent = {
      id: Date.now(),
      name,
      detail,
      grades: [],
      percentages: [],
      connections: []
    };
    setLearningOutcomeComponents([...learningOutcomeComponents, newComponent]);
  };

  // Remove assessment component by id
  const removeAssessmentComponent = (id) => {
    setAssessmentComponents(prev => prev.filter(comp => comp.id !== id));
  };

  // Remove learning outcome component by id
  const removeLearningOutcomeComponent = (id) => {
    setLearningOutcomeComponents(prev => prev.filter(comp => comp.id !== id));
  };

  return (
    <div className="grade-calculator">
      <div className="main-container">
        <LeftPanel
          assessmentComponents={assessmentComponents}
          learningOutcomeComponents={learningOutcomeComponents}
          programOutcomeComponents={programOutcomeComponents}
          isAssessmentCollapsed={isAssessmentCollapsed}
          isLearningOutcomeCollapsed={isLearningOutcomeCollapsed}
          isProgramOutcomeCollapsed={isProgramOutcomeCollapsed}
          setIsAssessmentCollapsed={setIsAssessmentCollapsed}
          setIsLearningOutcomeCollapsed={setIsLearningOutcomeCollapsed}
          setIsProgramOutcomeCollapsed={setIsProgramOutcomeCollapsed}
          onAddAssessment={addAssessmentComponent}
          onAddLearningOutcome={addLearningOutcomeComponent}
          onRemoveAssessment={removeAssessmentComponent}
          onRemoveLearningOutcome={removeLearningOutcomeComponent}
        />
        <RightPanel
          assessmentComponents={assessmentComponents}
          learningOutcomeComponents={learningOutcomeComponents}
          programOutcomeComponents={programOutcomeComponents}
          setAssessmentComponents={setAssessmentComponents}
          setLearningOutcomeComponents={setLearningOutcomeComponents}
        />
      </div>
    </div>
  );
};

export default GradeCalculator;
