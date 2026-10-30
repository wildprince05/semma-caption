import React from 'react';
import { Instagram, MessageCircle, Linkedin } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import type { Platform } from '../../types';

const PLATFORMS: { id: Platform; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    desc: 'Catchy hooks, emojis, hashtags',
    icon: <Instagram size={22} />,
    color: 'hover:bg-pink-50',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    desc: 'Short, scannable, direct',
    icon: <MessageCircle size={22} />,
    color: 'hover:bg-green-50',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    desc: 'Professional yet human',
    icon: <Linkedin size={22} />,
    color: 'hover:bg-blue-50',
  },
];

export const PlatformSelector: React.FC = () => {
  const { selectedPlatforms, togglePlatform } = useAppStore();

  return (
    <div className="grid grid-cols-3 gap-3">
      {PLATFORMS.map(({ id, label, desc, icon, color }) => {
        const selected = selectedPlatforms.includes(id);
        return (
          <button
            key={id}
            onClick={() => togglePlatform(id)}
            className={`
              flex flex-col items-center gap-2 p-3 border-2 cursor-pointer
              transition-all duration-150 text-center
              ${selected
                ? 'bg-yello border-ink shadow-[3px_3px_0px_#171717] -translate-x-[1px] -translate-y-[1px]'
                : `bg-white border-ink/30 ${color} hover:border-ink`
              }
            `}
          >
            <div className={`${selected ? 'text-ink' : 'text-ink/60'}`}>{icon}</div>
            <div>
              <div className="font-heading font-bold text-xs text-ink">{label}</div>
              <div className="font-body text-[10px] text-ink/60 leading-tight mt-0.5 hidden sm:block">{desc}</div>
            </div>
            {selected && (
              <div className="w-5 h-5 rounded-full bg-ink text-white flex items-center justify-center text-[10px] font-bold">✓</div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PlatformSelector;

