import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

// Contact form validation schema
const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number is too long"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  onSuccess: () => void;
  initialData?: Partial<ContactFormData & { tags: string[]; isBlocked?: boolean; aiAgentActive?: boolean }>;
  isEdit?: boolean;
  contactId?: string;
}

export default function ContactForm({ onSuccess, initialData, isEdit = false, contactId }: ContactFormProps) {
  const { toast } = useToast();
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [newTag, setNewTag] = useState("");
  const [isBlocked, setIsBlocked] = useState<boolean>(initialData?.isBlocked || false);
  const [aiAgentActive, setAiAgentActive] = useState<boolean>(initialData?.aiAgentActive || false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      phoneNumber: initialData?.phoneNumber || "",
      email: initialData?.email || "",
      notes: initialData?.notes || "",
    },
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      console.log("🔄 Creating/updating contact with data:", data);
      
      // Format phone number for Indian format
      let phoneNumber = data.phoneNumber.replace(/\D/g, '');
      if (phoneNumber.length === 10) {
        phoneNumber = '+91' + phoneNumber;
      } else if (phoneNumber.length === 12 && phoneNumber.startsWith('91')) {
        phoneNumber = '+' + phoneNumber;
      } else if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+' + phoneNumber;
      }
      
      const payload = {
        name: data.name.trim(),
        phone: phoneNumber,
        email: data.email?.trim() || null,
        tags: tags,
        notes: data.notes?.trim() || "",
        isBlocked: isBlocked,
        aiAgentActive: aiAgentActive,
      };
      
      console.log("📤 Sending payload:", payload);
      
      const url = isEdit ? `/api/contacts/${contactId}` : "/api/contacts";
      const method = isEdit ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("❌ API Error Response:", errorData);
        throw new Error(`Failed to ${isEdit ? 'update' : 'create'} contact: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("✅ Contact operation successful:", result);
      return result;
    },
    onSuccess: (result) => {
      console.log("🎉 Contact operation successful:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: isEdit ? "Contact updated" : "Contact created",
        description: `Contact has been successfully ${isEdit ? 'updated' : 'added'}.`,
      });
      form.reset();
      setTags([]);
      setIsBlocked(false);
      setAiAgentActive(false);
      onSuccess();
    },
    onError: (error: any) => {
      console.error("❌ Contact operation error:", error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEdit ? 'update' : 'create'} contact.`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ContactFormData) => {
    console.log("📝 Form submitted with data:", data);
    createContactMutation.mutate(data);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number *</FormLabel>
              <FormControl>
                <Input placeholder="9876543210" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags Section */}
        <div className="space-y-2">
          <FormLabel>Tags</FormLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button type="button" onClick={addTag} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any notes about this contact..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact Status */}
        <div className="space-y-2">
          <FormLabel>Contact Status</FormLabel>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isBlocked"
              checked={isBlocked}
              onChange={(e) => setIsBlocked(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isBlocked" className="text-sm">
              Block this contact (prevents messaging)
            </label>
          </div>
        </div>

        {/* AI Agent Status */}
        <div className="space-y-2">
          <FormLabel>AI Agent</FormLabel>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="aiAgentActive"
              checked={aiAgentActive}
              onChange={(e) => setAiAgentActive(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="aiAgentActive" className="text-sm">
              Activate AI Agent for this contact
            </label>
          </div>
          <p className="text-xs text-gray-500">
            AI Agent will automatically respond to messages from this contact
          </p>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={createContactMutation.isPending}>
            {createContactMutation.isPending 
              ? (isEdit ? "Updating..." : "Adding...") 
              : (isEdit ? "Update Contact" : "Add Contact")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
