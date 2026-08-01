import { useEffect, useRef } from 'react';

export const useScrollReveal = (options = { threshold: 0.1 }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
          observer.unobserve(entry.target);
        }
      });
    }, options);

    element.classList.add('opacity-0', 'translate-y-8', 'transition-all', 'duration-1000', 'ease-out');
    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [options]);

  return ref;
};
