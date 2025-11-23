import React from 'react';
import { ExtractedBlock, ExtractedEntity } from '../types';
import { Copy, Check, Download, Table } from 'lucide-react';

interface EditorProps {
  fullText: string;
  blocks?: ExtractedBlock[];
  entities?: ExtractedEntity[];
  tables?: string[];
  onDownload: (format: 'txt' | 'csv' | 'doc') => void;
}

const Editor: React.FC<EditorProps> = ({ fullText, blocks, entities, tables, onDownload }) => {
  const [copied, setCopied] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'text' | 'analysis'>('text');

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderAnalysis = () => {
    return (
      <div className="space-y-6">
        {/* Confidence & Blocks */}
        <div>
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Structure Analysis</h4>
          <div className="space-y-2">
            {blocks?.map((block, i) => (
              <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm flex justify-between items-start hover:border-blue-300 transition-colors">
                <p className="text-sm text-slate-700 line-clamp-2 flex-1">{block.text}</p>
                <div className="flex flex-col items-end ml-3">
                   <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase mb-1
                    ${block.type === 'table' ? 'bg-purple-100 text-purple-700' : 
                      block.type === 'header' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                    {block.type}
                   </span>
                   <span className={`text-xs font-bold ${block.confidence > 80 ? 'text-green-600' : 'text-orange-500'}`}>
                    {block.confidence}%
                   </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Entities */}
        {entities && entities.length > 0 && (
          <div>
             <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 mt-6">Detected Entities</h4>
             <div className="flex flex-wrap gap-2">
               {entities.map((entity, i) => (
                 <div key={i} className="flex items-center bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
                    <span className="text-xs font-semibold text-amber-800 mr-2">{entity.label}</span>
                    <span className="text-sm text-slate-800">{entity.text}</span>
                 </div>
               ))}
             </div>
          </div>
        )}

         {/* Tables */}
         {tables && tables.length > 0 && (
          <div>
             <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 mt-6">Extracted Tables</h4>
             <div className="space-y-3">
               {tables.map((csv, i) => (
                 <div key={i} className="bg-slate-900 text-slate-50 p-3 rounded-md overflow-x-auto text-xs font-mono">
                    <pre>{csv}</pre>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex space-x-1 bg-slate-200 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode('text')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'text' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Raw Text
          </button>
          <button 
            onClick={() => setViewMode('analysis')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'analysis' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Analysis & Data
          </button>
        </div>

        <div className="flex items-center space-x-2">
           <button 
            onClick={handleCopy} 
            className="p-2 text-slate-500 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
            title="Copy to Clipboard"
          >
             {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
           </button>
           <div className="h-4 w-px bg-slate-300 mx-1" />
           <button 
             onClick={() => onDownload('txt')}
             className="flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
           >
             TXT
           </button>
           <button 
             onClick={() => onDownload('doc')}
             className="flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
           >
             DOCX
           </button>
           {tables && tables.length > 0 && (
              <button 
              onClick={() => onDownload('csv')}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Table className="w-3 h-3 mr-1" /> CSV
            </button>
           )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative bg-white">
        {viewMode === 'text' ? (
          <textarea 
            className="w-full h-full resize-none outline-none text-slate-800 text-base leading-relaxed font-sans"
            value={fullText}
            readOnly
            style={{ minHeight: '400px' }}
          />
        ) : (
          renderAnalysis()
        )}
      </div>
    </div>
  );
};

export default Editor;