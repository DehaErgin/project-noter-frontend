import React, { useEffect, useState } from 'react';
import './ComponentCard.css';
import Tooltip from './Tooltip';

const ComponentCard = ({
  component,
  type,
  onUpdate,
  learningOutcomes = [],
  programOutcomes = [],
  assessments = [],
  isStatic = false,
  courseStudents = []
}) => {
<<<<<<< HEAD
  const [gradeValue, setGradeValue] = useState(() => {
    if (type !== 'assessment') return '';
    const initial = (component.grades || [])[0];
    return initial === undefined ? '' : String(initial);
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(component.name || '');

  useEffect(() => {
    if (type !== 'assessment') return;
    const current = (component.grades || [])[0];
    setGradeValue(current === undefined ? '' : String(current));
  }, [component.grades, type]);

  useEffect(() => {
    setNameValue(component.name || '');
  }, [component.name]);
=======
  const [showGradeInput, setShowGradeInput] = useState(false);
  const [showPercentageInput, setShowPercentageInput] = useState(false);
  const [showPercentageCount, setShowPercentageCount] = useState(false);
  const [gradeValue, setGradeValue] = useState('');
  const [selectedStudentForGrade, setSelectedStudentForGrade] = useState('');
  const [percentageCount, setPercentageCount] = useState('');
  const [percentageFieldsCount, setPercentageFieldsCount] = useState(0);
  const [percentageValues, setPercentageValues] = useState({});
  const [editingPercentageIndex, setEditingPercentageIndex] = useState(null);
  const [editingPercentageValue, setEditingPercentageValue] = useState('');
  const [editingConnectionIndex, setEditingConnectionIndex] = useState(null);
  const [editingConnectionTargetId, setEditingConnectionTargetId] = useState('');
>>>>>>> super-user

  // Calculate total grade based on connections
  const calculateTotalGrade = () => {
    if (type === 'assessment') {
      // For assessment components, calculate based on learning outcome connections
      let totalWeightedGrade = 0;
      let totalWeight = 0;

      (component.connections || []).forEach(connection => {
        if (connection.type === 'learning' && connection.percentage) {
          const grade = parseFloat((component.grades || [])[connection.gradeIndex] || 0);
          const weight = parseFloat(connection.percentage) / 100;
          totalWeightedGrade += grade * weight;
          totalWeight += weight;
        }
      });

      return totalWeight > 0 ? (totalWeightedGrade / totalWeight).toFixed(1) : 0;
    } else if (type === 'learning') {
      // Compute from Assessment -> Learning connections defined on assessments
      let totalWeightedGrade = 0;
      (assessments || []).forEach(a => {
        const grade = parseFloat((a.grades || [])[0] || 0);
        (a.connections || [])
          .filter(conn => conn.type === 'learning' && conn.targetId === component.id)
          .forEach(conn => {
            const pct = parseFloat((a.percentages || [])[conn.percentageIndex] || 0);
            const weight = isNaN(pct) ? 0 : pct / 100;
            // Direct sum of contributions (no normalization)
            totalWeightedGrade += grade * weight;
          });
      });
      return totalWeightedGrade.toFixed(1);
    } else if (type === 'program') {
      // Two-hop compute: Assessments -> LO -> Program
      // weight = (assessment->LO percentage) * (LO->Program percentage)
      let totalWeightedGrade = 0;
      let totalWeight = 0;

      // Map LO id to its connections to this Program (with percentages)
      const loIdToProgramWeights = new Map();
      (learningOutcomes || []).forEach(lo => {
        (lo.connections || [])
          .filter(conn => conn.type === 'program' && conn.targetId === component.id)
          .forEach(conn => {
            const pct = parseFloat((lo.percentages || [])[conn.percentageIndex] || 0);
            const weight = isNaN(pct) ? 0 : pct / 100;
            if (weight > 0) loIdToProgramWeights.set(lo.id, weight);
          });
      });

      // For each assessment grade, see its links to each LO, then if LO links to this Program, combine weights
      (assessments || []).forEach(a => {
        const aGrade = parseFloat((a.grades || [])[0] || 0);
        (a.connections || [])
          .filter(conn => conn.type === 'learning')
          .forEach(conn => {
            const loWeight = loIdToProgramWeights.get(conn.targetId);
            if (!loWeight) return;
            const aPct = parseFloat((a.percentages || [])[conn.percentageIndex] || 0);
            const aWeight = isNaN(aPct) ? 0 : aPct / 100;
            const combined = aWeight * loWeight;
            totalWeightedGrade += aGrade * combined;
            totalWeight += combined;
          });
      });

      // Normalize by total weight to get a grade out of 100
      return totalWeight > 0 ? (totalWeightedGrade / totalWeight).toFixed(1) : '0.0';
    }
    return 0;
  };

<<<<<<< HEAD
  const persistAssessmentGrade = () => {
    if (type !== 'assessment' || !onUpdate) return;
    const trimmed = (gradeValue ?? '').toString().trim();
    if (trimmed === '') {
      const clearedComponent = { ...component, grades: [] };
      onUpdate(clearedComponent);
      return;
    }
    const parsed = parseFloat(trimmed);
    if (Number.isNaN(parsed)) {
      setGradeValue('');
      return;
    }
    const updatedComponent = { ...component, grades: [parsed] };
    onUpdate(updatedComponent);
=======
  const addGrade = () => {
    if (!gradeValue || !selectedStudentForGrade) return;

    const newGrade = parseFloat(gradeValue);
    const studentId = selectedStudentForGrade;
    
    // Store grades per student: { studentId: grade }
    const studentGrades = component.studentGrades || {};
    studentGrades[studentId] = newGrade;
    
    const updatedComponent = {
      ...component,
      studentGrades: studentGrades
    };
    
    onUpdate && onUpdate(updatedComponent);
    setGradeValue('');
    setSelectedStudentForGrade('');
    setShowGradeInput(false);
>>>>>>> super-user
  };

  const approveLearningOutcomeGrade = () => {
    if (type !== 'learning') return;
    const value = parseFloat(calculateTotalGrade());
    if (isNaN(value)) return;
    const updatedComponent = { ...component, grades: [value] };
    onUpdate && onUpdate(updatedComponent);
  };

  const approveProgramOutcomeGrade = () => {
    if (type !== 'program') return;
    const value = parseFloat(calculateTotalGrade());
    if (isNaN(value)) return;
    const updatedComponent = { ...component, grades: [value] };
    onUpdate && onUpdate(updatedComponent);
  };

  const persistNameChange = () => {
    if (!onUpdate) return;
    const trimmed = (nameValue || '').trim();
    if (!trimmed) {
      setNameValue(component.name || '');
      setIsEditingName(false);
      return;
    }
    if (trimmed === component.name) {
      setIsEditingName(false);
      return;
    }
    onUpdate({ ...component, name: trimmed });
    setIsEditingName(false);
  };

  return (
    <div className={`component-card ${type}`}>
      <div className="card-header">
        <div className="card-title-wrapper">
          {isEditingName ? (
            <div className="title-edit">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="name-edit-input"
                onBlur={persistNameChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    persistNameChange();
                  } else if (e.key === 'Escape') {
                    setNameValue(component.name || '');
                    setIsEditingName(false);
                  }
                }}
                autoFocus
                placeholder="Enter name"
              />
            </div>
          ) : (
            <h3 className="card-title">{component.name}</h3>
          )}
          {!isStatic && !isEditingName && (
            <button
              className="small-icon-button edit name-edit-button"
              onClick={() => setIsEditingName(true)}
              title="Rename component"
            >
              Edit
            </button>
          )}
        </div>
        {component.detail && (
          <Tooltip content={component.detail} position="top">
            <div className="detail-info">
              📋 {component.detail}
            </div>
          </Tooltip>
        )}
      </div>

      <div className="card-content">
        {/* Grade Section */}
        <div className="grade-section">
          <div className="section-header">
            <span className="section-label">Grade</span>
          </div>
<<<<<<< HEAD
          {type === 'assessment' && !isStatic ? (
            <input
              type="number"
              placeholder="Enter grade"
              value={gradeValue}
              min="0"
              max="100"
              step="1"
              onChange={(e) => {
                const { value } = e.target;
                if (value === '') {
                  setGradeValue('');
                  return;
                }
                const numeric = Number(value);
                if (Number.isNaN(numeric)) return;
                if (numeric < 0) {
                  setGradeValue('0');
                } else if (numeric > 100) {
                  setGradeValue('100');
                } else {
                  setGradeValue(value);
                }
              }}
              onBlur={persistAssessmentGrade}
              onKeyDown={(e) => {
                if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                  e.preventDefault();
                  return;
                }
                if (e.key === 'Enter') {
                  persistAssessmentGrade();
                  e.preventDefault();
                }
              }}
              className="grade-input"
            />
          ) : (
            <div className="grade-display">
              <span className="grade-value">
                {(component.grades || [])[0] ?? 'N/A'}
              </span>
            </div>
          )}
          {type === 'learning' && (
            <div className="computed-wrapper">
              <span className="section-label">Computed:</span>
              <span className="grade-value">{calculateTotalGrade()}</span>
              {!isStatic && (
=======
          
           {showGradeInput && type !== 'learning' && (
            <div className="input-form">
              <select
                value={selectedStudentForGrade}
                onChange={(e) => setSelectedStudentForGrade(e.target.value)}
                className="grade-input"
                style={{ marginBottom: '8px' }}
              >
                <option value="">-- Select Student --</option>
                {courseStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.student_id} - {student.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Enter grade"
                value={gradeValue}
                onChange={(e) => setGradeValue(e.target.value)}
                className="grade-input"
                disabled={!selectedStudentForGrade}
              />
              <button 
                className="submit-button"
                onClick={addGrade}
                disabled={!gradeValue || !selectedStudentForGrade}
              >
                Add Grade
              </button>
            </div>
          )}

          <div className="grades-list">
            {component.studentGrades && Object.entries(component.studentGrades).map(([studentId, grade]) => {
              const student = courseStudents.find(s => s.id.toString() === studentId.toString());
              return (
                <div key={studentId} className="grade-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="grade-label" style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                      {student ? `${student.student_id} - ${student.name}:` : `Student ${studentId}:`}
                    </span>
                    <span className="grade-value">{grade}</span>
                  </div>
                  <div className="grade-connections">
                    {(component.connections || [])
                      .map((c, originalIdx) => ({ c, originalIdx }))
                    .map(({ c: connection, originalIdx }) => (
                      <div key={originalIdx} className="connection" style={{ gap: 10 }}>
                        <span className="percentage">
                          {(component.percentages || [])[connection.percentageIndex]}%
                        </span>
                        <span className="arrow">→</span>
                        {editingConnectionIndex === originalIdx ? (
                          <>
                            {type === 'assessment' ? (
                              <select
                                className="percentage-input"
                                style={{ width: 180, marginBottom: 0 }}
                                value={editingConnectionTargetId}
                                onChange={(e) => setEditingConnectionTargetId(e.target.value)}
                              >
                                {learningOutcomes.map(lo => (
                                  <option key={lo.id} value={lo.id}>{lo.name}</option>
                                ))}
                              </select>
                            ) : (
                              <select
                                className="percentage-input"
                                style={{ width: 180, marginBottom: 0 }}
                                value={editingConnectionTargetId}
                                onChange={(e) => setEditingConnectionTargetId(e.target.value)}
                              >
                                {programOutcomes.map(po => (
                                  <option key={po.id} value={po.id}>{po.name}</option>
                                ))}
                              </select>
                            )}
                            <button
                              className="small-icon-button save"
                              onClick={() => {
                                const updated = [...(component.connections || [])];
                                const newTargetId = isNaN(parseInt(editingConnectionTargetId))
                                  ? editingConnectionTargetId
                                  : parseInt(editingConnectionTargetId);
                                updated[originalIdx] = {
                                  ...updated[originalIdx],
                                  targetId: newTargetId
                                };
                                const updatedComponent = { ...component, connections: updated };
                                onUpdate && onUpdate(updatedComponent);
                                setEditingConnectionIndex(null);
                                setEditingConnectionTargetId('');
                              }}
                            >Save</button>
                            <button
                              className="small-icon-button cancel"
                              onClick={() => {
                                setEditingConnectionIndex(null);
                                setEditingConnectionTargetId('');
                              }}
                            >Cancel</button>
                          </>
                        ) : (
                          <>
                            <span className="target">
                              {connection.type === 'learning' 
                                ? learningOutcomes.find(lo => lo.id === connection.targetId)?.name
                                : programOutcomes.find(po => po.id === connection.targetId)?.name
                              }
                            </span>
                            <button
                              className="small-icon-button edit"
                              onClick={() => {
                                setEditingConnectionIndex(originalIdx);
                                setEditingConnectionTargetId(String(connection.targetId));
                              }}
                            >Edit</button>
                            <button
                              className="small-icon-button delete"
                              onClick={() => {
                                const updated = (component.connections || []).filter((_, i) => i !== originalIdx);
                                const updatedComponent = { ...component, connections: updated };
                                onUpdate && onUpdate(updatedComponent);
                              }}
                            >Delete</button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {type === 'learning' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="section-label">Computed:</span>
                <span className="grade-value">{calculateTotalGrade()}</span>
>>>>>>> super-user
                <button className="small-icon-button save" onClick={approveLearningOutcomeGrade}>Approve</button>
              )}
            </div>
          )}
          {type === 'program' && (
            <div className="computed-wrapper">
              <span className="section-label">Computed:</span>
              <span className="grade-value">{calculateTotalGrade()}</span>
              {!isStatic && (
                <button className="small-icon-button save" onClick={approveProgramOutcomeGrade}>Approve</button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ComponentCard;
