import React, { useState } from 'react';
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

  const addPercentage = () => {
    const pct = parseFloat(percentageValues[percentageFieldsCount - 1] || 0);
    if (isNaN(pct) || pct <= 0) {
      alert('Please enter a valid percentage value');
      return;
    }

    const updatedComponent = {
      ...component,
      percentages: [...(component.percentages || []), pct]
    };
    onUpdate && onUpdate(updatedComponent);
    setPercentageValues({});
    setPercentageFieldsCount(0);
    setShowPercentageInput(false);
    setShowPercentageCount(false);
  };

  const deletePercentage = (index) => {
    const updated = (component.percentages || []).filter((_, i) => i !== index);
    // Also remove connections using this percentage
    const updatedConnections = (component.connections || []).filter(c => c.percentageIndex !== index);
    const updatedComponent = {
      ...component,
      percentages: updated,
      connections: updatedConnections
    };
    onUpdate && onUpdate(updatedComponent);
  };

  const updatePercentage = (index, value) => {
    const pct = parseFloat(value);
    if (isNaN(pct) || pct <= 0) {
      alert('Invalid percentage value');
      return;
    }
    const updated = [...(component.percentages || [])];
    updated[index] = pct;
    const updatedComponent = { ...component, percentages: updated };
    onUpdate && onUpdate(updatedComponent);
    setEditingPercentageIndex(null);
    setEditingPercentageValue('');
  };

  const addConnection = (percentageIndex) => {
    if (type === 'assessment') {
      if (!learningOutcomes || learningOutcomes.length === 0) {
        alert('No learning outcomes available');
        return;
      }
      const newConnection = {
        type: 'learning',
        targetId: learningOutcomes[0].id,
        percentageIndex: percentageIndex
      };
      const updatedComponent = {
        ...component,
        connections: [...(component.connections || []), newConnection]
      };
      onUpdate && onUpdate(updatedComponent);
    } else if (type === 'learning') {
      if (!programOutcomes || programOutcomes.length === 0) {
        alert('No program outcomes available');
        return;
      }
      const newConnection = {
        type: 'program',
        targetId: programOutcomes[0].id,
        percentageIndex: percentageIndex
      };
      const updatedComponent = {
        ...component,
        connections: [...(component.connections || []), newConnection]
      };
      onUpdate && onUpdate(updatedComponent);
    }
  };

  return (
    <div className={`component-card ${type}`}>
      <div className="card-header">
        <div className="card-title-wrapper">
          <h3 className="card-title">{component.name}</h3>
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
            {!isStatic && type !== 'learning' && type !== 'program' && (
              <button
                className="small-icon-button add"
                onClick={() => setShowGradeInput(!showGradeInput)}
              >
                {showGradeInput ? 'Cancel' : 'Add'}
              </button>
            )}
          </div>

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
                <button className="small-icon-button save" onClick={approveLearningOutcomeGrade}>Approve</button>
              </div>
            )}
          </div>
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

        {/* Percentages Section */}
        {type !== 'program' && (
          <div className="percentages-section">
            <div className="section-header">
              <span className="section-label">Percentages</span>
              {!isStatic && (
                <button
                  className="small-icon-button add"
                  onClick={() => {
                    setShowPercentageCount(!showPercentageCount);
                    setShowPercentageInput(false);
                  }}
                >
                  {showPercentageCount ? 'Cancel' : 'Add'}
                </button>
              )}
            </div>

            {showPercentageCount && (
              <div className="input-form">
                <input
                  type="number"
                  placeholder="Enter percentage"
                  value={percentageCount}
                  onChange={(e) => setPercentageCount(e.target.value)}
                  className="percentage-input"
                  min="1"
                  max="100"
                />
                <button
                  className="submit-button"
                  onClick={() => {
                    const count = parseInt(percentageCount);
                    if (isNaN(count) || count <= 0) {
                      alert('Please enter a valid number');
                      return;
                    }
                    setPercentageFieldsCount(count);
                    setShowPercentageInput(true);
                    setPercentageCount('');
                  }}
                >
                  Next
                </button>
              </div>
            )}

            {showPercentageInput && (
              <div className="input-form">
                {Array.from({ length: percentageFieldsCount }, (_, i) => (
                  <input
                    key={i}
                    type="number"
                    placeholder={`Percentage ${i + 1}`}
                    value={percentageValues[i] || ''}
                    onChange={(e) => setPercentageValues({ ...percentageValues, [i]: e.target.value })}
                    className="percentage-input"
                  />
                ))}
                <button
                  className="submit-button"
                  onClick={addPercentage}
                >
                  Add Percentage
                </button>
              </div>
            )}

            <div className="percentages-list">
              {(component.percentages || []).map((pct, index) => (
                <div key={index} className="percentage-item">
                  {editingPercentageIndex === index ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="number"
                        value={editingPercentageValue}
                        onChange={(e) => setEditingPercentageValue(e.target.value)}
                        className="percentage-input"
                        style={{ marginBottom: 0 }}
                      />
                      <button
                        className="small-icon-button save"
                        onClick={() => updatePercentage(index, editingPercentageValue)}
                      >
                        Save
                      </button>
                      <button
                        className="small-icon-button cancel"
                        onClick={() => {
                          setEditingPercentageIndex(null);
                          setEditingPercentageValue('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="percentage-value">{pct}%</span>
                      {!isStatic && (
                        <>
                          <button
                            className="small-icon-button edit"
                            onClick={() => {
                              setEditingPercentageIndex(index);
                              setEditingPercentageValue(String(pct));
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="small-icon-button delete"
                            onClick={() => deletePercentage(index)}
                          >
                            Delete
                          </button>
                          <button
                            className="small-icon-button add"
                            onClick={() => addConnection(index)}
                          >
                            Connect
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Connections for this percentage */}
                  <div className="connections-list">
                    {(component.connections || [])
                      .map((c, originalIdx) => ({ c, originalIdx }))
                      .filter(({ c }) => c.percentageIndex === index)
                      .map(({ c: connection, originalIdx }) => (
                        <div key={originalIdx} className="connection">
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
                              {!isStatic && (
                                <>
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
                            </>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total Grade */}
        {type !== 'program' && (
          <div className="total-grade">
            <span className="total-label">Total Grade:</span>
            <span className="total-value">{calculateTotalGrade()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentCard;
