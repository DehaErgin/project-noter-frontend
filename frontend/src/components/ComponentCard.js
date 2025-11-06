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
  isStatic = false
}) => {
  const [showGradeInput, setShowGradeInput] = useState(false);
  const [showPercentageInput, setShowPercentageInput] = useState(false);
  const [showPercentageCount, setShowPercentageCount] = useState(false);
  const [gradeValue, setGradeValue] = useState('');
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
    if (!gradeValue) return;

    const newGrade = parseFloat(gradeValue);
    const updatedComponent = {
      ...component,
      // enforce single grade: replace existing grade if present
      grades: [newGrade]
    };
    
    onUpdate && onUpdate(updatedComponent);
    setGradeValue('');
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

  const addPercentage = (value) => {
    const percentage = parseFloat(value);
    if (isNaN(percentage)) return;

    const updatedComponent = {
      ...component,
      percentages: [...(component.percentages || []), percentage]
    };
    
    onUpdate && onUpdate(updatedComponent);
  };

  const handlePercentageCountSubmit = () => {
    const count = parseInt(percentageCount);
    if (isNaN(count) || count <= 0) return;

    setShowPercentageCount(false);
    setShowPercentageInput(true);
    setPercentageFieldsCount(count);
    // Keep percentageCount value for potential edits; do not clear here
  };

  const handlePercentageSubmit = () => {
    const total = parseInt(percentageFieldsCount || 0, 10);
    const existing = [...(component.percentages || [])];
    for (let i = 0; i < total; i += 1) {
      const value = (percentageValues[i] ?? '').toString().trim();
      if (value) {
        const pct = parseFloat(value);
        if (!isNaN(pct)) existing.push(pct);
      }
    }
    const updatedComponent = { ...component, percentages: existing };
    onUpdate && onUpdate(updatedComponent);
    setPercentageValues({});
    setShowPercentageInput(false);
  };

  const startEditPercentage = (index) => {
    setEditingPercentageIndex(index);
    setEditingPercentageValue(String((component.percentages || [])[index] ?? ''));
  };

  const cancelEditPercentage = () => {
    setEditingPercentageIndex(null);
    setEditingPercentageValue('');
  };

  const saveEditPercentage = () => {
    const value = parseFloat(editingPercentageValue);
    if (isNaN(value)) return;
    const updated = [...(component.percentages || [])];
    if (editingPercentageIndex == null || editingPercentageIndex < 0 || editingPercentageIndex >= updated.length) return;
    updated[editingPercentageIndex] = value;
    const updatedComponent = { ...component, percentages: updated };
    onUpdate && onUpdate(updatedComponent);
    cancelEditPercentage();
  };

  const deletePercentage = (index) => {
    const current = (component.percentages || []);
    if (index < 0 || index >= current.length) return;
    const updatedPercentages = current.filter((_, i) => i !== index);
    const updatedConnections = (component.connections || [])
      .filter(conn => conn.percentageIndex !== index)
      .map(conn => ({
        ...conn,
        percentageIndex: conn.percentageIndex > index ? conn.percentageIndex - 1 : conn.percentageIndex
      }));
    const updatedComponent = { ...component, percentages: updatedPercentages, connections: updatedConnections };
    onUpdate && onUpdate(updatedComponent);
    if (editingPercentageIndex === index) cancelEditPercentage();
  };

  const connectToLearningOutcome = (gradeIndex, percentageIndex, learningOutcomeId) => {
    // Allow only a single connection from this grade to the same Learning Outcome
    const existing = (component.connections || []);
    const withoutDup = existing.filter(c => !(c.type === 'learning' && c.gradeIndex === gradeIndex && c.targetId === learningOutcomeId));
    const updatedComponent = {
      ...component,
      connections: [
        ...withoutDup,
        {
          type: 'learning',
          gradeIndex,
          percentageIndex,
          targetId: learningOutcomeId
        }
      ]
    };
    onUpdate && onUpdate(updatedComponent);
  };

  const connectToProgramOutcome = (gradeIndex, percentageIndex, programOutcomeId) => {
    // For learning outcomes, ensure only one connection to the same Program Outcome (per grade)
    const ensuredGrades = type === 'learning' && (!(component.grades || []).length)
      ? [0]
      : (component.grades || []);
    const existing = (component.connections || []);
    const withoutDup = existing.filter(c => !(c.type === 'program' && c.gradeIndex === gradeIndex && c.targetId === programOutcomeId));
    const updatedComponent = {
      ...component,
      grades: ensuredGrades,
      connections: [
        ...withoutDup,
        {
          type: 'program',
          gradeIndex,
          percentageIndex,
          targetId: programOutcomeId
        }
      ]
    };
    onUpdate && onUpdate(updatedComponent);
  };

  const connectAssessmentToLearning = (assessmentId, percentage) => {
    // Only makes sense when this card is of type 'learning'
    if (type !== 'learning') return;
    const updatedComponent = {
      ...component,
      connections: [
        ...(component.connections || []),
        {
          type: 'assessment',
          sourceId: assessmentId,
          percentage
        }
      ]
    };
    onUpdate && onUpdate(updatedComponent);
  };

  return (
    <div className={`component-card ${type}`}>
      <div className="card-header">
        <h3 className="card-title">{component.name}</h3>
        {component.detail && (
          <Tooltip content={component.detail} position="top">
            <div className="detail-info">
              📋 {component.detail}
            </div>
          </Tooltip>
        )}
      </div>

      <div className="card-content">
        {(() => {
          // Safeguard arrays to avoid runtime crashes on static cards
          var safeGrades = component.grades || [];
          var safePercentages = component.percentages || [];
          var safeConnections = component.connections || [];
          return null;
        })()}
        {/* Grade Section */}
        <div className="grade-section">
          <div className="section-header">
            <span className="section-label">Grade</span>
             {!isStatic && type !== 'learning' && (
              <button 
                className="add-button"
                onClick={() => setShowGradeInput(!showGradeInput)}
              >
                +
              </button>
            )}
          </div>
          
           {showGradeInput && type !== 'learning' && (
            <div className="input-form">
              <input
                type="number"
                placeholder="Enter grade"
                value={gradeValue}
                onChange={(e) => setGradeValue(e.target.value)}
                className="grade-input"
              />
              <button 
                className="submit-button"
                onClick={addGrade}
                disabled={!gradeValue}
              >
                Add Grade
              </button>
            </div>
          )}

          <div className="grades-list">
            {((component.grades || []).slice(0, 1)).map((grade, index) => (
              <div key={index} className="grade-item">
                <span className="grade-value">{grade}</span>
                <div className="grade-connections">
                  {(component.connections || [])
                    .map((c, originalIdx) => ({ c, originalIdx }))
                    .filter(({ c }) => c.gradeIndex === index)
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
            ))}
            {type === 'learning' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="section-label">Computed:</span>
                <span className="grade-value">{calculateTotalGrade()}</span>
                <button className="small-icon-button save" onClick={approveLearningOutcomeGrade}>Approve</button>
              </div>
            )}
            {type === 'program' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="section-label">Computed:</span>
                <span className="grade-value">{calculateTotalGrade()}</span>
                <button className="small-icon-button save" onClick={approveProgramOutcomeGrade}>Approve</button>
              </div>
            )}
          </div>
        </div>

        {/* Percentage Section */}
        {type !== 'program' && (
        <div className="percentage-section">
          <div className="section-header">
            <span className="section-label">Percentages</span>
            {!isStatic && (
              <button 
                className="add-button"
                onClick={() => setShowPercentageCount(true)}
              >
                +
              </button>
            )}
          </div>

          {showPercentageCount && (
            <div className="input-form">
              <input
                type="number"
                placeholder="How many percentages do you want to enter?"
                value={percentageCount}
                onChange={(e) => setPercentageCount(e.target.value)}
                className="count-input"
              />
              <button 
                className="submit-button"
                onClick={handlePercentageCountSubmit}
                disabled={!percentageCount}
              >
                Next
              </button>
            </div>
          )}

          {showPercentageInput && (
            <div className="input-form">
              <div className="percentage-inputs">
                {Array.from({ length: Math.max(0, parseInt(percentageFieldsCount || 0)) }, (_, index) => (
                  <input
                    key={index}
                    type="number"
                    placeholder="Enter percentage value"
                    value={percentageValues[index] || ''}
                    onChange={(e) => setPercentageValues(prev => ({
                      ...prev,
                      [index]: e.target.value
                    }))}
                    className="percentage-input"
                  />
                ))}
              </div>
              <button 
                className="submit-button"
                onClick={handlePercentageSubmit}
              >
                Add Percentages
              </button>
            </div>
          )}

          <div className="percentages-list">
            {(component.percentages || []).map((percentage, index) => (
              <div key={index} className="percentage-item">
                {editingPercentageIndex === index ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                    <input
                      type="number"
                      value={editingPercentageValue}
                      onChange={(e) => setEditingPercentageValue(e.target.value)}
                      className="percentage-input"
                      placeholder="Enter percentage value"
                      style={{ marginBottom: 0 }}
                    />
                    <button className="small-icon-button save" onClick={saveEditPercentage}>Save</button>
                    <button className="small-icon-button cancel" onClick={cancelEditPercentage}>Cancel</button>
                  </div>
                ) : (
                  <span className="percentage-value">{percentage}%</span>
                )}
                <div className="connection-options">
                  {type === 'assessment' && learningOutcomes.map(lo => (
                    <button
                      key={lo.id}
                      className="connection-button"
                      onClick={() => connectToLearningOutcome(0, index, lo.id)}
                    >
                      → {lo.name}
                    </button>
                  ))}
                  {type === 'learning' && programOutcomes.map(po => (
                    <button
                      key={po.id}
                      className="connection-button"
                      onClick={() => connectToProgramOutcome(0, index, po.id)}
                    >
                      → {po.name}
                    </button>
                  ))}
                  {editingPercentageIndex !== index && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button className="small-icon-button edit" onClick={() => startEditPercentage(index)}>Edit</button>
                      <button className="small-icon-button delete" onClick={() => deletePercentage(index)}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Total Grade Display */}
        {!isStatic && (
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
