import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Bot,
  Brain,
  Sparkles,
  Settings,
  MessageSquare,
  Users,
  Target,
  Globe,
  Shield,
  Zap,
  Plus,
  Save,
  TestTube,
  Copy,
  Trash2,
  Edit
} from "lucide-react";

interface AIAgentForm {
  name: string;
  description: string;
  type: 'sales' | 'support' | 'marketing' | 'custom';
  provider: string;
  model: string;
  personality: string;
  instructions: string;
  temperature: number;
  maxTokens: number;
  autoReply: boolean;
  businessHours: boolean;
  languages: string[];
  customApiKey?: string;
  knowledgeBase: string[];
  triggers: string[];
  responses: {
    greeting: string;
    fallback: string;
    goodbye: string;
  };
}

const AI_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4-turbo'],
    icon: '🤖'
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
    icon: '🧠'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: ['gemini-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    icon: '💎'
  },
  {
    id: 'cohere',
    name: 'Cohere',
    models: ['command-r-plus', 'command-r', 'command-light'],
    icon: '🔮'
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
    icon: '🌪️'
  }
];

const AGENT_TYPES = [
  {
    id: 'sales',
    name: 'Sales Agent',
    description: 'Focused on lead generation and conversion',
    icon: Target,
    color: 'bg-green-500'
  },
  {
    id: 'support',
    name: 'Support Agent',
    description: 'Customer service and problem resolution',
    icon: Users,
    color: 'bg-blue-500'
  },
  {
    id: 'marketing',
    name: 'Marketing Agent',
    description: 'Brand promotion and engagement',
    icon: Sparkles,
    color: 'bg-purple-500'
  },
  {
    id: 'custom',
    name: 'Custom Agent',
    description: 'Tailored for specific business needs',
    icon: Settings,
    color: 'bg-orange-500'
  }
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
  'Hindi', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian'
];

export default function AIAgentCreator() {
  const [formData, setFormData] = useState<AIAgentForm>({
    name: '',
    description: '',
    type: 'custom',
    provider: 'openai',
    model: 'gpt-4o',
    personality: '',
    instructions: '',
    temperature: 0.7,
    maxTokens: 500,
    autoReply: true,
    businessHours: false,
    languages: ['English'],
    knowledgeBase: [],
    triggers: [],
    responses: {
      greeting: 'Hello! How can I assist you today?',
      fallback: 'I apologize, but I need more information to help you properly.',
      goodbye: 'Thank you for contacting us. Have a great day!'
    }
  });

  const [isCreating, setIsCreating] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing agents
  const { data: existingAgents = [] } = useQuery({
    queryKey: ['/api/ai/agents'],
    queryFn: () => apiRequest('GET', '/api/ai/agents'),
  });

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: (agentData: AIAgentForm) => apiRequest('POST', '/api/ai/agents', agentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/agents'] });
      toast({
        title: "AI Agent Created",
        description: "Your AI agent has been created successfully and is ready to use",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Agent",
        description: error.message || "Please check your configuration and try again",
        variant: "destructive",
      });
    },
  });

  // Test agent mutation
  const testAgentMutation = useMutation({
    mutationFn: (data: { message: string; config: Partial<AIAgentForm> }) =>
      apiRequest('POST', '/api/ai/test-agent', data),
    onSuccess: (response) => {
      setTestResponse(response.message);
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test the agent",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'custom',
      provider: 'openai',
      model: 'gpt-4o',
      personality: '',
      instructions: '',
      temperature: 0.7,
      maxTokens: 500,
      autoReply: true,
      businessHours: false,
      languages: ['English'],
      knowledgeBase: [],
      triggers: [],
      responses: {
        greeting: 'Hello! How can I assist you today?',
        fallback: 'I apologize, but I need more information to help you properly.',
        goodbye: 'Thank you for contacting us. Have a great day!'
      }
    });
    setIsCreating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.instructions) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createAgentMutation.mutate(formData);
  };

  const handleTest = () => {
    if (!testMessage.trim()) {
      toast({
        title: "Test Message Required",
        description: "Please enter a test message",
        variant: "destructive",
      });
      return;
    }
    testAgentMutation.mutate({
      message: testMessage,
      config: formData
    });
  };

  const selectedProvider = AI_PROVIDERS.find(p => p.id === formData.provider);
  const selectedAgentType = AGENT_TYPES.find(t => t.id === formData.type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Create AI Agent</h2>
          <p className="text-muted-foreground">Build intelligent agents with advanced capabilities</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={resetForm}>
            Reset
          </Button>
          <Button onClick={() => setIsCreating(!isCreating)}>
            {isCreating ? 'Cancel' : 'Create New Agent'}
          </Button>
        </div>
      </div>

      {/* Existing Agents Grid */}
      {!isCreating && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {existingAgents.map((agent: any) => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      agent.status === 'active' ? 'bg-green-500' : 
                      agent.status === 'training' ? 'bg-blue-500' : 'bg-gray-500'
                    }`} />
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                  </div>
                  <Badge variant="secondary">{agent.type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{agent.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{agent.provider} • {agent.model}</span>
                  <span>{agent.performance?.totalInteractions || 0} interactions</span>
                </div>
                <div className="flex space-x-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Copy className="h-3 w-3 mr-1" />
                    Clone
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Create New Card */}
          <Card 
            className="border-dashed border-2 hover:border-primary cursor-pointer transition-colors"
            onClick={() => setIsCreating(true)}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-6">
              <Plus className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-lg font-medium">Create New Agent</p>
              <p className="text-sm text-muted-foreground text-center">
                Build a custom AI agent for your business needs
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agent Creation Form */}
      {isCreating && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="h-5 w-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Agent Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Sales Assistant Pro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Agent Type *</Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AGENT_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center space-x-2">
                              <type.icon className="h-4 w-4" />
                              <span>{type.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this agent does and its purpose"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="instructions">AI Instructions *</Label>
                  <Textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="Detailed instructions for how the AI should behave and respond"
                    rows={5}
                  />
                </div>

                <div>
                  <Label htmlFor="personality">Personality & Tone</Label>
                  <Textarea
                    id="personality"
                    value={formData.personality}
                    onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                    placeholder="Define the agent's personality, tone, and communication style"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>AI Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>AI Provider</Label>
                  <Select value={formData.provider} onValueChange={(value) => setFormData({ ...formData, provider: value, model: AI_PROVIDERS.find(p => p.id === value)?.models[0] || '' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_PROVIDERS.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          <div className="flex items-center space-x-2">
                            <span>{provider.icon}</span>
                            <span>{provider.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Model</Label>
                  <Select value={formData.model} onValueChange={(value) => setFormData({ ...formData, model: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProvider?.models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Temperature: {formData.temperature}</Label>
                  <Slider
                    value={[formData.temperature]}
                    onValueChange={(value) => setFormData({ ...formData, temperature: value[0] })}
                    max={2}
                    min={0}
                    step={0.1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Lower = more focused, Higher = more creative
                  </p>
                </div>

                <div>
                  <Label>Max Tokens: {formData.maxTokens}</Label>
                  <Slider
                    value={[formData.maxTokens]}
                    onValueChange={(value) => setFormData({ ...formData, maxTokens: value[0] })}
                    max={2000}
                    min={50}
                    step={50}
                    className="mt-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Auto Reply</Label>
                    <Switch
                      checked={formData.autoReply}
                      onCheckedChange={(checked) => setFormData({ ...formData, autoReply: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Business Hours Only</Label>
                    <Switch
                      checked={formData.businessHours}
                      onCheckedChange={(checked) => setFormData({ ...formData, businessHours: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Agent */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TestTube className="h-5 w-5" />
                <span>Test Your Agent</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testMessage">Test Message</Label>
                  <Textarea
                    id="testMessage"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Enter a message to test your agent"
                    rows={3}
                  />
                  <Button 
                    type="button" 
                    onClick={handleTest}
                    disabled={testAgentMutation.isPending}
                    className="mt-2"
                  >
                    {testAgentMutation.isPending ? 'Testing...' : 'Test Agent'}
                  </Button>
                </div>
                <div>
                  <Label>Agent Response</Label>
                  <div className="border rounded-lg p-3 min-h-[100px] bg-muted">
                    {testResponse ? (
                      <p className="text-sm">{testResponse}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Test response will appear here</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createAgentMutation.isPending}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{createAgentMutation.isPending ? 'Creating...' : 'Create Agent'}</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
