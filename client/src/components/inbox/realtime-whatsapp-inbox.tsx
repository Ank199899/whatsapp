import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageStatusIndicator } from '@/components/ui/message-status-indicator';
import { MediaMessage } from './media-message';
// Temporarily comment out new imports to debug
// import { ResponsiveLayoutProvider, SmartChatLayout, ResponsiveMessage, ResponsiveText, useResponsiveLayoutContext } from '@/components/layout/responsive-layout-provider';
// import { AnimatedMessage, TypingIndicator, AnimatedChatInput, AnimatedMessageStatus, OnlineStatus, ScrollToBottomButton, ConnectionStatus, AnimatedChatHeader } from '@/components/ui/animated-chat-components';
// import { EmojiProcessor, AnimatedEmoji } from '@/components/ui/animated-emoji';
import './inbox.css';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Phone,
  Video,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Star,
  Smartphone,
  MessageSquare,
  RefreshCw,
  Image,
  Music,
  FileText,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format, isToday, isYesterday } from 'date-fns';
import { useSocketEvent } from '@/hooks/useSocket';
import { GlassContainer, GradientText, AnimatedBackground } from '@/components/ui/modern-effects';
import { Spinner } from '@/components/ui/modern-loading';
import { useHeaderVisibility } from '@/pages/inbox';

// Types
interface WhatsAppNumber {
  id: string;
  sessionId: string;
  phoneNumber: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting';
  isActive: boolean;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  whatsappNumberId?: string;
}

interface Conversation {
  id: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  whatsappNumberId: string;
}

interface Message {
  id: string;
  content: string;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  type?: string;
  mediaUrl?: string;
  mediaType?: string;
}

const InboxContent: React.FC = () => {
  const [selectedNumber, setSelectedNumber] = useState<WhatsAppNumber | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'pinned'>('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAllChats, setShowAllChats] = useState(false);
  const [preSelectedPhone, setPreSelectedPhone] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationsScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Header visibility control
  const { setHeaderVisible } = useHeaderVisibility();

  // Handle URL parameters for pre-selecting contact
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const phoneParam = urlParams.get('phone');

    if (phoneParam) {
      console.log('📱 URL parameter detected, pre-selecting contact:', phoneParam);
      setPreSelectedPhone(phoneParam);
      // Clear URL parameter after processing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Fetch WhatsApp numbers with real-time sync
  const { data: whatsappNumbers = [], isLoading: numbersLoading, refetch: refetchNumbers } = useQuery({
    queryKey: ['/api/whatsapp/numbers'],
    queryFn: async () => {
      console.log('🔄 Auto-syncing WhatsApp numbers...');
      const response = await apiRequest('GET', '/api/whatsapp/numbers');
      console.log('📱 WhatsApp numbers response:', response);
      return response;
    },
    refetchInterval: 2000, // Auto-sync every 2 seconds
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale to force refresh
  });

  // Debug logging
  React.useEffect(() => {
    console.log('📱 WhatsApp numbers loaded:', whatsappNumbers);
  }, [whatsappNumbers]);

  // Fetch conversations for selected number with real-time sync (or all numbers if showAllChats is true)
  const { data: conversations = [], isLoading: conversationsLoading, refetch: refetchConversations } = useQuery({
    queryKey: ['/api/whatsapp/conversations', showAllChats ? 'all' : selectedNumber?.id],
    queryFn: () => {
      if (showAllChats) {
        return apiRequest('GET', '/api/whatsapp/conversations/all');
      }
      // Pass the selected WhatsApp number ID to filter conversations
      const params = selectedNumber?.id ? `?whatsappNumberId=${selectedNumber.id}` : '';
      return apiRequest('GET', `/api/whatsapp/conversations${params}`);
    },
    enabled: showAllChats || !!selectedNumber?.id,
    refetchInterval: 2000, // Auto-sync every 2 seconds
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale to force refresh
  });

  // Debug logging for conversations
  React.useEffect(() => {
    console.log('💬 Conversations loaded:', conversations);
    console.log('📱 Selected number:', selectedNumber);
    console.log('🔄 Show all chats:', showAllChats);
  }, [conversations, selectedNumber, showAllChats]);

  // Debug logging for conversations
  React.useEffect(() => {
    console.log('💬 Conversations loaded:', conversations);
    console.log('📱 Selected number:', selectedNumber);
  }, [conversations, selectedNumber]);

  // Header visibility control - hide header when chat is opened
  React.useEffect(() => {
    if (selectedContact) {
      // Hide header when a chat is opened
      setHeaderVisible(false);
    } else {
      // Show header when no chat is selected
      setHeaderVisible(true);
    }
  }, [selectedContact, setHeaderVisible]);

  // Fetch messages for selected contact with real-time sync
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/whatsapp/messages', selectedContact?.id],
    queryFn: () => apiRequest('GET', `/api/whatsapp/messages/${selectedContact?.id}`),
    enabled: !!selectedContact?.id,
    refetchInterval: 2000, // Refresh every 2 seconds for real-time sync
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale to force refresh
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { to: string; message: string; sessionId: string }) => {
      return apiRequest('POST', '/api/whatsapp/send-message', data);
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/messages', selectedContact?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/conversations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Send media mutation
  const sendMediaMutation = useMutation({
    mutationFn: async (data: { to: string; file: File; sessionId: string; caption?: string }) => {
      const formData = new FormData();
      formData.append('to', data.to);
      formData.append('file', data.file);
      formData.append('sessionId', data.sessionId);
      if (data.caption) {
        formData.append('caption', data.caption);
      }

      return fetch('/api/whatsapp/send-media', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }).then(res => {
        if (!res.ok) throw new Error('Failed to send media');
        return res.json();
      });
    },
    onSuccess: () => {
      setSelectedFile(null);
      setNewMessage('');
      setIsUploadingMedia(false);
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/messages', selectedContact?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/conversations'] });
      toast({
        title: "Media sent successfully",
        description: "Your media file has been sent",
      });
    },
    onError: (error: any) => {
      setIsUploadingMedia(false);
      toast({
        title: "Failed to send media",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Force refresh mutation to clear duplicates and sync real-time data
  const forceRefreshMutation = useMutation({
    mutationFn: async () => {
      console.log('🔄 Starting comprehensive sync...');

      // Step 1: Force refresh numbers
      const refreshResponse = await apiRequest('POST', '/api/whatsapp/force-refresh');
      console.log('✅ Numbers refreshed:', refreshResponse);

      // Step 2: Sync real-time chats for all connected numbers
      const numbersResponse = await apiRequest('GET', '/api/whatsapp/numbers');
      const connectedNumbers = numbersResponse.filter((num: any) => num.status === 'connected');

      console.log(`📱 Found ${connectedNumbers.length} connected numbers for real-time sync`);

      // Step 3: Sync chats for each connected number
      for (const number of connectedNumbers) {
        try {
          console.log(`🔄 Syncing chats for ${number.phoneNumber} (ID: ${number.id})...`);
          console.log(`📱 Making request to: /api/whatsapp/sync-chats/${number.id}`);

          const syncResponse = await apiRequest('POST', `/api/whatsapp/sync-chats/${number.id}`);
          console.log(`✅ Sync response for ${number.phoneNumber}:`, syncResponse);
        } catch (syncError) {
          console.error(`❌ Failed to sync chats for ${number.phoneNumber}:`, syncError);
          console.error(`❌ Error details:`, {
            numberId: number.id,
            phoneNumber: number.phoneNumber,
            status: number.status,
            error: syncError
          });
        }
      }

      return {
        ...refreshResponse,
        syncedNumbers: connectedNumbers.length,
        message: `Synced ${connectedNumbers.length} connected numbers with real-time data`
      };
    },
    onSuccess: (data) => {
      console.log('✅ Comprehensive sync successful:', data);
      toast({
        title: "Real-time Sync Complete",
        description: data.message || `Synced ${data.syncedNumbers || 0} connected numbers`,
      });
      refetchNumbers();
      refetchConversations();
      refetchMessages();
    },
    onError: (error: any) => {
      console.error('❌ Comprehensive sync failed:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync real-time data",
        variant: "destructive",
      });
    },
  });

  // Clean up disconnected numbers mutation
  const cleanupDisconnectedMutation = useMutation({
    mutationFn: async () => {
      console.log('🧹 Cleaning up disconnected numbers...');
      const response = await apiRequest('POST', '/api/whatsapp/cleanup-disconnected');
      console.log('✅ Cleanup response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('✅ Cleanup successful:', data);
      refetchNumbers();
      refetchConversations();
      toast({
        title: "Success",
        description: data.message || "Disconnected numbers removed successfully",
      });
    },
    onError: (error: any) => {
      console.error('❌ Cleanup failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cleanup disconnected numbers",
        variant: "destructive",
      });
    },
  });

  // Delete WhatsApp number mutation
  const deleteNumberMutation = useMutation({
    mutationFn: async (numberId: string) => {
      console.log('🗑️ Starting delete for WhatsApp number:', numberId);
      console.log('🗑️ Number ID type:', typeof numberId, 'Value:', numberId);
      console.log('🗑️ Making DELETE request to:', `/api/whatsapp/numbers/${numberId}`);

      try {
        // Make the DELETE request with detailed logging
        console.log('🔄 Calling apiRequest...');
        const response = await apiRequest('DELETE', `/api/whatsapp/numbers/${numberId}`);
        console.log('✅ Delete API response:', response);
        return response;
      } catch (error) {
        console.error('❌ Delete API error details:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        });

        // Re-throw with more details
        if (error instanceof Error) {
          throw new Error(`Delete failed: ${error.message}`);
        } else {
          throw new Error(`Delete failed: ${JSON.stringify(error)}`);
        }
      }
    },
    onSuccess: (data) => {
      console.log('✅ Delete mutation successful:', data);

      // Refresh data
      refetchNumbers();
      refetchConversations();

      // Reset selected number if it was deleted
      if (selectedNumber && selectedNumber.id.toString() === data.deletedId?.toString()) {
        console.log('🔄 Resetting selected number as it was deleted');
        setSelectedNumber(null);
        setSelectedContact(null);
      }

      toast({
        title: "Success",
        description: `WhatsApp number deleted successfully`,
      });
    },
    onError: (error: any) => {
      console.error('❌ Delete mutation failed:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete WhatsApp number. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Real-time sync with socket events
  useEffect(() => {
    const socket = (window as any).socket;
    if (!socket) return;

    const handleWhatsAppUpdate = () => {
      console.log('🔄 WhatsApp update received, refreshing data...');
      refetchNumbers();
      refetchConversations();
      refetchMessages();
    };

    const handleNewMessage = () => {
      console.log('📨 New message received, refreshing...');
      refetchConversations();
      refetchMessages();
    };

    const handleConnectionUpdate = () => {
      console.log('🔌 Connection update, refreshing numbers...');
      refetchNumbers();
    };

    // Listen for various WhatsApp events
    socket.on('whatsapp_web_connected', handleConnectionUpdate);
    socket.on('whatsapp_connected', handleConnectionUpdate);
    socket.on('whatsapp_web_disconnected', handleConnectionUpdate);
    socket.on('whatsapp_message_received', handleNewMessage);
    socket.on('whatsapp_message_sent', handleNewMessage);
    socket.on('whatsapp_web_message', handleNewMessage);
    socket.on('whatsapp_duplicate_detected', handleConnectionUpdate);

    return () => {
      socket.off('whatsapp_web_connected', handleConnectionUpdate);
      socket.off('whatsapp_connected', handleConnectionUpdate);
      socket.off('whatsapp_web_disconnected', handleConnectionUpdate);
      socket.off('whatsapp_message_received', handleNewMessage);
      socket.off('whatsapp_message_sent', handleNewMessage);
      socket.off('whatsapp_web_message', handleNewMessage);
      socket.off('whatsapp_duplicate_detected', handleConnectionUpdate);
    };
  }, [refetchNumbers, refetchConversations, refetchMessages]);

  // Auto-select first WhatsApp number
  useEffect(() => {
    if (!selectedNumber && whatsappNumbers.length > 0 && !numbersLoading) {
      setSelectedNumber(whatsappNumbers[0]);
    }
  }, [whatsappNumbers, selectedNumber, numbersLoading]);

  // Force refresh conversations when selected number changes
  useEffect(() => {
    if (selectedNumber && !showAllChats) {
      console.log('📱 Selected number changed, refreshing conversations for:', selectedNumber.phoneNumber);
      refetchConversations();
    }
  }, [selectedNumber, showAllChats, refetchConversations]);

  // Auto-select contact from URL parameter
  useEffect(() => {
    if (preSelectedPhone && conversations.length > 0 && !selectedContact) {
      console.log('🔍 Looking for contact with phone:', preSelectedPhone);

      // Normalize phone numbers for comparison
      const normalizePhone = (phone: string) => phone.replace(/[^\d+]/g, '');
      const normalizedPreSelected = normalizePhone(preSelectedPhone);

      // Find matching conversation
      const matchingConversation = conversations.find((conv: Conversation) => {
        const normalizedConvPhone = normalizePhone(conv.contactPhone || '');
        return normalizedConvPhone === normalizedPreSelected ||
               normalizedConvPhone.endsWith(normalizedPreSelected) ||
               normalizedPreSelected.endsWith(normalizedConvPhone);
      });

      if (matchingConversation) {
        console.log('✅ Found matching conversation:', matchingConversation);
        setSelectedContact({
          id: matchingConversation.id,
          name: matchingConversation.contactName,
          phone: matchingConversation.contactPhone
        });
        setPreSelectedPhone(null); // Clear after selection

        // Show success notification
        toast({
          title: "Chat Opened",
          description: `Opened chat with ${matchingConversation.contactName || matchingConversation.contactPhone}`,
          duration: 3000,
        });
      } else {
        console.log('❌ No matching conversation found for phone:', preSelectedPhone);
        // Clear the pre-selected phone if no match found
        setPreSelectedPhone(null);
      }
    }
  }, [conversations, preSelectedPhone, selectedContact, toast]);

  // Filter conversations
  const filteredConversations = conversations.filter((conversation: Conversation) => {
    if (filter === 'unread' && (!conversation.unreadCount || conversation.unreadCount === 0)) {
      return false;
    }
    if (searchQuery && !conversation.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !conversation.contactPhone?.includes(searchQuery)) {
      return false;
    }
    return true;
  });

  // Format time helper
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'dd/MM/yy');
    }
  };

  // File handling functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 16MB for WhatsApp)
      if (file.size > 16 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 16MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Check file size (max 16MB for WhatsApp)
      if (file.size > 16 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 16MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  // Send message handler
  const sendMessage = () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedContact || sendMessageMutation.isPending || sendMediaMutation.isPending) return;

    const whatsappNumber = selectedNumber || whatsappNumbers[0];
    if (!whatsappNumber || whatsappNumber.status !== 'connected') {
      toast({
        title: "WhatsApp Not Connected",
        description: "Please connect a WhatsApp number first.",
        variant: "destructive",
      });
      return;
    }

    // Send media file if selected
    if (selectedFile) {
      setIsUploadingMedia(true);
      sendMediaMutation.mutate({
        to: selectedContact.phone,
        file: selectedFile,
        sessionId: whatsappNumber.id,
        caption: newMessage.trim() || undefined,
      });
    } else {
      // Send text message
      sendMessageMutation.mutate({
        to: selectedContact.phone,
        message: newMessage,
        sessionId: whatsappNumber.id,
      });
    }
  };

  // Socket events for real-time updates
  useSocketEvent('refresh_conversations', () => {
    queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/conversations'] });
  });

  useSocketEvent('refresh_messages', (conversationId) => {
    if (conversationId) {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/messages', conversationId] });
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scroll conversations to top when search query changes
  useEffect(() => {
    if (conversationsScrollRef.current) {
      const viewport = conversationsScrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [searchQuery, filter]);

  if (whatsappNumbers.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background to-background-secondary">
        <div className="text-center p-8 max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No WhatsApp Numbers Connected</h3>
          <p className="text-muted-foreground mb-6">Connect a WhatsApp number to start messaging</p>
          <Button
            onClick={() => window.location.href = '/whatsapp-setup'}
            className="bg-primary hover:bg-primary/90"
          >
            Connect WhatsApp
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="inbox-layout-stable inbox-container h-screen bg-gradient-to-br from-background to-background-secondary">
      {/* Left Sidebar */}
      <div className="border-r border-border/30 inbox-sidebar-stable">
        {/* Advanced Header with Real-time Sync */}
        <div className="flex-shrink-0 p-4 md:p-6 bg-gradient-to-r from-white via-blue-50 to-white border-b border-gradient-to-r from-blue-200 via-purple-200 to-blue-200 sticky top-0 z-20 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  WhatsApp Inbox
                </h2>
                <p className="text-sm text-gray-600 font-medium">Real-time messaging • {whatsappNumbers.length} connected</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-300 hover:bg-blue-600 hover:text-white rounded-2xl h-10 px-4 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
                onClick={() => {
                  forceRefreshMutation.mutate();
                  // Also cleanup disconnected numbers
                  setTimeout(() => {
                    cleanupDisconnectedMutation.mutate();
                  }, 1000);
                }}
                disabled={forceRefreshMutation.isPending || cleanupDisconnectedMutation.isPending}
                title="Real-time Sync & Remove Disconnected Numbers"
              >
                <RefreshCw className={cn(
                  "h-4 w-4 mr-2",
                  (forceRefreshMutation.isPending || cleanupDisconnectedMutation.isPending) && "animate-spin"
                )} />
                <span className="font-medium">Sync</span>
              </Button>
            </div>
          </div>

          {/* Number Selector */}
          <Select
            value={showAllChats ? 'all' : (selectedNumber?.id || '')}
            onValueChange={(value) => {
              if (value === 'all') {
                setShowAllChats(true);
                setSelectedNumber(null);
                setSelectedContact(null);
              } else {
                setShowAllChats(false);
                const number = whatsappNumbers.find((n: any) => n.id === value);
                setSelectedNumber(number || null);
                setSelectedContact(null);
              }
            }}
          >
            <SelectTrigger className="bg-white/90 backdrop-blur-sm text-black border-white/30 rounded-xl hover:bg-white transition-all duration-300 text-sm md:text-base">
              <SelectValue placeholder="Select WhatsApp Number" className="text-black" />
            </SelectTrigger>
            <SelectContent className="bg-card backdrop-blur-md border-border/50 rounded-xl">
              {/* All Number chats option */}
              <SelectItem
                value="all"
                className="rounded-lg cursor-pointer hover:bg-primary/10 text-black"
              >
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500" />
                  <span className="font-medium text-black text-sm md:text-base">All Number chats</span>
                </div>
              </SelectItem>

              {whatsappNumbers.map((number: any) => (
                <div key={number.id} className="relative group">
                  <SelectItem
                    value={number.id}
                    className="rounded-lg cursor-pointer hover:bg-primary/10 text-black pr-10"
                  >
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className={cn(
                        "w-2 h-2 md:w-3 md:h-3 rounded-full",
                        number.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                      )} />
                      <span className="font-medium text-black text-sm md:text-base">{number.phoneNumber}</span>
                      <span className="text-xs text-muted-foreground">
                        {number.status === 'connected' ? 'Active' : 'Disconnected'}
                      </span>
                    </div>
                  </SelectItem>
                  <div
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🗑️ Delete button clicked for number:', number);
                      console.log('🗑️ Number details:', {
                        id: number.id,
                        phoneNumber: number.phoneNumber,
                        status: number.status
                      });

                      if (confirm(`Are you sure you want to delete ${number.phoneNumber}?\n\nThis will:\n- Remove the number from your account\n- Disconnect the WhatsApp session\n- Delete all associated conversations\n\nThis action cannot be undone.`)) {
                        console.log('✅ User confirmed deletion, calling mutation...');
                        console.log('🔄 Mutation state before call:', {
                          isPending: deleteNumberMutation.isPending,
                          isError: deleteNumberMutation.isError,
                          error: deleteNumberMutation.error
                        });

                        try {
                          deleteNumberMutation.mutate(number.id.toString());
                          console.log('🚀 Mutation called successfully');
                        } catch (error) {
                          console.error('❌ Error calling mutation:', error);
                        }
                      } else {
                        console.log('❌ User cancelled deletion');
                      }
                    }}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div className="p-1 hover:bg-red-50 rounded cursor-pointer">
                      {deleteNumberMutation.isPending ? (
                        <RefreshCw className="h-3 w-3 animate-spin text-red-500" />
                      ) : (
                        <X className="h-3 w-3 text-red-500 hover:text-red-700" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>



        {/* Search and Filters - Fixed */}
        <div className="flex-shrink-0 p-3 md:p-4 border-b border-border/30 bg-background/50">
          <div className="relative mb-2 md:mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 md:h-4 md:w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 md:pl-10 bg-background border-border/50 rounded-xl text-black text-sm md:text-base h-8 md:h-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full" ref={conversationsScrollRef}>
            <div className="p-2 space-y-2">
              {conversationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No conversations found</p>
                  {selectedNumber && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Start a conversation by sending a message
                    </p>
                  )}
                </div>
              ) : (
                filteredConversations.map((conversation: Conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedContact({
                      id: conversation.id,
                      name: conversation.contactName,
                      phone: conversation.contactPhone
                    })}
                    className={cn(
                      "inbox-conversation-item group",
                      selectedContact?.id === conversation.id && "selected"
                    )}
                  >
                    <div className="flex items-center space-x-3 relative z-10">
                      <div className="avatar relative">
                        <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-white shadow-lg">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                            {conversation.contactName?.charAt(0)?.toUpperCase() || conversation.contactPhone?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.unreadCount && conversation.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                            <span className="text-xs text-white font-bold">
                              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="content flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-gray-900 truncate text-base group-hover:text-blue-700 transition-colors">
                            {conversation.contactName || conversation.contactPhone}
                          </h3>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <span className="text-xs text-gray-500 font-medium">
                              {formatTime(conversation.lastMessageAt)}
                            </span>
                            <div className="w-2 h-2 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-gray-600 truncate text-sm group-hover:text-gray-700 transition-colors">
                            {conversation.lastMessage || 'No messages yet'}
                          </p>
                          {selectedContact?.id === conversation.id && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="bg-background inbox-chat-stable">
        {selectedContact ? (
          <div className="flex flex-col h-full">
            {/* Advanced Fixed Chat Header with Customer Details */}
            <div className="flex-shrink-0 p-4 md:p-6 flex items-center justify-between inbox-chat-header-fixed border-b border-gradient-to-r from-blue-200 via-purple-200 to-blue-200 bg-gradient-to-r from-white via-blue-50 to-white backdrop-blur-md shadow-lg">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-14 w-14 border-3 border-white shadow-xl ring-2 ring-blue-200">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xl">
                      {selectedContact.name?.charAt(0)?.toUpperCase() || selectedContact.phone?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse shadow-lg"></div>
                </div>
                <div className="inbox-chat-header">
                  <h3 className="font-bold text-xl text-gray-900 mb-1">
                    {selectedContact.name || 'Unknown Contact'}
                  </h3>
                  <div className="flex items-center space-x-3">
                    <p className="text-blue-600 font-semibold text-sm">{selectedContact.phone}</p>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">Online</span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mt-1 hidden md:block">
                    Last seen recently • Active now
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-2xl h-10 w-10 p-0 hover:bg-blue-100 hover:scale-110 transition-all duration-300 shadow-md"
                  title="Voice Call"
                >
                  <Phone className="h-5 w-5 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-2xl h-10 w-10 p-0 hover:bg-purple-100 hover:scale-110 transition-all duration-300 shadow-md"
                  title="Video Call"
                >
                  <Video className="h-5 w-5 text-purple-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-2xl h-10 w-10 p-0 hover:bg-gray-100 hover:scale-110 transition-all duration-300 shadow-md"
                  title="More Options"
                >
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </Button>
              </div>
            </div>

            {/* Messages Area - Scrollable */}
            <div className="flex-1 flex flex-col overflow-hidden bg-muted/20 inbox-messages-container">
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full inbox-scrollable"
                  style={{ height: 'calc(100vh - 160px)' }}>
                  <div className="p-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full min-h-[400px]">
                        <div className="text-center">
                          <Spinner size="lg" className="mx-auto mb-3" />
                          <p className="text-muted-foreground">Loading messages...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((message: Message) => (
                          <div
                            key={message.id}
                            className={`flex w-full ${
                              message.direction === 'outgoing' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div className={cn(
                              "max-w-[70%] rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md",
                              message.direction === 'outgoing'
                                ? "bg-primary text-primary-foreground"
                                : "bg-card border border-border/50"
                            )}>
                              {/* Media message handling */}
                              {(message.mediaUrl || message.type === 'media' || (message as any).messageType === 'media') && (
                                <div className="p-2">
                                  <MediaMessage
                                    mediaUrl={message.mediaUrl || ''}
                                    mediaType={message.mediaType || ''}
                                    content={message.content || ''}
                                    direction={message.direction}
                                    timestamp={message.timestamp}
                                    status={message.status}
                                    mediaFilename={(message as any).mediaFilename}
                                    mediaSize={(message as any).mediaSize}
                                  />
                                </div>
                              )}

                              {/* Regular text message */}
                              {!(message.mediaUrl && message.mediaType) && (
                                <div className="px-4 py-3">
                                  <p className="inbox-message-text text-sm leading-relaxed break-words">{message.content}</p>
                                  <div className="flex items-center justify-end mt-2 space-x-2">
                                    <span className={`inbox-message-time text-xs font-medium ${
                                      message.direction === 'outgoing'
                                        ? 'text-white/80'
                                        : 'text-muted-foreground'
                                    }`}>
                                      {formatTime(message.timestamp)}
                                    </span>
                                    {message.direction === 'outgoing' && (
                                      <MessageStatusIndicator
                                        status={message.status || 'sent'}
                                        className="text-white/80"
                                      />
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Typing Indicator - Temporarily disabled */}
              {/* <TypingIndicator isVisible={false} userName={selectedContact?.name || 'Contact'} /> */}

              {/* Message Input - Fixed at bottom */}
              <div
                className={`flex-shrink-0 border-t border-border/30 bg-card inbox-input-container transition-all duration-200 ${
                  isDragOver ? 'bg-primary/5 border-primary/30' : ''
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* Selected File Preview */}
                {selectedFile && (
                  <div className="p-3 border-b border-border/30 bg-muted/30">
                    <div className="bg-background rounded-lg p-3">
                      <div className="flex items-start space-x-3">
                        {/* File Preview */}
                        <div className="flex-shrink-0">
                          {selectedFile?.type.startsWith('image/') ? (
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                              <img
                                src={URL.createObjectURL(selectedFile)}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                              {selectedFile.type.startsWith('video/') && <Video className="w-8 h-8 text-primary" />}
                              {selectedFile.type.startsWith('audio/') && <Music className="w-8 h-8 text-primary" />}
                              {!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/') && !selectedFile.type.startsWith('audio/') && <FileText className="w-8 h-8 text-primary" />}
                            </div>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type.split('/')[0]}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={removeSelectedFile}
                              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Drag and Drop Overlay */}
                {isDragOver && (
                  <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center z-10">
                    <div className="text-center">
                      <Paperclip className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium text-primary">Drop file to attach</p>
                    </div>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFileUpload}
                      className="rounded-xl h-9 w-9 p-0 flex-shrink-0 hover:bg-primary/10"
                      title="Attach file"
                    >
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        disabled={sendMessageMutation.isPending || sendMediaMutation.isPending}
                        className="pr-12 bg-background border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-lg h-8 w-8 p-0"
                      >
                        <Smile className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                    <Button
                      onClick={sendMessage}
                      disabled={(!newMessage.trim() && !selectedFile) || sendMessageMutation.isPending || sendMediaMutation.isPending}
                      className={`rounded-xl px-4 py-2 transition-all duration-300 flex-shrink-0 ${
                        selectedFile
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      }`}
                      title={selectedFile ? `Send ${selectedFile.name}` : 'Send message'}
                    >
                      {(sendMessageMutation.isPending || sendMediaMutation.isPending) ? (
                        <div className="flex items-center space-x-2">
                          <Spinner size="sm" />
                          <span className="text-xs">
                            {selectedFile ? 'Uploading...' : 'Sending...'}
                          </span>
                        </div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        ) : selectedNumber ? (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="text-center space-y-6 p-12 max-w-md">
              <div className="relative">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                  <MessageSquare className="h-16 w-16 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white animate-bounce"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white animate-ping"></div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Select a conversation
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Choose a conversation from the sidebar to start your real-time WhatsApp messaging experience
                </p>
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-background">
            <div className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a conversation</h3>
              <p className="text-muted-foreground text-sm">
                Choose a conversation from the sidebar to start your real-time WhatsApp messaging experience
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxContent;
