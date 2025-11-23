import React, { useState, useEffect } from 'react';
import { 
  Layout, FileText, Settings, CheckCircle2, 
  AlertCircle, Loader2, Image as ImageIcon, 
  Languages, ChevronRight, ChevronLeft, Menu,
  RefreshCw, Scissors
} from 'lucide-react';
import FileUpload from './components/FileUpload';
import Editor from './components/Editor';
import ApiDocs from './components/ApiDocs';
import SettingsView from './components/SettingsView';
import { DocumentFile, OcrMode, OcrResult, ProcessingStatus, SupportedLanguage } from './types';
import { performOcr } from './services/geminiService';
import { getPdfPageAsImage } from './services/pdfService';

enum View {
  DASHBOARD,
  API_DOCS,
  SETTINGS
}

const App = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<OcrMode>('standard');
  const [activeLang, setActiveLang] = useState<SupportedLanguage>('auto');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  // Helper to convert File to Base64 Data URI
  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handlers
  const handleFilesSelected = (newDocs: DocumentFile[]) => {
    setDocuments(prev => [...prev, ...newDocs]);
    // Auto select first new doc
    if (newDocs.length > 0) setSelectedDocId(newDocs[0].id);
    // Auto start processing
    newDocs.forEach(doc => processDocument(doc));
  };

  const handleSplitDocument = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    const doc = documents.find(d => d.id === docId);
    if (!doc || !doc.totalPages || doc.totalPages <= 5) return;

    const chunkSize = 5;
    const chunks: DocumentFile[] = [];
    const totalPages = doc.totalPages;

    for (let i = 1; i <= totalPages; i += chunkSize) {
      const start = i;
      const end = Math.min(i + chunkSize - 1, totalPages);
      
      chunks.push({
        ...doc,
        id: Math.random().toString(36).substring(7),
        status: ProcessingStatus.IDLE,
        progress: 0,
        currentProcessingPage: 0,
        results: [],
        pageRange: { start, end },
        error: undefined
      });
    }

    setDocuments(prev => {
      const idx = prev.findIndex(d => d.id === docId);
      if (idx === -1) return prev;
      const newDocs = [...prev];
      newDocs.splice(idx, 1, ...chunks);
      return newDocs;
    });

    // Auto-process new chunks
    chunks.forEach(chunk => processDocument(chunk));
  };

  const processDocument = async (doc: DocumentFile) => {
    // Prevent double processing if already running
    if (doc.status === ProcessingStatus.PROCESSING) return;

    updateDocStatus(doc.id, ProcessingStatus.PROCESSING);
    
    try {
      const results: OcrResult[] = [];

      if (doc.type === 'pdf') {
        const startPage = doc.pageRange?.start || 1;
        const endPage = doc.pageRange?.end || doc.totalPages || 1;
        const totalPagesToProcess = endPage - startPage + 1;
        
        for (let i = startPage; i <= endPage; i++) {
           // Update progress state
           setDocuments(prev => prev.map(d => {
             if (d.id === doc.id) {
               return { 
                 ...d, 
                 progress: Math.round(((i - startPage) / totalPagesToProcess) * 100),
                 currentProcessingPage: i
               };
             }
             return d;
           }));

           // Extract and process page
           const pageImage = await getPdfPageAsImage(doc.file, i);
           const result = await performOcr(pageImage, activeLang, activeMode);
           result.pageIndex = i;
           results.push(result);
        }
      } else {
        // Single Image
        const imageDataUri = await fileToDataUri(doc.file);
        const response = await performOcr(imageDataUri, activeLang, activeMode);
        results.push(response);
      }
      
      setDocuments(prev => prev.map(d => {
        if (d.id === doc.id) {
          return {
            ...d,
            status: ProcessingStatus.COMPLETED,
            progress: 100,
            results: results,
            error: undefined
          };
        }
        return d;
      }));
    } catch (error: any) {
       console.error("Processing Error:", error);
       // Capture specific error message thrown by service
       const errorMessage = error.message || "An unexpected error occurred during processing.";
       updateDocStatus(doc.id, ProcessingStatus.ERROR, errorMessage);
    }
  };

  const updateDocStatus = (id: string, status: ProcessingStatus, error?: string) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, status, error } : d));
  };

  const handleRetry = (e: React.MouseEvent, doc: DocumentFile) => {
    e.stopPropagation();
    processDocument(doc);
  };

  const handleClearHistory = () => {
    setDocuments([]);
    setSelectedDocId(null);
  };

  const handleDownload = (format: 'txt' | 'csv' | 'doc') => {
    if (!selectedDoc || !selectedDoc.results) return;
    
    // Aggregate data from all pages
    const results = selectedDoc.results;
    let content = '';
    let mime = 'text/plain';
    let ext = 'txt';

    if (format === 'txt') {
      content = results.map(r => {
        const header = selectedDoc.type === 'pdf' ? `--- Page ${r.pageIndex} ---\n` : '';
        return header + r.fullText;
      }).join('\n\n');
    } else if (format === 'csv') {
      const allTables = results.flatMap(r => r.tables || []);
      
      if (allTables.length === 0) {
        alert("No tables found to export.");
        return;
      }
      
      content = allTables.join('\n\n');
      mime = 'text/csv';
      ext = 'csv';
    } else if (format === 'doc') {
      const bodyContent = results.map(page => `
        <div class="page">
          ${selectedDoc.type === 'pdf' ? `<p style="font-size: 10pt; color: #666; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 20px;">Page ${page.pageIndex}</p>` : ''}
          ${page.fullText.replace(/\n/g, '<br>')}
          <br style="page-break-after:always" />
        </div>
      `).join('');

      content = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Export</title>
          <style>
            body { font-family: 'Arial', sans-serif; font-size: 12pt; line-height: 1.5; }
          </style>
        </head>
        <body>${bodyContent}</body>
        </html>
      `;
      mime = 'application/msword';
      ext = 'doc';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedDoc.file.name.split('.')[0]}_extracted.${ext}`;
    link.click();
  };

  const getAggregatedResults = () => {
    if (!selectedDoc || !selectedDoc.results) return null;
    
    return {
      fullText: selectedDoc.results.map(r => {
        const header = selectedDoc.type === 'pdf' ? `--- Page ${r.pageIndex} ---\n` : '';
        return header + r.fullText;
      }).join('\n\n'),
      blocks: selectedDoc.results.flatMap(r => r.blocks || []),
      entities: selectedDoc.results.flatMap(r => r.entities || []),
      tables: selectedDoc.results.flatMap(r => r.tables || [])
    };
  };

  const aggregatedData = getAggregatedResults();

  const renderStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case ProcessingStatus.COMPLETED: return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case ProcessingStatus.PROCESSING: return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case ProcessingStatus.ERROR: return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <div className="w-4 h-4 rounded-full border-2 border-slate-200" />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-20`}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between h-16">
          {isSidebarOpen ? (
             <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
               <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                 <Layout className="w-5 h-5" />
               </div>
               <span>Lumina</span>
             </div>
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white mx-auto">
               <Layout className="w-5 h-5" />
            </div>
          )}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-100 rounded text-slate-500 hidden md:block">
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <nav className="p-2 space-y-1 flex-1">
          <button 
            onClick={() => setCurrentView(View.DASHBOARD)}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${currentView === View.DASHBOARD ? 'bg-blue-50 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <FileText className="w-5 h-5" />
            {isSidebarOpen && <span className="ml-3 font-medium">OCR Dashboard</span>}
          </button>
           <button 
            onClick={() => setCurrentView(View.API_DOCS)}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${currentView === View.API_DOCS ? 'bg-blue-50 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <CheckCircle2 className="w-5 h-5" />
            {isSidebarOpen && <span className="ml-3 font-medium">API & Developers</span>}
          </button>
           <button 
            onClick={() => setCurrentView(View.SETTINGS)}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${currentView === View.SETTINGS ? 'bg-blue-50 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Settings className="w-5 h-5" />
            {isSidebarOpen && <span className="ml-3 font-medium">Settings</span>}
          </button>
        </nav>

        {/* Recent Files List (Mini) */}
        {isSidebarOpen && currentView === View.DASHBOARD && (
          <div className="p-4 border-t border-slate-200 h-1/3 overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Recent Files</h3>
            <div className="space-y-2">
              {documents.map(doc => (
                <div 
                  key={doc.id} 
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`group relative flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all ${selectedDocId === doc.id ? 'bg-blue-50 border-blue-200 border' : 'hover:bg-slate-50'}`}
                >
                  {renderStatusIcon(doc.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate" title={doc.file.name}>{doc.file.name}</p>
                    <div className="flex items-center text-[10px] text-slate-400">
                      {doc.type === 'pdf' && doc.pageRange && (
                         <span className="mr-1">Pages {doc.pageRange.start}-{doc.pageRange.end}</span>
                      )}
                      {doc.status === ProcessingStatus.PROCESSING && doc.type === 'pdf' && (
                         <span>({doc.currentProcessingPage})</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Split Button for Large PDFs */}
                  {doc.type === 'pdf' && doc.totalPages && doc.totalPages > 5 && (!doc.pageRange || (doc.pageRange.end - doc.pageRange.start + 1) > 5) && (
                    <button 
                      onClick={(e) => handleSplitDocument(e, doc.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded absolute right-2 bg-white shadow-sm"
                      title="Split into 5-page chunks"
                    >
                      <Scissors className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-xs text-slate-400 italic">No files processed yet.</p>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10">
          <h2 className="text-lg font-semibold text-slate-800">
            {currentView === View.DASHBOARD ? 'Document Processor' : 
             currentView === View.API_DOCS ? 'Developer Resources' : 'Settings'}
          </h2>
          
          {currentView === View.DASHBOARD && (
            <div className="flex items-center gap-4">
               {/* Language Selector */}
               <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-slate-400" />
                  <select 
                    value={activeLang} 
                    onChange={(e) => setActiveLang(e.target.value as SupportedLanguage)}
                    className="text-sm border-none bg-transparent focus:ring-0 text-slate-600 font-medium cursor-pointer outline-none"
                  >
                    <option value="auto">Auto Detect</option>
                    <option value="en">English</option>
                    <option value="ar">Arabic (العربية)</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                  </select>
               </div>

               <div className="h-4 w-px bg-slate-300" />

               {/* Mode Selector */}
               <select 
                 value={activeMode}
                 onChange={(e) => setActiveMode(e.target.value as OcrMode)}
                 className="text-sm border-none bg-transparent focus:ring-0 text-slate-600 font-medium cursor-pointer outline-none"
               >
                 <option value="standard">Standard OCR</option>
                 <option value="table_focus">Enhanced Tables (Pro)</option>
               </select>
            </div>
          )}
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-hidden p-6">
          {currentView === View.API_DOCS ? (
            <div className="h-full overflow-y-auto custom-scrollbar">
               <ApiDocs />
            </div>
          ) : currentView === View.SETTINGS ? (
             <div className="h-full overflow-y-auto custom-scrollbar">
               <SettingsView 
                 activeLang={activeLang}
                 setActiveLang={setActiveLang}
                 activeMode={activeMode}
                 setActiveMode={setActiveMode}
                 onClearHistory={handleClearHistory}
               />
             </div>
          ) : (
            <div className="h-full flex flex-col lg:flex-row gap-6">
              
              {/* Left Column: Upload & Preview */}
              <div className="lg:w-1/2 flex flex-col gap-6 h-full overflow-hidden">
                <div className="flex-shrink-0">
                   <FileUpload onFilesSelected={handleFilesSelected} />
                </div>
                
                {selectedDoc ? (
                  <div className="flex-1 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner">
                    <img 
                      src={selectedDoc.previewUrl} 
                      alt="Preview" 
                      className="max-w-full max-h-full object-contain opacity-90"
                    />
                    {/* Overlay Details */}
                    <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
                      {selectedDoc.type === 'pdf' ? `PDF - ${selectedDoc.totalPages} Pages` : 'Image'}
                    </div>
                    {selectedDoc.status === ProcessingStatus.PROCESSING && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                        <Loader2 className="w-12 h-12 animate-spin mb-3 text-primary" />
                        <p className="font-medium">Processing Document...</p>
                        {selectedDoc.type === 'pdf' ? (
                          <div className="mt-2 text-center">
                            <p className="text-sm mb-2">Page {selectedDoc.currentProcessingPage} of {selectedDoc.totalPages}</p>
                            <div className="w-48 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${selectedDoc.progress}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm opacity-75">Analyzing structure and text</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 bg-white border border-slate-200 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                    <p>Select a file to view preview</p>
                  </div>
                )}
              </div>

              {/* Right Column: Results Editor */}
              <div className="lg:w-1/2 h-full overflow-hidden">
                {selectedDoc && selectedDoc.status === ProcessingStatus.COMPLETED && aggregatedData ? (
                  <Editor 
                    fullText={aggregatedData.fullText}
                    blocks={aggregatedData.blocks}
                    entities={aggregatedData.entities}
                    tables={aggregatedData.tables}
                    onDownload={handleDownload}
                  />
                ) : (
                   <div className="h-full bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                     <div className="text-center p-8 max-w-sm">
                       {selectedDoc?.status === ProcessingStatus.PROCESSING ? (
                         <>
                           <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500 opacity-50" />
                           <p className="font-medium text-slate-600">Extracting content...</p>
                         </>
                       ) : selectedDoc?.status === ProcessingStatus.ERROR ? (
                          <>
                           <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500 opacity-80" />
                           <h3 className="font-semibold text-red-600 mb-2">Processing Failed</h3>
                           <p className="text-sm text-slate-600 mb-6">{selectedDoc.error}</p>
                           <button 
                              onClick={(e) => handleRetry(e, selectedDoc)}
                              className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-medium transition-colors"
                           >
                             <RefreshCw className="w-4 h-4 mr-2" />
                             Retry
                           </button>
                         </>
                       ) : (
                         <>
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <FileText className="w-8 h-8 text-slate-300" />
                            </div>
                            <p>Extracted text will appear here</p>
                         </>
                       )}
                     </div>
                   </div>
                )}
              </div>

            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default App;