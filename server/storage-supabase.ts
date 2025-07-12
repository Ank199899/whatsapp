import { supabase } from './db';
import { promises as fs } from 'fs';
import path from 'path';
import type {
  User,
  UpsertUser,
  WhatsappNumber,
  InsertWhatsappNumber,
  ContactGroup,
  InsertContactGroup,
  Contact,
  InsertContact,
  Template,
  InsertTemplate,
  Campaign,
  InsertCampaign,
  Conversation,
  InsertConversation,
  Message,
  InsertMessage,
  AntiBlockingSettings,
  InsertAntiBlockingSettings,
  ChatbotSettings,
  InsertChatbotSettings,
} from "../shared/types";
import { IStorage } from './storage';

export class SupabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return undefined;
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
    
    return data as User;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { data, error } = await supabase
      .from('users')
      .upsert([{
        ...userData,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
    
    return data as User;
  }

  async deleteUser(id: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // WhatsApp numbers
  async getWhatsappNumbers(userId: string): Promise<WhatsappNumber[]> {
    const { data, error } = await supabase
      .from('whatsapp_numbers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting WhatsApp numbers:', error);
      return [];
    }
    
    // Remove duplicates by phone number, keeping the most recent one
    const uniqueNumbers = data.filter((num, index, arr) => 
      arr.findIndex(n => n.phone_number === num.phone_number) === index
    );
    
    return uniqueNumbers as WhatsappNumber[];
  }

  async createWhatsappNumber(number: InsertWhatsappNumber): Promise<WhatsappNumber> {
    // Check for existing number first to prevent duplicates
    if (number.phone_number) {
      const existingNumbers = await this.getWhatsappNumbers(number.user_id);
      const duplicate = existingNumbers.find(existing =>
        existing.phone_number === number.phone_number
      );

      if (duplicate) {
        console.log(`⚠️ Duplicate WhatsApp number detected: ${number.phone_number} (existing ID: ${duplicate.id})`);

        // Update the existing record instead of creating a new one
        return await this.updateWhatsappNumber(duplicate.id, {
          status: number.status || 'active',
          last_activity: new Date().toISOString(),
          session_data: number.session_data,
          display_name: number.display_name || duplicate.display_name
        });
      }
    }

    const { data, error } = await supabase
      .from('whatsapp_numbers')
      .insert([{
        ...number,
        last_activity: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating WhatsApp number:', error);
      throw error;
    }

    return data as WhatsappNumber;
  }

  async updateWhatsappNumber(id: number, updates: Partial<WhatsappNumber>): Promise<WhatsappNumber> {
    const { data, error } = await supabase
      .from('whatsapp_numbers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating WhatsApp number:', error);
      throw error;
    }
    
    return data as WhatsappNumber;
  }

  async deleteWhatsappNumber(id: number): Promise<void> {
    console.log(`🗑️ Starting comprehensive deletion of WhatsApp number ${id}`);

    try {
      // Step 1: Get all conversations for this WhatsApp number
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('whatsapp_number_id', id);

      if (convError) {
        console.warn('Error fetching conversations for WhatsApp number:', convError);
      } else if (conversations && conversations.length > 0) {
        console.log(`🗑️ Found ${conversations.length} conversations to delete`);

        // Step 2: Delete all messages for these conversations
        for (const conv of conversations) {
          const { error: msgError } = await supabase
            .from('messages')
            .delete()
            .eq('conversation_id', conv.id);

          if (msgError) {
            console.warn(`Error deleting messages for conversation ${conv.id}:`, msgError);
          } else {
            console.log(`✅ Deleted messages for conversation ${conv.id}`);
          }
        }

        // Step 3: Delete all conversations
        const { error: deleteConvError } = await supabase
          .from('conversations')
          .delete()
          .eq('whatsapp_number_id', id);

        if (deleteConvError) {
          console.warn('Error deleting conversations:', deleteConvError);
        } else {
          console.log(`✅ Deleted ${conversations.length} conversations`);
        }
      }

      // Step 4: Delete the WhatsApp number itself
      const { error } = await supabase
        .from('whatsapp_numbers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting WhatsApp number:', error);
        throw error;
      }

      console.log(`✅ Successfully completed comprehensive deletion of WhatsApp number ${id}`);
    } catch (error) {
      console.error('Error in comprehensive WhatsApp number deletion:', error);
      throw error;
    }
  }

  // Check if a phone number already exists for any user
  async checkDuplicatePhoneNumber(phoneNumber: string, excludeUserId?: string): Promise<WhatsappNumber | null> {
    let query = supabase
      .from('whatsapp_numbers')
      .select('*')
      .eq('phone_number', phoneNumber);

    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking duplicate phone number:', error);
      return null;
    }

    return data as WhatsappNumber | null;
  }

  // Remove duplicate WhatsApp numbers for a user, keeping the most recent one
  async removeDuplicateWhatsappNumbers(userId: string, phoneNumber?: string): Promise<void> {
    if (phoneNumber) {
      // Remove duplicates for a specific phone number
      const { data: duplicates, error } = await supabase
        .from('whatsapp_numbers')
        .select('*')
        .eq('user_id', userId)
        .eq('phone_number', phoneNumber)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error finding duplicate WhatsApp numbers:', error);
        return;
      }

      if (duplicates && duplicates.length > 1) {
        // Keep the first (most recent) and delete the rest
        const toDelete = duplicates.slice(1);

        for (const duplicate of toDelete) {
          await this.deleteWhatsappNumber(duplicate.id);
          console.log(`🗑️ Removed duplicate WhatsApp number: ${duplicate.id} (${phoneNumber})`);
        }
      }
    } else {
      // Remove all duplicates for the user
      const { data: allNumbers, error } = await supabase
        .from('whatsapp_numbers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error finding WhatsApp numbers:', error);
        return;
      }

      if (allNumbers) {
        // Group by phone number
        const phoneGroups = new Map<string, any[]>();

        for (const number of allNumbers) {
          const phone = number.phone_number;
          if (!phoneGroups.has(phone)) {
            phoneGroups.set(phone, []);
          }
          phoneGroups.get(phone)!.push(number);
        }

        // Remove duplicates from each group
        for (const [phone, numbers] of phoneGroups) {
          if (numbers.length > 1) {
            const toDelete = numbers.slice(1); // Keep first (most recent)

            for (const duplicate of toDelete) {
              await this.deleteWhatsappNumber(duplicate.id);
              console.log(`🗑️ Removed duplicate WhatsApp number: ${duplicate.id} (${phone})`);
            }
          }
        }
      }
    }
  }

  // Contact Groups
  async getContactGroups(userId: string): Promise<ContactGroup[]> {
    const { data, error } = await supabase
      .from('contact_groups')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting contact groups:', error);
      return [];
    }
    
    return data as ContactGroup[];
  }

  async createContactGroup(group: InsertContactGroup & { userId: string }): Promise<ContactGroup> {
    const { data, error } = await supabase
      .from('contact_groups')
      .insert([{
        user_id: group.userId,
        name: group.name,
        description: group.description,
        color: group.color
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating contact group:', error);
      throw error;
    }
    
    return data as ContactGroup;
  }

  async updateContactGroup(id: number, updates: Partial<ContactGroup>): Promise<ContactGroup> {
    const { data, error } = await supabase
      .from('contact_groups')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating contact group:', error);
      throw error;
    }
    
    return data as ContactGroup;
  }

  async deleteContactGroup(id: number): Promise<void> {
    // First, remove group assignment from contacts
    await supabase
      .from('contacts')
      .update({ group_id: null })
      .eq('group_id', id);
    
    // Then delete the group
    const { error } = await supabase
      .from('contact_groups')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting contact group:', error);
      throw error;
    }
  }

  // Contacts
  async getContacts(userId: string): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting contacts:', error);
      return [];
    }
    
    return data as Contact[];
  }

  async createContact(contact: InsertContact & { userId: string }): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .insert([{
        user_id: contact.userId,
        group_id: contact.group_id,
        name: contact.name,
        phone_number: contact.phone_number,
        email: contact.email,
        tags: contact.tags,
        status: contact.status,
        notes: contact.notes
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating contact:', error);
      throw error;
    }

    return data as Contact;
  }

  async updateContact(id: number, updates: Partial<Contact>): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
    
    return data as Contact;
  }

  async deleteContact(id: number): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  async bulkCreateContacts(contactList: (InsertContact & { userId: string })[]): Promise<Contact[]> {
    if (contactList.length === 0) return [];
    
    const formattedContacts = contactList.map(contact => ({
      user_id: contact.userId,
      group_id: contact.groupId,
      name: contact.name,
      phone_number: contact.phoneNumber,
      email: contact.email,
      tags: contact.tags,
      status: contact.status,
      notes: contact.notes
    }));
    
    const { data, error } = await supabase
      .from('contacts')
      .insert(formattedContacts)
      .select();
    
    if (error) {
      console.error('Error bulk creating contacts:', error);
      throw error;
    }
    
    return data as Contact[];
  }

  async deleteContacts(ids: number[]): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .in('id', ids);
    
    if (error) {
      console.error('Error deleting contacts:', error);
      throw error;
    }
  }

  // Templates
  async getTemplates(userId: string): Promise<Template[]> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting templates:', error);
      return [];
    }

    // Transform database field names to match frontend expectations
    return (data || []).map(template => ({
      ...template,
      isActive: template.is_active,
      mediaType: template.media_type,
      mediaUrl: template.media_url,
      mediaCaption: template.media_caption,
      ctaButtons: template.cta_buttons,
      usageCount: template.usage_count,
      lastUsed: template.last_used,
      estimatedReadTime: template.estimated_read_time,
      createdAt: template.created_at,
      updatedAt: template.updated_at
    })) as Template[];
  }

  async createTemplate(template: InsertTemplate & { userId: string }): Promise<Template> {
    const { data, error } = await supabase
      .from('templates')
      .insert([{
        user_id: template.userId,
        name: template.name,
        category: template.category || 'general',
        content: template.content,
        variables: template.variables || null,
        cta_buttons: (template as any).ctaButtons || null,
        media_type: (template as any).mediaType || null,
        media_url: (template as any).mediaUrl || null,
        media_caption: (template as any).mediaCaption || null,
        tags: (template as any).tags || null,
        language: (template as any).language || 'en',
        is_active: (template as any).isActive !== undefined ? (template as any).isActive : true,
        estimated_read_time: (template as any).estimatedReadTime || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      throw error;
    }

    // Transform database field names to match frontend expectations
    const transformedData = {
      ...data,
      isActive: data.is_active,
      mediaType: data.media_type,
      mediaUrl: data.media_url,
      mediaCaption: data.media_caption,
      ctaButtons: data.cta_buttons,
      usageCount: data.usage_count,
      lastUsed: data.last_used,
      estimatedReadTime: data.estimated_read_time,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    return transformedData as Template;
  }

  async updateTemplate(id: number, updates: Partial<Template>): Promise<Template> {
    const { data, error } = await supabase
      .from('templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      throw error;
    }

    // Transform database field names to match frontend expectations
    const transformedData = {
      ...data,
      isActive: data.is_active,
      mediaType: data.media_type,
      mediaUrl: data.media_url,
      mediaCaption: data.media_caption,
      ctaButtons: data.cta_buttons,
      usageCount: data.usage_count,
      lastUsed: data.last_used,
      estimatedReadTime: data.estimated_read_time,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    return transformedData as Template;
  }

  async deleteTemplate(id: number): Promise<void> {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  // Campaigns
  async getCampaigns(userId: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting campaigns:', error);
      return [];
    }
    
    return data as Campaign[];
  }

  async createCampaign(campaign: InsertCampaign & { userId: string }): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .insert([{
        user_id: campaign.userId,
        name: campaign.name,
        message: campaign.message,
        template_id: campaign.templateId,
        template_ids: campaign.templateIds,
        whatsapp_number_id: campaign.whatsappNumberId,
        whatsapp_number_ids: campaign.whatsappNumberIds,
        status: campaign.status,
        total_contacts: campaign.totalContacts,
        messages_sent: campaign.messagesSent,
        messages_delivered: campaign.messagesDelivered,
        messages_failed: campaign.messagesFailed,
        messages_read: campaign.messagesRead,
        scheduled_at: campaign.scheduledAt,
        target_groups: campaign.targetGroups,
        target_contacts: campaign.targetContacts,
        anti_blocking_settings: campaign.antiBlockingSettings,
        message_delay_min: campaign.messageDelayMin,
        message_delay_max: campaign.messageDelayMax
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
    
    return data as Campaign;
  }

  async updateCampaign(id: number, updates: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
    
    return data as Campaign;
  }

  async deleteCampaign(id: number, userId?: string): Promise<void> {
    const query = supabase
      .from('campaigns')
      .delete();
    
    if (userId) {
      query.eq('user_id', userId).eq('id', id);
    } else {
      query.eq('id', id);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  }

  // Conversations
  async getConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error getting conversations:', error);
      return [];
    }

    return data as Conversation[];
  }

  async getConversationById(id: number): Promise<Conversation | undefined> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        return undefined;
      }
      console.error('Error getting conversation by ID:', error);
      return undefined;
    }

    return data as Conversation;
  }

  async createConversation(conversation: InsertConversation & { userId: string }): Promise<Conversation> {
    // Check if conversation already exists for this phone number
    const normalizedPhone = this.normalizePhoneNumber(conversation.contactPhone);
    const existingConversations = await this.getConversations(conversation.userId);

    const existingConv = existingConversations.find(conv =>
      this.normalizePhoneNumber(conv.contact_phone) === normalizedPhone
    );

    if (existingConv) {
      console.log(`📞 Conversation already exists for ${normalizedPhone}, returning existing conversation ${existingConv.id}`);
      return existingConv;
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert([{
        user_id: conversation.userId,
        contact_id: conversation.contactId,
        whatsapp_number_id: conversation.whatsappNumberId,
        contact_name: conversation.contactName,
        contact_phone: normalizedPhone, // Store normalized phone number
        last_message: conversation.lastMessage,
        last_message_at: conversation.lastMessageAt,
        unread_count: conversation.unreadCount,
        tags: conversation.tags,
        status: conversation.status
        // ai_enabled: false,
        // is_blocked: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }

    console.log(`✅ Created new conversation ${data.id} for ${normalizedPhone}`);
    return data as Conversation;
  }

  async updateConversation(id: number, updates: Partial<Conversation>, userId?: string): Promise<Conversation> {
    let query = supabase
      .from('conversations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // Add user filter if userId is provided for security
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }

    return data as Conversation;
  }

  async updateConversationPin(id: number, isPinned: boolean, userId?: string): Promise<void> {
    console.log(`📌 Updating conversation ${id} pin status to ${isPinned} for user ${userId}`);

    let query = supabase
      .from('conversations')
      .update({
        is_pinned: isPinned,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // Add user filter if userId is provided for security
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error updating conversation pin status:', error);
      throw error;
    }

    console.log(`✅ Successfully ${isPinned ? 'pinned' : 'unpinned'} conversation ${id}`);
  }

  async deleteConversation(id: number, userId?: string): Promise<void> {
    console.log(`🗑️ Starting comprehensive deletion of conversation ${id} for user ${userId}`);

    try {
      // First, get the conversation to verify ownership if userId is provided
      if (userId) {
        const { data: conversation, error: fetchError } = await supabase
          .from('conversations')
          .select('id, contact_id')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (fetchError || !conversation) {
          throw new Error('Conversation not found or access denied');
        }

        console.log(`✅ Found conversation ${id} for user ${userId}`);
      }

      // Step 1: Get count of messages to delete
      const { count: messageCount, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', id);

      if (countError) {
        console.warn('Error counting messages:', countError);
      } else {
        console.log(`🗑️ Found ${messageCount || 0} messages to delete`);
      }

      // Step 2: Delete all messages first
      const { error: msgError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', id);

      if (msgError) {
        console.error('Error deleting messages:', msgError);
        throw msgError;
      } else {
        console.log(`✅ Deleted ${messageCount || 0} messages for conversation ${id}`);
      }

      // Step 3: Delete the conversation
      let query = supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      // Add user filter if userId is provided for security
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { error } = await query;

      if (error) {
        console.error('Error deleting conversation:', error);
        throw error;
      }

      console.log(`✅ Successfully completed comprehensive deletion of conversation ${id}`);
    } catch (error) {
      console.error('Error in comprehensive conversation deletion:', error);
      throw error;
    }
  }

  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return this.getConversations(userId);
  }

  async cleanupDuplicateConversations(userId: string): Promise<{ removed: number, messagesRemoved: number }> {
    try {
      // Get all conversations for the user
      const conversations = await this.getConversations(userId);

      // Group conversations by normalized phone number
      const phoneGroups = new Map<string, Conversation[]>();

      for (const conv of conversations) {
        const phone = conv.contact_phone;
        if (!phone) continue;

        // Use the same normalization as phone-utils.ts
        const normalizedPhone = this.normalizePhoneNumber(phone);

        if (!phoneGroups.has(normalizedPhone)) {
          phoneGroups.set(normalizedPhone, []);
        }
        phoneGroups.get(normalizedPhone)!.push(conv);
      }

      let removedCount = 0;
      let messagesRemovedCount = 0;

      // For each phone number group, keep only the most recent conversation
      for (const [phone, convs] of phoneGroups) {
        if (convs.length > 1) {
          // Sort by updated_at descending (most recent first)
          convs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

          // Keep the first (most recent), remove the rest
          const toRemove = convs.slice(1);

          for (const conv of toRemove) {
            // Count messages before deletion
            const messages = await this.getMessages(conv.id);
            messagesRemovedCount += messages.length;

            await this.deleteConversation(conv.id, userId);
            removedCount++;
            console.log(`🗑️ Removed duplicate conversation ${conv.id} for phone ${phone} (${messages.length} messages)`);
          }
        }
      }

      return { removed: removedCount, messagesRemoved: messagesRemovedCount };
    } catch (error) {
      console.error('Error cleaning up duplicate conversations:', error);
      throw error;
    }
  }

  // Helper function to normalize phone numbers consistently
  private normalizePhoneNumber(phone: string): string {
    if (!phone) return '';

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Handle different Indian number formats
    if (digits.length === 10) {
      // 10 digits: assume Indian mobile number, add country code
      return '91' + digits;
    }

    if (digits.length === 11 && digits.startsWith('0')) {
      // 11 digits starting with 0: remove leading 0 and add country code
      return '91' + digits.substring(1);
    }

    if (digits.length === 12 && digits.startsWith('91')) {
      // 12 digits starting with 91: already in correct format
      return digits;
    }

    if (digits.length === 13 && digits.startsWith('091')) {
      // 13 digits starting with 091: remove leading 0
      return digits.substring(1);
    }

    // If it's already 12 digits and starts with 91, keep as is
    // Otherwise, try to extract the last 10 digits and add 91
    if (digits.length > 10) {
      const last10 = digits.slice(-10);
      // Validate that it's a valid Indian mobile number (starts with 6,7,8,9)
      if (['6', '7', '8', '9'].includes(last10[0])) {
        return '91' + last10;
      }
    }

    // If we can't normalize it properly, return the original digits
    return digits;
  }

  // Clean up duplicate messages within conversations
  async cleanupDuplicateMessages(userId: string): Promise<{ removed: number }> {
    try {
      const conversations = await this.getConversations(userId);
      let removedCount = 0;

      for (const conv of conversations) {
        const messages = await this.getMessages(conv.id);

        // Group messages by whatsapp_message_id and content
        const messageGroups = new Map<string, any[]>();

        for (const msg of messages) {
          // Create a unique key based on whatsapp_message_id or content+timestamp
          const key = msg.whatsapp_message_id ||
                     `${msg.content}_${msg.timestamp}_${msg.direction}`;

          if (!messageGroups.has(key)) {
            messageGroups.set(key, []);
          }
          messageGroups.get(key)!.push(msg);
        }

        // Remove duplicates, keeping the first one
        for (const [key, msgs] of messageGroups) {
          if (msgs.length > 1) {
            // Sort by created_at ascending (keep the first)
            msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            // Remove all except the first
            const toRemove = msgs.slice(1);

            for (const msg of toRemove) {
              const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', msg.id);

              if (!error) {
                removedCount++;
                console.log(`🗑️ Removed duplicate message ${msg.id} in conversation ${conv.id}`);
              }
            }
          }
        }
      }

      return { removed: removedCount };
    } catch (error) {
      console.error('Error cleaning up duplicate messages:', error);
      throw error;
    }
  }

  // Delete ALL chats and conversations for a user
  async deleteAllChats(userId: string): Promise<{ deletedConversations: number, deletedMessages: number }> {
    console.log(`🗑️ Starting comprehensive deletion of ALL chats for user: ${userId}`);

    try {
      // Step 1: Get all conversations for this user
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId);

      if (convError) {
        console.error('Error fetching conversations for user:', convError);
        throw convError;
      }

      if (!conversations || conversations.length === 0) {
        console.log('📭 No conversations found for user');
        return { deletedConversations: 0, deletedMessages: 0 };
      }

      console.log(`🗑️ Found ${conversations.length} conversations to delete`);

      // Step 2: Count total messages before deletion
      let totalMessages = 0;
      for (const conv of conversations) {
        const { count, error: countError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id);

        if (!countError && count) {
          totalMessages += count;
        }
      }

      console.log(`🗑️ Found ${totalMessages} total messages to delete`);

      // Step 3: Delete all messages for all conversations
      const conversationIds = conversations.map(conv => conv.id);
      const { error: msgError } = await supabase
        .from('messages')
        .delete()
        .in('conversation_id', conversationIds);

      if (msgError) {
        console.error('Error deleting messages:', msgError);
        throw msgError;
      }

      console.log(`✅ Deleted ${totalMessages} messages`);

      // Step 4: Delete all conversations
      const { error: convDeleteError } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', userId);

      if (convDeleteError) {
        console.error('Error deleting conversations:', convDeleteError);
        throw convDeleteError;
      }

      console.log(`✅ Deleted ${conversations.length} conversations`);

      console.log(`🎉 Successfully deleted ALL chats for user ${userId}: ${conversations.length} conversations, ${totalMessages} messages`);

      return {
        deletedConversations: conversations.length,
        deletedMessages: totalMessages
      };
    } catch (error) {
      console.error('Error in comprehensive chat deletion:', error);
      throw error;
    }
  }

  // Messages
  async getMessages(conversationId: number): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });
    
    if (error) {
      console.error('Error getting messages:', error);
      return [];
    }
    
    return data as Message[];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      // Check for duplicate messages first
      if (message.whatsapp_message_id) {
        const { data: existingMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', message.conversation_id)
          .eq('whatsapp_message_id', message.whatsapp_message_id)
          .single();

        if (existingMessage) {
          console.log(`📨 Message already exists with whatsapp_message_id: ${message.whatsapp_message_id}`);
          return existingMessage as Message;
        }
      }

      // Also check for content-based duplicates (for messages without whatsapp_message_id)
      const { data: contentDuplicate } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', message.conversation_id)
        .eq('content', message.content)
        .eq('direction', message.direction)
        .eq('timestamp', message.timestamp)
        .single();

      if (contentDuplicate) {
        console.log(`📨 Duplicate message found based on content and timestamp`);
        return contentDuplicate as Message;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([message])
        .select()
        .single();

      if (error) {
        console.error('Error creating message:', error);

        // Handle missing columns by removing them and trying again
        if (error.code === 'PGRST204') {
          console.warn(`Column missing error: ${error.message}`);

          // Create a copy of the message without any problematic columns
          const messageCopy = { ...message };

          // Remove columns that might be missing based on error message
          if (error.message.includes('whatsapp_number_id')) {
            delete messageCopy.whatsapp_number_id;
            delete messageCopy.whatsapp_message_id;
          }

          if (error.message.includes('media_type')) {
            delete messageCopy.media_type;
            delete messageCopy.media_size;
            delete messageCopy.media_filename;
          }

          console.log('Trying to create message without problematic columns:',
            Object.keys(messageCopy));

          const { data: fallbackData, error: fallbackError } = await supabase
            .from('messages')
            .insert([messageCopy])
            .select()
            .single();

          if (fallbackError) {
            console.error('Fallback error creating message:', fallbackError);
            throw fallbackError;
          }

          console.log('Successfully created message with fallback approach');
          return fallbackData as Message;
        }

        throw error;
      }

      return data as Message;
    } catch (error) {
      console.error('Error in createMessage:', error);
      throw error;
    }
  }

  async updateMessageStatus(messageId: string, status: string): Promise<void> {
    const updateData: any = { status };
    
    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    } else if (status === 'read') {
      updateData.read_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('messages')
      .update(updateData)
      .eq('message_id', messageId);
    
    if (error) {
      console.error('Error updating message status:', error);
      throw error;
    }
  }

  async markMessagesAsRead(conversationId: number): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('conversation_id', conversationId)
      .eq('direction', 'incoming');

    if (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  async updateMessageByWhatsAppId(whatsappMessageId: string, updates: Partial<Message>): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update(updates)
        .eq('whatsapp_message_id', whatsappMessageId);

      if (error) {
        console.error('Error updating message by WhatsApp ID:', error);
        // If the column doesn't exist, log but don't throw
        if (error.code === '42703') {
          console.warn('whatsapp_message_id column does not exist, skipping update');
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error in updateMessageByWhatsAppId:', error);
      // Don't throw if it's a column missing error
      if (error.code !== '42703') {
        throw error;
      }
    }
  }

  // Anti-blocking settings
  async getAntiBlockingSettings(userId: string): Promise<AntiBlockingSettings | undefined> {
    const { data, error } = await supabase
      .from('anti_blocking_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        return undefined;
      }
      console.error('Error getting anti-blocking settings:', error);
      return undefined;
    }
    
    return data as AntiBlockingSettings;
  }

  async upsertAntiBlockingSettings(settings: InsertAntiBlockingSettings & { userId: string }): Promise<AntiBlockingSettings> {
    const { data, error } = await supabase
      .from('anti_blocking_settings')
      .upsert([{
        user_id: settings.userId,
        enable_message_delays: settings.enableMessageDelays,
        enable_typing_simulation: settings.enableTypingSimulation,
        enable_auto_rotation: settings.enableAutoRotation,
        message_delay_min: settings.messageDelayMin,
        message_delay_max: settings.messageDelayMax,
        daily_message_limit: settings.dailyMessageLimit,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error upserting anti-blocking settings:', error);
      throw error;
    }
    
    return data as AntiBlockingSettings;
  }

  // Chatbot settings
  async getChatbotSettings(userId: string): Promise<ChatbotSettings | undefined> {
    const { data, error } = await supabase
      .from('chatbot_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        return undefined;
      }
      console.error('Error getting chatbot settings:', error);
      return undefined;
    }
    
    return data as ChatbotSettings;
  }

  async createChatbotSettings(settingsData: InsertChatbotSettings & { userId: string }): Promise<ChatbotSettings> {
    const { data, error } = await supabase
      .from('chatbot_settings')
      .insert([{
        user_id: settingsData.userId,
        enabled: settingsData.enabled,
        business_name: settingsData.business_name,
        custom_instructions: settingsData.custom_instructions,
        auto_reply_enabled: settingsData.auto_reply_enabled,
        sentiment_analysis_enabled: settingsData.sentiment_analysis_enabled,
        response_delay: settingsData.response_delay,
        max_response_length: settingsData.max_response_length,
        keyword_triggers: settingsData.keyword_triggers,
        ai_provider: settingsData.ai_provider,
        ai_model: settingsData.ai_model,
        custom_api_key: settingsData.custom_api_key,
        temperature: settingsData.temperature,
        max_tokens: settingsData.max_tokens
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating chatbot settings:', error);
      throw error;
    }
    
    return data as ChatbotSettings;
  }

  async upsertChatbotSettings(settingsData: InsertChatbotSettings & { userId: string }): Promise<ChatbotSettings> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { data, error } = await supabase
      .from('chatbot_settings')
      .upsert([{
        user_id: settingsData.userId,
        enabled: settingsData.enabled,
        business_name: settingsData.business_name,
        custom_instructions: settingsData.custom_instructions,
        auto_reply_enabled: settingsData.auto_reply_enabled,
        sentiment_analysis_enabled: settingsData.sentiment_analysis_enabled,
        response_delay: settingsData.response_delay,
        max_response_length: settingsData.max_response_length,
        keyword_triggers: settingsData.keyword_triggers,
        ai_provider: settingsData.ai_provider,
        ai_model: settingsData.ai_model,
        custom_api_key: settingsData.custom_api_key,
        temperature: settingsData.temperature,
        max_tokens: settingsData.max_tokens,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error upserting chatbot settings:', error);
      throw error;
    }
    
    return data as ChatbotSettings;
  }

  // Dashboard stats
  async getDashboardStats(userId: string): Promise<{
    totalSent: number;
    totalDelivered: number;
    readRate: number;
    activeNumbers: number;
    activeCampaigns: number;
    scheduledCampaigns: number;
    completedCampaigns: number;
    totalContacts: number;
    activeContacts: number;
    taggedContacts: number;
    blockedContacts: number;
  }> {
    // Get campaign stats
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { data: campaignStats, error: campaignError } = await supabase
      .from('campaigns')
      .select('status, messages_sent, messages_delivered, messages_read')
      .eq('user_id', userId);
    
    if (campaignError) {
      console.error('Error getting campaign stats:', campaignError);
      return {
        totalSent: 0,
        totalDelivered: 0,
        readRate: 0,
        activeNumbers: 0,
        activeCampaigns: 0,
        scheduledCampaigns: 0,
        completedCampaigns: 0,
        totalContacts: 0,
        activeContacts: 0,
        taggedContacts: 0,
        blockedContacts: 0
      };
    }
    
    // Get WhatsApp numbers stats
    const { data: numbersData, error: numbersError } = await supabase!
      .from('whatsapp_numbers')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (numbersError) {
      console.error('Error getting WhatsApp numbers stats:', numbersError);
    }
    
    // Get contacts stats
    const { data: contactsData, error: contactsError } = await supabase!
      .from('contacts')
      .select('id, status, tags')
      .eq('user_id', userId);
    
    if (contactsError) {
      console.error('Error getting contacts stats:', contactsError);
    }
    
    // Calculate stats
    const totalSent = campaignStats?.reduce((sum, campaign) => sum + (campaign.messages_sent || 0), 0) || 0;
    const totalDelivered = campaignStats?.reduce((sum, campaign) => sum + (campaign.messages_delivered || 0), 0) || 0;
    const totalRead = campaignStats?.reduce((sum, campaign) => sum + (campaign.messages_read || 0), 0) || 0;
    const readRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0;
    
    const activeCampaigns = campaignStats?.filter(c => c.status === 'active').length || 0;
    const scheduledCampaigns = campaignStats?.filter(c => c.status === 'scheduled').length || 0;
    const completedCampaigns = campaignStats?.filter(c => c.status === 'completed').length || 0;
    
    const totalContacts = contactsData?.length || 0;
    const activeContacts = contactsData?.filter(c => c.status === 'active').length || 0;
    const taggedContacts = contactsData?.filter(c => c.tags && (c.tags as string[]).length > 0).length || 0;
    const blockedContacts = contactsData?.filter(c => c.status === 'blocked').length || 0;
    
    return {
      totalSent,
      totalDelivered,
      readRate: Math.round(readRate),
      activeNumbers: numbersData?.length || 0,
      activeCampaigns,
      scheduledCampaigns,
      completedCampaigns,
      totalContacts,
      activeContacts,
      taggedContacts,
      blockedContacts
    };
  }

  // File upload method - using local storage for now
  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'media');
      await fs.mkdir(uploadsDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Write file to disk
      await fs.writeFile(filePath, file.buffer);

      // Return the full local file path for WhatsApp service
      console.log(`✅ File uploaded successfully: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export a singleton instance
export const supabaseStorage = new SupabaseStorage();