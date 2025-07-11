import React, { useState, useEffect } from 'react';

interface AnimatedEmojiWidgetProps {
  className?: string;
}

export function AnimatedEmojiWidget({ className = '' }: AnimatedEmojiWidgetProps) {
  const [currentEmojiSet, setCurrentEmojiSet] = useState(0);

  // Different emoji sets that change every cycle
  const emojiSets = [
    ['🚀', '⭐', '💎', '🎯', '✨'],
    ['🌟', '💫', '🔥', '⚡', '🌈'],
    ['🎉', '🎊', '🏆', '🎁', '🎈'],
    ['💝', '🌺', '🦋', '🌸', '🍀'],
    ['🎵', '🎶', '🎨', '🎭', '🎪'],
    ['🌙', '☀️', '🌍', '🌊', '🌿']
  ];

  // Change emoji set every 4 seconds (matching animation duration)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEmojiSet(prev => (prev + 1) % emojiSets.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [emojiSets.length]);

  const currentEmojis = emojiSets[currentEmojiSet];

  return (
    <div className={`animated-emoji-container ${className}`}>
      <div className="emoji-track">
        <div className="emoji-1">{currentEmojis[0]}</div>
        <div className="emoji-2">{currentEmojis[1]}</div>
        <div className="emoji-3">{currentEmojis[2]}</div>
        <div className="emoji-4">{currentEmojis[3]}</div>
        <div className="emoji-5">{currentEmojis[4]}</div>
      </div>
    </div>
  );
}
