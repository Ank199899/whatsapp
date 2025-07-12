import 'dotenv/config';

// Set NODE_ENV to development if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

import express, { type Request, Response, NextFunction } from "express";
import { Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { registerRoutes } from "./routes";
import { serveStatic } from "./vite";
import { testDatabaseConnection } from "./db";
import { WhatsAppWebService } from "./whatsapp-web-service";
import { storage } from "./storage";
import { normalizePhoneNumber, findConversationByPhone } from "./phone-utils";

// Add global error handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Start server immediately without waiting for async operations
const server = new Server(app);

// Initialize services asynchronously after server starts
async function initializeServices() {
  try {
    // Test Supabase connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected && process.env.NODE_ENV === 'production') {
      console.error("Supabase connection failed in production mode. Please check your SUPABASE_URL and SUPABASE_ANON_KEY.");
    }
  } catch (error) {
    console.error("Error testing Supabase connection:", error);
  }

  // Initialize WhatsApp Web service
  const whatsappWebService = new WhatsAppWebService();
  (global as any).whatsappWebService = whatsappWebService;

  // Set global storage for event handlers
  (global as any).storage = storage;

  try {
    // Register routes after server is already running
    await registerRoutes(app);
  } catch (error) {
    console.error("Error registering routes:", error instanceof Error ? error.message : String(error));
  }

  return { whatsappWebService };
}

(async () => {

  // Set up Socket.io for real-time updates
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NODE_ENV === 'development' ? "http://localhost:5173" : false,
      methods: ["GET", "POST"]
    }
  });

  // Attach Socket.IO instance to the Express app so routes can access it
  app.set('io', io);

  // Set up Socket.io event handlers
  io.on('connection', (socket) => {
    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
    });

    socket.on('disconnect', () => {
      // Client disconnected
    });
  });

  // Get services from server initialization
  const services = await startServer();
  const whatsappWebService = services.whatsappWebService;

  // WhatsApp Web service event handlers for real-time sync

  // WhatsApp Web service event handlers
  whatsappWebService.on('qr', (sessionId: string, qrCode: string) => {
    io.emit('whatsapp_web_qr', { sessionId, qrCode });
  });

  whatsappWebService.on('whatsapp_connected', async (data: any) => {
    try {
      const userId = "admin-user-123"; // Default user for development
      const storage = (global as any).storage;

      if (!storage) {
        console.error('❌ Storage not available for WhatsApp connection');
        return;
      }

      console.log(`📱 WhatsApp connected:`, {
        sessionId: data.sessionId,
        phoneNumber: data.phoneNumber,
        name: data.name
      });

      // Check for duplicate phone number across all users
      const duplicateNumber = await storage.checkDuplicatePhoneNumber(data.phoneNumber);

      if (duplicateNumber && duplicateNumber.user_id !== userId) {
        console.log(`🚫 Duplicate WhatsApp number detected: ${data.phoneNumber} already connected to user ${duplicateNumber.user_id}`);

        // Disconnect the current session to prevent duplicate
        try {
          await whatsappWebService.disconnectSession(data.sessionId);
          console.log(`🔌 Disconnected duplicate session: ${data.sessionId}`);
        } catch (disconnectError) {
          console.error(`❌ Error disconnecting duplicate session:`, disconnectError);
        }

        // Emit error to client
        io.emit('whatsapp_duplicate_detected', {
          sessionId: data.sessionId,
          phoneNumber: data.phoneNumber,
          message: 'This WhatsApp number is already connected to another account'
        });

        return; // Exit early to prevent creating duplicate record
      }

      // Remove any existing duplicates for this user
      await storage.removeDuplicateWhatsappNumbers(userId, data.phoneNumber);

      // Find or create WhatsApp number record
      const whatsappNumbers = await storage.getWhatsappNumbers(userId);
      let whatsappNumber = whatsappNumbers.find((num: any) =>
        num.phone_number === data.phoneNumber
      );

      if (!whatsappNumber) {
        // Create new WhatsApp number record
        whatsappNumber = await storage.createWhatsappNumber({
          user_id: userId,
          phone_number: data.phoneNumber,
          display_name: data.name || data.phoneNumber,
          account_type: 'personal',
          connection_type: 'qr_code',
          status: 'active',
          session_data: {
            sessionId: data.sessionId,
            phoneNumber: data.phoneNumber,
            connectedAt: new Date().toISOString()
          }
        });
        console.log(`✅ Created new WhatsApp number record:`, whatsappNumber.id);
      } else {
        // Update existing WhatsApp number with session data
        await storage.updateWhatsappNumber(whatsappNumber.id, {
          status: 'active',
          last_activity: new Date().toISOString(),
          session_data: {
            sessionId: data.sessionId,
            phoneNumber: data.phoneNumber,
            connectedAt: new Date().toISOString()
          }
        });
        console.log(`✅ Updated WhatsApp number record:`, whatsappNumber.id);
      }

    } catch (error) {
      console.error('❌ Error processing WhatsApp connection:', error);
    }

    // Emit to clients
    io.emit('whatsapp_web_connected', data);
  });

  whatsappWebService.on('whatsapp_message_received', async (data: any) => {


    try {
      // Store the incoming message in database
      const userId = "admin-user-123"; // Default user for development

      // Find or create conversation for this contact
      const conversations = await storage.getConversations(userId);
      const normalizedFromPhone = normalizePhoneNumber(data.from.replace('@c.us', ''));
      let conversation = findConversationByPhone(conversations, normalizedFromPhone);

      if (!conversation) {
        // Create new conversation for incoming message
        conversation = await storage.createConversation({
          userId,
          user_id: userId,
          contact_id: null,
          whatsapp_number_id: null,
          contact_name: data.contactName || normalizedFromPhone,
          contact_phone: normalizedFromPhone,
          last_message: data.body,
          last_message_at: new Date().toISOString(),
          unread_count: 1,
          tags: [],
          status: 'active'
        });

      }

      // Store the message
      const messageRecord = await storage.createMessage({
        conversation_id: conversation.id,
        direction: 'inbound',
        message_type: data.mediaType ? 'media' : 'text',
        content: data.body || '',
        timestamp: data.timestamp?.toISOString() || new Date().toISOString(),
        message_id: data.messageId,
        whatsapp_message_id: data.messageId,
        status: 'received',
        media_url: data.mediaUrl || null,
        media_type: data.mediaType || null
      });

      // Update conversation with last message and increment unread count
      await storage.updateConversation(conversation.id, {
        last_message: data.body || '📎 Media',
        last_message_at: new Date().toISOString(),
        unread_count: (conversation.unread_count || 0) + 1
      });



      // Emit real-time events for immediate UI updates
      io.to(`user_${userId}`).emit('new_message', {
        conversationId: conversation.id,
        message: messageRecord,
        conversation: {
          ...conversation,
          lastMessage: data.body || '📎 Media',
          lastMessageAt: new Date().toISOString(),
          unreadCount: (conversation.unread_count || 0) + 1
        },
        contact: {
          name: data.contactName,
          phone: data.from.replace('@c.us', '')
        }
      });

      io.to(`user_${userId}`).emit('refresh_conversations');
      io.to(`user_${userId}`).emit('refresh_messages', conversation.id);

    } catch (error) {
      console.error('❌ Error processing incoming WhatsApp message:', error);
    }

    // Also emit the original event for other listeners
    io.emit('whatsapp_web_message_received', data);
  });

  whatsappWebService.on('whatsapp_status_changed', (data: any) => {
    io.emit('whatsapp_web_status_changed', data);
  });

  whatsappWebService.on('whatsapp_message_status_update', async (data: any) => {
    try {
      // Update message status in database
      const storage = (global as any).storage;
      if (storage && data.messageId) {
        await storage.updateMessageStatus(data.messageId, data.status);
      }

      // Emit to clients
      io.emit('whatsapp_web_message_status_update', data);
    } catch (error) {
      console.error('❌ Error updating message status:', error);
    }
  });

  // WhatsApp data sync event handlers for real-time sync
  whatsappWebService.on('whatsapp_contact_synced', async (contactData: any) => {
    try {
      const userId = "admin-user-123"; // Default user for development
      // Emit real-time update to clients
      io.to(`user_${userId}`).emit('contact_synced', contactData);
      io.to(`user_${userId}`).emit('refresh_contacts');
    } catch (error) {
      console.error('❌ Error processing synced contact:', error);
    }
  });

  whatsappWebService.on('whatsapp_chat_synced', async (chatData: any) => {
    try {
      const userId = "admin-user-123"; // Default user for development
      const storage = (global as any).storage;

      if (!storage) {
        console.error('❌ Storage not available for chat sync');
        return;
      }

      console.log(`💬 Processing synced chat:`, {
        sessionId: chatData.sessionId,
        phoneNumber: chatData.phoneNumber,
        name: chatData.name
      });

      // Get WhatsApp number ID from session
      const whatsappNumbers = await storage.getWhatsappNumbers(userId);
      const whatsappNumber = whatsappNumbers.find((num: any) =>
        num.session_data?.sessionId === chatData.sessionId ||
        num.id === chatData.sessionId
      );

      if (!whatsappNumber) {
        console.error(`❌ WhatsApp number not found for session ${chatData.sessionId}`);
        return;
      }

      // Check if conversation already exists
      const conversations = await storage.getConversations(userId);
      const existingConversation = conversations.find((conv: any) =>
        conv.contact_phone === chatData.phoneNumber &&
        conv.whatsapp_number_id === whatsappNumber.id
      );

      if (!existingConversation) {
        // Create new conversation
        const conversation = await storage.createConversation({
          userId,
          contactId: null,
          whatsappNumberId: whatsappNumber.id,
          contactName: chatData.name || chatData.phoneNumber,
          contactPhone: chatData.phoneNumber,
          lastMessage: chatData.lastMessage?.content || null,
          lastMessageAt: chatData.lastMessage?.timestamp || new Date().toISOString(),
          unreadCount: chatData.unreadCount || 0,
          tags: [],
          status: 'active'
        });

        console.log(`✅ Created conversation for ${chatData.phoneNumber}:`, conversation.id);
      } else {
        console.log(`📱 Conversation already exists for ${chatData.phoneNumber}`);
      }

      // Emit real-time update to clients
      io.to(`user_${userId}`).emit('chat_synced', chatData);
      io.to(`user_${userId}`).emit('refresh_conversations');
    } catch (error) {
      console.error('❌ Error processing synced chat:', error);
    }
  });

  whatsappWebService.on('whatsapp_message_synced', async (messageData: any) => {
    try {
      const userId = "admin-user-123"; // Default user for development
      const storage = (global as any).storage;

      if (!storage) {
        console.error('❌ Storage not available for message sync');
        return;
      }

      console.log(`📨 Processing synced message:`, {
        sessionId: messageData.sessionId,
        from: messageData.from,
        to: messageData.to,
        body: messageData.body?.substring(0, 50) + '...'
      });

      // Get WhatsApp number ID from session
      const whatsappNumbers = await storage.getWhatsappNumbers(userId);
      const whatsappNumber = whatsappNumbers.find((num: any) =>
        num.session_data?.sessionId === messageData.sessionId ||
        num.id === messageData.sessionId
      );

      if (!whatsappNumber) {
        console.error(`❌ WhatsApp number not found for session ${messageData.sessionId}`);
        return;
      }

      // Extract phone number from the message
      const phoneNumber = messageData.fromMe ? messageData.to : messageData.from;
      const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

      // Find or create conversation
      const conversations = await storage.getConversations(userId);
      let conversation = conversations.find((conv: any) =>
        conv.contact_phone === normalizedPhone &&
        conv.whatsapp_number_id === whatsappNumber.id
      );

      if (!conversation) {
        // Create new conversation
        conversation = await storage.createConversation({
          userId,
          contactId: null,
          whatsappNumberId: whatsappNumber.id,
          contactName: messageData.contactName || normalizedPhone,
          contactPhone: normalizedPhone,
          lastMessage: messageData.body || '📎 Media',
          lastMessageAt: messageData.timestamp || new Date().toISOString(),
          unreadCount: messageData.fromMe ? 0 : 1,
          tags: [],
          status: 'active'
        });

        console.log(`✅ Created conversation for message from ${normalizedPhone}`);
      }

      // Check if message already exists to avoid duplicates
      const existingMessages = await storage.getMessages(conversation.id);
      const messageExists = existingMessages.some((msg: any) =>
        msg.whatsapp_message_id === messageData.whatsappMessageId
      );

      if (!messageExists) {
        // Create message record
        const messageRecord = await storage.createMessage({
          conversation_id: conversation.id,
          whatsapp_message_id: messageData.whatsappMessageId,
          direction: messageData.fromMe ? 'outgoing' : 'incoming',
          message_type: messageData.hasMedia ? 'media' : 'text',
          content: messageData.body || '',
          media_url: messageData.mediaUrl || null,
          media_type: messageData.mediaType || null,
          timestamp: messageData.timestamp || new Date().toISOString(),
          status: messageData.fromMe ? 'sent' : 'received'
        });

        console.log(`✅ Created message record:`, messageRecord.id);

        // Update conversation with latest message
        await storage.updateConversation(conversation.id, {
          last_message: messageData.body || '📎 Media',
          last_message_at: messageData.timestamp || new Date().toISOString(),
          unread_count: messageData.fromMe ? conversation.unread_count : (conversation.unread_count || 0) + 1
        });
      } else {
        console.log(`📨 Message already exists: ${messageData.whatsappMessageId}`);
      }

      // Emit real-time update to clients
      io.to(`user_${userId}`).emit('message_synced', {
        content: messageData.body,
        direction: messageData.fromMe ? 'outgoing' : 'incoming',
        timestamp: messageData.timestamp,
        contactName: messageData.contactName
      });
      io.to(`user_${userId}`).emit('refresh_conversations');
      io.to(`user_${userId}`).emit('refresh_messages', conversation.id);
    } catch (error) {
      console.error('❌ Error processing synced message:', error);
    }
  });

  whatsappWebService.on('whatsapp_sync_completed', async (data: any) => {

    const userId = "admin-user-123";

    // Emit sync completion to clients
    io.to(`user_${userId}`).emit('whatsapp_sync_completed', data);
    io.to(`user_${userId}`).emit('refresh_all_data');
  });

  whatsappWebService.on('whatsapp_sync_error', async (data: any) => {
    console.error(`❌ WhatsApp sync error for session ${data.sessionId}:`, data.error);
    const userId = "admin-user-123";

    // Emit sync error to clients
    io.to(`user_${userId}`).emit('whatsapp_sync_error', data);
  });

  // WhatsApp Web session updates
  whatsappWebService.on('whatsapp_session_update', (data: any) => {

    io.emit('whatsapp_web_session_update', data);
  });

  // WhatsApp Web QR code updates
  whatsappWebService.on('qr', (sessionId: string, qrCode: string) => {

    io.emit('whatsapp_web_qr_code', { sessionId, qrCode });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Express error handler caught:', err.message);
    
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

})();

// Setup Vite/static serving and start server immediately
async function startServer() {
  // First initialize services and register routes
  const whatsappService = await initializeServices();

  try {
    // Use Vite dev server in development, static files in production
    if (process.env.NODE_ENV === 'development') {
      const { setupVite } = await import('./vite');
      await setupVite(app, server);
      console.log('🔥 Vite dev server setup complete');
    } else {
      serveStatic(app);
    }
  } catch (error) {
    console.error('Error setting up file serving:', error);
    console.log('Falling back to static file serving...');
    try {
      serveStatic(app);
    } catch (fallbackError) {
      console.error('Fallback static serving also failed:', fallbackError);
    }
  }

  // ALWAYS serve the app on port 3000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "3000", 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY ? 'Supabase Configured' : 'Supabase Not configured'}`);
  });

  return whatsappService;
}

// Server is started from within the async IIFE above
