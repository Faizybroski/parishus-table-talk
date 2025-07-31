import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  UserCheck,
  BarChart3,
  Shield,
  Crown,
  Bell,
  FileText,
  UtensilsCrossed
} from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();
  const { profile } = useProfile();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground shadow-md font-medium" 
      : "hover:bg-muted/50 hover:text-foreground transition-all duration-200";

  // Define navigation items based on role
  const getNavigationItems = () => {
    const baseItems = [
      { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
      { title: "Events", url: "/admin/events", icon: Calendar },
      { title: "Restaurants", url: "/admin/restaurants", icon: UtensilsCrossed },
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Crossed Paths", url: "/admin/crossed-paths", icon: Users },
      { title: "RSVPs", url: "/admin/rsvps", icon: UserCheck },
      { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
      { title: "Notifications", url: "/admin/notifications", icon: Bell },
      { title: "Reports", url: "/admin/reports", icon: FileText },
    ];

    // Add subscription items for all admins
    baseItems.push(
      { title: "Stripe Settings", url: "/admin/stripe-settings", icon: Settings },
      { title: "Subscription Plans", url: "/admin/subscription-plans", icon: Crown },
      { title: "User Subscriptions", url: "/admin/subscriptions", icon: Users }
    );

    // Super Admin gets additional items
    if (profile?.role === 'superadmin') {
      baseItems.push(
        { title: "Admin Management", url: "/admin/admin-management", icon: Shield },
        { title: "Global Settings", url: "/admin/settings", icon: Settings }
      );
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();
  const isExpanded = navigationItems.some((i) => isActive(i.url));

  return (
    <Sidebar className="border-r border-border/50 bg-card/50 backdrop-blur-sm">
      <SidebarContent className="py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center space-x-3 px-4 py-3 mb-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg mx-3">
            {profile?.role === 'superadmin' ? (
              <Crown className="h-5 w-5 text-primary" />
            ) : (
              <Shield className="h-5 w-5 text-primary" />
            )}
            <span className="font-semibold text-foreground">
              {profile?.role === 'superadmin' ? 'Super Admin' : 'Admin'} Panel
            </span>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-3">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => `
                        ${getNavCls({ isActive })}
                        flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium
                        ${isActive ? 'shadow-lg' : ''}
                      `}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;