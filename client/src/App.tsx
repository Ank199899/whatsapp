import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-toggle";
import { BackgroundProvider, ProfessionalMouseBackground } from "@/components/ui/professional-mouse-background";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import Inbox from "@/pages/inbox";
import InboxDirect from "@/pages/inbox-direct";
import InboxStarred from "@/pages/inbox-starred";
import InboxArchived from "@/pages/inbox-archived";
import Campaigns from "@/pages/campaigns";
import Contacts from "@/pages/contacts";
import ContactGroups from "@/pages/contact-groups";
import AddContact from "@/pages/add-contact";
import BulkUpload from "@/pages/bulk-upload";
import Templates from "@/pages/templates";
import WhatsAppWebSetup from "@/pages/whatsapp-web-setup";
import Settings from "@/pages/settings";
import AdvancedAIAgents from "@/pages/ai-agents-new";

import FeaturesOverview from "@/pages/features-overview";
import LogoShowcase from "@/pages/logo-showcase";

// Import cute avatar styles
import "@/components/ui/cute-avatar.css";

function Router() {
  // Skip authentication entirely - go directly to dashboard
  return (
    <ProfessionalMouseBackground>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/inbox" component={Inbox} />
        <Route path="/inbox/direct" component={InboxDirect} />
        <Route path="/inbox/starred" component={InboxStarred} />
        <Route path="/inbox/archived" component={InboxArchived} />
        <Route path="/campaigns" component={Campaigns} />
        <Route path="/contacts" component={Contacts} />
        <Route path="/contacts/groups" component={ContactGroups} />
        <Route path="/contacts/add" component={AddContact} />
        <Route path="/contacts/bulk-upload" component={BulkUpload} />
        <Route path="/templates" component={Templates} />
        <Route path="/whatsapp" component={WhatsAppWebSetup} />
        <Route path="/whatsapp-web" component={WhatsAppWebSetup} />
        <Route path="/whatsapp-setup" component={WhatsAppWebSetup} />
        <Route path="/ai-agents" component={AdvancedAIAgents} />
        <Route path="/features" component={FeaturesOverview} />
        <Route path="/logo" component={LogoShowcase} />
        <Route path="/logo-showcase" component={LogoShowcase} />
        <Route path="/settings" component={Settings} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/landing" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    </ProfessionalMouseBackground>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BackgroundProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </BackgroundProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
