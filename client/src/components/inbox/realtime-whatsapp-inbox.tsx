import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageStatusIndicator } from '@/components/ui/message-status-indicator';
import { MediaMessage } from './media-message';
import useAutoFontSystem from '@/hooks/useAutoFontSystem';
import { CuteAvatar } from '@/components/ui/cute-avatar';
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
  X,
  Bot,
  BotOff,
  Shield,
  ShieldOff,
  UserX,
  UserCheck,
  Trash2,

  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Users,
  Download,
  Share,
  Copy,
  Archive,
  Pin,
  Mic,
  MicOff,
  Camera,
  MapPin,
  Calendar,
  Heart,
  ThumbsUp,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
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
  ai_enabled?: boolean;
  is_blocked?: boolean;
}

interface Conversation {
  id: string;
  contactId: string;
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
  // Auto-font system hook for responsive font scaling
  const { getAutoFontClass, getAutoSpacingClass, getAutoButtonClass, getAutoHeaderClass } = useAutoFontSystem();

  const [selectedNumber, setSelectedNumber] = useState<WhatsAppNumber | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'pinned'>('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAllChats, setShowAllChats] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [preSelectedPhone, setPreSelectedPhone] = useState<string | null>(null);
  const [isAiActive, setIsAiActive] = useState(false);
  const [isContactBlocked, setIsContactBlocked] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [lastSeen, setLastSeen] = useState<string>('');
  const [isOnline, setIsOnline] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [messageReactions, setMessageReactions] = useState<{[key: string]: string[]}>({});
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [sidebarWidth, setSidebarWidth] = useState(500); // Default sidebar width
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationsScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousStatusRef = useRef<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Header visibility control
  const { setHeaderVisible } = useHeaderVisibility();

  // Sidebar resize functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleDoubleClick = () => {
    setSidebarWidth(500); // Reset to default width
    toast({
      title: "Sidebar Reset",
      description: "Sidebar width reset to default (500px)",
    });
  };



  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const newWidth = e.clientX;
    const minWidth = 280;
    const maxWidth = Math.min(800, window.innerWidth * 0.6); // Max 60% of screen width or 800px

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Add global mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);



  // Save sidebar width to localStorage
  useEffect(() => {
    localStorage.setItem('whatsapp-sidebar-width', sidebarWidth.toString());
  }, [sidebarWidth]);

  // Load sidebar width from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem('whatsapp-sidebar-width');
    if (savedWidth) {
      const width = parseInt(savedWidth);
      if (width >= 280 && width <= 800) {
        setSidebarWidth(width);
      }
    }
  }, []);

  // Keyboard shortcuts for sidebar width
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '[':
            e.preventDefault();
            setSidebarWidth(prev => Math.max(280, prev - 20));
            break;
          case ']':
            e.preventDefault();
            setSidebarWidth(prev => Math.min(800, prev + 20));
            break;
          case '\\':
            e.preventDefault();
            setSidebarWidth(500); // Reset to default
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Responsive behavior - disable resize on mobile
  const isMobile = window.innerWidth < 768;

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
  const { data: rawWhatsappNumbers = [], isLoading: numbersLoading, refetch: refetchNumbers } = useQuery({
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

  // Filter out disconnected duplicates - prefer connected numbers over disconnected ones
  const whatsappNumbers = React.useMemo(() => {
    if (!Array.isArray(rawWhatsappNumbers)) return [];

    // Group by phone number
    const phoneGroups = new Map<string, any[]>();

    rawWhatsappNumbers.forEach((number: any) => {
      const phoneNumber = number.phoneNumber;
      if (!phoneNumber) return;

      if (!phoneGroups.has(phoneNumber)) {
        phoneGroups.set(phoneNumber, []);
      }
      phoneGroups.get(phoneNumber)!.push(number);
    });

    // For each phone number, prefer connected over disconnected
    const filteredNumbers: any[] = [];

    phoneGroups.forEach((numbers, phoneNumber) => {
      if (numbers.length === 1) {
        // Only one number for this phone, keep it
        filteredNumbers.push(numbers[0]);
      } else {
        // Multiple numbers for same phone, prefer connected ones
        const connectedNumbers = numbers.filter(n => n.status === 'connected' || n.isActive);
        const disconnectedNumbers = numbers.filter(n => n.status === 'disconnected' && !n.isActive);

        if (connectedNumbers.length > 0) {
          // Keep only connected numbers, prefer the most recent one
          const mostRecent = connectedNumbers.sort((a, b) => b.id - a.id)[0];
          filteredNumbers.push(mostRecent);
          console.log(`🔄 Filtered duplicate: Keeping connected ${phoneNumber} (ID: ${mostRecent.id}), hiding ${disconnectedNumbers.length} disconnected duplicates`);
        } else {
          // No connected numbers, keep the most recent disconnected one
          const mostRecent = disconnectedNumbers.sort((a, b) => b.id - a.id)[0];
          filteredNumbers.push(mostRecent);
        }
      }
    });

    console.log(`📱 Filtered WhatsApp numbers: ${rawWhatsappNumbers.length} → ${filteredNumbers.length} (removed ${rawWhatsappNumbers.length - filteredNumbers.length} duplicates)`);
    return filteredNumbers;
  }, [rawWhatsappNumbers]);

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

  // AI toggle mutation with real-time sync
  const toggleAiMutation = useMutation({
    mutationFn: async (data: { contactId: string; aiActive: boolean }) => {
      console.log('🤖 Toggling AI for contact:', data);
      return apiRequest('POST', '/api/contacts/toggle-ai', data);
    },
    onSuccess: (_, variables) => {
      setIsAiActive(variables.aiActive);
      // Trigger real-time sync
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/conversations'] });
      toast({
        title: variables.aiActive ? "AI Assistant Activated" : "AI Assistant Deactivated",
        description: variables.aiActive ? "AI will now respond to messages" : "AI responses disabled",
      });
    },
    onError: (error: any) => {
      console.error('❌ AI toggle error:', error);
      toast({
        title: "Failed to toggle AI",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Block/Unblock mutation with real-time sync
  const toggleBlockMutation = useMutation({
    mutationFn: async (data: { contactId: string; blocked: boolean }) => {
      console.log('🚫 Toggling block for contact:', data);
      return apiRequest('POST', '/api/contacts/toggle-block', data);
    },
    onSuccess: (_, variables) => {
      setIsContactBlocked(variables.blocked);
      // Trigger real-time sync
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/conversations'] });
      toast({
        title: variables.blocked ? "Contact Blocked" : "Contact Unblocked",
        description: variables.blocked ? "Messages from this contact will be ignored" : "Contact can now send messages",
      });
    },
    onError: (error: any) => {
      console.error('❌ Block toggle error:', error);
      toast({
        title: "Failed to update block status",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Pin/Unpin conversation mutation
  const togglePinMutation = useMutation({
    mutationFn: async (data: { contactId: string; pinned: boolean }) => {
      console.log('📌 Toggling pin for contact:', data);
      return apiRequest('POST', '/api/contacts/toggle-pin', data);
    },
    onSuccess: (_, variables) => {
      setIsPinned(variables.pinned);
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/conversations'] });
      toast({
        title: variables.pinned ? "Conversation Pinned" : "Conversation Unpinned",
        description: variables.pinned ? "This conversation is now pinned to the top" : "Conversation removed from pinned",
      });
    },
    onError: (error: any) => {
      console.error('❌ Pin toggle error:', error);
      toast({
        title: "Failed to toggle pin status",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      console.log('📖 Marking messages as read for conversation:', conversationId);
      return apiRequest('POST', `/api/whatsapp/conversations/${conversationId}/mark-read`);
    },
    onSuccess: () => {
      // Refresh conversations to update unread counts
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/conversations'] });
    },
    onError: (error: any) => {
      console.error('❌ Error marking messages as read:', error);
    },
  });

  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (contactId: string) => {
      console.log('🗑️ Deleting chat for contact:', contactId);
      try {
        const response = await apiRequest('DELETE', `/api/conversations/contact/${contactId}`);
        console.log('🗑️ Delete response:', response);
        return response;
      } catch (error) {
        console.error('🗑️ Delete API error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('✅ Chat deleted successfully:', data);
      setSelectedContact(null);
      setShowDeleteConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/conversations'] });
      toast({
        title: "Chat deleted",
        description: "All messages with this contact have been deleted",
      });
    },
    onError: (error: any) => {
      console.error('❌ Delete chat error:', error);
      setShowDeleteConfirm(false); // Close dialog even on error
      toast({
        title: "Failed to delete chat",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Fetch contact profile information including photo
  const { data: contactProfile } = useQuery({
    queryKey: ['/api/whatsapp/contact-profile', selectedContact?.id],
    queryFn: () => apiRequest('GET', `/api/whatsapp/contact-profile/${selectedContact?.id}`),
    enabled: !!selectedContact?.id,
    refetchInterval: 10000, // Refresh profile data every 10 seconds
    staleTime: 5000,
  });

  // Real-time contact status (online/offline, last seen)
  const { data: contactStatus } = useQuery({
    queryKey: ['/api/whatsapp/contact-status', selectedContact?.phone],
    queryFn: () => apiRequest('GET', `/api/whatsapp/contact-status/${selectedContact?.phone}`),
    enabled: !!selectedContact?.phone,
    refetchInterval: 5000, // Check status every 5 seconds
    staleTime: 2000,
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

      // Step 3: Sync chats for each connected number using WhatsApp Web service
      for (const number of connectedNumbers) {
        try {
          console.log(`🔄 Syncing chats for ${number.phoneNumber} (ID: ${number.id})...`);

          // Use the new WhatsApp Web service sync endpoint for real-time chat sync
          if (number.sessionId) {
            console.log(`📱 Making request to: /api/whatsapp/sessions/${number.sessionId}/sync-chats-new`);
            const syncResponse = await apiRequest('POST', `/api/whatsapp/sessions/${number.sessionId}/sync-chats-new`);
            console.log(`✅ Real-time chat sync response for ${number.phoneNumber}:`, syncResponse);
          } else {
            // Fallback to the old sync method
            console.log(`📱 Making request to: /api/whatsapp/sync-chats/${number.id}`);
            const syncResponse = await apiRequest('POST', `/api/whatsapp/sync-chats/${number.id}`);
            console.log(`✅ Sync response for ${number.phoneNumber}:`, syncResponse);
          }
        } catch (syncError) {
          console.error(`❌ Failed to sync chats for ${number.phoneNumber}:`, syncError);
          console.error(`❌ Error details:`, {
            numberId: number.id,
            phoneNumber: number.phoneNumber,
            status: number.status,
            sessionId: number.sessionId,
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

  // Delete all chats mutation
  const deleteAllChatsMutation = useMutation({
    mutationFn: async () => {
      console.log('🗑️ Starting delete ALL chats operation...');
      console.log('🗑️ Making API request to: DELETE /api/conversations/all');

      try {
        const response = await apiRequest('DELETE', '/api/conversations/all');
        console.log('✅ Delete all chats API response:', response);
        return response;
      } catch (error) {
        console.error('❌ Delete all chats API error:', error);
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          error
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('✅ All chats deleted successfully:', data);
      setSelectedContact(null);
      setShowDeleteAllConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/conversations'] });
      toast({
        title: "All Chats Deleted",
        description: `Deleted ${data.deletedConversations} conversations and ${data.deletedMessages} messages`,
      });
    },
    onError: (error: any) => {
      console.error('❌ Delete all chats failed:', error);
      setShowDeleteAllConfirm(false);
      toast({
        title: "Error",
        description: error.message || "Failed to delete all chats",
        variant: "destructive",
      });
    },
  });

  // Pin/Unpin conversation mutation
  const pinConversationMutation = useMutation({
    mutationFn: async ({ conversationId, isPinned }: { conversationId: number, isPinned: boolean }) => {
      console.log(`📌 ${isPinned ? 'Unpinning' : 'Pinning'} conversation:`, conversationId);
      const response = await apiRequest('PATCH', `/api/conversations/${conversationId}/pin`, {
        isPinned: !isPinned
      });
      console.log('✅ Pin/Unpin response:', response);
      return response;
    },
    onSuccess: (data, variables) => {
      console.log('✅ Pin/Unpin successful:', data);
      refetchConversations();
      toast({
        title: variables.isPinned ? "Chat Unpinned" : "Chat Pinned",
        description: variables.isPinned ? "Chat moved to regular chats" : "Chat moved to pinned section",
      });
    },
    onError: (error: any) => {
      console.error('❌ Pin/Unpin failed:', error);
      toast({
        title: "Pin Failed",
        description: error.message || "Failed to pin/unpin chat",
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
          id: matchingConversation.contactId || matchingConversation.id, // Use contactId if available
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

  // Deduplicate, filter and sort conversations
  const filteredConversations = React.useMemo(() => {
    // First deduplicate by phone number
    const phoneMap = new Map<string, Conversation>();

    for (const conversation of conversations) {
      const phone = conversation.contactPhone;
      if (!phone) continue;

      // Normalize phone number for comparison
      const normalizedPhone = phone.replace(/\D/g, '');
      const key = normalizedPhone.length === 10 ? '91' + normalizedPhone : normalizedPhone;

      if (!phoneMap.has(key)) {
        phoneMap.set(key, conversation);
      } else {
        // Keep the more recent conversation
        const existing = phoneMap.get(key)!;
        const existingDate = new Date(existing.lastMessageAt || 0).getTime();
        const currentDate = new Date(conversation.lastMessageAt || 0).getTime();

        if (currentDate > existingDate) {
          phoneMap.set(key, conversation);
        }
      }
    }

    const deduplicatedConversations = Array.from(phoneMap.values());

    // Then filter and sort
    return deduplicatedConversations
      .filter((conversation: Conversation) => {
        if (filter === 'unread' && (!conversation.unreadCount || conversation.unreadCount === 0)) {
          return false;
        }
        if (filter === 'pinned' && !conversation.isPinned) {
          return false;
        }
        if (showPinnedOnly && !conversation.isPinned) {
          return false;
        }
        if (searchQuery && !conversation.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !conversation.contactPhone?.includes(searchQuery)) {
          return false;
        }
        return true;
      })
      .sort((a: Conversation, b: Conversation) => {
        // Sort pinned conversations first, then by lastMessageAt
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        // Then sort by lastMessageAt in descending order (newest first)
        const dateA = new Date(a.lastMessageAt || 0).getTime();
        const dateB = new Date(b.lastMessageAt || 0).getTime();
        return dateB - dateA;
      });
  }, [conversations, filter, searchQuery, showPinnedOnly]);

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

    // Extract session ID from session data
    let sessionId = whatsappNumber.id; // fallback to ID
    if (whatsappNumber.session_data) {
      try {
        const sessionData = typeof whatsappNumber.session_data === 'string'
          ? JSON.parse(whatsappNumber.session_data)
          : whatsappNumber.session_data;
        if (sessionData.sessionId) {
          sessionId = sessionData.sessionId;
        }
      } catch (error) {
        console.warn('Failed to parse session data:', error);
      }
    }

    console.log(`📤 Sending message with session ID: ${sessionId}`);

    // Send media file if selected
    if (selectedFile) {
      setIsUploadingMedia(true);
      sendMediaMutation.mutate({
        to: selectedContact.phone,
        file: selectedFile,
        sessionId: sessionId,
        caption: newMessage.trim() || undefined,
      });
    } else {
      // Send text message
      sendMessageMutation.mutate({
        to: selectedContact.phone,
        message: newMessage,
        sessionId: sessionId,
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

  // Listen for message status updates (delivery and read receipts)
  useSocketEvent('whatsapp_web_message_status_update', (data) => {
    console.log('📊 Message status update received:', data);
    // Show toast notification for status updates in development
    if (process.env.NODE_ENV === 'development') {
      toast({
        title: "Message Status Update",
        description: `Message ${data.status}: ${data.messageId}`,
        duration: 2000,
      });
    }
    // Refresh messages to show updated status
    if (selectedContact?.id) {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/messages', selectedContact.id] });
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load contact status when contact is selected
  useEffect(() => {
    if (selectedContact) {
      // Load AI status and block status from contact data
      setIsAiActive(selectedContact.ai_enabled || false);
      setIsContactBlocked(selectedContact.is_blocked || false);
    }
  }, [selectedContact]);

  // Monitor WhatsApp connection status changes
  useEffect(() => {
    if (selectedNumber) {
      if (previousStatusRef.current && previousStatusRef.current !== selectedNumber.status) {
        // Status changed, show notification
        if (selectedNumber.status === 'connected') {
          toast({
            title: "WhatsApp Connected",
            description: `${selectedNumber.phoneNumber} is now connected`,
            duration: 3000,
          });
        } else if (selectedNumber.status === 'disconnected') {
          toast({
            title: "WhatsApp Disconnected",
            description: `${selectedNumber.phoneNumber} has been disconnected`,
            variant: "destructive",
            duration: 5000,
          });
        }
      }

      previousStatusRef.current = selectedNumber.status;
    }
  }, [selectedNumber?.status, toast]);

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
    <div className={`inbox-layout-stable inbox-container h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex ${getAutoFontClass('base')}`}>
      {/* Left Sidebar */}
      <div
        ref={sidebarRef}
        className="border-r border-green-200/50 inbox-sidebar-stable bg-white/80 backdrop-blur-sm relative flex-shrink-0"
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Advanced Header with Real-time Sync */}
        <div className={`flex-shrink-0 bg-gradient-to-r from-green-50 via-white to-green-50 border-b border-green-200/60 sticky top-0 z-20 shadow-sm backdrop-blur-md ${getAutoSpacingClass('base')}`}>
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-green-600 font-medium ${getAutoFontClass('sm')}`}>
                  {whatsappNumbers.length} connected
                </span>
                {!isMobile && (
                  <span className={`bg-green-100 text-green-700 px-2 py-0.5 rounded ${getAutoFontClass('xs')}`}>
                    {sidebarWidth}px
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 border-green-300 hover:bg-green-500 hover:text-white rounded-lg h-8 px-3 text-xs transition-all duration-300 shadow-sm hover:shadow-md"
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
                  "h-3 w-3 mr-1",
                  (forceRefreshMutation.isPending || cleanupDisconnectedMutation.isPending) && "animate-spin"
                )} />
                <span className="font-medium">Sync</span>
              </Button>

              {/* Pin Chats Toggle Button */}
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-300 hover:bg-blue-500 hover:text-white rounded-lg h-8 px-3 text-xs transition-all duration-300 shadow-sm hover:shadow-md"
                onClick={() => {
                  setShowPinnedOnly(!showPinnedOnly);
                }}
                title={showPinnedOnly ? "Show All Chats" : "Show Pinned Chats Only"}
              >
                <Pin className={cn(
                  "h-3 w-3 mr-1",
                  showPinnedOnly && "text-blue-600"
                )} />
                <span className="font-medium">{showPinnedOnly ? "All" : "Pin"}</span>
              </Button>

              {/* Delete All Chats Button */}
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-500 hover:text-white rounded-lg h-8 px-3 text-xs transition-all duration-300 shadow-sm hover:shadow-md"
                onClick={() => {
                  setShowDeleteAllConfirm(true);
                }}
                disabled={deleteAllChatsMutation.isPending}
                title="Delete All Chats from Database"
              >
                <Trash2 className={cn(
                  "h-3 w-3 mr-1",
                  deleteAllChatsMutation.isPending && "animate-pulse"
                )} />
                <span className="font-medium">Delete</span>
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
            <SelectTrigger className="bg-white border-green-200 text-green-800 rounded-xl hover:bg-green-50 transition-all duration-300 text-sm md:text-base shadow-sm">
              <SelectValue placeholder="Select WhatsApp Number" className="text-green-800" />
            </SelectTrigger>
            <SelectContent className="bg-white border-green-200 rounded-xl shadow-lg">
              {/* All Number chats option */}
              <SelectItem
                value="all"
                className="rounded-lg cursor-pointer hover:bg-blue-50 text-blue-800"
              >
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500" />
                  <span className="font-medium text-blue-800 text-sm md:text-base">All Number chats</span>
                </div>
              </SelectItem>

              {whatsappNumbers.map((number: any) => (
                <div key={number.id} className="relative group">
                  <SelectItem
                    value={number.id}
                    className="rounded-lg cursor-pointer hover:bg-blue-50 text-blue-800 pr-10"
                  >
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className={cn(
                        "w-2 h-2 md:w-3 md:h-3 rounded-full",
                        number.status === 'connected' ? 'bg-green-400' : 'bg-red-400'
                      )} />
                      <span className="font-medium text-blue-800 text-sm md:text-base">{number.phoneNumber}</span>
                      <span className="text-xs text-blue-600">
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
        <div className="flex-shrink-0 p-3 md:p-4 border-b border-green-200/50 bg-green-50/30">
          <div className="relative mb-2 md:mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 h-3 w-3 md:h-4 md:w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 md:pl-10 bg-white border-green-200 rounded-xl text-green-800 text-sm md:text-base h-8 md:h-10 focus:border-green-400 focus:ring-green-200"
            />
          </div>
        </div>

        {/* Enhanced Conversations List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full inbox-conversations-scroll" ref={conversationsScrollRef}>
            <div className="inbox-conversations-container">
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
                filteredConversations.map((conversation: Conversation, index) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      setSelectedContact({
                        id: conversation.contactId || conversation.id,
                        name: conversation.contactName,
                        phone: conversation.contactPhone
                      });
                      // Mark messages as read if there are unread messages
                      if (conversation.unreadCount > 0) {
                        markAsReadMutation.mutate(conversation.id);
                      }
                    }}
                    className={cn(
                      "inbox-conversation-item group",
                      (selectedContact?.id === conversation.contactId || selectedContact?.id === conversation.id) && "selected"
                    )}
                    style={{
                      animationDelay: `${index * 0.05}s`
                    }}
                  >
                    <div className="flex items-center space-x-3 relative z-10">
                      {/* Enhanced Avatar with Cute Animation */}
                      <div className="avatar relative">
                        <Avatar className="h-14 w-14 flex-shrink-0 ring-2 ring-green-100/50 shadow-lg transition-all duration-300 group-hover:ring-green-200/70 group-hover:ring-4">
                          <AvatarImage
                            src={conversation.profilePhoto || `/api/whatsapp/profile-photo/${conversation.contactPhone}`}
                            alt={conversation.contactName || conversation.contactPhone}
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <AvatarFallback className="bg-transparent p-0 border-0">
                            <CuteAvatar
                              name={conversation.contactName || ''}
                              phone={conversation.contactPhone || ''}
                              size="md"
                              showAnimation={true}
                              className="w-full h-full"
                            />
                          </AvatarFallback>
                        </Avatar>

                        {/* Animated Unread Badge */}
                        {conversation.unreadCount && conversation.unreadCount > 0 && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                            <span className="text-xs text-white font-bold">
                              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                            </span>
                          </div>
                        )}

                        {/* Enhanced Online Status with Pulse */}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all duration-300 ${
                          conversation.isOnline
                            ? 'bg-green-400 animate-pulse'
                            : 'bg-gray-400'
                        }`}>
                          {conversation.isOnline && (
                            <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></div>
                          )}
                        </div>
                      </div>

                      {/* Enhanced Content */}
                      <div className="content flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-slate-800 truncate text-base group-hover:text-blue-700 transition-colors duration-200">
                            {conversation.contactName || conversation.contactPhone}
                          </h3>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {/* Pin Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200",
                                conversation.isPinned && "opacity-100 text-blue-600"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                pinConversationMutation.mutate({
                                  conversationId: conversation.id,
                                  isPinned: conversation.isPinned || false
                                });
                              }}
                              title={conversation.isPinned ? "Unpin chat" : "Pin chat"}
                            >
                              <Pin className={cn(
                                "h-3 w-3 transition-transform duration-200",
                                conversation.isPinned && "rotate-45 text-blue-600"
                              )} />
                            </Button>
                            <span className="text-xs text-slate-500 font-medium group-hover:text-blue-600 transition-colors">
                              {formatTime(conversation.lastMessageAt)}
                            </span>
                            <div className="w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-slate-600 truncate text-sm group-hover:text-slate-700 transition-colors duration-200">
                            {conversation.lastMessage || 'No messages yet'}
                          </p>
                          {(selectedContact?.id === conversation.contactId || selectedContact?.id === conversation.id) && (
                            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse shadow-sm"></div>
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

        {/* Resize Handle - Hidden on mobile */}
        {!isMobile && (
          <div
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-300 transition-colors duration-200 group ${
              isResizing ? 'bg-blue-400' : ''
            }`}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            title="Drag to resize sidebar • Double-click to reset • Ctrl+[ / Ctrl+] / Ctrl+\ shortcuts"
          >
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 w-3 h-8 bg-blue-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <div className="w-0.5 h-4 bg-blue-500 rounded-full mx-0.5"></div>
              <div className="w-0.5 h-4 bg-blue-500 rounded-full mx-0.5"></div>
            </div>

            {/* Width Indicator Tooltip */}
            {isResizing && (
              <div className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg z-50">
                {sidebarWidth}px
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="bg-white inbox-chat-stable flex-1 min-w-0">
        {selectedContact ? (
          <div className="flex flex-col h-full">
            {/* Advanced Fixed Chat Header with Customer Details */}
            <div className="flex-shrink-0 p-4 md:p-6 flex items-center justify-between inbox-chat-header-fixed border-b border-blue-200 bg-gradient-to-r from-blue-50 via-white to-blue-50 backdrop-blur-md shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-14 w-14 border-3 border-white shadow-lg ring-2 ring-green-200">
                    <AvatarImage
                      src={contactProfile?.profilePhoto || `/api/whatsapp/profile-photo/${selectedContact.phone}`}
                      alt={selectedContact.name || selectedContact.phone}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-transparent p-0 border-0">
                      <CuteAvatar
                        name={selectedContact.name || ''}
                        phone={selectedContact.phone || ''}
                        size="md"
                        showAnimation={true}
                        className="w-full h-full"
                      />
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-md ${
                    contactStatus?.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div className="inbox-chat-header">
                  <h3 className="font-bold text-xl text-blue-900 mb-1">
                    {selectedContact.name || 'Unknown Contact'}
                  </h3>
                  <div className="flex items-center space-x-3">
                    <p className="text-blue-600 font-semibold text-sm">{selectedContact.phone}</p>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${
                        selectedNumber?.status === 'connected'
                          ? 'bg-green-400'
                          : selectedNumber?.status === 'connecting'
                          ? 'bg-yellow-400'
                          : 'bg-red-400'
                      }`}></div>
                      <span className={`text-xs font-medium ${
                        selectedNumber?.status === 'connected'
                          ? 'text-green-600'
                          : selectedNumber?.status === 'connecting'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {selectedNumber?.status === 'connected'
                          ? 'WhatsApp Connected'
                          : selectedNumber?.status === 'connecting'
                          ? 'Connecting...'
                          : 'WhatsApp Disconnected'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-blue-600 text-sm hidden md:block">
                      {contactStatus?.isOnline ? (
                        <span className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <span>Online</span>
                        </span>
                      ) : contactStatus?.lastSeen ? (
                        `Last seen ${contactStatus.lastSeen}`
                      ) : (
                        'Last seen recently'
                      )}
                    </p>
                    {/* Status Indicators */}
                    <div className="flex items-center space-x-1">
                      {isAiActive && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                          <Bot className="h-3 w-3 mr-1" />
                          AI Active
                        </Badge>
                      )}
                      {isContactBlocked && (
                        <Badge variant="destructive" className="text-xs bg-red-100 text-red-700 border-red-200">
                          <UserX className="h-3 w-3 mr-1" />
                          Blocked
                        </Badge>
                      )}
                      {isPinned && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* AI Assistant Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!selectedContact?.id) {
                      toast({
                        title: "No contact selected",
                        description: "Please select a contact first",
                        variant: "destructive",
                      });
                      return;
                    }
                    toggleAiMutation.mutate({
                      contactId: selectedContact.id,
                      aiActive: !isAiActive
                    });
                  }}
                  className={`rounded-2xl h-10 w-10 p-0 hover:scale-110 transition-all duration-300 shadow-sm ${
                    isAiActive
                      ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                      : 'hover:bg-blue-50 text-blue-600'
                  }`}
                  title={isAiActive ? "AI Assistant Active - Click to disable" : "Activate AI Assistant"}
                  disabled={toggleAiMutation.isPending || !selectedContact?.id}
                >
                  {toggleAiMutation.isPending ? (
                    <Spinner size="sm" />
                  ) : isAiActive ? (
                    <Bot className="h-5 w-5" />
                  ) : (
                    <BotOff className="h-5 w-5" />
                  )}
                </Button>

                {/* Pin/Unpin Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!selectedContact?.id) {
                      toast({
                        title: "No contact selected",
                        description: "Please select a contact first",
                        variant: "destructive",
                      });
                      return;
                    }
                    togglePinMutation.mutate({
                      contactId: selectedContact.id,
                      pinned: !isPinned
                    });
                  }}
                  className={`rounded-2xl h-10 w-10 p-0 hover:scale-110 transition-all duration-300 shadow-sm ${
                    isPinned
                      ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                      : 'hover:bg-blue-50 text-blue-600'
                  }`}
                  title={isPinned ? "Unpin Conversation" : "Pin Conversation"}
                  disabled={togglePinMutation.isPending || !selectedContact?.id}
                >
                  {togglePinMutation.isPending ? (
                    <Spinner size="sm" />
                  ) : (
                    <Pin className="h-5 w-5" />
                  )}
                </Button>

                {/* Block/Unblock Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!selectedContact?.id) {
                      toast({
                        title: "No contact selected",
                        description: "Please select a contact first",
                        variant: "destructive",
                      });
                      return;
                    }
                    toggleBlockMutation.mutate({
                      contactId: selectedContact.id,
                      blocked: !isContactBlocked
                    });
                  }}
                  className={`rounded-2xl h-10 w-10 p-0 hover:scale-110 transition-all duration-300 shadow-sm ${
                    isContactBlocked
                      ? 'bg-red-100 hover:bg-red-200 text-red-700'
                      : 'hover:bg-blue-50 text-blue-600'
                  }`}
                  title={isContactBlocked ? "Contact Blocked - Click to unblock" : "Block Contact"}
                  disabled={toggleBlockMutation.isPending || !selectedContact?.id}
                >
                  {toggleBlockMutation.isPending ? (
                    <Spinner size="sm" />
                  ) : isContactBlocked ? (
                    <UserX className="h-5 w-5" />
                  ) : (
                    <UserCheck className="h-5 w-5" />
                  )}
                </Button>





                {/* Delete Chat */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-2xl h-10 w-10 p-0 hover:bg-red-100 hover:scale-110 transition-all duration-300 shadow-sm text-red-600"
                  title="Delete Chat"
                  disabled={!selectedContact?.id}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages Area - Scrollable */}
            <div className="flex-1 flex flex-col overflow-hidden bg-green-50/30 inbox-messages-container">
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
                        {React.useMemo(() => {
                          // Deduplicate messages by whatsapp_message_id or content+timestamp
                          const messageMap = new Map<string, Message>();

                          for (const message of messages) {
                            const key = message.whatsapp_message_id ||
                                       `${message.content}_${message.timestamp}_${message.direction}`;

                            if (!messageMap.has(key)) {
                              messageMap.set(key, message);
                            } else {
                              // Keep the message with the earlier created_at (first occurrence)
                              const existing = messageMap.get(key)!;
                              const existingTime = new Date(existing.created_at).getTime();
                              const currentTime = new Date(message.created_at).getTime();

                              if (currentTime < existingTime) {
                                messageMap.set(key, message);
                              }
                            }
                          }

                          return Array.from(messageMap.values())
                            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                        }, [messages]).map((message: Message) => (
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
                                    {/* Debug info in development */}
                                    {process.env.NODE_ENV === 'development' && message.direction === 'outgoing' && (
                                      <span className="text-xs text-white/60 ml-1">
                                        [{message.status || 'sent'}]
                                      </span>
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

                <div className="p-4 bg-blue-50/30 border-t border-blue-200/50">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFileUpload}
                      className="rounded-xl h-9 w-9 p-0 flex-shrink-0 hover:bg-blue-100 text-blue-600"
                      title="Attach file"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        disabled={sendMessageMutation.isPending || sendMediaMutation.isPending}
                        className="pr-12 bg-white border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 text-blue-800"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-lg h-8 w-8 p-0 hover:bg-blue-100 text-blue-600"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={sendMessage}
                      disabled={(!newMessage.trim() && !selectedFile) || sendMessageMutation.isPending || sendMediaMutation.isPending}
                      className={`rounded-xl px-4 py-2 transition-all duration-300 flex-shrink-0 ${
                        selectedFile
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
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
                <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Select a conversation
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Choose a conversation from the sidebar to start your real-time WhatsApp messaging experience
                </p>
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100">
            <div className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Select a conversation</h3>
              <p className="text-green-700 text-sm">
                Choose a conversation from the sidebar to start your real-time WhatsApp messaging experience
              </p>
            </div>
          </div>
        )}
      </div>



      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Delete Chat</h3>
            <p className="text-blue-700 mb-6">
              Are you sure you want to delete this chat with {selectedContact?.name || selectedContact?.phone}?
              This action cannot be undone and all messages will be permanently deleted.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteChatMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedContact) {
                    console.log('🗑️ Attempting to delete chat for contact:', selectedContact);
                    console.log('🗑️ Contact ID:', selectedContact.id);
                    deleteChatMutation.mutate(selectedContact.id);
                  } else {
                    console.error('❌ No selected contact for deletion');
                  }
                }}
                disabled={deleteChatMutation.isPending}
              >
                {deleteChatMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Chat'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Chats Confirmation Dialog */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-red-200">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Delete ALL Chats</h3>
            <p className="text-red-700 mb-6">
              ⚠️ <strong>WARNING:</strong> This will permanently delete ALL conversations and messages from the database.
              This action cannot be undone. Are you absolutely sure you want to proceed?
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteAllConfirm(false)}
                disabled={deleteAllChatsMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  console.log('🗑️ Attempting to delete ALL chats...');
                  deleteAllChatsMutation.mutate();
                }}
                disabled={deleteAllChatsMutation.isPending}
              >
                {deleteAllChatsMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Deleting All...
                  </>
                ) : (
                  'Delete ALL Chats'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InboxContent;
