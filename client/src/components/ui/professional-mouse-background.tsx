import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

// Context for managing background effects globally
interface BackgroundContextType {
  isEnabled: boolean;
  toggleBackground: () => void;
  intensity: 'minimal' | 'subtle' | 'elegant';
  setIntensity: (intensity: 'minimal' | 'subtle' | 'elegant') => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const useBackgroundControls = () => {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackgroundControls must be used within BackgroundProvider');
  }
  return context;
};

// Provider component
export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState(() => {
    const saved = localStorage.getItem('mouse-background-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [intensity, setIntensity] = useState<'minimal' | 'subtle' | 'elegant'>(() => {
    const saved = localStorage.getItem('mouse-background-intensity');
    return (saved as any) || 'subtle';
  });

  const toggleBackground = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    localStorage.setItem('mouse-background-enabled', JSON.stringify(newValue));
  };

  const handleSetIntensity = (newIntensity: 'minimal' | 'subtle' | 'elegant') => {
    setIntensity(newIntensity);
    localStorage.setItem('mouse-background-intensity', newIntensity);
  };

  return (
    <BackgroundContext.Provider value={{
      isEnabled,
      toggleBackground,
      intensity,
      setIntensity: handleSetIntensity
    }}>
      {children}
    </BackgroundContext.Provider>
  );
};

interface ProfessionalMouseBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
}

export const ProfessionalMouseBackground: React.FC<ProfessionalMouseBackgroundProps> = ({
  children,
  className
}) => {
  const { isEnabled, intensity } = useBackgroundControls();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const [isMouseActive, setIsMouseActive] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Professional intensity settings
  const intensityConfig = {
    minimal: {
      particleCount: 8,
      maxOpacity: 0.1,
      glowRadius: 60,
      attractionRadius: 80,
      attractionStrength: 0.02
    },
    subtle: {
      particleCount: 15,
      maxOpacity: 0.15,
      glowRadius: 100,
      attractionRadius: 120,
      attractionStrength: 0.03
    },
    elegant: {
      particleCount: 25,
      maxOpacity: 0.2,
      glowRadius: 140,
      attractionRadius: 160,
      attractionStrength: 0.04
    }
  };

  const config = intensityConfig[intensity];

  // Professional color scheme - Green and Yellow
  const getColors = () => {
    if (isDarkMode) {
      return {
        primary: 'rgba(34, 197, 94, 0.4)',       // Green
        secondary: 'rgba(251, 191, 36, 0.3)',    // Yellow
        accent: 'rgba(16, 185, 129, 0.2)',       // Emerald
        glow: 'rgba(34, 197, 94, 0.1)'
      };
    } else {
      return {
        primary: 'rgba(34, 197, 94, 0.3)',       // Green
        secondary: 'rgba(251, 191, 36, 0.2)',    // Yellow
        accent: 'rgba(16, 185, 129, 0.15)',      // Emerald
        glow: 'rgba(34, 197, 94, 0.08)'
      };
    }
  };

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkTheme);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkTheme);
    };
  }, []);

  // Initialize particles
  const initializeParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    particlesRef.current = Array.from({ length: config.particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      life: 0,
      maxLife: Math.random() * 400 + 200,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * config.maxOpacity + 0.02
    }));
  };

  // Update particles with subtle attraction
  const updateParticles = () => {
    const mouse = mouseRef.current;
    
    particlesRef.current.forEach(particle => {
      // Subtle attraction to mouse
      if (isMouseActive) {
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < config.attractionRadius) {
          const force = ((config.attractionRadius - distance) / config.attractionRadius) * config.attractionStrength;
          particle.vx += (dx / distance) * force;
          particle.vy += (dy / distance) * force;
        }
      }

      // Apply velocity with damping
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.98;
      particle.vy *= 0.98;

      // Update life cycle
      particle.life += 1;
      if (particle.life > particle.maxLife) {
        particle.life = 0;
        particle.x = Math.random() * (canvasRef.current?.width || 0);
        particle.y = Math.random() * (canvasRef.current?.height || 0);
        particle.vx = (Math.random() - 0.5) * 0.2;
        particle.vy = (Math.random() - 0.5) * 0.2;
      }

      // Boundary handling
      const canvas = canvasRef.current;
      if (canvas) {
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
      }
    });
  };

  // Professional drawing function
  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colors = getColors();
    const mouse = mouseRef.current;

    // Subtle mouse glow
    if (isMouseActive) {
      const gradient = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, config.glowRadius
      );
      gradient.addColorStop(0, colors.glow);
      gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw particles
    particlesRef.current.forEach(particle => {
      const lifeRatio = 1 - (particle.life / particle.maxLife);
      const alpha = particle.opacity * lifeRatio;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      // Subtle particle glow
      const particleGradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size * 3
      );
      particleGradient.addColorStop(0, colors.primary);
      particleGradient.addColorStop(0.7, colors.secondary);
      particleGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = particleGradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });

    // Subtle connecting lines
    if (intensity !== 'minimal') {
      particlesRef.current.forEach((particle, i) => {
        particlesRef.current.slice(i + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            const opacity = (100 - distance) / 100 * 0.05;
            ctx.strokeStyle = colors.accent.replace('0.15', opacity.toString());
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
      });
    }
  };

  // Animation loop
  const animate = () => {
    if (!isEnabled) return;

    updateParticles();
    draw();
    animationRef.current = requestAnimationFrame(animate);
  };

  // Event handlers
  const handleMouseMove = (e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseEnter = () => setIsMouseActive(true);
  const handleMouseLeave = () => setIsMouseActive(false);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    initializeParticles();
  };

  useEffect(() => {
    if (!isEnabled) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    resizeCanvas();

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', resizeCanvas);

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
  }, [isEnabled, intensity, isDarkMode]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full", className)}
    >
      {isEnabled && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            mixBlendMode: isDarkMode ? 'screen' : 'multiply',
            opacity: 0.7
          }}
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
