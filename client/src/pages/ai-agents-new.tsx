import React from 'react';
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIAgentDashboard from '@/components/ai-agent/ai-agent-dashboard';

export default function AIAgents() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <AIAgentDashboard />
        </main>
      </div>
    </div>
  );
}
