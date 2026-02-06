'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface GlassTooltipProps extends Omit<React.HTMLAttributes<HTMLElement>, 'content'> {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export default function GlassTooltip({ 
  content, 
  children, 
  className = '', 
  as: Component = 'div',
  ...props 
}: GlassTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top - 10,
        left: rect.left + rect.width / 2
      });
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <>
      <Component 
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={className || (Component === 'div' ? 'inline-block' : '')}
        {...props}
      >
        {children}
      </Component>
      {isVisible && <TooltipPortal coords={coords} content={content} />}
    </>
  );
}

function TooltipPortal({ coords, content }: { coords: { top: number, left: number }, content: React.ReactNode }) {
  // Use a state to force re-render if we needed measuring, 
  // but for simple text/small content, generic CSS transform centering works well.
  
  // Use createPortal to render outside of any overflow-hidden containers
  // We need to check if document is available (SSR check is handled by 'use client' generally but good to be safe)
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed z-[9999] pointer-events-none animate-fadeIn"
      style={{ 
        top: coords.top, 
        left: coords.left,
        transform: 'translate(-50%, -100%)' 
      }}
    >
      <div className="bg-gray-900/90 backdrop-blur-md text-white border border-white/10 p-3 rounded-xl shadow-2xl max-w-xs text-xs">
        {content}
        {/* Arrow */}
        <div 
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900/90 border-r border-b border-white/10 rotate-45"
        />
      </div>
    </div>,
    document.body
  );
}
