import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import useComprehensiveRealTimeSync from "@/hooks/useComprehensiveRealTimeSync";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatsCard from "@/components/dashboard/stats-card";
import CampaignChart from "@/components/dashboard/campaign-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuickActionFAB } from "@/components/ui/floating-action-button";
import { Send, CheckCircle, Eye, MessageCircle, Play, Clock, Check, Users, FileText } from "lucide-react";
import { AnimatedEmojiWidget } from "@/components/ui/animated-emoji-widget";

export default function Dashboard() {
  const { toast } = useToast();

  // Initialize comprehensive real-time sync for dashboard
  const { refreshQuery, refreshAllData, isConnected } = useComprehensiveRealTimeSync();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/campaigns"],
    retry: false,
  });

  const recentCampaigns = campaigns?.slice(0, 3) || [];

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Dashboard"
          subtitle="Welcome back! Here's your marketing overview"
          primaryAction={{
            label: "",
            component: <AnimatedEmojiWidget />
          }}
        />
        <main className="flex-1 overflow-auto p-6 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <StatsCard
                title="Total Sent"
                value={stats?.totalSent || 0}
                icon={Send}
                color="blue"
                trend={{ value: 12, label: "vs last month" }}
                loading={statsLoading}
              />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
              <StatsCard
                title="Delivered"
                value={stats?.totalDelivered || 0}
                icon={CheckCircle}
                color="lightBlue"
                trend={{ value: Math.round(((stats?.totalDelivered || 0) / (stats?.totalSent || 1)) * 100), label: "success rate", suffix: "%" }}
                loading={statsLoading}
              />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
              <StatsCard
                title="Read Rate"
                value={stats?.readRate || 0}
                suffix="%"
                icon={Eye}
                color="darkBlue"
                trend={{ value: 5, label: "improvement" }}
                loading={statsLoading}
              />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
              <StatsCard
                title="Active Numbers"
                value={stats?.activeNumbers || 0}
                icon={MessageCircle}
                color="primary"
                trend={{ label: "All healthy" }}
                loading={statsLoading}
              />
            </div>
          </div>

          {/* Charts and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
            {/* Campaign Performance Chart */}
            <div className="lg:col-span-2">
              <div className="card-modern hover-lift">
                <CampaignChart />
              </div>
            </div>

            {/* Recent Campaigns */}
            <Card className="card-modern hover-lift">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gradient flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3 animate-pulse"></div>
                  Recent Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaignsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-muted rounded-lg mb-2"></div>
                          <div className="h-3 bg-muted/60 rounded-lg w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  ) : recentCampaigns.length > 0 ? (
                    recentCampaigns.map((campaign: any, index: number) => (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/30 to-accent/10 rounded-xl border border-border/30 hover:shadow-md transition-all duration-300 hover:scale-105 animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground mb-1">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(campaign.createdAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <Badge
                          variant={
                            campaign.status === 'active' ? 'default' :
                            campaign.status === 'completed' ? 'secondary' :
                            campaign.status === 'scheduled' ? 'outline' : 'destructive'
                          }
                          className="ml-3 font-medium"
                        >
                          {campaign.status === 'active' && <Play className="w-3 h-3 mr-1" />}
                          {campaign.status === 'completed' && <Check className="w-3 h-3 mr-1" />}
                          {campaign.status === 'scheduled' && <Clock className="w-3 h-3 mr-1" />}
                          {campaign.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-blue-600">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                      <p>No campaigns yet</p>
                      <p className="text-sm">Create your first campaign to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Quick Action FAB */}
        <QuickActionFAB
          actions={[
            {
              icon: Send,
              label: "New Campaign",
              onClick: () => window.location.href = "/campaigns",
              variant: "primary"
            },
            {
              icon: Users,
              label: "Add Contact",
              onClick: () => window.location.href = "/contacts/add",
              variant: "success"
            },
            {
              icon: MessageCircle,
              label: "Inbox",
              onClick: () => window.location.href = "/inbox",
              variant: "secondary"
            },
            {
              icon: FileText,
              label: "Templates",
              onClick: () => window.location.href = "/templates",
              variant: "warning"
            }
          ]}
        />
      </div>
    </div>
  );
}
