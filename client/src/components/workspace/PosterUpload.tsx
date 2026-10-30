import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image, Loader2, CheckCircle } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { Button } from '../ui/Button';

export const PosterUpload: React.FC = () => {
  const { posterPreview, posterFile, setPosterFile, analyzePoster, isAnalyzing, extractedPosterData } = useAppStore();
  const [dragOver, setDragOver] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setPosterFile(accepted[0]);
    setDragOver(false);
  }, [setPosterFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': [], 'image/jpeg': [], 'image/webp': [] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    onDragEnter: () => setDragOver(true),
    onDragLeave: () => setDragOver(false),
  });

  if (posterPreview) {
    return (
      <div className="flex flex-col gap-3">
        <div className="relative border-2 border-ink shadow-[3px_3px_0px_#171717]">
          <img src={posterPreview} alt="Uploaded poster" className="w-full max-h-64 object-contain bg-yello-pale" />
          <button
            onClick={() => setPosterFile(null)}
            className="absolute top-2 right-2 bg-white border-2 border-ink p-1 hover:bg-red-100 cursor-pointer"
          >
            <X size={14} />
          </button>
          {extractedPosterData && (
            <div className="absolute top-2 left-2 bg-green-400 border-2 border-ink px-2 py-1 flex items-center gap-1">
              <CheckCircle size={12} />
              <span className="font-mono text-xs font-bold">ANALYZED</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            loading={isAnalyzing}
            onClick={analyzePoster}
            disabled={!!extractedPosterData}
            className="flex-1"
            icon={isAnalyzing ? undefined : <Image size={14} />}
          >
            {isAnalyzing ? 'Analyzing...' : extractedPosterData ? 'Details Extracted ✓' : 'Analyze Poster'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPosterFile(null)}>
            Remove
          </Button>
        </div>
        {extractedPosterData && (
          <p className="text-xs font-body text-ink/60 border-l-2 border-yello pl-2">
            Event details auto-filled below. Review and edit if needed.
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed cursor-pointer transition-all duration-150 p-8
        flex flex-col items-center justify-center gap-3 text-center
        ${isDragActive || dragOver
          ? 'border-ink bg-yello shadow-[4px_4px_0px_#171717]'
          : 'border-ink/40 bg-yello-pale hover:border-ink hover:bg-yello-light'
        }
      `}
    >
      <input {...getInputProps()} />
      <Upload size={32} className={isDragActive ? 'text-ink' : 'text-ink/50'} />
      <div>
        <p className="font-heading font-bold text-sm text-ink">
          {isDragActive ? 'Drop it here!' : 'Drag & drop your poster'}
        </p>
        <p className="font-body text-xs text-ink/60 mt-1">PNG, JPG, JPEG or WebP — max 10MB</p>
      </div>
      <Button variant="secondary" size="sm">Browse Files</Button>
    </div>
  );
};

export default PosterUpload;

