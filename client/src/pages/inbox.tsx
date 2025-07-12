import { useEffect, useState, createContext, useContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import RealtimeWhatsAppInbox from "@/components/inbox/realtime-whatsapp-inbox";
import DirectMessage from "@/components/inbox/direct-message";
import BulkMessage from "@/components/inbox/bulk-message";
import ErrorBoundary from "@/components/error-boundary";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { GlassContainer, AnimatedBackground } from "@/components/ui/modern-effects";
import { Plus, AlertCircle, Users, MessageCircle, Send } from "lucide-react";

// Create context for header visibility
const HeaderVisibilityContext = createContext<{
  isHeaderVisible: boolean;
  setHeaderVisible: (visible: boolean) => void;
}>({
  isHeaderVisible: true,
  setHeaderVisible: () => {},
});

export const useHeaderVisibility = () => useContext(HeaderVisibilityContext);
import useComprehensiveRealTimeSync from "@/hooks/useComprehensiveRealTimeSync";

export default function Inbox() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();

  // Initialize comprehensive real-time sync for inbox
  const { refreshQuery, refreshAllData, isConnected } = useComprehensiveRealTimeSync();

  const [isDirectMessageOpen, setIsDirectMessageOpen] = useState(false);
  const [isBulkMessageOpen, setIsBulkMessageOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const handleConversationSelect = (id: string) => {
    setSelectedConversationId(id);
  };

  const setHeaderVisible = (visible: boolean) => {
    setIsHeaderVisible(visible);
  };

  return (
    <ErrorBoundary fallback={
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-background via-background-secondary to-background-tertiary">
        <AnimatedBackground pattern="dots" className="absolute inset-0 opacity-30" />
        <GlassContainer className="text-center p-8 max-w-md mx-4 animate-bounce-in">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive animate-pulse" />
          <h3 className="text-xl font-semibold mb-2 text-foreground">Error loading content</h3>
          <p className="text-muted-foreground mb-4">Something went wrong. Please refresh the page.</p>
          <Button onClick={() => window.location.reload()} className="btn-modern">
            Try Again
          </Button>
        </GlassContainer>
      </div>
    }>
      <HeaderVisibilityContext.Provider value={{ isHeaderVisible, setHeaderVisible }}>
        <div className="h-screen flex bg-gradient-to-br from-background via-background-secondary to-background-tertiary">
          <Sidebar />
          <div className="flex-1 flex flex-col relative transition-all duration-500 ease-in-out">
            {/* Sliding Header */}
            <div
              className={`absolute top-0 left-0 right-0 z-50 sliding-header ${
                isHeaderVisible ? 'visible' : 'hidden'
              }`}
            >
              <Header
                title="Inbox"
                subtitle="Real-time WhatsApp messaging"
                primaryAction={{
                  label: "New Message",
                  onClick: () => setIsDirectMessageOpen(true),
                  icon: Send
                }}
                secondaryAction={{
                  label: "Bulk Message",
                  onClick: () => setIsBulkMessageOpen(true),
                  icon: Users
                }}
              />
            </div>
            {/* Main Content Area */}
            <div className={`flex-1 relative overflow-hidden content-with-sliding-header ${
              isHeaderVisible ? 'header-visible' : 'header-hidden'
            }`}>
              <AnimatedBackground pattern="gradient" className="absolute inset-0 opacity-20 pointer-events-none" />
              <div className="relative z-10 h-full">
                <RealtimeWhatsAppInbox />
              </div>
            </div>
          </div>
        </div>
      </HeaderVisibilityContext.Provider>
      {isDirectMessageOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <GlassContainer className="w-full max-w-md mx-4 p-6 animate-scale-in">
            <DirectMessage onClose={() => setIsDirectMessageOpen(false)} />
          </GlassContainer>
        </div>
      )}
      {isBulkMessageOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <GlassContainer className="w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <BulkMessage onClose={() => setIsBulkMessageOpen(false)} />
          </GlassContainer>
        </div>
      )}
    </ErrorBoundary>
  );
}
