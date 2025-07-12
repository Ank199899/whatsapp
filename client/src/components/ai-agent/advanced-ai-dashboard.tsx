import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Bot,
  Brain,
  Settings,
  Zap,
  TrendingUp,
  Users,
  MessageSquare,
  Database,
  Cpu,
  Network,
  Activity,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Target,
  Sparkles,
  Globe,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";

// Import sub-components
import AIAgentCreator from './ai-agent-creator';
import AITrainingCenter from './ai-training-center';
import AIProviderManager from './ai-provider-manager';
import AIAnalytics from './ai-analytics';
import AIConversationMonitor from './ai-conversation-monitor';
import AIKnowledgeBase from './ai-knowledge-base';

interface AIAgent {
  id: string;
  name: string;
  description: string;
  type: 'sales' | 'support' | 'marketing' | 'custom';
  provider: string;
  model: string;
  status: 'active' | 'inactive' | 'training' | 'error';
  performance: {
    totalInteractions: number;
    successRate: number;
    avgResponseTime: number;
    customerSatisfaction: number;
  };
  training: {
    dataPoints: number;
    lastTrained: string;
    accuracy: number;
  };
  settings: {
    temperature: number;
    maxTokens: number;
    autoReply: boolean;
    businessHours: boolean;
    languages: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface AIProvider {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  models: string[];
  usage: {
    requests: number;
    tokens: number;
    cost: number;
  };
  rateLimit: {
    current: number;
    limit: number;
    resetTime: string;
  };
}

export default function AdvancedAIDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch AI agents with real-time updates
  const { data: agents = [], isLoading: agentsLoading, refetch: refetchAgents } = useQuery({
    queryKey: ['/api/ai/agents'],
    queryFn: () => apiRequest('GET', '/api/ai/agents'),
    refetchInterval: 5000, // Real-time updates every 5 seconds
    refetchIntervalInBackground: true,
  });

  // Fetch AI providers
  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ['/api/ai/providers'],
    queryFn: () => apiRequest('GET', '/api/ai/providers'),
    refetchInterval: 10000,
  });

  // Fetch AI analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/ai/analytics'],
    queryFn: () => apiRequest('GET', '/api/ai/analytics'),
    refetchInterval: 30000,
  });

  // Real-time sync mutation
  const syncMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/ai/sync'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/analytics'] });
      toast({
        title: "AI Data Synced",
        description: "All AI agent data has been synchronized",
      });
    },
  });

  // Toggle agent status
  const toggleAgentMutation = useMutation({
    mutationFn: (data: { agentId: string; status: string }) => 
      apiRequest('PATCH', `/api/ai/agents/${data.agentId}/status`, { status: data.status }),
    onSuccess: () => {
      refetchAgents();
      toast({
        title: "Agent Status Updated",
        description: "AI agent status has been changed successfully",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive': return <Pause className="h-4 w-4 text-gray-500" />;
      case 'training': return <Brain className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getProviderStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Agent Control Center</h1>
          <p className="text-muted-foreground">Advanced AI management with real-time sync</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Activity className="h-4 w-4" />
            <span>{syncMutation.isPending ? 'Syncing...' : 'Sync All'}</span>
          </Button>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Agent</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{agents.length}</p>
                <p className="text-sm text-muted-foreground">Active Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{analytics?.totalInteractions || 0}</p>
                <p className="text-sm text-muted-foreground">Total Interactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{analytics?.avgSuccessRate || 0}%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{analytics?.avgResponseTime || 0}s</p>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* AI Agents Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="h-5 w-5" />
                  <span>Active AI Agents</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.slice(0, 5).map((agent: AIAgent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(agent.status)}
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-muted-foreground">{agent.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{agent.provider}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAgentMutation.mutate({
                            agentId: agent.id,
                            status: agent.status === 'active' ? 'inactive' : 'active'
                          })}
                        >
                          {agent.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Network className="h-5 w-5" />
                  <span>AI Providers Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {providers.map((provider: AIProvider) => (
                    <div key={provider.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getProviderStatusColor(provider.status)}`} />
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          <p className="text-sm text-muted-foreground">{provider.models.length} models</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{provider.usage.requests} requests</p>
                        <p className="text-xs text-muted-foreground">${provider.usage.cost.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <AIAgentCreator />
        </TabsContent>

        <TabsContent value="training">
          <AITrainingCenter />
        </TabsContent>

        <TabsContent value="providers">
          <AIProviderManager />
        </TabsContent>

        <TabsContent value="analytics">
          <AIAnalytics />
        </TabsContent>

        <TabsContent value="knowledge">
          <AIKnowledgeBase />
        </TabsContent>
      </Tabs>
    </div>
  );
}
