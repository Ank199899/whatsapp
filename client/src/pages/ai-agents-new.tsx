import React from 'react';
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AdvancedAIDashboard from '@/components/ai-agent/advanced-ai-dashboard';

export default function AIAgents() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <AdvancedAIDashboard />
        </main>
      </div>
    </div>
  );
}
