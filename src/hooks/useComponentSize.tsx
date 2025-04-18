import { useState, useLayoutEffect, useRef } from 'react';

export function useComponentSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return { ref, width };
}
