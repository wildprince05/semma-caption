import React, { useState, useRef, useEffect } from 'react';
import { Copy, RefreshCw, ChevronDown, ArrowUp, ArrowDown, Check, Hash, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../../stores/appStore';
import { Button } from '../ui/Button';
import type { Platform, GeneratedCaption } from '../../types';

const PLATFORM_LIMITS: Record<Platform, number> = {
  instagram: 2200,
  whatsapp: 65536,
  linkedin: 3000,
};

interface CaptionCardProps {
  platform: Platform;
}

export const CaptionSkeleton: React.FC = () => (
  <div className="bg-white border-2 border-ink shadow-[4px_4px_0px_#171717] p-5 flex flex-col gap-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-5 w-28 bg-yello-light rounded" />
      <div className="h-4 w-16 bg-yello-pale rounded" />
    </div>
    <div className="space-y-2">
      <div className="h-4 w-full bg-yello-pale rounded" />
      <div className="h-4 w-5/6 bg-yello-pale rounded" />
      <div className="h-4 w-4/6 bg-yello-pale rounded" />
      <div className="h-4 w-full bg-yello-pale rounded" />
      <div className="h-4 w-3/4 bg-yello-pale rounded" />
    </div>
    <div className="flex gap-2">
      <div className="h-8 w-20 bg-yello-light border-2 border-ink/30 rounded" />
      <div className="h-8 w-24 bg-yello-light border-2 border-ink/30 rounded" />
    </div>
  </div>
);

export const CaptionCard: React.FC<CaptionCardProps> = ({ platform }) => {
  const { currentCaptions, generatedCaptions, updateCaptionText, restoreVersion, isGenerating, isRefining, selectedPlatforms } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showHashtags, setShowHashtags] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const versionRef = useRef<HTMLDivElement>(null);

  const text = currentCaptions[platform] || '';
  const versions = generatedCaptions[platform] || [];
  const currentVersion = versions.find(v => v.is_current);
  const limit = PLATFORM_LIMITS[platform];
  const charCount = text.length;
  const isOverLimit = charCount > limit;

  // Extract hashtags
  const hashtags = text.match(/#\w+/g) || [];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  // Close version dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (versionRef.current && !versionRef.current.contains(e.target as Node)) {
        setShowVersions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied! 📋');
    setTimeout(() => setCopied(false), 2000);
  };

  const platformLabel: Record<Platform, string> = {
    instagram: '📸 Instagram',
    whatsapp: '💬 WhatsApp',
    linkedin: '💼 LinkedIn',
  };

  const isLoading = isGenerating && !text;

  if (isLoading) return <CaptionSkeleton />;
  if (!text && !isGenerating) {
    if (!selectedPlatforms.includes(platform)) return null;
    return (
      <div className="bg-white border-2 border-ink/30 p-8 flex flex-col items-center gap-2 text-center">
        <div className="text-3xl">✍️</div>
        <p className="font-heading font-bold text-sm text-ink/50">Caption will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-ink shadow-[4px_4px_0px_#171717] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-ink bg-yello-pale">
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-sm text-ink">{platformLabel[platform]}</span>
          {currentVersion && (
            <span className="font-mono text-[10px] bg-ink text-white px-1.5 py-0.5">
              v{currentVersion.version}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Char count */}
          <span className={`font-mono text-xs ${isOverLimit ? 'text-red-600 font-bold' : 'text-ink/50'}`}>
            {charCount}/{limit}
          </span>
          {isOverLimit && <AlertCircle size={14} className="text-red-500" />}
        </div>
      </div>

      {/* Caption text — editable */}
      <div className="p-4">
        {(isGenerating && !text) || isRefining ? (
          <div className="flex items-center gap-2 py-4">
            <div className="animate-shimmer w-full h-4 rounded" />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => updateCaptionText(platform, e.target.value)}
            className="w-full font-body text-sm text-ink bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-yello min-h-[120px] leading-relaxed"
            placeholder="Your caption will appear here..."
          />
        )}
      </div>

      {/* Hashtag strip */}
      {hashtags.length > 0 && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setShowHashtags(!showHashtags)}
            className="flex items-center gap-1 text-xs font-mono text-ink/60 hover:text-ink cursor-pointer"
          >
            <Hash size={12} />
            {hashtags.length} hashtags
            <ChevronDown size={12} className={`transition-transform ${showHashtags ? 'rotate-180' : ''}`} />
          </button>
          {showHashtags && (
            <div className="mt-2 flex flex-wrap gap-1">
              {hashtags.map(tag => (
                <span key={tag} className="font-mono text-[10px] bg-yello-pale border border-ink/20 px-1.5 py-0.5">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="border-t-2 border-ink/20 p-3 flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          icon={copied ? <Check size={14} /> : <Copy size={14} />}
          onClick={handleCopy}
          disabled={!text}
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />}
          onClick={() => useAppStore.getState().generateCaptions()}
          loading={isGenerating}
        >
          Regenerate
        </Button>

        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowDown size={14} />}
          onClick={() => {
            const words = text.split(/\s+/);
            const shortened = words.slice(0, Math.ceil(words.length * 0.65)).join(' ');
            updateCaptionText(platform, shortened);
          }}
          disabled={!text || text.length < 100}
        >
          Shorten
        </Button>

        {/* Version history */}
        {versions.length > 1 && (
          <div className="relative ml-auto" ref={versionRef}>
            <Button
              variant="ghost"
              size="sm"
              icon={<ChevronDown size={14} className={showVersions ? 'rotate-180 transition-transform' : 'transition-transform'} />}
              onClick={() => setShowVersions(!showVersions)}
            >
              History ({versions.length})
            </Button>
            {showVersions && (
              <div className="absolute right-0 bottom-full mb-1 bg-white border-2 border-ink shadow-[4px_4px_0px_#171717] min-w-[200px] z-10">
                {[...versions].reverse().map(v => (
                  <button
                    key={v.version}
                    onClick={() => { restoreVersion(platform, v.version); setShowVersions(false); }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 text-left hover:bg-yello-pale
                      border-b border-ink/10 last:border-0 cursor-pointer
                      ${v.is_current ? 'bg-yello' : ''}
                    `}
                  >
                    <span className="font-heading font-bold text-xs">
                      {v.is_current ? '→ ' : ''}v{v.version}
                    </span>
                    <span className="font-mono text-[10px] text-ink/50">
                      {v.caption_text.slice(0, 30)}...
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptionCard;

