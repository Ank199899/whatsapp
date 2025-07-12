import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface MouseFollowingBackgroundProps {
  children: React.ReactNode;
  className?: string;
  particleCount?: number;
  trailLength?: number;
  colors?: string[];
  intensity?: 'low' | 'medium' | 'high';
  effects?: ('particles' | 'gradient' | 'ripples' | 'trails' | 'glow')[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  opacity: number;
}

interface TrailPoint {
  x: number;
  y: number;
  timestamp: number;
  opacity: number;
}

export const MouseFollowingBackground: React.FC<MouseFollowingBackgroundProps> = ({
  children,
  className,
  particleCount = 50,
  trailLength = 20,
  colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
  intensity = 'medium',
  effects = ['particles', 'gradient', 'trails', 'glow']
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const trailRef = useRef<TrailPoint[]>([]);
  const [isMouseInside, setIsMouseInside] = useState(false);

  const intensitySettings = {
    low: { particleSpeed: 0.5, glowRadius: 100, rippleSize: 50 },
    medium: { particleSpeed: 1, glowRadius: 150, rippleSize: 80 },
    high: { particleSpeed: 2, glowRadius: 200, rippleSize: 120 }
  };

  const settings = intensitySettings[intensity];

  // Initialize particles
  const initializeParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * settings.particleSpeed,
      vy: (Math.random() - 0.5) * settings.particleSpeed,
      life: Math.random() * 100,
      maxLife: 100 + Math.random() * 100,
      size: Math.random() * 3 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.8 + 0.2
    }));
  };

  // Update particles based on mouse position
  const updateParticles = () => {
    const mouse = mouseRef.current;
    
    particlesRef.current.forEach(particle => {
      // Attract particles to mouse
      const dx = mouse.x - particle.x;
      const dy = mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 200 && isMouseInside) {
        const force = (200 - distance) / 200;
        particle.vx += (dx / distance) * force * 0.1;
        particle.vy += (dy / distance) * force * 0.1;
      }

      // Apply velocity
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Add some friction
      particle.vx *= 0.98;
      particle.vy *= 0.98;

      // Update life
      particle.life += 1;
      if (particle.life > particle.maxLife) {
        particle.life = 0;
        particle.x = Math.random() * (canvasRef.current?.width || 0);
        particle.y = Math.random() * (canvasRef.current?.height || 0);
        particle.vx = (Math.random() - 0.5) * settings.particleSpeed;
        particle.vy = (Math.random() - 0.5) * settings.particleSpeed;
      }

      // Wrap around edges
      const canvas = canvasRef.current;
      if (canvas) {
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
      }
    });
  };

  // Update mouse trail
  const updateTrail = () => {
    const now = Date.now();
    const mouse = mouseRef.current;

    // Add new trail point
    if (isMouseInside) {
      trailRef.current.push({
        x: mouse.x,
        y: mouse.y,
        timestamp: now,
        opacity: 1
      });
    }

    // Remove old trail points and update opacity
    trailRef.current = trailRef.current
      .filter(point => now - point.timestamp < 1000)
      .map(point => ({
        ...point,
        opacity: Math.max(0, 1 - (now - point.timestamp) / 1000)
      }));

    // Limit trail length
    if (trailRef.current.length > trailLength) {
      trailRef.current = trailRef.current.slice(-trailLength);
    }
  };

  // Draw everything on canvas
  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const mouse = mouseRef.current;

    // Draw gradient effect
    if (effects.includes('gradient') && isMouseInside) {
      const gradient = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, settings.glowRadius
      );
      gradient.addColorStop(0, `${colors[0]}20`);
      gradient.addColorStop(0.5, `${colors[1]}10`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw glow effect
    if (effects.includes('glow') && isMouseInside) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      const glowGradient = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, settings.glowRadius / 2
      );
      glowGradient.addColorStop(0, `${colors[2]}40`);
      glowGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // Draw mouse trail
    if (effects.includes('trails') && trailRef.current.length > 1) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      for (let i = 1; i < trailRef.current.length; i++) {
        const current = trailRef.current[i];
        const previous = trailRef.current[i - 1];
        
        ctx.strokeStyle = `${colors[3]}${Math.floor(current.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = (current.opacity * 3) + 1;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y);
        ctx.lineTo(current.x, current.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw particles
    if (effects.includes('particles')) {
      particlesRef.current.forEach(particle => {
        const lifeRatio = 1 - (particle.life / particle.maxLife);
        const alpha = particle.opacity * lifeRatio;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow to particles
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        
        ctx.restore();
      });
    }

    // Draw ripples
    if (effects.includes('ripples') && isMouseInside) {
      const time = Date.now() * 0.005;
      const rippleCount = 3;
      
      for (let i = 0; i < rippleCount; i++) {
        const offset = (i / rippleCount) * Math.PI * 2;
        const radius = (Math.sin(time + offset) * 0.5 + 0.5) * settings.rippleSize;
        
        ctx.save();
        ctx.strokeStyle = `${colors[4]}30`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  // Animation loop
  const animate = () => {
    updateParticles();
    updateTrail();
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
  const handleMouseEnter = () => setIsMouseInside(true);
  const handleMouseLeave = () => setIsMouseInside(false);

  // Resize canvas
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    initializeParticles();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Initial setup
    resizeCanvas();
    
    // Event listeners
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', resizeCanvas);

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', resizeCanvas);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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
        className="absolute inset-0 pointer-events-none z-0"
        style={{ mixBlendMode: 'screen' }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
