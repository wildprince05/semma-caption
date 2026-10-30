import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface DatasetImporterProps {
  onImported: () => void;
  onClose: () => void;
}

type ImportResult = { imported: number; duplicates: number; errors: string[] };

export const DatasetImporter: React.FC<DatasetImporterProps> = ({ onImported, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [tab, setTab] = useState<'file' | 'paste'>('file');

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt', '.md'],
    },
    multiple: false,
    maxSize: 5 * 1024 * 1024,
  });

  const handleImport = async () => {
    if (!file && !pastedText.trim()) {
      toast.error('Upload a file or paste some captions');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      let res: ImportResult;

      if (file) {
        res = await api.importReferences(file);
      } else {
        // Parse pasted text as JSON or plain text
        let captions: Array<{ caption_text: string }> = [];
        try {
          const parsed = JSON.parse(pastedText);
          captions = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // Treat as plain text — split by double newline
          const blocks = pastedText.split(/\n\s*\n+/).map(b => b.trim()).filter(b => b.length > 30);
          captions = blocks.map(b => ({ caption_text: b }));
        }
        res = await api.importReferences({ captions } as Parameters<typeof api.importReferences>[0] as any);
      }

      setResult(res);
      if (res.imported > 0) {
        toast.success(`Imported ${res.imported} new captions! 🎉`);
        onImported();
      } else {
        toast('No new captions added — all were duplicates or invalid');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50">
      <div className="bg-white border-2 border-ink shadow-[8px_8px_0px_#171717] w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-ink bg-yello">
          <div>
            <h2 className="font-heading font-bold text-lg text-ink">IMPORT CAPTIONS</h2>
            <p className="font-body text-xs text-ink/70">Add to your reference library</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-ink/10 cursor-pointer"><X size={18} /></button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
          {/* Tab selector */}
          <div className="flex border-2 border-ink">
            {['file', 'paste'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t as 'file' | 'paste')}
                className={`flex-1 py-2 font-heading font-bold text-sm transition-colors cursor-pointer ${tab === t ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-yello-pale'}`}
              >
                {t === 'file' ? '📁 Upload File' : '📋 Paste Text'}
              </button>
            ))}
          </div>

          {tab === 'file' ? (
            <>
              {file ? (
                <div className="flex items-center gap-3 border-2 border-ink p-3 bg-yello-pale">
                  <FileText size={20} />
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm truncate">{file.name}</p>
                    <p className="font-mono text-xs text-ink/60">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => setFile(null)} className="cursor-pointer"><X size={16} /></button>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed cursor-pointer p-8 flex flex-col items-center gap-3 text-center transition-colors
                    ${isDragActive ? 'border-ink bg-yello' : 'border-ink/40 bg-yello-pale hover:border-ink hover:bg-yello-light'}`}
                >
                  <input {...getInputProps()} />
                  <Upload size={28} className="text-ink/60" />
                  <div>
                    <p className="font-heading font-bold text-sm">Drop your file here</p>
                    <p className="font-body text-xs text-ink/60 mt-1">JSON, CSV, TXT or Markdown — max 5MB</p>
                  </div>
                </div>
              )}

              <div className="bg-yello-pale border border-ink/20 p-3 text-xs font-body text-ink/70 space-y-1">
                <p className="font-bold text-ink">Supported formats:</p>
                <p>• <strong>JSON</strong>: Array of objects with <code>caption_text</code> field</p>
                <p>• <strong>CSV</strong>: Headers: caption_text, platform, post_type, tone, language</p>
                <p>• <strong>TXT/MD</strong>: Separate captions with blank lines</p>
              </div>
            </>
          ) : (
            <Textarea
              label="Paste captions"
              placeholder={`Paste JSON array:\n[{"caption_text": "Your caption..."}]\n\nOr plain text (separate captions with blank lines):\n\nFirst caption here...\n\nSecond caption here...`}
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              rows={8}
            />
          )}

          {/* Result */}
          {result && (
            <div className={`border-2 p-3 ${result.imported > 0 ? 'border-green-500 bg-green-50' : 'border-ink/30 bg-yello-pale'}`}>
              <div className="flex items-center gap-2 mb-1">
                {result.imported > 0 ? <CheckCircle size={16} className="text-green-600" /> : <AlertCircle size={16} />}
                <span className="font-heading font-bold text-sm">Import Complete</span>
              </div>
              <div className="font-body text-xs space-y-0.5">
                <p>✅ Added: <strong>{result.imported}</strong></p>
                <p>⏭ Skipped (duplicates): <strong>{result.duplicates}</strong></p>
                {result.errors?.length > 0 && <p>❌ Errors: <strong>{result.errors.length}</strong></p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-ink p-4 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            variant="primary"
            loading={importing}
            onClick={handleImport}
            disabled={!file && !pastedText.trim()}
            className="flex-1"
          >
            Import Captions
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DatasetImporter;

