import React from 'react';
import { Card } from '../ui/Card';
import type { ReferenceStats } from '../../types';

interface StatsCardsProps {
  stats: ReferenceStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const PLATFORM_COLORS: Record<string, string> = {
    instagram: 'bg-pink-100 border-pink-400',
    whatsapp: 'bg-green-100 border-green-400',
    linkedin: 'bg-blue-100 border-blue-400',
    unknown: 'bg-yello-pale border-ink/30',
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Big stat */}
      <div className="bg-yello border-2 border-ink shadow-[4px_4px_0px_#171717] p-5 flex items-center justify-between">
        <div>
          <div className="font-heading font-bold text-5xl text-ink">{stats.total}</div>
          <div className="font-body text-sm text-ink/70 mt-1">Total Reference Captions</div>
        </div>
        <div className="font-heading font-bold text-6xl text-ink/10">📚</div>
      </div>

      {/* Platform breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Object.entries(stats.byPlatform).map(([platform, count]) => (
          <div key={platform} className={`border-2 p-3 ${PLATFORM_COLORS[platform] || 'bg-yello-pale border-ink/30'}`}>
            <div className="font-heading font-bold text-2xl text-ink">{count}</div>
            <div className="font-body text-xs text-ink/70 capitalize">{platform}</div>
          </div>
        ))}
        {stats.preferred > 0 && (
          <div className="border-2 border-ink bg-white p-3">
            <div className="font-heading font-bold text-2xl text-ink">⭐ {stats.preferred}</div>
            <div className="font-body text-xs text-ink/70">Preferred</div>
          </div>
        )}
      </div>

      {/* Post type breakdown */}
      {Object.keys(stats.byPostType).length > 0 && (
        <Card variant="flat" padding>
          <p className="font-heading font-bold text-xs text-ink mb-2">BY POST TYPE</p>
          <div className="flex flex-col gap-1">
            {Object.entries(stats.byPostType)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-xs">
                  <span className="font-body text-ink/70 capitalize">{type.replace(/_/g, ' ')}</span>
                  <span className="font-mono font-bold text-ink">{count}</span>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default StatsCards;

