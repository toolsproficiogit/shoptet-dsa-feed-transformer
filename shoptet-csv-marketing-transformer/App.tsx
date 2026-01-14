
import React, { useState, useCallback } from 'react';
import { 
  FileUp, 
  Download, 
  RefreshCcw, 
  CheckCircle, 
  AlertCircle,
  Globe,
  Tag,
  ArrowRight,
  FileText,
  Layers
} from 'lucide-react';
import Papa from 'papaparse';
import { CSVRow, TransformationConfig, TransformationResult } from './types';

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [config, setConfig] = useState<TransformationConfig>({
    domain: 'https://www.lavonio.si/',
    customLabelMode: 'fixed',
    fixedLabelValue: 'category',
    labelColumn: ''
  });
  const [result, setResult] = useState<TransformationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processUploadedFile = (uploadedFile: File) => {
    setError(null);
    setFile(uploadedFile);

    Papa.parse(uploadedFile, {
      header: true,
      preview: 5,
      skipEmptyLines: true,
      complete: (results) => {
        const fields = results.meta.fields || [];
        if (fields.length > 0) {
          setHeaders(fields);
          if (!fields.includes('visible') || !fields.includes('url')) {
            setError(`Missing required columns 'visible' or 'url'. Please ensure you are uploading a valid Shoptet export.`);
            setFile(null);
          } else {
            setCurrentStep(2);
          }
        }
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      processUploadedFile(uploadedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.name.toLowerCase().endsWith('.csv') || droppedFile.type === 'text/csv') {
        processUploadedFile(droppedFile);
      } else {
        setError("File must be in CSV format.");
      }
    }
  };

  const processCSV = useCallback(() => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        try {
          const transformedData = results.data
            .filter((row) => {
              const visibility = row['visible']?.toString().trim();
              const urlPart = row['url']?.toString().trim();
              return visibility === '1' && urlPart !== '' && urlPart !== undefined;
            })
            .map((row) => {
              const urlPart = row['url']?.toString().trim();
              const cleanedUrlPart = urlPart.startsWith('/') ? urlPart : `/${urlPart}`;
              const fullUrl = `${config.domain.replace(/\/$/, '')}${cleanedUrlPart}`;
              const label = config.customLabelMode === 'fixed' ? config.fixedLabelValue : (row[config.labelColumn] || '');
              return { 'Page URL': fullUrl, 'Custom label': label };
            });

          if (transformedData.length === 0) {
            setError("No rows match the filter criteria (visible=1 and URL is not empty).");
            setIsProcessing(false);
            return;
          }

          const csvOutput = Papa.unparse(transformedData, { quotes: true, delimiter: ',' });
          setResult({
            fileName: `dsa_feed_${new Date().toISOString().slice(0, 10)}.csv`,
            rowCount: transformedData.length,
            data: csvOutput,
            previewRows: transformedData.slice(0, 5)
          });
          setCurrentStep(3);
        } catch (err) {
          setError(`An error occurred during processing: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
          setIsProcessing(false);
        }
      }
    });
  }, [file, config]);

  const downloadCSV = () => {
    if (!result) return;
    const blob = new Blob(['\uFEFF' + result.data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', result.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setFile(null);
    setHeaders([]);
    setResult(null);
    setError(null);
    setCurrentStep(1);
    setIsDragging(false);
  };

  return (
    <div className="min-h-screen bg-brand-green text-white font-sans selection:bg-brand-orange selection:text-white flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-2xl w-full">
        {/* Branding & Modern Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 flex items-center justify-center gap-3">
            <Layers className="text-brand-orange" size={36} strokeWidth={3} />
            MAIRA | Feed Transformer
          </h1>
          <p className="text-white/60 font-semibold text-sm leading-relaxed px-4 max-w-lg mx-auto italic">
            This app processes CSV export with categories from Shoptet and creates a CSV with active page URLs only and customizable custom label, ready for DSA campaigns.
          </p>
        </div>

        {/* Clean Modern Card */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-14 shadow-2xl shadow-black/20 border border-white/10">
          
          {error && (
            <div className="mb-8 p-5 bg-red-50 rounded-2xl border border-red-100 text-brand-orange flex items-start gap-4 animate-in fade-in zoom-in-95">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
              <div className="text-sm font-bold uppercase tracking-tight">{error}</div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <label 
                className={`block w-full cursor-pointer group transition-all`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div 
                  className={`border-4 border-dashed rounded-[2rem] p-16 flex flex-col items-center justify-center transition-all 
                  ${isDragging ? 'border-brand-orange bg-brand-orange/10 scale-[1.02]' : 'border-brand-grey hover:border-brand-orange hover:bg-brand-orange/5'}`}
                >
                  <div className={`w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mb-6 transition-transform ${isDragging ? 'scale-110' : 'group-hover:scale-110'}`}>
                    <FileUp size={40} className="text-brand-orange" />
                  </div>
                  <span className="text-xl font-black uppercase tracking-widest mb-2 text-brand-green text-center">
                    {isDragging ? 'Drop file here' : 'Upload CSV Export'}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                    Shoptet Format v1.0+ or drag and drop here
                  </span>
                </div>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-600">
              <div className="space-y-8">
                {/* Domain Input */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Globe size={14} className="text-brand-orange" /> Target Shop Domain
                  </label>
                  <input 
                    type="url" 
                    value={config.domain} 
                    onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                    className="w-full p-5 bg-brand-light rounded-2xl border-2 border-transparent focus:border-brand-orange focus:bg-white outline-none font-bold text-brand-green transition-all"
                    placeholder="https://www.example.com/"
                  />
                </div>

                {/* Label Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Tag size={14} className="text-brand-orange" /> Custom Label for DSA
                  </label>
                  
                  <div className="inline-flex p-1.5 bg-brand-light rounded-2xl mb-2 w-full md:w-auto">
                    <button 
                      onClick={() => setConfig({ ...config, customLabelMode: 'fixed' })}
                      className={`flex-1 md:px-8 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${config.customLabelMode === 'fixed' ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'text-gray-400 hover:text-brand-green'}`}
                    >STATIC</button>
                    <button 
                      onClick={() => setConfig({ ...config, customLabelMode: 'column' })}
                      className={`flex-1 md:px-8 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${config.customLabelMode === 'column' ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'text-gray-400 hover:text-brand-green'}`}
                    >DYNAMIC</button>
                  </div>

                  {config.customLabelMode === 'fixed' ? (
                    <input 
                      type="text" 
                      value={config.fixedLabelValue}
                      onChange={(e) => setConfig({ ...config, fixedLabelValue: e.target.value })}
                      className="w-full p-5 bg-brand-light rounded-2xl border-2 border-transparent focus:border-brand-orange focus:bg-white outline-none font-bold text-brand-green transition-all"
                    />
                  ) : (
                    <div className="relative">
                      <select 
                        value={config.labelColumn}
                        onChange={(e) => setConfig({ ...config, labelColumn: e.target.value })}
                        className="w-full p-5 bg-brand-light rounded-2xl border-2 border-transparent focus:border-brand-orange focus:bg-white outline-none font-bold text-brand-green transition-all appearance-none"
                      >
                        <option value="">Select source column...</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-orange">
                        <ArrowRight size={16} className="rotate-90" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 flex flex-col gap-5">
                <button 
                  onClick={processCSV}
                  disabled={isProcessing}
                  className="w-full bg-brand-orange text-white py-6 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-brand-green transition-all shadow-xl shadow-brand-orange/20 active:scale-[0.98]"
                >
                  {isProcessing ? 'PROCESSING...' : 'GENERATE FEED'}
                  {!isProcessing && <ArrowRight size={22} />}
                </button>
                
                <button 
                  onClick={reset} 
                  className="w-full py-2 text-[10px] font-black text-gray-400 hover:text-brand-orange transition-colors uppercase tracking-[0.3em]"
                >
                  CANCEL AND START OVER
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && result && (
            <div className="space-y-10 animate-in zoom-in-95 duration-500 text-center">
              <div className="py-6">
                <div className="w-24 h-24 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={48} className="text-brand-green" strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-black tracking-tight uppercase mb-2 text-brand-green">READY</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Processed {result.rowCount} active pages</p>
              </div>

              <div className="flex flex-col gap-6">
                <button 
                  onClick={downloadCSV}
                  className="w-full bg-brand-green text-white py-7 rounded-[1.5rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-brand-orange transition-all shadow-2xl shadow-brand-green/20 active:scale-[0.98] text-lg"
                >
                  <Download size={24} /> DOWNLOAD CSV
                </button>

                <div className="bg-brand-light rounded-[2rem] p-8 text-left border border-brand-grey">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                    <FileText size={12} className="text-brand-orange" /> Preview of the generated feed
                  </h3>
                  <div className="space-y-4">
                    {result.previewRows.map((row, i) => (
                      <div key={i} className="text-[11px] font-bold text-brand-green/70 truncate border-b border-brand-grey pb-3 last:border-0 last:pb-0 italic">
                        <span className="text-brand-orange not-italic mr-2">[{row['Custom label']}]</span>
                        {row['Page URL']}
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={reset} 
                  className="mt-6 inline-flex items-center justify-center gap-3 text-[10px] font-black text-gray-400 hover:text-brand-green transition-all uppercase tracking-[0.3em]"
                >
                  <RefreshCcw size={14} /> NEW TRANSFORMATION
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Minimal Footer */}
        <div className="mt-12 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">
            © {new Date().getFullYear()} MAIRA TEAM | DSA ENGINE v3.0
          </p>
        </div>
      </div>
    </div>
  );
}
