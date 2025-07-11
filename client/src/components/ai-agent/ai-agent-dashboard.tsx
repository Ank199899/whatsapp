import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  MessageSquare, 
  Users, 
  Activity, 
  Settings,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useSocketEvent } from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';

interface AIConversation {
  id: number;
  contact_name: string;
  contact_phone: string;
  ai_enabled: boolean;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  ai_response_count: number;
  ai_last_response: string;
}

interface AIStats {
  total_conversations: number;
  ai_enabled_conversations: number;
  total_ai_responses: number;
  avg_response_time: number;
  success_rate: number;
}

export default function AIAgentDashboard() {
  const [globalAIEnabled, setGlobalAIEnabled] = useState(true);
  const { toast } = useToast();

  // Fetch AI-enabled conversations with real-time updates
  const { data: aiConversations = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/ai/conversations'],
    queryFn: async () => {
      try {
        const data = await apiRequest('GET', '/api/conversations');
        // Filter and enhance with AI data
        return data
          .filter((conv: any) => conv.ai_enabled)
          .map((conv: any) => ({
            ...conv,
            ai_response_count: conv.ai_response_count || 0,
            ai_last_response: conv.ai_last_response || 'No AI responses yet'
          }));
      } catch (error) {
        console.error('Failed to load AI conversations:', error);
        return [];
      }
    },
    refetchInterval: 3000, // Real-time updates every 3 seconds
    refetchIntervalInBackground: true,
  });

  // Fetch AI statistics
  const { data: aiStats } = useQuery({
    queryKey: ['/api/ai/stats'],
    queryFn: async () => {
      try {
        // For now, calculate from conversations data
        const allConversations = await apiRequest('GET', '/api/conversations');
        const aiEnabled = allConversations.filter((conv: any) => conv.ai_enabled);
        
        return {
          total_conversations: allConversations.length,
          ai_enabled_conversations: aiEnabled.length,
          total_ai_responses: aiEnabled.reduce((sum: number, conv: any) => sum + (conv.ai_response_count || 0), 0),
          avg_response_time: 2.3, // Mock data for now
          success_rate: 94.5 // Mock data for now
        };
      } catch (error) {
        return {
          total_conversations: 0,
          ai_enabled_conversations: 0,
          total_ai_responses: 0,
          avg_response_time: 0,
          success_rate: 0
        };
      }
    },
    refetchInterval: 5000,
  });

  // Real-time socket events
  useSocketEvent('new_message', () => {
    refetch();
  });

  useSocketEvent('ai_response_sent', () => {
    refetch();
    toast({
      title: "AI Response Sent",
      description: "AI agent has responded to a message",
    });
  });

  const getInitials = (name: string) => {
    if (!name) return 'AI';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Agent Dashboard</h1>
          <p className="text-gray-600">Monitor and manage your AI-powered conversations</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Global AI</span>
            <Switch
              checked={globalAIEnabled}
              onCheckedChange={setGlobalAIEnabled}
            />
          </div>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStats?.total_conversations || 0}</div>
            <p className="text-xs text-muted-foreground">
              {aiStats?.ai_enabled_conversations || 0} AI-enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Responses</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStats?.total_ai_responses || 0}</div>
            <p className="text-xs text-muted-foreground">
              Automated responses sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStats?.avg_response_time || 0}s</div>
            <p className="text-xs text-muted-foreground">
              Average AI response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStats?.success_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Successful AI interactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Conversations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Active AI Conversations</span>
            <Badge variant="secondary">{aiConversations.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {isLoading ? (
              <div className="text-center text-gray-500 py-8">Loading AI conversations...</div>
            ) : aiConversations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No AI-enabled conversations yet</p>
                <p className="text-sm">Enable AI for conversations to see them here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {aiConversations.map((conversation: AIConversation) => (
                  <div key={conversation.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/api/placeholder/40/40" />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {getInitials(conversation.contact_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {conversation.contact_name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            <Bot className="h-3 w-3 mr-1" />
                            AI Active
                          </Badge>
                          {conversation.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conversation.last_message || 'No messages yet'}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          Last activity: {conversation.last_message_at ? formatTime(conversation.last_message_at) : 'Never'}
                        </span>
                        <span className="text-xs text-blue-600">
                          {conversation.ai_response_count} AI responses
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
