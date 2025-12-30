import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

const BulkStudentUpload = ({ onClose, onUploadComplete }) => {
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [uploadResults, setUploadResults] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };

    const handleFileInputChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            handleFileSelect(selectedFile);
        }
    };

    const handleFileSelect = (selectedFile) => {
        setError(null);
        setParsedData([]);
        setUploadResults(null);

        // Check file type
        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
            setError('Geçersiz dosya tipi. Lütfen .xlsx, .xls veya .csv dosyası yükleyin.');
            return;
        }

        setFile(selectedFile);

        // Parse the file
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first sheet
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    setError('Dosya boş veya geçerli veri içermiyor.');
                    return;
                }

                // Map Turkish column names to backend field names
                const mappedData = jsonData.map((row, index) => {
                    // Handle both possible column name formats
                    const studentNo = row['Öğrenci No_0833AB'] || row['Öğrenci No'] || row['student_id'] || '';
                    const firstName = row['Adı_0833AB'] || row['Adı'] || row['name'] || '';
                    const lastName = row['Soyadı_0833AB'] || row['Soyadı'] || row['surname'] || '';
                    const cohort = row['Snf_0833AB'] || row['Snf'] || row['cohort'] || '';
                    const major = row['Bölüm'] || row['major'] || '';
                    const advisor = row['Danışman'] || row['advisor'] || '';
                    const email = row['Email'] || row['email'] || '';

                    // Combine first name and last name
                    const fullName = `${firstName} ${lastName}`.trim();

                    // Validate required fields
                    if (!studentNo || !fullName) {
                        console.warn(`Row ${index + 1}: Missing student_id or name`, row);
                    }

                    return {
                        student_id: String(studentNo).trim(),
                        name: fullName,
                        email: email || `${studentNo}@student.edu.tr`, // Generate email if not provided
                        major: String(major).trim() || '',
                        cohort: String(cohort).trim() || '',
                        advisor: String(advisor).trim() || '',
                        _rowIndex: index + 1 // For error reporting
                    };
                }).filter(student => student.student_id && student.name); // Filter out invalid rows

                if (mappedData.length === 0) {
                    setError('Dosyada geçerli öğrenci verisi bulunamadı. Gerekli sütunlar: Öğrenci No_0833AB, Adı_0833AB, Soyadı_0833AB');
                    return;
                }

                setParsedData(mappedData);
                console.log('Parsed student data:', mappedData);
            } catch (err) {
                console.error('Error parsing file:', err);
                setError('Dosya okunurken hata oluştu: ' + err.message);
            }
        };

        reader.onerror = () => {
            setError('Dosya okunamadı.');
        };

        reader.readAsArrayBuffer(selectedFile);
    };

    const handleUpload = async () => {
        if (parsedData.length === 0) {
            setError('Yüklenecek veri yok.');
            return;
        }

        setIsUploading(true);
        setError(null);
        setUploadProgress({ current: 0, total: parsedData.length });

        try {
            const { default: adminService } = await import('../../services/adminService');

            const results = await adminService.bulkCreateStudents(
                parsedData,
                (progress) => {
                    setUploadProgress(progress);
                }
            );

            setUploadResults(results);
            setIsUploading(false);

            // If all successful, call onUploadComplete after a short delay
            if (results.failed.length === 0) {
                setTimeout(() => {
                    onUploadComplete && onUploadComplete(results);
                }, 2000);
            }
        } catch (err) {
            console.error('Bulk upload error:', err);
            setError('Toplu yükleme sırasında hata oluştu: ' + err.message);
            setIsUploading(false);
        }
    };

    const calculateProgress = () => {
        if (!uploadProgress) return 0;
        return Math.round((uploadProgress.current / uploadProgress.total) * 100);
    };

    return (
        <div className="space-y-4">
            {/* File Upload Area */}
            {!parsedData.length && !uploadResults && (
                <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragging
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                            : 'border-slate-300 dark:border-slate-700 hover:border-brand-400'
                        }`}
                >
                    <div className="space-y-4">
                        <div className="text-4xl">📄</div>
                        <div>
                            <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                Excel veya CSV dosyasını sürükleyip bırakın
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                veya dosya seçmek için tıklayın
                            </p>
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-lg bg-brand-600 hover:bg-brand-700"
                        >
                            Dosya Seç
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileInputChange}
                            className="hidden"
                        />
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            <strong>Beklenen sütunlar:</strong> Öğrenci No_0833AB, Adı_0833AB, Soyadı_0833AB, Snf_0833AB
                        </p>
                    </div>
                </div>
            )}

            {/* File Info and Preview */}
            {file && parsedData.length > 0 && !uploadResults && (
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{file.name}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {parsedData.length} öğrenci bulundu
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setFile(null);
                                    setParsedData([]);
                                    setError(null);
                                }}
                                className="text-sm text-rose-600 hover:text-rose-700 dark:text-rose-400"
                            >
                                Kaldır
                            </button>
                        </div>
                    </div>

                    {/* Data Preview */}
                    <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left font-semibold">Öğrenci No</th>
                                    <th className="px-3 py-2 text-left font-semibold">Ad Soyad</th>
                                    <th className="px-3 py-2 text-left font-semibold">Email</th>
                                    <th className="px-3 py-2 text-left font-semibold">Sınıf</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {parsedData.slice(0, 10).map((student, index) => (
                                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-3 py-2">{student.student_id}</td>
                                        <td className="px-3 py-2">{student.name}</td>
                                        <td className="px-3 py-2 text-xs">{student.email}</td>
                                        <td className="px-3 py-2">{student.cohort || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {parsedData.length > 10 && (
                            <div className="p-2 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800">
                                +{parsedData.length - 10} öğrenci daha...
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Upload Progress */}
            {isUploading && uploadProgress && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-900 dark:text-white">Yükleniyor...</span>
                        <span className="text-slate-600 dark:text-slate-400">
                            {uploadProgress.current} / {uploadProgress.total}
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                        <div
                            className="bg-brand-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${calculateProgress()}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {uploadProgress.success !== undefined && uploadProgress.student && (
                            uploadProgress.success
                                ? `✓ ${uploadProgress.student.name} eklendi`
                                : `✗ ${uploadProgress.student.name} eklenemedi: ${uploadProgress.error}`
                        )}
                    </p>
                </div>
            )}

            {/* Upload Results */}
            {uploadResults && (
                <div className="space-y-3">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                        <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                            ✓ {uploadResults.successful.length} öğrenci başarıyla eklendi
                        </p>
                    </div>

                    {uploadResults.failed.length > 0 && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 rounded-lg border border-rose-200 dark:border-rose-500/20">
                            <p className="font-semibold text-rose-900 dark:text-rose-300 mb-2">
                                ✗ {uploadResults.failed.length} öğrenci eklenemedi
                            </p>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                                {uploadResults.failed.map((failure, index) => (
                                    <p key={index} className="text-xs text-rose-700 dark:text-rose-400">
                                        • {failure.student.name} ({failure.student.student_id}): {failure.error}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-3 text-sm text-rose-600 bg-rose-50 rounded-lg dark:bg-rose-500/10 dark:text-rose-400">
                    {error}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    disabled={isUploading}
                >
                    {uploadResults ? 'Kapat' : 'İptal'}
                </button>
                {parsedData.length > 0 && !uploadResults && (
                    <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? 'Yükleniyor...' : `${parsedData.length} Öğrenciyi Yükle`}
                    </button>
                )}
            </div>
        </div>
    );
};

export default BulkStudentUpload;
