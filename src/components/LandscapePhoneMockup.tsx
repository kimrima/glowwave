import React, { useState, useEffect, useMemo } from 'react';
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
      case 'pixel':
        return 'font-sign-pixel';
      case 'plump':
        return 'font-sign-plump font-black';
      default:
        return 'font-sign-sans-thin font-bold';
    }
  };

  // Memoized special effect particles to avoid re-generating random attributes on every render
  const specialEffectParticles = useMemo(() => {
    const effect = preset.special_effect;
    if (!effect || effect === 'none') return [];
    
    const count = effect === 'stars' ? 15 : effect === 'confetti' ? 20 : 12; // Fewer particles for the small mockup
    const particles = [];
    
    for (let i = 0; i < count; i++) {
      if (effect === 'hearts') {
        particles.push({
          id: i,
          left: `${Math.random() * 100}%`,
          fontSize: `${8 + Math.random() * 12}px`,
          delay: `${Math.random() * 5}s`,
          duration: `${4 + Math.random() * 4}s`,
          sway: `${2 + Math.random() * 2}s`,
          color: ['#EF4444', '#EC4899', '#F472B6', '#F43F5E', '#D946EF'][Math.floor(Math.random() * 5)]
        });
      } else if (effect === 'confetti') {
        particles.push({
          id: i,
          left: `${Math.random() * 100}%`,
          fontSize: `${6 + Math.random() * 10}px`,
          delay: `${Math.random() * 4}s`,
          duration: `${3 + Math.random() * 3}s`,
          sway: `${1.5 + Math.random() * 1.5}s`,
          color: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6'][Math.floor(Math.random() * 7)]
        });
      } else if (effect === 'stars') {
        particles.push({
          id: i,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          fontSize: `${3 + Math.random() * 4}px`,
          delay: `${Math.random() * 3}s`,
          duration: `${2 + Math.random() * 3}s`,
          color: ['#FFF', '#FEF08A', '#A5F3FC', '#F472B6', '#C084FC'][Math.floor(Math.random() * 5)]
        });
      }
    }
    return particles;
  }, [preset.special_effect]);

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
        ref={containerRef}
        className={`absolute inset-[2.2cqw] rounded-[6.5%] overflow-hidden flex items-center justify-center ${
          (isDuoSiren || isBlink) ? '' : 'transition-colors duration-200'
        } ${
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
        {/* Special Effects Layer for Mockup */}
        {preset.special_effect && preset.special_effect !== 'none' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {specialEffectParticles.map((p) => {
              if (preset.special_effect === 'hearts') {
                return (
                  <div
                    key={p.id}
                    className="animate-heart"
                    style={{
                      left: p.left,
                      fontSize: p.fontSize,
                      color: p.color,
                      animationDelay: `${p.delay}, 0s`,
                      '--heart-duration': p.duration,
                      '--heart-sway': p.sway
                    } as React.CSSProperties}
                  >
                    ❤️
                  </div>
                );
              } else if (preset.special_effect === 'confetti') {
                const shapes = ['🎉', '✨', '■', '●', '▲', '✦'];
                const shape = shapes[p.id % shapes.length];
                return (
                  <div
                    key={p.id}
                    className="animate-confetti"
                    style={{
                      left: p.left,
                      fontSize: p.fontSize,
                      color: p.color,
                      animationDelay: `${p.delay}, 0s`,
                      '--confetti-duration': p.duration,
                      '--confetti-sway': p.sway
                    } as React.CSSProperties}
                  >
                    {shape}
                  </div>
                );
              } else if (preset.special_effect === 'stars') {
                const starGlyphs = ['✦', '★', '✧', '•'];
                const glyph = starGlyphs[p.id % starGlyphs.length];
                return (
                  <div
                    key={p.id}
                    className="animate-star"
                    style={{
                      left: p.left,
                      top: p.top,
                      fontSize: p.fontSize,
                      color: p.color,
                      animationDelay: p.delay,
                      '--star-duration': p.duration
                    } as React.CSSProperties}
                  >
                    {glyph}
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}

        {isMarquee ? (
          <div key={preset.trigger_id} className="w-full overflow-hidden flex items-center whitespace-nowrap font-sans relative z-10">
            {/* Track 1 */}
            <div 
              className={`animate-marquee-seamless select-none leading-none flex shrink-0 gap-[4rem] pr-[4rem] ${getFontFamilyClass()}`}
              style={{ 
                color: preset.text_color,
                fontSize,
                '--marquee-duration': `${preset.speed || 6000}ms`
              } as React.CSSProperties}
            >
              <span>{displayText}</span>
              <span>{displayText}</span>
              <span>{displayText}</span>
              <span>{displayText}</span>
            </div>
            {/* Track 2 */}
            <div 
              className={`animate-marquee-seamless select-none leading-none flex shrink-0 gap-[4rem] pr-[4rem] ${getFontFamilyClass()}`}
              style={{ 
                color: preset.text_color,
                fontSize,
                '--marquee-duration': `${preset.speed || 6000}ms`
              } as React.CSSProperties}
              aria-hidden="true"
            >
              <span>{displayText}</span>
              <span>{displayText}</span>
              <span>{displayText}</span>
              <span>{displayText}</span>
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
