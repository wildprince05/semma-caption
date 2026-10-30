import React from 'react';
import { Instagram, MessageCircle, Linkedin } from 'lucide-react';
import { Tabs } from '../ui/Tabs';
import { CaptionCard, CaptionSkeleton } from '../caption/CaptionCard';
import { RefinementChat } from '../chat/RefinementChat';
import { useAppStore } from '../../stores/appStore';
import type { Platform } from '../../types';

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  instagram: <Instagram size={14} />,
  whatsapp: <MessageCircle size={14} />,
  linkedin: <Linkedin size={14} />,
};

export const OutputLab: React.FC = () => {
  const { selectedPlatforms, activePlatformTab, setActivePlatformTab, isGenerating, generatedCaptions } = useAppStore();

  const tabs = selectedPlatforms.map(p => ({
    id: p,
    label: p.charAt(0).toUpperCase() + p.slice(1),
    icon: PLATFORM_ICONS[p],
  }));

  const hasAnyCaptions = Object.values(generatedCaptions).some(versions => versions.length > 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Label sticker */}
      <div className="flex items-center gap-3">
        <div className="bg-yello text-ink px-3 py-1 font-heading font-bold text-sm border-2 border-ink rotate-[1deg] shadow-[3px_3px_0px_#171717]">
          CAPTION OUTPUT LAB
        </div>
        <span className="font-mono text-xs text-ink/50">Your captions appear here ↓</span>
      </div>

      {/* Empty state */}
      {!hasAnyCaptions && !isGenerating && (
        <div className="border-2 border-dashed border-ink/30 p-12 flex flex-col items-center gap-4 text-center bg-yello-pale">
          <div className="text-5xl">🚀</div>
          <div>
            <p className="font-heading font-bold text-lg text-ink">Ready to make some noise?</p>
            <p className="font-body text-sm text-ink/60 mt-1">
              Fill in event details on the left and hit Generate. Semma captions incoming!
            </p>
          </div>
        </div>
      )}

      {/* Platform tabs + captions */}
      {(hasAnyCaptions || isGenerating) && (
        <>
          {tabs.length > 1 && (
            <Tabs
              tabs={tabs}
              activeTab={activePlatformTab}
              onTabChange={id => setActivePlatformTab(id as Platform)}
            />
          )}

          {isGenerating && !Object.keys(generatedCaptions).length ? (
            <div className="flex flex-col gap-4">
              {selectedPlatforms.map(p => <CaptionSkeleton key={p} />)}
            </div>
          ) : (
            <div>
              {tabs.length > 1
                ? <CaptionCard platform={activePlatformTab} />
                : selectedPlatforms.map(p => <CaptionCard key={p} platform={p} />)
              }
            </div>
          )}
        </>
      )}

      {/* Refinement Chat */}
      <RefinementChat />
    </div>
  );
};

export default OutputLab;

