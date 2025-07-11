import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Send, Upload, FileText, MessageSquare, Clock, Target, X, CheckCircle } from "lucide-react";
import { GlassContainer, GradientText } from "@/components/ui/modern-effects";

const bulkMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
  whatsappNumberId: z.number().optional(),
  selectedContacts: z.array(z.number()).min(1, "Select at least one contact"),
  delayBetweenMessages: z.number().min(1).max(60).default(5),
  useTemplate: z.boolean().default(false),
  templateId: z.number().optional(),
});

type BulkMessageFormData = z.infer<typeof bulkMessageSchema>;

interface BulkMessageProps {
  onClose?: () => void;
}

export default function BulkMessage({ onClose }: BulkMessageProps) {
  const { toast } = useToast();
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/contacts"],
    retry: false,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["/api/templates"],
    retry: false,
  });

  const { data: whatsappNumbers = [] } = useQuery({
    queryKey: ["/api/whatsapp-numbers"],
    retry: false,
  });

  const form = useForm<BulkMessageFormData>({
    resolver: zodResolver(bulkMessageSchema),
    defaultValues: {
      message: "",
      selectedContacts: [],
      delayBetweenMessages: 5,
      useTemplate: false,
    },
  });

  const bulkMessageMutation = useMutation({
    mutationFn: async (data: BulkMessageFormData) => {
      const response = await apiRequest("POST", "/api/messages/send-bulk", {
        ...data,
        selectedContacts: selectedContactIds,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      
      toast({
        title: "Bulk Messages Queued",
        description: `Messages have been queued for ${selectedContactIds.length} contacts.`,
      });
      form.reset();
      setSelectedContactIds([]);
      onClose?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send bulk messages. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleContactToggle = (contactId: number) => {
    setSelectedContactIds(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds((contacts as any[]).map((contact: any) => contact.id));
    }
    setSelectAll(!selectAll);
  };

  const onSubmit = (data: BulkMessageFormData) => {
    if (selectedContactIds.length === 0) {
      toast({
        title: "No Contacts Selected",
        description: "Please select at least one contact to send messages to.",
        variant: "destructive",
      });
      return;
    }

    bulkMessageMutation.mutate({
      ...data,
      selectedContacts: selectedContactIds,
    });
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      <GlassContainer className="border border-border/50 bg-card/90 backdrop-blur-md">
        <div className="flex items-center justify-between p-6 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <GradientText className="text-xl font-bold">Send Bulk Messages</GradientText>
              <p className="text-sm text-muted-foreground">Send messages to multiple contacts at once</p>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:scale-110 transition-all duration-300 rounded-xl"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* WhatsApp Number Selection */}
              <FormField
                control={form.control}
                name="whatsappNumberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      From WhatsApp Number
                    </FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                      <FormControl>
                        <SelectTrigger className="bg-background/80 backdrop-blur-sm border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all duration-300">
                          <SelectValue placeholder="Select WhatsApp number" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card/90 backdrop-blur-md border-border/50 rounded-xl">
                        {(whatsappNumbers as any[]).map((number: any) => (
                          <SelectItem key={number.id} value={number.id.toString()} className="rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="font-medium">{number.phoneNumber} - {number.displayName || 'Unnamed'}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            {/* Template Selection */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="useTemplate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Use Template</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("useTemplate") && (
                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Template</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(templates as any[]).map((template: any) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Message Content */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Type your message here..." 
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Delay Setting */}
            <FormField
              control={form.control}
              name="delayBetweenMessages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delay Between Messages (seconds)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      max="60" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Select Contacts</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectAll ? "Deselect All" : "Select All"}
                </Button>
              </div>
              
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                {contactsLoading ? (
                  <div className="text-center py-4">Loading contacts...</div>
                ) : (contacts as any[]).length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No contacts found. Add contacts first.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(contacts as any[]).map((contact: any) => (
                      <div key={contact.id} className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedContactIds.includes(contact.id)}
                          onCheckedChange={() => handleContactToggle(contact.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-sm text-gray-500">{contact.phone_number}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
                {selectedContactIds.length > 0 && (
                  <GlassContainer className="text-sm text-primary p-3 bg-primary/10 border border-primary/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-semibold">{selectedContactIds.length} contact(s) selected</span>
                    </div>
                  </GlassContainer>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={bulkMessageMutation.isPending || selectedContactIds.length === 0}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl py-3 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                >
                  {bulkMessageMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send to {selectedContactIds.length} Contact(s)
                    </>
                  )}
                </Button>
                {onClose && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="px-6 rounded-xl hover:scale-105 transition-all duration-300"
                  >
                    Cancel
                  </Button>
                )}
            </div>
          </form>
        </Form>
        </div>
      </GlassContainer>
    </div>
  );
}
