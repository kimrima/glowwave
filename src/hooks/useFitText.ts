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

      // For static & blink text, it must fit inside BOTH width and height.
      // 1. Calculate size based on text length to fit horizontally
      const textLen = Math.max(text.length, 1);
      // Rough estimation: width of standard character is ~0.65 of its font size
      const maxFontSizeWidth = (clientWidth * 0.9) / (textLen * 0.65);

      // 2. Calculate size based on container height to fit vertically
      const maxFontSizeHeight = clientHeight * 0.72;

      // 3. Pick the smaller of the two to fit safely, then apply user-selected multiplier
      let targetSize = Math.min(maxFontSizeWidth, maxFontSizeHeight) * sizeMultiplier;

      // Absolute upper limits to prevent wrapping and overflow on edge ratios
      const absoluteMax = Math.min((clientWidth * 0.95) / (textLen * 0.52), clientHeight * 0.82);
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
