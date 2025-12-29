import React, { useState, useEffect } from 'react';
import './GradeCalculator.css';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import { assessmentAPI, learningOutcomeAPI, programOutcomeAPI } from '../services/api';

const GradeCalculator = () => {
  // State management for all components
  const [assessmentComponents, setAssessmentComponents] = useState([]);
  const [learningOutcomeComponents, setLearningOutcomeComponents] = useState([]);
  const [programOutcomeComponents, setProgramOutcomeComponents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Collapsible states
  const [isAssessmentCollapsed, setIsAssessmentCollapsed] = useState(false);
  const [isLearningOutcomeCollapsed, setIsLearningOutcomeCollapsed] = useState(false);
  const [isProgramOutcomeCollapsed, setIsProgramOutcomeCollapsed] = useState(false);

  // Load data from API on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load all components from API
        const [assessments, learningOutcomes, programOutcomes] = await Promise.all([
          assessmentAPI.getAll().catch(() => []), // Return empty array if API fails
          learningOutcomeAPI.getAll().catch(() => []),
          programOutcomeAPI.getAll().catch(() => [])
        ]);

        setAssessmentComponents(assessments || []);
        setLearningOutcomeComponents(learningOutcomes || []);
        setProgramOutcomeComponents(programOutcomes || []);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please check if the backend is running.');
        // Set default program outcomes if API fails
        setProgramOutcomeComponents([
          { id: 1, name: 'Program Outcome 1', detail: 'Program Outcome 1 Description' },
          { id: 2, name: 'Program Outcome 2', detail: 'Program Outcome 2 Description' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Add new assessment component
  const addAssessmentComponent = async (name) => {
    const trimmedName = (name || '').trim();
    if (!trimmedName) return;
    
    try {
      const newComponent = await assessmentAPI.create({
        name: trimmedName,
        grades: [],
        percentages: [],
        connections: []
      });
      setAssessmentComponents(prev => [...prev, newComponent]);
    } catch (err) {
      console.error('Error creating assessment:', err);
      // Fallback to local state if API fails
      const fallbackComponent = {
        id: Date.now(),
        name: trimmedName,
        grades: [],
        percentages: [],
        connections: []
      };
      setAssessmentComponents(prev => [...prev, fallbackComponent]);
    }
  };

  // Add new learning outcome component
  const addLearningOutcomeComponent = async (name, detail) => {
    const trimmedName = (name || '').trim();
    if (!trimmedName) return;
    
    try {
      const newComponent = await learningOutcomeAPI.create({
        name: trimmedName,
        detail: detail || '',
        grades: [],
        percentages: [],
        connections: []
      });
      setLearningOutcomeComponents(prev => [...prev, newComponent]);
    } catch (err) {
      console.error('Error creating learning outcome:', err);
      // Fallback to local state if API fails
      const fallbackComponent = {
        id: Date.now(),
        name: trimmedName,
        detail: detail || '',
        grades: [],
        percentages: [],
        connections: []
      };
      setLearningOutcomeComponents(prev => [...prev, fallbackComponent]);
    }
  };

  const renameAssessmentComponent = async (id, newName) => {
    const trimmedName = (newName || '').trim();
    if (!trimmedName) return;
    
    try {
      const component = assessmentComponents.find(c => c.id === id);
      if (!component) return;
      
      const updatedComponent = await assessmentAPI.update(id, {
        ...component,
        name: trimmedName
      });
      setAssessmentComponents(prev =>
        prev.map(comp => comp.id === id ? updatedComponent : comp)
      );
    } catch (err) {
      console.error('Error updating assessment:', err);
      // Fallback to local state if API fails
      setAssessmentComponents(prev =>
        prev.map(comp => comp.id === id ? { ...comp, name: trimmedName } : comp)
      );
    }
  };

  const renameLearningOutcomeComponent = async (id, newName) => {
    const trimmedName = (newName || '').trim();
    if (!trimmedName) return;
    
    try {
      const component = learningOutcomeComponents.find(c => c.id === id);
      if (!component) return;
      
      const updatedComponent = await learningOutcomeAPI.update(id, {
        ...component,
        name: trimmedName
      });
      setLearningOutcomeComponents(prev =>
        prev.map(comp => comp.id === id ? updatedComponent : comp)
      );
    } catch (err) {
      console.error('Error updating learning outcome:', err);
      // Fallback to local state if API fails
      setLearningOutcomeComponents(prev =>
        prev.map(comp => comp.id === id ? { ...comp, name: trimmedName } : comp)
      );
    }
  };

  // Remove assessment component by id
  const removeAssessmentComponent = async (id) => {
    try {
      await assessmentAPI.delete(id);
      setAssessmentComponents(prev => prev.filter(comp => comp.id !== id));
    } catch (err) {
      console.error('Error deleting assessment:', err);
      // Fallback to local state if API fails
      setAssessmentComponents(prev => prev.filter(comp => comp.id !== id));
    }
  };

  // Remove learning outcome component by id
  const removeLearningOutcomeComponent = async (id) => {
    try {
      await learningOutcomeAPI.delete(id);
      setLearningOutcomeComponents(prev => prev.filter(comp => comp.id !== id));
    } catch (err) {
      console.error('Error deleting learning outcome:', err);
      // Fallback to local state if API fails
      setLearningOutcomeComponents(prev => prev.filter(comp => comp.id !== id));
    }
  };

  // Update assessment component (for grade/percentage/connection updates)
  const updateAssessmentComponent = async (updatedComponent) => {
    try {
      const savedComponent = await assessmentAPI.update(updatedComponent.id, updatedComponent);
      setAssessmentComponents(prev =>
        prev.map(comp => comp.id === updatedComponent.id ? savedComponent : comp)
      );
    } catch (err) {
      console.error('Error updating assessment:', err);
      // Fallback to local state if API fails
      setAssessmentComponents(prev =>
        prev.map(comp => comp.id === updatedComponent.id ? updatedComponent : comp)
      );
    }
  };

  // Update learning outcome component (for grade/percentage/connection updates)
  const updateLearningOutcomeComponent = async (updatedComponent) => {
    try {
      const savedComponent = await learningOutcomeAPI.update(updatedComponent.id, updatedComponent);
      setLearningOutcomeComponents(prev =>
        prev.map(comp => comp.id === updatedComponent.id ? savedComponent : comp)
      );
    } catch (err) {
      console.error('Error updating learning outcome:', err);
      // Fallback to local state if API fails
      setLearningOutcomeComponents(prev =>
        prev.map(comp => comp.id === updatedComponent.id ? updatedComponent : comp)
      );
    }
  };

  if (isLoading) {
    return (
      <div className="grade-calculator">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grade-calculator">
        <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
          <p>{error}</p>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '10px' }}>
            The app will work in offline mode with local state.
          </p>
        </div>
      </div>
    );
  }

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
          onRenameAssessment={renameAssessmentComponent}
          onRenameLearningOutcome={renameLearningOutcomeComponent}
        />
        <RightPanel
          assessmentComponents={assessmentComponents}
          learningOutcomeComponents={learningOutcomeComponents}
          programOutcomeComponents={programOutcomeComponents}
          setAssessmentComponents={setAssessmentComponents}
          setLearningOutcomeComponents={setLearningOutcomeComponents}
          onUpdateAssessment={updateAssessmentComponent}
          onUpdateLearningOutcome={updateLearningOutcomeComponent}
        />
      </div>
    </div>
  );
};

export default GradeCalculator;
