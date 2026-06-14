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
  }, [preset.text, preset.effect, preset.countdown_seconds, preset.result_text, preset.trigger_id]);

  const isBlink = preset.effect === 'blink';
  const isMarquee = preset.effect === 'marquee';
  const isCountdown = preset.effect === 'countdown';
  const isLuckyDraw = preset.effect === 'luckydraw';
  const isLuckyDrawWait = preset.effect === 'luckydraw_wait';

  // Compute text to display on screen (no default text fallbacks)
  const displayText = isCountdown 
    ? String(countdownVal) 
    : isLuckyDrawWait 
      ? '추첨 대기 중'
      : (preset.text || '');

  // Use dynamic fitting hook to sync sizes proportional to container clientWidth/clientHeight
  const { containerRef, fontSize } = useFitText(
    displayText,
    preset.effect || 'none',
    preset.font_size || 100
  );

  const isDuoSiren = (isBlink && !!preset.bg_color_secondary) || isLuckyDraw;

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
          isDuoSiren ? 'animate-siren' : isBlink ? 'animate-blink' : ''
        }`}
        style={{ 
          backgroundColor: isDuoSiren ? undefined : preset.bg_color,
          border: isLuckyDrawWait ? `2px solid ${preset.bg_color_secondary || '#FFD700'}` : 'none',
          '--blink-duration': `${preset.speed || 1000}ms`,
          '--siren-color-1': preset.bg_color,
          '--siren-color-2': preset.bg_color_secondary || '#FFD700'
        } as React.CSSProperties}
      >
        {isMarquee ? (
          <div className="w-full overflow-hidden flex items-center">
            <div 
              className={`animate-marquee-seamless select-none leading-none flex whitespace-nowrap ${getFontFamilyClass()}`}
              style={{ 
                color: preset.text_color,
                fontSize,
                '--marquee-duration': `${preset.speed || 6000}ms`
              } as React.CSSProperties}
            >
              {[...Array(8)].map((_, i) => (
                <span key={i} style={{ paddingRight: '4rem' }}>{displayText}</span>
              ))}
            </div>
          </div>
        ) : (
          <div 
            className={`text-center whitespace-nowrap overflow-hidden px-[2cqw] select-none max-w-full leading-none tracking-tighter ${getFontFamilyClass()}`}
            style={{ 
              color: preset.text_color,
              fontSize,
              zIndex: 10,
              animation: isLuckyDrawWait ? 'preset-card-pulse 1.2s ease-in-out infinite' : undefined
            }}
          >
            {displayText}
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
