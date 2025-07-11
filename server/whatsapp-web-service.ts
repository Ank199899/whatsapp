import { EventEmitter } from 'events';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

// Dynamic import for CommonJS module
let Client: any, LocalAuth: any, MessageMedia: any;

async function initWhatsAppModules() {
  const whatsappWeb = await import('whatsapp-web.js');
  // For CommonJS modules, the exports are usually on the default property
  Client = whatsappWeb.default?.Client || whatsappWeb.Client;
  LocalAuth = whatsappWeb.default?.LocalAuth || whatsappWeb.LocalAuth;
  MessageMedia = whatsappWeb.default?.MessageMedia || whatsappWeb.MessageMedia;

  console.log('🔍 WhatsApp modules loaded:', {
    Client: !!Client,
    LocalAuth: !!LocalAuth,
    MessageMedia: !!MessageMedia
  });
}

export interface WhatsAppSession {
  sessionId: string;
  id: string; // Alias for sessionId for compatibility
  client?: Client;
  status: 'initializing' | 'qr_ready' | 'authenticated' | 'ready' | 'connected' | 'disconnected' | 'error' | 'connecting';
  qrCode?: string;
  phoneNumber?: string;
  userId: string;
  createdAt: Date;
  lastActivity?: Date;
  reconnectAttempts?: number;
  lastReconnectAttempt?: Date;
  reconnectTimer?: NodeJS.Timeout;
  isReconnecting?: boolean;
}

export interface QRCodeData {
  sessionId: string;
  qrCode: string;
}

export interface MessageData {
  sessionId: string;
  from: string;
  to: string;
  body: string;
  timestamp: Date;
  messageId: string;
  isGroup: boolean;
  chatId: string;
  contactName?: string;
  mediaUrl?: string;
  mediaType?: string;
}

export class WhatsAppWebService extends EventEmitter {
  private sessions: Map<string, WhatsAppSession> = new Map();
  private qrCodeCache: Map<string, string> = new Map();
  private readonly sessionDir: string;
  private initialized: boolean = false;
  private readonly maxReconnectAttempts: number = 10;
  private readonly baseReconnectDelay: number = 5000; // 5 seconds
  private readonly maxReconnectDelay: number = 300000; // 5 minutes
  private readonly healthCheckInterval: number = 15000; // 15 seconds

  constructor() {
    super();
    this.sessionDir = path.join(process.cwd(), 'whatsapp-web-sessions');
    this.ensureSessionDirectory();
    this.restoreExistingSessions();
    this.startHealthCheck();
    this.startPersistentReconnectionMonitor();
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await initWhatsAppModules();
      this.initialized = true;
    }
  }

  private ensureSessionDirectory(): void {
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
      console.log(`📁 Created WhatsApp sessions directory: ${this.sessionDir}`);
    }
  }

  private restoreExistingSessions(): void {
    try {
      if (!fs.existsSync(this.sessionDir)) {
        return;
      }

      const sessionDirs = fs.readdirSync(this.sessionDir).filter(dir => {
        const fullPath = path.join(this.sessionDir, dir);
        return fs.statSync(fullPath).isDirectory() && dir.startsWith('session-');
      });

      console.log(`🔄 Found ${sessionDirs.length} existing session directories`);

      for (const sessionDir of sessionDirs) {
        // Extract session ID from directory name
        const sessionId = sessionDir.replace('session-', '');

        // Create a session object for existing sessions
        const session: WhatsAppSession = {
          sessionId,
          id: sessionId,
          status: 'initializing',
          userId: 'admin-user-123', // Default user for existing sessions
          createdAt: new Date(),
          lastActivity: new Date()
        };

        this.sessions.set(sessionId, session);
        console.log(`📱 Restored session: ${sessionId}`);

        // Immediately start reconnection process for existing sessions
        this.performImmediateReconnection(sessionId).catch(error => {
          console.error(`❌ Failed to auto-reconnect session ${sessionId}:`, error);
          session.status = 'disconnected';
        });
      }

      if (sessionDirs.length > 0) {
        console.log(`✅ Restored ${sessionDirs.length} WhatsApp Web sessions`);
      }
    } catch (error) {
      console.error('❌ Error restoring existing sessions:', error);
    }
  }

  private async performImmediateReconnection(sessionId: string): Promise<void> {
    try {
      console.log(`🚀 Starting immediate reconnection for session: ${sessionId}`);

      // Ensure WhatsApp modules are initialized
      await this.ensureInitialized();

      const session = this.sessions.get(sessionId);
      if (!session) {
        console.log(`❌ Session ${sessionId} not found for immediate reconnection`);
        return;
      }

      // Set status to connecting
      session.status = 'connecting';

      // Update database status to connecting
      await this.updateDatabaseStatus(sessionId, 'connecting');

      // Create new client immediately
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: sessionId,
          dataPath: this.sessionDir
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ]
        }
      });

      session.client = client;

      // Set up event handlers with auto-reconnect
      this.setupClientEventHandlersWithAutoReconnect(client, session);

      // Initialize the client immediately
      console.log(`🔄 Initializing client for session: ${sessionId}`);
      client.initialize();

    } catch (error) {
      console.error(`❌ Error in immediate reconnection for session ${sessionId}:`, error);
      const session = this.sessions.get(sessionId);
      if (session) {
        session.status = 'disconnected';
        await this.updateDatabaseStatus(sessionId, 'disconnected');
      }
    }
  }

  async createSession(userId: string): Promise<QRCodeData> {
    await this.ensureInitialized();

    // Check if user already has too many active sessions
    const userSessions = Array.from(this.sessions.values()).filter(session =>
      session.userId === userId &&
      (session.status === 'ready' || session.status === 'connected' || session.status === 'qr_ready')
    );

    if (userSessions.length >= 5) {
      throw new Error('Maximum number of active sessions reached (5). Please disconnect some sessions first.');
    }

    const sessionId = `session_${userId}_${Date.now()}`;
    console.log(`🚀 Creating WhatsApp Web session: ${sessionId} (User: ${userId})`);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.log(`⏰ QR generation timeout for session ${sessionId}`);
        reject(new Error('QR code generation timeout'));
      }, 60000); // 60 second timeout

      try {
        // Create client with LocalAuth for persistent sessions
        const client = new Client({
          authStrategy: new LocalAuth({
            clientId: sessionId,
            dataPath: this.sessionDir
          }),
          puppeteer: {
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--single-process',
              '--disable-gpu'
            ]
          }
        });

        // Create session object
        const session: WhatsAppSession = {
          sessionId,
          id: sessionId,
          client,
          status: 'initializing',
          userId,
          createdAt: new Date()
        };

        this.sessions.set(sessionId, session);

        // QR code handler
        client.on('qr', async (qrData: string) => {
          console.log(`📱 QR code received for session ${sessionId}`);
          console.log(`📱 QR data length: ${qrData.length}`);

          try {
            // Generate QR code image as base64 data URL
            const qrCodeImage = await QRCode.toDataURL(qrData, {
              width: 256,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            });

            session.qrCode = qrCodeImage;
            session.status = 'qr_ready';
            this.qrCodeCache.set(sessionId, qrCodeImage);

            // Emit QR code event
            this.emit('qr', sessionId, qrCodeImage);

            console.log(`✅ QR code generated successfully for session ${sessionId}`);
            clearTimeout(timeout);
            resolve({
              sessionId,
              qrCode: qrCodeImage
            });
          } catch (error) {
            console.error(`❌ Error generating QR code for session ${sessionId}:`, error);
            clearTimeout(timeout);
            reject(error);
          }
        });

        // Authentication success handler
        client.on('authenticated', () => {
          console.log(`🔐 Session ${sessionId} authenticated successfully`);
          session.status = 'authenticated';
          this.emit('whatsapp_status_changed', {
            sessionId,
            status: 'authenticated'
          });

          // Emit session update for real-time sync
          this.emit('whatsapp_session_update', {
            sessionId,
            status: 'authenticated',
            connected: false
          });
        });

        // Ready handler
        client.on('ready', async () => {
          console.log(`✅ Session ${sessionId} is ready!`);
          session.status = 'ready';
          session.lastActivity = new Date();

          try {
            // Get phone number
            const info = client.info;
            if (info && info.wid && info.wid.user) {
              session.phoneNumber = `+${info.wid.user}`;
              console.log(`📱 Phone number for session ${sessionId}: ${session.phoneNumber}`);
            }

            this.emit('whatsapp_status_changed', {
              sessionId,
              status: 'ready',
              phoneNumber: session.phoneNumber
            });

            this.emit('whatsapp_connected', {
              sessionId,
              phoneNumber: session.phoneNumber,
              name: info?.pushname || 'Unknown'
            });

            // Emit session update for real-time sync
            this.emit('whatsapp_session_update', {
              sessionId,
              status: 'ready',
              phoneNumber: session.phoneNumber,
              connected: true,
              lastActivity: session.lastActivity
            });
          } catch (error) {
            console.error(`❌ Error getting phone number for session ${sessionId}:`, error);
          }
        });

        // Message handler with enhanced debugging
        client.on('message', async (message) => {
          try {
            console.log(`📨 New message received in session ${sessionId}:`, {
              from: message.from,
              to: message.to,
              body: message.body,
              type: message.type,
              hasMedia: message.hasMedia,
              isFromMe: message.fromMe,
              timestamp: message.timestamp
            });

            // Skip messages sent by us
            if (message.fromMe) {
              console.log(`⏭️ Skipping outgoing message from session ${sessionId}`);
              return;
            }

            const contact = await message.getContact();
            const chat = await message.getChat();

            const messageData: MessageData = {
              sessionId,
              from: message.from,
              to: message.to || '',
              body: message.body,
              timestamp: new Date(message.timestamp * 1000),
              messageId: message.id.id,
              isGroup: chat.isGroup,
              chatId: message.from,
              contactName: contact.name || contact.pushname || contact.number
            };

            console.log(`📋 Processed message data:`, messageData);

            // Handle media messages
            if (message.hasMedia) {
              try {
                const media = await message.downloadMedia();
                if (media) {
                  messageData.mediaType = media.mimetype;
                  messageData.mediaUrl = `data:${media.mimetype};base64,${media.data}`;
                }
              } catch (error) {
                console.error('Error downloading media:', error);
              }
            }

            console.log(`🚀 Emitting whatsapp_message_received event for session ${sessionId}`);
            this.emit('whatsapp_message_received', messageData);
            session.lastActivity = new Date();
          } catch (error) {
            console.error(`❌ Error processing message in session ${sessionId}:`, error);
          }
        });

        // Message acknowledgment handler (delivery and read receipts)
        client.on('message_ack', async (message, ack) => {
          try {
            console.log(`📊 Message acknowledgment received in session ${sessionId}:`, {
              messageId: message.id.id,
              ack: ack
            });

            let status = 'sent';
            if (ack === 2) {
              status = 'delivered';
            } else if (ack === 3) {
              status = 'read';
            }

            this.emit('whatsapp_message_status_update', {
              sessionId,
              messageId: message.id.id,
              status,
              timestamp: new Date()
            });

            session.lastActivity = new Date();
          } catch (error) {
            console.error(`❌ Error processing message ack in session ${sessionId}:`, error);
          }
        });

        // Disconnection handler
        client.on('disconnected', (reason) => {
          console.log(`🔌 Session ${sessionId} disconnected:`, reason);
          session.status = 'disconnected';
          this.emit('whatsapp_status_changed', {
            sessionId,
            status: 'disconnected',
            reason
          });
        });

        // Error handler
        client.on('auth_failure', (message) => {
          console.error(`❌ Authentication failed for session ${sessionId}:`, message);
          session.status = 'error';
          clearTimeout(timeout);
          reject(new Error(`Authentication failed: ${message}`));
        });

        // Initialize the client
        console.log(`🔄 Initializing WhatsApp Web client for session ${sessionId}`);
        client.initialize();

      } catch (error) {
        console.error(`❌ Error creating session ${sessionId}:`, error);
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  async sendMessage(sessionId: string, to: string, content: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.client) {
      throw new Error(`Session ${sessionId} not found or not ready`);
    }

    if (session.status !== 'ready') {
      throw new Error(`Session ${sessionId} is not ready. Status: ${session.status}`);
    }

    try {
      console.log(`📤 Sending message via session ${sessionId} to ${to}: ${content}`);

      // Format phone number for WhatsApp
      const formattedNumber = this.formatPhoneNumber(to);
      const chatId = `${formattedNumber}@c.us`;

      console.log(`📱 Formatted number: ${formattedNumber}, Chat ID: ${chatId}`);

      // Check if the number is registered on WhatsApp
      try {
        const isRegistered = await session.client.isRegisteredUser(chatId);
        console.log(`📱 Number ${formattedNumber} is registered on WhatsApp: ${isRegistered}`);

        if (!isRegistered) {
          throw new Error(`Number ${to} is not registered on WhatsApp`);
        }
      } catch (checkError) {
        console.log(`⚠️ Could not verify registration for ${formattedNumber}, proceeding anyway:`, checkError.message);
      }

      // Try to get or create the chat first
      let chat;
      try {
        chat = await session.client.getChatById(chatId);
        console.log(`📱 Found existing chat for ${chatId}`);
      } catch (chatError) {
        console.log(`📱 Chat not found for ${chatId}, will create new chat when sending message`);
      }

      const message = await session.client.sendMessage(chatId, content);

      session.lastActivity = new Date();

      console.log(`✅ Message sent successfully via session ${sessionId}`, {
        messageId: message.id.id,
        chatId: message.from || chatId,
        timestamp: message.timestamp
      });

      return {
        id: message.id.id,
        status: 'sent',
        timestamp: new Date(),
        chatId: message.from || chatId
      };
    } catch (error) {
      console.error(`❌ Error sending message via session ${sessionId}:`, error);

      // Provide more specific error messages
      if (error.message.includes('Unexpected null or undefined')) {
        throw new Error(`Failed to send message to ${to}. The contact may not be available on WhatsApp or the session needs to be refreshed.`);
      } else if (error.message.includes('Chat not found')) {
        throw new Error(`Contact ${to} not found on WhatsApp. Please verify the phone number.`);
      } else if (error.message.includes('not registered')) {
        throw new Error(`Number ${to} is not registered on WhatsApp.`);
      }

      throw error;
    }
  }

  async sendMedia(sessionId: string, to: string, mediaPath: string, caption?: string, mediaType?: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.client) {
      throw new Error(`Session ${sessionId} not found or not ready`);
    }

    if (session.status !== 'ready') {
      throw new Error(`Session ${sessionId} is not ready. Status: ${session.status}`);
    }

    try {
      console.log(`📤 Sending media via session ${sessionId} to ${to}:`, {
        mediaPath,
        caption,
        mediaType
      });

      // Format phone number for WhatsApp
      const formattedNumber = this.formatPhoneNumber(to);
      const chatId = `${formattedNumber}@c.us`;

      // Import MessageMedia from whatsapp-web.js
      const { MessageMedia } = require('whatsapp-web.js');

      let media;

      // Handle different media types
      if (mediaPath.startsWith('data:')) {
        // Base64 data URL
        const [mimeType, base64Data] = mediaPath.split(',');
        const mimetype = mimeType.split(':')[1].split(';')[0];
        media = new MessageMedia(mimetype, base64Data);
      } else {
        // File path
        const fs = require('fs');
        const path = require('path');

        if (!fs.existsSync(mediaPath)) {
          throw new Error(`Media file not found: ${mediaPath}`);
        }

        const fileData = fs.readFileSync(mediaPath, { encoding: 'base64' });
        const mimeType = this.getMimeType(mediaPath);
        media = new MessageMedia(mimeType, fileData, path.basename(mediaPath));
      }

      const message = await session.client.sendMessage(chatId, media, { caption });

      session.lastActivity = new Date();

      console.log(`✅ Media sent successfully via session ${sessionId}`);

      return {
        id: message.id.id,
        status: 'sent',
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`❌ Error sending media via session ${sessionId}:`, error);
      throw error;
    }
  }

  private getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp4': 'video/mp4',
      'avi': 'video/avi',
      'mov': 'video/quicktime',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain'
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Remove + if present and handle it separately
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }

    // Remove any remaining non-digit characters
    cleaned = cleaned.replace(/\D/g, '');

    console.log(`📱 Formatting phone number: ${phone} -> ${cleaned}`);

    // Add country code if not present (assuming Indian numbers)
    if (cleaned.length === 10) {
      const formatted = `91${cleaned}`;
      console.log(`📱 Added country code: ${formatted}`);
      return formatted;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      console.log(`📱 Already has country code: ${cleaned}`);
      return cleaned;
    } else if (cleaned.length === 13 && cleaned.startsWith('91')) {
      // Remove extra digit if present
      const formatted = cleaned.substring(0, 12);
      console.log(`📱 Trimmed to correct length: ${formatted}`);
      return formatted;
    }

    console.log(`📱 Using as-is: ${cleaned}`);
    return cleaned;
  }

  async getActiveSessions(): Promise<WhatsAppSession[]> {
    return Array.from(this.sessions.values()).filter(session =>
      session.status === 'ready' || session.status === 'authenticated'
    );
  }

  // Check if a phone number is already connected in any active session
  async checkDuplicatePhoneNumber(phoneNumber: string): Promise<WhatsAppSession | null> {
    const activeSessions = await this.getActiveSessions();
    return activeSessions.find(session => session.phoneNumber === phoneNumber) || null;
  }

  // Disconnect session by phone number (used for duplicate prevention)
  async disconnectSessionByPhoneNumber(phoneNumber: string): Promise<boolean> {
    const duplicateSession = await this.checkDuplicatePhoneNumber(phoneNumber);
    if (duplicateSession) {
      console.log(`🔌 Disconnecting duplicate session for phone number: ${phoneNumber}`);
      await this.disconnectSession(duplicateSession.sessionId);
      return true;
    }
    return false;
  }

  async getAllSessions(): Promise<WhatsAppSession[]> {
    return Array.from(this.sessions.values());
  }

  async getSessionDirectories(): Promise<string[]> {
    try {
      if (!fs.existsSync(this.sessionDir)) {
        return [];
      }

      const sessionDirs = fs.readdirSync(this.sessionDir).filter(dir => {
        const fullPath = path.join(this.sessionDir, dir);
        return fs.statSync(fullPath).isDirectory() && dir.startsWith('session-');
      });

      return sessionDirs;
    } catch (error) {
      console.error('❌ Error getting session directories:', error);
      return [];
    }
  }

  async getSession(sessionId: string): Promise<WhatsAppSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async disconnectSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session && session.client) {
      try {
        await session.client.destroy();
        console.log(`🔌 Session ${sessionId} disconnected successfully`);
      } catch (error) {
        console.error(`❌ Error disconnecting session ${sessionId}:`, error);
      }
    }
    this.sessions.delete(sessionId);
    this.qrCodeCache.delete(sessionId);

    // Also remove the session directory
    await this.removeSessionDirectory(sessionId);
  }

  private async removeSessionDirectory(sessionId: string): Promise<void> {
    try {
      const sessionDirPath = path.join(this.sessionDir, `session-${sessionId}`);
      if (fs.existsSync(sessionDirPath)) {
        await fs.rmSync(sessionDirPath, { recursive: true, force: true });
        console.log(`🗑️ Removed session directory: ${sessionDirPath}`);
      }
    } catch (error) {
      console.error(`❌ Error removing session directory for ${sessionId}:`, error);
    }
  }

  async forceCleanupAll(): Promise<void> {
    console.log('🧹 Starting force cleanup of all WhatsApp sessions...');

    try {
      // Disconnect all active sessions
      const sessionIds = Array.from(this.sessions.keys());
      console.log(`🔌 Disconnecting ${sessionIds.length} active sessions...`);

      for (const sessionId of sessionIds) {
        const session = this.sessions.get(sessionId);
        if (session && session.client) {
          try {
            await session.client.destroy();
            console.log(`🔌 Disconnected session: ${sessionId}`);
          } catch (error) {
            console.error(`❌ Error disconnecting session ${sessionId}:`, error);
          }
        }
      }

      // Clear all session maps
      this.sessions.clear();
      this.qrCodeCache.clear();
      console.log('🧹 Cleared all session maps');

      // Remove all session directories
      await this.removeAllSessionDirectories();

      console.log('✅ Force cleanup completed successfully');
    } catch (error) {
      console.error('❌ Error during force cleanup:', error);
      throw error;
    }
  }

  private async removeAllSessionDirectories(): Promise<void> {
    try {
      if (!fs.existsSync(this.sessionDir)) {
        console.log('📁 Session directory does not exist, nothing to clean');
        return;
      }

      const sessionDirs = fs.readdirSync(this.sessionDir).filter(dir => {
        const fullPath = path.join(this.sessionDir, dir);
        return fs.statSync(fullPath).isDirectory() && dir.startsWith('session-');
      });

      console.log(`🗑️ Found ${sessionDirs.length} session directories to remove`);

      for (const sessionDir of sessionDirs) {
        const fullPath = path.join(this.sessionDir, sessionDir);
        try {
          await fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`🗑️ Removed session directory: ${sessionDir}`);
        } catch (error) {
          console.error(`❌ Error removing directory ${sessionDir}:`, error);
        }
      }

      console.log(`✅ Removed ${sessionDirs.length} session directories`);
    } catch (error) {
      console.error('❌ Error removing session directories:', error);
      throw error;
    }
  }

  getQRCode(sessionId: string): string | null {
    return this.qrCodeCache.get(sessionId) || null;
  }

  private startHealthCheck(): void {
    // Check session health more frequently for better responsiveness
    setInterval(() => {
      this.checkSessionHealth();
    }, this.healthCheckInterval);

    console.log(`🏥 Started session health check (every ${this.healthCheckInterval / 1000} seconds)`);
  }

  private startPersistentReconnectionMonitor(): void {
    // Monitor for disconnected sessions every minute and attempt reconnection
    setInterval(() => {
      this.monitorAndReconnectSessions();
    }, 60000);

    console.log(`🔄 Started persistent reconnection monitor (every 60 seconds)`);
  }

  private async checkSessionHealth(): Promise<void> {
    try {
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.client && session.status === 'ready') {
          try {
            // Check if client is still connected
            const state = await session.client.getState();
            if (state !== 'CONNECTED') {
              console.log(`⚠️ Session ${sessionId} is not connected (state: ${state}), scheduling reconnect...`);
              session.status = 'disconnected';
              session.client = undefined;

              // Schedule reconnection with retry logic
              this.scheduleReconnection(sessionId, session.reconnectAttempts || 0).catch(error => {
                console.error(`❌ Health check reconnect failed for session ${sessionId}:`, error);
              });
            } else {
              // Update last activity and reset reconnect attempts on successful health check
              session.lastActivity = new Date();
              session.reconnectAttempts = 0;
            }
          } catch (error) {
            console.log(`⚠️ Session ${sessionId} health check failed, scheduling reconnect...`);
            session.status = 'disconnected';
            session.client = undefined;

            // Schedule reconnection with retry logic
            this.scheduleReconnection(sessionId, session.reconnectAttempts || 0).catch(reconnectError => {
              console.error(`❌ Health check reconnect failed for session ${sessionId}:`, reconnectError);
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ Error during session health check:', error);
    }
  }

  private async autoReconnectSession(sessionId: string): Promise<boolean> {
    // Delegate to the new enhanced reconnection system
    return this.scheduleReconnection(sessionId, 0);
  }

  private async monitorAndReconnectSessions(): Promise<void> {
    try {
      for (const [sessionId, session] of this.sessions.entries()) {
        // Check for sessions that are disconnected and not currently reconnecting
        if (session.status === 'disconnected' && !session.isReconnecting) {
          const timeSinceLastAttempt = session.lastReconnectAttempt
            ? Date.now() - session.lastReconnectAttempt.getTime()
            : Infinity;

          // Only attempt reconnection if enough time has passed since last attempt
          const reconnectAttempts = session.reconnectAttempts || 0;
          const delay = this.calculateReconnectDelay(reconnectAttempts);

          if (timeSinceLastAttempt >= delay) {
            console.log(`🔄 Persistent monitor: Attempting to reconnect session ${sessionId} (attempt ${reconnectAttempts + 1})`);
            this.scheduleReconnection(sessionId, reconnectAttempts).catch(error => {
              console.error(`❌ Persistent monitor reconnect failed for session ${sessionId}:`, error);
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ Error during persistent reconnection monitoring:', error);
    }
  }

  private calculateReconnectDelay(attempts: number): number {
    // Exponential backoff with jitter: base * (2^attempts) + random jitter
    const exponentialDelay = this.baseReconnectDelay * Math.pow(2, Math.min(attempts, 8));
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    return Math.min(exponentialDelay + jitter, this.maxReconnectDelay);
  }

  private async scheduleReconnection(sessionId: string, currentAttempts: number): Promise<boolean> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        console.log(`❌ Session ${sessionId} not found for reconnection`);
        return false;
      }

      // Check if we've exceeded max attempts
      if (currentAttempts >= this.maxReconnectAttempts) {
        console.log(`❌ Session ${sessionId} exceeded max reconnection attempts (${this.maxReconnectAttempts})`);
        session.status = 'error';
        session.isReconnecting = false;
        return false;
      }

      // Mark as reconnecting to prevent multiple simultaneous attempts
      session.isReconnecting = true;
      session.reconnectAttempts = currentAttempts + 1;
      session.lastReconnectAttempt = new Date();

      const delay = this.calculateReconnectDelay(currentAttempts);
      console.log(`🔄 Scheduling reconnection for session ${sessionId} in ${delay}ms (attempt ${currentAttempts + 1}/${this.maxReconnectAttempts})`);

      // Clear any existing reconnect timer
      if (session.reconnectTimer) {
        clearTimeout(session.reconnectTimer);
      }

      // Schedule the reconnection
      session.reconnectTimer = setTimeout(async () => {
        try {
          const success = await this.performReconnection(sessionId);
          if (!success) {
            // If reconnection failed, schedule the next attempt
            this.scheduleReconnection(sessionId, session.reconnectAttempts || 0).catch(error => {
              console.error(`❌ Failed to schedule next reconnection for session ${sessionId}:`, error);
            });
          }
        } catch (error) {
          console.error(`❌ Error during scheduled reconnection for session ${sessionId}:`, error);
          session.isReconnecting = false;
        }
      }, delay);

      return true;
    } catch (error) {
      console.error(`❌ Error scheduling reconnection for session ${sessionId}:`, error);
      return false;
    }
  }

  private async performReconnection(sessionId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();

      const session = this.sessions.get(sessionId);
      if (!session) {
        console.log(`❌ Session ${sessionId} not found for reconnection`);
        return false;
      }

      console.log(`🔄 Performing reconnection for session: ${sessionId}`);

      // Clean up existing client if any
      if (session.client) {
        try {
          await session.client.destroy();
        } catch (error) {
          console.log(`⚠️ Error destroying existing client for session ${sessionId}:`, error);
        }
        session.client = undefined;
      }

      // Create new client with enhanced configuration
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: sessionId,
          dataPath: this.sessionDir
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ]
        }
      });

      session.client = client;
      session.status = 'initializing';

      // Set up event handlers with enhanced auto-reconnect logic
      this.setupClientEventHandlersWithAutoReconnect(client, session);

      // Initialize the client
      client.initialize();

      return true;
    } catch (error) {
      console.error(`❌ Error performing reconnection for session ${sessionId}:`, error);
      const session = this.sessions.get(sessionId);
      if (session) {
        session.isReconnecting = false;
      }
      return false;
    }
  }

  async reconnectSession(sessionId: string): Promise<boolean> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        console.log(`❌ Session ${sessionId} not found`);
        return false;
      }

      if (session.client) {
        console.log(`⚠️ Session ${sessionId} already has a client`);
        return true;
      }

      console.log(`🔄 Reconnecting session: ${sessionId}`);

      // Create client with LocalAuth for persistent sessions
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: sessionId,
          dataPath: this.sessionDir
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        }
      });

      session.client = client;
      session.status = 'initializing';

      // Set up event handlers
      this.setupClientEventHandlers(client, session);

      // Initialize the client
      client.initialize();

      return true;
    } catch (error) {
      console.error(`❌ Error reconnecting session ${sessionId}:`, error);
      return false;
    }
  }

  private setupClientEventHandlersWithAutoReconnect(client: Client, session: WhatsAppSession): void {
    const sessionId = session.sessionId;

    // Ready handler
    client.on('ready', async () => {
      console.log(`✅ Session ${sessionId} is ready and connected!`);
      session.status = 'ready';
      session.lastActivity = new Date();

      // Update database status to connected
      await this.updateDatabaseStatus(sessionId, 'connected');

      // Reset reconnection state on successful connection
      session.reconnectAttempts = 0;
      session.isReconnecting = false;
      if (session.reconnectTimer) {
        clearTimeout(session.reconnectTimer);
        session.reconnectTimer = undefined;
      }

      try {
        // Get phone number
        const info = client.info;
        if (info && info.wid && info.wid.user) {
          session.phoneNumber = `+${info.wid.user}`;
          console.log(`📱 Phone number for session ${sessionId}: ${session.phoneNumber}`);
        }

        this.emit('whatsapp_status_changed', {
          sessionId,
          status: 'ready',
          phoneNumber: session.phoneNumber
        });

        this.emit('whatsapp_connected', {
          sessionId,
          phoneNumber: session.phoneNumber,
          name: info?.pushname || 'Unknown'
        });

        // Emit session update for real-time sync
        this.emit('whatsapp_session_update', {
          sessionId,
          status: 'ready',
          phoneNumber: session.phoneNumber,
          connected: true,
          lastActivity: session.lastActivity
        });

        // Start automatic sync of all WhatsApp data
        console.log(`🔄 Starting automatic WhatsApp data sync for session ${sessionId}`);
        this.syncAllWhatsAppData(sessionId).catch(error => {
          console.error(`❌ Error during automatic sync for session ${sessionId}:`, error);
        });
      } catch (error) {
        console.error(`❌ Error getting phone number for session ${sessionId}:`, error);
      }
    });

    // Authentication success handler
    client.on('authenticated', () => {
      console.log(`🔐 Session ${sessionId} authenticated successfully`);
      session.status = 'authenticated';
      this.emit('whatsapp_status_changed', {
        sessionId,
        status: 'authenticated'
      });

      // Emit session update for real-time sync
      this.emit('whatsapp_session_update', {
        sessionId,
        status: 'authenticated',
        connected: false
      });
    });

    // Message handler with enhanced debugging
    client.on('message', async (message) => {
      try {
        console.log(`📨 New message received in session ${sessionId}:`, {
          from: message.from,
          to: message.to,
          body: message.body,
          type: message.type,
          hasMedia: message.hasMedia,
          isFromMe: message.fromMe,
          timestamp: message.timestamp
        });

        // Skip messages sent by us
        if (message.fromMe) {
          console.log(`⏭️ Skipping outgoing message from session ${sessionId}`);
          return;
        }

        const contact = await message.getContact();
        const chat = await message.getChat();

        const messageData: MessageData = {
          sessionId,
          from: message.from,
          to: message.to || '',
          body: message.body,
          timestamp: new Date(message.timestamp * 1000),
          messageId: message.id.id,
          isGroup: chat.isGroup,
          chatId: message.from,
          contactName: contact.name || contact.pushname || contact.number
        };

        console.log(`📋 Processed message data:`, messageData);

        // Handle media messages
        if (message.hasMedia) {
          try {
            const media = await message.downloadMedia();
            if (media) {
              messageData.mediaType = media.mimetype;
              messageData.mediaUrl = `data:${media.mimetype};base64,${media.data}`;
            }
          } catch (error) {
            console.error('Error downloading media:', error);
          }
        }

        console.log(`🚀 Emitting whatsapp_message_received event for session ${sessionId}`);
        this.emit('whatsapp_message_received', messageData);
        session.lastActivity = new Date();
      } catch (error) {
        console.error(`❌ Error processing message in session ${sessionId}:`, error);
      }
    });

    // Message acknowledgment handler (delivery and read receipts)
    client.on('message_ack', async (message, ack) => {
      try {
        console.log(`📊 Message acknowledgment received in session ${sessionId}:`, {
          messageId: message.id.id,
          ack: ack
        });

        let status = 'sent';
        if (ack === 2) {
          status = 'delivered';
        } else if (ack === 3) {
          status = 'read';
        }

        this.emit('whatsapp_message_status_update', {
          sessionId,
          messageId: message.id.id,
          status,
          timestamp: new Date()
        });

        session.lastActivity = new Date();
      } catch (error) {
        console.error(`❌ Error processing message ack in session ${sessionId}:`, error);
      }
    });

    // Disconnection handler with enhanced auto-reconnect
    client.on('disconnected', async (reason) => {
      console.log(`🔌 Session ${sessionId} disconnected:`, reason);
      session.status = 'disconnected';
      session.client = undefined; // Clear the client reference
      session.isReconnecting = false; // Reset reconnecting flag

      // Update database status to disconnected
      await this.updateDatabaseStatus(sessionId, 'disconnected');

      this.emit('whatsapp_status_changed', {
        sessionId,
        status: 'disconnected',
        reason
      });

      // Emit session update for real-time sync
      this.emit('whatsapp_session_update', {
        sessionId,
        status: 'disconnected',
        connected: false
      });

      // Schedule enhanced auto-reconnect with exponential backoff
      console.log(`🔄 Scheduling enhanced auto-reconnect for session ${sessionId}...`);
      this.scheduleReconnection(sessionId, session.reconnectAttempts || 0).catch(error => {
        console.error(`❌ Enhanced auto-reconnect failed for session ${sessionId}:`, error);
      });
    });

    // Error handler
    client.on('auth_failure', (message) => {
      console.error(`❌ Authentication failed for session ${sessionId}:`, message);
      session.status = 'error';
      session.client = undefined; // Clear the client reference
      session.isReconnecting = false; // Reset reconnecting flag

      // Clear any pending reconnection timers
      if (session.reconnectTimer) {
        clearTimeout(session.reconnectTimer);
        session.reconnectTimer = undefined;
      }
    });
  }

  private setupClientEventHandlers(client: Client, session: WhatsAppSession): void {
    const sessionId = session.sessionId;

    // Ready handler
    client.on('ready', async () => {
      console.log(`✅ Session ${sessionId} is ready!`);
      session.status = 'ready';
      session.lastActivity = new Date();

      try {
        // Get phone number
        const info = client.info;
        if (info && info.wid && info.wid.user) {
          session.phoneNumber = `+${info.wid.user}`;
          console.log(`📱 Phone number for session ${sessionId}: ${session.phoneNumber}`);
        }

        this.emit('whatsapp_status_changed', {
          sessionId,
          status: 'ready',
          phoneNumber: session.phoneNumber
        });

        this.emit('whatsapp_connected', {
          sessionId,
          phoneNumber: session.phoneNumber,
          name: info?.pushname || 'Unknown'
        });

        // Emit session update for real-time sync
        this.emit('whatsapp_session_update', {
          sessionId,
          status: 'ready',
          phoneNumber: session.phoneNumber,
          connected: true,
          lastActivity: session.lastActivity
        });

        // Start automatic sync of all WhatsApp data
        console.log(`🔄 Starting automatic WhatsApp data sync for session ${sessionId}`);
        this.syncAllWhatsAppData(sessionId).catch(error => {
          console.error(`❌ Error during automatic sync for session ${sessionId}:`, error);
        });
      } catch (error) {
        console.error(`❌ Error getting phone number for session ${sessionId}:`, error);
      }
    });

    // Authentication success handler
    client.on('authenticated', () => {
      console.log(`🔐 Session ${sessionId} authenticated successfully`);
      session.status = 'authenticated';
      this.emit('whatsapp_status_changed', {
        sessionId,
        status: 'authenticated'
      });

      // Emit session update for real-time sync
      this.emit('whatsapp_session_update', {
        sessionId,
        status: 'authenticated',
        connected: false
      });
    });

    // Message handler with enhanced debugging
    client.on('message', async (message) => {
      try {
        console.log(`📨 New message received in session ${sessionId}:`, {
          from: message.from,
          to: message.to,
          body: message.body,
          type: message.type,
          hasMedia: message.hasMedia,
          isFromMe: message.fromMe,
          timestamp: message.timestamp
        });

        // Skip messages sent by us
        if (message.fromMe) {
          console.log(`⏭️ Skipping outgoing message from session ${sessionId}`);
          return;
        }

        const contact = await message.getContact();
        const chat = await message.getChat();

        const messageData: MessageData = {
          sessionId,
          from: message.from,
          to: message.to || '',
          body: message.body,
          timestamp: new Date(message.timestamp * 1000),
          messageId: message.id.id,
          isGroup: chat.isGroup,
          chatId: message.from,
          contactName: contact.name || contact.pushname || contact.number
        };

        console.log(`📋 Processed message data:`, messageData);

        // Handle media messages
        if (message.hasMedia) {
          try {
            const media = await message.downloadMedia();
            if (media) {
              messageData.mediaType = media.mimetype;
              messageData.mediaUrl = `data:${media.mimetype};base64,${media.data}`;
            }
          } catch (error) {
            console.error('Error downloading media:', error);
          }
        }

        console.log(`🚀 Emitting whatsapp_message_received event for session ${sessionId}`);
        this.emit('whatsapp_message_received', messageData);
        session.lastActivity = new Date();
      } catch (error) {
        console.error(`❌ Error processing message in session ${sessionId}:`, error);
      }
    });

    // Message acknowledgment handler (delivery and read receipts)
    client.on('message_ack', async (message, ack) => {
      try {
        console.log(`📊 Message acknowledgment received in session ${sessionId}:`, {
          messageId: message.id.id,
          ack: ack
        });

        let status = 'sent';
        if (ack === 2) {
          status = 'delivered';
        } else if (ack === 3) {
          status = 'read';
        }

        this.emit('whatsapp_message_status_update', {
          sessionId,
          messageId: message.id.id,
          status,
          timestamp: new Date()
        });

        session.lastActivity = new Date();
      } catch (error) {
        console.error(`❌ Error processing message ack in session ${sessionId}:`, error);
      }
    });

    // Disconnection handler
    client.on('disconnected', (reason) => {
      console.log(`🔌 Session ${sessionId} disconnected:`, reason);
      session.status = 'disconnected';
      this.emit('whatsapp_status_changed', {
        sessionId,
        status: 'disconnected',
        reason
      });
    });

    // Error handler
    client.on('auth_failure', (message) => {
      console.error(`❌ Authentication failed for session ${sessionId}:`, message);
      session.status = 'error';
    });
  }

  // Comprehensive WhatsApp data sync methods
  async syncAllWhatsAppData(sessionId: string): Promise<void> {
    try {
      console.log(`🔄 Starting comprehensive WhatsApp data sync for session ${sessionId}`);

      // Sync in sequence to avoid overwhelming the WhatsApp client
      await this.syncContacts(sessionId);
      await this.syncChats(sessionId);

      console.log(`✅ Completed comprehensive WhatsApp data sync for session ${sessionId}`);

      // Emit sync completion event
      this.emit('whatsapp_sync_completed', {
        sessionId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error(`❌ Error during comprehensive sync for session ${sessionId}:`, error);
      this.emit('whatsapp_sync_error', {
        sessionId,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  async syncContacts(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.client || session.status !== 'ready') {
      throw new Error(`Session ${sessionId} not ready for sync`);
    }

    try {
      console.log(`📇 Syncing contacts for session ${sessionId}`);

      // Get all contacts from WhatsApp
      const contacts = await session.client.getContacts();
      console.log(`📇 Found ${contacts.length} contacts in WhatsApp`);

      // Process contacts in batches to avoid overwhelming the system
      const batchSize = 50;
      let syncedCount = 0;

      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);

        for (const contact of batch) {
          try {
            // Skip group contacts and broadcast lists
            if (contact.isGroup || contact.isBroadcast) {
              continue;
            }

            // Extract phone number
            const phoneNumber = contact.number || contact.id.user;
            if (!phoneNumber) {
              continue;
            }

            const contactData = {
              sessionId,
              whatsappContactId: contact.id._serialized,
              phoneNumber: `+${phoneNumber}`,
              name: contact.name || contact.pushname || contact.shortName || `+${phoneNumber}`,
              profilePicUrl: contact.profilePicUrl || null,
              isBlocked: contact.isBlocked || false,
              isBusiness: contact.isBusiness || false,
              lastSeen: contact.lastSeen ? new Date(contact.lastSeen * 1000) : null
            };

            // Emit contact sync event for real-time processing
            this.emit('whatsapp_contact_synced', contactData);
            syncedCount++;
          } catch (contactError) {
            console.error(`❌ Error processing contact ${contact.id}:`, contactError);
          }
        }

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ Synced ${syncedCount} contacts for session ${sessionId}`);
    } catch (error) {
      console.error(`❌ Error syncing contacts for session ${sessionId}:`, error);
      throw error;
    }
  }

  async syncChats(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.client || session.status !== 'ready') {
      throw new Error(`Session ${sessionId} not ready for sync`);
    }

    try {
      console.log(`💬 Syncing chats for session ${sessionId}`);

      // Get all chats from WhatsApp
      const chats = await session.client.getChats();
      console.log(`💬 Found ${chats.length} chats in WhatsApp`);

      // Process chats in batches
      const batchSize = 20;
      let syncedCount = 0;

      for (let i = 0; i < chats.length; i += batchSize) {
        const batch = chats.slice(i, i + batchSize);

        for (const chat of batch) {
          try {
            // Skip group chats for now (can be enabled later)
            if (chat.isGroup) {
              continue;
            }

            // Extract phone number
            const phoneNumber = chat.id.user;
            if (!phoneNumber) {
              continue;
            }

            const chatData = {
              sessionId,
              whatsappChatId: chat.id._serialized,
              phoneNumber: `+${phoneNumber}`,
              name: chat.name || `+${phoneNumber}`,
              isGroup: chat.isGroup,
              isMuted: chat.isMuted,
              isArchived: chat.archived,
              isPinned: chat.pinned,
              unreadCount: chat.unreadCount,
              lastMessage: chat.lastMessage ? {
                content: chat.lastMessage.body || '',
                timestamp: new Date(chat.lastMessage.timestamp * 1000),
                fromMe: chat.lastMessage.fromMe,
                type: chat.lastMessage.type
              } : null,
              timestamp: new Date()
            };

            // Emit chat sync event for real-time processing
            this.emit('whatsapp_chat_synced', chatData);

            // Sync recent messages for this chat (last 50 messages)
            await this.syncChatMessages(sessionId, chat, 50);

            syncedCount++;
          } catch (chatError) {
            console.error(`❌ Error processing chat ${chat.id}:`, chatError);
          }
        }

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`✅ Synced ${syncedCount} chats for session ${sessionId}`);
    } catch (error) {
      console.error(`❌ Error syncing chats for session ${sessionId}:`, error);
      throw error;
    }
  }

  async syncChatMessages(sessionId: string, chat: any, limit: number = 50): Promise<void> {
    try {
      console.log(`📨 Syncing messages for chat ${chat.id._serialized} (limit: ${limit})`);

      // Fetch messages from the chat
      const messages = await chat.fetchMessages({ limit });
      console.log(`📨 Found ${messages.length} messages in chat ${chat.id._serialized}`);

      // Process messages in reverse order (oldest first)
      const reversedMessages = messages.reverse();

      for (const message of reversedMessages) {
        try {
          // Skip status messages and other non-standard messages
          if (message.type === 'e2e_notification' || message.type === 'notification_template') {
            continue;
          }

          const contact = await message.getContact();
          const phoneNumber = chat.id.user;

          const messageData = {
            sessionId,
            whatsappMessageId: message.id.id,
            whatsappChatId: chat.id._serialized,
            from: message.fromMe ? sessionId : `+${phoneNumber}`,
            to: message.fromMe ? `+${phoneNumber}` : sessionId,
            body: message.body || '',
            timestamp: new Date(message.timestamp * 1000),
            messageId: message.id.id,
            isGroup: chat.isGroup,
            chatId: chat.id._serialized,
            contactName: contact.name || contact.pushname || contact.number,
            fromMe: message.fromMe,
            type: message.type,
            hasMedia: message.hasMedia,
            mediaType: null,
            mediaUrl: null
          };

          // Handle media messages
          if (message.hasMedia) {
            try {
              const media = await message.downloadMedia();
              if (media) {
                messageData.mediaType = media.mimetype;
                messageData.mediaUrl = `data:${media.mimetype};base64,${media.data}`;
              }
            } catch (mediaError) {
              console.error(`❌ Error downloading media for message ${message.id.id}:`, mediaError);
            }
          }

          // Emit message sync event for real-time processing
          this.emit('whatsapp_message_synced', messageData);
        } catch (messageError) {
          console.error(`❌ Error processing message ${message.id}:`, messageError);
        }
      }

      console.log(`✅ Synced ${reversedMessages.length} messages for chat ${chat.id._serialized}`);
    } catch (error) {
      console.error(`❌ Error syncing messages for chat ${chat.id._serialized}:`, error);
    }
  }

  // Manual sync trigger methods
  async triggerContactSync(sessionId: string): Promise<void> {
    console.log(`🔄 Manual contact sync triggered for session ${sessionId}`);
    await this.syncContacts(sessionId);
  }

  async triggerChatSync(sessionId: string): Promise<void> {
    console.log(`🔄 Manual chat sync triggered for session ${sessionId}`);
    await this.syncChats(sessionId);
  }

  async triggerFullSync(sessionId: string): Promise<void> {
    console.log(`🔄 Manual full sync triggered for session ${sessionId}`);
    await this.syncAllWhatsAppData(sessionId);
  }

  // Enhanced session cleanup method
  private cleanupSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Clear reconnection timer
      if (session.reconnectTimer) {
        clearTimeout(session.reconnectTimer);
        session.reconnectTimer = undefined;
      }

      // Reset reconnection state
      session.isReconnecting = false;
      session.reconnectAttempts = 0;

      // Clean up client
      if (session.client) {
        try {
          session.client.destroy();
        } catch (error) {
          console.log(`⚠️ Error destroying client for session ${sessionId}:`, error);
        }
        session.client = undefined;
      }

      console.log(`🧹 Cleaned up session ${sessionId}`);
    }
  }

  // Force reconnect a session (resets all retry attempts)
  async forceReconnectSession(sessionId: string): Promise<boolean> {
    console.log(`🔄 Force reconnecting session: ${sessionId}`);

    const session = this.sessions.get(sessionId);
    if (!session) {
      console.log(`❌ Session ${sessionId} not found for force reconnect`);
      return false;
    }

    // Clean up existing session state
    this.cleanupSession(sessionId);

    // Reset session status
    session.status = 'disconnected';
    session.reconnectAttempts = 0;
    session.isReconnecting = false;

    // Start fresh reconnection
    return this.scheduleReconnection(sessionId, 0);
  }

  private async updateDatabaseStatus(sessionId: string, status: string): Promise<void> {
    try {
      // Get storage from global scope
      const storage = (global as any).storage;

      if (!storage) {
        console.warn(`⚠️ Storage not available for database status update`);
        return;
      }

      // Extract user ID from session ID
      const userId = sessionId.includes('_') ? sessionId.split('_')[1] : 'admin-user-123';

      // Get WhatsApp numbers for the user
      const whatsappNumbers = await storage.getWhatsappNumbers(userId);

      // Find the number that matches this session
      const whatsappNumber = whatsappNumbers.find(num => {
        if (num.session_data) {
          try {
            const sessionData = typeof num.session_data === 'string'
              ? JSON.parse(num.session_data)
              : num.session_data;
            return sessionData.sessionId === sessionId;
          } catch (e) {
            return false;
          }
        }
        return false;
      });

      if (whatsappNumber) {
        console.log(`📱 Updating database status for ${whatsappNumber.phone_number}: ${status}`);
        await storage.updateWhatsappNumber(whatsappNumber.id, {
          status: status as any,
          last_activity: new Date().toISOString()
        });
        console.log(`✅ Database status updated for ${whatsappNumber.phone_number}`);
      } else {
        console.warn(`⚠️ WhatsApp number not found in database for session: ${sessionId}`);
      }
    } catch (error) {
      console.error(`❌ Error updating database status for session ${sessionId}:`, error);
    }
  }
}
