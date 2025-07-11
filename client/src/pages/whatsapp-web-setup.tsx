import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/hooks/useSocket';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import SessionCleanup from '@/components/whatsapp/session-cleanup';
import {
  QrCode,
  Smartphone,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Phone,
  MessageCircle,
  Wifi,
  WifiOff,
  Settings
} from 'lucide-react';

interface WhatsAppWebSession {
  sessionId: string;
  status: string;
  phoneNumber?: string;
  userId: string;
  createdAt: string;
  lastActivity?: string;
}

export default function WhatsAppWebSetup() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [showCleanup, setShowCleanup] = useState<boolean>(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [cleaningDuplicates, setCleaningDuplicates] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const socket = useSocket();

  // Fetch active WhatsApp Web sessions
  const { data: sessions = [], isLoading: sessionsLoading, refetch: refetchSessions } = useQuery({
    queryKey: ['/api/whatsapp-web/sessions'],
    refetchInterval: 3000, // Reduced interval for better real-time feel
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/whatsapp-web/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create session');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setCurrentSessionId(data.sessionId);
        setQrCode(data.qrCode);
        setConnectionStatus('qr_ready');
        
        toast({
          title: "QR Code Generated",
          description: "Scan the QR code with your WhatsApp mobile app",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create WhatsApp session",
        variant: "destructive",
      });
    },
  });

  // Disconnect session mutation
  const disconnectMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/whatsapp-web/disconnect/${sessionId}`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to disconnect session');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setQrCode(null);
      setCurrentSessionId(null);
      setConnectionStatus('disconnected');
      setConnectedPhone(null);
      refetchSessions();
      
      toast({
        title: "Disconnected",
        description: "WhatsApp session has been disconnected",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect session",
        variant: "destructive",
      });
    },
  });

  // Cleanup duplicates mutation
  const cleanupDuplicatesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/whatsapp/cleanup-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cleanup duplicates');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Duplicates Cleaned",
        description: `Removed ${data.removed} duplicate WhatsApp numbers`,
      });
      refetchSessions();
      setCleaningDuplicates(false);
    },
    onError: (error: any) => {
      toast({
        title: "Cleanup Failed",
        description: error.message || "Failed to cleanup duplicates",
        variant: "destructive",
      });
      setCleaningDuplicates(false);
    },
  });

  // Force reconnect mutation
  const forceReconnectMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/whatsapp-web/force-reconnect/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to force reconnect session');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Force Reconnection Started",
        description: "WhatsApp session force reconnection has been initiated. This will reset all retry attempts.",
      });
      refetchSessions();
    },
    onError: (error: any) => {
      toast({
        title: "Force Reconnection Failed",
        description: error.message || "Failed to force reconnect WhatsApp session",
        variant: "destructive",
      });
    },
  });

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleQRCode = (data: any) => {
      console.log('📱 WhatsApp Web QR received:', data);
      if (data.sessionId === currentSessionId) {
        setQrCode(data.qrCode);
        setConnectionStatus('qr_ready');
      }
    };

    const handleConnected = (data: any) => {
      console.log('🎉 WhatsApp Web connected:', data);
      if (data.sessionId === currentSessionId) {
        setConnectionStatus('connected');
        setConnectedPhone(data.phoneNumber);
        setQrCode(null);
        refetchSessions();
        
        toast({
          title: "WhatsApp Connected!",
          description: `Successfully connected ${data.phoneNumber}`,
        });
      }
    };

    const handleStatusChange = (data: any) => {
      console.log('📱 WhatsApp Web status changed:', data);
      if (data.sessionId === currentSessionId) {
        setConnectionStatus(data.status);

        if (data.status === 'disconnected') {
          setQrCode(null);
          setConnectedPhone(null);
          refetchSessions();
        }
      }
    };

    const handleSessionUpdate = (data: any) => {
      console.log('📱 WhatsApp Web session update:', data);
      // Always refetch sessions for real-time sync
      refetchSessions();

      if (data.sessionId === currentSessionId) {
        setConnectionStatus(data.status);
        if (data.phoneNumber) {
          setConnectedPhone(data.phoneNumber);
        }
        if (data.connected && data.status === 'ready') {
          setQrCode(null);
          toast({
            title: "WhatsApp Connected!",
            description: `Successfully connected to ${data.phoneNumber}`,
          });
        }
      }
    };

    const handleDuplicateDetected = (data: any) => {
      console.log('🚫 Duplicate WhatsApp number detected:', data);

      if (data.sessionId === currentSessionId) {
        setConnectionStatus('error');
        setQrCode(null);
        setCurrentSessionId(null);
        setDuplicateWarning(data.message || "This WhatsApp number is already connected to another account");

        toast({
          title: "Duplicate Number Detected",
          description: data.message || "This WhatsApp number is already connected to another account",
          variant: "destructive",
        });
      }

      // Refresh sessions to update the UI
      refetchSessions();
    };

    socket.on('whatsapp_web_qr', handleQRCode);
    socket.on('whatsapp_web_qr_code', handleQRCode); // Alternative event name
    socket.on('whatsapp_web_connected', handleConnected);
    socket.on('whatsapp_connected', handleConnected); // Alternative event name
    socket.on('whatsapp_web_status_changed', handleStatusChange);
    socket.on('whatsapp_web_session_update', handleSessionUpdate);
    socket.on('whatsapp_duplicate_detected', handleDuplicateDetected);

    return () => {
      socket.off('whatsapp_web_qr', handleQRCode);
      socket.off('whatsapp_web_qr_code', handleQRCode);
      socket.off('whatsapp_web_connected', handleConnected);
      socket.off('whatsapp_connected', handleConnected);
      socket.off('whatsapp_web_status_changed', handleStatusChange);
      socket.off('whatsapp_web_session_update', handleSessionUpdate);
      socket.off('whatsapp_duplicate_detected', handleDuplicateDetected);
    };
  }, [socket, currentSessionId, refetchSessions, toast]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'qr_ready':
        return <QrCode className="w-5 h-5 text-blue-500" />;
      case 'initializing':
        return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <WifiOff className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string, connected?: boolean) => {
    // Prioritize connected status if available
    if (connected === true && (status === 'ready' || status === 'connected')) {
      return 'Active & Connected';
    }

    switch (status) {
      case 'connected':
      case 'ready':
        return 'Connected';
      case 'authenticated':
        return 'Authenticated';
      case 'qr_ready':
        return 'QR Code Ready';
      case 'initializing':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Error';
      default:
        return status || 'Unknown';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="WhatsApp Web Setup"
          subtitle="Connect your WhatsApp using whatsapp-web.js"
          primaryAction={{
            label: socket?.connected ? 'Live' : 'Offline',
            onClick: () => {},
            variant: socket?.connected ? 'default' : 'secondary'
          }}
          secondaryAction={{
            label: showCleanup ? 'Hide Cleanup' : 'Session Cleanup',
            onClick: () => setShowCleanup(!showCleanup),
            variant: 'outline',
            icon: Settings
          }}
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="container mx-auto space-y-6">

            {/* Session Cleanup Section */}
            {showCleanup && (
              <SessionCleanup />
            )}

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Active WhatsApp Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <Smartphone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No active WhatsApp sessions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session: WhatsAppWebSession) => (
                <div key={session.sessionId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(session.status)}
                    <div>
                      <p className="font-medium">{session.phoneNumber || 'Unknown Number'}</p>
                      <p className="text-sm text-gray-500">{getStatusText(session.status, session.connected)}</p>
                      {session.lastActivity && (
                        <p className="text-xs text-gray-400">
                          Last active: {new Date(session.lastActivity).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        session.connected && session.status === 'ready'
                          ? 'default'
                          : session.status === 'ready'
                            ? 'secondary'
                            : 'outline'
                      }
                      className={
                        session.connected && session.status === 'ready'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : session.status === 'initializing'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : session.status === 'disconnected'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : session.status === 'error'
                                ? 'bg-orange-100 text-orange-800 border-orange-200'
                                : ''
                      }
                    >
                      {session.connected && session.status === 'ready' ? 'Active' : session.status}
                    </Badge>

                    {/* Show Force Reconnect button for disconnected or error sessions */}
                    {(session.status === 'disconnected' || session.status === 'error') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => forceReconnectMutation.mutate(session.sessionId)}
                        disabled={forceReconnectMutation.isPending}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        {forceReconnectMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-1" />
                        )}
                        Force Reconnect
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectMutation.mutate(session.sessionId)}
                      disabled={disconnectMutation.isPending}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Section */}
      {qrCode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Scan QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-4">
              <img
                src={qrCode}
                alt="WhatsApp QR Code"
                className="mx-auto border rounded-lg shadow-lg"
                style={{ width: '256px', height: '256px' }}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                1. Open WhatsApp on your phone
              </p>
              <p className="text-sm text-gray-600">
                2. Go to Settings → Linked Devices
              </p>
              <p className="text-sm text-gray-600">
                3. Tap "Link a Device" and scan this QR code
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => disconnectMutation.mutate(currentSessionId!)}
              disabled={disconnectMutation.isPending}
              className="mt-4"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Connect New Session */}
      {!qrCode && connectionStatus !== 'connected' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Connect New WhatsApp Number
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              Connect your WhatsApp number using the official WhatsApp Web protocol
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => createSessionMutation.mutate()}
                disabled={createSessionMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {createSessionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4 mr-2" />
                )}
                Generate QR Code
              </Button>

              <Button
                onClick={() => {
                  setCleaningDuplicates(true);
                  cleanupDuplicatesMutation.mutate();
                }}
                disabled={cleanupDuplicatesMutation.isPending || cleaningDuplicates}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                {cleanupDuplicatesMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4 mr-2" />
                )}
                Clean Duplicates
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Alert */}
      {connectionStatus === 'connected' && connectedPhone && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            WhatsApp successfully connected to {connectedPhone}. You can now send and receive messages.
          </AlertDescription>
        </Alert>
      )}
          </div>
        </main>
      </div>
    </div>
  );
}
