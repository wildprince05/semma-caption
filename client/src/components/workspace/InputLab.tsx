import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Card } from '../ui/Card';
import { PosterUpload } from './PosterUpload';
import { EventDetailsForm } from './EventDetailsForm';
import { PlatformSelector } from './PlatformSelector';
import { StyleControls } from './StyleControls';
import { Button } from '../ui/Button';
import { useAppStore } from '../../stores/appStore';
import { Zap } from 'lucide-react';
import { useState } from 'react';

export const InputLab: React.FC = () => {
  const { generateCaptions, isGenerating, selectedPlatforms, eventData } = useAppStore();
  const [posterOpen, setPosterOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(true);

  const canGenerate = selectedPlatforms.length > 0 && eventData.name.trim().length > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Label sticker */}
      <div className="flex items-center gap-3">
        <div className="bg-ink text-white px-3 py-1 font-heading font-bold text-sm rotate-[-1deg] shadow-[3px_3px_0px_#FFD83D]">
          INPUT LAB
        </div>
        <span className="font-mono text-xs text-ink/50">Fill in the details →</span>
      </div>

      {/* Poster Upload */}
      <Card className="p-0" variant="default">
        <button
          className="w-full flex items-center justify-between px-4 py-3 border-b-2 border-ink cursor-pointer hover:bg-yello-pale"
          onClick={() => setPosterOpen(!posterOpen)}
        >
          <span className="font-heading font-bold text-sm text-ink">📸 Upload Poster</span>
          <ChevronDown size={16} className={`transition-transform ${posterOpen ? 'rotate-180' : ''}`} />
        </button>
        {posterOpen && (
          <div className="p-4">
            <PosterUpload />
          </div>
        )}
      </Card>

      {/* Event Details */}
      <Card className="p-0" variant="default">
        <button
          className="w-full flex items-center justify-between px-4 py-3 border-b-2 border-ink cursor-pointer hover:bg-yello-pale"
          onClick={() => setDetailsOpen(!detailsOpen)}
        >
          <span className="font-heading font-bold text-sm text-ink">✏️ Event Details</span>
          <ChevronDown size={16} className={`transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
        </button>
        {detailsOpen && (
          <div className="p-4">
            <EventDetailsForm />
          </div>
        )}
      </Card>

      {/* Platform Selection */}
      <Card>
        <p className="font-heading font-bold text-sm text-ink mb-3">🎯 Select Platforms</p>
        <PlatformSelector />
      </Card>

      {/* Style Controls */}
      <Card>
        <p className="font-heading font-bold text-sm text-ink mb-3">🎨 Style</p>
        <StyleControls />
      </Card>

      {/* Generate Button */}
      <Button
        size="lg"
        loading={isGenerating}
        onClick={generateCaptions}
        disabled={!canGenerate}
        icon={<Zap size={20} />}
        className="w-full text-base"
      >
        {isGenerating ? 'Generating Semma Captions...' : 'GENERATE CAPTIONS'}
      </Button>

      {!canGenerate && (
        <p className="text-center font-body text-xs text-ink/50">
          {!eventData.name.trim() ? 'Add an event name to get started' : 'Select at least one platform'}
        </p>
      )}
    </div>
  );
};

export default InputLab;

