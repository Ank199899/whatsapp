import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ContactRow {
  name: string;
  phone: string;
  email?: string;
  tags?: string;
  notes?: string;
  status?: 'pending' | 'success' | 'error';
  error?: string;
}

interface BulkUploadProps {
  onSuccess: () => void;
}

export default function BulkUpload({ onSuccess }: BulkUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const uploadContactsMutation = useMutation({
    mutationFn: async (contactsData: ContactRow[]) => {
      const results: ContactRow[] = [];
      setIsUploading(true);
      setUploadProgress(0);

      for (let i = 0; i < contactsData.length; i++) {
        const contact = contactsData[i];
        try {
          // Format phone number for Indian format
          let phoneNumber = contact.phone.replace(/\D/g, '');
          if (phoneNumber.length === 10) {
            phoneNumber = '+91' + phoneNumber;
          } else if (phoneNumber.length === 12 && phoneNumber.startsWith('91')) {
            phoneNumber = '+' + phoneNumber;
          } else if (!phoneNumber.startsWith('+')) {
            phoneNumber = '+' + phoneNumber;
          }

          const payload = {
            name: contact.name.trim(),
            phone: phoneNumber,
            email: contact.email?.trim() || null,
            tags: contact.tags ? contact.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
            notes: contact.notes?.trim() || "",
          };

          const response = await fetch("/api/contacts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            results.push({ ...contact, status: 'success' });
          } else {
            const errorData = await response.text();
            results.push({ 
              ...contact, 
              status: 'error', 
              error: `HTTP ${response.status}: ${errorData}` 
            });
          }
        } catch (error: any) {
          results.push({ 
            ...contact, 
            status: 'error', 
            error: error.message 
          });
        }

        setUploadProgress(((i + 1) / contactsData.length) * 100);
      }

      setIsUploading(false);
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      
      toast({
        title: "Bulk upload completed",
        description: `${successCount} contacts added successfully. ${errorCount} failed.`,
      });

      setContacts(results);
    },
    onError: (error: any) => {
      setIsUploading(false);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload contacts.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          toast({
            title: "Empty file",
            description: "The uploaded file is empty.",
            variant: "destructive",
          });
          return;
        }

        // Parse CSV
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIndex = headers.findIndex(h => h.includes('name'));
        const phoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('mobile'));
        const emailIndex = headers.findIndex(h => h.includes('email'));
        const tagsIndex = headers.findIndex(h => h.includes('tag'));
        const notesIndex = headers.findIndex(h => h.includes('note'));

        if (nameIndex === -1 || phoneIndex === -1) {
          toast({
            title: "Invalid format",
            description: "CSV must contain 'name' and 'phone' columns.",
            variant: "destructive",
          });
          return;
        }

        const parsedContacts: ContactRow[] = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          return {
            name: values[nameIndex] || '',
            phone: values[phoneIndex] || '',
            email: emailIndex !== -1 ? values[emailIndex] : '',
            tags: tagsIndex !== -1 ? values[tagsIndex] : '',
            notes: notesIndex !== -1 ? values[notesIndex] : '',
            status: 'pending' as const,
          };
        }).filter(contact => contact.name && contact.phone);

        setContacts(parsedContacts);
        setUploadProgress(0);
      } catch (error) {
        toast({
          title: "Parse error",
          description: "Failed to parse the CSV file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csvContent = "name,phone,email,tags,notes\nJohn Doe,9876543210,john@example.com,customer,Important client\nJane Smith,9876543211,jane@example.com,lead,Follow up needed";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = () => {
    if (contacts.length === 0) {
      toast({
        title: "No contacts",
        description: "Please upload a CSV file with contacts first.",
        variant: "destructive",
      });
      return;
    }
    uploadContactsMutation.mutate(contacts);
  };

  const successCount = contacts.filter(c => c.status === 'success').length;
  const errorCount = contacts.filter(c => c.status === 'error').length;
  const pendingCount = contacts.filter(c => c.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Upload a CSV file with columns: name, phone, email (optional), tags (optional), notes (optional).
          Phone numbers should be in Indian format (10 digits without country code).
        </AlertDescription>
      </Alert>

      {/* File upload section */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="mt-1"
            />
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>

        {contacts.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {contacts.length} contacts loaded
              {successCount > 0 && ` • ${successCount} uploaded`}
              {errorCount > 0 && ` • ${errorCount} failed`}
            </div>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading || pendingCount === 0}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload Contacts"}
            </Button>
          </div>
        )}

        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading contacts...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}
      </div>

      {/* Preview table */}
      {contacts.length > 0 && (
        <div className="border rounded-lg max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {contact.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {contact.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                    {contact.status === 'pending' && <FileText className="h-4 w-4 text-gray-400" />}
                  </TableCell>
                  <TableCell>{contact.name}</TableCell>
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell>{contact.email || '-'}</TableCell>
                  <TableCell>{contact.tags || '-'}</TableCell>
                  <TableCell className="max-w-32 truncate">{contact.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Results summary */}
      {(successCount > 0 || errorCount > 0) && (
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setContacts([])}>
            Clear
          </Button>
          <Button onClick={onSuccess}>
            Done
          </Button>
        </div>
      )}
    </div>
  );
}
