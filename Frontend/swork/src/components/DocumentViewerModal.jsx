import React, { useState, useEffect } from 'react';
import { FaTimes, FaFilePdf, FaFileImage, FaFileAlt, FaDownload } from 'react-icons/fa';

const DocumentViewerModal = ({ isOpen, onClose, documentId, fileName, fetchDocument }) => {
  const [documentUrl, setDocumentUrl] = useState(null);
  const [documentType, setDocumentType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && documentId) {
      loadDocument();
    }
  }, [isOpen, documentId]);

  const loadDocument = async () => {
    if (!documentId || !fetchDocument) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const documentBlob = await fetchDocument(documentId);
      const url = URL.createObjectURL(documentBlob);
      setDocumentUrl(url);
      
      // Determine document type based on file extension
      const extension = fileName?.split('.').pop()?.toLowerCase() || 'unknown';
      if (['pdf'].includes(extension)) {
        setDocumentType('pdf');
      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) {
        setDocumentType('image');
      } else {
        setDocumentType('other');
      }
    } catch (err) {
      console.error('Failed to load document:', err);
      setError('Failed to load document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (documentUrl) {
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = fileName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const closeModal = () => {
    if (documentUrl) {
      URL.revokeObjectURL(documentUrl);
      setDocumentUrl(null);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {documentType === 'pdf' ? (
                <FaFilePdf className="text-red-600 text-xl" />
              ) : documentType === 'image' ? (
                <FaFileImage className="text-green-600 text-xl" />
              ) : (
                <FaFileAlt className="text-gray-600 text-xl" />
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 truncate max-w-xs">
              {fileName || 'Document Preview'}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download"
            >
              <FaDownload />
            </button>
            <button
              onClick={closeModal}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <div className="text-red-500 mb-2">
                <FaFileAlt className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-red-600 mb-2">Error loading document</p>
              <p className="text-gray-600 text-sm">{error}</p>
              <button
                onClick={loadDocument}
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : documentUrl ? (
            <div className="flex flex-col items-center">
              {documentType === 'pdf' ? (
                <iframe
                  src={documentUrl}
                  className="w-full h-[70vh] border border-gray-300 rounded-lg"
                  title="Document Preview"
                  type="application/pdf"
                >
                  <p>Your browser doesn't support PDF viewing. <a href={documentUrl} className="text-blue-500 hover:underline">Download the PDF</a> instead.</p>
                </iframe>
              ) : documentType === 'image' ? (
                <img
                  src={documentUrl}
                  alt="Document preview"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg border border-gray-300"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="text-gray-500 mb-4">
                    <FaFileAlt className="h-16 w-16 mx-auto" />
                  </div>
                  <p className="text-gray-700 mb-4">Document Preview</p>
                  <p className="text-gray-500 text-sm">
                    Preview not available for this file type. 
                    <br />
                    Click the download icon to view the file.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;