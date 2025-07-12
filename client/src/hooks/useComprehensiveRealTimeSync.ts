import { useEffect, useCallback, createElement } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent, useSocket } from './useSocket';
import { useToast } from './use-toast';

/**
 * Comprehensive Real-time Sync Hook
 * Handles all real-time updates across the entire application
 */
export function useComprehensiveRealTimeSync() {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const { toast } = useToast();

  // Refresh specific query data
  const refreshQuery = useCallback((queryKey: string[]) => {
    console.log('🔄 Refreshing query:', queryKey);
    queryClient.invalidateQueries({ queryKey });
    queryClient.refetchQueries({ queryKey });
  }, [queryClient]);

  // Refresh all data across the application
  const refreshAllData = useCallback(() => {
    console.log('🔄 Refreshing all data due to real-time sync');

    // Refresh all major data queries
    refreshQuery(['/api/conversations']);
    refreshQuery(['/api/whatsapp/conversations']);
    refreshQuery(['/api/contacts']);
    refreshQuery(['/api/whatsapp-numbers']);
    refreshQuery(['/api/whatsapp/numbers']);
    refreshQuery(['/api/campaigns']);
    refreshQuery(['/api/templates']);
    refreshQuery(['/api/dashboard/stats']);
    refreshQuery(['/api/whatsapp/active-sessions']);
    refreshQuery(['/api/chatbot/settings']);

    // Refresh messages for all conversations (both regular and WhatsApp)
    const conversationQueries = queryClient.getQueryCache().findAll({
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && (key[0] === '/api/messages' || key[0] === '/api/whatsapp/messages');
      }
    });

    conversationQueries.forEach(query => {
      queryClient.invalidateQueries({ queryKey: query.queryKey });
    });
  }, [queryClient, refreshQuery]);

  // Enhanced message received handler
  useSocketEvent('new_message', (data) => {
    console.log('📨 Real-time: New message received', data);

    // Refresh conversations and messages across all sections
    refreshQuery(['/api/conversations']);
    refreshQuery(['/api/whatsapp/conversations']);
    if (data.conversationId) {
      refreshQuery(['/api/messages', data.conversationId]);
      refreshQuery(['/api/whatsapp/messages', data.conversationId]);
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

  // Enhanced message received handler (alternative event)
  useSocketEvent('message_received', (data) => {
    console.log('📨 Real-time: Message received', data);

    // Refresh conversations and messages
    refreshQuery(['/api/conversations']);
    refreshQuery(['/api/whatsapp/conversations']);
    if (data.conversationId) {
      refreshQuery(['/api/messages', data.conversationId]);
      refreshQuery(['/api/whatsapp/messages', data.conversationId]);
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

  // WhatsApp-specific real-time events
  useSocketEvent('whatsapp_message_received', (data) => {
    console.log('📨 Real-time: WhatsApp message received', data);

    // Refresh all WhatsApp-related data
    refreshQuery(['/api/whatsapp/conversations']);
    refreshQuery(['/api/whatsapp/numbers']);
    refreshQuery(['/api/conversations']);

    if (data.conversationId) {
      refreshQuery(['/api/whatsapp/messages', data.conversationId]);
      refreshQuery(['/api/messages', data.conversationId]);
    }

    // Show clickable notification for new WhatsApp message
    const contactName = data.contactName || data.contact?.name || 'Unknown';
    const contactPhone = data.contactPhone || data.contact?.phone || data.from;
    const messagePreview = data.content?.substring(0, 50) || data.body?.substring(0, 50) || 'New message';

    // Show WhatsApp notification with action button
    toast({
      title: "📱 New WhatsApp Message",
      description: `From ${contactName}: ${messagePreview}...`,
      duration: 8000,
      action: contactPhone ? createElement('button', {
        onClick: () => {
          const cleanPhone = contactPhone.replace(/[^\d+]/g, '');
          window.location.href = `/inbox?phone=${encodeURIComponent(cleanPhone)}`;
        },
        className: "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-green-600 text-white px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        children: "💬 Open Chat"
      }) : undefined,
    });
  });

  useSocketEvent('whatsapp_message_sent', (data) => {
    console.log('📤 Real-time: WhatsApp message sent', data);

    // Refresh all WhatsApp-related data
    refreshQuery(['/api/whatsapp/conversations']);
    refreshQuery(['/api/conversations']);

    if (data.conversationId) {
      refreshQuery(['/api/whatsapp/messages', data.conversationId]);
      refreshQuery(['/api/messages', data.conversationId]);
    }
  });

  useSocketEvent('whatsapp_conversation_updated', (data) => {
    console.log('💬 Real-time: WhatsApp conversation updated', data);

    // Refresh conversations across all sections
    refreshQuery(['/api/whatsapp/conversations']);
    refreshQuery(['/api/conversations']);
    refreshQuery(['/api/contacts']);
  });

  useSocketEvent('whatsapp_status_changed', (data) => {
    console.log('📱 Real-time: WhatsApp status changed', data);

    // Refresh WhatsApp numbers and sessions
    refreshQuery(['/api/whatsapp/numbers']);
    refreshQuery(['/api/whatsapp/active-sessions']);
    refreshQuery(['/api/whatsapp-numbers']);

    toast({
      title: "WhatsApp Status Update",
      description: `${data.phoneNumber}: ${data.status}`,
      duration: 3000,
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

  // WhatsApp Web message status updates
  useSocketEvent('whatsapp_web_message_status_update', (data) => {
    console.log('📊 Real-time: WhatsApp Web message status update', data);
    // Refresh all conversations and messages to update status
    refreshQuery(['/api/conversations']);
    refreshQuery(['/api/messages']);
  });

  // WhatsApp Web session updates
  useSocketEvent('whatsapp_web_session_update', (data) => {
    console.log('📱 Real-time: WhatsApp Web session update', data);
    // Refresh WhatsApp Web sessions
    refreshQuery(['/api/whatsapp-web/sessions']);
  });

  // WhatsApp Web QR code updates
  useSocketEvent('whatsapp_web_qr_code', (data) => {
    console.log('📱 Real-time: WhatsApp Web QR code update', data);
    // Refresh WhatsApp Web sessions
    refreshQuery(['/api/whatsapp-web/sessions']);
  });

  // WhatsApp Web connection updates
  useSocketEvent('whatsapp_connected', (data) => {
    console.log('📱 Real-time: WhatsApp connected', data);
    // Refresh WhatsApp Web sessions and conversations
    refreshQuery(['/api/whatsapp-web/sessions']);
    refreshQuery(['/api/conversations']);
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

  useSocketEvent('sync_all_data', (data) => {
    console.log('🔄 Real-time: Syncing all data', data);
    refreshAllData();

    // Additional comprehensive sync for cross-section updates
    if (data?.type === 'message_received' || data?.type === 'message_sent') {
      // When messages change, update all related sections
      refreshQuery(['/api/dashboard/stats']);
      refreshQuery(['/api/contacts']);
      refreshQuery(['/api/whatsapp-numbers']);
    }

    if (data?.type === 'conversation_created' || data?.type === 'conversation_updated') {
      // When conversations change, update all related sections
      refreshQuery(['/api/contacts']);
      refreshQuery(['/api/dashboard/stats']);
    }

    if (data?.type === 'contact_updated') {
      // When contacts change, update conversations and dashboard
      refreshQuery(['/api/conversations']);
      refreshQuery(['/api/whatsapp/conversations']);
      refreshQuery(['/api/dashboard/stats']);
    }
  });

  // Global sync event for comprehensive real-time updates
  useSocketEvent('global_data_sync', () => {
    console.log('🌐 Real-time: Global data sync triggered');
    refreshAllData();

    // Force refresh of all cached data
    queryClient.invalidateQueries();

    // Trigger a complete re-render by invalidating all queries
    setTimeout(() => {
      queryClient.refetchQueries();
    }, 100);
  });

  // Specific message refresh events
  useSocketEvent('refresh_messages', (conversationId: number) => {
    console.log('🔄 Real-time: Refreshing messages for conversation', conversationId);
    if (conversationId) {
      refreshQuery(['/api/messages', conversationId]);
    }
  });

  // WhatsApp connection events
  useSocketEvent('whatsapp_ready', (data) => {
    console.log('✅ Real-time: WhatsApp ready', data);
    refreshQuery(['/api/whatsapp-numbers']);
    refreshQuery(['/api/whatsapp/active-sessions']);
    
    toast({
      title: "WhatsApp Connected",
      description: "WhatsApp is now ready to send and receive messages",
      duration: 3000,
    });
  });

  useSocketEvent('whatsapp_disconnected', (data) => {
    console.log('❌ Real-time: WhatsApp disconnected', data);
    refreshQuery(['/api/whatsapp-numbers']);
    refreshQuery(['/api/whatsapp/active-sessions']);
    
    toast({
      title: "WhatsApp Disconnected",
      description: "WhatsApp connection lost. Please reconnect.",
      duration: 5000,
      variant: "destructive",
    });
  });

  useSocketEvent('qr_code', (data) => {
    console.log('📱 Real-time: QR code received', data);
    refreshQuery(['/api/whatsapp/active-sessions']);
  });

  // WhatsApp number deleted event
  useSocketEvent('whatsapp_number_deleted', (data) => {
    console.log('🗑️ Real-time: WhatsApp number deleted', data);
    refreshQuery(['/api/whatsapp/numbers']);
    refreshQuery(['/api/whatsapp/conversations']);
    refreshQuery(['/api/conversations']);
    refreshAllData();
  });

  // Conversation deleted event
  useSocketEvent('conversation_deleted', (data) => {
    console.log('🗑️ Real-time: Conversation deleted', data);
    refreshQuery(['/api/conversations']);
    refreshQuery(['/api/whatsapp/conversations']);
    refreshAllData();
  });

  // Message sent event
  useSocketEvent('message_sent', (data) => {
    console.log('📤 Real-time: Message sent', data);
    if (data.conversationId) {
      refreshQuery(['/api/messages', data.conversationId]);
      refreshQuery(['/api/whatsapp/messages', data.conversationId]);
    }
    refreshQuery(['/api/conversations']);
    refreshQuery(['/api/whatsapp/conversations']);
  });

  // Log socket connection status
  useEffect(() => {
    if (socket) {
      console.log('🔌 Real-time sync connected to socket:', socket.connected);
      
      socket.on('connect', () => {
        console.log('🔌 Socket connected for real-time sync');
        refreshAllData();
      });
      
      socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected from real-time sync');
      });
      
      return () => {
        socket.off('connect');
        socket.off('disconnect');
      };
    }
  }, [socket, refreshAllData]);

  return {
    refreshQuery,
    refreshAllData,
    isConnected: socket?.connected || false
  };
}

export default useComprehensiveRealTimeSync;
