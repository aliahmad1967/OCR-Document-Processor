import React from 'react';
import { Zap, Trash2, Shield, Info } from 'lucide-react';
import { OcrMode, SupportedLanguage } from '../types';

interface SettingsViewProps {
  activeLang: SupportedLanguage;
  setActiveLang: (lang: SupportedLanguage) => void;
  activeMode: OcrMode;
  setActiveMode: (mode: OcrMode) => void;
  onClearHistory: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  activeLang,
  setActiveLang,
  activeMode,
  setActiveMode,
  onClearHistory,
}) => {
  return (
    <div className="max-w-4xl mx-auto p-8 pb-20">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Application Settings</h1>

      <div className="grid gap-8">
        {/* General Preferences */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-slate-800">Processing Defaults</h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Default Language</label>
                <p className="text-sm text-slate-500">Language hint provided to the AI engine.</p>
              </div>
              <select
                value={activeLang}
                onChange={(e) => setActiveLang(e.target.value as SupportedLanguage)}
                className="block w-48 rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 sm:text-sm p-2 border bg-white"
              >
                <option value="auto">Auto Detect</option>
                <option value="en">English</option>
                <option value="ar">Arabic</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
              </select>
            </div>

            <hr className="border-slate-100" />

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">OCR Model Mode</label>
                <p className="text-sm text-slate-500">Choose between speed or layout precision.</p>
              </div>
              <select
                value={activeMode}
                onChange={(e) => setActiveMode(e.target.value as OcrMode)}
                className="block w-48 rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 sm:text-sm p-2 border bg-white"
              >
                <option value="standard">Standard (Gemini 2.5 Flash)</option>
                <option value="table_focus">Enhanced Tables (Pro)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-slate-800">Session & Data</h2>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-700">Clear Session History</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Remove all uploaded documents and extracted data from memory.
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
                    onClearHistory();
                  }
                }}
                className="flex items-center px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear History
              </button>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <Info className="w-5 h-5 text-slate-500" />
            <h2 className="font-semibold text-slate-800">About</h2>
          </div>
          <div className="p-6 text-sm text-slate-600">
            <p className="mb-2"><strong>Lumina OCR Pro v1.1.0</strong></p>
            <p>
              Powered by Google Gemini 2.5 Flash. This application runs entirely in your browser session; 
              files are processed via the API and not stored permanently on any server.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsView;