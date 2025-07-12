import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import WhatsProLogo from "@/components/ui/whatspro-logo";
import { 
  MessageCircle, 
  Users, 
  BarChart, 
  Shield, 
  Zap, 
  Globe,
  Send,
  Bot,
  Clock,
  Target,
  CheckCircle,
  Star,
  ArrowRight,
  Play,
  Smartphone,
  TrendingUp,
  Lock
} from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/login";
  };

  const handleSignup = () => {
    window.location.href = "/signup";
  };

  const features = [
    {
      icon: Send,
      title: "Bulk WhatsApp Messaging",
      description: "Send thousands of personalized messages with smart delivery and anti-block protection",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Bot,
      title: "AI Auto-Reply",
      description: "Intelligent responses powered by GPT that handle customer queries automatically",
      color: "bg-blue-200 text-blue-700"
    },
    {
      icon: Users,
      title: "Contact Management",
      description: "Import, organize and segment your contacts with smart tagging and filtering",
      color: "bg-blue-300 text-blue-800"
    },
    {
      icon: BarChart,
      title: "Advanced Analytics",
      description: "Track delivery rates, open rates, and conversion metrics with real-time insights",
      color: "bg-blue-400 text-white"
    },
    {
      icon: Clock,
      title: "Smart Scheduling",
      description: "Schedule campaigns for optimal delivery times with timezone intelligence",
      color: "bg-blue-500 text-white"
    },
    {
      icon: Shield,
      title: "Anti-Block Protection",
      description: "Advanced algorithms prevent account blocks with human-like sending patterns",
      color: "bg-blue-600 text-white"
    }
  ];

  const stats = [
    { number: "50M+", label: "Messages Delivered" },
    { number: "10K+", label: "Active Businesses" },
    { number: "99.9%", label: "Uptime Guarantee" },
    { number: "24/7", label: "Support Available" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-blue-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  SendWo Pro
                </h1>
                <p className="text-xs text-blue-600">WhatsApp Marketing Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-blue-600 hover:text-blue-800">
                Features
              </Button>
              <Button variant="ghost" className="text-blue-600 hover:text-blue-800">
                Pricing
              </Button>
              <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <Badge className="mb-6 bg-green-100 text-green-700 hover:bg-green-100">
                <Star className="w-3 h-3 mr-1" />
                #1 WhatsApp Marketing Platform
              </Badge>
              <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Scale Your Business with 
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> WhatsApp Marketing</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Send bulk messages, automate responses, and grow your customer base with our advanced WhatsApp Business solution. Trusted by 10,000+ businesses worldwide.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  onClick={handleSignup}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>
                <Button
                  onClick={handleLogin}
                  variant="outline"
                  size="lg"
                  className="border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 text-lg transition-all"
                >
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  No Setup Fees
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Cancel Anytime
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  24/7 Support
                </div>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl p-12 shadow-2xl">
                <div className="bg-white rounded-xl p-8 flex flex-col items-center space-y-6">
                  <WhatsProLogo size={200} animated={true} />
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">WhatsPro Platform</h3>
                    <p className="text-gray-600">Professional WhatsApp Marketing Solution</p>
                  </div>
                  
                  <Button
                    onClick={() => window.location.href = '/logo-showcase'}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    View Logo Showcase
                  </Button>
                </div>
              </div>
              
              {/* Floating cards */}
              <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-4 border">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Live Campaign</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-4 border">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Anti-Block Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Everything You Need for WhatsApp Marketing
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive WhatsApp Business tools to grow your customer base, automate conversations, and increase sales with enterprise-grade reliability.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardHeader>
                  <div className={`p-4 rounded-xl w-fit ${feature.color} group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Start Marketing in 3 Simple Steps
            </h3>
            <p className="text-xl text-gray-600">
              Get up and running with WhatsApp marketing in minutes, not hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Connect WhatsApp</h4>
              <p className="text-gray-600">
                Scan QR code to connect your WhatsApp number securely to our platform
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Import Contacts</h4>
              <p className="text-gray-600">
                Upload your contact list or add contacts manually with smart organization
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Send Messages</h4>
              <p className="text-gray-600">
                Create campaigns, schedule messages, and track performance in real-time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h3 className="text-3xl font-bold mb-6">
            Ready to Scale Your WhatsApp Marketing?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses using WhatsApp Pro to grow their customer base and increase sales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleSignup}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3"
            >
              Get Started Now
            </Button>
            <Button
              onClick={handleLogin}
              variant="outline"
              size="lg"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">WhatsApp Pro</span>
          </div>
          <p className="text-gray-400">
            © 2024 WhatsApp Pro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
