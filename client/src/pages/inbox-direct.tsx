import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, MessageSquare } from 'lucide-react';
import DirectMessage from '@/components/inbox/direct-message';

export default function InboxDirect() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Send className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Direct Message</h1>
          <p className="text-gray-600">Send messages directly to any phone number</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Send New Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DirectMessage onClose={() => {}} />
        </CardContent>
      </Card>
    </div>
  );
}
