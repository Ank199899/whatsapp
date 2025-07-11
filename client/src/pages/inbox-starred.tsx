import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, MessageSquare } from 'lucide-react';

export default function InboxStarred() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Star className="w-8 h-8 text-yellow-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Starred Messages</h1>
          <p className="text-gray-600">Important messages you've starred</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Starred Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-gray-500">
            <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No starred messages yet</p>
            <p className="text-sm mt-2">Star important messages to find them easily later</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
