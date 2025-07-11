import { useEffect, useRef, useState, useCallback, createElement } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useSocketEvent, useSocket } from './useSocket';
import { useToast } from './use-toast';

/**
 * Comprehensive Real-time Sync Hook
 * Handles all real-time updates across the entire application
 */
export function useRealtimeSync() {
  const queryClientHook = useQueryClient();
  const socket = useSocket();
  const { toast } = useToast();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(Date.now());

  // Refresh specific query data
  const refreshQuery = useCallback((queryKey: string[]) => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.refetchQueries({ queryKey });
    queryClientHook.invalidateQueries({ queryKey });
    queryClientHook.refetchQueries({ queryKey });
  }, [queryClientHook]);

  // Refresh all data across the application
  const refreshAllData = useCallback(() => {
    console.log('🔄 Refreshing all data due to real-time sync');

    // Refresh all major data queries
    refreshQuery(['/api/conversations']);
    refreshQuery(['/api/contacts']);
    refreshQuery(['/api/whatsapp-numbers']);
    refreshQuery(['/api/campaigns']);
    refreshQuery(['/api/templates']);
    refreshQuery(['/api/dashboard/stats']);
    refreshQuery(['/api/whatsapp/active-sessions']);
    refreshQuery(['/api/chatbot/settings']);

    // Refresh messages for all conversations
    const conversationQueries = queryClient.getQueryCache().findAll({
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && key[0] === '/api/messages';
      }
    });

    conversationQueries.forEach(query => {
      queryClient.invalidateQueries({ queryKey: query.queryKey });
    });
  }, [refreshQuery]);

  // Enhanced message received handler
  useSocketEvent('new_message', (data) => {
    console.log('📨 Real-time: New message received', data);

    // Refresh conversations and messages
    refreshQuery(['/api/conversations']);
    if (data.conversationId) {
      refreshQuery(['/api/messages', data.conversationId]);
    }

    // Show clickable notification for new message
    const contactName = data.conversation?.contactName || data.contact?.name || 'Unknown';
    const contactPhone = data.contact?.phone || data.conversation?.contactPhone;
    const messagePreview = data.message?.content?.substring(0, 50) || 'New message';

    // Show notification with action button
    toast({
      title: "New Message",
      description: `From ${contactName}: ${messagePreview}...`,
      duration: 8000,
      action: contactPhone ? createElement('button', {
        onClick: () => {
          const cleanPhone = contactPhone.replace(/[^\d+]/g, '');
          window.location.href = `/inbox?phone=${encodeURIComponent(cleanPhone)}`;
        },
        className: "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        children: "Open Chat"
      }) : undefined,
    });
  });

  // Enhanced message sent handler
  useSocketEvent('message_sent', (data) => {
    console.log('📤 Real-time: Message sent', data);

    // Refresh conversations and messages
    refreshQuery(['/api/conversations']);
    if (data.conversationId) {
      refreshQuery(['/api/messages', data.conversationId]);
    }
  });

  // Message status updates
  useSocketEvent('message_status_update', (data) => {
    console.log('📊 Real-time: Message status update', data);
    if (data.conversationId) {
      refreshQuery(['/api/messages', data.conversationId]);
    }
  });

  // Conversation updates
  useSocketEvent('conversation_updated', (data) => {
    console.log('💬 Real-time: Conversation updated', data);
    refreshQuery(['/api/conversations']);
  });

  // New conversation creation
  useSocketEvent('conversation_created', (data) => {
    console.log('🆕 Real-time: Conversation created', data);
    refreshQuery(['/api/conversations']);
    refreshQuery(['/api/contacts']);

    toast({
      title: "New Conversation",
      description: `Started with ${data.conversation?.contactName || data.contact?.name}`,
      duration: 3000,
    });
  });

  // Contact updates
  useSocketEvent('contact_updated', (data) => {
    console.log('👤 Real-time: Contact updated', data);
    refreshQuery(['/api/contacts']);
    refreshQuery(['/api/conversations']);
  });

  // WhatsApp status changes
  useSocketEvent('whatsapp_status_changed', (data) => {
    console.log('📱 Real-time: WhatsApp status changed', data);
    refreshQuery(['/api/whatsapp-numbers']);
    refreshQuery(['/api/whatsapp/active-sessions']);

    toast({
      title: "WhatsApp Status",
      description: `Connection status: ${data.status}`,
      duration: 3000,
    });
  });

  // Campaign progress updates
  useSocketEvent('campaign_progress', (data) => {
    console.log('📊 Real-time: Campaign progress', data);
    refreshQuery(['/api/campaigns']);
    refreshQuery(['/api/dashboard/stats']);
  });

  // Global refresh events
  useSocketEvent('refresh_conversations', () => {
    console.log('🔄 Real-time: Refreshing conversations');
    refreshQuery(['/api/conversations']);
  });

  useSocketEvent('refresh_contacts', () => {
    console.log('🔄 Real-time: Refreshing contacts');
    refreshQuery(['/api/contacts']);
  });

  useSocketEvent('refresh_whatsapp_numbers', () => {
    console.log('🔄 Real-time: Refreshing WhatsApp numbers');
    refreshQuery(['/api/whatsapp-numbers']);
  });

  useSocketEvent('refresh_campaigns', () => {
    console.log('🔄 Real-time: Refreshing campaigns');
    refreshQuery(['/api/campaigns']);
  });

  useSocketEvent('sync_all_data', () => {
    console.log('🔄 Real-time: Syncing all data');
    refreshAllData();
  });

  // Specific message refresh events
  useSocketEvent('refresh_messages', (conversationId: number) => {
    console.log('🔄 Real-time: Refreshing messages for conversation', conversationId);
    if (conversationId) {
      refreshQuery(['/api/messages', conversationId]);
    }
  });

  useEffect(() => {
    // Function to invalidate and refetch all relevant queries
    const syncData = async () => {
      try {
        // Only sync if it's been more than 1 second since last sync to avoid spam
        const now = Date.now();
        if (now - lastSyncRef.current < 1000) return;
        lastSyncRef.current = now;

        // Invalidate conversations to refresh inbox
        await queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        
        // Invalidate messages for active conversations
        const activeConversationQueries = queryClient.getQueryCache()
          .findAll({ queryKey: ['/api/messages'] });
        
        for (const query of activeConversationQueries) {
          await queryClient.invalidateQueries({ queryKey: query.queryKey });
        }
        
        // Invalidate AI agent settings
        await queryClient.invalidateQueries({ queryKey: ['/api/chatbot/settings'] });
        
        // Invalidate WhatsApp sessions
        await queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/active-sessions'] });
        
        console.log('🔄 Real-time sync completed');
      } catch (error) {
        console.error('Real-time sync error:', error);
      }
    };

    // Start real-time sync every 2 seconds
    syncIntervalRef.current = setInterval(syncData, 2000);

    // Cleanup on unmount
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  // Manual sync function for immediate updates
  const triggerSync = async () => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    
    // Immediate sync
    await queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/chatbot/settings'] });
    
    // Restart interval
    syncIntervalRef.current = setInterval(async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/chatbot/settings'] });
    }, 2000);
  };

  return { triggerSync };
}

// AI Agent state management for cross-page synchronization
export interface AIAgentState {
  isActive: boolean;
  selectedAgent: string;
  conversationId: number | null;
  lastActivated: number;
}

class AIAgentManager {
  private static instance: AIAgentManager;
  private state: AIAgentState = {
    isActive: false,
    selectedAgent: '',
    conversationId: null,
    lastActivated: 0
  };
  private listeners: ((state: AIAgentState) => void)[] = [];

  static getInstance(): AIAgentManager {
    if (!AIAgentManager.instance) {
      AIAgentManager.instance = new AIAgentManager();
    }
    return AIAgentManager.instance;
  }

  getState(): AIAgentState {
    return { ...this.state };
  }

  setState(newState: Partial<AIAgentState>) {
    this.state = { ...this.state, ...newState, lastActivated: Date.now() };
    this.notifyListeners();

    // Store in localStorage for persistence across page refreshes
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('ai_agent_state', JSON.stringify(this.state));
      }
    } catch (error) {
      console.error('Failed to save AI agent state:', error);
    }
  }

  subscribe(listener: (state: AIAgentState) => void) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Load state from localStorage on initialization
  loadPersistedState() {
    try {
      // Check if we're in browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('ai_agent_state');
        if (stored) {
          this.state = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Failed to load AI agent state:', error);
    }
  }

  // Activate AI agent for a conversation
  async activateAgent(conversationId: number, agentType: string) {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/ai-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          active: true, 
          agentType 
        }),
      });
      
      if (!response.ok) throw new Error('Failed to activate AI agent');
      
      this.setState({
        isActive: true,
        selectedAgent: agentType,
        conversationId
      });
      
      return true;
    } catch (error) {
      console.error('Failed to activate AI agent:', error);
      return false;
    }
  }

  // Deactivate AI agent
  async deactivateAgent(conversationId: number) {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/ai-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          active: false, 
          agentType: null 
        }),
      });
      
      if (!response.ok) throw new Error('Failed to deactivate AI agent');
      
      this.setState({
        isActive: false,
        selectedAgent: '',
        conversationId: null
      });
      
      return true;
    } catch (error) {
      console.error('Failed to deactivate AI agent:', error);
      return false;
    }
  }
}

export const aiAgentManager = AIAgentManager.getInstance();

// Hook for using AI agent state in components
export function useAIAgentState() {
  const [state, setState] = useState<AIAgentState>(aiAgentManager.getState());

  useEffect(() => {
    // Load persisted state on mount
    aiAgentManager.loadPersistedState();
    setState(aiAgentManager.getState());

    // Subscribe to state changes
    const unsubscribe = aiAgentManager.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    state,
    activateAgent: aiAgentManager.activateAgent.bind(aiAgentManager),
    deactivateAgent: aiAgentManager.deactivateAgent.bind(aiAgentManager)
  };
}