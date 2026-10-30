import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { Badge } from '../ui/Badge';
import type { Tone, Language, CaptionLength } from '../../types';

const TONES: { value: Tone; label: string }[] = [
  { value: 'energetic', label: 'Energetic ⚡' },
  { value: 'casual', label: 'Casual 😎' },
  { value: 'professional', label: 'Professional 💼' },
  { value: 'urgent', label: 'Urgent 🚨' },
  { value: 'humorous', label: 'Humorous 😂' },
  { value: 'warm', label: 'Warm 🤗' },
  { value: 'inspirational', label: 'Inspirational ✨' },
  { value: 'celebratory', label: 'Celebratory 🎉' },
];

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'tanglish', label: 'Tanglish 🇮🇳' },
  { value: 'english', label: 'English 🇬🇧' },
  { value: 'tamil', label: 'Tamil தமிழ்' },
  { value: 'custom', label: 'Custom Mix' },
];

const LENGTHS: { value: CaptionLength; label: string; desc: string }[] = [
  { value: 'short', label: 'Short', desc: '80–150 words' },
  { value: 'medium', label: 'Medium', desc: '150–250 words' },
  { value: 'long', label: 'Long', desc: '250–400 words' },
];

export const StyleControls: React.FC = () => {
  const { tone, setTone, language, setLanguage, length, setLength } = useAppStore();

  return (
    <div className="flex flex-col gap-5">
      {/* Tone */}
      <div>
        <p className="font-heading font-bold text-sm text-ink mb-2">Tone</p>
        <div className="flex flex-wrap gap-2">
          {TONES.map(t => (
            <Badge
              key={t.value}
              variant={tone === t.value ? 'black' : 'white'}
              size="sm"
              onClick={() => setTone(t.value)}
              active={tone === t.value}
            >
              {t.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Language */}
      <div>
        <p className="font-heading font-bold text-sm text-ink mb-2">Language</p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(l => (
            <Badge
              key={l.value}
              variant={language === l.value ? 'yellow' : 'white'}
              size="sm"
              onClick={() => setLanguage(l.value)}
              active={language === l.value}
            >
              {l.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Length */}
      <div>
        <p className="font-heading font-bold text-sm text-ink mb-2">Length</p>
        <div className="flex gap-2">
          {LENGTHS.map(l => (
            <button
              key={l.value}
              onClick={() => setLength(l.value)}
              className={`
                flex-1 flex flex-col items-center py-2 px-3 border-2 cursor-pointer
                transition-all duration-150
                ${length === l.value
                  ? 'bg-yello border-ink shadow-[2px_2px_0px_#171717]'
                  : 'bg-white border-ink/30 hover:border-ink'
                }
              `}
            >
              <span className="font-heading font-bold text-xs text-ink">{l.label}</span>
              <span className="font-mono text-[10px] text-ink/60">{l.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StyleControls;

