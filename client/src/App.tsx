import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/layout/Header';
import { Hero } from './components/layout/Hero';
import { InputLab } from './components/workspace/InputLab';
import { OutputLab } from './components/workspace/OutputLab';
import { ReferenceLibrary } from './components/reference/ReferenceLibrary';
import { useAppStore } from './stores/appStore';

const WorkspaceView: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      {/* Left: Input Lab */}
      <div className="flex flex-col gap-0">
        <InputLab />
      </div>
      {/* Right: Output Lab */}
      <div className="flex flex-col gap-0">
        <OutputLab />
      </div>
    </div>
  </div>
);

const HomeView: React.FC = () => {
  const { setView } = useAppStore();
  return (
    <>
      <Hero />
      {/* Features section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              emoji: '📸',
              title: 'Poster → Caption',
              desc: 'Upload your event poster. Gemini Vision auto-extracts dates, venues, prizes, and all the details.',
              color: 'bg-yello',
            },
            {
              emoji: '🎨',
              title: 'Style-Matched',
              desc: 'Your reference captions teach us your style. We generate new captions that sound like you, not a bot.',
              color: 'bg-yello-light',
            },
            {
              emoji: '💬',
              title: 'Refine with Chat',
              desc: '"Innum catchy ah kudu" — just tell us in Tanglish what to change. We\'ll rewrite only what you ask.',
              color: 'bg-white',
            },
            {
              emoji: '🇮🇳',
              title: 'Real Tanglish',
              desc: 'Not awkward machine Tamil. Authentic Chennai-style Tanglish that your community actually uses.',
              color: 'bg-accent-orange text-white',
            },
            {
              emoji: '📱',
              title: 'Platform-Specific',
              desc: 'Instagram, WhatsApp, LinkedIn — each gets its own format, length, tone, and hashtag strategy.',
              color: 'bg-yello',
            },
            {
              emoji: '📚',
              title: 'Reference Library',
              desc: 'Import your past captions. We use them as style references — never copied verbatim, always improved.',
              color: 'bg-yello-light',
            },
          ].map(({ emoji, title, desc, color }) => (
            <div
              key={title}
              className={`${color} border-2 border-ink shadow-[4px_4px_0px_#171717] p-5 flex flex-col gap-3`}
            >
              <div className="text-3xl">{emoji}</div>
              <h3 className="font-heading font-bold text-lg text-ink">{title}</h3>
              <p className="font-body text-sm text-ink/70 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => setView('workspace')}
            className="
              inline-flex items-center gap-2 px-8 py-4 font-heading font-bold text-lg
              bg-yello text-ink border-2 border-ink shadow-[5px_5px_0px_#171717]
              hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[8px_8px_0px_#171717]
              active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#171717]
              transition-all duration-150 cursor-pointer
            "
          >
            START CREATING ↗
          </button>
        </div>
      </section>
    </>
  );
};

const App: React.FC = () => {
  const { currentView } = useAppStore();

  return (
    <div className="min-h-screen bg-yello-bg flex flex-col">
      <Header />

      <main className="flex-1">
        {currentView === 'home' && <HomeView />}
        {currentView === 'workspace' && <WorkspaceView />}
        {currentView === 'library' && <ReferenceLibrary />}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-ink bg-ink text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-heading font-bold text-lg">YELLOVERSE</div>
          <div className="font-mono text-xs text-white/50">AI Caption Studio · Semma Captions for Student Communities</div>
          <div className="font-mono text-xs text-white/30">v1.0.0</div>
        </div>
      </footer>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: "'DM Sans', sans-serif",
            border: '2px solid #171717',
            borderRadius: '0',
            boxShadow: '4px 4px 0px #171717',
            background: '#FFFDF5',
            color: '#171717',
          },
          success: { iconTheme: { primary: '#FFD83D', secondary: '#171717' } },
        }}
      />
    </div>
  );
};

export default App;

