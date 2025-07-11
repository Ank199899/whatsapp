import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Archive, MessageSquare } from 'lucide-react';

export default function InboxArchived() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Archive className="w-8 h-8 text-gray-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Archived Messages</h1>
          <p className="text-gray-600">Conversations you've archived</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Archived Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-gray-500">
            <Archive className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No archived conversations</p>
            <p className="text-sm mt-2">Archive conversations to keep your inbox organized</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
