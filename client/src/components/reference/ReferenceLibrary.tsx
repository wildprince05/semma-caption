import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { StatsCards } from './StatsCards';
import { ReferenceCard } from './ReferenceCard';
import { DatasetImporter } from './DatasetImporter';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { api } from '../../services/api';
import { useAppStore } from '../../stores/appStore';
import type { ReferenceCaption, ReferenceStats, Platform } from '../../types';

const PLATFORM_OPTIONS = [
  { value: '', label: 'All Platforms' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'linkedin', label: 'LinkedIn' },
];

const POST_TYPE_OPTIONS = [
  { value: '', label: 'All Post Types' },
  { value: 'event_announcement', label: 'Event Announcement' },
  { value: 'event_reminder', label: 'Event Reminder' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'recap', label: 'Recap' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'achievement', label: 'Achievement' },
];

export const ReferenceLibrary: React.FC = () => {
  const { loadReferenceStats } = useAppStore();
  const [references, setReferences] = useState<ReferenceCaption[]>([]);
  const [stats, setStats] = useState<ReferenceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const [postType, setPostType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [importOpen, setImportOpen] = useState(false);

  const fetchReferences = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getReferences({
        platform: platform as Platform || undefined,
        postType: postType as any || undefined,
        search: search || undefined,
        page,
        limit: 12,
      });
      setReferences(res.references as ReferenceCaption[]);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, [platform, postType, search, page]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await api.getReferenceStats();
      setStats(s as ReferenceStats);
    } catch { /* noop */ }
  }, []);

  useEffect(() => { fetchReferences(); }, [fetchReferences]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleUpdate = (updated: ReferenceCaption) => {
    setReferences(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleDelete = (id: string) => {
    setReferences(prev => prev.filter(r => r.id !== id));
    fetchStats();
    loadReferenceStats();
  };

  const handleImported = () => {
    setPage(1);
    fetchReferences();
    fetchStats();
    loadReferenceStats();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading font-bold text-3xl text-ink">REFERENCE LIBRARY</h1>
          <p className="font-body text-sm text-ink/60 mt-1">Your caption style database. The AI learns from these.</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setImportOpen(true)}
        >
          Import Captions
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Stats */}
        <div className="lg:col-span-1">
          {stats ? (
            <StatsCards stats={stats} />
          ) : (
            <div className="bg-yello-pale border-2 border-ink p-6 animate-pulse">
              <div className="h-12 w-16 bg-yello rounded mb-2" />
              <div className="h-4 w-24 bg-yello-light rounded" />
            </div>
          )}
        </div>

        {/* Main: Filters + List */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                value={search}
                onChange={handleSearchChange}
                placeholder="Search captions..."
                className="w-full pl-9 pr-3 py-2.5 font-body text-sm border-2 border-ink focus:outline-none focus:ring-2 focus:ring-yello"
              />
            </div>
            <Select
              options={PLATFORM_OPTIONS}
              value={platform}
              onChange={e => { setPlatform(e.target.value); setPage(1); }}
              className="sm:w-40"
            />
            <Select
              options={POST_TYPE_OPTIONS}
              value={postType}
              onChange={e => { setPostType(e.target.value); setPage(1); }}
              className="sm:w-48"
            />
          </div>

          {/* Results info */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-ink/50">
              {loading ? 'Loading...' : `${total} captions`}
            </span>
            {(search || platform || postType) && (
              <button
                onClick={() => { setSearch(''); setPlatform(''); setPostType(''); setPage(1); }}
                className="font-body text-xs text-ink/60 underline cursor-pointer hover:text-ink"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-yello-pale border-2 border-ink/30 p-4 h-40 animate-pulse" />
              ))}
            </div>
          ) : references.length === 0 ? (
            <div className="border-2 border-dashed border-ink/30 p-12 flex flex-col items-center gap-3 text-center">
              <div className="text-4xl">📭</div>
              <p className="font-heading font-bold text-lg text-ink">No captions found</p>
              <p className="font-body text-sm text-ink/60">
                {total === 0
                  ? 'Import your reference captions to get started'
                  : 'Try different search terms or filters'}
              </p>
              {total === 0 && (
                <Button variant="primary" onClick={() => setImportOpen(true)} icon={<Plus size={14} />}>
                  Import Captions
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {references.map(ref => (
                <ReferenceCard
                  key={ref.id}
                  reference={ref}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronLeft size={14} />}
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Prev
              </Button>
              <span className="font-mono text-sm">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronRight size={14} />}
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Import modal */}
      {importOpen && (
        <DatasetImporter
          onImported={handleImported}
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  );
};

export default ReferenceLibrary;

