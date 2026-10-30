import React, { useState } from 'react';
import { Star, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import type { ReferenceCaption } from '../../types';

interface ReferenceCardProps {
  reference: ReferenceCaption;
  onUpdate: (updated: ReferenceCaption) => void;
  onDelete: (id: string) => void;
}

export const ReferenceCard: React.FC<ReferenceCardProps> = ({ reference, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reference.caption_text);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const PREVIEW_LEN = 160;
  const isLong = reference.caption_text.length > PREVIEW_LEN;
  const displayText = expanded || !isLong
    ? reference.caption_text
    : reference.caption_text.slice(0, PREVIEW_LEN) + '...';

  const handlePreferred = async () => {
    try {
      await api.updateReference(reference.id, { is_preferred: !reference.is_preferred });
      onUpdate({ ...reference, is_preferred: !reference.is_preferred });
      toast.success(reference.is_preferred ? 'Removed from preferred' : 'Marked as preferred ⭐');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleSave = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      await api.updateReference(reference.id, { caption_text: editText });
      onUpdate({ ...reference, caption_text: editText });
      setEditing(false);
      toast.success('Caption updated');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); return; }
    setDeleting(true);
    try {
      await api.deleteReference(reference.id);
      onDelete(reference.id);
      toast.success('Caption deleted');
    } catch {
      toast.error('Failed to delete');
      setDeleting(false);
    }
  };

  return (
    <div className={`bg-white border-2 border-ink shadow-[3px_3px_0px_#171717] flex flex-col ${reference.is_preferred ? 'border-yello shadow-[3px_3px_0px_#FFD83D]' : ''}`}>
      {/* Caption text */}
      <div className="p-4 flex-1">
        {editing ? (
          <div className="flex flex-col gap-2">
            <Textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={6}
            />
            <div className="flex gap-2">
              <Button size="sm" loading={saving} onClick={handleSave}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditText(reference.caption_text); }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-body text-sm text-ink whitespace-pre-line leading-relaxed">{displayText}</p>
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 flex items-center gap-1 font-body text-xs text-ink/50 hover:text-ink cursor-pointer"
              >
                {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show more</>}
              </button>
            )}
          </>
        )}
      </div>

      {/* Meta badges */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {reference.platform && <Badge variant="yellow" size="sm">{reference.platform}</Badge>}
        {reference.post_type && <Badge variant="white" size="sm">{reference.post_type.replace(/_/g, ' ')}</Badge>}
        {reference.tone && <Badge variant="white" size="sm">{reference.tone}</Badge>}
        {reference.language && reference.language !== 'tanglish' && <Badge variant="white" size="sm">{reference.language}</Badge>}
        {reference.is_preferred && <Badge variant="orange" size="sm">⭐ Preferred</Badge>}
      </div>

      {/* Actions */}
      <div className="border-t-2 border-ink/10 px-4 py-2 flex items-center gap-2">
        <button
          onClick={handlePreferred}
          className={`p-1.5 border border-ink/20 hover:border-ink cursor-pointer transition-colors ${reference.is_preferred ? 'bg-yello' : 'bg-white hover:bg-yello-pale'}`}
          title="Mark as preferred"
        >
          <Star size={13} fill={reference.is_preferred ? '#171717' : 'none'} />
        </button>
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 border border-ink/20 bg-white hover:bg-yello-pale hover:border-ink cursor-pointer"
          title="Edit"
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`p-1.5 border cursor-pointer transition-colors ${confirmDelete ? 'bg-red-500 text-white border-red-700' : 'bg-white border-ink/20 hover:bg-red-50 hover:border-red-400'}`}
          title={confirmDelete ? 'Click again to confirm delete' : 'Delete'}
        >
          <Trash2 size={13} />
        </button>
        <span className="ml-auto font-mono text-[10px] text-ink/30">#{reference.id}</span>
      </div>
    </div>
  );
};

export default ReferenceCard;

