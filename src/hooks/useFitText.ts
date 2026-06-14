import { useState, useEffect, useLayoutEffect, useRef } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Hook to dynamically calculate font size to fit text perfectly on 1 line 
 * without wrapping or overflowing the screen boundaries, relative to container dimensions.
 */
export default function useFitText(text: string, effect: string, sizePercent: number | undefined) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<string>('8vw'); // Fallback style before layout computation

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const calculateSize = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;

      // Calculate size multiplier continuously based on percentage (30 to 100)
      const sizeMultiplier = (sizePercent || 100) / 100;

      // Marquee is scrolling text: it flows offscreen horizontally. 
      // Thus, only the vertical height is the scaling limit.
      if (effect === 'marquee') {
        const targetHeightSize = clientHeight * 0.72 * sizeMultiplier;
        setFontSize(`${targetHeightSize}px`);
        return;
      }

      // Measurement-based binary search:
      // Create a hidden temporary span with the same font-family and style to measure.
      const testSpan = document.createElement('span');
      testSpan.style.visibility = 'hidden';
      testSpan.style.position = 'absolute';
      testSpan.style.whiteSpace = 'nowrap';
      testSpan.style.lineHeight = '1';
      testSpan.innerText = text || ' ';

      // Copy font styling class name from container's actual text element if possible
      const textElement = container.querySelector('[class*="font-sign-"]') as HTMLElement;
      if (textElement) {
        testSpan.className = textElement.className;
        testSpan.classList.remove('animate-marquee', 'animate-blink', 'animate-siren', 'animate-pulse');
      } else {
        const firstChild = container.firstElementChild as HTMLElement;
        if (firstChild) {
          testSpan.className = firstChild.className;
          testSpan.classList.remove('animate-marquee', 'animate-blink', 'animate-siren', 'animate-pulse');
        }
      }
      
      container.appendChild(testSpan);

      // Binary search for the best font size (in px)
      let min = 10;
      let max = 400; // reasonable maximum font size in px
      let bestSize = min;
      const targetWidth = clientWidth * 0.94; // 94% width safety margin
      const targetHeight = clientHeight * 0.82; // 82% height safety margin

      for (let i = 0; i < 10; i++) {
        const mid = (min + max) / 2;
        testSpan.style.fontSize = `${mid}px`;
        
        const width = testSpan.offsetWidth;
        const height = testSpan.offsetHeight;

        if (width <= targetWidth && height <= targetHeight) {
          bestSize = mid;
          min = mid;
        } else {
          max = mid;
        }
      }

      container.removeChild(testSpan);

      // Apply the sizeMultiplier to the best calculated safe size
      const finalSize = bestSize * sizeMultiplier;
      setFontSize(`${finalSize}px`);
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
  }, [text, effect, sizePercent]);

  return { containerRef, fontSize };
}
