import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import WhatsProLogo from '@/components/ui/whatspro-logo';
import { 
  RefreshCw, 
  Play, 
  Pause, 
  Download, 
  Copy, 
  Check,
  Palette,
  Zap,
  Star,
  Heart
} from 'lucide-react';

const LogoShowcase: React.FC = () => {
  const [isAnimated, setIsAnimated] = useState(true);
  const [logoKey, setLogoKey] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [showSuccess, setShowSuccess] = useState(false);

  const restartAnimation = () => {
    setLogoKey(prev => prev + 1);
  };

  const toggleAnimation = () => {
    setIsAnimated(!isAnimated);
  };

  const copyCode = () => {
    const code = `import WhatsProLogo from '@/components/ui/whatspro-logo';

<WhatsProLogo 
  size={120} 
  animated={true}
  className="my-custom-class"
/>`;
    navigator.clipboard.writeText(code);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const themes = [
    { id: 'default', name: 'Default', bg: 'bg-white' },
    { id: 'dark', name: 'Dark', bg: 'bg-gray-900' },
    { id: 'gradient', name: 'Gradient', bg: 'bg-gradient-to-br from-purple-500 to-pink-500' },
    { id: 'blue', name: 'Blue', bg: 'bg-gradient-to-br from-blue-400 to-blue-600' },
    { id: 'green', name: 'Green', bg: 'bg-gradient-to-br from-green-400 to-green-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="mb-8">
            <WhatsProLogo 
              key={logoKey}
              size={200} 
              animated={isAnimated}
              className="mx-auto"
            />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            WhatsPro Logo
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Professional animated logo for modern messaging applications. 
            Built with SVG animations and smooth transitions.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Zap className="h-4 w-4 mr-2" />
              Animated
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Palette className="h-4 w-4 mr-2" />
              Customizable
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Star className="h-4 w-4 mr-2" />
              Professional
            </Badge>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              onClick={restartAnimation}
              size="lg"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Restart Animation
            </Button>
            
            <Button 
              onClick={toggleAnimation}
              size="lg"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              {isAnimated ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
              {isAnimated ? 'Pause' : 'Play'}
            </Button>
            
            <Button 
              onClick={copyCode}
              size="lg"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              {showSuccess ? <Check className="h-5 w-5 mr-2" /> : <Copy className="h-5 w-5 mr-2" />}
              {showSuccess ? 'Copied!' : 'Copy Code'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Size Variations */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Size Variations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[60, 90, 120, 150].map((size) => (
                <div key={size} className="text-center">
                  <div className="bg-white rounded-2xl p-6 shadow-lg mb-4 flex items-center justify-center" style={{ height: '200px' }}>
                    <WhatsProLogo size={size} animated={isAnimated} />
                  </div>
                  <p className="text-lg font-semibold text-gray-700">{size}px</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Theme Variations */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Theme Variations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {themes.map((theme) => (
                <div key={theme.id} className="text-center">
                  <div 
                    className={`${theme.bg} rounded-2xl p-8 shadow-lg mb-4 flex items-center justify-center cursor-pointer transition-transform hover:scale-105`}
                    style={{ height: '200px' }}
                    onClick={() => setSelectedTheme(theme.id)}
                  >
                    <WhatsProLogo size={100} animated={isAnimated} />
                  </div>
                  <p className="text-lg font-semibold text-gray-700">{theme.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Animation Timeline */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Animation Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Animation Sequence</h3>
                <div className="space-y-3">
                  {[
                    { time: '0.5s', desc: 'Background circle with pulse effect', color: 'bg-blue-500' },
                    { time: '1.5s', desc: 'Chat bubble draws in with glow', color: 'bg-green-500' },
                    { time: '1.5-2.1s', desc: 'Message lines appear sequentially', color: 'bg-yellow-500' },
                    { time: '2.5s', desc: 'Pro badge draws with golden glow', color: 'bg-purple-500' },
                    { time: '3.2s', desc: 'Notification dots with pulse', color: 'bg-red-500' },
                    { time: '3.5s', desc: 'Connection lines with flow effect', color: 'bg-indigo-500' },
                    { time: '4s', desc: 'Logo text with underline growth', color: 'bg-pink-500' }
                  ].map((step, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-4 h-4 ${step.color} rounded-full flex-shrink-0`}></div>
                      <span className="font-medium text-gray-600">{step.time}</span>
                      <span className="text-gray-700">{step.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4">Technical Features</h3>
                <div className="space-y-3">
                  {[
                    'SVG path drawing with stroke-dasharray',
                    'Smooth gradient transitions',
                    'Hover effects and micro-interactions',
                    'Responsive design for all screen sizes',
                    'Dark mode support',
                    'Professional WhatsApp-inspired styling',
                    'Customizable size and animations',
                    'Optimized performance with CSS animations',
                    'Accessibility-friendly with reduced motion support'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Example */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-center">Usage Example</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 rounded-lg p-6 text-green-400 font-mono text-sm overflow-x-auto">
              <pre>{`import WhatsProLogo from '@/components/ui/whatspro-logo';

// Basic usage
<WhatsProLogo size={120} animated={true} />

// With custom styling
<WhatsProLogo 
  size={150} 
  animated={true}
  className="my-custom-class"
/>

// Different sizes
<WhatsProLogo size={60} />   // Small
<WhatsProLogo size={90} />   // Medium  
<WhatsProLogo size={120} />  // Large
<WhatsProLogo size={200} />  // Extra Large`}</pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LogoShowcase;
