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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, Clock, Send, Users } from "lucide-react";

const scheduleMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
  recipientPhone: z.string().min(1, "Recipient phone is required"),
  whatsappNumberId: z.number().optional(),
  scheduledDate: z.string().min(1, "Date is required"),
  scheduledTime: z.string().min(1, "Time is required"),
  timezone: z.string().default("America/New_York"),
});

type ScheduleMessageFormData = z.infer<typeof scheduleMessageSchema>;

interface MessageSchedulerProps {
  onClose?: () => void;
}

export default function MessageScheduler({ onClose }: MessageSchedulerProps) {
  const { toast } = useToast();

  const { data: whatsappNumbers = [] } = useQuery({
    queryKey: ["/api/whatsapp-numbers"],
    retry: false,
  });

  const form = useForm<ScheduleMessageFormData>({
    resolver: zodResolver(scheduleMessageSchema),
    defaultValues: {
      message: "",
      recipientPhone: "",
      scheduledDate: "",
      scheduledTime: "",
      timezone: "America/New_York",
    },
  });

  const scheduleMessageMutation = useMutation({
    mutationFn: async (data: ScheduleMessageFormData) => {
      const scheduledDateTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
      
      const response = await apiRequest("POST", "/api/messages/schedule", {
        ...data,
        scheduledAt: scheduledDateTime.toISOString(),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      
      toast({
        title: "Message Scheduled",
        description: "Your message has been scheduled successfully.",
      });
      form.reset();
      onClose?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to schedule message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ScheduleMessageFormData) => {
    const scheduledDateTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
    const now = new Date();
    
    if (scheduledDateTime <= now) {
      toast({
        title: "Invalid Date/Time",
        description: "Please select a future date and time.",
        variant: "destructive",
      });
      return;
    }

    scheduleMessageMutation.mutate(data);
  };

  // Get current date and time for min values
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Schedule Message
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* WhatsApp Number Selection */}
            <FormField
              control={form.control}
              name="whatsappNumberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From WhatsApp Number</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select WhatsApp number" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {whatsappNumbers.map((number: any) => (
                        <SelectItem key={number.id} value={number.id.toString()}>
                          {number.phoneNumber} - {number.displayName || 'Unnamed'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recipient Phone */}
            <FormField
              control={form.control}
              name="recipientPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., +1234567890" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        min={currentDate}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Timezone */}
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview */}
            {form.watch("scheduledDate") && form.watch("scheduledTime") && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Schedule Preview</h4>
                <p className="text-sm text-blue-700">
                  Message will be sent on{" "}
                  <strong>
                    {new Date(`${form.watch("scheduledDate")}T${form.watch("scheduledTime")}`).toLocaleString()}
                  </strong>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={scheduleMessageMutation.isPending}
                className="flex-1"
              >
                {scheduleMessageMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Message
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
