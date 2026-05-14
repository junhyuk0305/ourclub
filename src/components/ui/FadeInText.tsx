import React, { useRef, useEffect, useState } from 'react';

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div' | 'span';

interface FadeInTextProps {
  as?: HeadingTag;
  className?: string;
  children: React.ReactNode;
  delay?: number;
}

export function FadeInText({ as: Tag = 'div', className = '', children, delay = 0 }: FadeInTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(el);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Tag
      ref={ref as any}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-28px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </Tag>
  );
}
