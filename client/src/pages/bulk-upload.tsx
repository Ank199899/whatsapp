import React from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import BulkUpload from "@/components/contacts/bulk-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

export default function BulkUploadPage() {
  const [, setLocation] = useLocation();

  const handleSuccess = () => {
    setLocation("/contacts");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Bulk Upload Contacts" 
          subtitle="Import multiple contacts from CSV file"
          primaryAction={{
            label: "Back to Contacts",
            onClick: () => setLocation("/contacts")
          }}
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BulkUpload onSuccess={handleSuccess} />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
