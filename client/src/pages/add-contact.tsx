import React from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ContactForm from "@/components/contacts/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";

export default function AddContactPage() {
  const [, setLocation] = useLocation();

  const handleSuccess = () => {
    setLocation("/contacts");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Add New Contact" 
          subtitle="Add a new contact to your database"
          primaryAction={{
            label: "Back to Contacts",
            onClick: () => setLocation("/contacts")
          }}
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ContactForm onSuccess={handleSuccess} />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
