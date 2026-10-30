import React from 'react';
import { Input, Textarea } from '../ui/Input';
import { Select } from '../ui/Select';
import { useAppStore } from '../../stores/appStore';
import { POST_TYPE_LABELS } from '../../types';
import type { PostType } from '../../types';

const POST_TYPE_OPTIONS = Object.entries(POST_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export const EventDetailsForm: React.FC = () => {
  const { eventData, setEventData, postType, setPostType } = useAppStore();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Event Name *"
          placeholder="YelloHack 2024"
          value={eventData.name}
          onChange={e => setEventData({ name: e.target.value })}
        />
        <Input
          label="Organizer"
          placeholder="Yellove Tech Community"
          value={eventData.organizer}
          onChange={e => setEventData({ organizer: e.target.value })}
        />
      </div>

      <Textarea
        label="Event Description"
        placeholder="What's this event about? What makes it special?"
        value={eventData.description}
        onChange={e => setEventData({ description: e.target.value })}
        rows={3}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Date"
          placeholder="March 15, 2024"
          value={eventData.date}
          onChange={e => setEventData({ date: e.target.value })}
        />
        <Input
          label="Time"
          placeholder="10:00 AM – 6:00 PM"
          value={eventData.time}
          onChange={e => setEventData({ time: e.target.value })}
        />
      </div>

      <Input
        label="Venue"
        placeholder="Main Auditorium, ABC College, Chennai"
        value={eventData.venue}
        onChange={e => setEventData({ venue: e.target.value })}
      />

      <Input
        label="Registration Link"
        placeholder="https://yellove.tech/register"
        value={eventData.registrationLink}
        onChange={e => setEventData({ registrationLink: e.target.value })}
        type="url"
      />

      <Input
        label="Important Highlights"
        placeholder="₹1L prize pool, 24hr hackathon, free food, mentors from Google"
        value={eventData.highlights}
        onChange={e => setEventData({ highlights: e.target.value })}
        hint="Comma-separated highlights"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Call to Action"
          placeholder="Register now before spots fill up!"
          value={eventData.cta}
          onChange={e => setEventData({ cta: e.target.value })}
        />
        <Select
          label="Post Type"
          value={postType}
          onChange={e => setPostType(e.target.value as PostType)}
          options={POST_TYPE_OPTIONS}
        />
      </div>

      <Textarea
        label="Reference Caption (optional)"
        placeholder="Paste a caption you love — we'll match its vibe"
        value={eventData.referenceCaption}
        onChange={e => setEventData({ referenceCaption: e.target.value })}
        rows={3}
        hint="Optional: show us a caption you really like"
      />
    </div>
  );
};

export default EventDetailsForm;

