import { useEffect, useCallback, useState } from 'react';

interface ZoomInfo {
  level: number;
  scale: string;
  fontScale: number;
  spacingScale: number;
}

export const useAutoFontSystem = () => {
  const [zoomInfo, setZoomInfo] = useState<ZoomInfo>({
    level: 1,
    scale: 'normal',
    fontScale: 1,
    spacingScale: 1
  });

  // Detect zoom level using various methods
  const detectZoomLevel = useCallback(() => {
    let zoomLevel = 1;
    let scale = 'normal';
    let fontScale = 1;
    let spacingScale = 1;

    try {
      // Method 1: Using devicePixelRatio and screen dimensions
      const devicePixelRatio = window.devicePixelRatio || 1;
      const screenWidth = window.screen.width;
      const windowWidth = window.innerWidth;
      
      // Method 2: Using CSS media queries
      const testElement = document.createElement('div');
      testElement.style.width = '1in';
      testElement.style.height = '1in';
      testElement.style.position = 'absolute';
      testElement.style.left = '-100%';
      testElement.style.top = '-100%';
      testElement.style.visibility = 'hidden';
      document.body.appendChild(testElement);
      
      const dpi = testElement.offsetWidth * devicePixelRatio;
      document.body.removeChild(testElement);
      
      // Method 3: Calculate zoom based on viewport and screen ratio
      const calculatedZoom = Math.round((screenWidth / windowWidth) * 100) / 100;
      
      // Use the most reliable method
      if (devicePixelRatio > 1) {
        zoomLevel = devicePixelRatio;
      } else if (calculatedZoom > 1) {
        zoomLevel = calculatedZoom;
      }
      
      // Determine scale category and adjustments
      if (zoomLevel >= 2) {
        scale = 'zoomed-in-high';
        fontScale = 0.75;
        spacingScale = 0.8;
      } else if (zoomLevel >= 1.5) {
        scale = 'zoomed-in-medium';
        fontScale = 0.85;
        spacingScale = 0.9;
      } else if (zoomLevel >= 1.25) {
        scale = 'zoomed-in-low';
        fontScale = 0.9;
        spacingScale = 0.95;
      } else if (zoomLevel <= 0.75) {
        scale = 'zoomed-out-high';
        fontScale = 1.2;
        spacingScale = 1.15;
      } else if (zoomLevel <= 0.9) {
        scale = 'zoomed-out-low';
        fontScale = 1.1;
        spacingScale = 1.05;
      } else {
        scale = 'normal';
        fontScale = 1;
        spacingScale = 1;
      }

      console.log(`🔍 Zoom Detection: Level=${zoomLevel}, Scale=${scale}, DPR=${devicePixelRatio}, DPI=${dpi}`);
      
    } catch (error) {
      console.warn('Error detecting zoom level:', error);
    }

    return { level: zoomLevel, scale, fontScale, spacingScale };
  }, []);

  // Apply zoom adjustments to CSS custom properties
  const applyZoomAdjustments = useCallback((info: ZoomInfo) => {
    const root = document.documentElement;
    
    // Set CSS custom properties
    root.style.setProperty('--zoom-level', info.level.toString());
    root.style.setProperty('--font-scale-factor', info.fontScale.toString());
    root.style.setProperty('--spacing-scale-factor', info.spacingScale.toString());
    
    // Remove existing zoom classes
    document.body.classList.remove(
      'zoom-normal',
      'zoom-zoomed-in-low',
      'zoom-zoomed-in-medium', 
      'zoom-zoomed-in-high',
      'zoom-zoomed-out-low',
      'zoom-zoomed-out-high'
    );
    
    // Add appropriate zoom class
    document.body.classList.add(`zoom-${info.scale}`);
    
    console.log(`✅ Applied zoom adjustments: ${info.scale} (font: ${info.fontScale}, spacing: ${info.spacingScale})`);
  }, []);

  // Handle resize events (which can indicate zoom changes)
  const handleResize = useCallback(() => {
    const newZoomInfo = detectZoomLevel();
    
    // Only update if zoom level changed significantly
    if (Math.abs(newZoomInfo.level - zoomInfo.level) > 0.1) {
      setZoomInfo(newZoomInfo);
      applyZoomAdjustments(newZoomInfo);
    }
  }, [zoomInfo.level, detectZoomLevel, applyZoomAdjustments]);

  // Handle visibility change (can detect zoom changes in some browsers)
  const handleVisibilityChange = useCallback(() => {
    if (!document.hidden) {
      setTimeout(() => {
        const newZoomInfo = detectZoomLevel();
        setZoomInfo(newZoomInfo);
        applyZoomAdjustments(newZoomInfo);
      }, 100);
    }
  }, [detectZoomLevel, applyZoomAdjustments]);

  // Initialize and set up event listeners
  useEffect(() => {
    // Initial detection
    const initialZoomInfo = detectZoomLevel();
    setZoomInfo(initialZoomInfo);
    applyZoomAdjustments(initialZoomInfo);

    // Set up event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Periodic check for zoom changes (fallback)
    const zoomCheckInterval = setInterval(() => {
      const currentZoomInfo = detectZoomLevel();
      if (Math.abs(currentZoomInfo.level - zoomInfo.level) > 0.1) {
        setZoomInfo(currentZoomInfo);
        applyZoomAdjustments(currentZoomInfo);
      }
    }, 2000);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(zoomCheckInterval);
    };
  }, [handleResize, handleVisibilityChange, detectZoomLevel, applyZoomAdjustments, zoomInfo.level]);

  // Utility functions for components
  const getAutoFontClass = useCallback((size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl') => {
    return `auto-font-${size}`;
  }, []);

  const getAutoSpacingClass = useCallback((size: 'xs' | 'sm' | 'base' | 'lg') => {
    return `auto-spacing-${size}`;
  }, []);

  const getAutoButtonClass = useCallback((size: 'sm' | 'base' | 'lg') => {
    return `auto-button-${size}`;
  }, []);

  const getAutoHeaderClass = useCallback((level: 1 | 2 | 3 | 4) => {
    return `auto-header-${level}`;
  }, []);

  const getAutoContainerClass = useCallback((size?: 'sm' | 'base' | 'lg') => {
    return size ? `auto-container-${size}` : 'auto-container';
  }, []);

  // Apply auto-font classes to specific elements
  const applyAutoFontToElement = useCallback((element: HTMLElement, fontSize: string, spacing?: string) => {
    if (element) {
      element.classList.add(getAutoFontClass(fontSize as any));
      if (spacing) {
        element.classList.add(getAutoSpacingClass(spacing as any));
      }
    }
  }, [getAutoFontClass, getAutoSpacingClass]);

  return {
    zoomInfo,
    getAutoFontClass,
    getAutoSpacingClass,
    getAutoButtonClass,
    getAutoHeaderClass,
    getAutoContainerClass,
    applyAutoFontToElement,
    detectZoomLevel,
    applyZoomAdjustments
  };
};

export default useAutoFontSystem;
