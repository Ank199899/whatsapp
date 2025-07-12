import { useState, useEffect, createContext, useContext } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import WhatsProLogo from "@/components/ui/whatspro-logo";
import {
  BarChart,
  Inbox,
  Megaphone,
  Users,
  FileText,
  MessageCircle,
  Settings,
  Menu,
  X,
  Bot,
  Brain,
  ChevronDown,
  ChevronRight,
  UserPlus,
  Upload,
  UsersIcon,
  Contact,
  MessageSquare,
  Send,
  Archive
} from "lucide-react";

// Create context for sidebar state
const SidebarContext = createContext<{
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
}>({
  isVisible: true,
  setVisible: () => {},
});

export const useSidebarContext = () => useContext(SidebarContext);

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  {
    name: 'Contacts',
    href: '/contacts',
    icon: Users,
    hasSubmenu: true,
    submenu: [
      { name: 'All Contacts', href: '/contacts', icon: Contact },
      { name: 'Contact Groups', href: '/contacts/groups', icon: UsersIcon },
      { name: 'Add Contact', href: '/contacts/add', icon: UserPlus },
      { name: 'Bulk Upload', href: '/contacts/bulk-upload', icon: Upload },
    ]
  },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'WhatsApp Setup', href: '/whatsapp', icon: MessageCircle },
  { name: 'AI Agents', href: '/ai-agents', icon: Brain },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Contacts']); // Only Contacts expanded by default
  const [isVisible, setVisible] = useState(true);
  const { user } = useAuth();

  const { data: conversations } = useQuery({
    queryKey: ["/api/conversations"],
    retry: false,
  });

  const unreadCount = conversations?.filter((c: any) => c.unreadCount > 0).length || 0;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (href: string) => {
    setLocation(href);
    setIsMobileMenuOpen(false);
    // Auto-hide sidebar when navigating to a section
    setTimeout(() => {
      setVisible(false);
    }, 300);
  };

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isSubmenuExpanded = (menuName: string) => {
    return expandedMenus.includes(menuName);
  };

  const isActiveRoute = (href: string, submenu?: any[]) => {
    if (submenu) {
      return submenu.some(item => location === item.href) || location === href;
    }
    return location === href;
  };

  return (
    <SidebarContext.Provider value={{ isVisible, setVisible }}>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileMenu}
          className="bg-white shadow-lg"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar Toggle Button - Shows when sidebar is hidden */}
      {!isVisible && (
        <div className="fixed top-4 left-4 z-50 animate-bounce">
          <Button
            onClick={() => setVisible(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full h-12 w-12 p-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
            title="Show sidebar"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={toggleMobileMenu} />
      )}

      {/* Sidebar Container - This handles the width allocation */}
      <div className={cn(
        "transition-all duration-500 ease-in-out lg:relative lg:flex-shrink-0",
        isVisible ? "lg:w-64" : "lg:w-0"
      )}>
        {/* Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 sidebar-modern transform transition-all duration-500 ease-in-out shadow-modern-xl backdrop-blur-sm",
          "lg:absolute lg:inset-0 lg:z-auto lg:w-full",
          isVisible ? "translate-x-0" : "-translate-x-full",
          isMobileMenuOpen ? "translate-x-0" : (isVisible ? "translate-x-0" : "-translate-x-full")
        )}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center justify-between animate-fade-in">
              <div className="flex items-center space-x-3">
                <WhatsProLogo size={80} animated={true} />
              </div>
              {/* Hide Sidebar Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVisible(false)}
                className="h-8 w-8 p-0 hover:bg-primary/10"
                title="Hide sidebar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <nav className="p-4 space-y-2">
                {navigation.map((item, index) => {
              const isActive = isActiveRoute(item.href, item.submenu);
              const Icon = item.icon;
              const hasSubmenu = item.hasSubmenu && item.submenu;
              const isExpanded = hasSubmenu && isSubmenuExpanded(item.name);

              return (
                <div key={item.name} className="space-y-1 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-4 py-3 text-left transition-all duration-300 rounded-xl group relative overflow-hidden",
                      "hover:scale-105 hover:shadow-lg",
                      isActive
                        ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl"
                        : "text-foreground/70 hover:text-foreground hover:bg-accent/50 backdrop-blur-sm"
                    )}
                    onClick={() => {
                      if (hasSubmenu) {
                        toggleSubmenu(item.name);
                      } else {
                        handleNavigation(item.href);
                      }
                    }}
                  >
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                      isActive ? "bg-white" : "bg-primary"
                    )}></div>
                    <Icon className={cn(
                      "w-5 h-5 mr-3 transition-all duration-300 group-hover:scale-110",
                      isActive ? "text-primary-foreground" : "text-primary"
                    )} />
                    <span className="flex-1 font-medium">{item.name}</span>
                    {item.name === 'Inbox' && unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2 animate-bounce-in">
                        {unreadCount}
                      </Badge>
                    )}
                    {hasSubmenu && (
                      <div className="ml-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                        ) : (
                          <ChevronRight className="w-4 h-4 transition-transform duration-300" />
                        )}
                      </div>
                    )}
                  </Button>

                  {/* Submenu */}
                  {hasSubmenu && isExpanded && (
                    <div className="ml-6 space-y-1 animate-slide-up border-l border-border/30 pl-4">
                      {item.submenu.map((subItem, subIndex) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = location === subItem.href;

                        return (
                          <Button
                            key={subItem.name}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start px-3 py-2 text-left transition-all duration-300 text-sm rounded-lg group",
                              "hover:scale-105 hover:shadow-md",
                              isSubActive
                                ? "bg-primary/10 text-primary border-l-2 border-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                            )}
                            onClick={() => handleNavigation(subItem.href)}
                            style={{ animationDelay: `${(subIndex + 1) * 100}ms` }}
                          >
                            <SubIcon className={cn(
                              "w-4 h-4 mr-3 transition-all duration-300 group-hover:scale-110",
                              isSubActive ? "text-primary" : "text-muted-foreground"
                            )} />
                            <span className="font-medium">{subItem.name}</span>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
                })}
              </nav>
            </ScrollArea>
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-border/50 bg-gradient-to-r from-background to-background-secondary">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30 hover:shadow-lg transition-all duration-300 group">
              <Avatar className="ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || 'User'} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                  {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-300">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || 'User'
                  }
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || 'No email'}
                </p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
