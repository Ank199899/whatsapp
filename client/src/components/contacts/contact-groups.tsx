import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Plus, Edit, Trash2, MessageCircle } from "lucide-react";

interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  contactIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

const groupFormSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100, "Name is too long"),
  description: z.string().optional().or(z.literal("")),
});

type GroupFormData = z.infer<typeof groupFormSchema>;

export default function ContactGroups() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const form = useForm<GroupFormData>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Fetch contact groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/contact-groups"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/contact-groups");
        if (!response.ok) {
          // If groups endpoint doesn't exist, return empty array
          return [];
        }
        return response.json();
      } catch (error) {
        console.error("Failed to fetch groups:", error);
        return [];
      }
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch all contacts for group management
  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const response = await fetch("/api/contacts");
      if (!response.ok) {
        throw new Error("Failed to fetch contacts");
      }
      return response.json();
    },
  });

  // Create/Update group mutation
  const saveGroupMutation = useMutation({
    mutationFn: async (data: GroupFormData & { contactIds?: string[] }) => {
      const payload = {
        name: data.name.trim(),
        description: data.description?.trim() || "",
        contactIds: data.contactIds || selectedContacts,
      };

      const url = editingGroup ? `/api/contact-groups/${editingGroup.id}` : "/api/contact-groups";
      const method = editingGroup ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingGroup ? 'update' : 'create'} group`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-groups"] });
      toast({
        title: editingGroup ? "Group updated" : "Group created",
        description: `Group has been successfully ${editingGroup ? 'updated' : 'created'}.`,
      });
      form.reset();
      setSelectedContacts([]);
      setIsCreateDialogOpen(false);
      setEditingGroup(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingGroup ? 'update' : 'create'} group.`,
        variant: "destructive",
      });
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await fetch(`/api/contact-groups/${groupId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-groups"] });
      toast({
        title: "Group deleted",
        description: "Group has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete group.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: GroupFormData) => {
    saveGroupMutation.mutate(data);
  };

  const handleEditGroup = (group: ContactGroup) => {
    setEditingGroup(group);
    setSelectedContacts(group.contactIds);
    form.setValue("name", group.name);
    form.setValue("description", group.description || "");
    setIsCreateDialogOpen(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm("Are you sure you want to delete this group?")) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const getGroupContacts = (contactIds: string[]) => {
    return contacts.filter((contact: Contact) => contactIds.includes(contact.id));
  };

  const handleSendGroupMessage = (group: ContactGroup) => {
    const groupContacts = getGroupContacts(group.contactIds);
    const phoneNumbers = groupContacts.map((contact: Contact) => contact.phone).join(',');
    window.location.href = `/inbox?phones=${encodeURIComponent(phoneNumbers)}&group=${encodeURIComponent(group.name)}`;
  };

  const closeDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingGroup(null);
    setSelectedContacts([]);
    form.reset();
  };

  if (groupsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading groups...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contact Groups</h2>
          <p className="text-gray-600">Organize contacts into groups for better management</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={closeDialog}>
          <DialogTrigger asChild>
            <Button data-testid="create-group-button">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? "Edit Group" : "Create New Group"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter group name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter group description..." 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contact selection */}
                <div className="space-y-2">
                  <FormLabel>Select Contacts</FormLabel>
                  <div className="border rounded-lg p-4 max-h-64 overflow-auto">
                    {contacts.length === 0 ? (
                      <p className="text-gray-500 text-center">No contacts available</p>
                    ) : (
                      <div className="space-y-2">
                        {contacts.map((contact: Contact) => (
                          <label key={contact.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedContacts.includes(contact.id)}
                              onChange={() => handleContactToggle(contact.id)}
                              className="rounded"
                            />
                            <span className="flex-1">{contact.name}</span>
                            <span className="text-sm text-gray-500">{contact.phone}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {selectedContacts.length} contact(s) selected
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveGroupMutation.isPending}>
                    {saveGroupMutation.isPending 
                      ? (editingGroup ? "Updating..." : "Creating...") 
                      : (editingGroup ? "Update Group" : "Create Group")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
            <p className="text-gray-500 mb-4">Create your first contact group to get started.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </div>
        ) : (
          groups.map((group: ContactGroup) => {
            const groupContacts = getGroupContacts(group.contactIds);
            return (
              <Card key={group.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      {group.description && (
                        <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditGroup(group)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {groupContacts.length} contact{groupContacts.length !== 1 ? 's' : ''}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => handleSendGroupMessage(group)}
                        disabled={groupContacts.length === 0}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                    </div>
                    
                    {groupContacts.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium mb-1">Contacts:</p>
                        <div className="space-y-1">
                          {groupContacts.slice(0, 3).map((contact: Contact) => (
                            <div key={contact.id} className="flex justify-between">
                              <span>{contact.name}</span>
                              <span className="text-gray-400">{contact.phone}</span>
                            </div>
                          ))}
                          {groupContacts.length > 3 && (
                            <p className="text-gray-400">
                              +{groupContacts.length - 3} more...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
