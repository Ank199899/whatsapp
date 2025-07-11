import { useState, useEffect, useCallback } from 'react';

export interface ViewportInfo {
  width: number;
  height: number;
  zoom: number;
  devicePixelRatio: number;
  orientation: 'portrait' | 'landscape';
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isZoomed: boolean;
  zoomLevel: 'normal' | 'zoomed-in' | 'zoomed-out';
}

interface ResponsiveConfig {
  enableZoomDetection?: boolean;
  enableOrientationDetection?: boolean;
  debounceMs?: number;
  zoomThreshold?: number;
}

const defaultConfig: ResponsiveConfig = {
  enableZoomDetection: true,
  enableOrientationDetection: true,
  debounceMs: 150,
  zoomThreshold: 0.1,
};

// Breakpoint definitions (matching Tailwind CSS)
const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useResponsiveLayout(config: ResponsiveConfig = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  
  const [viewportInfo, setViewportInfo] = useState<ViewportInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        zoom: 1,
        devicePixelRatio: 1,
        orientation: 'landscape',
        breakpoint: 'lg',
        isZoomed: false,
        zoomLevel: 'normal',
      };
    }
    
    return calculateViewportInfo();
  });

  function calculateViewportInfo(): ViewportInfo {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Calculate zoom level using multiple methods for accuracy
    const zoom = calculateZoomLevel();
    const isZoomed = Math.abs(zoom - 1) > finalConfig.zoomThreshold!;
    
    let zoomLevel: 'normal' | 'zoomed-in' | 'zoomed-out' = 'normal';
    if (zoom > 1.1) zoomLevel = 'zoomed-in';
    else if (zoom < 0.9) zoomLevel = 'zoomed-out';
    
    const orientation = width > height ? 'landscape' : 'portrait';
    const breakpoint = getBreakpoint(width);
    
    return {
      width,
      height,
      zoom,
      devicePixelRatio,
      orientation,
      breakpoint,
      isZoomed,
      zoomLevel,
    };
  }

  function calculateZoomLevel(): number {
    // Method 1: Using screen.width vs window.innerWidth
    const screenZoom = screen.width / window.innerWidth;
    
    // Method 2: Using devicePixelRatio and screen dimensions
    const pixelRatioZoom = window.devicePixelRatio;
    
    // Method 3: Using document.documentElement.clientWidth
    const documentZoom = window.outerWidth / window.innerWidth;
    
    // Use the most reliable method based on browser
    if (screenZoom > 0 && screenZoom < 10) {
      return screenZoom;
    } else if (documentZoom > 0 && documentZoom < 10) {
      return documentZoom;
    } else {
      return pixelRatioZoom;
    }
  }

  function getBreakpoint(width: number): ViewportInfo['breakpoint'] {
    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'xs';
  }

  const updateViewportInfo = useCallback(() => {
    const newInfo = calculateViewportInfo();
    setViewportInfo(prevInfo => {
      // Only update if there's a meaningful change
      const hasChanged = 
        Math.abs(newInfo.width - prevInfo.width) > 5 ||
        Math.abs(newInfo.height - prevInfo.height) > 5 ||
        Math.abs(newInfo.zoom - prevInfo.zoom) > 0.05 ||
        newInfo.orientation !== prevInfo.orientation ||
        newInfo.breakpoint !== prevInfo.breakpoint;
      
      return hasChanged ? newInfo : prevInfo;
    });
  }, [finalConfig.zoomThreshold]);

  // Debounced update function
  const debouncedUpdate = useCallback(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateViewportInfo, finalConfig.debounceMs);
    };
  }, [updateViewportInfo, finalConfig.debounceMs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const debouncedUpdateFn = debouncedUpdate();

    // Event listeners
    const handleResize = () => debouncedUpdateFn();
    const handleOrientationChange = () => {
      // Delay to allow orientation change to complete
      setTimeout(debouncedUpdateFn, 100);
    };
    const handleZoom = () => debouncedUpdateFn();

    // Add event listeners
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true });
    
    if (finalConfig.enableZoomDetection) {
      // Listen for zoom events (wheel with ctrl/cmd)
      window.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
          handleZoom();
        }
      }, { passive: true });
      
      // Listen for keyboard zoom shortcuts
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
          setTimeout(handleZoom, 100);
        }
      }, { passive: true });
    }

    // Initial update
    updateViewportInfo();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [finalConfig.enableZoomDetection, finalConfig.enableOrientationDetection, debouncedUpdate, updateViewportInfo]);

  // Helper functions
  const isBreakpoint = useCallback((bp: ViewportInfo['breakpoint']) => {
    return viewportInfo.breakpoint === bp;
  }, [viewportInfo.breakpoint]);

  const isBreakpointUp = useCallback((bp: ViewportInfo['breakpoint']) => {
    const currentBpValue = breakpoints[viewportInfo.breakpoint];
    const targetBpValue = breakpoints[bp];
    return currentBpValue >= targetBpValue;
  }, [viewportInfo.breakpoint]);

  const isBreakpointDown = useCallback((bp: ViewportInfo['breakpoint']) => {
    const currentBpValue = breakpoints[viewportInfo.breakpoint];
    const targetBpValue = breakpoints[bp];
    return currentBpValue <= targetBpValue;
  }, [viewportInfo.breakpoint]);

  const isMobile = isBreakpointDown('md');
  const isTablet = isBreakpoint('md') || isBreakpoint('lg');
  const isDesktop = isBreakpointUp('lg');

  return {
    viewportInfo,
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    isMobile,
    isTablet,
    isDesktop,
    updateViewportInfo,
  };
}

// CSS-in-JS helper for responsive styles
export function createResponsiveStyles(viewportInfo: ViewportInfo) {
  const { zoom, breakpoint, zoomLevel, orientation } = viewportInfo;
  
  return {
    // Base scaling factor
    scale: zoom > 1.5 ? 0.8 : zoom < 0.8 ? 1.2 : 1,
    
    // Font size adjustments
    fontSize: {
      xs: zoom > 1.5 ? '0.6rem' : zoom < 0.8 ? '0.9rem' : '0.75rem',
      sm: zoom > 1.5 ? '0.7rem' : zoom < 0.8 ? '1rem' : '0.875rem',
      base: zoom > 1.5 ? '0.8rem' : zoom < 0.8 ? '1.1rem' : '1rem',
      lg: zoom > 1.5 ? '0.9rem' : zoom < 0.8 ? '1.2rem' : '1.125rem',
      xl: zoom > 1.5 ? '1rem' : zoom < 0.8 ? '1.3rem' : '1.25rem',
    },
    
    // Spacing adjustments
    spacing: {
      xs: zoom > 1.5 ? '0.1rem' : zoom < 0.8 ? '0.3rem' : '0.25rem',
      sm: zoom > 1.5 ? '0.2rem' : zoom < 0.8 ? '0.6rem' : '0.5rem',
      md: zoom > 1.5 ? '0.4rem' : zoom < 0.8 ? '1.2rem' : '1rem',
      lg: zoom > 1.5 ? '0.6rem' : zoom < 0.8 ? '1.8rem' : '1.5rem',
      xl: zoom > 1.5 ? '0.8rem' : zoom < 0.8 ? '2.4rem' : '2rem',
    },
    
    // Layout classes
    containerClass: `responsive-container-${breakpoint} zoom-${zoomLevel} orientation-${orientation}`,
    
    // Dynamic CSS variables
    cssVariables: {
      '--responsive-scale': zoom > 1.5 ? '0.8' : zoom < 0.8 ? '1.2' : '1',
      '--responsive-zoom': zoom.toString(),
      '--responsive-breakpoint': breakpoint,
      '--responsive-orientation': orientation,
    },
  };
}
