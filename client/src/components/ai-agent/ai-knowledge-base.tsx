import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Upload,
  Download,
  FileText,
  Globe,
  MessageSquare,
  Brain,
  Tag,
  Clock,
  Users,
  TrendingUp,
  Zap,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: 'faq' | 'document' | 'conversation' | 'manual';
  category: string;
  tags: string[];
  status: 'active' | 'draft' | 'archived';
  usage: {
    views: number;
    references: number;
    lastUsed: string;
  };
  metadata: {
    source?: string;
    author?: string;
    confidence?: number;
    language?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  color: string;
}

export default function AIKnowledgeBase() {
  const [activeTab, setActiveTab] = useState('knowledge');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'faq' as const,
    category: '',
    tags: [] as string[],
    status: 'active' as const
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch knowledge items
  const { data: knowledgeItems = [], isLoading } = useQuery({
    queryKey: ['/api/ai/knowledge', searchQuery, selectedCategory],
    queryFn: () => apiRequest('GET', `/api/ai/knowledge?search=${searchQuery}&category=${selectedCategory}`),
    refetchInterval: 30000,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/ai/knowledge/categories'],
    queryFn: () => apiRequest('GET', '/api/ai/knowledge/categories'),
  });

  // Create knowledge item mutation
  const createItemMutation = useMutation({
    mutationFn: (itemData: any) => apiRequest('POST', '/api/ai/knowledge', itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/knowledge'] });
      toast({
        title: "Knowledge Item Created",
        description: "Your knowledge item has been added successfully",
      });
      setIsCreating(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Item",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Update knowledge item mutation
  const updateItemMutation = useMutation({
    mutationFn: (data: { id: string; updates: any }) => 
      apiRequest('PATCH', `/api/ai/knowledge/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/knowledge'] });
      toast({
        title: "Knowledge Item Updated",
        description: "Your changes have been saved successfully",
      });
      setEditingItem(null);
      resetForm();
    },
  });

  // Delete knowledge item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/ai/knowledge/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/knowledge'] });
      toast({
        title: "Knowledge Item Deleted",
        description: "The item has been removed from the knowledge base",
      });
    },
  });

  // Sync knowledge mutation
  const syncKnowledgeMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/ai/knowledge/sync'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/knowledge'] });
      toast({
        title: "Knowledge Base Synced",
        description: "All knowledge items have been synchronized",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'faq',
      category: '',
      tags: [],
      status: 'active'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, updates: formData });
    } else {
      createItemMutation.mutate(formData);
    }
  };

  const handleEdit = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      type: item.type,
      category: item.category,
      tags: item.tags,
      status: item.status
    });
    setIsCreating(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'faq': return <MessageSquare className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'conversation': return <Users className="h-4 w-4" />;
      case 'manual': return <BookOpen className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredItems = knowledgeItems.filter((item: KnowledgeItem) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI Knowledge Base</h2>
          <p className="text-muted-foreground">Manage and organize AI training knowledge</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            onClick={() => syncKnowledgeMutation.mutate()}
            disabled={syncKnowledgeMutation.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Knowledge
          </Button>
        </div>
      </div>

      {/* Knowledge Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{knowledgeItems.length}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Tag className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {knowledgeItems.reduce((sum: number, item: KnowledgeItem) => sum + item.usage.views, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {knowledgeItems.filter((item: KnowledgeItem) => item.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">Active Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="knowledge">Knowledge Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search knowledge items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category: KnowledgeCategory) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item: KnowledgeItem) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(item.type)}
                      <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">{item.content}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{item.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.usage.views} views</span>
                    <span>{item.usage.references} references</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(item)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => deleteItemMutation.mutate(item.id)}
                      disabled={deleteItemMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Knowledge Items</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'No items match your search criteria' 
                    : 'Start building your AI knowledge base'}
                </p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Tag className="h-5 w-5" />
                <span>Knowledge Categories</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category: KnowledgeCategory) => (
                  <div key={category.id} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-4 h-4 rounded-full ${category.color}`} />
                      <h3 className="font-semibold">{category.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{category.itemCount} items</span>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Knowledge Base Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Most Viewed Items</h3>
                  <div className="space-y-2">
                    {knowledgeItems
                      .sort((a: KnowledgeItem, b: KnowledgeItem) => b.usage.views - a.usage.views)
                      .slice(0, 5)
                      .map((item: KnowledgeItem, index) => (
                        <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm truncate">{item.title}</span>
                          <Badge variant="secondary">{item.usage.views} views</Badge>
                        </div>
                      ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Most Referenced Items</h3>
                  <div className="space-y-2">
                    {knowledgeItems
                      .sort((a: KnowledgeItem, b: KnowledgeItem) => b.usage.references - a.usage.references)
                      .slice(0, 5)
                      .map((item: KnowledgeItem, index) => (
                        <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm truncate">{item.title}</span>
                          <Badge variant="secondary">{item.usage.references} refs</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Knowledge Item' : 'Create Knowledge Item'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter title"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="faq">FAQ</option>
                  <option value="document">Document</option>
                  <option value="conversation">Conversation</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter content"
                rows={6}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">Select category</option>
                  {categories.map((category: KnowledgeCategory) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createItemMutation.isPending || updateItemMutation.isPending}
              >
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
