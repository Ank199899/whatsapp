import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WhatsProLogo from '@/components/ui/whatspro-logo';
import { RefreshCw, Play, Pause } from 'lucide-react';

const LogoDemo: React.FC = () => {
  const [isAnimated, setIsAnimated] = useState(true);
  const [logoKey, setLogoKey] = useState(0);

  const restartAnimation = () => {
    setLogoKey(prev => prev + 1);
  };

  const toggleAnimation = () => {
    setIsAnimated(!isAnimated);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            WhatsPro Animated Logo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A modern, professional WhatsApp-style logo with smooth SVG animations. 
            Perfect for business messaging applications.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Main Logo Display */}
          <Card className="p-8">
            <CardHeader>
              <CardTitle className="text-center">Main Logo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <WhatsProLogo 
                  key={logoKey}
                  size={150} 
                  animated={isAnimated}
                />
              </div>
              
              <div className="flex space-x-4">
                <Button 
                  onClick={restartAnimation}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Restart Animation</span>
                </Button>
                
                <Button 
                  onClick={toggleAnimation}
                  variant={isAnimated ? "default" : "secondary"}
                  className="flex items-center space-x-2"
                >
                  {isAnimated ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{isAnimated ? 'Pause' : 'Play'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Size Variations */}
          <Card className="p-8">
            <CardHeader>
              <CardTitle className="text-center">Size Variations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center space-x-6">
                <div className="text-center">
                  <WhatsProLogo size={60} animated={isAnimated} />
                  <p className="text-sm text-gray-500 mt-2">Small (60px)</p>
                </div>
                
                <div className="text-center">
                  <WhatsProLogo size={90} animated={isAnimated} />
                  <p className="text-sm text-gray-500 mt-2">Medium (90px)</p>
                </div>
                
                <div className="text-center">
                  <WhatsProLogo size={120} animated={isAnimated} />
                  <p className="text-sm text-gray-500 mt-2">Large (120px)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Background Variations */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-center">Background Variations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Light Background */}
              <div className="bg-white rounded-xl p-6 text-center shadow-md">
                <WhatsProLogo size={100} animated={isAnimated} />
                <p className="text-sm text-gray-500 mt-4">Light Background</p>
              </div>
              
              {/* Dark Background */}
              <div className="bg-gray-900 rounded-xl p-6 text-center shadow-md">
                <WhatsProLogo size={100} animated={isAnimated} />
                <p className="text-sm text-white mt-4">Dark Background</p>
              </div>
              
              {/* Gradient Background */}
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-center shadow-md">
                <WhatsProLogo size={100} animated={isAnimated} />
                <p className="text-sm text-white mt-4">Gradient Background</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Animation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Animation Sequence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Animation Timeline</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>0.5s: Background circle appears</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>1.5s: Chat bubble draws in</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      <span>1.5-2.1s: Message lines appear</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>2.5s: Pro badge draws in</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span>3.2s: Notification dots appear</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                      <span>3.5s: Connection lines draw</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                      <span>4s: Logo text appears</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-3">Features</h3>
                  <ul className="space-y-2 text-sm">
                    <li>✅ SVG path drawing animations</li>
                    <li>✅ Smooth gradient transitions</li>
                    <li>✅ Hover effects and interactions</li>
                    <li>✅ Responsive design</li>
                    <li>✅ Dark mode support</li>
                    <li>✅ Professional WhatsApp styling</li>
                    <li>✅ Customizable size and colors</li>
                    <li>✅ Optimized performance</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LogoDemo;
