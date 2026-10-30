import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { Button } from '../ui/Button';

const SUGGESTION_CHIPS = [
  'Make it more catchy ✨',
  'Konjam shorter ah',
  'Add a better hook',
  'Less formal ah',
  'More emojis',
  'Different CTA',
  'Namma style la write pannu',
  'Make it sound less AI',
  'Three different versions kudu',
];

export const RefinementChat: React.FC = () => {
  const { chatMessages, isRefining, refineCaption, generatedCaptions, activePlatformTab } = useAppStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasCaptions = Object.keys(generatedCaptions).length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isRefining]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isRefining || !hasCaptions) return;
    setInput('');
    await refineCaption(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white border-2 border-ink shadow-[4px_4px_0px_#171717] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b-2 border-ink bg-ink flex items-center gap-2">
        <Sparkles size={16} className="text-yello" />
        <span className="font-heading font-bold text-sm text-white">REFINE WITH CHAT</span>
        <span className="font-mono text-[10px] text-white/50 ml-auto">
          editing: {activePlatformTab}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-72 min-h-[120px]">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-4 gap-2 text-center">
            <p className="font-body text-sm text-ink/50">
              {hasCaptions
                ? 'Ask me to change anything — I\'ll remember the event details.'
                : 'Generate captions first, then refine them here.'}
            </p>
          </div>
        )}

        {chatMessages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[85%] px-3 py-2 border-2 border-ink font-body text-sm
                ${msg.role === 'user'
                  ? 'bg-ink text-white shadow-[2px_2px_0px_#FFD83D]'
                  : 'bg-yello-pale text-ink shadow-[2px_2px_0px_#171717]'
                }
              `}
            >
              {msg.role === 'assistant' && msg.content.length > 200
                ? <pre className="whitespace-pre-wrap font-body text-sm">{msg.content}</pre>
                : msg.content
              }
            </div>
          </div>
        ))}

        {isRefining && (
          <div className="flex justify-start">
            <div className="bg-yello border-2 border-ink px-3 py-2 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              <span className="font-body text-xs text-ink">Writing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips */}
      {hasCaptions && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {SUGGESTION_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => { setInput(chip); inputRef.current?.focus(); }}
              className="flex-shrink-0 px-2.5 py-1 font-body text-xs border border-ink/30 hover:border-ink hover:bg-yello-pale cursor-pointer whitespace-nowrap transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t-2 border-ink p-3 flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={hasCaptions
            ? 'Innum konjam catchy ah kudu... or anything!'
            : 'Generate captions first to enable chat'
          }
          disabled={!hasCaptions || isRefining}
          className="flex-1 px-3 py-2 font-body text-sm border-2 border-ink focus:outline-none focus:ring-2 focus:ring-yello disabled:opacity-50 disabled:bg-yello-pale"
        />
        <Button
          variant="primary"
          size="sm"
          icon={isRefining ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          onClick={handleSend}
          disabled={!input.trim() || !hasCaptions || isRefining}
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default RefinementChat;

