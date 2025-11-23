import React from 'react';
import { Terminal, Code, Book } from 'lucide-react';

const ApiDocs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 pb-20">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Developer API Reference</h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          Integrate Lumina OCR directly into your applications. Our REST-compatible API provides programmatic access to our powerful document processing engines.
        </p>
      </div>

      {/* Authentication */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Terminal className="w-5 h-5" /></div>
          <h2 className="text-xl font-bold text-slate-800">Authentication</h2>
        </div>
        <p className="text-slate-600 mb-4">
          All API requests require a valid Bearer Token in the header.
        </p>
        <div className="bg-slate-900 rounded-xl p-4 text-sm font-mono text-emerald-400 overflow-x-auto">
          Authorization: Bearer your_api_key_here
        </div>
      </section>

      {/* Endpoints */}
      <section className="space-y-12">
        
        {/* Image OCR */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">POST</span>
              <span className="font-mono text-slate-700 font-medium">/v1/ocr/image</span>
            </div>
            <span className="text-xs text-slate-500">Extract text from standard images</span>
          </div>
          <div className="p-6 bg-white">
             <h3 className="text-sm font-semibold text-slate-800 mb-3">Request Example (Python)</h3>
             <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm font-mono overflow-x-auto">
{`import requests

url = "https://api.luminaocr.com/v1/ocr/image"
files = {'file': open('document.jpg', 'rb')}
headers = {'Authorization': 'Bearer YOUR_TOKEN'}

response = requests.post(url, files=files, headers=headers)
print(response.json())`}
             </pre>

             <h3 className="text-sm font-semibold text-slate-800 mb-3 mt-6">Response Format</h3>
             <pre className="bg-slate-50 text-slate-600 p-4 rounded-lg text-xs font-mono border border-slate-200">
{`{
  "fullText": "Invoice #1023...",
  "language": "en",
  "confidence": 98.5,
  "blocks": [
    {"text": "Invoice #1023", "type": "header", "box": [10, 10, 200, 40]}
  ]
}`}
             </pre>
          </div>
        </div>

        {/* PDF OCR */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
             <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">POST</span>
              <span className="font-mono text-slate-700 font-medium">/v1/ocr/pdf</span>
            </div>
            <span className="text-xs text-slate-500">Process multipage PDFs</span>
          </div>
           <div className="p-6 bg-white">
             <h3 className="text-sm font-semibold text-slate-800 mb-3">Request Example (cURL)</h3>
             <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm font-mono overflow-x-auto">
{`curl -X POST https://api.luminaocr.com/v1/ocr/pdf \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@contract.pdf" \\
  -F "pages=1-5"`}
             </pre>
          </div>
        </div>

         {/* Node.js SDK */}
         <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
             <div className="flex items-center gap-3">
              <div className="p-1 bg-green-100 text-green-700 rounded"><Code className="w-4 h-4"/></div>
              <span className="font-medium text-slate-700">Node.js Integration</span>
            </div>
            <span className="text-xs text-slate-500">Using Gemini SDK</span>
          </div>
           <div className="p-6 bg-white">
             <p className="text-sm text-slate-600 mb-4">For direct integration using the underlying engine:</p>
             <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm font-mono overflow-x-auto">
{`import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function extract() {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
      { text: "Extract text and tables to JSON" }
    ]
  });
  console.log(response.text);
}`}
             </pre>
          </div>
        </div>

      </section>
    </div>
  );
};

export default ApiDocs;