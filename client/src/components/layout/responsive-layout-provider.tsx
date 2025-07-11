import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useResponsiveLayout, createResponsiveStyles } from '@/hooks/useResponsiveLayout';
import type { ViewportInfo } from '@/hooks/useResponsiveLayout';

interface ResponsiveLayoutContextType {
  viewportInfo: ViewportInfo;
  isBreakpoint: (bp: ViewportInfo['breakpoint']) => boolean;
  isBreakpointUp: (bp: ViewportInfo['breakpoint']) => boolean;
  isBreakpointDown: (bp: ViewportInfo['breakpoint']) => boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  responsiveStyles: ReturnType<typeof createResponsiveStyles>;
  updateViewportInfo: () => void;
}

const ResponsiveLayoutContext = createContext<ResponsiveLayoutContextType | null>(null);

interface ResponsiveLayoutProviderProps {
  children: React.ReactNode;
  enableZoomDetection?: boolean;
  enableOrientationDetection?: boolean;
  debounceMs?: number;
  className?: string;
}

export function ResponsiveLayoutProvider({
  children,
  enableZoomDetection = true,
  enableOrientationDetection = true,
  debounceMs = 150,
  className = '',
}: ResponsiveLayoutProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    viewportInfo,
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    isMobile,
    isTablet,
    isDesktop,
    updateViewportInfo,
  } = useResponsiveLayout({
    enableZoomDetection,
    enableOrientationDetection,
    debounceMs,
  });

  const responsiveStyles = createResponsiveStyles(viewportInfo);

  // Apply CSS variables to the container
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { cssVariables } = responsiveStyles;

    // Apply CSS variables
    Object.entries(cssVariables).forEach(([property, value]) => {
      container.style.setProperty(property, value);
    });

    // Apply responsive classes
    const { containerClass } = responsiveStyles;
    container.className = `responsive-container ${containerClass} ${className}`;

  }, [responsiveStyles, className]);

  const contextValue: ResponsiveLayoutContextType = {
    viewportInfo,
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    isMobile,
    isTablet,
    isDesktop,
    responsiveStyles,
    updateViewportInfo,
  };

  return (
    <ResponsiveLayoutContext.Provider value={contextValue}>
      <div ref={containerRef} className={`responsive-container ${className}`}>
        {children}
      </div>
    </ResponsiveLayoutContext.Provider>
  );
}

export function useResponsiveLayoutContext() {
  const context = useContext(ResponsiveLayoutContext);
  if (!context) {
    throw new Error('useResponsiveLayoutContext must be used within a ResponsiveLayoutProvider');
  }
  return context;
}

// Higher-order component for responsive layout
export function withResponsiveLayout<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    enableZoomDetection?: boolean;
    enableOrientationDetection?: boolean;
    debounceMs?: number;
  }
) {
  return function ResponsiveComponent(props: P) {
    return (
      <ResponsiveLayoutProvider {...options}>
        <Component {...props} />
      </ResponsiveLayoutProvider>
    );
  };
}

// Responsive container component
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  enableSmartLayout?: boolean;
}

export function ResponsiveContainer({
  children,
  className = '',
  as: Component = 'div',
  enableSmartLayout = false,
}: ResponsiveContainerProps) {
  const { responsiveStyles, viewportInfo } = useResponsiveLayoutContext();
  
  const containerClasses = [
    'responsive-container',
    responsiveStyles.containerClass,
    enableSmartLayout ? 'smart-layout' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component className={containerClasses}>
      {children}
    </Component>
  );
}

// Responsive text component
interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function ResponsiveText({
  children,
  size = 'base',
  className = '',
  as: Component = 'span',
}: ResponsiveTextProps) {
  const textClasses = [
    'responsive-text',
    `responsive-text-${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component className={textClasses}>
      {children}
    </Component>
  );
}

// Responsive spacing component
interface ResponsiveSpacingProps {
  children: React.ReactNode;
  padding?: 1 | 2 | 3 | 4 | 6 | 8;
  margin?: 1 | 2 | 3 | 4 | 6 | 8;
  gap?: 1 | 2 | 3 | 4 | 6;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function ResponsiveSpacing({
  children,
  padding,
  margin,
  gap,
  className = '',
  as: Component = 'div',
}: ResponsiveSpacingProps) {
  const spacingClasses = [
    padding ? `responsive-p-${padding}` : '',
    margin ? `responsive-m-${margin}` : '',
    gap ? `responsive-gap-${gap}` : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component className={spacingClasses}>
      {children}
    </Component>
  );
}

// Smart layout component for chat interfaces
interface SmartChatLayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  className?: string;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

export function SmartChatLayout({
  sidebar,
  main,
  className = '',
  sidebarCollapsed = false,
  onSidebarToggle,
}: SmartChatLayoutProps) {
  const { isMobile, isTablet, viewportInfo } = useResponsiveLayoutContext();
  
  const layoutClasses = [
    'smart-layout',
    'responsive-chat-container',
    className,
  ].filter(Boolean).join(' ');

  const sidebarClasses = [
    'smart-sidebar',
    'responsive-chat-sidebar',
    isMobile && !sidebarCollapsed ? 'open' : '',
  ].filter(Boolean).join(' ');

  const mainClasses = [
    'smart-main',
    'responsive-chat-main',
  ].filter(Boolean).join(' ');

  // Handle mobile overlay
  const handleOverlayClick = () => {
    if (isMobile && onSidebarToggle) {
      onSidebarToggle();
    }
  };

  return (
    <div className={layoutClasses}>
      {/* Mobile overlay */}
      {isMobile && !sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={handleOverlayClick}
        />
      )}
      
      {/* Sidebar */}
      <div className={sidebarClasses}>
        {sidebar}
      </div>
      
      {/* Main content */}
      <div className={mainClasses}>
        {main}
      </div>
    </div>
  );
}

// Responsive message component
interface ResponsiveMessageProps {
  children: React.ReactNode;
  direction?: 'incoming' | 'outgoing';
  className?: string;
  animated?: boolean;
}

export function ResponsiveMessage({
  children,
  direction = 'incoming',
  className = '',
  animated = true,
}: ResponsiveMessageProps) {
  const messageClasses = [
    'responsive-message',
    `message-${direction}`,
    animated ? 'responsive-scale-in' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={messageClasses}>
      {children}
    </div>
  );
}

// Hook for responsive styles
export function useResponsiveStyles() {
  const { responsiveStyles } = useResponsiveLayoutContext();
  return responsiveStyles;
}

// Hook for viewport information
export function useViewportInfo() {
  const { viewportInfo } = useResponsiveLayoutContext();
  return viewportInfo;
}
