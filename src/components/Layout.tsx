import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import logo from '@/assets/eeu-logo.png';
import NotificationCenter from './NotificationCenter';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { Footer } from './Footer';
import { Header } from './Header';
import { cn } from '@/lib/utils';

function LayoutContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toggleSidebar } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />

      <div className="flex-1 flex flex-col w-full relative">
        <Header onMenuClick={toggleSidebar} />

        {/* Main Content */}
        <main className={cn(
          'flex-1 overflow-auto transition-all duration-300',
          isMobile
            ? 'p-4 pb-24 pt-16' // Extra padding for mobile bottom nav and header
            : 'p-6 lg:p-8'
        )}>
          <div className={cn(
            'w-full max-w-full',
            isMobile && 'px-2' // Additional mobile padding
          )}>
            <Outlet />
          </div>
        </main>

        {!isMobile && <Footer />}
      </div>

      {isMobile && <MobileBottomNav />}
    </div>
  );
}

export default function Layout() {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
}
