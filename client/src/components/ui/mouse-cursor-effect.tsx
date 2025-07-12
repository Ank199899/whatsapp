import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface MouseCursorEffectProps {
  enabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  trailLength?: number;
}

interface CursorTrail {
  x: number;
  y: number;
  timestamp: number;
}

export const MouseCursorEffect: React.FC<MouseCursorEffectProps> = ({
  enabled = true,
  size = 'md',
  color = '#3b82f6',
  trailLength = 10
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const trailPoints = useRef<CursorTrail[]>([]);
  const animationRef = useRef<number>();
  const [isVisible, setIsVisible] = useState(false);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  const updateCursor = () => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    cursor.style.left = `${mouseRef.current.x}px`;
    cursor.style.top = `${mouseRef.current.y}px`;
  };

  const updateTrail = () => {
    const trail = trailRef.current;
    if (!trail) return;

    const now = Date.now();
    
    // Add new trail point
    trailPoints.current.push({
      x: mouseRef.current.x,
      y: mouseRef.current.y,
      timestamp: now
    });

    // Remove old trail points
    trailPoints.current = trailPoints.current.filter(
      point => now - point.timestamp < 500
    );

    // Limit trail length
    if (trailPoints.current.length > trailLength) {
      trailPoints.current = trailPoints.current.slice(-trailLength);
    }

    // Update trail elements
    trail.innerHTML = '';
    trailPoints.current.forEach((point, index) => {
      const age = now - point.timestamp;
      const opacity = Math.max(0, 1 - age / 500);
      const scale = Math.max(0.1, 1 - age / 500);
      
      const trailElement = document.createElement('div');
      trailElement.className = `absolute rounded-full pointer-events-none transition-all duration-100`;
      trailElement.style.cssText = `
        left: ${point.x}px;
        top: ${point.y}px;
        width: ${12 * scale}px;
        height: ${12 * scale}px;
        background: ${color};
        opacity: ${opacity * 0.6};
        transform: translate(-50%, -50%) scale(${scale});
        z-index: 9998;
      `;
      
      trail.appendChild(trailElement);
    });
  };

  const animate = () => {
    updateCursor();
    updateTrail();
    animationRef.current = requestAnimationFrame(animate);
  };

  const handleMouseMove = (e: MouseEvent) => {
    mouseRef.current = {
      x: e.clientX,
      y: e.clientY
    };

    if (!isVisible) {
      setIsVisible(true);
    }
  };

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Main cursor */}
      <div
        ref={cursorRef}
        className={cn(
          "fixed pointer-events-none z-[9999] rounded-full transition-all duration-200 ease-out",
          sizeClasses[size],
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
        )}
        style={{
          background: `radial-gradient(circle, ${color}80, ${color}40)`,
          boxShadow: `0 0 20px ${color}40`,
          transform: 'translate(-50%, -50%)',
          mixBlendMode: 'screen'
        }}
      />

      {/* Trail container */}
      <div
        ref={trailRef}
        className="fixed inset-0 pointer-events-none z-[9998]"
      />

      {/* Hover effects for interactive elements */}
      <style jsx>{`
        button:hover,
        a:hover,
        [role="button"]:hover,
        input:hover,
        textarea:hover,
        select:hover {
          cursor: none !important;
        }
        
        button:hover ~ div[data-cursor],
        a:hover ~ div[data-cursor],
        [role="button"]:hover ~ div[data-cursor] {
          transform: translate(-50%, -50%) scale(1.5) !important;
          background: radial-gradient(circle, ${color}, ${color}80) !important;
        }
      `}</style>
    </>
  );
};

// Hook for magnetic effect on elements
export const useMagneticEffect = (ref: React.RefObject<HTMLElement>, strength: number = 0.3) => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = Math.max(rect.width, rect.height);
      
      if (distance < maxDistance) {
        const force = (maxDistance - distance) / maxDistance;
        const moveX = deltaX * force * strength;
        const moveY = deltaY * force * strength;
        
        element.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }
    };

    const handleMouseLeave = () => {
      element.style.transform = 'translate(0, 0)';
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength]);
};

// Component for magnetic buttons
interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  strength?: number;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  strength = 0.3,
  className,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useMagneticEffect(buttonRef, strength);

  return (
    <button
      ref={buttonRef}
      className={cn(
        "transition-transform duration-300 ease-out",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
