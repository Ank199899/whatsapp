import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Animated Message Component
interface AnimatedMessageProps {
  children: React.ReactNode;
  direction: 'incoming' | 'outgoing';
  className?: string;
  animationType?: 'slide' | 'fade' | 'pop';
  delay?: number;
  onAnimationComplete?: () => void;
}

export function AnimatedMessage({
  children,
  direction,
  className = '',
  animationType = 'slide',
  delay = 0,
  onAnimationComplete,
}: AnimatedMessageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (isVisible && onAnimationComplete) {
      const timer = setTimeout(onAnimationComplete, 400);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onAnimationComplete]);

  const getAnimationClass = () => {
    if (!isVisible) return 'opacity-0';
    
    switch (animationType) {
      case 'slide':
        return direction === 'incoming' 
          ? 'message-animate-in-left' 
          : 'message-animate-in-right';
      case 'fade':
        return 'message-animate-fade-in';
      case 'pop':
        return 'message-animate-pop-in';
      default:
        return 'message-animate-fade-in';
    }
  };

  return (
    <div
      ref={messageRef}
      className={cn(
        'chat-bubble transition-all duration-200',
        getAnimationClass(),
        className
      )}
    >
      {children}
    </div>
  );
}

// Typing Indicator Component
interface TypingIndicatorProps {
  isVisible: boolean;
  userName?: string;
  className?: string;
}

export function TypingIndicator({
  isVisible,
  userName = 'Someone',
  className = '',
}: TypingIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className={cn('typing-indicator', className)}>
      <div className="flex items-center space-x-2">
        <div className="typing-dots">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
        <span className="text-xs text-gray-500">
          {userName} is typing...
        </span>
      </div>
    </div>
  );
}

// Animated Send Button
interface AnimatedSendButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function AnimatedSendButton({
  onClick,
  disabled = false,
  isLoading = false,
  className = '',
  children,
}: AnimatedSendButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (disabled || isLoading) return;
    
    setIsAnimating(true);
    onClick();
    
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        'send-button transition-all duration-200',
        isAnimating && 'send-button-success',
        isLoading && 'send-button-pulse',
        'bg-primary hover:bg-primary/90 text-primary-foreground',
        'rounded-full p-2 disabled:opacity-50',
        className
      )}
    >
      {children || (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22,2 15,22 11,13 2,9"></polygon>
        </svg>
      )}
    </button>
  );
}

// Animated Chat Input
interface AnimatedChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function AnimatedChatInput({
  value,
  onChange,
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
  className = '',
}: AnimatedChatInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div
      className={cn(
        'chat-input-container flex items-center space-x-2 p-3',
        'bg-white border border-gray-200 rounded-lg',
        isFocused && 'chat-input-focused',
        className
      )}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 outline-none bg-transparent text-gray-900 placeholder-gray-500"
      />
      <AnimatedSendButton
        onClick={onSend}
        disabled={disabled || !value.trim()}
      />
    </div>
  );
}

// Message Status Indicator with Animation
interface AnimatedMessageStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'read';
  className?: string;
}

export function AnimatedMessageStatus({
  status,
  className = '',
}: AnimatedMessageStatusProps) {
  const [currentStatus, setCurrentStatus] = useState<typeof status>('sending');

  useEffect(() => {
    if (status !== currentStatus) {
      setCurrentStatus(status);
    }
  }, [status, currentStatus]);

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'sending':
        return (
          <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
        );
      case 'sent':
        return (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            className="status-animate-in text-gray-400"
            fill="currentColor"
          >
            <path d="M9.707 3.293a1 1 0 0 1 0 1.414L5.414 9a1 1 0 0 1-1.414 0L1.293 6.293a1 1 0 1 1 1.414-1.414L4.707 6.879 8.293 3.293a1 1 0 0 1 1.414 0z"/>
          </svg>
        );
      case 'delivered':
        return (
          <div className="status-delivered flex">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              className="text-gray-400"
              fill="currentColor"
            >
              <path d="M9.707 3.293a1 1 0 0 1 0 1.414L5.414 9a1 1 0 0 1-1.414 0L1.293 6.293a1 1 0 1 1 1.414-1.414L4.707 6.879 8.293 3.293a1 1 0 0 1 1.414 0z"/>
            </svg>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              className="text-gray-400 -ml-1"
              fill="currentColor"
            >
              <path d="M9.707 3.293a1 1 0 0 1 0 1.414L5.414 9a1 1 0 0 1-1.414 0L1.293 6.293a1 1 0 1 1 1.414-1.414L4.707 6.879 8.293 3.293a1 1 0 0 1 1.414 0z"/>
            </svg>
          </div>
        );
      case 'read':
        return (
          <div className="status-read flex">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              className="text-blue-500"
              fill="currentColor"
            >
              <path d="M9.707 3.293a1 1 0 0 1 0 1.414L5.414 9a1 1 0 0 1-1.414 0L1.293 6.293a1 1 0 1 1 1.414-1.414L4.707 6.879 8.293 3.293a1 1 0 0 1 1.414 0z"/>
            </svg>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              className="text-blue-500 -ml-1"
              fill="currentColor"
            >
              <path d="M9.707 3.293a1 1 0 0 1 0 1.414L5.414 9a1 1 0 0 1-1.414 0L1.293 6.293a1 1 0 1 1 1.414-1.414L4.707 6.879 8.293 3.293a1 1 0 0 1 1.414 0z"/>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('flex items-center justify-end', className)}>
      {getStatusIcon()}
    </div>
  );
}

// Online Status Indicator
interface OnlineStatusProps {
  isOnline: boolean;
  className?: string;
}

export function OnlineStatus({ isOnline, className = '' }: OnlineStatusProps) {
  return (
    <div
      className={cn(
        'w-3 h-3 rounded-full',
        isOnline ? 'bg-green-500 online-status' : 'bg-gray-400',
        className
      )}
    />
  );
}

// Scroll to Bottom Button
interface ScrollToBottomButtonProps {
  onClick: () => void;
  isVisible: boolean;
  unreadCount?: number;
  className?: string;
}

export function ScrollToBottomButton({
  onClick,
  isVisible,
  unreadCount = 0,
  className = '',
}: ScrollToBottomButtonProps) {
  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'scroll-to-bottom-button fixed bottom-20 right-4 z-10',
        'bg-white border border-gray-200 rounded-full p-3 shadow-lg',
        'hover:bg-gray-50 transition-all duration-200',
        className
      )}
    >
      <div className="relative">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </div>
    </button>
  );
}

// Connection Status Banner
interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected';
  className?: string;
}

export function ConnectionStatus({ status, className = '' }: ConnectionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          text: 'Connected',
          bgColor: 'bg-green-500',
          animation: 'connection-connected',
        };
      case 'connecting':
        return {
          text: 'Connecting...',
          bgColor: 'bg-yellow-500',
          animation: 'connection-reconnecting',
        };
      case 'disconnected':
        return {
          text: 'Disconnected',
          bgColor: 'bg-red-500',
          animation: '',
        };
      default:
        return {
          text: 'Unknown',
          bgColor: 'bg-gray-500',
          animation: '',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 text-white text-center py-2 text-sm',
        config.bgColor,
        config.animation,
        className
      )}
    >
      {config.text}
    </div>
  );
}

// Animated Chat Header
interface AnimatedChatHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedChatHeader({
  children,
  className = '',
}: AnimatedChatHeaderProps) {
  return (
    <div className={cn('chat-header-animate', className)}>
      {children}
    </div>
  );
}
