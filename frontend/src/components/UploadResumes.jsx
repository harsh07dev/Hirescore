import React, { useState, useRef } from 'react';

const UploadResumes = ({ jobId, onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setError('');
    setSuccessCount(null);
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one PDF file.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessCount(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('resumes', file));

      const response = await fetch(
        `http://127.0.0.1:5000/api/jobs/${jobId}/upload`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed (${response.status})`);
      }

      const results = await response.json();
      const uploaded = results.filter((r) => !r.skipped);
      const skipped = results.filter((r) => r.skipped);

      setSuccessCount({ uploaded: uploaded.length, skipped: skipped.length });

      // Clear file selection
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      setError(err.message || 'Something went wrong during upload.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setSuccessCount(null);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-1">Upload Resumes</h2>
      <p className="text-sm text-gray-400 mb-5">
        Select one or more PDF resumes to screen for this job.
      </p>

      {/* File Input */}
      <label
        htmlFor="resume-upload"
        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-md cursor-pointer hover:border-blue-500 hover:bg-gray-700/40 transition duration-150"
      >
        <svg
          className="w-8 h-8 text-gray-400 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3"
          />
        </svg>
        <span className="text-sm text-gray-400">
          <span className="text-blue-400 font-medium">Click to browse</span> or drag &amp; drop
        </span>
        <span className="text-xs text-gray-500 mt-1">PDF files only</span>
        <input
          ref={fileInputRef}
          id="resume-upload"
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <ul className="mt-4 space-y-2">
          {selectedFiles.map((file, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded-md text-sm text-gray-200"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg
                  className="w-4 h-4 text-red-400 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 000 2h4a1 1 0 000-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="truncate">{file.name}</span>
                <span className="text-gray-500 flex-shrink-0">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                onClick={() => handleRemoveFile(idx)}
                className="ml-3 text-gray-500 hover:text-red-400 transition flex-shrink-0"
                title="Remove"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 flex items-start gap-2 bg-red-900/30 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-md">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Success Message */}
      {successCount !== null && (
        <div className="mt-4 flex items-start gap-2 bg-green-900/30 border border-green-700 text-green-300 text-sm px-4 py-3 rounded-md">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            <span className="font-medium">{successCount.uploaded} resume{successCount.uploaded !== 1 ? 's' : ''}</span> uploaded successfully.
            {successCount.skipped > 0 && (
              <span className="text-yellow-400 ml-1">
                {successCount.skipped} file{successCount.skipped !== 1 ? 's' : ''} could not be processed and were skipped.
              </span>
            )}
          </span>
        </div>
      )}

      {/* Upload Button */}
      <button
        id="upload-screen-btn"
        onClick={handleUpload}
        disabled={loading || selectedFiles.length === 0}
        className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Uploading...
          </>
        ) : (
          `Upload & Screen${selectedFiles.length > 0 ? ` (${selectedFiles.length})` : ''}`
        )}
      </button>
    </div>
  );
};

export default UploadResumes;
