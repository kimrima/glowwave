import React, { useState, useEffect } from 'react';
import { Preset } from '@/lib/types';
import useFitText from '@/hooks/useFitText';

interface LandscapePhoneMockupProps {
  preset: Preset;
}

export default function LandscapePhoneMockup({ preset }: LandscapePhoneMockupProps) {
  // Styles for the font families matching global CSS definitions
  const getFontFamilyClass = () => {
    switch (preset.font_family) {
      case 'sans-thin':
        return 'font-sign-sans-thin font-bold';
      case 'sans-thick':
        return 'font-sign-sans-thick font-black';
      case 'serif':
        return 'font-sign-serif font-bold';
      case 'neon':
        return 'font-sign-neon font-black';
      default:
        return 'font-sign-sans-thin font-bold';
    }
  };

  // Countdown state for mockup ticking
  const [countdownVal, setCountdownVal] = useState<number | string>(preset.countdown_seconds || 10);

  useEffect(() => {
    if (preset.effect === 'countdown') {
      const startVal = preset.countdown_seconds || 10;
      setCountdownVal(startVal);
      const timer = setInterval(() => {
        setCountdownVal((prev) => {
          if (typeof prev === 'number') {
            if (prev <= 1) {
              return preset.result_text || 'START';
            }
            return prev - 1;
          }
          // Loop back after showing result
          return startVal;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [preset.text, preset.effect, preset.countdown_seconds, preset.result_text]);

  const isBlink = preset.effect === 'blink';
  const isMarquee = preset.effect === 'marquee';
  const isCountdown = preset.effect === 'countdown';
  const isEqualizer = preset.effect === 'equalizer';
  const isGradient = preset.effect === 'gradient';

  // Compute text to display on screen (no default text fallbacks)
  const displayText = isCountdown 
    ? String(countdownVal) 
    : isEqualizer 
      ? '' 
      : (preset.text || '');

  // Use dynamic fitting hook to sync sizes proportional to container clientWidth/clientHeight
  const { containerRef, fontSize } = useFitText(
    displayText,
    preset.effect || 'none',
    preset.font_size || 'auto'
  );

  return (
    <div className="@container w-full max-w-[420px] aspect-[1.91/1] bg-black rounded-[9%] border-[1.2cqw] border-zinc-800 shadow-2xl p-[2.2cqw] flex items-center justify-center overflow-hidden relative">
      {/* Landscape camera notch on the left margin */}
      <div className="absolute top-1/2 left-[3.5%] -translate-y-1/2 w-[3.5%] h-[22%] bg-black rounded-full z-30 flex flex-col items-center justify-center gap-[12%]">
        <div className="w-[45%] aspect-square rounded-full bg-zinc-905" />
      </div>

      {/* Screen Display Area */}
      <div 
        key={preset.trigger_id || 'mockup'}
        ref={containerRef}
        className={`absolute inset-[2.2cqw] rounded-[6.5%] overflow-hidden flex items-center justify-center transition-colors duration-200 ${
          isBlink ? 'animate-blink' : ''
        } ${
          isGradient ? 'animate-gradient-flow' : ''
        }`}
        style={{ 
          backgroundColor: isGradient ? undefined : preset.bg_color,
          '--blink-duration': `${preset.speed || 1000}ms`,
          '--gradient-duration': `${preset.speed || 8000}ms`
        } as React.CSSProperties}
      >
        {isMarquee ? (
          <div className="w-full overflow-hidden whitespace-nowrap flex items-center">
            <span 
              className={`animate-marquee inline-block select-none leading-none ${getFontFamilyClass()}`}
              style={{ 
                color: preset.text_color,
                fontSize,
                '--marquee-duration': `${preset.speed || 6000}ms`
              } as React.CSSProperties}
            >
              {displayText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {displayText}
            </span>
          </div>
        ) : (
          <div 
            className={`text-center whitespace-nowrap overflow-hidden px-[2cqw] select-none max-w-full leading-none tracking-tighter ${getFontFamilyClass()}`}
            style={{ 
              color: preset.text_color,
              fontSize,
              zIndex: 10
            }}
          >
            {displayText}
          </div>
        )}

        {/* Dynamic Equalizer Bars Overlay for Mockup Preview */}
        {isEqualizer && (
          <div className="absolute inset-x-0 bottom-0 top-1/2 flex items-end justify-center gap-[1.5cqw] px-[4cqw] pb-[4cqw] pointer-events-none opacity-80 z-0">
            {[...Array(12)].map((_, i) => {
              const animDuration = 0.5 + Math.random() * 0.7;
              const animDelay = Math.random() * 0.4;
              return (
                <div 
                  key={i}
                  className="flex-1 max-w-[2cqw] rounded-full"
                  style={{
                    background: preset.text_color && preset.text_color !== '#FFFFFF'
                      ? `linear-gradient(to top, ${preset.text_color}cc, ${preset.text_color})`
                      : 'linear-gradient(to top, rgba(99, 102, 241, 0.8), rgba(236, 72, 153, 0.9))',
                    height: '100%',
                    transformOrigin: 'bottom',
                    animation: `preset-card-eq ${animDuration}s ease-in-out infinite alternate`,
                    animationDelay: `${animDelay}s`
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Semi-transparent watermark footer */}
        <div className="absolute bottom-[8%] right-[10%] px-[2%] py-[0.5%] rounded bg-black/45 backdrop-blur-sm border border-white/5 text-[1.8cqw] text-white/50 select-none font-semibold">
          GlowWave.app
        </div>
      </div>
    </div>
  );
}
