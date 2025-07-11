import React from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ContactGroups from "@/components/contacts/contact-groups";

export default function ContactGroupsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Contact Groups" 
          subtitle="Organize your contacts into groups for better management"
          primaryAction={{
            label: "Create Group",
            onClick: () => {
              // This will be handled by the ContactGroups component
              const createButton = document.querySelector('[data-testid="create-group-button"]') as HTMLButtonElement;
              if (createButton) createButton.click();
            }
          }}
        />
        <main className="flex-1 overflow-auto p-6">
          <ContactGroups />
        </main>
      </div>
    </div>
  );
}
