// Animated Emoji Data and Mappings

export interface AnimatedEmoji {
  id: string;
  emoji: string;
  name: string;
  keywords: string[];
  category: string;
  animated?: boolean;
  animationType?: 'bounce' | 'pulse' | 'rotate' | 'shake' | 'glow' | 'float';
  triggers: string[]; // Text patterns that trigger this emoji
}

export const animatedEmojis: AnimatedEmoji[] = [
  // Happy/Positive Emotions
  {
    id: 'happy',
    emoji: '😊',
    name: 'Happy Face',
    keywords: ['happy', 'smile', 'joy', 'pleased'],
    category: 'emotions',
    animated: true,
    animationType: 'bounce',
    triggers: [':)', ':-)', ':D', ':-D', 'happy', 'smile', 'joy', 'good', 'great', 'awesome', 'wonderful']
  },
  {
    id: 'laughing',
    emoji: '😂',
    name: 'Laughing',
    keywords: ['laugh', 'funny', 'lol', 'haha'],
    category: 'emotions',
    animated: true,
    animationType: 'shake',
    triggers: ['lol', 'haha', 'hehe', 'funny', 'laugh', 'hilarious', '😂', 'rofl', 'lmao']
  },
  {
    id: 'love',
    emoji: '😍',
    name: 'Heart Eyes',
    keywords: ['love', 'heart', 'adore', 'crush'],
    category: 'emotions',
    animated: true,
    animationType: 'pulse',
    triggers: ['love', 'heart', 'adore', 'crush', 'beautiful', 'gorgeous', '<3', '❤️']
  },
  {
    id: 'wink',
    emoji: '😉',
    name: 'Winking Face',
    keywords: ['wink', 'flirt', 'playful'],
    category: 'emotions',
    animated: true,
    animationType: 'bounce',
    triggers: [';)', ';-)', 'wink', 'flirt']
  },

  // Sad/Negative Emotions
  {
    id: 'sad',
    emoji: '😢',
    name: 'Crying Face',
    keywords: ['sad', 'cry', 'tears', 'upset'],
    category: 'emotions',
    animated: true,
    animationType: 'float',
    triggers: [':(', ':-(', 'sad', 'cry', 'upset', 'tears', 'sorry', 'apologize']
  },
  {
    id: 'angry',
    emoji: '😠',
    name: 'Angry Face',
    keywords: ['angry', 'mad', 'furious', 'rage'],
    category: 'emotions',
    animated: true,
    animationType: 'shake',
    triggers: ['angry', 'mad', 'furious', 'rage', 'annoyed', 'frustrated', '>:(', 'grr']
  },
  {
    id: 'worried',
    emoji: '😟',
    name: 'Worried Face',
    keywords: ['worried', 'concerned', 'anxious'],
    category: 'emotions',
    animated: true,
    animationType: 'float',
    triggers: ['worried', 'concerned', 'anxious', 'nervous', 'scared']
  },

  // Surprised/Shocked
  {
    id: 'surprised',
    emoji: '😲',
    name: 'Surprised Face',
    keywords: ['surprised', 'shocked', 'wow', 'amazed'],
    category: 'emotions',
    animated: true,
    animationType: 'bounce',
    triggers: ['wow', 'omg', 'surprised', 'shocked', 'amazed', 'incredible', ':o', 'O_O']
  },
  {
    id: 'thinking',
    emoji: '🤔',
    name: 'Thinking Face',
    keywords: ['thinking', 'hmm', 'consider', 'ponder'],
    category: 'emotions',
    animated: true,
    animationType: 'rotate',
    triggers: ['hmm', 'thinking', 'consider', 'maybe', 'perhaps', 'wondering']
  },

  // Gestures and Actions
  {
    id: 'thumbs_up',
    emoji: '👍',
    name: 'Thumbs Up',
    keywords: ['thumbs up', 'good', 'ok', 'approve'],
    category: 'gestures',
    animated: true,
    animationType: 'bounce',
    triggers: ['thumbs up', 'good job', 'well done', 'ok', 'okay', 'approve', 'yes', 'correct']
  },
  {
    id: 'thumbs_down',
    emoji: '👎',
    name: 'Thumbs Down',
    keywords: ['thumbs down', 'bad', 'no', 'disapprove'],
    category: 'gestures',
    animated: true,
    animationType: 'shake',
    triggers: ['thumbs down', 'bad', 'no', 'nope', 'disapprove', 'wrong', 'incorrect']
  },
  {
    id: 'clap',
    emoji: '👏',
    name: 'Clapping Hands',
    keywords: ['clap', 'applause', 'bravo', 'congratulations'],
    category: 'gestures',
    animated: true,
    animationType: 'bounce',
    triggers: ['clap', 'applause', 'bravo', 'congratulations', 'well done', 'amazing']
  },
  {
    id: 'wave',
    emoji: '👋',
    name: 'Waving Hand',
    keywords: ['wave', 'hello', 'hi', 'goodbye', 'bye'],
    category: 'gestures',
    animated: true,
    animationType: 'shake',
    triggers: ['hello', 'hi', 'hey', 'goodbye', 'bye', 'wave', 'greetings']
  },

  // Objects and Symbols
  {
    id: 'fire',
    emoji: '🔥',
    name: 'Fire',
    keywords: ['fire', 'hot', 'lit', 'amazing'],
    category: 'objects',
    animated: true,
    animationType: 'glow',
    triggers: ['fire', 'hot', 'lit', 'amazing', 'awesome', 'incredible', 'burning']
  },
  {
    id: 'star',
    emoji: '⭐',
    name: 'Star',
    keywords: ['star', 'excellent', 'favorite', 'special'],
    category: 'objects',
    animated: true,
    animationType: 'glow',
    triggers: ['star', 'excellent', 'favorite', 'special', 'outstanding', 'brilliant']
  },
  {
    id: 'heart',
    emoji: '❤️',
    name: 'Red Heart',
    keywords: ['heart', 'love', 'romance', 'affection'],
    category: 'symbols',
    animated: true,
    animationType: 'pulse',
    triggers: ['heart', 'love', 'romance', 'affection', 'care', 'adore']
  },
  {
    id: 'party',
    emoji: '🎉',
    name: 'Party Popper',
    keywords: ['party', 'celebration', 'congratulations', 'fun'],
    category: 'objects',
    animated: true,
    animationType: 'bounce',
    triggers: ['party', 'celebration', 'congratulations', 'fun', 'celebrate', 'hooray', 'yay']
  },

  // Time and Weather
  {
    id: 'sun',
    emoji: '☀️',
    name: 'Sun',
    keywords: ['sun', 'sunny', 'bright', 'day'],
    category: 'weather',
    animated: true,
    animationType: 'glow',
    triggers: ['sun', 'sunny', 'bright', 'day', 'morning', 'sunshine']
  },
  {
    id: 'moon',
    emoji: '🌙',
    name: 'Crescent Moon',
    keywords: ['moon', 'night', 'sleep', 'dream'],
    category: 'weather',
    animated: true,
    animationType: 'float',
    triggers: ['moon', 'night', 'sleep', 'dream', 'evening', 'goodnight']
  },

  // Food and Drinks
  {
    id: 'coffee',
    emoji: '☕',
    name: 'Coffee',
    keywords: ['coffee', 'drink', 'morning', 'energy'],
    category: 'food',
    animated: true,
    animationType: 'float',
    triggers: ['coffee', 'drink', 'morning', 'energy', 'caffeine', 'wake up']
  },
  {
    id: 'pizza',
    emoji: '🍕',
    name: 'Pizza',
    keywords: ['pizza', 'food', 'hungry', 'delicious'],
    category: 'food',
    animated: true,
    animationType: 'bounce',
    triggers: ['pizza', 'food', 'hungry', 'delicious', 'eat', 'dinner']
  },

  // Animals
  {
    id: 'cat',
    emoji: '🐱',
    name: 'Cat Face',
    keywords: ['cat', 'kitten', 'cute', 'pet'],
    category: 'animals',
    animated: true,
    animationType: 'bounce',
    triggers: ['cat', 'kitten', 'cute', 'pet', 'meow']
  },
  {
    id: 'dog',
    emoji: '🐶',
    name: 'Dog Face',
    keywords: ['dog', 'puppy', 'cute', 'pet'],
    category: 'animals',
    animated: true,
    animationType: 'bounce',
    triggers: ['dog', 'puppy', 'cute', 'pet', 'woof', 'bark']
  }
];

// Create lookup maps for efficient searching
export const emojiByTrigger = new Map<string, AnimatedEmoji>();
export const emojiByKeyword = new Map<string, AnimatedEmoji[]>();
export const emojiByCategory = new Map<string, AnimatedEmoji[]>();

// Initialize lookup maps
animatedEmojis.forEach(emoji => {
  // Trigger map
  emoji.triggers.forEach(trigger => {
    emojiByTrigger.set(trigger.toLowerCase(), emoji);
  });

  // Keyword map
  emoji.keywords.forEach(keyword => {
    if (!emojiByKeyword.has(keyword)) {
      emojiByKeyword.set(keyword, []);
    }
    emojiByKeyword.get(keyword)!.push(emoji);
  });

  // Category map
  if (!emojiByCategory.has(emoji.category)) {
    emojiByCategory.set(emoji.category, []);
  }
  emojiByCategory.get(emoji.category)!.push(emoji);
});

// Common emoticon patterns
export const emoticonPatterns = [
  { pattern: /:\)/g, emoji: '😊' },
  { pattern: /:-\)/g, emoji: '😊' },
  { pattern: /:D/g, emoji: '😃' },
  { pattern: /:-D/g, emoji: '😃' },
  { pattern: /:\(/g, emoji: '😢' },
  { pattern: /:-\(/g, emoji: '😢' },
  { pattern: /;\)/g, emoji: '😉' },
  { pattern: /;-\)/g, emoji: '😉' },
  { pattern: /:P/g, emoji: '😛' },
  { pattern: /:-P/g, emoji: '😛' },
  { pattern: /:o/gi, emoji: '😲' },
  { pattern: /:-o/gi, emoji: '😲' },
  { pattern: /<3/g, emoji: '❤️' },
  { pattern: /\|:\(/g, emoji: '😐' },
  { pattern: />:\(/g, emoji: '😠' },
  { pattern: /:'\(/g, emoji: '😢' },
  { pattern: /XD/gi, emoji: '😂' },
  { pattern: /O_O/g, emoji: '😳' },
  { pattern: /-_-/g, emoji: '😑' },
];

export default animatedEmojis;
