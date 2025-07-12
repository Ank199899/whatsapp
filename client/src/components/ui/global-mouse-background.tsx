import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface GlobalMouseBackgroundProps {
  children: React.ReactNode;
  className?: string;
  enabled?: boolean;
}

interface FloatingElement {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
}

export const GlobalMouseBackground: React.FC<GlobalMouseBackgroundProps> = ({
  children,
  className,
  enabled = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const elementsRef = useRef<FloatingElement[]>([]);
  const [isMouseActive, setIsMouseActive] = useState(false);

  // Colors that work well with both light and dark themes - Green and Yellow
  const colors = [
    'rgba(34, 197, 94, 0.3)',    // Green
    'rgba(251, 191, 36, 0.3)',   // Yellow
    'rgba(16, 185, 129, 0.3)',   // Emerald
    'rgba(132, 204, 22, 0.3)',   // Lime
    'rgba(245, 158, 11, 0.3)',   // Amber
  ];

  // Initialize floating elements
  const initializeElements = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    elementsRef.current = Array.from({ length: 25 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      maxLife: Math.random() * 300 + 200
    }));
  };

  // Update elements based on mouse position
  const updateElements = () => {
    const mouse = mouseRef.current;
    
    elementsRef.current.forEach(element => {
      // Attract elements to mouse when active
      if (isMouseActive) {
        const dx = mouse.x - element.x;
        const dy = mouse.y - element.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          const force = (150 - distance) / 150 * 0.02;
          element.vx += (dx / distance) * force;
          element.vy += (dy / distance) * force;
        }
      }

      // Apply velocity
      element.x += element.vx;
      element.y += element.vy;

      // Add friction
      element.vx *= 0.995;
      element.vy *= 0.995;

      // Update life
      element.life += 1;
      if (element.life > element.maxLife) {
        element.life = 0;
        element.x = Math.random() * (canvasRef.current?.width || 0);
        element.y = Math.random() * (canvasRef.current?.height || 0);
        element.vx = (Math.random() - 0.5) * 0.5;
        element.vy = (Math.random() - 0.5) * 0.5;
      }

      // Wrap around edges
      const canvas = canvasRef.current;
      if (canvas) {
        if (element.x < 0) element.x = canvas.width;
        if (element.x > canvas.width) element.x = 0;
        if (element.y < 0) element.y = canvas.height;
        if (element.y > canvas.height) element.y = 0;
      }
    });
  };

  // Draw everything
  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const mouse = mouseRef.current;

    // Draw mouse glow effect
    if (isMouseActive) {
      const gradient = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, 100
      );
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
      gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.05)');
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle ripple effect
      const time = Date.now() * 0.003;
      for (let i = 0; i < 3; i++) {
        const radius = (Math.sin(time + i) * 0.5 + 0.5) * 50 + 20;
        ctx.strokeStyle = `rgba(59, 130, 246, ${0.1 - i * 0.03})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Draw floating elements
    elementsRef.current.forEach(element => {
      const lifeRatio = 1 - (element.life / element.maxLife);
      const alpha = element.opacity * lifeRatio;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = element.color;
      
      // Draw element with subtle glow
      ctx.shadowColor = element.color;
      ctx.shadowBlur = 5;
      
      ctx.beginPath();
      ctx.arc(element.x, element.y, element.size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });

    // Draw connecting lines between nearby elements
    elementsRef.current.forEach((element, i) => {
      elementsRef.current.slice(i + 1).forEach(otherElement => {
        const dx = element.x - otherElement.x;
        const dy = element.y - otherElement.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 80) {
          const opacity = (80 - distance) / 80 * 0.1;
          ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(element.x, element.y);
          ctx.lineTo(otherElement.x, otherElement.y);
          ctx.stroke();
        }
      });
    });
  };

  // Animation loop
  const animate = () => {
    if (!enabled) return;
    
    updateElements();
    draw();
    animationRef.current = requestAnimationFrame(animate);
  };

  // Handle mouse movement
  const handleMouseMove = (e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Handle mouse enter/leave
  const handleMouseEnter = () => setIsMouseActive(true);
  const handleMouseLeave = () => setIsMouseActive(false);

  // Resize canvas
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    initializeElements();
  };

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Initial setup
    resizeCanvas();
    
    // Event listeners
    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', resizeCanvas);

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', resizeCanvas);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enabled]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-hidden",
        className
      )}
    >
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ 
          mixBlendMode: 'screen',
          opacity: 0.6
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
