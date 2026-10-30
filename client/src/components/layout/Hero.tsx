import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const Hero: React.FC = () => {
  const { setView } = useAppStore();

  return (
    <section className="relative overflow-hidden bg-yello-bg py-12 sm:py-20 lg:py-28">
      {/* Decorative elements */}
      <div className="absolute top-8 left-8 w-40 h-40 bg-yello border-2 border-ink rotate-12 hidden lg:block" />
      <div className="absolute top-24 right-16 w-24 h-24 bg-yello-light border-2 border-ink -rotate-6 hidden lg:block" />
      <div className="absolute bottom-12 left-1/4 w-16 h-16 bg-accent-orange border-2 border-ink rotate-45 hidden lg:block" />
      <div className="absolute bottom-20 right-1/3 w-20 h-20 bg-yello border-2 border-ink -rotate-12 hidden lg:block" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          {/* Sticker labels */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge variant="yellow" size="md" rotate>
              TANGLISH MODE ⚡
            </Badge>
            <Badge variant="orange" size="md" rotate className="rotate-[2deg]">
              STYLE-MATCHED 🎯
            </Badge>
            <Badge variant="black" size="md" rotate className="rotate-[-1deg]">
              AI-POWERED 🤖
            </Badge>
          </div>

          {/* Main headline */}
          <h1 className="font-heading font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-ink leading-[0.95] tracking-tight max-w-5xl">
            YOUR POSTER.
            <br />
            OUR WORDS.
            <br />
            <span className="relative inline-block">
              SEMMA CAPTION.
              <div className="absolute -bottom-2 left-0 right-0 h-4 bg-yello -z-10 -rotate-1" />
            </span>
          </h1>

          {/* Supporting text */}
          <p className="mt-6 sm:mt-8 font-body text-lg sm:text-xl text-ink/70 max-w-2xl">
            From poster to post — captions that sound like{' '}
            <span className="font-bold text-ink">YOU</span>. Trained on your
            style. Tuned for your audience. Ready in seconds.
          </p>

          {/* CTA */}
          <div className="mt-8 sm:mt-10">
            <Button
              size="lg"
              icon={<ArrowUpRight size={22} />}
              onClick={() => setView('workspace')}
              className="text-base sm:text-lg"
            >
              MAKE SOME NOISE
            </Button>
          </div>

          {/* Feature pills */}
          <div className="mt-12 sm:mt-16 flex flex-wrap justify-center gap-3 max-w-3xl">
            {[
              '📸 Upload poster → auto-extract details',
              '🎨 Multi-platform captions in one click',
              '💬 Refine with chat — "make it more fun"',
              '🔥 Tanglish / English / Tamil support',
            ].map((feature) => (
              <div
                key={feature}
                className="bg-white border-2 border-ink px-4 py-2 font-body text-sm shadow-[3px_3px_0px_#171717]"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
