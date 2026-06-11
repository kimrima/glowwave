import React from 'react';
import { Preset } from '@/lib/types';
import useFitText from '@/hooks/useFitText';

interface LandscapePhoneMockupProps {
  preset: Preset;
}

export default function LandscapePhoneMockup({ preset }: LandscapePhoneMockupProps) {
  // Styles for the font families matching global CSS definitions
  const getFontFamilyClass = () => {
    switch (preset.font_family) {
      case 'neon':
        return 'font-neon font-black';
      case 'dot':
        return 'font-dot';
      case 'serif':
        return 'font-serif font-black';
      default:
        return 'font-sans font-black';
    }
  };

  const isBlink = preset.effect === 'blink';
  const isMarquee = preset.effect === 'marquee';

  // Use dynamic fitting hook to sync sizes proportional to container clientWidth/clientHeight
  const { containerRef, fontSize } = useFitText(
    preset.text || 'GlowWave',
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
        ref={containerRef}
        className={`absolute inset-[2.2cqw] rounded-[6.5%] overflow-hidden flex items-center justify-center transition-colors duration-200 ${
          isBlink ? 'animate-blink' : ''
        }`}
        style={{ 
          backgroundColor: preset.bg_color,
          '--blink-duration': `${preset.speed || 1000}ms`
        } as React.CSSProperties}
      >
        {isMarquee ? (
          <div className="w-full overflow-hidden whitespace-nowrap flex items-center">
            <span 
              className={`animate-marquee inline-block select-none leading-none ${getFontFamilyClass()}`}
              style={{ 
                color: preset.text_color,
                fontFamily: preset.font_family === 'serif' ? 'Georgia, serif' : undefined,
                fontSize,
                '--marquee-duration': `${preset.speed || 6000}ms`
              } as React.CSSProperties}
            >
              {preset.text || 'GlowWave'} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {preset.text || 'GlowWave'}
            </span>
          </div>
        ) : (
          <div 
            className={`text-center break-all px-[10cqw] select-none max-w-full leading-none tracking-tighter ${getFontFamilyClass()}`}
            style={{ 
              color: preset.text_color,
              fontFamily: preset.font_family === 'serif' ? 'Georgia, serif' : undefined,
              fontSize
            }}
          >
            {preset.text || 'GlowWave'}
          </div>
        )}

        {/* Semi-transparent watermark footer */}
        <div className="absolute bottom-[8%] right-[10%] px-[2%] py-[0.5%] rounded bg-black/45 backdrop-blur-sm border border-white/5 text-[1.8cqw] text-white/50 select-none">
          GlowWave.app 🪄
        </div>
      </div>
    </div>
  );
}
