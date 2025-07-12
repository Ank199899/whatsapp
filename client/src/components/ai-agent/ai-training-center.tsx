import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Brain,
  Upload,
  Download,
  Database,
  FileText,
  MessageSquare,
  TrendingUp,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  RefreshCw,
  Play,
  Pause,
  Settings,
  BookOpen,
  Users,
  Globe
} from "lucide-react";

interface TrainingData {
  id: string;
  name: string;
  type: 'conversations' | 'documents' | 'faq' | 'custom';
  source: string;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  accuracy?: number;
  createdAt: string;
}

interface TrainingJob {
  id: string;
  agentId: string;
  agentName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  dataPoints: number;
  accuracy: number;
  startedAt: string;
  completedAt?: string;
  logs: string[];
}

export default function AITrainingCenter() {
  const [activeTab, setActiveTab] = useState('datasets');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [trainingConfig, setTrainingConfig] = useState({
    epochs: 3,
    batchSize: 32,
    learningRate: 0.001,
    validationSplit: 0.2
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch training datasets
  const { data: datasets = [], isLoading: datasetsLoading } = useQuery({
    queryKey: ['/api/ai/training/datasets'],
    queryFn: () => apiRequest('GET', '/api/ai/training/datasets'),
    refetchInterval: 5000,
  });

  // Fetch training jobs
  const { data: trainingJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/ai/training/jobs'],
    queryFn: () => apiRequest('GET', '/api/ai/training/jobs'),
    refetchInterval: 3000,
  });

  // Fetch available agents
  const { data: agents = [] } = useQuery({
    queryKey: ['/api/ai/agents'],
    queryFn: () => apiRequest('GET', '/api/ai/agents'),
  });

  // Upload dataset mutation
  const uploadDatasetMutation = useMutation({
    mutationFn: (formData: FormData) => apiRequest('POST', '/api/ai/training/upload', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/training/datasets'] });
      toast({
        title: "Dataset Uploaded",
        description: "Your training dataset has been uploaded successfully",
      });
      setUploadingFile(false);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload dataset",
        variant: "destructive",
      });
      setUploadingFile(false);
    },
  });

  // Start training mutation
  const startTrainingMutation = useMutation({
    mutationFn: (data: { agentId: string; datasetIds: string[]; config: any }) =>
      apiRequest('POST', '/api/ai/training/start', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/training/jobs'] });
      toast({
        title: "Training Started",
        description: "AI agent training has been initiated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Training Failed",
        description: error.message || "Failed to start training",
        variant: "destructive",
      });
    },
  });

  // Auto-generate training data mutation
  const generateDataMutation = useMutation({
    mutationFn: (data: { type: string; source: string; count: number }) =>
      apiRequest('POST', '/api/ai/training/generate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/training/datasets'] });
      toast({
        title: "Training Data Generated",
        description: "AI has generated training data from your conversations",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'custom');
    formData.append('name', file.name);

    setUploadingFile(true);
    uploadDatasetMutation.mutate(formData);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running': case 'processing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': case 'processing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI Training Center</h2>
          <p className="text-muted-foreground">Train and improve your AI agents with custom data</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => generateDataMutation.mutate({ type: 'conversations', source: 'whatsapp', count: 1000 })}
            disabled={generateDataMutation.isPending}
            variant="outline"
          >
            <Zap className="h-4 w-4 mr-2" />
            Auto-Generate Data
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Dataset
          </Button>
        </div>
      </div>

      {/* Training Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{datasets.length}</p>
                <p className="text-sm text-muted-foreground">Datasets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{trainingJobs.filter((job: TrainingJob) => job.status === 'running').length}</p>
                <p className="text-sm text-muted-foreground">Active Training</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {trainingJobs.length > 0 ? 
                    Math.round(trainingJobs.reduce((sum: number, job: TrainingJob) => sum + job.accuracy, 0) / trainingJobs.length) 
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Avg Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {datasets.reduce((sum: number, dataset: TrainingData) => sum + dataset.size, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Data Points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="datasets">Datasets</TabsTrigger>
          <TabsTrigger value="training">Training Jobs</TabsTrigger>
          <TabsTrigger value="models">Model Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="datasets" className="space-y-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload Training Data</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="font-medium mb-1">Upload CSV/JSON</p>
                  <p className="text-sm text-muted-foreground mb-3">Structured conversation data</p>
                  <input
                    type="file"
                    accept=".csv,.json,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button asChild variant="outline" disabled={uploadingFile}>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {uploadingFile ? 'Uploading...' : 'Choose File'}
                    </label>
                  </Button>
                </div>

                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="font-medium mb-1">WhatsApp Conversations</p>
                  <p className="text-sm text-muted-foreground mb-3">Use existing chat data</p>
                  <Button 
                    variant="outline"
                    onClick={() => generateDataMutation.mutate({ type: 'conversations', source: 'whatsapp', count: 1000 })}
                    disabled={generateDataMutation.isPending}
                  >
                    {generateDataMutation.isPending ? 'Generating...' : 'Import Chats'}
                  </Button>
                </div>

                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="font-medium mb-1">Knowledge Base</p>
                  <p className="text-sm text-muted-foreground mb-3">FAQ and documentation</p>
                  <Button variant="outline">
                    Create FAQ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datasets List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Training Datasets</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {datasets.map((dataset: TrainingData) => (
                  <div key={dataset.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(dataset.status)}
                      <div>
                        <p className="font-medium">{dataset.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {dataset.size.toLocaleString()} data points • {dataset.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {dataset.accuracy && (
                        <Badge variant="secondary">{dataset.accuracy}% accuracy</Badge>
                      )}
                      <Badge variant="outline">{dataset.status}</Badge>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {datasets.length === 0 && (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-lg font-medium">No datasets yet</p>
                    <p className="text-muted-foreground">Upload your first training dataset to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          {/* Start Training */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="h-5 w-5" />
                <span>Start New Training</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Select Agent</Label>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an agent to train" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent: any) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name} ({agent.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Training Epochs</Label>
                  <Input
                    type="number"
                    value={trainingConfig.epochs}
                    onChange={(e) => setTrainingConfig({ ...trainingConfig, epochs: parseInt(e.target.value) })}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
              <Button 
                className="mt-4"
                onClick={() => {
                  if (!selectedAgent) {
                    toast({
                      title: "Select Agent",
                      description: "Please select an agent to train",
                      variant: "destructive",
                    });
                    return;
                  }
                  startTrainingMutation.mutate({
                    agentId: selectedAgent,
                    datasetIds: datasets.filter((d: TrainingData) => d.status === 'completed').map((d: TrainingData) => d.id),
                    config: trainingConfig
                  });
                }}
                disabled={startTrainingMutation.isPending || !selectedAgent}
              >
                {startTrainingMutation.isPending ? 'Starting...' : 'Start Training'}
              </Button>
            </CardContent>
          </Card>

          {/* Training Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>Training Jobs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingJobs.map((job: TrainingJob) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <p className="font-medium">{job.agentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {job.dataPoints.toLocaleString()} data points
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">{job.accuracy}% accuracy</Badge>
                        <Badge variant="outline">{job.status}</Badge>
                      </div>
                    </div>
                    
                    {job.status === 'running' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="h-2" />
                      </div>
                    )}
                    
                    <div className="flex justify-between text-xs text-muted-foreground mt-3">
                      <span>Started: {new Date(job.startedAt).toLocaleString()}</span>
                      {job.completedAt && (
                        <span>Completed: {new Date(job.completedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {trainingJobs.length === 0 && (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-lg font-medium">No training jobs</p>
                    <p className="text-muted-foreground">Start training your first AI agent</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Model Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent: any) => (
                  <div key={agent.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{agent.name}</h3>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Accuracy</span>
                        <span>{agent.training?.accuracy || 0}%</span>
                      </div>
                      <Progress value={agent.training?.accuracy || 0} className="h-2" />
                      
                      <div className="flex justify-between text-sm">
                        <span>Interactions</span>
                        <span>{agent.performance?.totalInteractions || 0}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Success Rate</span>
                        <span>{agent.performance?.successRate || 0}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Last trained: {agent.training?.lastTrained ? new Date(agent.training.lastTrained).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Training Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Default Epochs</Label>
                    <Input
                      type="number"
                      value={trainingConfig.epochs}
                      onChange={(e) => setTrainingConfig({ ...trainingConfig, epochs: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Batch Size</Label>
                    <Input
                      type="number"
                      value={trainingConfig.batchSize}
                      onChange={(e) => setTrainingConfig({ ...trainingConfig, batchSize: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Learning Rate</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={trainingConfig.learningRate}
                      onChange={(e) => setTrainingConfig({ ...trainingConfig, learningRate: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Validation Split</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={trainingConfig.validationSplit}
                      onChange={(e) => setTrainingConfig({ ...trainingConfig, validationSplit: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <Button className="mt-6">Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
