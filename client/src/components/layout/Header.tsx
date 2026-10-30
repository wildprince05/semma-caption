import React, { useState, useEffect } from 'react';
import { Menu, X, Plus, Zap, BookOpen, Home } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const { currentView, setView, newSession, referenceStats, loadReferenceStats } =
    useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadReferenceStats();
  }, [loadReferenceStats]);

  const navItems = [
    { id: 'home' as const, label: 'Home', icon: <Home size={16} /> },
    { id: 'workspace' as const, label: 'Workspace', icon: <Zap size={16} /> },
    { id: 'library' as const, label: 'Reference Library', icon: <BookOpen size={16} /> },
  ];

  const datasetCount = referenceStats?.total ?? 0;
  const hasDataset = datasetCount > 0;

  return (
    <header className="sticky top-0 z-50 bg-yello-bg border-b-2 border-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('home')}
              className="flex flex-col cursor-pointer"
            >
              <span className="font-heading font-bold text-xl sm:text-2xl text-ink tracking-tight leading-none">
                YELLOVERSE
              </span>
              <span className="font-mono text-[10px] sm:text-xs text-ink/70 tracking-widest">
                YOUR CAPTION LAB.
              </span>
            </button>

            <Badge variant="yellow" size="sm" rotate className="hidden sm:inline-flex">
              AI STYLE-TRAINED
            </Badge>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`
                  flex items-center gap-1.5 px-4 py-2 font-heading font-bold text-sm
                  border-2 transition-all duration-150 cursor-pointer
                  ${
                    currentView === item.id
                      ? 'bg-yello border-ink shadow-[3px_3px_0px_#171717]'
                      : 'bg-transparent border-transparent hover:bg-yello-pale hover:border-ink'
                  }
                `}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Dataset status */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-mono">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  hasDataset ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-ink/70">
                {hasDataset
                  ? `${datasetCount} captions loaded`
                  : 'No dataset'}
              </span>
            </div>

            {/* New Session */}
            <Button
              variant="outline"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => {
                newSession();
                setView('workspace');
              }}
              className="hidden sm:inline-flex"
            >
              New Session
            </Button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 border-2 border-ink bg-white cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-ink bg-white">
          <div className="px-4 py-3 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`
                  flex items-center gap-2 w-full px-4 py-3 font-heading font-bold text-sm
                  border-2 transition-all duration-150 cursor-pointer
                  ${
                    currentView === item.id
                      ? 'bg-yello border-ink shadow-[3px_3px_0px_#171717]'
                      : 'bg-white border-ink'
                  }
                `}
              >
                {item.icon}
                {item.label}
              </button>
            ))}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    hasDataset ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-ink/70">
                  {hasDataset
                    ? `${datasetCount} captions loaded`
                    : 'No dataset'}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => {
                  newSession();
                  setView('workspace');
                  setMobileMenuOpen(false);
                }}
              >
                New
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
