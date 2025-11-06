import React, { useState } from 'react';
import './ComponentSection.css';
import Tooltip from './Tooltip';

const ComponentSection = ({
  title,
  items,
  isCollapsed,
  setIsCollapsed,
  onAddItem,
  onRemoveItem,
  addButtonText,
  placeholder,
  showDetail = false,
  detailPlaceholder = "",
  showAddButton = true,
  isStatic = false
}) => {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [detailValue, setDetailValue] = useState('');
  const [showDetailInput, setShowDetailInput] = useState(false);

  const handleAddClick = () => {
    if (!showInput) {
      setShowInput(true);
      return;
    }

    // Step 1: require name before moving to detail step
    if (showDetail && !showDetailInput) {
      if (!inputValue) return; // don't advance without a name
      setShowDetailInput(true);
      return;
    }

    // Step 2: perform add (require detail if configured)
    if (onAddItem) {
      if (showDetail) {
        onAddItem(inputValue, detailValue);
      } else {
        onAddItem(inputValue);
      }
    }

    // Reset form
    setInputValue('');
    setDetailValue('');
    setShowInput(false);
    setShowDetailInput(false);
  };

  const handleCancel = () => {
    setInputValue('');
    setDetailValue('');
    setShowInput(false);
    setShowDetailInput(false);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="component-section">
      {/* Section Header */}
      <div className="section-header" onClick={toggleCollapse}>
        <div className="section-title">
          <div className={`collapse-arrow ${isCollapsed ? 'collapsed' : ''}`}>
            ▼
          </div>
          <span>{title}</span>
        </div>
        {showAddButton && !isStatic && (
          <button 
            className="add-button"
            onClick={(e) => {
              e.stopPropagation();
              handleAddClick();
            }}
          >
            +
          </button>
        )}
      </div>

      {/* Section Content */}
      {!isCollapsed && (
        <div className="section-content">
          {/* Input Form */}
          {showInput && (
            <div className="input-form">
              <div className="input-group">
                <input
                  type="text"
                  placeholder={placeholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="name-input"
                />
                {showDetailInput && (
                  <input
                    type="text"
                    placeholder={detailPlaceholder}
                    value={detailValue}
                    onChange={(e) => setDetailValue(e.target.value)}
                    className="detail-input"
                  />
                )}
                <div className="input-buttons">
                  <button 
                    className="confirm-button"
                    onClick={handleAddClick}
                    disabled={
                      (!showDetail && !inputValue) ||
                      (showDetail && !showDetailInput && !inputValue) ||
                      (showDetail && showDetailInput && (!inputValue || !detailValue))
                    }
                  >
                    {showDetail && !showDetailInput ? 'Next' : 'Add'}
                  </button>
                  <button 
                    className="cancel-button"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="items-list">
            {items.map((item) => (
              <div key={item.id} className="component-item">
                <div className="item-content">
                  <span className="item-name">{item.name}</span>
                  {showDetail && item.detail && (
                    <div className="item-detail">
                      <Tooltip content={item.detail} position="top">
                        <div className="detail-icon">
                          📋
                        </div>
                      </Tooltip>
                      {!isStatic && (
                        <button className="change-button">Change</button>
                      )}
                    </div>
                  )}
                </div>
                {!isStatic && (
                  <div className="item-actions">
                    <button 
                      className="delete-button"
                      onClick={() => onRemoveItem && onRemoveItem(item.id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentSection;
