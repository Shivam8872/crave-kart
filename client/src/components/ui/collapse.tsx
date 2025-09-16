
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CollapseProps {
  open?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Collapse = ({ open = false, className, children }: CollapseProps) => {
  const [height, setHeight] = useState<number | undefined>(open ? undefined : 0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    
    if (open) {
      const contentHeight = ref.current.scrollHeight;
      setHeight(contentHeight);
      
      // After the animation completes, set height to undefined to allow content to resize dynamically
      const timer = setTimeout(() => {
        setHeight(undefined);
      }, 300); // Match this with the CSS transition duration
      
      return () => clearTimeout(timer);
    } else {
      // First set the height to the current scroll height to allow animation
      setHeight(ref.current.scrollHeight);
      
      // Then animate to 0
      const timer = setTimeout(() => {
        setHeight(0);
      }, 5);
      
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <div
      ref={ref}
      className={cn("overflow-hidden transition-all duration-300", className)}
      style={{ height: height === undefined ? 'auto' : `${height}px` }}
    >
      {children}
    </div>
  );
};
