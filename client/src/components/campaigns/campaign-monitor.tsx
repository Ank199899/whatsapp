import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Shield, 
  Phone, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
  Square
} from 'lucide-react';

interface CampaignMonitorProps {
  campaignId: number;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
}

interface NumberHealth {
  phoneNumber: string;
  status: 'healthy' | 'warning' | 'critical' | 'suspended';
  successRate: number;
  messagesLastHour: number;
  consecutiveFailures: number;
  lastUsed: string;
}

interface CampaignStats {
  totalContacts: number;
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  messagesRead: number;
  currentRate: number; // messages per hour
  estimatedCompletion: string;
  globalFailureRate: number;
  adaptiveDelayMultiplier: number;
}

export function CampaignMonitor({ campaignId, onPause, onResume, onStop }: CampaignMonitorProps) {
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [numberHealth, setNumberHealth] = useState<NumberHealth[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Set up real-time monitoring
    const interval = setInterval(() => {
      fetchCampaignStats();
      fetchNumberHealth();
    }, 5000); // Update every 5 seconds

    fetchCampaignStats();
    fetchNumberHealth();

    return () => clearInterval(interval);
  }, [campaignId]);

  const fetchCampaignStats = async () => {
    try {
      // In a real implementation, this would fetch from your API
      // For now, we'll simulate the data
      const mockStats: CampaignStats = {
        totalContacts: 50000,
        messagesSent: 12500,
        messagesDelivered: 11800,
        messagesFailed: 350,
        messagesRead: 8900,
        currentRate: 450, // messages per hour
        estimatedCompletion: '2 hours 15 minutes',
        globalFailureRate: 0.028, // 2.8%
        adaptiveDelayMultiplier: 1.2
      };
      
      setStats(mockStats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching campaign stats:', error);
    }
  };

  const fetchNumberHealth = async () => {
    try {
      // Mock number health data
      const mockHealth: NumberHealth[] = [
        {
          phoneNumber: '+91 98765 43210',
          status: 'healthy',
          successRate: 0.96,
          messagesLastHour: 45,
          consecutiveFailures: 0,
          lastUsed: '2 minutes ago'
        },
        {
          phoneNumber: '+91 87654 32109',
          status: 'warning',
          successRate: 0.82,
          messagesLastHour: 38,
          consecutiveFailures: 2,
          lastUsed: '5 minutes ago'
        },
        {
          phoneNumber: '+91 76543 21098',
          status: 'healthy',
          successRate: 0.94,
          messagesLastHour: 42,
          consecutiveFailures: 0,
          lastUsed: '1 minute ago'
        },
        {
          phoneNumber: '+91 65432 10987',
          status: 'critical',
          successRate: 0.65,
          messagesLastHour: 15,
          consecutiveFailures: 8,
          lastUsed: '15 minutes ago'
        }
      ];
      
      setNumberHealth(mockHealth);
    } catch (error) {
      console.error('Error fetching number health:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      case 'suspended': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'suspended': return <Pause className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading campaign monitor...</span>
      </div>
    );
  }

  const progressPercentage = (stats.messagesSent / stats.totalContacts) * 100;
  const successRate = ((stats.messagesDelivered + stats.messagesRead) / stats.messagesSent) * 100;

  return (
    <div className="space-y-6">
      {/* Campaign Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Campaign Progress
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onPause}>
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
            <Button size="sm" variant="outline" onClick={onResume}>
              <Play className="w-4 h-4 mr-1" />
              Resume
            </Button>
            <Button size="sm" variant="destructive" onClick={onStop}>
              <Square className="w-4 h-4 mr-1" />
              Stop
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress: {stats.messagesSent.toLocaleString()} / {stats.totalContacts.toLocaleString()}</span>
                <span>{progressPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.messagesSent.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Sent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.messagesDelivered.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Delivered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.messagesRead.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Read</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.messagesFailed.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-semibold">{stats.currentRate}/hr</div>
                <div className="text-sm text-gray-600">Current Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{successRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{stats.estimatedCompletion}</div>
                <div className="text-sm text-gray-600">ETA</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anti-Blocking Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Anti-Blocking Protection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Global Failure Rate</span>
                <Badge variant={stats.globalFailureRate > 0.1 ? "destructive" : "secondary"}>
                  {(stats.globalFailureRate * 100).toFixed(1)}%
                </Badge>
              </div>
              <Progress 
                value={stats.globalFailureRate * 100} 
                className="h-2"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Adaptive Delay Multiplier</span>
                <Badge variant={stats.adaptiveDelayMultiplier > 2 ? "destructive" : "secondary"}>
                  {stats.adaptiveDelayMultiplier.toFixed(1)}x
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {stats.adaptiveDelayMultiplier > 1.5 ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                )}
                <span className="text-sm text-gray-600">
                  {stats.adaptiveDelayMultiplier > 1.5 ? 'Increasing delays' : 'Optimized timing'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Number Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            WhatsApp Numbers Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {numberHealth.map((number, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(number.status)}
                  <div>
                    <div className="font-medium">{number.phoneNumber}</div>
                    <div className="text-sm text-gray-600">
                      Last used: {number.lastUsed}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm font-medium">{(number.successRate * 100).toFixed(1)}%</div>
                    <div className="text-xs text-gray-600">Success</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{number.messagesLastHour}</div>
                    <div className="text-xs text-gray-600">Msgs/hr</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{number.consecutiveFailures}</div>
                    <div className="text-xs text-gray-600">Failures</div>
                  </div>
                  <Badge variant={number.status === 'healthy' ? 'default' : 'destructive'}>
                    {number.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Last Update */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  );
}
