import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface AdvancedMouseBackgroundProps {
  children: React.ReactNode;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  intensity?: 'subtle' | 'medium' | 'intense';
  effects?: {
    particles?: boolean;
    waves?: boolean;
    magneticField?: boolean;
    colorShift?: boolean;
    geometricShapes?: boolean;
    lightBeams?: boolean;
  };
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'circle' | 'triangle' | 'square' | 'star';
}

interface Wave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  speed: number;
  color: string;
}

interface GeometricShape {
  x: number;
  y: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  type: 'hexagon' | 'diamond' | 'pentagon';
  color: string;
  opacity: number;
}

export const AdvancedMouseBackground: React.FC<AdvancedMouseBackgroundProps> = ({
  children,
  className,
  theme = 'auto',
  intensity = 'medium',
  effects = {
    particles: true,
    waves: true,
    magneticField: true,
    colorShift: true,
    geometricShapes: true,
    lightBeams: true
  }
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const wavesRef = useRef<Wave[]>([]);
  const shapesRef = useRef<GeometricShape[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  // Theme colors
  const themeColors = {
    light: {
      primary: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
      secondary: ['#dbeafe', '#e0e7ff', '#cffafe', '#d1fae5', '#fef3c7'],
      accent: '#1e40af'
    },
    dark: {
      primary: ['#60a5fa', '#a78bfa', '#22d3ee', '#34d399', '#fbbf24'],
      secondary: ['#1e3a8a', '#4c1d95', '#164e63', '#065f46', '#92400e'],
      accent: '#3b82f6'
    }
  };

  // Intensity settings
  const intensityConfig = {
    subtle: {
      particleCount: 30,
      waveCount: 2,
      shapeCount: 3,
      speed: 0.5,
      magneticStrength: 0.3,
      glowIntensity: 0.2
    },
    medium: {
      particleCount: 60,
      waveCount: 4,
      shapeCount: 6,
      speed: 1,
      magneticStrength: 0.6,
      glowIntensity: 0.4
    },
    intense: {
      particleCount: 100,
      waveCount: 6,
      shapeCount: 10,
      speed: 1.5,
      magneticStrength: 1,
      glowIntensity: 0.6
    }
  };

  const config = intensityConfig[intensity];
  const colors = themeColors[currentTheme];

  // Detect theme
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setCurrentTheme(mediaQuery.matches ? 'dark' : 'light');
      
      const handleChange = (e: MediaQueryListEvent) => {
        setCurrentTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setCurrentTheme(theme);
    }
  }, [theme]);

  // Initialize particles
  const initializeParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    particlesRef.current = Array.from({ length: config.particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * config.speed,
      vy: (Math.random() - 0.5) * config.speed,
      size: Math.random() * 4 + 1,
      color: colors.primary[Math.floor(Math.random() * colors.primary.length)],
      life: 0,
      maxLife: Math.random() * 200 + 100,
      type: ['circle', 'triangle', 'square', 'star'][Math.floor(Math.random() * 4)] as any
    }));
  }, [config.particleCount, config.speed, colors.primary]);

  // Initialize geometric shapes
  const initializeShapes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    shapesRef.current = Array.from({ length: config.shapeCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      size: Math.random() * 30 + 10,
      type: ['hexagon', 'diamond', 'pentagon'][Math.floor(Math.random() * 3)] as any,
      color: colors.secondary[Math.floor(Math.random() * colors.secondary.length)],
      opacity: Math.random() * 0.3 + 0.1
    }));
  }, [config.shapeCount, colors.secondary]);

  // Create wave effect
  const createWave = useCallback((x: number, y: number) => {
    if (wavesRef.current.length >= config.waveCount) {
      wavesRef.current.shift();
    }

    wavesRef.current.push({
      x,
      y,
      radius: 0,
      maxRadius: Math.random() * 150 + 100,
      opacity: 1,
      speed: Math.random() * 2 + 1,
      color: colors.primary[Math.floor(Math.random() * colors.primary.length)]
    });
  }, [config.waveCount, colors.primary]);

  // Update particles with magnetic field effect
  const updateParticles = useCallback(() => {
    const mouse = mouseRef.current;
    const magneticRadius = 200;

    particlesRef.current.forEach(particle => {
      // Calculate distance to mouse
      const dx = mouse.x - particle.x;
      const dy = mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Apply magnetic field effect
      if (effects.magneticField && distance < magneticRadius && isActive) {
        const force = ((magneticRadius - distance) / magneticRadius) * config.magneticStrength;
        const angle = Math.atan2(dy, dx);
        
        particle.vx += Math.cos(angle) * force * 0.1;
        particle.vy += Math.sin(angle) * force * 0.1;
      }

      // Apply velocity
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Add friction
      particle.vx *= 0.99;
      particle.vy *= 0.99;

      // Update life
      particle.life += 1;
      if (particle.life > particle.maxLife) {
        particle.life = 0;
        particle.x = Math.random() * (canvasRef.current?.width || 0);
        particle.y = Math.random() * (canvasRef.current?.height || 0);
      }

      // Boundary wrapping
      const canvas = canvasRef.current;
      if (canvas) {
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
      }
    });
  }, [effects.magneticField, config.magneticStrength, isActive]);

  // Update waves
  const updateWaves = useCallback(() => {
    wavesRef.current = wavesRef.current.filter(wave => {
      wave.radius += wave.speed;
      wave.opacity = Math.max(0, 1 - (wave.radius / wave.maxRadius));
      return wave.radius < wave.maxRadius;
    });
  }, []);

  // Update geometric shapes
  const updateShapes = useCallback(() => {
    shapesRef.current.forEach(shape => {
      shape.rotation += shape.rotationSpeed;
      
      // Subtle movement towards mouse
      if (isActive) {
        const dx = mouseRef.current.x - shape.x;
        const dy = mouseRef.current.y - shape.y;
        shape.x += dx * 0.001;
        shape.y += dy * 0.001;
      }
    });
  }, [isActive]);

  // Draw particle based on type
  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    const alpha = 1 - (particle.life / particle.maxLife);
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.strokeStyle = particle.color;
    ctx.lineWidth = 1;

    switch (particle.type) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        break;
      
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y - particle.size);
        ctx.lineTo(particle.x - particle.size, particle.y + particle.size);
        ctx.lineTo(particle.x + particle.size, particle.y + particle.size);
        ctx.closePath();
        ctx.fill();
        break;
      
      case 'square':
        ctx.fillRect(
          particle.x - particle.size,
          particle.y - particle.size,
          particle.size * 2,
          particle.size * 2
        );
        break;
      
      case 'star':
        drawStar(ctx, particle.x, particle.y, particle.size, 5);
        ctx.fill();
        break;
    }
    
    ctx.restore();
  };

  // Draw star shape
  const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, points: number) => {
    const angle = Math.PI / points;
    ctx.beginPath();

    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? radius : radius * 0.5;
      const a = i * angle;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.closePath();
  };

  // Draw geometric shape
  const drawGeometricShape = (ctx: CanvasRenderingContext2D, shape: GeometricShape) => {
    ctx.save();
    ctx.globalAlpha = shape.opacity;
    ctx.fillStyle = shape.color;
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = 2;

    ctx.translate(shape.x, shape.y);
    ctx.rotate(shape.rotation);

    switch (shape.type) {
      case 'hexagon':
        drawPolygon(ctx, 0, 0, shape.size, 6);
        break;
      case 'diamond':
        drawPolygon(ctx, 0, 0, shape.size, 4);
        break;
      case 'pentagon':
        drawPolygon(ctx, 0, 0, shape.size, 5);
        break;
    }

    ctx.stroke();
    ctx.restore();
  };

  // Draw polygon
  const drawPolygon = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, sides: number) => {
    const angle = (2 * Math.PI) / sides;
    ctx.beginPath();

    for (let i = 0; i < sides; i++) {
      const px = x + Math.cos(i * angle) * radius;
      const py = y + Math.sin(i * angle) * radius;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.closePath();
  };

  // Main draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const mouse = mouseRef.current;

    // Draw light beams effect
    if (effects.lightBeams && isActive) {
      const beamCount = 8;
      const time = Date.now() * 0.001;

      for (let i = 0; i < beamCount; i++) {
        const angle = (i / beamCount) * Math.PI * 2 + time;
        const length = 300 + Math.sin(time + i) * 100;

        const gradient = ctx.createLinearGradient(
          mouse.x,
          mouse.y,
          mouse.x + Math.cos(angle) * length,
          mouse.y + Math.sin(angle) * length
        );

        gradient.addColorStop(0, `${colors.accent}${Math.floor(config.glowIntensity * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, 'transparent');

        ctx.save();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(
          mouse.x + Math.cos(angle) * length,
          mouse.y + Math.sin(angle) * length
        );
        ctx.stroke();
        ctx.restore();
      }
    }

    // Draw color shift background
    if (effects.colorShift && isActive) {
      const time = Date.now() * 0.002;
      const gradient = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, 400
      );

      const color1 = colors.primary[Math.floor((Math.sin(time) + 1) * 2.5) % colors.primary.length];
      const color2 = colors.primary[Math.floor((Math.cos(time) + 1) * 2.5) % colors.primary.length];

      gradient.addColorStop(0, `${color1}${Math.floor(config.glowIntensity * 100).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(0.5, `${color2}${Math.floor(config.glowIntensity * 50).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw waves
    if (effects.waves) {
      wavesRef.current.forEach(wave => {
        ctx.save();
        ctx.globalAlpha = wave.opacity;
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
    }

    // Draw geometric shapes
    if (effects.geometricShapes) {
      shapesRef.current.forEach(shape => {
        drawGeometricShape(ctx, shape);
      });
    }

    // Draw particles
    if (effects.particles) {
      particlesRef.current.forEach(particle => {
        drawParticle(ctx, particle);
      });
    }

    // Draw mouse glow
    if (isActive) {
      const glowGradient = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, 100
      );

      glowGradient.addColorStop(0, `${colors.accent}${Math.floor(config.glowIntensity * 150).toString(16).padStart(2, '0')}`);
      glowGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [effects, isActive, colors, config, drawGeometricShape, drawParticle]);

  // Animation loop
  const animate = useCallback(() => {
    updateParticles();
    updateWaves();
    updateShapes();
    draw();
    animationRef.current = requestAnimationFrame(animate);
  }, [updateParticles, updateWaves, updateShapes, draw]);

  // Handle mouse movement
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const newX = e.clientX - rect.left;
    const newY = e.clientY - rect.top;

    // Check for significant movement to create waves
    const dx = newX - mouseRef.current.x;
    const dy = newY - mouseRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 10 && effects.waves) {
      createWave(newX, newY);
    }

    mouseRef.current.prevX = mouseRef.current.x;
    mouseRef.current.prevY = mouseRef.current.y;
    mouseRef.current.x = newX;
    mouseRef.current.y = newY;
  }, [effects.waves, createWave]);

  // Handle mouse enter/leave
  const handleMouseEnter = useCallback(() => setIsActive(true), []);
  const handleMouseLeave = useCallback(() => setIsActive(false), []);

  // Resize canvas
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    initializeParticles();
    initializeShapes();
  }, [initializeParticles, initializeShapes]);

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
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave, resizeCanvas, animate]);

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
        style={{
          mixBlendMode: currentTheme === 'dark' ? 'screen' : 'multiply',
          opacity: 0.8
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
