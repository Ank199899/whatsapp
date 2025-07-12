import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Globe,
  Key,
  Settings,
  TrendingUp,
  DollarSign,
  Clock,
  Zap,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  BarChart3,
  Activity,
  Cpu,
  Network
} from "lucide-react";

interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'gemini' | 'cohere' | 'mistral' | 'custom';
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  apiKey: string;
  baseUrl?: string;
  models: string[];
  usage: {
    requests: number;
    tokens: number;
    cost: number;
    errors: number;
  };
  rateLimit: {
    current: number;
    limit: number;
    resetTime: string;
    remaining: number;
  };
  performance: {
    avgResponseTime: number;
    successRate: number;
    uptime: number;
  };
  settings: {
    enabled: boolean;
    priority: number;
    maxTokens: number;
    temperature: number;
    timeout: number;
  };
  createdAt: string;
  lastUsed?: string;
}

const PROVIDER_TEMPLATES = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    description: 'GPT-4, GPT-3.5 and other OpenAI models',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4-turbo'],
    color: 'bg-green-500'
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    icon: '🧠',
    description: 'Claude 3.5 Sonnet, Haiku and Opus models',
    baseUrl: 'https://api.anthropic.com',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
    color: 'bg-purple-500'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '💎',
    description: 'Gemini Pro and Flash models',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    color: 'bg-blue-500'
  },
  {
    id: 'cohere',
    name: 'Cohere',
    icon: '🔮',
    description: 'Command R+ and Command R models',
    baseUrl: 'https://api.cohere.ai/v1',
    models: ['command-r-plus', 'command-r', 'command-light'],
    color: 'bg-orange-500'
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    icon: '🌪️',
    description: 'Mistral Large and Medium models',
    baseUrl: 'https://api.mistral.ai/v1',
    models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
    color: 'bg-red-500'
  }
];

export default function AIProviderManager() {
  const [activeTab, setActiveTab] = useState('providers');
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'custom',
    apiKey: '',
    baseUrl: '',
    models: [] as string[],
    settings: {
      enabled: true,
      priority: 1,
      maxTokens: 2000,
      temperature: 0.7,
      timeout: 30000
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch AI providers
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['/api/ai/providers'],
    queryFn: () => apiRequest('GET', '/api/ai/providers'),
    refetchInterval: 10000,
  });

  // Fetch provider analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/ai/providers/analytics'],
    queryFn: () => apiRequest('GET', '/api/ai/providers/analytics'),
    refetchInterval: 30000,
  });

  // Add provider mutation
  const addProviderMutation = useMutation({
    mutationFn: (providerData: any) => apiRequest('POST', '/api/ai/providers', providerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/providers'] });
      toast({
        title: "Provider Added",
        description: "AI provider has been configured successfully",
      });
      setIsAddingProvider(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Provider",
        description: error.message || "Please check your configuration",
        variant: "destructive",
      });
    },
  });

  // Test provider mutation
  const testProviderMutation = useMutation({
    mutationFn: (providerId: string) => apiRequest('POST', `/api/ai/providers/${providerId}/test`),
    onSuccess: (_, providerId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/providers'] });
      toast({
        title: "Provider Test Successful",
        description: "Connection to AI provider is working correctly",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Provider Test Failed",
        description: error.message || "Failed to connect to AI provider",
        variant: "destructive",
      });
    },
  });

  // Toggle provider mutation
  const toggleProviderMutation = useMutation({
    mutationFn: (data: { providerId: string; enabled: boolean }) =>
      apiRequest('PATCH', `/api/ai/providers/${data.providerId}`, { enabled: data.enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/providers'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'custom',
      apiKey: '',
      baseUrl: '',
      models: [],
      settings: {
        enabled: true,
        priority: 1,
        maxTokens: 2000,
        temperature: 0.7,
        timeout: 30000
      }
    });
    setSelectedTemplate(null);
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setFormData({
      ...formData,
      name: template.name,
      type: template.id,
      baseUrl: template.baseUrl,
      models: template.models
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'testing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'testing': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI Provider Manager</h2>
          <p className="text-muted-foreground">Connect and manage AI service providers</p>
        </div>
        <Button onClick={() => setIsAddingProvider(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {/* Provider Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Globe className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{providers.length}</p>
                <p className="text-sm text-muted-foreground">Providers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {providers.filter((p: AIProvider) => p.status === 'connected').length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  ${providers.reduce((sum: number, p: AIProvider) => sum + p.usage.cost, 0).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Total Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {providers.reduce((sum: number, p: AIProvider) => sum + p.usage.requests, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          {/* Providers List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {providers.map((provider: AIProvider) => (
              <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(provider.status)}`} />
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <Badge variant="secondary">{provider.type}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(provider.status)}
                      <Switch
                        checked={provider.settings.enabled}
                        onCheckedChange={(checked) => 
                          toggleProviderMutation.mutate({ providerId: provider.id, enabled: checked })
                        }
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Usage Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Requests</p>
                      <p className="text-lg font-semibold">{provider.usage.requests.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cost</p>
                      <p className="text-lg font-semibold">${provider.usage.cost.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Rate Limit */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Rate Limit</span>
                      <span>{provider.rateLimit.remaining}/{provider.rateLimit.limit}</span>
                    </div>
                    <Progress 
                      value={(provider.rateLimit.remaining / provider.rateLimit.limit) * 100} 
                      className="h-2" 
                    />
                  </div>

                  {/* Performance */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Response Time</p>
                      <p className="font-medium">{provider.performance.avgResponseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Success Rate</p>
                      <p className="font-medium">{provider.performance.successRate}%</p>
                    </div>
                  </div>

                  {/* Models */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Available Models</p>
                    <div className="flex flex-wrap gap-1">
                      {provider.models.slice(0, 3).map((model) => (
                        <Badge key={model} variant="outline" className="text-xs">
                          {model}
                        </Badge>
                      ))}
                      {provider.models.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{provider.models.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => testProviderMutation.mutate(provider.id)}
                      disabled={testProviderMutation.isPending}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {providers.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No AI Providers</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your first AI provider to start using intelligent agents
                </p>
                <Button onClick={() => setIsAddingProvider(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Provider
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Provider Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map((provider: AIProvider) => (
                  <div key={provider.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{provider.name}</h3>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(provider.status)}`} />
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Uptime</span>
                          <span>{provider.performance.uptime}%</span>
                        </div>
                        <Progress value={provider.performance.uptime} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Requests</p>
                          <p className="font-medium">{provider.usage.requests}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Errors</p>
                          <p className="font-medium">{provider.usage.errors}</p>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <p className="text-muted-foreground">Last Used</p>
                        <p className="font-medium">
                          {provider.lastUsed ? new Date(provider.lastUsed).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Global Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Default Timeout (ms)</Label>
                    <Input type="number" defaultValue="30000" />
                  </div>
                  <div>
                    <Label>Max Retries</Label>
                    <Input type="number" defaultValue="3" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Auto-failover</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Load Balancing</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Cost Optimization</Label>
                    <Switch />
                  </div>
                </div>
                
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Provider Dialog */}
      <Dialog open={isAddingProvider} onOpenChange={setIsAddingProvider}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add AI Provider</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Provider Templates */}
            {!selectedTemplate && (
              <div>
                <Label className="text-base">Choose Provider Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {PROVIDER_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{template.icon}</span>
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div
                    className="border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedTemplate({ id: 'custom', name: 'Custom Provider' })}
                  >
                    <div className="flex items-center space-x-3">
                      <Plus className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Custom Provider</p>
                        <p className="text-sm text-muted-foreground">Configure your own API</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Configuration Form */}
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Configure {selectedTemplate.name}</h3>
                  <Button variant="outline" onClick={resetForm}>
                    Back
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Provider Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., OpenAI Production"
                    />
                  </div>
                  <div>
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      placeholder="Enter your API key"
                    />
                  </div>
                </div>
                
                {selectedTemplate.id === 'custom' && (
                  <div>
                    <Label>Base URL</Label>
                    <Input
                      value={formData.baseUrl}
                      onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                      placeholder="https://api.example.com/v1"
                    />
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setIsAddingProvider(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => addProviderMutation.mutate(formData)}
                    disabled={addProviderMutation.isPending || !formData.name || !formData.apiKey}
                  >
                    {addProviderMutation.isPending ? 'Adding...' : 'Add Provider'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
