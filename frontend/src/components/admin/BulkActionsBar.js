import { useState } from 'react';

const BulkActionsBar = ({
    selectedCount,
    studentOptions,
    onBulkUpdate,
    onClearSelection
}) => {
    const [selectedAction, setSelectedAction] = useState('');
    const [selectedValue, setSelectedValue] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApply = async () => {
        if (!selectedAction) {
            alert('Lütfen bir işlem seçin');
            return;
        }

        // For delete, we don't need a value
        if (selectedAction === 'delete') {
            if (!window.confirm(`Seçili ${selectedCount} öğrenciyi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
                return;
            }
        } else {
            if (!selectedValue) {
                alert('Lütfen bir değer seçin');
                return;
            }

            if (!window.confirm(`Seçili ${selectedCount} öğrencinin ${getActionLabel(selectedAction)} değerini "${selectedValue}" olarak değiştirmek istediğinizden emin misiniz?`)) {
                return;
            }
        }

        setIsProcessing(true);
        try {
            await onBulkUpdate(selectedAction, selectedValue);
            setSelectedAction('');
            setSelectedValue('');
        } catch (error) {
            console.error('Bulk update error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const getActionLabel = (action) => {
        const labels = {
            major: 'Bölüm',
            cohort: 'Sınıf',
            advisor: 'Danışman',
            delete: 'Öğrencileri'
        };
        return labels[action] || action;
    };

    const getOptionsForAction = (action) => {
        if (action === 'delete') return []; // Delete doesn't need value selection

        switch (action) {
            case 'major':
                return studentOptions.majors;
            case 'cohort':
                return studentOptions.cohorts;
            case 'advisor':
                return studentOptions.advisors;
            default:
                return [];
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t-2 border-brand-500 shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between gap-4">
                    {/* Selection Info */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-500/20">
                            <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                                {selectedCount}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {selectedCount} öğrenci seçildi
                            </p>
                            <button
                                onClick={onClearSelection}
                                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                Seçimi temizle
                            </button>
                        </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-3 flex-1 max-w-2xl">
                        {/* Action Selector */}
                        <select
                            value={selectedAction}
                            onChange={(e) => {
                                setSelectedAction(e.target.value);
                                setSelectedValue('');
                            }}
                            disabled={isProcessing}
                            className="px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 disabled:opacity-50"
                        >
                            <option value="">İşlem Seçin...</option>
                            <option value="major">Bölüm Değiştir</option>
                            <option value="cohort">Sınıf Değiştir</option>
                            <option value="advisor">Danışman Değiştir</option>
                            <option value="delete" className="text-rose-600">🗑️ Öğrencileri Sil</option>
                        </select>

                        {/* Value Selector - Hide for delete */}
                        {selectedAction && selectedAction !== 'delete' && (
                            <select
                                value={selectedValue}
                                onChange={(e) => setSelectedValue(e.target.value)}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 disabled:opacity-50"
                            >
                                <option value="">Değer Seçin...</option>
                                {getOptionsForAction(selectedAction).map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Apply Button */}
                        <button
                            onClick={handleApply}
                            disabled={!selectedAction || (selectedAction !== 'delete' && !selectedValue) || isProcessing}
                            className={`px-6 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${selectedAction === 'delete'
                                    ? 'bg-rose-600 hover:bg-rose-700'
                                    : 'bg-brand-600 hover:bg-brand-700'
                                }`}
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    İşleniyor...
                                </>
                            ) : (
                                'Uygula'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkActionsBar;
