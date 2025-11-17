import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Bell,
  Settings,
  Users,
  Shield,
  ChevronDown,
  User
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
  SidebarFooter
} from '@/components/ui/sidebar';
import { useAuth } from '@/lib/auth-context';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import logo from '@/assets/eeu-logo.png';
import { usePermissions } from '@/hooks/use-permissions';

const mainNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Complaints', url: '/complaints', icon: FileText },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Reports', url: '/reports', icon: BarChart3 },
  { title: 'Notifications', url: '/notifications', icon: Bell }
];

const adminNavItems = [
  { title: 'Settings', url: '/settings', icon: Settings },
  { title: 'Users', url: '/users', icon: Users },
  { title: 'Permissions', url: '/permissions', icon: Shield }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();
  const { canView } = usePermissions();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');
  const isCollapsed = state === 'collapsed';

  const getNavClass = (active: boolean) =>
    active
      ? 'bg-primary text-primary-foreground font-medium hover:bg-primary hover:text-primary-foreground'
      : 'text-gray-700 hover:bg-muted/50 hover:text-gray-900';

  const isAdminSection = adminNavItems.some((item) => isActive(item.url));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-4 bg-gradient-to-r from-eeu-orange/5 to-eeu-green/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={logo} alt="EEU" className="h-12 w-12 flex-shrink-0 rounded-lg shadow-md border-2 border-eeu-orange/20" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-eeu-green rounded-full animate-pulse"></div>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-eeu-orange truncate drop-shadow-sm">Ethiopian Electric Utility</p>
              <p className="text-sm text-eeu-green font-medium truncate">Complaint Management System</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-base font-semibold text-eeu-orange px-2 py-2 flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12 px-3 rounded-lg transition-all duration-200 hover:bg-eeu-orange/10 hover:shadow-md">
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) => `${getNavClass(isActive)} ${isActive ? 'bg-gradient-to-r from-eeu-orange to-eeu-green text-white shadow-lg' : 'text-gray-700'}`}
                    >
                      <item.icon className="h-5 w-5 text-eeu-orange" />
                      {!isCollapsed && <span className="text-base font-medium text-gray-700">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - Always show for admin users */}
        {user?.role === 'admin' && (
          <Collapsible defaultOpen={isAdminSection} className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between text-base font-semibold text-eeu-orange px-2 py-2 hover:bg-eeu-orange/5 rounded-lg transition-colors">
                  <span className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Administration
                  </span>
                  <ChevronDown className="h-5 w-5 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {adminNavItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild className="h-12 px-3 rounded-lg transition-all duration-200 hover:bg-eeu-orange/10 hover:shadow-md">
                          <NavLink
                            to={item.url}
                            end
                            className={({ isActive }) => `${getNavClass(isActive)} ${isActive ? 'bg-gradient-to-r from-eeu-orange to-eeu-green text-white shadow-lg' : 'text-gray-700'}`}
                          >
                            <item.icon className="h-5 w-5 text-eeu-orange" />
                            {!isCollapsed && <span className="text-base font-medium text-gray-700">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t px-4 py-4 bg-gradient-to-r from-eeu-orange/5 to-eeu-green/5">
        {!isCollapsed && user && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-eeu-orange to-eeu-green rounded-full flex items-center justify-center text-white font-bold text-sm">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-eeu-orange truncate">{user.name}</p>
                <Badge variant="outline" className="text-sm bg-eeu-green/10 text-eeu-green border-eeu-green/20 font-medium">
                  {user.role}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
