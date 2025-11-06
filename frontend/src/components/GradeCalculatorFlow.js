import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './GradeCalculatorFlow.css';

const nodeTypes = {
  assessment: ({ data }) => (
    <div className="custom-node assessment-node">
      <Handle type="source" position={Position.Right} style={{ background: '#3b82f6' }} />
      <div className="node-header">
        <span className="node-type-badge">Assessment</span>
      </div>
      <div className="node-title">{data.label}</div>
      <div className="node-grade">
        Grade: <strong>{data.grade || 'N/A'}</strong>
      </div>
      {data.detail && (
        <div className="node-detail" title={data.detail}>
          📋 {data.detail.substring(0, 30)}...
        </div>
      )}
    </div>
  ),
  learning: ({ data }) => (
    <div className="custom-node learning-node">
      <Handle type="target" position={Position.Left} style={{ background: '#10b981' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#10b981' }} />
      <div className="node-header">
        <span className="node-type-badge">Learning Outcome</span>
      </div>
      <div className="node-title">{data.label}</div>
      <div className="node-grade">
        Grade: <strong>{data.grade || 'N/A'}</strong>
      </div>
      {data.computedGrade && (
        <div className="node-computed">
          Computed: <strong>{data.computedGrade}</strong>
        </div>
      )}
      {data.detail && (
        <div className="node-detail" title={data.detail}>
          📋 {data.detail.substring(0, 30)}...
        </div>
      )}
    </div>
  ),
  program: ({ data }) => (
    <div className="custom-node program-node">
      <Handle type="target" position={Position.Left} style={{ background: '#f59e0b' }} />
      <div className="node-header">
        <span className="node-type-badge">Program Outcome</span>
      </div>
      <div className="node-title">{data.label}</div>
      {data.computedGrade && (
        <div className="node-computed">
          Computed: <strong>{data.computedGrade}</strong>
        </div>
      )}
      {data.detail && (
        <div className="node-detail" title={data.detail}>
          📋 {data.detail.substring(0, 30)}...
        </div>
      )}
    </div>
  ),
};

const GradeCalculatorFlow = ({
  assessmentComponents,
  learningOutcomeComponents,
  programOutcomeComponents,
  onUpdateAssessment,
  onUpdateLearningOutcome,
  onDeleteConnection,
  onAddConnection,
  setAssessmentComponents,
  setLearningOutcomeComponents
}) => {
  const [connectionModal, setConnectionModal] = useState(null);
  const [selectedPercentage, setSelectedPercentage] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  // Calculate computed grades for learning outcomes
  const calculateLearningOutcomeGrade = (lo) => {
    let totalWeightedGrade = 0;
    
    assessmentComponents.forEach(assessment => {
      const grade = parseFloat((assessment.grades || [])[0] || 0);
      (assessment.connections || [])
        .filter(conn => conn.type === 'learning' && conn.targetId === lo.id)
        .forEach(conn => {
          const pct = parseFloat((assessment.percentages || [])[conn.percentageIndex] || 0);
          const weight = isNaN(pct) ? 0 : pct / 100;
          // Direct sum of contributions (no normalization)
          totalWeightedGrade += grade * weight;
        });
    });
    
    return totalWeightedGrade.toFixed(1);
  };

  // Calculate computed grades for program outcomes
  const calculateProgramOutcomeGrade = (po) => {
    let totalWeightedGrade = 0;
    let totalWeight = 0;

    const loIdToProgramWeights = new Map();
    learningOutcomeComponents.forEach(lo => {
      (lo.connections || [])
        .filter(conn => conn.type === 'program' && conn.targetId === po.id)
        .forEach(conn => {
          const pct = parseFloat((lo.percentages || [])[conn.percentageIndex] || 0);
          const weight = isNaN(pct) ? 0 : pct / 100;
          if (weight > 0) loIdToProgramWeights.set(lo.id, weight);
        });
    });

    assessmentComponents.forEach(assessment => {
      const aGrade = parseFloat((assessment.grades || [])[0] || 0);
      (assessment.connections || [])
        .filter(conn => conn.type === 'learning')
        .forEach(conn => {
          const loWeight = loIdToProgramWeights.get(conn.targetId);
          if (!loWeight) return;
          const aPct = parseFloat((assessment.percentages || [])[conn.percentageIndex] || 0);
          const aWeight = isNaN(aPct) ? 0 : aPct / 100;
          const combined = aWeight * loWeight;
          totalWeightedGrade += aGrade * combined;
          totalWeight += combined;
        });
    });

    // Normalize by total weight to get a grade out of 100
    return totalWeight > 0 ? (totalWeightedGrade / totalWeight).toFixed(1) : '0.0';
  };

  // Create nodes from components
  const initialNodes = useMemo(() => {
    const nodes = [];
    let yOffset = 100;
    const nodeSpacing = 150;

    // Assessment nodes (left side)
    assessmentComponents.forEach((comp, index) => {
      const grade = (comp.grades || [])[0] || 'N/A';
      nodes.push({
        id: `assessment-${comp.id}`,
        type: 'assessment',
        position: { x: 50, y: yOffset + index * nodeSpacing },
        data: {
          label: comp.name,
          grade: grade,
          detail: comp.detail,
          componentId: comp.id,
          type: 'assessment'
        },
      });
    });

    // Learning Outcome nodes (middle)
    yOffset = 100;
    learningOutcomeComponents.forEach((comp, index) => {
      const computedGrade = calculateLearningOutcomeGrade(comp);
      const grade = (comp.grades || [])[0] || computedGrade;
      nodes.push({
        id: `learning-${comp.id}`,
        type: 'learning',
        position: { x: 400, y: yOffset + index * nodeSpacing },
        data: {
          label: comp.name,
          grade: grade,
          computedGrade: computedGrade,
          detail: comp.detail,
          componentId: comp.id,
          type: 'learning'
        },
      });
    });

    // Program Outcome nodes (right side)
    yOffset = 100;
    programOutcomeComponents.forEach((comp, index) => {
      const computedGrade = calculateProgramOutcomeGrade(comp);
      nodes.push({
        id: `program-${comp.id}`,
        type: 'program',
        position: { x: 750, y: yOffset + index * nodeSpacing },
        data: {
          label: comp.name,
          computedGrade: computedGrade,
          detail: comp.detail,
          componentId: comp.id,
          type: 'program'
        },
      });
    });

    return nodes;
  }, [assessmentComponents, learningOutcomeComponents, programOutcomeComponents]);

  // Create edges from connections
  const initialEdges = useMemo(() => {
    const edges = [];

    // Assessment -> Learning Outcome edges
    assessmentComponents.forEach(assessment => {
      const grade = parseFloat((assessment.grades || [])[0] || 0);
      (assessment.connections || [])
        .filter(conn => conn.type === 'learning')
        .forEach(conn => {
          const percentage = (assessment.percentages || [])[conn.percentageIndex] || 0;
          const calculatedValue = grade * (percentage / 100);
          edges.push({
            id: `edge-assessment-${assessment.id}-learning-${conn.targetId}-${conn.percentageIndex}`,
            source: `assessment-${assessment.id}`,
            target: `learning-${conn.targetId}`,
            label: `${percentage}% (${calculatedValue.toFixed(1)})`,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
            data: {
              sourceComponentId: assessment.id,
              targetComponentId: conn.targetId,
              percentageIndex: conn.percentageIndex,
              connectionType: 'learning',
              originalConnection: conn
            },
            style: {
              stroke: '#3b82f6',
              strokeWidth: 2,
            },
          });
        });
    });

    // Learning Outcome -> Program Outcome edges
    learningOutcomeComponents.forEach(lo => {
      const grade = parseFloat((lo.grades || [])[0] || calculateLearningOutcomeGrade(lo) || 0);
      (lo.connections || [])
        .filter(conn => conn.type === 'program')
        .forEach(conn => {
          const percentage = (lo.percentages || [])[conn.percentageIndex] || 0;
          const calculatedValue = grade * (percentage / 100);
          edges.push({
            id: `edge-learning-${lo.id}-program-${conn.targetId}-${conn.percentageIndex}`,
            source: `learning-${lo.id}`,
            target: `program-${conn.targetId}`,
            label: `${percentage}% (${calculatedValue.toFixed(1)})`,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
            data: {
              sourceComponentId: lo.id,
              targetComponentId: conn.targetId,
              percentageIndex: conn.percentageIndex,
              connectionType: 'program',
              originalConnection: conn
            },
            style: {
              stroke: '#10b981',
              strokeWidth: 2,
            },
          });
        });
    });

    return edges;
  }, [assessmentComponents, learningOutcomeComponents, programOutcomeComponents]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when components change
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Update edges when connections change
  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback((params) => {
    // Prevent default connection
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);
    
    if (!sourceNode || !targetNode) return false;

    // Validate connection types
    // Assessment -> Learning Outcome
    if (sourceNode.data.type === 'assessment' && targetNode.data.type === 'learning') {
      setConnectionModal({
        sourceNode: sourceNode,
        targetType: 'learning',
        targets: learningOutcomeComponents.filter(lo => lo.id === targetNode.data.componentId),
        targetNode: targetNode
      });
      return false; // Prevent auto-connection, we'll handle it via modal
    }
    
    // Learning Outcome -> Program Outcome
    if (sourceNode.data.type === 'learning' && targetNode.data.type === 'program') {
      setConnectionModal({
        sourceNode: sourceNode,
        targetType: 'program',
        targets: programOutcomeComponents.filter(po => po.id === targetNode.data.componentId),
        targetNode: targetNode
      });
      return false; // Prevent auto-connection, we'll handle it via modal
    }

    // Invalid connection
    return false;
  }, [nodes, learningOutcomeComponents, programOutcomeComponents]);

  const onEdgeClick = useCallback((event, edge) => {
    // Allow deleting edges by clicking
    if (window.confirm('Bu bağlantıyı silmek istediğinizden emin misiniz?')) {
      if (onDeleteConnection && edge.data) {
        const { sourceComponentId, targetComponentId, percentageIndex, connectionType } = edge.data;
        onDeleteConnection(sourceComponentId, targetComponentId, percentageIndex, connectionType);
      }
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
  }, [onDeleteConnection, setEdges]);

  const handleAddConnection = () => {
    if (!connectionModal || !selectedPercentage) return;

    const { sourceNode, targetNode } = connectionModal;
    
    // Use targetNode if available (from drag connection), otherwise use selectedTarget
    const targetId = targetNode ? targetNode.data.componentId : (selectedTarget ? parseInt(selectedTarget) : null);
    if (!targetId) return;
    
    if (sourceNode.data.type === 'assessment') {
      const assessment = assessmentComponents.find(c => c.id === sourceNode.data.componentId);
      if (!assessment) return;

      let percentageIndex;
      const percentageNum = parseFloat(selectedPercentage);
      
      // Check if selectedPercentage is a valid index (when selecting from dropdown)
      // or a new percentage value (when entering manually)
      const existingPercentages = assessment.percentages || [];
      
      if (!isNaN(percentageNum) && percentageNum >= 0 && percentageNum <= 100) {
        // It's a percentage value (new or existing)
        const existingIndex = existingPercentages.findIndex(p => p === percentageNum);
        if (existingIndex >= 0) {
          percentageIndex = existingIndex;
        } else {
          // Add new percentage and connection in one update
          percentageIndex = existingPercentages.length;
          const updatedAssessment = {
            ...assessment,
            percentages: [...existingPercentages, percentageNum],
            connections: [
              ...(assessment.connections || []),
              {
                type: 'learning',
                gradeIndex: 0,
                percentageIndex: percentageIndex,
                targetId: targetId
              }
            ]
          };
          setAssessmentComponents(prev =>
            prev.map(comp => comp.id === assessment.id ? updatedAssessment : comp)
          );
          setConnectionModal(null);
          setSelectedPercentage('');
          setSelectedTarget('');
          return;
        }
      } else {
        // It's an index string from dropdown
        percentageIndex = parseInt(selectedPercentage);
        if (isNaN(percentageIndex) || percentageIndex < 0 || percentageIndex >= existingPercentages.length) {
          return;
        }
      }

      const updatedAssessment = {
        ...assessment,
        connections: [
          ...(assessment.connections || []),
          {
            type: 'learning',
            gradeIndex: 0,
            percentageIndex: percentageIndex,
            targetId: targetId
          }
        ]
      };
      setAssessmentComponents(prev =>
        prev.map(comp => comp.id === assessment.id ? updatedAssessment : comp)
      );
    } else if (sourceNode.data.type === 'learning') {
      const lo = learningOutcomeComponents.find(c => c.id === sourceNode.data.componentId);
      if (!lo) return;

      let percentageIndex;
      const percentageNum = parseFloat(selectedPercentage);
      const existingPercentages = lo.percentages || [];
      
      if (!isNaN(percentageNum) && percentageNum >= 0 && percentageNum <= 100) {
        const existingIndex = existingPercentages.findIndex(p => p === percentageNum);
        if (existingIndex >= 0) {
          percentageIndex = existingIndex;
        } else {
          // Add new percentage and connection in one update
          percentageIndex = existingPercentages.length;
          const updatedLO = {
            ...lo,
            percentages: [...existingPercentages, percentageNum],
            connections: [
              ...(lo.connections || []),
              {
                type: 'program',
                gradeIndex: 0,
                percentageIndex: percentageIndex,
                targetId: targetId
              }
            ]
          };
          setLearningOutcomeComponents(prev =>
            prev.map(comp => comp.id === lo.id ? updatedLO : comp)
          );
          setConnectionModal(null);
          setSelectedPercentage('');
          setSelectedTarget('');
          return;
        }
      } else {
        percentageIndex = parseInt(selectedPercentage);
        if (isNaN(percentageIndex) || percentageIndex < 0 || percentageIndex >= existingPercentages.length) {
          return;
        }
      }

      const updatedLO = {
        ...lo,
        connections: [
          ...(lo.connections || []),
          {
            type: 'program',
            gradeIndex: 0,
            percentageIndex: percentageIndex,
            targetId: targetId
          }
        ]
      };
      setLearningOutcomeComponents(prev =>
        prev.map(comp => comp.id === lo.id ? updatedLO : comp)
      );
    }

    setConnectionModal(null);
    setSelectedPercentage('');
    setSelectedTarget('');
  };

  const onNodeClick = useCallback((event, node) => {
    // Only allow connections from assessment to learning, and learning to program
    if (node.data.type === 'assessment') {
      setConnectionModal({
        sourceNode: node,
        targetType: 'learning',
        targets: learningOutcomeComponents
      });
    } else if (node.data.type === 'learning') {
      setConnectionModal({
        sourceNode: node,
        targetType: 'program',
        targets: programOutcomeComponents
      });
    }
  }, [learningOutcomeComponents, programOutcomeComponents]);

  return (
    <>
      <div className="grade-calculator-flow" style={{ width: '100%', height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {connectionModal && (
        <div className="connection-modal-overlay" onClick={() => setConnectionModal(null)}>
          <div className="connection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Connection</h3>
              <button className="close-button" onClick={() => setConnectionModal(null)}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Percentage (%):</label>
                {(() => {
                  const sourceComponent = connectionModal.sourceNode.data.type === 'assessment'
                    ? assessmentComponents.find(c => c.id === connectionModal.sourceNode.data.componentId)
                    : learningOutcomeComponents.find(c => c.id === connectionModal.sourceNode.data.componentId);
                  const existingPercentages = (sourceComponent?.percentages || []);
                  
                  if (existingPercentages.length > 0) {
                    return (
                      <select
                        value={selectedPercentage}
                        onChange={(e) => setSelectedPercentage(e.target.value)}
                      >
                        <option value="">Select or enter new percentage...</option>
                        {existingPercentages.map((pct, idx) => (
                          <option key={idx} value={idx}>
                            Use existing: {pct}%
                          </option>
                        ))}
                      </select>
                    );
                  }
                  return (
                    <input
                      type="number"
                      value={selectedPercentage}
                      onChange={(e) => setSelectedPercentage(e.target.value)}
                      placeholder="Enter percentage"
                      min="0"
                      max="100"
                    />
                  );
                })()}
                {(() => {
                  const sourceComponent = connectionModal.sourceNode.data.type === 'assessment'
                    ? assessmentComponents.find(c => c.id === connectionModal.sourceNode.data.componentId)
                    : learningOutcomeComponents.find(c => c.id === connectionModal.sourceNode.data.componentId);
                  const existingPercentages = (sourceComponent?.percentages || []);
                  const isIndex = existingPercentages.length > 0 && selectedPercentage && !isNaN(parseInt(selectedPercentage)) && parseInt(selectedPercentage) >= 0 && parseInt(selectedPercentage) < existingPercentages.length;
                  
                  if (existingPercentages.length > 0 && !isIndex) {
                    return (
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Or enter new percentage value: </span>
                        <input
                          type="number"
                          value={isIndex ? '' : selectedPercentage}
                          onChange={(e) => {
                            const val = e.target.value;
                            // Only set if it's a number (not an index)
                            if (!val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100)) {
                              setSelectedPercentage(val);
                            }
                          }}
                          placeholder="New percentage"
                          min="0"
                          max="100"
                          style={{ width: '150px', marginLeft: '8px' }}
                        />
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              <div className="form-group">
                <label>Target:</label>
                {connectionModal.targetNode ? (
                  <div style={{ padding: '10px', background: '#f3f4f6', borderRadius: '6px', color: '#374151', fontWeight: '500' }}>
                    {connectionModal.targetNode.data.label}
                  </div>
                ) : (
                  <select
                    value={selectedTarget}
                    onChange={(e) => setSelectedTarget(e.target.value)}
                  >
                    <option value="">Select target...</option>
                    {connectionModal.targets.map(target => (
                      <option key={target.id} value={target.id}>
                        {target.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="modal-actions">
                <button
                  className="submit-button"
                  onClick={handleAddConnection}
                  disabled={!selectedPercentage || (!connectionModal.targetNode && !selectedTarget)}
                >
                  Create Connection
                </button>
                <button
                  className="cancel-button"
                  onClick={() => {
                    setConnectionModal(null);
                    setSelectedPercentage('');
                    setSelectedTarget('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GradeCalculatorFlow;

