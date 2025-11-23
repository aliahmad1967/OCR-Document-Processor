import React, { useCallback, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { DocumentFile, ProcessingStatus } from '../types';
import { getPdfPageCount, getPdfPageAsImage } from '../services/pdfService';

interface FileUploadProps {
  onFilesSelected: (files: DocumentFile[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    const newDocs: DocumentFile[] = [];

    for (const file of files) {
      const id = Math.random().toString(36).substring(7);
      const isPdf = file.type === 'application/pdf';
      
      let previewUrl = '';
      let totalPages = 1;

      try {
        if (isPdf) {
          totalPages = await getPdfPageCount(file);
          previewUrl = await getPdfPageAsImage(file, 1); // Preview first page
        } else {
          previewUrl = URL.createObjectURL(file);
        }

        newDocs.push({
          id,
          file,
          previewUrl,
          type: isPdf ? 'pdf' : 'image',
          status: ProcessingStatus.IDLE,
          currentPage: 1,
          totalPages,
          progress: 0,
          currentProcessingPage: 0,
          pageRange: { start: 1, end: totalPages }
        });
      } catch (e) {
        console.error("Error preparing file", e);
      }
    }

    onFilesSelected(newDocs);
    setIsProcessing(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const fileList = Array.from(e.dataTransfer.files) as File[];
    const files = fileList.filter(
      file => file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    if (files.length > 0) processFiles(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      processFiles(files);
    }
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out text-center cursor-pointer
        ${isDragging ? 'border-primary bg-blue-50' : 'border-slate-300 hover:border-primary hover:bg-slate-50'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById('fileInput')?.click()}
    >
      <input 
        type="file" 
        id="fileInput" 
        multiple 
        accept="image/*,application/pdf" 
        className="hidden" 
        onChange={handleFileInput}
      />
      
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center py-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
          <p className="text-sm text-slate-500 font-medium">Preparing documents...</p>
        </div>
      ) : (
        <>
          <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">
            Click to upload or drag and drop
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Support for PDF, PNG, JPG, WEBP (Max 40MB)
          </p>
          <div className="flex justify-center gap-3">
            <span className="flex items-center text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">
              <ImageIcon className="w-3 h-3 mr-1" /> Images
            </span>
            <span className="flex items-center text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">
              <FileText className="w-3 h-3 mr-1" /> PDF Documents
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default FileUpload;