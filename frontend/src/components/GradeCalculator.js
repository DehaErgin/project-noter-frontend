import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import './GradeCalculator.css';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import adminService from '../services/adminService';
import professorService from '../services/professorService';
import useAsyncResource from '../hooks/useAsyncResource';

const GradeCalculator = () => {
  const navigate = useNavigate();
  const { professorId: pathProfessorId, courseId: pathCourseId } = useParams();
  const [searchParams] = useSearchParams();

  // Support both path params (new) and query params (legacy)
  const professorId = pathProfessorId || searchParams.get('professorId') || localStorage.getItem('professorId');
  const courseId = pathCourseId || searchParams.get('courseId');

  // Redirect legacy query param URLs to new path-based URLs
  useEffect(() => {
    if (professorId && courseId && (!pathProfessorId || !pathCourseId)) {
      navigate(`/professor/${professorId}/courses/${courseId}`, { replace: true });
      return;
    }

    if (!professorId) {
      // No professor ID found, redirect to login
      navigate('/professor/login');
    } else if (!courseId) {
      // No course selected, redirect to course selection
      navigate(`/professor/${professorId}/courses`);
    }
  }, [navigate, professorId, courseId, pathProfessorId, pathCourseId]);

  // Course students (for grade entry)
  const [courseStudents, setCourseStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // State management for all components
  const [assessmentComponents, setAssessmentComponents] = useState([]);
  const [learningOutcomeComponents, setLearningOutcomeComponents] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load assessments and learning outcomes from database when course is selected
  useEffect(() => {
    if (professorId && courseId) {
      // Load assessments from database
      professorService.getCourseAssessments(professorId, courseId)
        .then(assessments => {
          const formattedAssessments = assessments.map(a => ({
            id: a.id,
            name: a.name || a.title,
            grades: a.grades || [],
            studentGrades: a.studentStudents || a.student_grades || a.studentGrades || {},
            percentages: a.percentages || [],
            connections: a.connections || a.learning_outcome_connections || []
          }));
          setAssessmentComponents(formattedAssessments);
        })
        .catch(err => {
          console.error('Error loading assessments:', err);
        });

      // Load learning outcomes from database
      professorService.getCourseLearningOutcomes(professorId, courseId)
        .then(outcomes => {
          const formattedOutcomes = outcomes.map(lo => ({
            id: lo.id,
            name: lo.code || lo.name,
            detail: lo.description || lo.detail || '',
            grades: lo.grades || [],
            percentages: lo.percentages || [],
            connections: lo.connections || lo.program_outcome_connections || []
          }));
          setLearningOutcomeComponents(formattedOutcomes);
        })
        .catch(err => {
          console.error('Error loading learning outcomes:', err);
        });
    }
  }, [professorId, courseId]);

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

  // Add new assessment component and save to database
  const addAssessmentComponent = async (name) => {
    if (!courseId) return;

    try {
      setIsSaving(true);
      // Save to database first
      const savedAssessment = await professorService.createAssessment(professorId, courseId, {
        name: name,
        course_id: parseInt(courseId),
        grades: [],
        percentages: [],
        connections: []
      });

      // Create approval request for the new assessment
      try {
        console.log('[addAssessmentComponent] Creating approval request for assessment:', {
          assessmentId: savedAssessment.id,
          name,
          courseId,
          courseInfo
        });

        const professor = await professorService.getProfessor(professorId);
        console.log('[addAssessmentComponent] Professor info:', professor);

        const approvalResult = await professorService.createApprovalRequest(professorId, {
          type: 'assessment_creation',
          title: `New Assessment: ${name}`,
          description: `Professor ${professor.name || professorId} wants to add a new assessment "${name}" to course ${courseInfo?.code || courseId}`,
          details: {
            assessment_id: savedAssessment.id,
            assessment_name: name,
            course_id: parseInt(courseId),
            course_code: courseInfo?.code,
            course_name: courseInfo?.name
          }
        });

        if (approvalResult) {
          console.log('[addAssessmentComponent] Approval request created successfully:', approvalResult);
        } else {
          console.warn('[addAssessmentComponent] Approval request returned null - request may have failed silently');
        }
      } catch (approvalError) {
        console.error('[addAssessmentComponent] Error in approval request process:', approvalError);
        // Don't block the operation if approval request fails
      }

      // Add to state with the database ID
      const newComponent = {
        id: savedAssessment.id,
        name: savedAssessment.name || name,
        grades: savedAssessment.grades || [],
        percentages: savedAssessment.percentages || [],
        connections: savedAssessment.connections || []
      };
      setAssessmentComponents(prev => [...prev, newComponent]);
    } catch (error) {
      console.error('Error saving assessment:', error);
      // Fallback: add locally with temp ID
      const newComponent = {
        id: Date.now(),
        name,
        grades: [],
        percentages: [],
        connections: [],
        _unsaved: true
      };
      setAssessmentComponents(prev => [...prev, newComponent]);
    } finally {
      setIsSaving(false);
    }
  };

  // Add new learning outcome component and save to database
  const addLearningOutcomeComponent = async (name, detail) => {
    if (!courseId) return;

    try {
      setIsSaving(true);
      // Save to database first
      const savedLO = await professorService.createCourseLearningOutcome(professorId, courseId, {
        code: name,
        name: name,
        description: detail,
        course_id: parseInt(courseId),
        grades: [],
        percentages: [],
        connections: []
      });

      // Create approval request for the new learning outcome
      try {
        console.log('[addLearningOutcomeComponent] Creating approval request for LO:', {
          loId: savedLO.id,
          name,
          detail,
          courseId,
          courseInfo
        });

        const professor = await professorService.getProfessor(professorId);
        console.log('[addLearningOutcomeComponent] Professor info:', professor);

        const approvalResult = await professorService.createApprovalRequest(professorId, {
          type: 'lo_creation',
          title: `New Learning Outcome: ${name}`,
          description: `Professor ${professor.name || professorId} wants to add a new learning outcome "${name}" to course ${courseInfo?.code || courseId}`,
          details: {
            lo_id: savedLO.id,
            lo_code: name,
            lo_description: detail,
            course_id: parseInt(courseId),
            course_code: courseInfo?.code,
            course_name: courseInfo?.name
          }
        });

        if (approvalResult) {
          console.log('[addLearningOutcomeComponent] Approval request created successfully:', approvalResult);
        } else {
          console.warn('[addLearningOutcomeComponent] Approval request returned null - request may have failed silently');
        }
      } catch (approvalError) {
        console.error('[addLearningOutcomeComponent] Error in approval request process:', approvalError);
        // Don't block the operation if approval request fails
      }

      // Add to state with the database ID
      const newComponent = {
        id: savedLO.id,
        name: savedLO.code || savedLO.name || name,
        detail: savedLO.description || detail,
        grades: savedLO.grades || [],
        percentages: savedLO.percentages || [],
        connections: savedLO.connections || []
      };
      setLearningOutcomeComponents(prev => [...prev, newComponent]);
    } catch (error) {
      console.error('Error saving learning outcome:', error);
      // Fallback: add locally with temp ID
      const newComponent = {
        id: Date.now(),
        name,
        detail,
        grades: [],
        percentages: [],
        connections: [],
        _unsaved: true
      };
      setLearningOutcomeComponents(prev => [...prev, newComponent]);
    } finally {
      setIsSaving(false);
    }
  };

  // Remove assessment component by id and delete from database
  const removeAssessmentComponent = async (id) => {
    if (!courseId) return;

    // Remove from state immediately for responsiveness
    setAssessmentComponents(prev => prev.filter(comp => comp.id !== id));

    try {
      await professorService.deleteAssessment(professorId, courseId, id);
    } catch (error) {
      console.error('Error deleting assessment:', error);
      // If delete fails, we could restore it, but for now just log
    }
  };

  // Remove learning outcome component by id and delete from database
  const removeLearningOutcomeComponent = async (id) => {
    if (!courseId) return;

    // Remove from state immediately for responsiveness
    setLearningOutcomeComponents(prev => prev.filter(comp => comp.id !== id));

    try {
      await professorService.deleteCourseLearningOutcome(professorId, courseId, id);
    } catch (error) {
      console.error('Error deleting learning outcome:', error);
      // If delete fails, we could restore it, but for now just log
    }
  };

  const [professorInfo, setProfessorInfo] = useState(null);
  const [courseInfo, setCourseInfo] = useState(null);

  // Load professor info using proper backend endpoint
  useEffect(() => {
    if (professorId) {
      professorService.getProfessor(professorId)
        .then(professor => {
          const info = {
            id: professor.id,
            name: professor.name,
            email: professor.email
          };
          setProfessorInfo(info);
          localStorage.setItem('professorId', professorId);
          localStorage.setItem('professorInfo', JSON.stringify(info));
        })
        .catch(() => {
          // Fallback to localStorage
          try {
            const storedInfo = localStorage.getItem('professorInfo');
            if (storedInfo) {
              setProfessorInfo(JSON.parse(storedInfo));
            }
          } catch (e) {
            // Ignore errors
          }
        });
    }
  }, [professorId]);

  // Load course info and enrolled students using proper backend endpoints
  useEffect(() => {
    if (professorId && courseId) {
      // Load course info using professor-specific endpoint
      professorService.getProfessorCourse(professorId, courseId)
        .then(course => {
          setCourseInfo(course);
        })
        .catch(() => {
          // Fallback to admin endpoint
          adminService.getCourses().then(courses => {
            const course = courses.find(c => c.id.toString() === courseId);
            if (course) {
              setCourseInfo(course);
            }
          }).catch(() => { });
        });

      // Load enrolled students using reliable backend endpoint
      setStudentsLoading(true);
      console.log(`[GradeCalculator] Fetching students for course ${courseId}...`);

      professorService.getCourseStudents(professorId, courseId)
        .then(students => {
          console.log(`[GradeCalculator] Fetched ${students.length} students via professorService`);
          setCourseStudents(students);
          setStudentsLoading(false);
        })
        .catch(err => {
          console.error('[GradeCalculator] Failed to fetch students:', err);
          setCourseStudents([]);
          setStudentsLoading(false);
        });
    }
  }, [professorId, courseId]);

  const handleLogout = () => {
    localStorage.removeItem('professorId');
    localStorage.removeItem('professorInfo');
    navigate('/professor/login');
  };

  const handleBackToCourses = () => {
    navigate(`/professor/${professorId}/courses`);
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
