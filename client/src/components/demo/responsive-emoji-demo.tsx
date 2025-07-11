import React, { useState } from 'react';
import { ResponsiveLayoutProvider, ResponsiveText, ResponsiveSpacing } from '@/components/layout/responsive-layout-provider';
import { AnimatedEmoji, EmojiProcessor, EmojiPicker } from '@/components/ui/animated-emoji';
import { AnimatedMessage, TypingIndicator, AnimatedChatInput } from '@/components/ui/animated-chat-components';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ResponsiveEmojiDemo() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! :)', direction: 'incoming' as const },
    { id: 2, text: 'How are you doing today? :D', direction: 'outgoing' as const },
    { id: 3, text: 'I am great! Thanks for asking <3', direction: 'incoming' as const },
    { id: 4, text: 'That is awesome! :) Let me know if you need anything', direction: 'outgoing' as const },
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: messages.length + 1,
      text: newMessage,
      direction: 'outgoing' as const,
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
    
    // Simulate typing response
    setShowTyping(true);
    setTimeout(() => {
      setShowTyping(false);
      const response = {
        id: messages.length + 2,
        text: getRandomResponse(),
        direction: 'incoming' as const,
      };
      setMessages(prev => [...prev, response]);
    }, 2000);
  };

  const getRandomResponse = () => {
    const responses = [
      'That sounds great! :)',
      'Awesome! :D',
      'I love that! <3',
      'Haha that is funny! lol',
      'Wow amazing! :o',
      'Thanks for sharing! :)',
      'That is so cool! fire',
      'You are the best! star',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <ResponsiveLayoutProvider className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              <ResponsiveText size="2xl" className="font-bold text-primary">
                🚀 Responsive Layout & Animated Emoji Demo
              </ResponsiveText>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveText className="text-center text-muted-foreground">
              This demo showcases auto-adjusting layouts for different zoom levels and animated emoji replacements in chat messages.
              Try zooming in/out or resizing your browser window to see the responsive features in action!
            </ResponsiveText>
          </CardContent>
        </Card>

        {/* Feature Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Animated Emojis Showcase */}
          <Card>
            <CardHeader>
              <CardTitle>
                <ResponsiveText size="lg">Animated Emojis</ResponsiveText>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveSpacing padding={4} className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <AnimatedEmoji emoji="😊" animationType="bounce" size="xl" />
                    <ResponsiveText size="xs" className="mt-2">Bounce</ResponsiveText>
                  </div>
                  <div className="text-center">
                    <AnimatedEmoji emoji="❤️" animationType="pulse" size="xl" />
                    <ResponsiveText size="xs" className="mt-2">Pulse</ResponsiveText>
                  </div>
                  <div className="text-center">
                    <AnimatedEmoji emoji="🤔" animationType="rotate" size="xl" />
                    <ResponsiveText size="xs" className="mt-2">Rotate</ResponsiveText>
                  </div>
                  <div className="text-center">
                    <AnimatedEmoji emoji="🔥" animationType="glow" size="xl" />
                    <ResponsiveText size="xs" className="mt-2">Glow</ResponsiveText>
                  </div>
                </div>
                
                <div className="mt-4">
                  <ResponsiveText size="sm" className="font-medium mb-2">
                    Text with Auto Emoji Replacement:
                  </ResponsiveText>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <EmojiProcessor
                      text="I am so happy :) This is amazing! :D I love it <3 lol"
                      enableAnimation={true}
                      emojiSize="md"
                    />
                  </div>
                </div>
              </ResponsiveSpacing>
            </CardContent>
          </Card>

          {/* Responsive Layout Info */}
          <Card>
            <CardHeader>
              <CardTitle>
                <ResponsiveText size="lg">Responsive Features</ResponsiveText>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveSpacing padding={4} className="space-y-3">
                <div className="space-y-2">
                  <ResponsiveText size="sm" className="font-medium">✨ Auto Zoom Detection</ResponsiveText>
                  <ResponsiveText size="xs" className="text-muted-foreground">
                    Layout automatically adjusts when you zoom in/out
                  </ResponsiveText>
                </div>
                
                <div className="space-y-2">
                  <ResponsiveText size="sm" className="font-medium">📱 Smart Breakpoints</ResponsiveText>
                  <ResponsiveText size="xs" className="text-muted-foreground">
                    Responsive design adapts to different screen sizes
                  </ResponsiveText>
                </div>
                
                <div className="space-y-2">
                  <ResponsiveText size="sm" className="font-medium">🎨 Dynamic Scaling</ResponsiveText>
                  <ResponsiveText size="xs" className="text-muted-foreground">
                    Text, spacing, and elements scale intelligently
                  </ResponsiveText>
                </div>
                
                <div className="space-y-2">
                  <ResponsiveText size="sm" className="font-medium">⚡ Smooth Animations</ResponsiveText>
                  <ResponsiveText size="xs" className="text-muted-foreground">
                    Animated transitions and emoji effects
                  </ResponsiveText>
                </div>
              </ResponsiveSpacing>
            </CardContent>
          </Card>
        </div>

        {/* Chat Demo */}
        <Card>
          <CardHeader>
            <CardTitle>
              <ResponsiveText size="lg">Interactive Chat Demo</ResponsiveText>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white border rounded-lg h-96 flex flex-col">
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.map((message, index) => (
                  <AnimatedMessage
                    key={message.id}
                    direction={message.direction}
                    animationType="slide"
                    delay={index * 100}
                    className={`flex ${
                      message.direction === 'outgoing' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.direction === 'outgoing'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <ResponsiveText size="sm">
                        <EmojiProcessor
                          text={message.text}
                          enableAnimation={true}
                          emojiSize="md"
                        />
                      </ResponsiveText>
                    </div>
                  </AnimatedMessage>
                ))}
                
                <TypingIndicator
                  isVisible={showTyping}
                  userName="Demo Bot"
                />
              </div>
              
              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <AnimatedChatInput
                      value={newMessage}
                      onChange={setNewMessage}
                      onSend={handleSendMessage}
                      placeholder="Type a message with emojis... :)"
                    />
                  </div>
                  <Button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    variant="outline"
                    size="sm"
                  >
                    😊
                  </Button>
                </div>
                
                {showEmojiPicker && (
                  <div className="mt-2">
                    <EmojiPicker
                      onEmojiSelect={handleEmojiSelect}
                      categories={['emotions', 'gestures', 'objects']}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>
              <ResponsiveText size="lg">Try These Features</ResponsiveText>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveSpacing padding={4}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <ResponsiveText size="sm" className="font-medium">🔍 Zoom Testing:</ResponsiveText>
                  <ResponsiveText size="xs" className="text-muted-foreground">
                    Use Ctrl/Cmd + Plus/Minus to zoom in/out and see the layout adapt
                  </ResponsiveText>
                </div>
                
                <div className="space-y-2">
                  <ResponsiveText size="sm" className="font-medium">📱 Responsive Testing:</ResponsiveText>
                  <ResponsiveText size="xs" className="text-muted-foreground">
                    Resize your browser window to see mobile/tablet/desktop layouts
                  </ResponsiveText>
                </div>
                
                <div className="space-y-2">
                  <ResponsiveText size="sm" className="font-medium">😊 Emoji Testing:</ResponsiveText>
                  <ResponsiveText size="xs" className="text-muted-foreground">
                    Type :) :D <3 lol and other emoticons in the chat
                  </ResponsiveText>
                </div>
                
                <div className="space-y-2">
                  <ResponsiveText size="sm" className="font-medium">🎨 Animation Testing:</ResponsiveText>
                  <ResponsiveText size="xs" className="text-muted-foreground">
                    Click on emojis and watch the smooth animations
                  </ResponsiveText>
                </div>
              </div>
            </ResponsiveSpacing>
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayoutProvider>
  );
}
