import { useState, useEffect, useRef } from 'react';

/**
 * Hook to dynamically calculate font size to fit text perfectly on 1 line 
 * without wrapping or overflowing the screen boundaries, relative to container dimensions.
 */
export default function useFitText(text: string, effect: string, sizeOption: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<string>('8vw'); // Fallback style before layout computation

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const calculateSize = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;

      // Base multipliers for different preset size options
      let sizeMultiplier = 0.95; // default 'auto'
      switch (sizeOption) {
        case 'small':
          sizeMultiplier = 0.6;
          break;
        case 'medium':
          sizeMultiplier = 0.85;
          break;
        case 'large':
          sizeMultiplier = 1.15;
          break;
        case 'huge':
          sizeMultiplier = 1.45;
          break;
      }

      // Marquee is scrolling text: it flows offscreen horizontally. 
      // Thus, only the vertical height is the scaling limit.
      if (effect === 'marquee') {
        const targetHeightSize = clientHeight * 0.42 * sizeMultiplier;
        setFontSize(`${targetHeightSize}px`);
        return;
      }

      // For static, blink, countdown, equalizer text: it must fit inside BOTH width and height.
      // 1. Calculate weighted text length based on CJK unicode characters
      let weightedLen = 0;
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        if (text[i] === ' ') {
          weightedLen += 0.35;
        } else if (
          (charCode >= 0xac00 && charCode <= 0xd7a3) || // Hangul Syllables
          (charCode >= 0x1100 && charCode <= 0x11ff) || // Hangul Jamo
          (charCode >= 0x3130 && charCode <= 0x318f) || // Hangul Compatibility Jamo
          (charCode >= 0x4e00 && charCode <= 0x9fff) || // CJK Ideographs
          (charCode >= 0x3000 && charCode <= 0x303f)    // CJK Symbols
        ) {
          weightedLen += 1.15; // CJK characters are square and wider
        } else {
          weightedLen += 0.62; // Standard alphanumeric characters are narrower
        }
      }
      weightedLen = Math.max(weightedLen, 1);

      // We want text width to be within 86% of container width for safety margin
      const maxFontSizeWidth = (clientWidth * 0.86) / weightedLen;

      // 2. Calculate size based on container height to fit vertically
      const maxFontSizeHeight = clientHeight * 0.72;

      // 3. Pick the smaller of the two, then apply user-selected multiplier
      let targetSize = Math.min(maxFontSizeWidth, maxFontSizeHeight) * sizeMultiplier;

      // Absolute upper limits to prevent wrapping and overflow under extreme aspect ratios
      const absoluteMax = Math.min((clientWidth * 0.86) / weightedLen, clientHeight * 0.72);
      if (targetSize > absoluteMax) {
        targetSize = absoluteMax;
      }

      setFontSize(`${targetSize}px`);
    };

    // Run initial calculation
    calculateSize();

    // Re-run on resize
    const resizeObserver = new ResizeObserver(() => {
      calculateSize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [text, effect, sizeOption]);

  return { containerRef, fontSize };
}
