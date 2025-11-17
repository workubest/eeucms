import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Plus,
  Users,
  Settings
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, resource: 'Complaints' },
  { title: 'Complaints', url: '/complaints', icon: FileText, resource: 'Complaints' },
  { title: 'New', url: '/complaints/new', icon: Plus, isCenter: true, resource: 'Complaints' },
  { title: 'Users', url: '/users', icon: Users, resource: 'Users' },
  { title: 'Settings', url: '/settings', icon: Settings, resource: 'Settings' }
];

export function MobileBottomNav() {
  const { user } = useAuth();
  const { canView } = usePermissions();

  const visibleNavItems = navItems.filter(item => canView(item.resource));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 md:hidden shadow-2xl">
      {/* Safe area padding for devices with home indicators */}
      <div className="pb-safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2 relative">
          {/* Background gradient for active states */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent pointer-events-none" />

          {visibleNavItems.map((item, index) => (
            <NavLink
              key={item.title}
              to={item.url}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center flex-1 h-full gap-1.5 transition-all duration-300 ease-out relative group',
                  'active:scale-95 active:duration-75',
                  item.isCenter ? 'relative -mt-6' : '',
                  isActive
                    ? 'text-primary transform scale-110'
                    : 'text-muted-foreground hover:text-foreground hover:scale-105'
                )
              }
            >
              {/* Ripple effect background */}
              <div className={cn(
                'absolute inset-0 rounded-xl transition-all duration-300',
                'group-active:bg-primary/10 group-active:scale-110'
              )} />

              {item.isCenter ? (
                <>
                  {/* Floating Action Button style */}
                  <div className={cn(
                    'flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300',
                    'bg-gradient-to-br from-eeu-orange to-eeu-orange/80 border-2 border-white/20',
                    'group-hover:shadow-xl group-hover:scale-105 group-active:scale-95',
                    'relative z-10'
                  )}>
                    <item.icon className="h-7 w-7 text-white drop-shadow-sm" />
                    {/* Pulse animation for FAB */}
                    <div className="absolute inset-0 rounded-full bg-eeu-orange/30 animate-ping" />
                  </div>
                  <span className="text-xs font-medium text-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {item.title}
                  </span>
                </>
              ) : (
                <>
                  {/* Icon with background for active state */}
                  <div className={cn(
                    'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300',
                    'group-hover:bg-primary/10 group-active:bg-primary/20'
                  )}>
                    <item.icon className={cn(
                      'h-6 w-6 transition-all duration-300',
                      'group-hover:scale-110'
                    )} />
                    {/* Active indicator dot */}
                    <div className={cn(
                      'absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-300',
                      'bg-primary scale-0 group-[.active]:scale-100'
                    )} />
                  </div>
                  <span className={cn(
                    'text-xs font-medium transition-all duration-300',
                    'group-hover:scale-105'
                  )}>
                    {item.title}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
