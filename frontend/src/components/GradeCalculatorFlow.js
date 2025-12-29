import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
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
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);
  const reactFlowInstance = useRef(null);
  const hasFittedView = useRef(false);
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
        });
    });

    return totalWeightedGrade.toFixed(1);
  };

  // Calculate bounds for both panning and node dragging - same limits for both
  const bounds = useMemo(() => {
    const nodeWidth = 200;
    const nodeHeight = 120;
    const nodeSpacing = 150;
    const startY = 100;
    
    // Find max node count
    const maxCount = Math.max(
      assessmentComponents.length,
      learningOutcomeComponents.length,
      programOutcomeComponents.length,
      1
    );
    
    // Calculate content area
    const contentMinX = 50;
    const contentMaxX = 750 + nodeWidth;
    const contentMinY = startY;
    const contentMaxY = startY + (maxCount - 1) * nodeSpacing + nodeHeight;
    
    // Add reasonable padding (2x content size) - same for both panning and node dragging
    const paddingMultiplier = 2;
    const contentWidth = contentMaxX - contentMinX;
    const contentHeight = contentMaxY - contentMinY;
    
    const paddingX = contentWidth * paddingMultiplier;
    const paddingY = contentHeight * paddingMultiplier;
    
    const minX = contentMinX - paddingX;
    const maxX = contentMaxX + paddingX;
    const minY = contentMinY - paddingY;
    const maxY = contentMaxY + paddingY;
    
    return {
      panBounds: {
        minX,
        maxX,
        minY,
        maxY
      },
      nodeExtent: [
        [minX, minY],
        [maxX, maxY]
      ]
    };
  }, [assessmentComponents.length, learningOutcomeComponents.length, programOutcomeComponents.length]);

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
          grade: (comp.grades || [])[0] || computedGrade,
          computedGrade,
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

  // Update nodes when components change, but preserve existing positions
  React.useEffect(() => {
    setNodes((currentNodes) => {
      // Create a map of existing node positions
      const positionMap = new Map();
      currentNodes.forEach(node => {
        positionMap.set(node.id, { x: node.position.x, y: node.position.y });
      });

      // Merge initial nodes with preserved positions
      return initialNodes.map(newNode => {
        const existingPosition = positionMap.get(newNode.id);
        if (existingPosition) {
          // Preserve existing position
          return { ...newNode, position: existingPosition };
        }
        // Use initial position for new nodes
        return newNode;
      });
    });
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
    // Show confirmation modal for deleting edges
    if (edge.data) {
      setDeleteConfirmModal(edge);
    }
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirmModal) return;
    
    if (onDeleteConnection && deleteConfirmModal.data) {
      const { sourceComponentId, targetComponentId, percentageIndex, connectionType } = deleteConfirmModal.data;
      onDeleteConnection(sourceComponentId, targetComponentId, percentageIndex, connectionType);
    }
    setEdges((eds) => eds.filter((e) => e.id !== deleteConfirmModal.id));
    setDeleteConfirmModal(null);
  }, [deleteConfirmModal, onDeleteConnection, setEdges]);

  const handleAddConnection = useCallback(() => {
    if (!connectionModal || selectedPercentage === '') return;

    const { sourceNode, targetNode } = connectionModal;
    
    // Use targetNode if available (from drag connection), otherwise use selectedTarget
    const targetId = targetNode ? targetNode.data.componentId : (selectedTarget ? parseInt(selectedTarget) : null);
    if (!targetId) return;
    
    const parsedPercentage = parseFloat(selectedPercentage);
    if (Number.isNaN(parsedPercentage)) return;

    const clampedPercentage = Math.max(0, Math.min(100, parsedPercentage));

    if (sourceNode.data.type === 'assessment') {
      const assessment = assessmentComponents.find(c => c.id === sourceNode.data.componentId);
      if (!assessment) return;

      const existingPercentages = assessment.percentages || [];
      const existingIndex = existingPercentages.findIndex(p => p === clampedPercentage);
      const percentageIndex = existingIndex >= 0 ? existingIndex : existingPercentages.length;

      const updatedAssessment = {
        ...assessment,
        percentages: existingIndex >= 0
          ? existingPercentages
          : [...existingPercentages, clampedPercentage],
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

      const existingPercentages = lo.percentages || [];
      const existingIndex = existingPercentages.findIndex(p => p === clampedPercentage);
      const percentageIndex = existingIndex >= 0 ? existingIndex : existingPercentages.length;

      const updatedLO = {
        ...lo,
        percentages: existingIndex >= 0
          ? existingPercentages
          : [...existingPercentages, clampedPercentage],
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
  }, [connectionModal, selectedPercentage, selectedTarget, assessmentComponents, learningOutcomeComponents, setAssessmentComponents, setLearningOutcomeComponents]);

  // Handle keyboard shortcuts for connection modal
  useEffect(() => {
    if (!connectionModal) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        // Only trigger if form is valid
        if (selectedPercentage && (connectionModal.targetNode || selectedTarget)) {
          handleAddConnection();
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setConnectionModal(null);
        setSelectedPercentage('');
        setSelectedTarget('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [connectionModal, selectedPercentage, selectedTarget, handleAddConnection]);

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
          connectionRadius={180}
          onInit={(instance) => {
            reactFlowInstance.current = instance;
            // Only fit view on first initialization
            if (!hasFittedView.current) {
              instance.fitView({ padding: 0.2, duration: 0 });
              hasFittedView.current = true;
            }
          }}
          minZoom={0.1}
          maxZoom={2}
          translateExtent={[[bounds.panBounds.minX, bounds.panBounds.minY], [bounds.panBounds.maxX, bounds.panBounds.maxY]]}
          nodeExtent={bounds.nodeExtent}
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
                <input
                  type="number"
                  value={selectedPercentage}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setSelectedPercentage('');
                      return;
                    }
                    const num = parseFloat(val);
                    if (Number.isNaN(num)) return;
                    if (num < 0) {
                      setSelectedPercentage('0');
                    } else if (num > 100) {
                      setSelectedPercentage('100');
                    } else {
                      setSelectedPercentage(val);
                    }
                  }}
                  placeholder="Enter percentage"
                  min="0"
                  max="100"
                />
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

      {deleteConfirmModal && (
        <div className="connection-modal-overlay" onClick={() => setDeleteConfirmModal(null)}>
          <div className="connection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Connection</h3>
              <button className="close-button" onClick={() => setDeleteConfirmModal(null)}>×</button>
            </div>
            <div className="modal-content">
              <p style={{ marginBottom: '20px', color: '#374151' }}>
              Are you sure you want to delete this link?
              </p>
              <div className="modal-actions">
                <button
                  className="submit-button"
                  onClick={handleConfirmDelete}
                  style={{ backgroundColor: '#ef4444' }}
                >
                  Delete
                </button>
                <button
                  className="cancel-button"
                  onClick={() => setDeleteConfirmModal(null)}
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

