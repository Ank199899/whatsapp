import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { AnimatedEmoji } from '@/data/animated-emojis';

interface AnimatedEmojiProps {
  emoji: string;
  animationType?: 'bounce' | 'pulse' | 'rotate' | 'shake' | 'glow' | 'float';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  autoPlay?: boolean;
  duration?: number;
  delay?: number;
  onAnimationComplete?: () => void;
}

export function AnimatedEmoji({
  emoji,
  animationType = 'bounce',
  size = 'md',
  className = '',
  autoPlay = true,
  duration = 1000,
  delay = 0,
  onAnimationComplete,
}: AnimatedEmojiProps) {
  const [isAnimating, setIsAnimating] = useState(autoPlay);
  const [hasAnimated, setHasAnimated] = useState(false);
  const emojiRef = useRef<HTMLSpanElement>(null);

  const sizeClasses = {
    sm: 'text-sm w-4 h-4',
    md: 'text-base w-5 h-5',
    lg: 'text-lg w-6 h-6',
    xl: 'text-xl w-8 h-8',
  };

  const animationClasses = {
    bounce: 'animate-emoji-bounce',
    pulse: 'animate-emoji-pulse',
    rotate: 'animate-emoji-rotate',
    shake: 'animate-emoji-shake',
    glow: 'animate-emoji-glow',
    float: 'animate-emoji-float',
  };

  useEffect(() => {
    if (autoPlay && !hasAnimated) {
      const timer = setTimeout(() => {
        setIsAnimating(true);
        setHasAnimated(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [autoPlay, delay, hasAnimated]);

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onAnimationComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isAnimating, duration, onAnimationComplete]);

  const handleClick = () => {
    if (!autoPlay) {
      setIsAnimating(true);
      setHasAnimated(true);
    }
  };

  const emojiClasses = cn(
    'inline-block cursor-pointer select-none transition-all duration-200',
    'hover:scale-110 active:scale-95',
    sizeClasses[size],
    isAnimating ? animationClasses[animationType] : '',
    className
  );

  return (
    <span
      ref={emojiRef}
      className={emojiClasses}
      onClick={handleClick}
      role="img"
      aria-label={`Animated emoji: ${emoji}`}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`,
      }}
    >
      {emoji}
    </span>
  );
}

// Emoji processor component that converts text to animated emojis
interface EmojiProcessorProps {
  text: string;
  className?: string;
  enableAnimation?: boolean;
  emojiSize?: 'sm' | 'md' | 'lg' | 'xl';
  animationDelay?: number;
}

export function EmojiProcessor({
  text,
  className = '',
  enableAnimation = true,
  emojiSize = 'md',
  animationDelay = 0,
}: EmojiProcessorProps) {
  const processedContent = processTextWithEmojis(text, {
    enableAnimation,
    emojiSize,
    animationDelay,
  });

  return (
    <span className={className}>
      {processedContent}
    </span>
  );
}

// Text processing utilities
interface ProcessingOptions {
  enableAnimation?: boolean;
  emojiSize?: 'sm' | 'md' | 'lg' | 'xl';
  animationDelay?: number;
}

export function processTextWithEmojis(
  text: string,
  options: ProcessingOptions = {}
): React.ReactNode[] {
  const {
    enableAnimation = true,
    emojiSize = 'md',
    animationDelay = 0,
  } = options;

  // Import emoji data dynamically to avoid circular dependencies
  const { emojiByTrigger, emoticonPatterns } = require('@/data/animated-emojis');

  let processedText = text;
  const replacements: Array<{
    start: number;
    end: number;
    emoji: string;
    animationType?: string;
  }> = [];

  // First, replace emoticon patterns
  emoticonPatterns.forEach((pattern: any) => {
    let match;
    while ((match = pattern.pattern.exec(processedText)) !== null) {
      replacements.push({
        start: match.index,
        end: match.index + match[0].length,
        emoji: pattern.emoji,
      });
    }
  });

  // Then, find trigger words and replace with animated emojis
  const words = processedText.split(/\s+/);
  let currentIndex = 0;

  words.forEach((word) => {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    const emojiData = emojiByTrigger.get(cleanWord);

    if (emojiData) {
      const wordStart = processedText.indexOf(word, currentIndex);
      const wordEnd = wordStart + word.length;

      // Check if this position is already replaced
      const isAlreadyReplaced = replacements.some(
        (replacement) =>
          wordStart >= replacement.start && wordEnd <= replacement.end
      );

      if (!isAlreadyReplaced) {
        replacements.push({
          start: wordStart,
          end: wordEnd,
          emoji: emojiData.emoji,
          animationType: emojiData.animationType,
        });
      }
    }

    currentIndex = processedText.indexOf(word, currentIndex) + word.length;
  });

  // Sort replacements by start position (descending) to avoid index shifting
  replacements.sort((a, b) => b.start - a.start);

  // Apply replacements
  const result: React.ReactNode[] = [];
  let lastIndex = processedText.length;

  replacements.forEach((replacement, index) => {
    // Add text after this replacement
    if (lastIndex > replacement.end) {
      result.unshift(processedText.slice(replacement.end, lastIndex));
    }

    // Add animated emoji
    result.unshift(
      <AnimatedEmoji
        key={`emoji-${replacement.start}-${index}`}
        emoji={replacement.emoji}
        animationType={replacement.animationType as any}
        size={emojiSize}
        autoPlay={enableAnimation}
        delay={animationDelay + index * 100}
      />
    );

    lastIndex = replacement.start;
  });

  // Add remaining text at the beginning
  if (lastIndex > 0) {
    result.unshift(processedText.slice(0, lastIndex));
  }

  return result.length > 0 ? result : [text];
}

// Hook for emoji processing
export function useEmojiProcessor(options: ProcessingOptions = {}) {
  const processText = (text: string) => {
    return processTextWithEmojis(text, options);
  };

  return { processText };
}

// Emoji picker component (basic)
interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
  categories?: string[];
}

export function EmojiPicker({
  onEmojiSelect,
  className = '',
  categories = ['emotions', 'gestures', 'objects'],
}: EmojiPickerProps) {
  const { emojiByCategory } = require('@/data/animated-emojis');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  const emojisInCategory = emojiByCategory.get(selectedCategory) || [];

  return (
    <div className={cn('emoji-picker bg-white border rounded-lg shadow-lg p-4', className)}>
      {/* Category tabs */}
      <div className="flex space-x-2 mb-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'px-3 py-1 rounded-md text-sm font-medium transition-colors',
              selectedCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
        {emojisInCategory.map((emojiData: AnimatedEmoji) => (
          <button
            key={emojiData.id}
            onClick={() => onEmojiSelect(emojiData.emoji)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title={emojiData.name}
          >
            <AnimatedEmoji
              emoji={emojiData.emoji}
              animationType={emojiData.animationType}
              size="md"
              autoPlay={false}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
