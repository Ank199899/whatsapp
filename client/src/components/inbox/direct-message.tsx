import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Send, MessageSquare, X, Phone } from "lucide-react";
import { GlassContainer, GradientText } from "@/components/ui/modern-effects";

const directMessageSchema = z.object({
  whatsappNumberId: z.number().min(1, "Please select a WhatsApp number"),
  recipientPhone: z.string().min(10, "Phone number must be at least 10 digits").regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),
  message: z.string().min(1, "Message is required").max(4096, "Message too long"),
});

type DirectMessageFormData = z.infer<typeof directMessageSchema>;

interface DirectMessageProps {
  onClose?: () => void;
}

export default function DirectMessage({ onClose }: DirectMessageProps) {
  const { toast } = useToast();

  const { data: whatsappNumbers, isLoading: numbersLoading } = useQuery({
    queryKey: ["/api/whatsapp/numbers"],
    queryFn: () => fetch("/api/whatsapp/numbers", { credentials: 'include' }).then(res => res.json()),
    retry: false,
    refetchInterval: 5000, // Real-time sync
    staleTime: 0,
  });

  // Get active WhatsApp sessions for real-time data
  const { data: activeSessions } = useQuery({
    queryKey: ["/api/whatsapp/active-sessions"],
    refetchInterval: 5000, // Refresh every 5 seconds
    retry: false,
  });

  const form = useForm<DirectMessageFormData>({
    resolver: zodResolver(directMessageSchema),
    defaultValues: {
      recipientPhone: "",
      message: "",
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: DirectMessageFormData) => {
      const response = await apiRequest("POST", "/api/messages/send-direct", data);
      return response;
    },
    onSuccess: () => {
      // Refresh all data immediately
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-numbers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/active-sessions"] });
      
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
      form.reset();
      onClose?.();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DirectMessageFormData) => {
    // Ensure phone number starts with +
    const formattedPhone = data.recipientPhone.startsWith('+') 
      ? data.recipientPhone 
      : `+${data.recipientPhone}`;
    
    sendMessageMutation.mutate({
      ...data,
      recipientPhone: formattedPhone,
    });
  };

  // Combine stored numbers with active sessions for real-time status
  const availableNumbers = React.useMemo(() => {
    if (!Array.isArray(whatsappNumbers)) return [];

    // Get active session phone numbers if available
    const activePhones = activeSessions?.sessions?.map((session: any) => session.phoneNumber).filter(Boolean) || [];

    // Include numbers that are stored as connected OR have active sessions
    return whatsappNumbers.filter((number: any) =>
      number.status === "connected" ||
      number.status === "active" ||
      activePhones.includes(number.phone_number)
    ).map((number: any) => ({
      ...number,
      // Show real-time status with proper column names
      displayStatus: activePhones.includes(number.phone_number) ? 'Connected' : number.status || 'Unknown',
      isActive: activePhones.includes(number.phone_number),
      // Normalize the phone number display
      displayPhone: number.phone_number || 'Unknown Number',
      displayName: number.display_name || number.name || `WhatsApp ${number.id}`
    }));
  }, [whatsappNumbers, activeSessions]);

  return (
    <div className="relative">
      <GlassContainer className="border border-border/50 bg-card/90 backdrop-blur-md">
        <div className="flex items-center justify-between p-6 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <GradientText className="text-lg font-bold">Send Direct Message</GradientText>
              <p className="text-sm text-muted-foreground">Send a message to any WhatsApp number</p>
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="whatsappNumberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-foreground">From WhatsApp Number</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} disabled={numbersLoading}>
                      <FormControl>
                        <SelectTrigger className="bg-background/80 backdrop-blur-sm border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all duration-300">
                          <SelectValue placeholder={numbersLoading ? "Loading..." : "Select WhatsApp number"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card/90 backdrop-blur-md border-border/50 rounded-xl">
                        {availableNumbers.map((number: any) => (
                          <SelectItem key={number.id} value={number.id.toString()} className="rounded-lg">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{number.displayPhone} - {number.displayName}</span>
                              </div>
                              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                                number.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {number.displayStatus}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

              <FormField
                control={form.control}
                name="recipientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-foreground">To Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+91 98765 43210"
                        {...field}
                        className="bg-background/80 backdrop-blur-sm border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-foreground">Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Type your message here..."
                        rows={4}
                        {...field}
                        className="bg-background/80 backdrop-blur-sm border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all duration-300 resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={sendMessageMutation.isPending || availableNumbers.length === 0}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl py-3 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
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

              {availableNumbers.length === 0 && !numbersLoading && (
                <GlassContainer className="text-sm text-destructive p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
                  <p className="font-semibold">No active WhatsApp numbers available</p>
                  <p className="mt-1 text-muted-foreground">Please go to "WhatsApp Setup" and connect a number by scanning the QR code first.</p>
                </GlassContainer>
              )}
            </form>
          </Form>
        </div>
      </GlassContainer>
    </div>
  );
}