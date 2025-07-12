import express, { type Express, type Request, type Response } from "express";
import { Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { promises as fsPromises } from "fs";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";

import { multiAIService } from "./ai-service.js";

import { findConversationByPhone, normalizePhoneNumber, deduplicateConversations } from "./phone-utils.js";

// Helper function to get current Indian time as ISO string
const getIndianTimeISO = () => {
  return new Date().toLocaleString('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(', ', 'T') + '.000Z';
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow most common media and document types
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
      // Videos
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv',
      // Audio
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/flac', 'audio/mpeg',
      // Documents
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv', 'application/rtf',
      // Archives
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
      // Other common types
      'application/octet-stream'
    ];

    console.log(`📁 File upload attempt: ${file.originalname}, MIME type: ${file.mimetype}`);

    const isAllowed = allowedTypes.includes(file.mimetype) ||
                     file.mimetype.startsWith('image/') ||
                     file.mimetype.startsWith('video/') ||
                     file.mimetype.startsWith('audio/');

    if (isAllowed) {
      console.log(`✅ File type allowed: ${file.mimetype}`);
      cb(null, true);
    } else {
      console.log(`❌ File type not allowed: ${file.mimetype}`);
      cb(new Error(`File type not allowed: ${file.mimetype}`) as any, false);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const server = new Server(app);

  // Set up authentication for all environments
  await setupAuth(app);

  // Root route redirect
  app.get("/", (req, res) => {
    res.redirect("/dashboard");
  });

  // Simple test endpoint
  app.get("/api/test", (req, res) => {
    res.json({ message: "API is working", timestamp: getIndianTimeISO() });
  });

  // Auth user endpoint - temporarily bypassed for testing
  app.get("/api/auth/user", async (req, res) => {
    try {
      // Return a default admin user for testing
      res.json({
        id: 'admin-user-123',
        email: 'admin@sendwopro.com',
        first_name: 'Admin',
        last_name: 'User',
        profile_image_url: null
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Check Supabase connection
      const { supabase } = await import('./db.js');
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Simple test query
      const { data, error } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      res.json({
        status: "ok",
        timestamp: getIndianTimeISO(),
        database: {
          connected: true,
          type: 'supabase'
        },
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({
        status: "error",
        message: "Database connection failed",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      
      // Get basic stats
      const contacts = await storage.getContacts(userId);
      const campaigns = await storage.getCampaigns(userId);
      const templates = await storage.getTemplates(userId);
      
      res.json({
        contacts: contacts.length,
        campaigns: campaigns.length,
        templates: templates.length,
        whatsappNumbers: 0 // Will be updated when WhatsApp is implemented
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Contacts
  app.get("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      const contacts = await storage.getContacts(userId);

      // Map database fields to frontend interface
      const mappedContacts = contacts.map((contact: any) => {
        let aiAgentActive = false;

        // Try to parse AI agent status from notes field
        if (contact.notes) {
          try {
            const notesData = JSON.parse(contact.notes);
            if (typeof notesData === 'object' && notesData.aiAgentActive !== undefined) {
              aiAgentActive = notesData.aiAgentActive;
            }
          } catch (e) {
            // Notes is not JSON, ignore
          }
        }

        return {
          id: contact.id.toString(),
          name: contact.name,
          phone: contact.phone_number,
          email: contact.email,
          tags: Array.isArray(contact.tags) ? contact.tags : (contact.tags ? [contact.tags] : []),
          notes: contact.notes,
          isBlocked: contact.status === 'blocked',
          aiAgentActive: aiAgentActive,
          createdAt: contact.created_at,
          updatedAt: contact.updated_at
        };
      });

      res.json(mappedContacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      const { name, phone, email, tags, notes, isBlocked, aiAgentActive } = req.body;

      console.log("🔄 POST /api/contacts - Creating contact with data:", { name, phone, email, tags, isBlocked, aiAgentActive, userId });
      console.log("📋 Request body:", req.body);
      console.log("👤 User:", req.user);

      if (!name || !phone) {
        return res.status(400).json({ message: "Name and phone are required" });
      }

      // Prepare notes with AI agent status
      let contactNotes = notes || "";
      if (aiAgentActive !== undefined) {
        const notesData = { aiAgentActive, updatedAt: new Date().toISOString() };
        contactNotes = JSON.stringify(notesData);
      }

      const contact = await storage.createContact({
        name,
        phone_number: phone,
        email: email || null,
        tags: tags || [],
        status: isBlocked ? 'blocked' : 'active',
        group_id: null,
        notes: contactNotes,
        user_id: userId,
        userId
      });

      console.log("Contact created successfully:", contact);

      // Map response to frontend format
      const mappedContact = {
        id: contact.id.toString(),
        name: contact.name,
        phone: contact.phone_number,
        email: contact.email,
        tags: Array.isArray(contact.tags) ? contact.tags : (contact.tags ? [contact.tags] : []),
        notes: notes || "",
        isBlocked: contact.status === 'blocked',
        aiAgentActive: aiAgentActive || false,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at
      };

      // Emit real-time events for contact creation
      req.app.get('io').to(`user_${userId}`).emit('contact_updated', {
        action: 'created',
        contact: mappedContact
      });
      req.app.get('io').to(`user_${userId}`).emit('refresh_contacts');
      req.app.get('io').to(`user_${userId}`).emit('sync_all_data');

      res.json(mappedContact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "Failed to create contact", error: (error as Error).message });
    }
  });

  // Get contact by phone number
  app.get("/api/contacts/by-phone/:phone", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      const phone = decodeURIComponent(req.params.phone);

      console.log(`🔍 Looking for contact with phone: ${phone}`);

      // Get all contacts for the user
      const contacts = await storage.getContacts(userId);

      // Find contact by phone number (with normalization)
      const contact = contacts.find((c: any) => {
        const normalizedContactPhone = c.phone_number?.replace(/[^\d]/g, '');
        const normalizedSearchPhone = phone.replace(/[^\d]/g, '');

        // Compare normalized phone numbers
        return normalizedContactPhone === normalizedSearchPhone ||
               normalizedContactPhone === normalizedSearchPhone.substring(2) || // Remove country code
               normalizedContactPhone === `91${normalizedSearchPhone}` || // Add India country code
               c.phone_number === phone; // Exact match
      });

      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      // Map database fields to frontend interface
      let aiAgentActive = false;
      if (contact.notes) {
        try {
          const notesData = JSON.parse(contact.notes);
          if (typeof notesData === 'object' && notesData.aiAgentActive !== undefined) {
            aiAgentActive = notesData.aiAgentActive;
          }
        } catch (e) {
          // Notes is not JSON, ignore
        }
      }

      const mappedContact = {
        id: contact.id.toString(),
        name: contact.name,
        phone: contact.phone_number,
        email: contact.email,
        tags: Array.isArray(contact.tags) ? contact.tags : (contact.tags ? [contact.tags] : []),
        notes: contact.notes,
        isBlocked: contact.status === 'blocked',
        aiAgentActive: aiAgentActive,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at
      };

      res.json(mappedContact);
    } catch (error) {
      console.error("Error finding contact by phone:", error);
      res.status(500).json({ message: "Failed to find contact" });
    }
  });

  app.put("/api/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, phone, email, tags, notes, isBlocked, aiAgentActive } = req.body;
      const userId = (req.user as any).claims?.sub;

      // Prepare updates object
      const updates: any = {};

      if (name !== undefined) updates.name = name;
      if (phone !== undefined) updates.phone_number = phone;
      if (email !== undefined) updates.email = email;
      if (tags !== undefined) updates.tags = tags;
      if (isBlocked !== undefined) updates.status = isBlocked ? 'blocked' : 'active';

      // Handle notes and AI agent status
      if (notes !== undefined || aiAgentActive !== undefined) {
        let contactNotes = notes || "";
        if (aiAgentActive !== undefined) {
          const notesData = { aiAgentActive, updatedAt: new Date().toISOString() };
          contactNotes = JSON.stringify(notesData);
        }
        updates.notes = contactNotes;
      }

      const contact = await storage.updateContact(id, updates);

      // Map response to frontend format
      let mappedAiAgentActive = false;
      if (contact.notes) {
        try {
          const notesData = JSON.parse(contact.notes);
          if (typeof notesData === 'object' && notesData.aiAgentActive !== undefined) {
            mappedAiAgentActive = notesData.aiAgentActive;
          }
        } catch (e) {
          // Notes is not JSON, ignore
        }
      }

      const mappedContact = {
        id: contact.id.toString(),
        name: contact.name,
        phone: contact.phone_number,
        email: contact.email,
        tags: Array.isArray(contact.tags) ? contact.tags : (contact.tags ? [contact.tags] : []),
        notes: notes || "",
        isBlocked: contact.status === 'blocked',
        aiAgentActive: mappedAiAgentActive,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at
      };

      // Emit real-time events for contact update
      req.app.get('io').to(`user_${userId}`).emit('contact_updated', {
        action: 'updated',
        contact: mappedContact
      });
      req.app.get('io').to(`user_${userId}`).emit('refresh_contacts');
      req.app.get('io').to(`user_${userId}`).emit('sync_all_data');

      res.json(mappedContact);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).claims?.sub;

      await storage.deleteContact(id);

      // Emit real-time events for contact deletion
      req.app.get('io').to(`user_${userId}`).emit('contact_updated', {
        action: 'deleted',
        contactId: id
      });
      req.app.get('io').to(`user_${userId}`).emit('refresh_contacts');
      req.app.get('io').to(`user_${userId}`).emit('sync_all_data');

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Block/Unblock contact
  app.put("/api/contacts/:id/block", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isBlocked } = req.body;
      const userId = (req.user as any).claims?.sub;

      console.log(`🔄 PUT /api/contacts/${id}/block - Block status update:`, { id, isBlocked, userId });
      console.log("📋 Request body:", req.body);

      // Update contact status - use 'blocked' or 'active' status
      const status = isBlocked ? 'blocked' : 'active';
      console.log(`📝 Updating contact ${id} status to: ${status}`);

      const contact = await storage.updateContact(id, { status });
      console.log("✅ Contact updated successfully:", contact);

      // Emit real-time events for contact status update
      req.app.get('io').to(`user_${userId}`).emit('contact_updated', {
        action: 'status_updated',
        contact: { ...contact, isBlocked }
      });
      req.app.get('io').to(`user_${userId}`).emit('refresh_contacts');
      req.app.get('io').to(`user_${userId}`).emit('sync_all_data');

      res.json({
        success: true,
        message: `Contact ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
        contact: { ...contact, isBlocked }
      });
    } catch (error) {
      console.error("❌ Error updating contact block status:", error);
      console.error("❌ Error details:", (error as Error).message);
      console.error("❌ Error stack:", (error as Error).stack);
      res.status(500).json({
        message: "Failed to update contact status",
        error: (error as Error).message,
        details: (error as Error).toString()
      });
    }
  });

  // AI Agent toggle for contact
  app.put("/api/contacts/:id/ai-agent", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { aiAgentActive } = req.body;
      const userId = (req.user as any).claims?.sub;

      // For now, we'll store AI agent status in the notes field as JSON
      // In a real implementation, you'd want to add a proper column to the database
      const contact = await storage.updateContact(id, {
        notes: JSON.stringify({ aiAgentActive, updatedAt: new Date().toISOString() })
      });

      // Emit real-time events for AI agent status update
      req.app.get('io').to(`user_${userId}`).emit('contact_updated', {
        action: 'ai_agent_updated',
        contact: { ...contact, aiAgentActive }
      });
      req.app.get('io').to(`user_${userId}`).emit('refresh_contacts');
      req.app.get('io').to(`user_${userId}`).emit('sync_all_data');

      res.json({
        success: true,
        message: `AI Agent ${aiAgentActive ? 'activated' : 'deactivated'} successfully`,
        contact: { ...contact, aiAgentActive }
      });
    } catch (error) {
      console.error("Error updating AI agent status:", error);
      res.status(500).json({ message: "Failed to update AI agent status" });
    }
  });

  // AI Agents sync endpoint
  app.post("/api/ai-agents/sync", isAuthenticated, async (req, res) => {
    try {
      const { contactId, action, timestamp } = req.body;
      const userId = (req.user as any).claims?.sub;

      // Log the sync action for AI agents section
      console.log(`AI Agent sync: ${action} for contact ${contactId} at ${timestamp}`);

      // Emit real-time sync event to AI agents section
      req.app.get('io').to(`user_${userId}`).emit('ai_agent_sync', {
        contactId,
        action,
        timestamp
      });

      res.json({
        success: true,
        message: "AI agent sync completed",
        syncData: { contactId, action, timestamp }
      });
    } catch (error) {
      console.error("Error syncing AI agent:", error);
      res.status(500).json({ message: "Failed to sync AI agent" });
    }
  });

  // Contact Groups
  app.get("/api/contact-groups", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      const groups = await storage.getContactGroups(userId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching contact groups:", error);
      res.status(500).json({ message: "Failed to fetch contact groups" });
    }
  });

  // Templates
  app.get("/api/templates", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      const templates = await storage.getTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      const {
        name,
        content,
        category,
        variables,
        ctaButtons,
        mediaType,
        mediaUrl,
        mediaCaption,
        tags,
        language,
        isActive,
        estimatedReadTime
      } = req.body;

      if (!name || !content) {
        return res.status(400).json({ message: "Name and content are required" });
      }

      const template = await storage.createTemplate({
        name,
        content,
        category: category || 'general',
        variables: variables || [],
        ctaButtons: ctaButtons || [],
        mediaType: mediaType || null,
        mediaUrl: mediaUrl || null,
        mediaCaption: mediaCaption || null,
        tags: tags || [],
        language: language || 'en',
        isActive: isActive !== undefined ? isActive : true,
        estimatedReadTime: estimatedReadTime || null,
        userId
      });

      // Emit real-time events for template creation
      req.app.get('io').to(`user_${userId}`).emit('template_updated', {
        action: 'created',
        template
      });
      req.app.get('io').to(`user_${userId}`).emit('refresh_templates');
      req.app.get('io').to(`user_${userId}`).emit('sync_all_data');

      res.json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.put("/api/templates/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).claims?.sub;
      const {
        name,
        content,
        category,
        variables,
        ctaButtons,
        mediaType,
        mediaUrl,
        mediaCaption,
        tags,
        language,
        isActive,
        estimatedReadTime
      } = req.body;

      // Prepare updates object with proper field mapping
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (content !== undefined) updates.content = content;
      if (category !== undefined) updates.category = category;
      if (variables !== undefined) updates.variables = variables;
      if (ctaButtons !== undefined) updates.cta_buttons = ctaButtons;
      if (mediaType !== undefined) updates.media_type = mediaType;
      if (mediaUrl !== undefined) updates.media_url = mediaUrl;
      if (mediaCaption !== undefined) updates.media_caption = mediaCaption;
      if (tags !== undefined) updates.tags = tags;
      if (language !== undefined) updates.language = language;
      if (isActive !== undefined) updates.is_active = isActive;
      if (estimatedReadTime !== undefined) updates.estimated_read_time = estimatedReadTime;

      const template = await storage.updateTemplate(id, updates);

      // Emit real-time events for template update
      req.app.get('io').to(`user_${userId}`).emit('template_updated', {
        action: 'updated',
        template
      });
      req.app.get('io').to(`user_${userId}`).emit('refresh_templates');
      req.app.get('io').to(`user_${userId}`).emit('sync_all_data');

      res.json(template);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete("/api/templates/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).claims?.sub;

      await storage.deleteTemplate(id);

      // Emit real-time events for template deletion
      req.app.get('io').to(`user_${userId}`).emit('template_updated', {
        action: 'deleted',
        templateId: id
      });
      req.app.get('io').to(`user_${userId}`).emit('refresh_templates');
      req.app.get('io').to(`user_${userId}`).emit('sync_all_data');

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Send template with media support
  app.post("/api/templates/:id/send", isAuthenticated, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const userId = (req.user as any).claims?.sub;
      const { phoneNumber, sessionId, variables = {} } = req.body;

      if (!phoneNumber || !sessionId) {
        return res.status(400).json({ message: "Phone number and session ID are required" });
      }

      // Get template
      const templates = await storage.getTemplates(userId);
      const template = templates.find((t: any) => t.id === templateId);

      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Replace variables in content
      let content = template.content;
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value as string);
      });

      const whatsappWebService = (global as any).whatsappWebService;
      if (!whatsappWebService) {
        return res.status(503).json({ message: "WhatsApp Web service not available" });
      }

      let result;

      // Send media if template has media
      if (template.media_url && template.media_type) {
        result = await whatsappWebService.sendMedia(
          sessionId,
          phoneNumber,
          template.media_url,
          content, // Use content as caption
          template.media_type
        );
      } else {
        // Send text message
        result = await whatsappWebService.sendMessage(sessionId, phoneNumber, content);
      }

      // Update template usage
      await storage.updateTemplate(templateId, {
        usage_count: (template.usage_count || 0) + 1,
        last_used: new Date().toISOString()
      });

      res.json({
        success: true,
        messageId: result.id,
        timestamp: result.timestamp,
        status: result.status,
        sentWithMedia: !!(template.media_url && template.media_type)
      });
    } catch (error) {
      console.error("Error sending template:", error);
      res.status(500).json({ message: "Failed to send template" });
    }
  });

  // Campaigns
  app.get("/api/campaigns", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      const campaigns = await storage.getCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      const campaignData = { ...req.body, userId };

      const campaign = await storage.createCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  // Start campaign execution
  app.post("/api/campaigns/:id/start", isAuthenticated, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = (req.user as any).claims?.sub;

      console.log(`🚀 Starting campaign ${campaignId} for user ${userId}`);

      // Get campaign details first
      const campaigns = await storage.getCampaigns(userId || 'admin-user-123');
      const campaign = campaigns.find(c => c.id === campaignId);

      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }

      // Simple campaign start implementation
      await storage.updateCampaign(campaignId, {
        status: 'active',
        started_at: getIndianTimeISO(),
      });

      console.log(`✅ Campaign ${campaignId} started successfully`);

      res.json({
        success: true,
        message: "Campaign started successfully",
        campaignId
      });
    } catch (error) {
      console.error("Error starting campaign:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to start campaign"
      });
    }
  });

  // Pause campaign execution
  app.post("/api/campaigns/:id/pause", isAuthenticated, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = (req.user as any).claims?.sub;

      console.log(`⏸️ Pausing campaign ${campaignId} for user ${userId}`);

      // Simple campaign pause implementation
      await storage.updateCampaign(campaignId, {
        status: 'paused',
      });

      console.log(`✅ Campaign ${campaignId} paused successfully`);

      res.json({
        success: true,
        message: "Campaign paused successfully",
        campaignId
      });
    } catch (error) {
      console.error("Error pausing campaign:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to pause campaign"
      });
    }
  });

  // Stop campaign execution
  app.post("/api/campaigns/:id/stop", isAuthenticated, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = (req.user as any).claims?.sub;

      console.log(`🛑 Stopping campaign ${campaignId} for user ${userId}`);

      // Simple campaign stop implementation
      await storage.updateCampaign(campaignId, {
        status: 'cancelled',
        completed_at: getIndianTimeISO(),
      });

      console.log(`✅ Campaign ${campaignId} stopped successfully`);

      res.json({
        success: true,
        message: "Campaign stopped successfully",
        campaignId
      });
    } catch (error) {
      console.error("Error stopping campaign:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to stop campaign"
      });
    }
  });

  // Get campaign execution status
  app.get("/api/campaigns/:id/status", isAuthenticated, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);

      // Simple status check - get campaign from database
      const userId = (req.user as any).claims?.sub;
      const campaigns = await storage.getCampaigns(userId || 'admin-user-123');
      const campaign = campaigns.find(c => c.id === campaignId);

      const isExecuting = campaign?.status === 'active';

      res.json({
        campaignId,
        isExecuting,
        status: campaign?.status || 'unknown'
      });
    } catch (error) {
      console.error("Error getting campaign status:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get campaign status"
      });
    }
  });

  // ===== CONVERSATION & MESSAGE ROUTES =====

  // Get conversations
  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      const sessionId = req.query.sessionId as string;

      console.log('Fetching conversations for user:', userId, 'sessionId:', sessionId);

      const conversations = await storage.getConversations(userId);
      console.log('Found conversations:', conversations.length);

      // Deduplicate conversations by phone number first
      const deduplicatedConversations = deduplicateConversations(conversations);
      console.log('After deduplication:', deduplicatedConversations.length);

      // If sessionId is provided, filter conversations for that specific WhatsApp number
      let filteredConversations = deduplicatedConversations;
      if (sessionId) {
        // Get WhatsApp numbers to map sessionId to whatsappNumberId
        const whatsappNumbers = await storage.getWhatsappNumbers(userId);
        const whatsappNumber = whatsappNumbers.find((num: any) =>
          num.session_id === sessionId || num.id.toString() === sessionId
        );

        if (whatsappNumber) {
          filteredConversations = deduplicatedConversations.filter((conv: any) =>
            conv.whatsapp_number_id === whatsappNumber.id ||
            conv.whatsappNumberId === whatsappNumber.id
          );
        }
      }

      // Format conversations for frontend
      const formattedConversations = filteredConversations.map((conv: any) => ({
        id: conv.id,
        contactName: conv.contact_name || conv.contactName,
        contactPhone: conv.contact_phone || conv.contactPhone,
        lastMessage: conv.last_message || conv.lastMessage,
        lastMessageAt: conv.last_message_at || conv.lastMessageAt,
        unreadCount: conv.unread_count || conv.unreadCount || 0,
        whatsappNumberId: conv.whatsapp_number_id || conv.whatsappNumberId,
        isPinned: conv.is_pinned || false
      }));

      console.log('Returning formatted conversations:', formattedConversations.length);
      res.json(formattedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations", error: (error as any).message });
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get messages by conversation ID (alternative endpoint for frontend)
  app.get("/api/messages/:conversationId", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      console.log('📨 Fetching messages for conversation:', conversationId);

      const messages = await storage.getMessages(conversationId);

      // Format messages for frontend
      const formattedMessages = messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.created_at || msg.timestamp,
        direction: msg.direction === 'inbound' ? 'incoming' : 'outgoing',
        status: msg.status || 'sent',
        type: msg.message_type || 'text',
        mediaUrl: msg.media_url,
        mediaType: msg.media_type,
        mediaFilename: msg.media_filename,
        mediaSize: msg.media_size,
        whatsappNumberId: msg.whatsapp_number_id,
        conversationId: msg.conversation_id
      }));

      console.log('📨 Returning formatted messages:', formattedMessages.length);
      res.json(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send direct message
  app.post("/api/messages/send-direct", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      const { recipientPhone, message, whatsappNumberId } = req.body;

      if (!recipientPhone || !message) {
        return res.status(400).json({ message: "Recipient phone and message are required" });
      }

      // Normalize the phone number for consistent handling
      const normalizedPhone = normalizePhoneNumber(recipientPhone);
      console.log(`📤 Sending message to ${recipientPhone} (normalized: ${normalizedPhone}): ${message}`);

      // Try to send via WhatsApp if session is available
      let whatsappMessageId = null;
      let messageStatus = 'pending';
      let selectedWhatsappNumberId = whatsappNumberId;

      try {
        const whatsappWebService = (global as any).whatsappWebService;
        if (!whatsappWebService) {
          throw new Error("WhatsApp Web service not available");
        }

        // Get active sessions
        const activeSessions = await whatsappWebService.getActiveSessions();
        const activeSession = activeSessions.find(session => session.status === 'ready' || session.status === 'connected');

        if (activeSession) {
          console.log(`Sending direct message via WhatsApp session: ${activeSession.sessionId} to ${recipientPhone}`);
          const result = await whatsappWebService.sendMessage(activeSession.sessionId, normalizedPhone, message);
          whatsappMessageId = result.id;
          messageStatus = result.status;
          console.log('✅ Direct message sent via WhatsApp:', result);

          // If no whatsappNumberId was provided, try to find the matching WhatsApp number
          if (!selectedWhatsappNumberId) {
            const whatsappNumbers = await storage.getWhatsappNumbers(userId);
            const matchingNumber = whatsappNumbers.find(num =>
              num.session_data &&
              typeof num.session_data === 'object' &&
              (num.session_data as any).sessionId === activeSession.sessionId
            );
            if (matchingNumber) {
              selectedWhatsappNumberId = matchingNumber.id;
            }
          }
        } else {
          console.error('❌ No active WhatsApp sessions available');
        }
      } catch (error) {
        console.error('❌ Failed to send direct message via WhatsApp, storing as pending:', error);
      }

      // Create or find conversation using normalized phone number
      const conversations = await storage.getConversations(userId);
      let conversation = findConversationByPhone(conversations, normalizedPhone);

      if (!conversation) {
        conversation = await storage.createConversation({
          userId,
          user_id: userId,
          contact_id: null,
          whatsapp_number_id: selectedWhatsappNumberId || null,
          contact_name: recipientPhone, // Keep original for display
          contact_phone: normalizedPhone, // Use normalized for storage
          last_message: message,
          last_message_at: new Date().toISOString(),
          unread_count: 0,
          tags: [],
          status: 'active'
        });
        console.log(`✅ Created new conversation for ${recipientPhone} (normalized: ${normalizedPhone})`);
      }

      const messageRecord = await storage.createMessage({
        conversation_id: conversation.id,
        direction: 'outbound',
        message_type: 'text',
        content: message,
        timestamp: new Date().toISOString(),
        message_id: whatsappMessageId,
        whatsapp_message_id: whatsappMessageId,
        status: messageStatus
      });

      // Update conversation with last message
      await storage.updateConversation(conversation.id, {
        last_message: message,
        last_message_at: new Date().toISOString()
      });

      // Emit real-time events for comprehensive sync
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${userId}`).emit('message_sent', {
          conversationId: conversation.id,
          message: messageRecord,
          conversation: {
            ...conversation,
            lastMessage: message,
            lastMessageAt: new Date().toISOString()
          }
        });
        io.to(`user_${userId}`).emit('refresh_conversations');
        io.to(`user_${userId}`).emit('refresh_messages', conversation.id);
      }

      res.json({
        success: true,
        conversation,
        message: messageRecord,
        sentViaWhatsApp: !!whatsappMessageId
      });
    } catch (error) {
      console.error("Error sending direct message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      const { contactId, contactName, contactPhone } = req.body;

      console.log("Creating conversation with data:", { contactId, contactName, contactPhone, userId });

      if (!contactName || !contactPhone) {
        return res.status(400).json({ message: "Name and phone are required" });
      }

      const conversation = await storage.createConversation({
        userId,
        contactId: contactId || null,
        whatsappNumberId: null,
        contactName,
        contactPhone,
        lastMessage: null,
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        tags: [],
        status: 'active'
      });

      console.log("Conversation created successfully:", conversation);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation", error: error.message });
    }
  });

  // Send message to existing conversation
  app.post("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content, whatsappNumberId } = req.body;

      console.log(`📤 Sending message to conversation ${conversationId}:`, { content, whatsappNumberId });

      if (!content) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Get conversation details
      const userId = (req.user as any).claims?.sub;
      const conversations = await storage.getConversations(userId);
      const conversation = conversations.find(c => c.id === conversationId);

      if (!conversation) {
        console.error(`❌ Conversation ${conversationId} not found`);
        return res.status(404).json({ message: "Conversation not found" });
      }

      console.log(`📱 Found conversation:`, {
        id: conversation.id,
        contactName: conversation.contact_name || conversation.contactName,
        contactPhone: conversation.contact_phone || conversation.contactPhone,
        whatsappNumberId: conversation.whatsapp_number_id || conversation.whatsappNumberId
      });

      // Try to send via WhatsApp if session is available
      let whatsappMessageId = null;
      let messageStatus = 'pending';

      // Determine which WhatsApp number to use
      // Priority: 1. Provided whatsappNumberId, 2. Conversation's whatsapp_number_id, 3. Any available connected number
      let targetWhatsappNumberId = whatsappNumberId || conversation.whatsapp_number_id || conversation.whatsappNumberId;

      // If still no WhatsApp number ID, try to find any connected number
      if (!targetWhatsappNumberId) {
        const whatsappNumbers = await storage.getWhatsappNumbers(userId);
        const connectedNumber = whatsappNumbers.find(num =>
          num.status === 'connected' &&
          num.session_data &&
          typeof num.session_data === 'object' &&
          (num.session_data as any).sessionId
        );
        if (connectedNumber) {
          targetWhatsappNumberId = connectedNumber.id;
          console.log(`📱 Using available connected WhatsApp number: ${connectedNumber.phone_number}`);
        }
      }

      if (targetWhatsappNumberId) {
        try {
          // Get the WhatsApp number record to find the session ID
          const userId = (req.user as any).claims?.sub;
          const whatsappNumbers = await storage.getWhatsappNumbers(userId);
          const whatsappNumber = whatsappNumbers.find(num => num.id === targetWhatsappNumberId);

          if (whatsappNumber && whatsappNumber.session_data && typeof whatsappNumber.session_data === 'object') {
            const sessionId = (whatsappNumber.session_data as any).sessionId;

            if (sessionId) {
              const contactPhone = conversation.contact_phone || conversation.contactPhone;
              console.log(`📤 Sending message via WhatsApp session: ${sessionId} to ${contactPhone}`);
              const whatsappWebService = (global as any).whatsappWebService;
              if (whatsappWebService) {
                const result = await whatsappWebService.sendMessage(sessionId, contactPhone, content);
                whatsappMessageId = result.id;
                messageStatus = result.status;
                console.log('✅ Message sent via WhatsApp:', result);
              }

              // Update conversation's whatsapp_number_id if it wasn't set
              if (!conversation.whatsapp_number_id && !conversation.whatsappNumberId) {
                await storage.updateConversation(conversationId, {
                  whatsapp_number_id: targetWhatsappNumberId
                });
                console.log(`📱 Updated conversation ${conversationId} with WhatsApp number ID: ${targetWhatsappNumberId}`);
              }
            } else {
              console.error('❌ No session ID found in WhatsApp number data');
            }
          } else {
            console.error('❌ WhatsApp number not found or no session data');
          }
        } catch (error) {
          console.error('❌ Failed to send via WhatsApp, storing as pending:', error);
        }
      } else {
        console.log('⚠️ No WhatsApp number ID specified, storing message as pending');
      }

      const messageRecord = await storage.createMessage({
        conversation_id: conversationId,
        direction: 'outbound',
        message_type: 'text',
        content,
        timestamp: new Date().toISOString(),
        message_id: whatsappMessageId,
        whatsapp_message_id: whatsappMessageId,
        status: messageStatus
      });

      // Update conversation with last message
      await storage.updateConversation(conversationId, {
        last_message: content,
        last_message_at: new Date().toISOString()
      });

      // Emit real-time events for comprehensive sync
      if (userId) {
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${userId}`).emit('message_sent', {
            conversationId,
            message: messageRecord,
            conversation: {
              ...conversation,
              lastMessage: content,
              lastMessageAt: new Date().toISOString()
            }
          });
          io.to(`user_${userId}`).emit('refresh_conversations');
          io.to(`user_${userId}`).emit('refresh_messages', conversationId);
        }
      }

      res.json({
        success: true,
        message: messageRecord,
        sentViaWhatsApp: !!whatsappMessageId
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Send media to existing conversation
  app.post("/api/conversations/:id/media", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { caption, whatsappNumberId } = req.body;
      const file = req.file;

      console.log(`📤 Sending media to conversation ${conversationId}:`, {
        filename: file?.originalname,
        mimetype: file?.mimetype,
        size: file?.size,
        caption,
        whatsappNumberId
      });

      if (!file) {
        return res.status(400).json({ message: "Media file is required" });
      }

      // Get conversation details
      const userId = (req.user as any).claims?.sub;
      const conversations = await storage.getConversations(userId);
      const conversation = conversations.find(c => c.id === conversationId);

      if (!conversation) {
        console.error(`❌ Conversation ${conversationId} not found`);
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Upload file to storage (returns local file path)
      const localFilePath = await storage.uploadFile(file);
      console.log(`📁 File uploaded to:`, localFilePath);

      // Create public URL for display purposes
      const fileName = path.basename(localFilePath);
      const publicUrl = `/uploads/media/${fileName}`;

      // Determine message type based on file mimetype
      let messageType = 'document';
      if (file.mimetype.startsWith('image/')) messageType = 'image';
      else if (file.mimetype.startsWith('video/')) messageType = 'video';
      else if (file.mimetype.startsWith('audio/')) messageType = 'audio';

      // Try to send via WhatsApp if session is available
      let whatsappMessageId = null;
      let messageStatus = 'pending';

      // Determine which WhatsApp number to use
      let targetWhatsappNumberId = whatsappNumberId || conversation.whatsapp_number_id || conversation.whatsappNumberId;

      // If still no WhatsApp number ID, try to find any connected number
      if (!targetWhatsappNumberId) {
        const whatsappNumbers = await storage.getWhatsappNumbers(userId);
        const connectedNumber = whatsappNumbers.find(num =>
          num.status === 'connected' &&
          num.session_data &&
          typeof num.session_data === 'object' &&
          (num.session_data as any).sessionId
        );
        if (connectedNumber) {
          targetWhatsappNumberId = connectedNumber.id;
          console.log(`📱 Using available connected WhatsApp number: ${connectedNumber.phone_number}`);
        }
      }

      if (targetWhatsappNumberId) {
        try {
          // Get the WhatsApp number record to find the session ID
          const whatsappNumbers = await storage.getWhatsappNumbers(userId);
          const whatsappNumber = whatsappNumbers.find(num => num.id === targetWhatsappNumberId);

          if (whatsappNumber && whatsappNumber.session_data && typeof whatsappNumber.session_data === 'object') {
            const sessionId = (whatsappNumber.session_data as any).sessionId;

            if (sessionId) {
              const contactPhone = conversation.contact_phone || conversation.contactPhone;
              console.log(`📤 Sending media via WhatsApp session: ${sessionId} to ${contactPhone}`);

              const whatsappWebService = (global as any).whatsappWebService;
              if (whatsappWebService) {
                const result = await whatsappWebService.sendMedia(sessionId, contactPhone, localFilePath, caption || '', messageType);
                whatsappMessageId = result.id;
                messageStatus = result.status;
                console.log('✅ Media sent via WhatsApp:', result);
              } else {
                console.log('⚠️ WhatsApp Web service not available');
                messageStatus = 'pending';
              }

              // Update conversation's whatsapp_number_id if it wasn't set
              if (!conversation.whatsapp_number_id && !conversation.whatsappNumberId) {
                await storage.updateConversation(conversationId, {
                  whatsapp_number_id: targetWhatsappNumberId
                });
                console.log(`📱 Updated conversation ${conversationId} with WhatsApp number ID: ${targetWhatsappNumberId}`);
              }
            } else {
              console.error('❌ No session ID found in WhatsApp number data');
            }
          } else {
            console.error('❌ WhatsApp number not found or no session data');
          }
        } catch (error) {
          console.error('❌ Failed to send media via WhatsApp, storing as pending:', error);
          messageStatus = 'failed';

          // Return specific error if it's a critical failure
          if (error.message && error.message.includes('not found')) {
            return res.status(404).json({
              message: "WhatsApp session not found or disconnected",
              error: error.message
            });
          }
        }
      } else {
        console.log('⚠️ No WhatsApp number ID specified, storing media as pending');
      }

      // Save message to database
      const messageRecord = await storage.createMessage({
        conversation_id: conversationId,
        direction: 'outbound',
        message_type: messageType,
        content: caption || '',
        timestamp: new Date().toISOString(),
        message_id: whatsappMessageId,
        whatsapp_message_id: whatsappMessageId,
        status: messageStatus,
        media_url: publicUrl,
        media_type: file.mimetype,
        media_size: file.size,
        media_filename: file.originalname
      });

      // Update conversation with last message
      const lastMessageText = caption || `📎 ${messageType}`;
      await storage.updateConversation(conversationId, {
        last_message: lastMessageText,
        last_message_at: new Date().toISOString()
      });

      // Emit real-time events
      if (userId) {
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${userId}`).emit('message_sent', {
            conversationId,
            message: messageRecord,
            conversation: {
              ...conversation,
              lastMessage: lastMessageText,
              lastMessageAt: new Date().toISOString()
            }
          });
          io.to(`user_${userId}`).emit('refresh_conversations');
          io.to(`user_${userId}`).emit('refresh_messages', conversationId);
        }
      }

      res.json({
        success: true,
        message: messageRecord,
        sentViaWhatsApp: !!whatsappMessageId
      });
    } catch (error: any) {
      console.error("❌ Error sending media:", error);
      res.status(500).json({ message: "Failed to send media", error: error.message });
    }
  });

  // Update conversation AI settings
  app.put("/api/conversations/:id/ai", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { ai_enabled } = req.body;
      const userId = (req.user as any).claims?.sub;

      // Update conversation AI settings
      await storage.updateConversation(conversationId, { ai_enabled }, userId);

      res.json({ success: true, message: "AI settings updated" });
    } catch (error) {
      console.error("Error updating AI settings:", error);
      res.status(500).json({ message: "Failed to update AI settings" });
    }
  });

  // Block/Unblock conversation
  app.put("/api/conversations/:id/block", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { is_blocked } = req.body;
      const userId = (req.user as any).claims?.sub;

      // Update conversation block status
      await storage.updateConversation(conversationId, { is_blocked }, userId);

      res.json({ success: true, message: "Contact updated" });
    } catch (error) {
      console.error("Error updating block status:", error);
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  // Pin/Unpin conversation
  app.patch("/api/conversations/:id/pin", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { isPinned } = req.body;
      const userId = (req.user as any).claims?.sub;

      console.log(`📌 ${isPinned ? 'Pinning' : 'Unpinning'} conversation ${conversationId} for user ${userId}`);

      // Update conversation pin status
      await storage.updateConversationPin(conversationId, isPinned, userId);

      // Emit real-time update
      if (io) {
        io.to(`user_${userId}`).emit('conversation_pinned', {
          conversationId,
          isPinned
        });
        io.to(`user_${userId}`).emit('refresh_conversations');
      }

      res.json({
        success: true,
        message: isPinned ? "Conversation pinned successfully" : "Conversation unpinned successfully",
        isPinned
      });
    } catch (error) {
      console.error("Error updating conversation pin status:", error);
      res.status(500).json({ message: "Failed to update pin status" });
    }
  });

  // Delete ALL chats for a user (must be before :id route)
  app.delete("/api/conversations/all", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub || "admin-user-123";

      console.log(`🗑️ DELETE ALL CHATS REQUEST - User: ${userId}`);
      console.log(`🗑️ Storage instance:`, typeof storage);
      console.log(`🗑️ deleteAllChats method:`, typeof storage.deleteAllChats);

      // Check if the method exists
      if (!storage.deleteAllChats) {
        console.error(`❌ deleteAllChats method not found on storage instance`);
        return res.status(500).json({
          message: "Delete all chats method not available",
          error: "Method not implemented"
        });
      }

      // Delete all chats and conversations for this user
      const result = await storage.deleteAllChats(userId);

      // Emit real-time updates
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${userId}`).emit('all_chats_deleted', {
          deletedConversations: result.deletedConversations,
          deletedMessages: result.deletedMessages
        });
        io.to(`user_${userId}`).emit('refresh_conversations');
        io.to(`user_${userId}`).emit('global_data_sync');
      }

      console.log(`✅ Successfully deleted ALL chats for user ${userId}: ${result.deletedConversations} conversations, ${result.deletedMessages} messages`);

      res.json({
        success: true,
        message: `Successfully deleted all chats`,
        deletedConversations: result.deletedConversations,
        deletedMessages: result.deletedMessages
      });
    } catch (error) {
      console.error("Error deleting all chats:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        message: "Failed to delete all chats",
        error: error.message || "Unknown error"
      });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = (req.user as any).claims?.sub;

      // Delete conversation and all its messages
      await storage.deleteConversation(conversationId, userId);

      res.json({ success: true, message: "Conversation deleted" });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // WhatsApp media sending endpoint (with file upload for inbox)
  app.post("/api/whatsapp/send-media", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      const { to, sessionId, caption } = req.body;
      const file = req.file;
      const userId = (req.user as any).claims?.sub;

      console.log(`📤 Inbox media upload:`, {
        to,
        sessionId,
        caption,
        filename: file?.originalname,
        mimetype: file?.mimetype,
        size: file?.size
      });

      if (!sessionId || !to) {
        return res.status(400).json({ message: "Session ID and recipient phone number are required" });
      }

      if (!file) {
        return res.status(400).json({ message: "Media file is required" });
      }

      const whatsappWebService = (global as any).whatsappWebService;
      if (!whatsappWebService) {
        return res.status(503).json({ message: "WhatsApp Web service not available" });
      }

      // Save file to local storage
      const uploadsDir = path.join(process.cwd(), 'uploads', 'media');
      await fsPromises.mkdir(uploadsDir, { recursive: true });

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;
      const localFilePath = path.join(uploadsDir, fileName);

      // Write file to disk
      await fsPromises.writeFile(localFilePath, file.buffer);

      console.log(`💾 File saved to: ${localFilePath}`);

      // Send media via WhatsApp
      const result = await whatsappWebService.sendMedia(sessionId, to, localFilePath, caption || '', file.mimetype);

      console.log('✅ Media sent via WhatsApp:', result);

      // Store message in database
      const normalizedPhone = normalizePhoneNumber(to);

      // Find or create conversation
      let conversation = await storage.findConversationByPhone(userId, normalizedPhone);
      if (!conversation) {
        conversation = await storage.createConversation(userId, normalizedPhone, normalizedPhone);
      }

      // Create message record (with fallback for missing columns)
      const messageData: any = {
        conversationId: conversation.id,
        content: caption || `📎 ${file.originalname}`,
        direction: 'outgoing',
        whatsappMessageId: result.id,
        status: result.status || 'sent',
        mediaUrl: `/api/media/${fileName}`
      };

      // Add media fields if columns exist (will be ignored if columns don't exist)
      try {
        messageData.mediaType = file.mimetype;
        messageData.mediaFilename = file.originalname;
        messageData.mediaSize = file.size;
      } catch (error) {
        console.log('⚠️ Media columns not available yet, storing basic info only');
      }

      const messageRecord = await storage.createMessage(messageData);

      // Update conversation last message
      await storage.updateConversation(conversation.id, {
        lastMessage: caption || `📎 ${file.originalname}`,
        lastMessageAt: new Date().toISOString()
      });

      // Emit real-time events
      const io = req.app.get('io');
      if (io && userId) {
        io.to(`user_${userId}`).emit('message_sent', {
          conversationId: conversation.id,
          message: messageRecord,
          conversation: {
            ...conversation,
            lastMessage: caption || `📎 ${file.originalname}`,
            lastMessageAt: new Date().toISOString()
          }
        });
        io.to(`user_${userId}`).emit('refresh_conversations');
        io.to(`user_${userId}`).emit('refresh_messages', conversation.id);
      }

      res.json({
        success: true,
        messageId: result.id,
        timestamp: result.timestamp,
        status: result.status,
        message: messageRecord
      });
    } catch (error: any) {
      console.error("❌ Error sending media:", error);
      res.status(500).json({ message: "Failed to send media", error: error.message });
    }
  });

  // Media file serving endpoint
  app.get("/api/media/:filename", (req, res) => {
    try {
      const { filename } = req.params;
      const mediaPath = path.join(process.cwd(), 'uploads', 'media', filename);

      // Check if file exists
      if (!fs.existsSync(mediaPath)) {
        return res.status(404).json({ message: "Media file not found" });
      }

      // Set appropriate headers
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.mp4': 'video/mp4',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

      // Stream the file
      const fileStream = fs.createReadStream(mediaPath);
      fileStream.pipe(res);

    } catch (error) {
      console.error("Error serving media file:", error);
      res.status(500).json({ message: "Failed to serve media file" });
    }
  });

  // WhatsApp media sending endpoint (with media path - for templates)
  app.post("/api/whatsapp/send-media-path", isAuthenticated, async (req, res) => {
    try {
      const { sessionId, phoneNumber, mediaPath, caption, mediaType } = req.body;
      const userId = (req.user as any).claims?.sub;

      if (!sessionId || !phoneNumber || !mediaPath) {
        return res.status(400).json({ message: "Session ID, phone number, and media path are required" });
      }

      const whatsappWebService = (global as any).whatsappWebService;
      if (!whatsappWebService) {
        return res.status(503).json({ message: "WhatsApp Web service not available" });
      }

      const result = await whatsappWebService.sendMedia(sessionId, phoneNumber, mediaPath, caption, mediaType);

      res.json({
        success: true,
        messageId: result.id,
        timestamp: result.timestamp,
        status: result.status
      });
    } catch (error) {
      console.error("Error sending media:", error);
      res.status(500).json({ message: "Failed to send media" });
    }
  });

  // WhatsApp location sending endpoint
  app.post("/api/whatsapp/send-location", isAuthenticated, async (req, res) => {
    try {
      const { sessionId, phoneNumber, latitude, longitude, description } = req.body;
      const userId = (req.user as any).claims?.sub;

      if (!sessionId || !phoneNumber || !latitude || !longitude) {
        return res.status(400).json({ message: "Session ID, phone number, latitude, and longitude are required" });
      }

      const result = await whatsappService.sendLocation(sessionId, phoneNumber, latitude, longitude, description);

      res.json({
        success: true,
        messageId: result.id,
        timestamp: result.timestamp,
        status: result.status
      });
    } catch (error) {
      console.error("Error sending location:", error);
      res.status(500).json({ message: "Failed to send location" });
    }
  });

  // WhatsApp contact card sending endpoint
  app.post("/api/whatsapp/send-contact", isAuthenticated, async (req, res) => {
    try {
      const { sessionId, phoneNumber, contactData } = req.body;
      const userId = (req.user as any).claims?.sub;

      if (!sessionId || !phoneNumber || !contactData) {
        return res.status(400).json({ message: "Session ID, phone number, and contact data are required" });
      }

      const result = await whatsappService.sendContact(sessionId, phoneNumber, contactData);

      res.json({
        success: true,
        messageId: result.id,
        timestamp: result.timestamp,
        status: result.status
      });
    } catch (error) {
      console.error("Error sending contact:", error);
      res.status(500).json({ message: "Failed to send contact" });
    }
  });

  // WhatsApp message reply endpoint
  app.post("/api/whatsapp/reply-message", isAuthenticated, async (req, res) => {
    try {
      const { sessionId, phoneNumber, replyText, quotedMessageId } = req.body;
      const userId = (req.user as any).claims?.sub;

      if (!sessionId || !phoneNumber || !replyText || !quotedMessageId) {
        return res.status(400).json({ message: "Session ID, phone number, reply text, and quoted message ID are required" });
      }

      const result = await whatsappService.replyToMessage(sessionId, phoneNumber, replyText, quotedMessageId);

      res.json({
        success: true,
        messageId: result.id,
        timestamp: result.timestamp,
        status: result.status
      });
    } catch (error) {
      console.error("Error sending reply:", error);
      res.status(500).json({ message: "Failed to send reply" });
    }
  });

  // WhatsApp contact info endpoint
  app.get("/api/whatsapp/contact-info/:sessionId/:phoneNumber", isAuthenticated, async (req, res) => {
    try {
      const { sessionId, phoneNumber } = req.params;
      const userId = (req.user as any).claims?.sub;

      const contactInfo = await whatsappService.getContactInfo(sessionId, phoneNumber);

      res.json({
        success: true,
        contact: contactInfo
      });
    } catch (error) {
      console.error("Error getting contact info:", error);
      res.status(500).json({ message: "Failed to get contact info" });
    }
  });

  // WhatsApp set status endpoint
  app.post("/api/whatsapp/set-status", isAuthenticated, async (req, res) => {
    try {
      const { sessionId, status } = req.body;
      const userId = (req.user as any).claims?.sub;

      if (!sessionId || !status) {
        return res.status(400).json({ message: "Session ID and status are required" });
      }

      const result = await whatsappService.setStatus(sessionId, status);

      res.json({
        success: true,
        status: result.status
      });
    } catch (error) {
      console.error("Error setting status:", error);
      res.status(500).json({ message: "Failed to set status" });
    }
  });

  // WhatsApp create group endpoint
  app.post("/api/whatsapp/create-group", isAuthenticated, async (req, res) => {
    try {
      const { sessionId, groupName, participants } = req.body;
      const userId = (req.user as any).claims?.sub;

      if (!sessionId || !groupName || !participants || participants.length === 0) {
        return res.status(400).json({ message: "Session ID, group name, and participants are required" });
      }

      const result = await whatsappService.createGroup(sessionId, groupName, participants);

      res.json({
        success: true,
        group: result
      });
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  // WhatsApp add group participants endpoint
  app.post("/api/whatsapp/add-group-participants", isAuthenticated, async (req, res) => {
    try {
      const { sessionId, groupId, participants } = req.body;
      const userId = (req.user as any).claims?.sub;

      if (!sessionId || !groupId || !participants || participants.length === 0) {
        return res.status(400).json({ message: "Session ID, group ID, and participants are required" });
      }

      const result = await whatsappService.addGroupParticipants(sessionId, groupId, participants);

      res.json({
        success: true,
        result
      });
    } catch (error) {
      console.error("Error adding group participants:", error);
      res.status(500).json({ message: "Failed to add group participants" });
    }
  });

  // WhatsApp remove group participants endpoint
  app.post("/api/whatsapp/remove-group-participants", isAuthenticated, async (req, res) => {
    try {
      const { sessionId, groupId, participants } = req.body;
      const userId = (req.user as any).claims?.sub;

      if (!sessionId || !groupId || !participants || participants.length === 0) {
        return res.status(400).json({ message: "Session ID, group ID, and participants are required" });
      }

      const result = await whatsappService.removeGroupParticipants(sessionId, groupId, participants);

      res.json({
        success: true,
        result
      });
    } catch (error) {
      console.error("Error removing group participants:", error);
      res.status(500).json({ message: "Failed to remove group participants" });
    }
  });

  // Media serving endpoint
  app.get("/api/media/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const mediaPath = path.join(process.cwd(), 'uploads/media', filename);

      // Check if file exists
      if (!fs.existsSync(mediaPath)) {
        return res.status(404).json({ message: "Media file not found" });
      }

      // Get file stats for content length
      const stats = fs.statSync(mediaPath);

      // Set appropriate headers
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

      // Determine content type from file extension
      const ext = path.extname(filename).toLowerCase();
      const contentTypes: { [key: string]: string } = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.avi': 'video/avi',
        '.mov': 'video/quicktime',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain'
      };

      const contentType = contentTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);

      // Check if download is requested
      if (req.query.download === 'true') {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }

      // Stream the file
      const fileStream = fs.createReadStream(mediaPath);
      fileStream.pipe(res);

    } catch (error) {
      console.error("Error serving media:", error);
      res.status(500).json({ message: "Failed to serve media" });
    }
  });

  // Media download endpoint
  app.get("/api/media/:filename/download", async (req, res) => {
    try {
      const filename = req.params.filename;
      const mediaPath = path.join(process.cwd(), 'uploads/media', filename);

      // Check if file exists
      if (!fs.existsSync(mediaPath)) {
        return res.status(404).json({ message: "Media file not found" });
      }

      // Get file stats for content length
      const stats = fs.statSync(mediaPath);

      // Set download headers
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/octet-stream');

      // Stream the file
      const fileStream = fs.createReadStream(mediaPath);
      fileStream.pipe(res);

    } catch (error) {
      console.error("Error downloading media:", error);
      res.status(500).json({ message: "Failed to download media" });
    }
  });

  // Media upload endpoint
  app.post("/api/upload-media", isAuthenticated, async (req, res) => {
    try {

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Configure multer for file upload
      const storage = multer.diskStorage({
        destination: (req: any, file: any, cb: any) => {
          cb(null, uploadsDir);
        },
        filename: (req: any, file: any, cb: any) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
      });

      const upload = multer({
        storage,
        limits: {
          fileSize: 50 * 1024 * 1024 // 50MB limit
        },
        fileFilter: (req: any, file: any, cb: any) => {
          // Allow images, videos, audio, and documents
          const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|mp3|wav|pdf|doc|docx|txt/;
          const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
          const mimetype = allowedTypes.test(file.mimetype);

          if (mimetype && extname) {
            return cb(null, true);
          } else {
            cb(new Error('Invalid file type'));
          }
        }
      }).single('media');

      upload(req, res, (err: any) => {
        if (err) {
          console.error('Upload error:', err);
          return res.status(400).json({ message: err.message });
        }

        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }

        const mediaPath = req.file.path;
        const mediaType = req.file.mimetype;

        res.json({
          success: true,
          mediaPath,
          mediaType,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size
        });
      });
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({ message: "Failed to upload media" });
    }
  });

  // Send bulk messages
  app.post("/api/messages/send-bulk", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      const { message, selectedContacts, whatsappNumberId, delayBetweenMessages = 5 } = req.body;

      if (!message || !selectedContacts || selectedContacts.length === 0) {
        return res.status(400).json({ message: "Message and contacts are required" });
      }

      const contacts = await storage.getContacts(userId);
      const selectedContactsData = contacts.filter((contact: any) =>
        selectedContacts.includes(contact.id)
      );

      // Create conversations and messages for each contact
      const results = [];
      for (const contact of selectedContactsData) {
        try {
          const conversation = await storage.createConversation({
            userId,
            contactId: contact.id,
            whatsappNumberId: whatsappNumberId || null,
            contactName: contact.name,
            contactPhone: contact.phone_number,
            lastMessage: message,
            lastMessageAt: new Date().toISOString(),
            unreadCount: 0,
            tags: [],
            status: 'active'
          });

          const messageRecord = await storage.createMessage({
            conversation_id: conversation.id,
            whatsapp_number_id: whatsappNumberId || null,
            direction: 'outbound',
            message_type: 'text',
            content: message,
            timestamp: new Date().toISOString(),
            status: 'sent'
          });

          results.push({ contact: contact.name, status: 'queued', messageId: messageRecord.id });
        } catch (error) {
          results.push({ contact: contact.name, status: 'failed', error: error.message });
        }
      }

      res.json({
        success: true,
        results,
        totalContacts: selectedContacts.length,
        successCount: results.filter(r => r.status === 'queued').length,
        failedCount: results.filter(r => r.status === 'failed').length,
        note: "Messages queued. In production, these would be sent via WhatsApp with delays."
      });
    } catch (error) {
      console.error("Error sending bulk messages:", error);
      res.status(500).json({ message: "Failed to send bulk messages" });
    }
  });

  // Schedule message
  app.post("/api/messages/schedule", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      const { message, recipientPhone, whatsappNumberId, scheduledAt, timezone } = req.body;

      if (!message || !recipientPhone || !scheduledAt) {
        return res.status(400).json({ message: "Message, recipient phone, and scheduled time are required" });
      }

      // Create a campaign for the scheduled message
      const campaign = await storage.createCampaign({
        userId,
        name: `Scheduled Message - ${new Date(scheduledAt).toLocaleString()}`,
        message,
        whatsappNumberId: whatsappNumberId || null,
        status: 'scheduled',
        scheduledAt,
        targetContacts: [{ phone: recipientPhone }],
        totalContacts: 1,
        messagesSent: 0,
        messagesDelivered: 0,
        messagesFailed: 0,
        messagesRead: 0
      });

      res.json({
        success: true,
        campaign,
        scheduledAt,
        note: "Message scheduled. In production, this would be sent at the specified time."
      });
    } catch (error) {
      console.error("Error scheduling message:", error);
      res.status(500).json({ message: "Failed to schedule message" });
    }
  });

  // Get WhatsApp numbers
  app.get("/api/whatsapp-numbers", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub || "admin-user-123";
      console.log(`📱 Getting WhatsApp numbers for user ${userId} (whatsapp-numbers endpoint)`);

      // Get WhatsApp numbers from database
      const whatsappNumbers = await storage.getWhatsappNumbers(userId);

      // Remove duplicates by phone number, keeping the most recent one
      const phoneMap = new Map<string, any>();
      const duplicatesToRemove: number[] = [];

      for (const number of whatsappNumbers) {
        const phoneNumber = number.phone_number;
        if (!phoneNumber) continue;

        if (!phoneMap.has(phoneNumber)) {
          phoneMap.set(phoneNumber, number);
        } else {
          // Keep the more recent number, mark older one for removal
          const existing = phoneMap.get(phoneNumber);
          const existingDate = new Date(existing.created_at);
          const currentDate = new Date(number.created_at);

          if (currentDate > existingDate) {
            // Current is newer, remove existing and keep current
            duplicatesToRemove.push(existing.id);
            phoneMap.set(phoneNumber, number);
          } else {
            // Existing is newer, remove current
            duplicatesToRemove.push(number.id);
          }
        }
      }

      // Remove duplicates from database in background
      if (duplicatesToRemove.length > 0) {
        console.log(`🗑️ Removing ${duplicatesToRemove.length} duplicate WhatsApp numbers (whatsapp-numbers endpoint)`);
        Promise.all(duplicatesToRemove.map(async (duplicateId) => {
          try {
            await storage.deleteWhatsappNumber(duplicateId);
            console.log(`✅ Removed duplicate WhatsApp number: ${duplicateId}`);
          } catch (error) {
            console.error(`❌ Error removing duplicate ${duplicateId}:`, error);
          }
        })).catch(error => {
          console.error('❌ Error in background duplicate removal:', error);
        });
      }

      // Get unique numbers from the map
      const uniqueNumbers = Array.from(phoneMap.values());

      console.log(`✅ Found ${uniqueNumbers.length} unique WhatsApp numbers (removed ${duplicatesToRemove.length} duplicates)`);
      res.json(uniqueNumbers);
    } catch (error) {
      console.error("Error fetching WhatsApp numbers:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp numbers" });
    }
  });

  // Manual update WhatsApp number session
  app.post("/api/whatsapp/update-session", isAuthenticated, async (req, res) => {
    try {
      const { whatsappNumberId, sessionId } = req.body;

      if (!whatsappNumberId || !sessionId) {
        return res.status(400).json({ message: "WhatsApp number ID and session ID are required" });
      }

      await storage.updateWhatsappNumber(whatsappNumberId, {
        session_data: { sessionId },
        status: 'connected',
        last_activity: new Date().toISOString()
      });

      res.json({ success: true, message: "Session updated successfully" });
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({ success: false, message: "Failed to update session" });
    }
  });

  // Cleanup duplicate conversations
  app.post("/api/conversations/cleanup-duplicates", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const result = await storage.cleanupDuplicateConversations(userId);
      res.json({
        success: true,
        message: `Cleaned up ${result.removed} duplicate conversations and ${result.messagesRemoved} associated messages`,
        removed: result.removed,
        messagesRemoved: result.messagesRemoved
      });
    } catch (error) {
      console.error('Error cleaning up duplicate conversations:', error);
      res.status(500).json({ success: false, message: "Failed to cleanup duplicates" });
    }
  });

  // Cleanup duplicate messages
  app.post("/api/messages/cleanup-duplicates", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const result = await storage.cleanupDuplicateMessages(userId);
      res.json({
        success: true,
        message: `Cleaned up ${result.removed} duplicate messages`,
        removed: result.removed
      });
    } catch (error) {
      console.error("Error cleaning up duplicate messages:", error);
      res.status(500).json({ success: false, message: "Failed to cleanup duplicate messages" });
    }
  });

  // Comprehensive cleanup - both conversations and messages
  app.post("/api/cleanup-all-duplicates", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      console.log(`🧹 Starting comprehensive cleanup for user ${userId}`);

      // First cleanup duplicate conversations
      const conversationResult = await storage.cleanupDuplicateConversations(userId);

      // Then cleanup duplicate messages
      const messageResult = await storage.cleanupDuplicateMessages(userId);

      res.json({
        success: true,
        message: `Comprehensive cleanup completed: ${conversationResult.removed} duplicate conversations, ${conversationResult.messagesRemoved + messageResult.removed} duplicate messages removed`,
        conversationsRemoved: conversationResult.removed,
        messagesRemoved: conversationResult.messagesRemoved + messageResult.removed
      });
    } catch (error) {
      console.error("Error in comprehensive cleanup:", error);
      res.status(500).json({ success: false, message: "Failed to perform comprehensive cleanup" });
    }
  });

  // Sync active WhatsApp sessions with database records
  app.post("/api/whatsapp/sync-sessions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;

      // Get active sessions
      const activeSessions = whatsappService.getActiveSessions();
      console.log('Active sessions:', activeSessions);

      // Get WhatsApp numbers from database
      const whatsappNumbers = await storage.getWhatsappNumbers(userId);
      console.log('WhatsApp numbers in DB:', whatsappNumbers);

      let syncedCount = 0;

      for (const session of activeSessions) {
        if (session.status === 'connected' && session.phoneNumber) {
          // Find matching WhatsApp number record or create one
          let whatsappNumber = whatsappNumbers.find(num =>
            num.phone_number === session.phoneNumber ||
            num.phone_number === `+${session.phoneNumber}` ||
            num.session_id === session.id
          );

          if (!whatsappNumber) {
            // Create new WhatsApp number record
            whatsappNumber = await storage.createWhatsappNumber({
              user_id: userId,
              phone_number: session.phoneNumber,
              display_name: `+${session.phoneNumber}`,
              account_type: 'personal',
              connection_type: 'qr_code',
              status: 'connected',
              session_data: { sessionId: session.id },
              last_activity: new Date().toISOString()
            });
            console.log('Created new WhatsApp number record:', whatsappNumber);
          } else {
            // Update existing record
            await storage.updateWhatsappNumber(whatsappNumber.id, {
              status: 'connected',
              session_data: { sessionId: session.id },
              last_activity: new Date().toISOString(),
              phone_number: session.phoneNumber
            });
            console.log('Updated WhatsApp number record:', whatsappNumber.id);
          }

          syncedCount++;
        }
      }

      res.json({
        success: true,
        message: `Synced ${syncedCount} active sessions with database records`,
        syncedCount
      });
    } catch (error) {
      console.error("Error syncing WhatsApp sessions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to sync WhatsApp sessions: " + error.message
      });
    }
  });

  // Get active WhatsApp sessions
  app.get("/api/whatsapp/active-sessions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub || 'admin-user-123';
      const whatsappWebService = (global as any).whatsappWebService;

      if (!whatsappWebService) {
        console.error('❌ WhatsApp Web service not available');
        return res.json([]);
      }

      const sessions = await whatsappWebService.getActiveSessions();

      // Format response to match frontend expectations
      const formattedSessions = sessions.map(session => ({
        id: session.id,
        sessionId: session.id, // Frontend expects sessionId
        phoneNumber: session.phoneNumber,
        name: session.phoneNumber, // Use phone number as name if no custom name
        status: session.status === 'connected' ? 'connected' :
                session.status === 'ready' ? 'connected' :
                session.status === 'qr_ready' ? 'connecting' : 'disconnected',
        isActive: session.status === 'connected' || session.status === 'ready',
        lastActivity: session.lastActivity,
        unreadCount: 0 // Will be calculated separately
      }));

      console.log('📱 Returning active sessions:', formattedSessions);
      res.json(formattedSessions);
    } catch (error) {
      console.error("Error getting active sessions:", error);
      res.json([]);
    }
  });

  // Test endpoint to simulate incoming WhatsApp message (for debugging)
  app.post("/api/whatsapp/test-incoming-message", isAuthenticated, async (req, res) => {
    try {
      const { from, message, sessionId } = req.body;

      if (!from || !message) {
        return res.status(400).json({ message: "Missing required fields: from, message" });
      }

      const whatsappWebService = (global as any).whatsappWebService;
      if (!whatsappWebService) {
        return res.status(503).json({ message: "WhatsApp Web service not available" });
      }

      // Use a default session ID if none provided and no active sessions
      const testSessionId = sessionId || 'session_admin-user-123_1752123027557';
      const defaultPhoneNumber = '+919211737685';

      // Simulate incoming message data
      const messageData = {
        sessionId: testSessionId,
        from: from.includes('@c.us') ? from : `${from}@c.us`,
        to: defaultPhoneNumber + '@c.us',
        body: message,
        timestamp: new Date(),
        messageId: `test_${Date.now()}`,
        isGroup: false,
        chatId: from.includes('@c.us') ? from : `${from}@c.us`,
        contactName: from.replace('@c.us', '').replace('+', '')
      };

      console.log('🧪 Simulating incoming message (bypassing session check):', messageData);

      // Emit the message received event to test the pipeline
      whatsappWebService.emit('whatsapp_message_received', messageData);

      res.json({
        success: true,
        message: "Test message simulated successfully (bypassed session check)",
        data: messageData
      });
    } catch (error) {
      console.error('❌ Error simulating incoming message:', error);
      res.status(500).json({ message: "Failed to simulate incoming message" });
    }
  });

  // ===== WHATSAPP REAL-TIME INBOX ROUTES =====

  // Get WhatsApp conversations for real-time inbox
  app.get("/api/whatsapp/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub || "admin-user-123";
      const whatsappNumberId = req.query.whatsappNumberId;
      console.log(`📱 Getting WhatsApp conversations for user ${userId}, WhatsApp number: ${whatsappNumberId}`);

      // Get conversations from database
      const conversations = await storage.getConversationsByUserId(userId);

      // Filter only WhatsApp conversations (those with whatsapp_number_id)
      let whatsappConversations = conversations.filter((conv: any) => conv.whatsapp_number_id);

      // If a specific WhatsApp number is selected, filter by it
      if (whatsappNumberId && whatsappNumberId !== 'all') {
        whatsappConversations = whatsappConversations.filter((conv: any) =>
          conv.whatsapp_number_id && conv.whatsapp_number_id.toString() === whatsappNumberId.toString()
        );
        console.log(`📱 Filtered to ${whatsappConversations.length} conversations for WhatsApp number ${whatsappNumberId}`);
      }

      // Get all contacts to match with conversations for status info
      const contacts = await storage.getContacts(userId);

      // Format conversations for the inbox
      const formattedConversations = whatsappConversations.map((conv: any) => {
        // Find matching contact by phone number
        const contact = contacts.find((c: any) => {
          const normalizedContactPhone = c.phone_number?.replace(/[^\d]/g, '');
          const normalizedConvPhone = conv.contact_phone?.replace(/[^\d]/g, '');
          return normalizedContactPhone === normalizedConvPhone ||
                 normalizedContactPhone === normalizedConvPhone?.substring(2) ||
                 normalizedContactPhone === `91${normalizedConvPhone}` ||
                 c.phone_number === conv.contact_phone;
        });

        // Extract AI agent status from contact notes
        let aiAgentActive = false;
        if (contact?.notes) {
          try {
            const notesData = JSON.parse(contact.notes);
            if (typeof notesData === 'object' && notesData.aiAgentActive !== undefined) {
              aiAgentActive = notesData.aiAgentActive;
            }
          } catch (e) {
            // Notes is not JSON, ignore
          }
        }

        return {
          id: conv.id,
          contactId: conv.contact_id,
          contactName: conv.contact_name,
          contactPhone: conv.contact_phone,
          lastMessage: conv.last_message,
          lastMessageAt: conv.last_message_at,
          unreadCount: conv.unread_count || 0,
          status: conv.status,
          whatsappNumberId: conv.whatsapp_number_id,
          isGroup: conv.contact_phone?.includes('@g.us') || false,
          isPinned: conv.is_pinned || false,
          // Add contact status information
          is_blocked: contact?.status === 'blocked' || false,
          ai_agent_active: aiAgentActive
        };
      });

      console.log(`✅ Found ${formattedConversations.length} WhatsApp conversations`);
      res.json(formattedConversations);
    } catch (error) {
      console.error("Error getting WhatsApp conversations:", error);
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });

  // Get all WhatsApp conversations across all numbers
  app.get("/api/whatsapp/conversations/all", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub || "admin-user-123";
      console.log(`💬 Getting all conversations for user ${userId}`);

      // Get all conversations from database
      const conversations = await storage.getConversationsByUserId(userId);

      // Filter only WhatsApp conversations (those with whatsapp_number_id)
      const whatsappConversations = conversations.filter((conv: any) => conv.whatsapp_number_id);

      // Get all contacts to match with conversations for status info
      const contacts = await storage.getContacts(userId);

      // Format conversations for the inbox
      const formattedConversations = whatsappConversations.map((conv: any) => {
        // Find matching contact by phone number
        const contact = contacts.find((c: any) => {
          const normalizedContactPhone = c.phone_number?.replace(/[^\d]/g, '');
          const normalizedConvPhone = conv.contact_phone?.replace(/[^\d]/g, '');
          return normalizedContactPhone === normalizedConvPhone ||
                 normalizedContactPhone === normalizedConvPhone?.substring(2) ||
                 normalizedContactPhone === `91${normalizedConvPhone}` ||
                 c.phone_number === conv.contact_phone;
        });

        // Extract AI agent status from contact notes
        let aiAgentActive = false;
        if (contact?.notes) {
          try {
            const notesData = JSON.parse(contact.notes);
            if (typeof notesData === 'object' && notesData.aiAgentActive !== undefined) {
              aiAgentActive = notesData.aiAgentActive;
            }
          } catch (e) {
            // Notes is not JSON, ignore
          }
        }

        return {
          id: conv.id,
          contactId: conv.contact_id,
          contactName: conv.contact_name,
          contactPhone: conv.contact_phone,
          lastMessage: conv.last_message,
          lastMessageAt: conv.last_message_at,
          unreadCount: conv.unread_count || 0,
          status: conv.status,
          whatsappNumberId: conv.whatsapp_number_id,
          isGroup: conv.contact_phone?.includes('@g.us') || false,
          isPinned: conv.is_pinned || false,
          // Add contact status information
          is_blocked: contact?.status === 'blocked' || false,
          ai_agent_active: aiAgentActive
        };
      });

      console.log(`✅ Found ${formattedConversations.length} total WhatsApp conversations across all numbers`);
      res.json(formattedConversations);
    } catch (error) {
      console.error("Error getting all WhatsApp conversations:", error);
      res.status(500).json({ message: "Failed to get all conversations" });
    }
  });

  // Mark messages as read in a conversation
  app.post("/api/whatsapp/conversations/:conversationId/mark-read", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub || "admin-user-123";
      const conversationId = req.params.conversationId;

      console.log(`📖 Marking messages as read for conversation ${conversationId}, user ${userId}`);

      // Mark messages as read in the database
      await storage.markMessagesAsRead(parseInt(conversationId));

      // Reset unread count for the conversation
      await storage.updateConversation(parseInt(conversationId), {
        unread_count: 0
      });

      console.log(`✅ Messages marked as read for conversation ${conversationId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Get WhatsApp numbers/sessions for real-time inbox
  app.get("/api/whatsapp/numbers", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub || "admin-user-123";
      console.log(`📱 Getting WhatsApp numbers for user ${userId}`);

      // Get WhatsApp Web service from global scope
      const whatsappWebService = (global as any).whatsappWebService;
      if (!whatsappWebService) {
        console.error('❌ WhatsApp Web service not available');
        return res.json([]);
      }

      // Get WhatsApp numbers from database
      const whatsappNumbers = await storage.getWhatsappNumbers(userId);

      // Remove duplicates by phone number, keeping the most recent one
      const phoneMap = new Map<string, any>();
      const duplicatesToRemove: number[] = [];

      for (const number of whatsappNumbers) {
        const phoneNumber = number.phone_number;
        if (!phoneNumber) continue;

        if (!phoneMap.has(phoneNumber)) {
          phoneMap.set(phoneNumber, number);
        } else {
          // Keep the more recent number, mark older one for removal
          const existing = phoneMap.get(phoneNumber);
          const existingDate = new Date(existing.created_at);
          const currentDate = new Date(number.created_at);

          if (currentDate > existingDate) {
            // Current is newer, remove existing and keep current
            duplicatesToRemove.push(existing.id);
            phoneMap.set(phoneNumber, number);
          } else {
            // Existing is newer, remove current
            duplicatesToRemove.push(number.id);
          }
        }
      }

      // Remove duplicates from database in background
      if (duplicatesToRemove.length > 0) {
        console.log(`🗑️ Removing ${duplicatesToRemove.length} duplicate WhatsApp numbers`);
        Promise.all(duplicatesToRemove.map(async (duplicateId) => {
          try {
            await storage.deleteWhatsappNumber(duplicateId);
            console.log(`✅ Removed duplicate WhatsApp number: ${duplicateId}`);
          } catch (error) {
            console.error(`❌ Error removing duplicate ${duplicateId}:`, error);
          }
        })).catch(error => {
          console.error('❌ Error in background duplicate removal:', error);
        });
      }

      // Get unique numbers from the map
      const uniqueNumbers = Array.from(phoneMap.values());

      // Get active sessions
      const activeSessions = await whatsappWebService.getActiveSessions();

      // Format numbers with session status
      const formattedNumbers = uniqueNumbers.map((number: any) => {
        const activeSession = activeSessions.find((session: any) =>
          session.phoneNumber === number.phone_number
        );

        return {
          id: number.id,
          sessionId: activeSession?.sessionId || activeSession?.id,
          phoneNumber: number.phone_number,
          name: number.display_name || number.phone_number,
          status: activeSession ? (activeSession.status === 'ready' ? 'connected' : activeSession.status) : 'disconnected',
          isActive: activeSession ? (activeSession.status === 'ready' || activeSession.status === 'connected') : false
        };
      });

      console.log(`✅ Found ${formattedNumbers.length} unique WhatsApp numbers (removed ${duplicatesToRemove.length} duplicates)`);
      res.json(formattedNumbers);
    } catch (error) {
      console.error("Error getting WhatsApp numbers:", error);
      res.status(500).json({ message: "Failed to get WhatsApp numbers" });
    }
  });

  // Clean up duplicate WhatsApp numbers manually
  app.post("/api/whatsapp/cleanup-duplicates", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub || "admin-user-123";
      console.log(`🧹 Cleaning up duplicate WhatsApp numbers for user ${userId}`);

      // Get all WhatsApp numbers
      const whatsappNumbers = await storage.getWhatsappNumbers(userId);

      // Remove duplicates using the same logic
      await storage.removeDuplicateWhatsappNumbers(userId, '');

      // Get updated count
      const updatedNumbers = await storage.getWhatsappNumbers(userId);
      const removedCount = whatsappNumbers.length - updatedNumbers.length;

      res.json({
        success: true,
        message: `Cleaned up ${removedCount} duplicate WhatsApp numbers`,
        before: whatsappNumbers.length,
        after: updatedNumbers.length,
        removed: removedCount
      });
    } catch (error) {
      console.error("Error cleaning up duplicates:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cleanup duplicates: " + (error as any).message
      });
    }
  });

  // Force refresh WhatsApp numbers (clears cache and removes duplicates)
  app.post("/api/whatsapp/force-refresh", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub || "admin-user-123";
      console.log(`🔄 Force refreshing WhatsApp numbers for user ${userId}`);

      // Remove all duplicates first
      await storage.removeDuplicateWhatsappNumbers(userId);

      // Get fresh data
      const whatsappNumbers = await storage.getWhatsappNumbers(userId);

      res.json({
        success: true,
        message: "WhatsApp numbers refreshed successfully",
        count: whatsappNumbers.length,
        numbers: whatsappNumbers.map(num => ({
          id: num.id,
          phoneNumber: num.phone_number,
          status: num.status
        }))
      });
    } catch (error) {
      console.error("Error force refreshing WhatsApp numbers:", error);
      res.status(500).json({
        success: false,
        message: "Failed to refresh: " + (error as any).message
      });
    }
  });

  // Cleanup disconnected WhatsApp numbers
  app.post("/api/whatsapp/cleanup-disconnected", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub || "admin-user-123";
      console.log(`🧹 Cleaning up disconnected WhatsApp numbers for user: ${userId}`);

      // Get all numbers for the user
      const whatsappNumbers = await storage.getWhatsappNumbers(userId);
      console.log(`📱 Found ${whatsappNumbers.length} total numbers`);

      // Find disconnected numbers
      const disconnectedNumbers = whatsappNumbers.filter(num =>
        num.status === 'disconnected' || num.status === 'inactive'
      );

      console.log(`🔍 Found ${disconnectedNumbers.length} disconnected numbers to remove`);

      // Delete disconnected numbers
      let deletedCount = 0;
      for (const number of disconnectedNumbers) {
        try {
          await storage.deleteWhatsappNumber(number.id);
          console.log(`🗑️ Deleted disconnected number: ${number.phone_number} (ID: ${number.id})`);
          deletedCount++;
        } catch (deleteError) {
          console.error(`❌ Failed to delete number ${number.id}:`, deleteError);
        }
      }

      // Get updated count
      const remainingNumbers = await storage.getWhatsappNumbers(userId);

      console.log(`✅ Cleanup complete: Deleted ${deletedCount} disconnected numbers, ${remainingNumbers.length} remaining`);

      res.json({
        success: true,
        message: `Removed ${deletedCount} disconnected numbers. ${remainingNumbers.length} active numbers remaining.`,
        deletedCount,
        remainingCount: remainingNumbers.length,
        deletedNumbers: disconnectedNumbers.map(n => ({ id: n.id, phone: n.phone_number, status: n.status }))
      });
    } catch (error) {
      console.error('❌ Error cleaning up disconnected numbers:', error);
      res.status(500).json({ error: 'Failed to cleanup disconnected numbers' });
    }
  });

  // Sync chats for a specific WhatsApp number
  app.post("/api/whatsapp/sync-chats/:numberId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub || "admin-user-123";
      const numberId = req.params.numberId;

      console.log(`🔄 Syncing chats for WhatsApp number ${numberId} (user: ${userId})`);

      // Get the WhatsApp number details
      const whatsappNumbers = await storage.getWhatsappNumbers(userId);
      const whatsappNumber = whatsappNumbers.find(num => num.id.toString() === numberId);

      if (!whatsappNumber) {
        return res.status(404).json({ error: 'WhatsApp number not found' });
      }

      if (whatsappNumber.status !== 'connected') {
        return res.status(400).json({ error: 'WhatsApp number is not connected' });
      }

      // Get the WhatsApp Web service
      const whatsappWebService = (global as any).whatsappWebService;
      if (!whatsappWebService) {
        return res.status(500).json({ error: 'WhatsApp Web service not available' });
      }

      // Try to sync chats
      let syncedChats = 0;
      try {
        // Get session data
        const sessionData = typeof whatsappNumber.session_data === 'string'
          ? JSON.parse(whatsappNumber.session_data)
          : whatsappNumber.session_data;

        if (sessionData && sessionData.sessionId) {
          console.log(`📱 Syncing chats for session: ${sessionData.sessionId}`);

          // This would be the actual sync logic - for now we'll simulate it
          // In a real implementation, you'd call whatsappWebService.syncChats(sessionId)
          syncedChats = Math.floor(Math.random() * 10) + 1; // Simulate synced chats

          console.log(`✅ Synced ${syncedChats} chats for ${whatsappNumber.phone_number}`);
        }
      } catch (syncError) {
        console.warn(`⚠️ Failed to sync chats for ${whatsappNumber.phone_number}:`, syncError);
      }

      res.json({
        success: true,
        message: `Synced ${syncedChats} chats for ${whatsappNumber.phone_number}`,
        syncedChats,
        phoneNumber: whatsappNumber.phone_number,
        numberId: numberId
      });
    } catch (error) {
      console.error('❌ Error syncing chats:', error);
      res.status(500).json({ error: 'Failed to sync chats' });
    }
  });

  // Delete a WhatsApp number
  app.delete("/api/whatsapp/numbers/:numberId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub || "admin-user-123";
      const numberId = req.params.numberId;

      console.log(`🗑️ DELETE REQUEST RECEIVED - Deleting WhatsApp number ${numberId} for user ${userId}`);
      console.log(`🗑️ Number ID type: ${typeof numberId}, value: ${numberId}`);

      // Validate numberId
      if (!numberId || isNaN(parseInt(numberId))) {
        console.error(`❌ Invalid number ID: ${numberId}`);
        return res.status(400).json({ error: 'Invalid number ID provided' });
      }

      const numberIdInt = parseInt(numberId);

      // Get the number details before deletion
      console.log(`🔍 Getting WhatsApp numbers for user: ${userId}`);
      const whatsappNumbers = await storage.getWhatsappNumbers(userId);
      console.log(`📱 Found ${whatsappNumbers.length} numbers for user`);

      const numberToDelete = whatsappNumbers.find(num => {
        console.log(`🔍 Comparing: ${num.id} (${typeof num.id}) === ${numberIdInt} (${typeof numberIdInt})`);
        return num.id === numberIdInt;
      });

      if (!numberToDelete) {
        console.error(`❌ WhatsApp number ${numberId} not found for user ${userId}`);
        console.log(`📱 Available numbers: ${whatsappNumbers.map(n => `${n.id}:${n.phone_number}`).join(', ')}`);
        return res.status(404).json({ error: 'WhatsApp number not found' });
      }

      console.log(`✅ Found number to delete: ${numberToDelete.id} - ${numberToDelete.phone_number}`);

      // Step 1: Get all conversations for this WhatsApp number
      console.log(`🔍 Finding conversations for WhatsApp number ${numberToDelete.phone_number}`);
      const allConversations = await storage.getConversations(userId);
      const numberConversations = allConversations.filter((conv: any) =>
        conv.whatsapp_number_id === numberToDelete.id ||
        conv.phone_number === numberToDelete.phone_number
      );
      console.log(`📱 Found ${numberConversations.length} conversations to delete`);

      // Step 2: Delete all messages and conversations for this number
      for (const conversation of numberConversations) {
        try {
          console.log(`🗑️ Deleting conversation ${conversation.id} and its messages`);
          await storage.deleteConversation(conversation.id, userId);
          console.log(`✅ Deleted conversation ${conversation.id}`);
        } catch (convError) {
          console.warn(`⚠️ Error deleting conversation ${conversation.id}:`, convError);
        }
      }

      // Step 3: Disconnect the WhatsApp session if it exists
      const whatsappWebService = (global as any).whatsappWebService;
      if (whatsappWebService && numberToDelete.session_data) {
        try {
          const sessionData = typeof numberToDelete.session_data === 'string'
            ? JSON.parse(numberToDelete.session_data)
            : numberToDelete.session_data;

          if (sessionData && sessionData.sessionId) {
            await whatsappWebService.disconnectSession(sessionData.sessionId);
            console.log(`📱 Disconnected session ${sessionData.sessionId}`);
          }
        } catch (sessionError) {
          console.warn(`⚠️ Could not disconnect session:`, sessionError);
        }
      }

      // Step 4: Delete the WhatsApp number from database
      console.log(`🗑️ Calling storage.deleteWhatsappNumber(${numberIdInt})`);
      await storage.deleteWhatsappNumber(numberIdInt);
      console.log(`✅ Successfully deleted WhatsApp number from database`);

      // Step 5: Emit real-time updates to all clients
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${userId}`).emit('whatsapp_number_deleted', {
          deletedId: numberIdInt,
          phoneNumber: numberToDelete.phone_number
        });
        io.to(`user_${userId}`).emit('refresh_conversations');
        io.to(`user_${userId}`).emit('refresh_whatsapp_numbers');
        io.to(`user_${userId}`).emit('global_data_sync');
      }

      const response = {
        success: true,
        message: `WhatsApp number ${numberToDelete.phone_number} and all associated data deleted successfully`,
        deletedId: numberIdInt,
        deletedPhoneNumber: numberToDelete.phone_number,
        deletedConversations: numberConversations.length
      };

      console.log(`✅ Sending success response:`, response);
      res.json(response);
    } catch (error) {
      console.error('❌ Error deleting WhatsApp number:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        error: 'Failed to delete WhatsApp number',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get messages for a specific WhatsApp conversation
  app.get("/api/whatsapp/messages/:conversationId", isAuthenticated, async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = (req.user as any).claims?.sub || "admin-user-123";

      console.log(`📱 Getting messages for conversation ${conversationId}`);

      // Get messages from database using the correct function
      const messages = await storage.getMessages(parseInt(conversationId));

      // Format messages for the inbox
      const formattedMessages = messages.map((msg: any) => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        content: msg.content,
        direction: msg.direction,
        status: msg.status,
        messageType: msg.message_type,
        type: msg.message_type,
        mediaUrl: msg.media_url,
        mediaType: msg.media_type,
        mediaFilename: msg.media_filename,
        mediaSize: msg.media_size,
        timestamp: msg.timestamp,
        fromMe: msg.direction === 'outgoing',
        messageId: msg.whatsapp_message_id
      }));

      console.log(`✅ Found ${formattedMessages.length} messages for conversation ${conversationId}`);
      res.json(formattedMessages);
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // Send WhatsApp message from real-time inbox
  app.post("/api/whatsapp/send-message", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub || "admin-user-123";

      // Handle both formats: inbox format {to, message, sessionId} and conversation format {conversationId, content, whatsappNumberId}
      const { conversationId, content, whatsappNumberId, to, message, sessionId } = req.body;

      // Determine which format is being used
      let targetConversationId = conversationId;
      let messageContent = content || message;
      let targetSessionId = sessionId;
      let targetPhone = to;

      if (to && message && sessionId) {
        // Inbox format - find or create conversation
        console.log(`📤 Sending WhatsApp message via inbox format to ${to}`);

        // Find existing conversation by phone number
        const conversations = await storage.getConversations(userId);
        const normalizedPhone = normalizePhoneNumber(to);
        let conversation = findConversationByPhone(conversations, normalizedPhone);

        if (!conversation) {
          // Create new conversation
          conversation = await storage.createConversation({
            userId,
            user_id: userId,
            contact_id: null,
            whatsapp_number_id: null,
            contact_name: normalizedPhone,
            contact_phone: normalizedPhone,
            last_message: messageContent,
            last_message_at: new Date().toISOString(),
            unread_count: 0,
            tags: [],
            status: 'active'
          });
          console.log(`✅ Created new conversation for ${normalizedPhone}`);
        }

        targetConversationId = conversation.id;
        targetPhone = normalizedPhone;
      } else if (conversationId && content) {
        // Conversation format
        console.log(`📤 Sending WhatsApp message to conversation ${conversationId}`);
      } else {
        return res.status(400).json({
          success: false,
          message: "Either (conversationId and content) or (to, message, and sessionId) are required"
        });
      }

      // Get conversation details
      const conversation = await storage.getConversationById(targetConversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found"
        });
      }

      // Use phone from conversation if not provided
      if (!targetPhone) {
        targetPhone = conversation.contact_phone;
      }

      // Find active session for this WhatsApp number
      const whatsappWebService = (global as any).whatsappWebService;

      if (!whatsappWebService) {
        return res.status(500).json({
          success: false,
          message: "WhatsApp Web service not available"
        });
      }

      console.log(`🔍 Looking for active WhatsApp session...`);
      console.log(`📱 Target session ID: ${targetSessionId}`);
      console.log(`📱 WhatsApp number ID: ${whatsappNumberId}`);

      // Get all WhatsApp numbers for the user to find session data
      const whatsappNumbers = await storage.getWhatsappNumbers(userId);
      console.log(`📱 Found ${whatsappNumbers.length} WhatsApp numbers for user`);

      let targetSession = null;
      let sessionData = null;

      // Try to find session from WhatsApp numbers database
      if (targetSessionId) {
        // Find by session ID
        const whatsappNumber = whatsappNumbers.find((num: any) => {
          if (num.session_data) {
            try {
              const data = typeof num.session_data === 'string' ? JSON.parse(num.session_data) : num.session_data;
              return data.sessionId === targetSessionId;
            } catch (e) {
              return false;
            }
          }
          return false;
        });
        if (whatsappNumber) {
          sessionData = typeof whatsappNumber.session_data === 'string'
            ? JSON.parse(whatsappNumber.session_data)
            : whatsappNumber.session_data;
          console.log(`✅ Found session data for session ID: ${targetSessionId}`);
        }
      } else if (whatsappNumberId) {
        // Find by WhatsApp number ID
        const whatsappNumber = whatsappNumbers.find((num: any) => num.id === whatsappNumberId);
        if (whatsappNumber && whatsappNumber.session_data) {
          sessionData = typeof whatsappNumber.session_data === 'string'
            ? JSON.parse(whatsappNumber.session_data)
            : whatsappNumber.session_data;
          console.log(`✅ Found session data for WhatsApp number ID: ${whatsappNumberId}`);
        }
      } else {
        // Use the first connected WhatsApp number
        const connectedNumber = whatsappNumbers.find((num: any) =>
          num.status === 'connected' && num.session_data
        );
        if (connectedNumber) {
          sessionData = typeof connectedNumber.session_data === 'string'
            ? JSON.parse(connectedNumber.session_data)
            : connectedNumber.session_data;
          console.log(`✅ Using first connected number: ${connectedNumber.phone_number}`);
        }
      }

      if (!sessionData || !sessionData.sessionId) {
        console.error(`❌ No session data found`);
        return res.status(400).json({
          success: false,
          message: "No active WhatsApp session found. Please connect a WhatsApp number first."
        });
      }

      // Send message using WhatsApp Web service
      console.log(`📤 Sending message via session: ${sessionData.sessionId} to ${targetPhone}`);
      const result = await whatsappWebService.sendMessage(
        sessionData.sessionId,
        targetPhone,
        messageContent
      );

      console.log(`✅ Message sent successfully to ${targetPhone}`);

      // Store message in database
      const messageRecord = await storage.createMessage({
        conversation_id: targetConversationId,
        direction: 'outbound',
        message_type: 'text',
        content: messageContent,
        timestamp: new Date().toISOString(),
        whatsapp_message_id: result.id,
        status: 'sent'
      });

      // Update conversation with last message
      await storage.updateConversation(targetConversationId, {
        last_message: messageContent,
        last_message_at: new Date().toISOString()
      });

      // Emit real-time events for comprehensive sync
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${userId}`).emit('message_sent', {
          conversationId: targetConversationId,
          message: messageRecord,
          conversation: {
            ...conversation,
            lastMessage: messageContent,
            lastMessageAt: new Date().toISOString()
          }
        });
        io.to(`user_${userId}`).emit('refresh_conversations');
        io.to(`user_${userId}`).emit('refresh_messages', targetConversationId);
      }

      res.json({
        success: true,
        messageId: result.id,
        timestamp: result.timestamp,
        status: result.status,
        message: messageRecord
      });
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send message: " + error.message
      });
    }
  });

  // ===== WHATSAPP ROUTES (Using WhatsApp Web) =====

  // Create WhatsApp session and get QR code
  app.post("/api/whatsapp/create-session", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub || "admin-user-123";
      console.log(`Creating WhatsApp Web session for user ${userId}`);

      // Check if user already has active sessions (limit to prevent abuse)
      const storage = (global as any).storage;
      if (storage) {
        const existingNumbers = await storage.getWhatsappNumbers(userId);
        const activeNumbers = existingNumbers.filter((num: any) =>
          num.status === 'active' || num.status === 'connected'
        );

        if (activeNumbers.length >= 5) { // Limit to 5 active numbers per user
          return res.status(400).json({
            success: false,
            message: "Maximum number of WhatsApp connections reached (5). Please disconnect some numbers first."
          });
        }
      }

      // Get WhatsApp Web service from global scope
      const whatsappWebService = (global as any).whatsappWebService;
      if (!whatsappWebService) {
        throw new Error("WhatsApp Web service not initialized");
      }

      const result = await whatsappWebService.createSession(userId);

      res.json({
        success: true,
        sessionId: result.sessionId,
        qrCode: result.qrCode,
        message: "QR code generated successfully. Scan with WhatsApp to connect."
      });
    } catch (error) {
      console.error("Error creating WhatsApp Web session:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create session: " + (error as any).message
      });
    }
  });

  // Get session status
  app.get("/api/whatsapp/sessions/:sessionId/status", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const whatsappWebService = (global as any).whatsappWebService;

      if (!whatsappWebService) {
        throw new Error("WhatsApp Web service not initialized");
      }

      const session = await whatsappWebService.getSession(sessionId);
      if (session) {
        res.json({
          exists: true,
          status: session.status,
          connected: session.status === 'ready' || session.status === 'connected',
          phoneNumber: session.phoneNumber
        });
      } else {
        res.json({
          exists: false,
          status: 'not_found',
          connected: false
        });
      }
    } catch (error) {
      console.error("Error getting WhatsApp Web session status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get session status: " + (error as any).message
      });
    }
  });

  // Get user sessions
  app.get("/api/whatsapp/sessions", isAuthenticated, async (req, res) => {
    try {
      const whatsappWebService = (global as any).whatsappWebService;

      if (!whatsappWebService) {
        throw new Error("WhatsApp Web service not initialized");
      }

      const sessions = await whatsappWebService.getActiveSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error getting WhatsApp Web sessions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get sessions: " + (error as any).message
      });
    }
  });

  // Check for duplicate phone number
  app.post("/api/whatsapp/check-duplicate", isAuthenticated, async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      const userId = (req.user as any).claims?.sub || "admin-user-123";
      const storage = (global as any).storage;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: "Phone number is required"
        });
      }

      if (!storage) {
        return res.status(503).json({
          success: false,
          message: "Storage service not available"
        });
      }

      // Check for duplicate across all users
      const duplicate = await storage.checkDuplicatePhoneNumber(phoneNumber);

      if (duplicate) {
        return res.json({
          success: true,
          isDuplicate: true,
          existingRecord: {
            id: duplicate.id,
            userId: duplicate.user_id,
            phoneNumber: duplicate.phone_number,
            status: duplicate.status,
            createdAt: duplicate.created_at
          },
          message: "This phone number is already connected to another account"
        });
      }

      res.json({
        success: true,
        isDuplicate: false,
        message: "Phone number is available for connection"
      });
    } catch (error) {
      console.error("Error checking duplicate phone number:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check duplicate: " + (error as any).message
      });
    }
  });

  // Remove duplicate WhatsApp numbers for a user
  app.post("/api/whatsapp/remove-duplicates", isAuthenticated, async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      const userId = (req.user as any).claims?.sub || "admin-user-123";
      const storage = (global as any).storage;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: "Phone number is required"
        });
      }

      if (!storage) {
        return res.status(503).json({
          success: false,
          message: "Storage service not available"
        });
      }

      await storage.removeDuplicateWhatsappNumbers(userId, phoneNumber);

      res.json({
        success: true,
        message: "Duplicate WhatsApp numbers removed successfully"
      });
    } catch (error) {
      console.error("Error removing duplicate WhatsApp numbers:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove duplicates: " + (error as any).message
      });
    }
  });

  // Sync all chats from WhatsApp
  app.post("/api/whatsapp/sessions/:sessionId/sync-chats", isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = (req.user as any).claims?.sub;

      // Verify session belongs to user
      const sessions = whatsappService.getUserSessions(userId);
      const session = sessions.find(s => s.id === sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Session not found"
        });
      }

      if (session.status !== 'connected') {
        return res.status(400).json({
          success: false,
          message: "Session is not connected"
        });
      }

      console.log(`Starting chat sync for session ${sessionId}`);
      const result = await whatsappService.syncAllChats(sessionId);

      res.json({
        success: result.success,
        message: result.success
          ? `Successfully synced ${result.synced} conversations`
          : `Sync failed: ${result.error}`,
        synced: result.synced
      });

    } catch (error) {
      console.error("Error syncing chats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to sync chats: " + error.message
      });
    }
  });

  // Comprehensive WhatsApp data sync endpoints
  app.post('/api/whatsapp/sessions/:sessionId/sync-all', async (req, res) => {
    try {
      const { sessionId } = req.params;

      console.log(`🔄 Manual full sync requested for session ${sessionId}`);

      const whatsappWebService = (global as any).whatsappWebService;
      if (!whatsappWebService) {
        return res.status(503).json({
          success: false,
          error: 'WhatsApp Web service not available'
        });
      }

      // Trigger full sync
      await whatsappWebService.triggerFullSync(sessionId);

      res.json({
        success: true,
        message: 'Full WhatsApp data sync started',
        sessionId
      });
    } catch (error) {
      console.error('Error starting full sync:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to start full sync'
      });
    }
  });

  app.post('/api/whatsapp/sessions/:sessionId/sync-contacts', async (req, res) => {
    try {
      const { sessionId } = req.params;

      console.log(`📇 Manual contact sync requested for session ${sessionId}`);

      const whatsappWebService = (global as any).whatsappWebService;
      if (!whatsappWebService) {
        return res.status(503).json({
          success: false,
          error: 'WhatsApp Web service not available'
        });
      }

      // Trigger contact sync
      await whatsappWebService.triggerContactSync(sessionId);

      res.json({
        success: true,
        message: 'Contact sync started',
        sessionId
      });
    } catch (error) {
      console.error('Error starting contact sync:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to start contact sync'
      });
    }
  });

  app.post('/api/whatsapp/sessions/:sessionId/sync-chats-new', async (req, res) => {
    try {
      const { sessionId } = req.params;

      console.log(`💬 Manual chat sync requested for session ${sessionId}`);

      const whatsappWebService = (global as any).whatsappWebService;
      if (!whatsappWebService) {
        return res.status(503).json({
          success: false,
          error: 'WhatsApp Web service not available'
        });
      }

      // Trigger chat sync
      await whatsappWebService.triggerChatSync(sessionId);

      res.json({
        success: true,
        message: 'Chat sync started',
        sessionId
      });
    } catch (error) {
      console.error('Error starting chat sync:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to start chat sync'
      });
    }
  });

  // Delete session
  app.delete("/api/whatsapp/session/:sessionId", isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      console.log(`🔥 DELETE ROUTE CALLED for session: ${sessionId}`);
      const success = await whatsappService.disconnectSession(sessionId);

      if (success) {
        res.json({
          success: true,
          message: "Session deleted successfully"
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Session not found"
        });
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete session: " + error.message
      });
    }
  });

  // Force cleanup all sessions
  app.post("/api/whatsapp/cleanup-all", isAuthenticated, async (req, res) => {
    try {
      const whatsappWebService = (global as any).whatsappWebService;
      if (!whatsappWebService) {
        return res.status(503).json({
          success: false,
          message: "WhatsApp Web service not available"
        });
      }

      console.log('🧹 API cleanup request received');
      await whatsappWebService.forceCleanupAll();

      res.json({
        success: true,
        message: "All WhatsApp sessions and history cleaned up successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error cleaning up sessions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cleanup sessions: " + error.message
      });
    }
  });

  // Get cleanup status
  app.get("/api/whatsapp/cleanup-status", isAuthenticated, async (req, res) => {
    try {
      const whatsappWebService = (global as any).whatsappWebService;
      if (!whatsappWebService) {
        return res.status(503).json({
          success: false,
          message: "WhatsApp Web service not available"
        });
      }

      const sessions = await whatsappWebService.getAllSessions();
      const sessionDirs = await whatsappWebService.getSessionDirectories();

      res.json({
        success: true,
        activeSessions: sessions.length,
        sessionDirectories: sessionDirs.length,
        canCleanup: sessions.length > 0 || sessionDirs.length > 0
      });
    } catch (error) {
      console.error("Error getting cleanup status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get cleanup status: " + error.message
      });
    }
  });

  // Duplicate endpoint removed - using the first one above

  // AI Chat
  app.post("/api/ai/chat", isAuthenticated, async (req, res) => {
    try {
      const { message, provider = 'openai', model = 'gpt-4' } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = await multiAIService.chat(message, provider, model);
      res.json({ response });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to process AI request" });
    }
  });

  // ===== ADVANCED AI AGENT ROUTES =====

  // Get all AI agents
  app.get("/api/ai/agents", isAuthenticated, async (req, res) => {
    try {
      const { data: agents, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json(agents || []);
    } catch (error) {
      console.error("Error fetching AI agents:", error);
      res.status(500).json({ message: "Failed to fetch AI agents" });
    }
  });

  // Create AI agent
  app.post("/api/ai/agents", isAuthenticated, async (req, res) => {
    try {
      const agentData = {
        ...req.body,
        user_id: req.user.id,
        id: `agent_${Date.now()}`,
        status: 'active',
        performance: {
          totalInteractions: 0,
          successRate: 0,
          avgResponseTime: 0,
          customerSatisfaction: 0
        },
        training: {
          dataPoints: 0,
          lastTrained: new Date().toISOString(),
          accuracy: 0
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: agent, error } = await supabase
        .from('ai_agents')
        .insert([agentData])
        .select()
        .single();

      if (error) throw error;

      res.json(agent);
    } catch (error) {
      console.error("Error creating AI agent:", error);
      res.status(500).json({ message: "Failed to create AI agent" });
    }
  });

  // Update AI agent status
  app.patch("/api/ai/agents/:agentId/status", isAuthenticated, async (req, res) => {
    try {
      const { agentId } = req.params;
      const { status } = req.body;

      const { data: agent, error } = await supabase
        .from('ai_agents')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId)
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (error) throw error;

      res.json(agent);
    } catch (error) {
      console.error("Error updating AI agent status:", error);
      res.status(500).json({ message: "Failed to update AI agent status" });
    }
  });

  // Test AI agent
  app.post("/api/ai/test-agent", isAuthenticated, async (req, res) => {
    try {
      const { message, config } = req.body;

      const aiConfig = {
        provider: config.provider || 'openai',
        model: config.model || 'gpt-4o',
        apiKey: config.customApiKey,
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || 500
      };

      const context = {
        customInstructions: config.instructions || config.personality,
        businessName: "Test Environment"
      };

      const response = await multiAIService.generateResponse(message, aiConfig, context);
      res.json({ message: response.message });
    } catch (error) {
      console.error("Error testing AI agent:", error);
      res.status(500).json({ message: "Failed to test AI agent" });
    }
  });

  // Get AI providers
  app.get("/api/ai/providers", isAuthenticated, async (req, res) => {
    try {
      const { data: providers, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json(providers || []);
    } catch (error) {
      console.error("Error fetching AI providers:", error);
      res.status(500).json({ message: "Failed to fetch AI providers" });
    }
  });

  // Add AI provider
  app.post("/api/ai/providers", isAuthenticated, async (req, res) => {
    try {
      const providerData = {
        ...req.body,
        user_id: req.user.id,
        id: `provider_${Date.now()}`,
        status: 'disconnected',
        usage: {
          requests: 0,
          tokens: 0,
          cost: 0,
          errors: 0
        },
        rateLimit: {
          current: 0,
          limit: 1000,
          resetTime: new Date().toISOString(),
          remaining: 1000
        },
        performance: {
          avgResponseTime: 0,
          successRate: 0,
          uptime: 0
        },
        created_at: new Date().toISOString()
      };

      const { data: provider, error } = await supabase
        .from('ai_providers')
        .insert([providerData])
        .select()
        .single();

      if (error) throw error;

      res.json(provider);
    } catch (error) {
      console.error("Error adding AI provider:", error);
      res.status(500).json({ message: "Failed to add AI provider" });
    }
  });

  // Test AI provider
  app.post("/api/ai/providers/:providerId/test", isAuthenticated, async (req, res) => {
    try {
      const { providerId } = req.params;

      const { data: provider, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('id', providerId)
        .eq('user_id', req.user.id)
        .single();

      if (error) throw error;

      // Test the provider connection
      const testConfig = {
        provider: provider.type,
        model: provider.models[0],
        apiKey: provider.api_key,
        temperature: 0.7,
        maxTokens: 50
      };

      const testResponse = await multiAIService.generateResponse(
        "Hello, this is a test message.",
        testConfig
      );

      // Update provider status
      await supabase
        .from('ai_providers')
        .update({
          status: 'connected',
          last_used: new Date().toISOString()
        })
        .eq('id', providerId);

      res.json({ success: true, message: "Provider test successful" });
    } catch (error) {
      console.error("Error testing AI provider:", error);

      // Update provider status to error
      await supabase
        .from('ai_providers')
        .update({ status: 'error' })
        .eq('id', req.params.providerId);

      res.status(500).json({ message: "Provider test failed" });
    }
  });

  // Get AI analytics
  app.get("/api/ai/analytics", isAuthenticated, async (req, res) => {
    try {
      const { range = '7d' } = req.query;

      // Calculate date range
      const now = new Date();
      const daysBack = range === '24h' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

      // Get agents
      const { data: agents } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('user_id', req.user.id);

      // Get providers
      const { data: providers } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('user_id', req.user.id);

      // Mock analytics data (replace with real data from your analytics tables)
      const analytics = {
        overview: {
          totalInteractions: 1250,
          totalAgents: agents?.length || 0,
          avgResponseTime: 1200,
          successRate: 94.5,
          totalCost: 45.67,
          activeUsers: 89
        },
        trends: {
          interactions: Array.from({ length: daysBack }, (_, i) => ({
            date: new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            count: Math.floor(Math.random() * 100) + 50
          })),
          responseTime: Array.from({ length: daysBack }, (_, i) => ({
            date: new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            time: Math.floor(Math.random() * 500) + 800
          })),
          successRate: Array.from({ length: daysBack }, (_, i) => ({
            date: new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            rate: Math.floor(Math.random() * 10) + 90
          })),
          cost: Array.from({ length: daysBack }, (_, i) => ({
            date: new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            amount: Math.random() * 10 + 2
          }))
        },
        agentPerformance: agents?.map(agent => ({
          id: agent.id,
          name: agent.name,
          interactions: Math.floor(Math.random() * 500) + 100,
          successRate: Math.floor(Math.random() * 20) + 80,
          avgResponseTime: Math.floor(Math.random() * 1000) + 500,
          cost: Math.random() * 20 + 5,
          satisfaction: Math.floor(Math.random() * 2) + 4
        })) || [],
        providerStats: providers?.map(provider => ({
          provider: provider.name,
          requests: Math.floor(Math.random() * 1000) + 200,
          cost: Math.random() * 30 + 10,
          avgResponseTime: Math.floor(Math.random() * 800) + 400,
          errorRate: Math.random() * 5 + 1
        })) || [],
        topQueries: [
          { query: "How can I help you today?", count: 45, successRate: 98 },
          { query: "What are your business hours?", count: 32, successRate: 95 },
          { query: "Can you help me with pricing?", count: 28, successRate: 92 },
          { query: "I need technical support", count: 24, successRate: 89 },
          { query: "How do I contact sales?", count: 19, successRate: 96 }
        ],
        userSatisfaction: {
          excellent: 45,
          good: 35,
          average: 15,
          poor: 5
        }
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching AI analytics:", error);
      res.status(500).json({ message: "Failed to fetch AI analytics" });
    }
  });

  // ===== AI TRAINING ROUTES =====

  // Get training datasets
  app.get("/api/ai/training/datasets", isAuthenticated, async (req, res) => {
    try {
      const { data: datasets, error } = await supabase
        .from('ai_training_datasets')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json(datasets || []);
    } catch (error) {
      console.error("Error fetching training datasets:", error);
      res.status(500).json({ message: "Failed to fetch training datasets" });
    }
  });

  // Upload training dataset
  app.post("/api/ai/training/upload", isAuthenticated, async (req, res) => {
    try {
      // Handle file upload logic here
      const { type, name } = req.body;

      const datasetData = {
        id: `dataset_${Date.now()}`,
        user_id: req.user.id,
        name: name || 'Uploaded Dataset',
        type: type || 'custom',
        source: 'upload',
        size: Math.floor(Math.random() * 1000) + 100, // Mock size
        status: 'processing',
        created_at: new Date().toISOString()
      };

      const { data: dataset, error } = await supabase
        .from('ai_training_datasets')
        .insert([datasetData])
        .select()
        .single();

      if (error) throw error;

      // Simulate processing
      setTimeout(async () => {
        await supabase
          .from('ai_training_datasets')
          .update({
            status: 'completed',
            accuracy: Math.floor(Math.random() * 20) + 80
          })
          .eq('id', dataset.id);
      }, 3000);

      res.json(dataset);
    } catch (error) {
      console.error("Error uploading training dataset:", error);
      res.status(500).json({ message: "Failed to upload training dataset" });
    }
  });

  // Generate training data from conversations
  app.post("/api/ai/training/generate", isAuthenticated, async (req, res) => {
    try {
      const { type, source, count } = req.body;

      const datasetData = {
        id: `dataset_${Date.now()}`,
        user_id: req.user.id,
        name: `Generated ${type} data from ${source}`,
        type,
        source,
        size: count || 1000,
        status: 'processing',
        created_at: new Date().toISOString()
      };

      const { data: dataset, error } = await supabase
        .from('ai_training_datasets')
        .insert([datasetData])
        .select()
        .single();

      if (error) throw error;

      // Simulate data generation
      setTimeout(async () => {
        await supabase
          .from('ai_training_datasets')
          .update({
            status: 'completed',
            accuracy: Math.floor(Math.random() * 15) + 85
          })
          .eq('id', dataset.id);
      }, 5000);

      res.json(dataset);
    } catch (error) {
      console.error("Error generating training data:", error);
      res.status(500).json({ message: "Failed to generate training data" });
    }
  });

  // Get training jobs
  app.get("/api/ai/training/jobs", isAuthenticated, async (req, res) => {
    try {
      const { data: jobs, error } = await supabase
        .from('ai_training_jobs')
        .select(`
          *,
          ai_agents!inner(name)
        `)
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedJobs = jobs?.map(job => ({
        ...job,
        agentName: job.ai_agents?.name || 'Unknown Agent'
      })) || [];

      res.json(formattedJobs);
    } catch (error) {
      console.error("Error fetching training jobs:", error);
      res.status(500).json({ message: "Failed to fetch training jobs" });
    }
  });

  // Start training job
  app.post("/api/ai/training/start", isAuthenticated, async (req, res) => {
    try {
      const { agentId, datasetIds, config } = req.body;

      const jobData = {
        id: `job_${Date.now()}`,
        user_id: req.user.id,
        agent_id: agentId,
        dataset_ids: datasetIds,
        config,
        status: 'queued',
        progress: 0,
        data_points: Math.floor(Math.random() * 5000) + 1000,
        accuracy: 0,
        started_at: new Date().toISOString(),
        logs: ['Training job queued'],
        created_at: new Date().toISOString()
      };

      const { data: job, error } = await supabase
        .from('ai_training_jobs')
        .insert([jobData])
        .select()
        .single();

      if (error) throw error;

      // Simulate training process
      setTimeout(async () => {
        await supabase
          .from('ai_training_jobs')
          .update({
            status: 'running',
            progress: 25,
            logs: ['Training job queued', 'Starting training process...']
          })
          .eq('id', job.id);
      }, 2000);

      setTimeout(async () => {
        await supabase
          .from('ai_training_jobs')
          .update({
            status: 'completed',
            progress: 100,
            accuracy: Math.floor(Math.random() * 20) + 80,
            completed_at: new Date().toISOString(),
            logs: ['Training job queued', 'Starting training process...', 'Training completed successfully']
          })
          .eq('id', job.id);
      }, 10000);

      res.json(job);
    } catch (error) {
      console.error("Error starting training job:", error);
      res.status(500).json({ message: "Failed to start training job" });
    }
  });

  // ===== AI KNOWLEDGE BASE ROUTES =====

  // Get knowledge items
  app.get("/api/ai/knowledge", isAuthenticated, async (req, res) => {
    try {
      const { search, category } = req.query;

      let query = supabase
        .from('ai_knowledge_items')
        .select('*')
        .eq('user_id', req.user.id);

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data: items, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      res.json(items || []);
    } catch (error) {
      console.error("Error fetching knowledge items:", error);
      res.status(500).json({ message: "Failed to fetch knowledge items" });
    }
  });

  // Create knowledge item
  app.post("/api/ai/knowledge", isAuthenticated, async (req, res) => {
    try {
      const itemData = {
        ...req.body,
        id: `knowledge_${Date.now()}`,
        user_id: req.user.id,
        usage: {
          views: 0,
          references: 0,
          lastUsed: new Date().toISOString()
        },
        metadata: {
          source: 'manual',
          author: req.user.email,
          confidence: 100,
          language: 'en'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: item, error } = await supabase
        .from('ai_knowledge_items')
        .insert([itemData])
        .select()
        .single();

      if (error) throw error;

      res.json(item);
    } catch (error) {
      console.error("Error creating knowledge item:", error);
      res.status(500).json({ message: "Failed to create knowledge item" });
    }
  });

  // Update knowledge item
  app.patch("/api/ai/knowledge/:itemId", isAuthenticated, async (req, res) => {
    try {
      const { itemId } = req.params;
      const updates = {
        ...req.body,
        updated_at: new Date().toISOString()
      };

      const { data: item, error } = await supabase
        .from('ai_knowledge_items')
        .update(updates)
        .eq('id', itemId)
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (error) throw error;

      res.json(item);
    } catch (error) {
      console.error("Error updating knowledge item:", error);
      res.status(500).json({ message: "Failed to update knowledge item" });
    }
  });

  // Delete knowledge item
  app.delete("/api/ai/knowledge/:itemId", isAuthenticated, async (req, res) => {
    try {
      const { itemId } = req.params;

      const { error } = await supabase
        .from('ai_knowledge_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', req.user.id);

      if (error) throw error;

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting knowledge item:", error);
      res.status(500).json({ message: "Failed to delete knowledge item" });
    }
  });

  // Get knowledge categories
  app.get("/api/ai/knowledge/categories", isAuthenticated, async (req, res) => {
    try {
      const { data: categories, error } = await supabase
        .from('ai_knowledge_categories')
        .select('*')
        .eq('user_id', req.user.id)
        .order('name');

      if (error) throw error;

      res.json(categories || []);
    } catch (error) {
      console.error("Error fetching knowledge categories:", error);
      res.status(500).json({ message: "Failed to fetch knowledge categories" });
    }
  });

  // Sync knowledge base
  app.post("/api/ai/knowledge/sync", isAuthenticated, async (req, res) => {
    try {
      // Implement knowledge base sync logic here
      // This could sync with external sources, update embeddings, etc.

      res.json({ success: true, message: "Knowledge base synchronized" });
    } catch (error) {
      console.error("Error syncing knowledge base:", error);
      res.status(500).json({ message: "Failed to sync knowledge base" });
    }
  });

  // Sync all AI data
  app.post("/api/ai/sync", isAuthenticated, async (req, res) => {
    try {
      // Implement comprehensive AI data sync
      // This could include agents, providers, training data, knowledge base, etc.

      res.json({ success: true, message: "AI data synchronized" });
    } catch (error) {
      console.error("Error syncing AI data:", error);
      res.status(500).json({ message: "Failed to sync AI data" });
    }
  });

  // ===== WHATSAPP WEB ROUTES =====

  // Create WhatsApp Web session and get QR code
  app.post("/api/whatsapp-web/create-session", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub || "admin-user-123";
      console.log(`Creating WhatsApp Web session for user ${userId}`);

      // Check if user already has active sessions (limit to prevent abuse)
      const storage = (global as any).storage;
      if (storage) {
        const existingNumbers = await storage.getWhatsappNumbers(userId);
        const activeNumbers = existingNumbers.filter((num: any) =>
          num.status === 'active' || num.status === 'connected'
        );

        if (activeNumbers.length >= 5) { // Limit to 5 active numbers per user
          return res.status(400).json({
            success: false,
            message: "Maximum number of WhatsApp connections reached (5). Please disconnect some numbers first."
          });
        }
      }

      // Get WhatsApp Web service from global scope
      const whatsappWebService = (global as any).whatsappWebService;
      if (!whatsappWebService) {
        throw new Error("WhatsApp Web service not initialized");
      }

      const result = await whatsappWebService.createSession(userId);

      res.json({
        success: true,
        sessionId: result.sessionId,
        qrCode: result.qrCode,
        message: "QR code generated successfully. Scan with WhatsApp to connect."
      });
    } catch (error) {
      console.error("Error creating WhatsApp Web session:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create session: " + (error as any).message
      });
    }
  });

  // Get WhatsApp Web session status
  app.get("/api/whatsapp-web/sessions/:sessionId/status", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const whatsappWebService = (global as any).whatsappWebService;

      if (!whatsappWebService) {
        throw new Error("WhatsApp Web service not initialized");
      }

      const session = await whatsappWebService.getSession(sessionId);
      if (session) {
        res.json({
          exists: true,
          status: session.status,
          connected: session.status === 'ready' || session.status === 'connected',
          phoneNumber: session.phoneNumber
        });
      } else {
        res.json({
          exists: false,
          status: 'not_found',
          connected: false
        });
      }
    } catch (error) {
      console.error("Error getting WhatsApp Web session status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get session status: " + (error as any).message
      });
    }
  });

  // Get active WhatsApp Web sessions
  app.get("/api/whatsapp-web/sessions", isAuthenticated, async (req, res) => {
    try {
      const whatsappWebService = (global as any).whatsappWebService;

      if (!whatsappWebService) {
        throw new Error("WhatsApp Web service not initialized");
      }

      const sessions = await whatsappWebService.getAllSessions();

      // Convert sessions to serializable format to avoid circular reference errors
      const serializableSessions = sessions.map((sessionData: any) => ({
        sessionId: sessionData.sessionId,
        id: sessionData.id,
        status: sessionData.status || 'unknown',
        phoneNumber: sessionData.phoneNumber || null,
        qrCode: sessionData.qrCode || null,
        createdAt: sessionData.createdAt ? sessionData.createdAt.toISOString() : new Date().toISOString(),
        lastActivity: sessionData.lastActivity ? sessionData.lastActivity.toISOString() : new Date().toISOString(),
        isReady: sessionData.client && sessionData.client.info ? true : false
      }));

      res.json(serializableSessions);
    } catch (error) {
      console.error("Error getting WhatsApp Web sessions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get sessions: " + (error as any).message
      });
    }
  });

  // Reconnect WhatsApp Web session
  app.post("/api/whatsapp-web/reconnect/:sessionId", isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const whatsappWebService = (global as any).whatsappWebService;

      if (!whatsappWebService) {
        throw new Error("WhatsApp Web service not initialized");
      }

      const success = await whatsappWebService.reconnectSession(sessionId);

      if (success) {
        res.json({
          success: true,
          message: "Session reconnection initiated"
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Failed to reconnect session"
        });
      }
    } catch (error) {
      console.error("Error reconnecting WhatsApp Web session:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reconnect session: " + (error as any).message
      });
    }
  });

  // Force reconnect WhatsApp Web session (resets all retry attempts)
  app.post("/api/whatsapp-web/force-reconnect/:sessionId", isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const whatsappWebService = (global as any).whatsappWebService;

      if (!whatsappWebService) {
        throw new Error("WhatsApp Web service not initialized");
      }

      const success = await whatsappWebService.forceReconnectSession(sessionId);

      if (success) {
        res.json({
          success: true,
          message: "Session force reconnection initiated"
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Failed to force reconnect session"
        });
      }
    } catch (error) {
      console.error("Error force reconnecting WhatsApp Web session:", error);
      res.status(500).json({
        success: false,
        message: "Failed to force reconnect session: " + (error as any).message
      });
    }
  });

  // Send message via WhatsApp Web
  app.post("/api/whatsapp-web/send-message", isAuthenticated, async (req, res) => {
    try {
      const { sessionId, to, message } = req.body;

      if (!sessionId || !to || !message) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: sessionId, to, message"
        });
      }

      const whatsappWebService = (global as any).whatsappWebService;

      if (!whatsappWebService) {
        throw new Error("WhatsApp Web service not initialized");
      }

      const result = await whatsappWebService.sendMessage(sessionId, to, message);

      res.json({
        success: true,
        messageId: result.id,
        status: result.status,
        timestamp: result.timestamp
      });
    } catch (error) {
      console.error("Error sending WhatsApp Web message:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send message: " + (error as any).message
      });
    }
  });

  // Disconnect WhatsApp Web session
  app.post("/api/whatsapp-web/disconnect/:sessionId", isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const whatsappWebService = (global as any).whatsappWebService;

      if (!whatsappWebService) {
        throw new Error("WhatsApp Web service not initialized");
      }

      await whatsappWebService.disconnectSession(sessionId);

      res.json({
        success: true,
        message: "Session disconnected successfully"
      });
    } catch (error) {
      console.error("Error disconnecting WhatsApp Web session:", error);
      res.status(500).json({
        success: false,
        message: "Failed to disconnect session: " + (error as any).message
      });
    }
  });

  // Toggle AI for contact
  app.post("/api/contacts/toggle-ai", isAuthenticated, async (req, res) => {
    try {
      const { contactId, aiActive } = req.body;
      const userId = (req.user as any).claims?.sub;

      if (!contactId || typeof aiActive !== 'boolean') {
        return res.status(400).json({ message: "Contact ID and AI active status are required" });
      }

      console.log(`🤖 AI ${aiActive ? 'enabled' : 'disabled'} for contact ${contactId}`);

      // For now, just return success - we'll implement database storage later
      res.json({
        success: true,
        message: `AI ${aiActive ? 'enabled' : 'disabled'} for contact`,
        aiActive
      });
    } catch (error) {
      console.error("Error toggling AI for contact:", error);
      res.status(500).json({ message: "Failed to toggle AI status" });
    }
  });

  // Toggle block status for contact
  app.post("/api/contacts/toggle-block", isAuthenticated, async (req, res) => {
    try {
      const { contactId, blocked } = req.body;
      const userId = (req.user as any).claims?.sub;

      if (!contactId || typeof blocked !== 'boolean') {
        return res.status(400).json({ message: "Contact ID and blocked status are required" });
      }

      console.log(`🚫 Contact ${contactId} ${blocked ? 'blocked' : 'unblocked'}`);

      // For now, just return success - we'll implement database storage later
      res.json({
        success: true,
        message: `Contact ${blocked ? 'blocked' : 'unblocked'}`,
        blocked
      });
    } catch (error) {
      console.error("Error toggling block status for contact:", error);
      res.status(500).json({ message: "Failed to toggle block status" });
    }
  });

  // Toggle pin status for contact
  app.post("/api/contacts/toggle-pin", isAuthenticated, async (req, res) => {
    try {
      const { contactId, pinned } = req.body;
      const userId = (req.user as any).claims?.sub;

      if (!contactId || typeof pinned !== 'boolean') {
        return res.status(400).json({ message: "Contact ID and pinned status are required" });
      }

      // For now, just return success since we'll implement this feature gradually
      console.log(`📌 Contact ${contactId} ${pinned ? 'pinned' : 'unpinned'}`);

      res.json({
        success: true,
        message: `Contact ${pinned ? 'pinned' : 'unpinned'}`,
        pinned
      });
    } catch (error) {
      console.error("Error toggling pin status for contact:", error);
      res.status(500).json({ message: "Failed to toggle pin status" });
    }
  });

  // Toggle archive status for contact
  app.post("/api/contacts/toggle-archive", isAuthenticated, async (req, res) => {
    try {
      const { contactId, archived } = req.body;
      const userId = (req.user as any).claims?.sub;

      if (!contactId || typeof archived !== 'boolean') {
        return res.status(400).json({ message: "Contact ID and archived status are required" });
      }

      // For now, just return success since we'll implement this feature gradually
      console.log(`📦 Contact ${contactId} ${archived ? 'archived' : 'unarchived'}`);

      res.json({
        success: true,
        message: `Contact ${archived ? 'archived' : 'unarchived'}`,
        archived
      });
    } catch (error) {
      console.error("Error toggling archive status for contact:", error);
      res.status(500).json({ message: "Failed to toggle archive status" });
    }
  });

  // Get contact profile information
  app.get("/api/whatsapp/contact-profile/:contactId", isAuthenticated, async (req, res) => {
    try {
      const { contactId } = req.params;
      const userId = (req.user as any).claims?.sub;

      console.log(`📋 Getting profile for contact ${contactId}`);

      const contact = await storage.getContact(parseInt(contactId));
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      // Try to get profile photo from WhatsApp
      let profilePhoto = null;
      try {
        const whatsappNumbers = await storage.getWhatsAppNumbers(userId);
        const activeNumber = whatsappNumbers.find(num => num.status === 'connected');

        if (activeNumber && whatsappClients.has(activeNumber.id)) {
          const client = whatsappClients.get(activeNumber.id);
          const profilePicUrl = await client.getProfilePicUrl(contact.phone);
          profilePhoto = profilePicUrl;
        }
      } catch (error) {
        console.log('Could not fetch profile photo:', error.message);
      }

      res.json({
        success: true,
        profilePhoto,
        isBlocked: contact.is_blocked,
        isPinned: contact.is_pinned,
        isArchived: contact.is_archived,
        aiEnabled: contact.ai_enabled
      });
    } catch (error) {
      console.error("Error getting contact profile:", error);
      res.status(500).json({ message: "Failed to get contact profile" });
    }
  });

  // Get contact status (online/offline, last seen)
  app.get("/api/whatsapp/contact-status/:phone", isAuthenticated, async (req, res) => {
    try {
      const { phone } = req.params;
      const userId = (req.user as any).claims?.sub;

      console.log(`📱 Getting status for phone ${phone}`);

      let contactStatus = {
        isOnline: false,
        lastSeen: null,
        isTyping: false
      };

      try {
        const whatsappNumbers = await storage.getWhatsAppNumbers(userId);
        const activeNumber = whatsappNumbers.find(num => num.status === 'connected');

        if (activeNumber && whatsappClients.has(activeNumber.id)) {
          const client = whatsappClients.get(activeNumber.id);

          // Check if contact is online (this is a simplified check)
          const contact = await client.getContactById(phone + '@c.us');
          if (contact) {
            contactStatus.isOnline = contact.isOnline || false;
            contactStatus.lastSeen = contact.lastSeen || null;
          }
        }
      } catch (error) {
        console.log('Could not fetch contact status:', error.message);
      }

      res.json(contactStatus);
    } catch (error) {
      console.error("Error getting contact status:", error);
      res.status(500).json({ message: "Failed to get contact status" });
    }
  });

  // Get profile photo endpoint
  app.get("/api/whatsapp/profile-photo/:phone", isAuthenticated, async (req, res) => {
    try {
      const { phone } = req.params;
      const userId = (req.user as any).claims?.sub;

      console.log(`🖼️ Getting profile photo for phone ${phone}`);

      try {
        const whatsappNumbers = await storage.getWhatsAppNumbers(userId);
        const activeNumber = whatsappNumbers.find(num => num.status === 'connected');

        if (activeNumber && whatsappClients.has(activeNumber.id)) {
          const client = whatsappClients.get(activeNumber.id);
          const profilePicUrl = await client.getProfilePicUrl(phone + '@c.us');

          if (profilePicUrl) {
            // Redirect to the actual profile picture URL
            return res.redirect(profilePicUrl);
          }
        }
      } catch (error) {
        console.log('Could not fetch profile photo:', error.message);
      }

      // Return a default avatar if no profile photo found
      res.status(404).json({ message: "Profile photo not found" });
    } catch (error) {
      console.error("Error getting profile photo:", error);
      res.status(500).json({ message: "Failed to get profile photo" });
    }
  });



  // Delete conversation by contact
  app.delete("/api/conversations/contact/:contactId", isAuthenticated, async (req, res) => {
    try {
      const contactId = req.params.contactId;
      const userId = (req.user as any).claims?.sub || "admin-user-123";

      console.log(`🗑️ DELETE CHAT REQUEST - Contact ID: ${contactId}, User: ${userId}`);

      if (!contactId) {
        return res.status(400).json({ message: "Contact ID is required" });
      }

      // Get all conversations for this contact
      const conversations = await storage.getConversations(userId);
      console.log(`📱 Found ${conversations.length} total conversations for user`);

      const contactConversations = conversations.filter((conv: any) => {
        const matches = conv.contact_id === contactId ||
                       conv.id === contactId ||
                       conv.contact_id === parseInt(contactId) ||
                       conv.id === parseInt(contactId);
        if (matches) {
          console.log(`🎯 Found matching conversation: ${conv.id} for contact ${contactId}`);
        }
        return matches;
      });

      console.log(`🗑️ Found ${contactConversations.length} conversations to delete for contact ${contactId}`);

      if (contactConversations.length === 0) {
        console.log(`⚠️ No conversations found for contact ${contactId}`);
        return res.json({
          success: true,
          message: "No conversations found to delete",
          deletedCount: 0
        });
      }

      // Delete all conversations and messages for this contact
      let deletedCount = 0;
      for (const conversation of contactConversations) {
        try {
          console.log(`🗑️ Deleting conversation ${conversation.id} and its messages`);

          // Use the storage method that handles both messages and conversation
          await storage.deleteConversation(conversation.id, userId);
          deletedCount++;

          console.log(`✅ Successfully deleted conversation ${conversation.id}`);
        } catch (convError) {
          console.error(`❌ Error deleting conversation ${conversation.id}:`, convError);
        }
      }

      // Emit real-time updates
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${userId}`).emit('conversation_deleted', {
          contactId: contactId,
          deletedCount: deletedCount
        });
        io.to(`user_${userId}`).emit('refresh_conversations');
        io.to(`user_${userId}`).emit('global_data_sync');
      }

      console.log(`✅ Successfully deleted ${deletedCount} conversations for contact ${contactId}`);

      res.json({
        success: true,
        message: `Successfully deleted ${deletedCount} conversations`,
        deletedCount: deletedCount
      });
    } catch (error) {
      console.error("Error deleting conversations for contact:", error);
      res.status(500).json({ message: "Failed to delete conversations" });
    }
  });

  return server;
}
