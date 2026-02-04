import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import useStore from '../store/useStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function PDFUpload({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(null); // 'success' | 'error'
  const [message, setMessage] = useState('');
  const { addSubject } = useStore();

  const processUpload = async (file) => {
    setUploading(true);
    setProgress(10);
    setStatus(null);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      setProgress(30);
      setMessage('Uploading file...');

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      setProgress(60);
      setMessage('Extracting text...');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Upload failed');
      }

      const result = await response.json();
      setProgress(80);
      setMessage('Generating syllabus...');

      // Create new subject from PDF
      const subjectName = file.name.replace('.pdf', '').replace(/[_-]/g, ' ');
      const newSubject = {
        id: crypto.randomUUID(),
        name: result.data.name || subjectName,
        description: `Generated from: ${file.name}`,
        topics: result.data.syllabus?.topics || result.data.topics || [],
        content: result.data.content?.substring(0, 50000) || '', // Store first 50k chars
        documentId: result.data.id,
        createdAt: new Date().toISOString(),
        metadata: {
          pageCount: result.data.pageCount,
          wordCount: result.data.textLength,
          source: 'pdf',
        },
      };

      addSubject(newSubject);
      setProgress(100);
      setStatus('success');
      setMessage(`Successfully created "${subjectName}" with ${newSubject.topics.length} topics`);

      if (onUploadComplete) {
        onUploadComplete(newSubject);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/pdf') {
      processUpload(file);
    } else {
      setStatus('error');
      setMessage('Please upload a PDF file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: uploading,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
          }
          ${uploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          {uploading ? (
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          ) : status === 'success' ? (
            <CheckCircle className="w-12 h-12 text-green-500" />
          ) : status === 'error' ? (
            <AlertCircle className="w-12 h-12 text-red-500" />
          ) : (
            <Upload className={`w-12 h-12 ${isDragActive ? 'text-blue-500' : 'text-gray-500'}`} />
          )}
          
          <div>
            {uploading ? (
              <p className="text-gray-300">{message}</p>
            ) : status ? (
              <p className={status === 'success' ? 'text-green-400' : 'text-red-400'}>
                {message}
              </p>
            ) : isDragActive ? (
              <p className="text-blue-400">Drop your PDF here...</p>
            ) : (
              <>
                <p className="text-gray-300 font-medium">
                  Drop your PDF here, or click to browse
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Maximum file size: 50MB
                </p>
              </>
            )}
          </div>
          
          {uploading && (
            <div className="w-full max-w-xs">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">{progress}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick tips */}
      <div className="mt-4 p-4 bg-gray-800/30 rounded-lg">
        <h4 className="text-sm font-medium text-gray-400 mb-2">
          <FileText className="w-4 h-4 inline mr-1" />
          Supported content:
        </h4>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Textbooks and lecture notes</li>
          <li>• Course syllabi and study guides</li>
          <li>• Research papers and articles</li>
          <li>• Any PDF with readable text</li>
        </ul>
      </div>
    </div>
  );
}

export default PDFUpload;
