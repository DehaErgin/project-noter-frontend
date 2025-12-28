import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './GradeCalculator.css';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import adminService from '../services/adminService';
import useAsyncResource from '../hooks/useAsyncResource';

const GradeCalculator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Check authentication and course selection
  useEffect(() => {
    const urlProfessorId = searchParams.get('professorId');
    const storedProfessorId = localStorage.getItem('professorId');
    const professorId = urlProfessorId || storedProfessorId;
    const courseId = searchParams.get('courseId');
    
    if (!professorId) {
      // No professor ID found, redirect to login
      navigate('/professor/login');
    } else if (!courseId) {
      // No course selected, redirect to course selection
      navigate(`/professor/courses?professorId=${professorId}`);
    }
  }, [navigate, searchParams]);
  
  // Course students (for grade entry)
  const [courseStudents, setCourseStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // State management for all components
  const [assessmentComponents, setAssessmentComponents] = useState([]);
  const [learningOutcomeComponents, setLearningOutcomeComponents] = useState([]);
  
  // Load Program Outcomes from admin
  const poLoader = useCallback(() => adminService.getProgramOutcomes(), []);
  const { data: poData, isLoading: poLoading, error: poError } = useAsyncResource(poLoader);
  
  // Transform PO data to match component format
  // Format: {id, name, detail} where name is the code and detail is the description
  const programOutcomeComponents = (poData || []).map(po => ({
    id: po.id,
    name: po.code || `PO${po.id}`,
    detail: po.description || po.title || ''
  }));

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

  // Get professor and course info
  const urlProfessorId = searchParams.get('professorId');
  const storedProfessorId = localStorage.getItem('professorId');
  const professorId = urlProfessorId || storedProfessorId;
  const courseId = searchParams.get('courseId');
  
  const [professorInfo, setProfessorInfo] = useState(null);
  const [courseInfo, setCourseInfo] = useState(null);
  
  // Load professor info
  useEffect(() => {
    if (professorId) {
      try {
        const storedInfo = localStorage.getItem('professorInfo');
        if (storedInfo) {
          setProfessorInfo(JSON.parse(storedInfo));
        } else {
          // Fetch from API if not in localStorage
          adminService.getProfessors().then(professors => {
            const professor = professors.find(p => p.id.toString() === professorId);
            if (professor) {
              const info = {
                id: professor.id,
                name: professor.name,
                email: professor.email
              };
              setProfessorInfo(info);
              localStorage.setItem('professorInfo', JSON.stringify(info));
            }
          });
        }
      } catch (e) {
        // Ignore errors
      }
    }
  }, [professorId]);

  // Load course info and enrolled students
  useEffect(() => {
    if (courseId) {
      // Load course info
      adminService.getCourses().then(courses => {
        const course = courses.find(c => c.id.toString() === courseId);
        if (course) {
          setCourseInfo(course);
        }
      }).catch(e => {
        // Ignore errors
      });

      // Load enrolled students
      setStudentsLoading(true);
      adminService.getCourseEnrollments(courseId)
        .then(enrollments => {
          // Extract student info from enrollments
          const students = enrollments
            .map(enrollment => {
              // Enrollment might have student object or just student_id
              if (enrollment.student) {
                return {
                  id: enrollment.student.id,
                  student_id: enrollment.student.student_id || enrollment.student.id.toString(),
                  name: enrollment.student.name,
                  email: enrollment.student.email
                };
              } else if (enrollment.student_id) {
                // If only student_id is available, we need to fetch student details
                // For now, return what we have
                return {
                  id: enrollment.student_id,
                  student_id: enrollment.student_id.toString(),
                  name: enrollment.student_name || `Student ${enrollment.student_id}`,
                  email: enrollment.student_email || ''
                };
              }
              return null;
            })
            .filter(Boolean); // Remove null values
          
          setCourseStudents(students);
          setStudentsLoading(false);
        })
        .catch(e => {
          console.error('Error loading course students:', e);
          setCourseStudents([]);
          setStudentsLoading(false);
        });
    }
  }, [courseId]);

  const handleLogout = () => {
    localStorage.removeItem('professorId');
    localStorage.removeItem('professorInfo');
    navigate('/professor/login');
  };

  const handleBackToCourses = () => {
    navigate(`/professor/courses?professorId=${professorId}`);
  };

  // Show loading state while PO data is being fetched
  if (poLoading) {
    return (
      <div className="grade-calculator">
        <div className="main-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
          <p style={{ fontSize: '18px', color: '#666' }}>Loading Program Outcomes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grade-calculator">
      {/* Header */}
      <header style={{ 
        padding: '16px 24px', 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0, color: '#1e293b' }}>
            {professorInfo?.name ? `${professorInfo.name}'s Grade Calculator` : 'Grade Calculator'}
          </h1>
          {courseInfo && (
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#475569', margin: '4px 0 0 0' }}>
              {courseInfo.code} - {courseInfo.name}
            </p>
          )}
          {professorInfo?.email && !courseInfo && (
            <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
              {professorInfo.email}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
            {courseInfo && (
              <button
                onClick={handleBackToCourses}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#475569',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#f1f5f9'}
              >
                Back to Courses
              </button>
            )}
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#64748b',
                backgroundColor: '#f1f5f9',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#e2e8f0'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#f1f5f9'}
            >
              Logout
            </button>
        </div>
      </header>
      
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
          courseStudents={courseStudents}
        />
      </div>
    </div>
  );
};

export default GradeCalculator;
