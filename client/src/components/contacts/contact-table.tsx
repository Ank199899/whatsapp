import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Edit, Trash2, MessageCircle, Phone, Mail, Plus, Upload, Ban, Shield, Bot, BotOff, UserX, UserCheck } from "lucide-react";
import ContactForm from "./contact-form";
import BulkUpload from "./bulk-upload";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  notes?: string;
  isBlocked?: boolean;
  aiAgentActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Helper function to format date/time in Indian format
const formatIndianDateTime = (dateString: string | Date | null | undefined) => {
  // Handle all possible falsy values
  if (!dateString ||
      dateString === 'undefined' ||
      dateString === 'null' ||
      dateString === null ||
      dateString === undefined ||
      (typeof dateString === 'string' && dateString.trim() === '')) {
    return "-";
  }

  try {
    // Parse the date string
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateString);
      return "-";
    }

    // Format in Indian timezone (IST)
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return formatter.format(date);
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateString, 'Type:', typeof dateString);
    return "-";
  }
};

// Helper function to format date only in Indian format
const formatIndianDate = (dateString: string | Date | null | undefined) => {
  // Handle all possible falsy values
  if (!dateString ||
      dateString === 'undefined' ||
      dateString === 'null' ||
      dateString === null ||
      dateString === undefined ||
      (typeof dateString === 'string' && dateString.trim() === '')) {
    return "-";
  }

  try {
    // Parse the date string
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateString);
      return "-";
    }

    // Format in Indian timezone (IST) - date only
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    return formatter.format(date);
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateString, 'Type:', typeof dateString);
    return "-";
  }
};

export default function ContactTable() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Fetch contacts with real-time updates
  const { data: contacts = [], isLoading, error } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const response = await fetch("/api/contacts");
      if (!response.ok) {
        throw new Error("Failed to fetch contacts");
      }
      return response.json();
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time sync
  });



  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete contact");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contact deleted",
        description: "Contact has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete contact.",
        variant: "destructive",
      });
    },
  });

  // Block/Unblock contact mutation
  const toggleBlockMutation = useMutation({
    mutationFn: async ({ contactId, isBlocked }: { contactId: string; isBlocked: boolean }) => {
      console.log('📡 Making API call to block/unblock contact:', contactId, 'New blocked status:', !isBlocked);
      const response = await fetch(`/api/contacts/${contactId}/block`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isBlocked: !isBlocked }),
      });
      console.log('📡 API response status:', response.status, response.statusText);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error response:', errorText);
        throw new Error(`Failed to ${isBlocked ? 'unblock' : 'block'} contact`);
      }
      const result = await response.json();
      console.log('✅ API success response:', result);
      return result;
    },
    onSuccess: (_, { isBlocked }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: `Contact ${isBlocked ? 'unblocked' : 'blocked'}`,
        description: `Contact has been successfully ${isBlocked ? 'unblocked' : 'blocked'}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact status.",
        variant: "destructive",
      });
    },
  });

  // AI Agent toggle mutation with real-time sync
  const toggleAIAgentMutation = useMutation({
    mutationFn: async ({ contactId, aiAgentActive }: { contactId: string; aiAgentActive: boolean }) => {
      const response = await fetch(`/api/contacts/${contactId}/ai-agent`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ aiAgentActive: !aiAgentActive }),
      });
      if (!response.ok) {
        throw new Error(`Failed to ${aiAgentActive ? 'deactivate' : 'activate'} AI agent`);
      }

      // Real-time sync with AI agent section
      console.log('📡 Making API call to sync AI agent status with AI agents section');
      const aiAgentSyncResponse = await fetch('/api/ai-agents/sync', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactId,
          action: aiAgentActive ? 'deactivate' : 'activate',
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        }),
      });
      console.log('📡 AI agent sync response status:', aiAgentSyncResponse.status, aiAgentSyncResponse.statusText);

      return response.json();
    },
    onSuccess: (_, { aiAgentActive }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-agents"] }); // Sync with AI agents section
      toast({
        title: `AI Agent ${aiAgentActive ? 'deactivated' : 'activated'}`,
        description: `AI Agent has been ${aiAgentActive ? 'deactivated' : 'activated'} for this contact.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update AI agent status.",
        variant: "destructive",
      });
    },
  });

  // Filter contacts based on search and tag
  const filteredContacts = contacts.filter((contact: Contact) => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm) ||
                         contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || contact.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // Get all unique tags
  const allTags = Array.from(new Set(contacts.flatMap((contact: Contact) => contact.tags))).filter(Boolean) as string[];

  const handleDeleteContact = (contactId: string) => {
    console.log('🗑️ Delete button clicked for contact:', contactId);
    if (confirm("Are you sure you want to delete this contact?")) {
      console.log('✅ User confirmed delete action, calling mutation...');
      deleteContactMutation.mutate(contactId);
    } else {
      console.log('❌ User cancelled delete action');
    }
  };

  const handleToggleBlock = (contact: Contact) => {
    console.log('🔄 Block button clicked for contact:', contact.id, 'Current blocked status:', contact.isBlocked);
    const action = contact.isBlocked ? 'unblock' : 'block';
    if (confirm(`Are you sure you want to ${action} this contact?`)) {
      console.log('✅ User confirmed block action, calling mutation...');
      toggleBlockMutation.mutate({ contactId: contact.id, isBlocked: contact.isBlocked || false });
    } else {
      console.log('❌ User cancelled block action');
    }
  };

  const handleToggleAIAgent = (contact: Contact) => {
    console.log('🤖 AI Agent button clicked for contact:', contact.id, 'Current AI agent status:', contact.aiAgentActive);
    const action = contact.aiAgentActive ? 'deactivate' : 'activate';
    if (confirm(`Are you sure you want to ${action} AI Agent for this contact?`)) {
      console.log('✅ User confirmed AI agent action, calling mutation...');
      toggleAIAgentMutation.mutate({ contactId: contact.id, aiAgentActive: contact.aiAgentActive || false });
    } else {
      console.log('❌ User cancelled AI agent action');
    }
  };

  const handleSendMessage = (phone: string) => {
    console.log('💬 Message button clicked for phone:', phone);
    // Navigate to inbox with pre-filled phone number
    const cleanPhone = phone.replace(/[^\d+]/g, ''); // Clean phone number
    window.location.href = `/inbox?phone=${encodeURIComponent(cleanPhone)}`;
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_blank');
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading contacts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Error loading contacts</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="">All tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Upload Contacts</DialogTitle>
              </DialogHeader>
              <BulkUpload onSuccess={() => setIsBulkUploadOpen(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-contact-button">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
              </DialogHeader>
              <ContactForm onSuccess={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Contacts table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>AI Agent</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  {searchTerm || selectedTag ? "No contacts found matching your criteria." : "No contacts yet. Add your first contact!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact: Contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell>{contact.email || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={contact.isBlocked ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {contact.isBlocked ? "Blocked" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={contact.aiAgentActive ? "default" : "outline"}
                      className="text-xs"
                    >
                      {contact.aiAgentActive ? "AI Active" : "AI Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    <div className="flex flex-col">
                      <span>{formatIndianDate(contact.createdAt)}</span>
                      <span className="text-xs text-gray-400">
                        {formatIndianDateTime(contact.createdAt).split(' ').slice(1).join(' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    <div className="flex flex-col">
                      <span>{formatIndianDate(contact.updatedAt)}</span>
                      <span className="text-xs text-gray-400">
                        {formatIndianDateTime(contact.updatedAt).split(' ').slice(1).join(' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {/* Primary Actions */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          console.log('💬 Message button clicked for contact:', contact.name, contact.phone);
                          handleSendMessage(contact.phone);
                        }}
                        title="Send WhatsApp message"
                        disabled={contact.isBlocked}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>

                      {/* Block/Unblock Toggle */}
                      <Button
                        size="sm"
                        variant={contact.isBlocked ? "default" : "outline"}
                        onClick={() => handleToggleBlock(contact)}
                        title={contact.isBlocked ? "Unblock contact" : "Block contact"}
                        className={contact.isBlocked ? "bg-red-500 hover:bg-red-600" : ""}
                      >
                        {contact.isBlocked ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                      </Button>

                      {/* AI Agent Toggle */}
                      <Button
                        size="sm"
                        variant={contact.aiAgentActive ? "default" : "outline"}
                        onClick={() => handleToggleAIAgent(contact)}
                        title={contact.aiAgentActive ? "Deactivate AI Agent" : "Activate AI Agent"}
                        className={contact.aiAgentActive ? "bg-blue-500 hover:bg-blue-600" : ""}
                      >
                        {contact.aiAgentActive ? <Bot className="h-4 w-4" /> : <BotOff className="h-4 w-4" />}
                      </Button>

                      {/* More Actions Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingContact(contact)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Contact
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCall(contact.phone)}>
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </DropdownMenuItem>
                          {contact.email && (
                            <DropdownMenuItem onClick={() => handleEmail(contact.email!)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleToggleBlock(contact)}
                            className={contact.isBlocked ? "text-green-600" : "text-orange-600"}
                          >
                            {contact.isBlocked ? (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Unblock Contact
                              </>
                            ) : (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Block Contact
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleAIAgent(contact)}
                            className={contact.aiAgentActive ? "text-orange-600" : "text-blue-600"}
                          >
                            {contact.aiAgentActive ? (
                              <>
                                <BotOff className="h-4 w-4 mr-2" />
                                Deactivate AI Agent
                              </>
                            ) : (
                              <>
                                <Bot className="h-4 w-4 mr-2" />
                                Activate AI Agent
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteContact(contact.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Contact
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit contact dialog */}
      <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          {editingContact && (
            <ContactForm
              onSuccess={() => setEditingContact(null)}
              initialData={{
                name: editingContact.name,
                phoneNumber: editingContact.phone.replace('+91', ''),
                email: editingContact.email || "",
                notes: editingContact.notes || "",
                tags: editingContact.tags,
                isBlocked: editingContact.isBlocked || false,
                aiAgentActive: editingContact.aiAgentActive || false,
              }}
              isEdit={true}
              contactId={editingContact.id}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="text-sm text-gray-500">
        Showing {filteredContacts.length} of {contacts.length} contacts
      </div>
    </div>
  );
}
