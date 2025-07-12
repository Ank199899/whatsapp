import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Clock,
  Target,
  DollarSign,
  Zap,
  Brain,
  Activity,
  Calendar,
  Download,
  RefreshCw
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalInteractions: number;
    totalAgents: number;
    avgResponseTime: number;
    successRate: number;
    totalCost: number;
    activeUsers: number;
  };
  trends: {
    interactions: Array<{ date: string; count: number }>;
    responseTime: Array<{ date: string; time: number }>;
    successRate: Array<{ date: string; rate: number }>;
    cost: Array<{ date: string; amount: number }>;
  };
  agentPerformance: Array<{
    id: string;
    name: string;
    interactions: number;
    successRate: number;
    avgResponseTime: number;
    cost: number;
    satisfaction: number;
  }>;
  providerStats: Array<{
    provider: string;
    requests: number;
    cost: number;
    avgResponseTime: number;
    errorRate: number;
  }>;
  topQueries: Array<{
    query: string;
    count: number;
    successRate: number;
  }>;
  userSatisfaction: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
}

export default function AIAnalytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('interactions');

  // Fetch analytics data
  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['/api/ai/analytics', timeRange],
    queryFn: () => apiRequest('GET', `/api/ai/analytics?range=${timeRange}`),
    refetchInterval: 30000,
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights into AI agent performance</p>
        </div>
        <div className="flex space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Interactions</p>
                <p className="text-2xl font-bold">{formatNumber(analytics?.overview.totalInteractions || 0)}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              {getChangeIcon(12)}
              <span className={`ml-1 ${getChangeColor(12)}`}>+12% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold">{analytics?.overview.totalAgents || 0}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              {getChangeIcon(5)}
              <span className={`ml-1 ${getChangeColor(5)}`}>+5% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{analytics?.overview.avgResponseTime || 0}ms</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              {getChangeIcon(-8)}
              <span className={`ml-1 ${getChangeColor(-8)}`}>-8% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{analytics?.overview.successRate || 0}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              {getChangeIcon(3)}
              <span className={`ml-1 ${getChangeColor(3)}`}>+3% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics?.overview.totalCost || 0)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              {getChangeIcon(15)}
              <span className={`ml-1 ${getChangeColor(15)}`}>+15% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{formatNumber(analytics?.overview.activeUsers || 0)}</p>
              </div>
              <Users className="h-8 w-8 text-indigo-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              {getChangeIcon(7)}
              <span className={`ml-1 ${getChangeColor(7)}`}>+7% from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactions Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Interaction Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/10">
              <p className="text-muted-foreground">Chart visualization would go here</p>
            </div>
          </CardContent>
        </Card>

        {/* Response Time Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Response Time Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/10">
              <p className="text-muted-foreground">Chart visualization would go here</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Agent Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.agentPerformance?.map((agent, index) => (
              <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(agent.interactions)} interactions
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="font-medium">{agent.successRate}%</p>
                    <p className="text-muted-foreground">Success</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{agent.avgResponseTime}ms</p>
                    <p className="text-muted-foreground">Response</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{formatCurrency(agent.cost)}</p>
                    <p className="text-muted-foreground">Cost</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{agent.satisfaction}/5</p>
                    <p className="text-muted-foreground">Rating</p>
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-lg font-medium">No agent data available</p>
                <p className="text-muted-foreground">Agent performance data will appear here once you have active agents</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Provider Statistics & Top Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Provider Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.providerStats?.map((provider) => (
                <div key={provider.provider} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{provider.provider}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(provider.requests)} requests
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="text-center">
                      <p className="font-medium">{formatCurrency(provider.cost)}</p>
                      <p className="text-muted-foreground">Cost</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{provider.avgResponseTime}ms</p>
                      <p className="text-muted-foreground">Avg Time</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{provider.errorRate}%</p>
                      <p className="text-muted-foreground">Error Rate</p>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No provider data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Top Queries</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.topQueries?.map((query, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium truncate">{query.query}</p>
                    <p className="text-sm text-muted-foreground">
                      {query.count} times • {query.successRate}% success
                    </p>
                  </div>
                  <Badge variant="secondary">{index + 1}</Badge>
                </div>
              )) || (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No query data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Satisfaction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>User Satisfaction</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-500">
                {analytics?.userSatisfaction?.excellent || 0}%
              </div>
              <p className="text-sm text-muted-foreground">Excellent</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-500">
                {analytics?.userSatisfaction?.good || 0}%
              </div>
              <p className="text-sm text-muted-foreground">Good</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-500">
                {analytics?.userSatisfaction?.average || 0}%
              </div>
              <p className="text-sm text-muted-foreground">Average</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-500">
                {analytics?.userSatisfaction?.poor || 0}%
              </div>
              <p className="text-sm text-muted-foreground">Poor</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
