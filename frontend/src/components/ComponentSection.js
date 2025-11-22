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
  onRenameItem,
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
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const isConfirmDisabled = (
    (!showDetail && !(inputValue || '').trim()) ||
    (showDetail && !showDetailInput && !(inputValue || '').trim()) ||
    (showDetail && showDetailInput && (!(inputValue || '').trim() || !detailValue))
  );

  const handleAddClick = () => {
    if (!showInput) {
      setShowInput(true);
      return;
    }

    // Step 1: require name before moving to detail step
    if (showDetail && !showDetailInput) {
      if (!(inputValue || '').trim()) return; // don't advance without a name
      setShowDetailInput(true);
      return;
    }

    // Step 2: perform add (require detail if configured)
    if (onAddItem) {
      const trimmedName = (inputValue || '').trim();
      if (!trimmedName) return;
      if (showDetail) {
        onAddItem(trimmedName, detailValue);
      } else {
        onAddItem(trimmedName);
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

  const startEditItem = (item) => {
    setEditingItemId(item.id);
    setEditingValue(item.name);
  };

  const cancelEditItem = () => {
    setEditingItemId(null);
    setEditingValue('');
  };

  const saveEditItem = () => {
    const trimmed = (editingValue || '').trim();
    if (!trimmed || !onRenameItem || editingItemId == null) return;
    onRenameItem(editingItemId, trimmed);
    cancelEditItem();
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!isConfirmDisabled) {
                        handleAddClick();
                      }
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      handleCancel();
                    }
                  }}
                  className="name-input"
                />
                {showDetailInput && (
                  <input
                    type="text"
                    placeholder={detailPlaceholder}
                    value={detailValue}
                    onChange={(e) => setDetailValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!isConfirmDisabled) {
                          handleAddClick();
                        }
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancel();
                      }
                    }}
                    className="detail-input"
                  />
                )}
                <div className="input-buttons">
                  <button 
                    className="confirm-button"
                    onClick={handleAddClick}
                    disabled={isConfirmDisabled}
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
                {editingItemId === item.id ? (
                  <div className="item-editing">
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="edit-name-input"
                      placeholder="Enter new name"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="edit-actions">
                      <button
                        className="small-button save"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveEditItem();
                        }}
                        disabled={!editingValue.trim()}
                      >
                        Save
                      </button>
                      <button
                        className="small-button cancel"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEditItem();
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="item-content">
                    <span className="item-name">{item.name}</span>
                    {showDetail && item.detail && (
                      <div className="item-detail">
                        <Tooltip content={item.detail} position="top">
                          <div className="detail-icon">
                            📋
                          </div>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                )}
                {!isStatic && (
                  <div className="item-actions">
                    {editingItemId !== item.id && (
                      <button
                        className="edit-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditItem(item);
                        }}
                        title="Rename"
                      >
                        ✎
                      </button>
                    )}
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
