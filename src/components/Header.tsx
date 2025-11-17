import { Bell, User, LogOut, Settings, Search, HelpCircle, Moon, Sun, Wifi, WifiOff, Battery, Clock, Menu, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFilter } from '@/contexts/FilterContext';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface HeaderProps {
  onMenuClick?: () => void;
}

interface Notification {
  read: boolean;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, userRole, logout } = useAuth();
  const { t } = useLanguage();
  const { isFilterEnabled, toggleFilter } = useFilter();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Fetch live notification count
    const fetchNotificationCount = async () => {
      try {
        if (!user?.id) return;

        // For now, set notifications to 0 since we don't have notifications in GAS yet
        // TODO: Implement notifications endpoint in GAS
        setNotifications(0);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications(0);
      }
    };

    // Initial fetch
    fetchNotificationCount();

    // Refresh notification count every 30 seconds
    const notificationInterval = setInterval(fetchNotificationCount, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(notificationInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/complaints?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // In a real app, this would update the theme context
    document.documentElement.classList.toggle('dark');
  };



  return (
    <header className="bg-card border-b border-border shadow-[var(--card-shadow)] sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-3">
            {/* Logo */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center group cursor-pointer relative">
              <div className="absolute inset-0 gradient-brand rounded-full blur-sm opacity-0 group-hover:opacity-20 transition-all duration-300"></div>
              
              <img 
                src="/eeu-logo-new.png" 
                alt="Ethiopian Electric Utility Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain transform group-hover:scale-105 transition-all duration-300 drop-shadow-md relative z-10"
              />
              
              <div className="absolute inset-0 border border-transparent border-t-primary/30 rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-spin transition-all duration-300"></div>
            </div>
            
            {/* Organization Text */}
            <div className="hidden sm:block">
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-eeu-orange drop-shadow-lg">
                  Ethiopian Electric Utility
                </h1>
                <p className="text-sm font-semibold text-eeu-green">
                  Complaint Management System
                </p>
              </div>
            </div>

            {/* Mobile Text */}
            <div className="sm:hidden">
              <div className="relative inline-block">
                <h1 className="text-sm font-bold text-eeu-orange drop-shadow-lg">
                  EEU
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
          {/* Enhanced Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center space-x-2">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-eeu-orange transition-colors duration-300" />
              <Input
                type="text"
                placeholder={t('common.search') + ' ' + t('nav.complaints').toLowerCase() + '...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-48 xl:w-64 h-10 border-2 border-gray-200 focus:border-eeu-orange focus:ring-2 focus:ring-eeu-orange/20 transition-all duration-300 rounded-lg bg-gray-50 focus:bg-white"
              />
              {searchQuery && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-eeu-green rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          </form>

          {/* Enhanced Mobile Search Button */}
          <Button
            variant="outline"
            size="icon"
            className="md:hidden h-10 w-10 border-2 border-gray-200 hover:border-eeu-orange hover:bg-eeu-orange/10 transition-all duration-300 rounded-lg group"
            onClick={() => navigate('/complaints')}
          >
            <Search className="h-4 w-4 text-gray-600 group-hover:text-eeu-orange transition-colors duration-300" />
          </Button>

          {/* Enhanced Language Switcher */}
          <div className="hidden sm:block">
            <div className="bg-gradient-to-r from-eeu-orange/10 to-eeu-green/10 p-1 rounded-lg border border-eeu-orange/20 hover:shadow-md transition-all duration-300">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Enhanced Theme Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="hidden sm:flex h-10 w-10 border-2 border-gray-200 hover:border-eeu-orange hover:bg-eeu-orange/10 transition-all duration-300 rounded-lg"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 text-eeu-orange" />
            ) : (
              <Moon className="h-4 w-4 text-gray-600 hover:text-eeu-orange" />
            )}
          </Button>

          {/* Global Filter Toggle */}
          <Select value={isFilterEnabled ? "on" : "off"} onValueChange={(value) => {
            if (value === "on" && !isFilterEnabled) {
              toggleFilter();
            } else if (value === "off" && isFilterEnabled) {
              toggleFilter();
            }
          }}>
            <SelectTrigger className="hidden sm:flex h-10 w-20 border-2 border-gray-200 hover:border-eeu-orange transition-all duration-300 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Off</SelectItem>
              <SelectItem value="on">On</SelectItem>
            </SelectContent>
          </Select>

          {/* Enhanced Notifications */}
          <Button
            variant="outline"
            size="icon"
            className="relative h-10 w-10 border-2 border-gray-200 hover:border-eeu-orange hover:bg-eeu-orange/10 transition-all duration-300 rounded-lg group"
            onClick={() => navigate('/dashboard/notifications')}
          >
            <Bell className="h-4 w-4 text-gray-600 group-hover:text-eeu-orange transition-colors duration-300" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce text-[10px] font-bold shadow-lg">
                {notifications > 99 ? '99+' : notifications}
              </span>
            )}
            {notifications > 0 && (
              <div className="absolute inset-0 rounded-lg bg-red-500/20 animate-ping"></div>
            )}
          </Button>

          {/* Enhanced User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-12 w-12 rounded-full hover:bg-eeu-orange/10 transition-all duration-300 group">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-transparent group-hover:border-eeu-orange transition-all duration-300">
                    <AvatarFallback className="bg-gradient-eeu text-gray-900 font-bold text-sm">
                      {(user?.name || '').split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online Status Indicator */}
                  <div className="absolute -bottom-0 -right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 border-2 border-gray-200 shadow-2xl rounded-xl" align="end" forceMount>
              <DropdownMenuLabel className="font-normal bg-gradient-to-r from-eeu-orange/10 to-eeu-green/10 rounded-t-lg">
                <div className="flex flex-col space-y-3 p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12 border-2 border-eeu-orange/20">
                      <AvatarFallback className="bg-gradient-eeu text-gray-900 font-bold text-lg">
                        {(user?.name || '').split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-base font-bold text-gray-900">{user?.name}</p>
                      <p className="text-sm text-gray-700 font-medium">{user?.email}</p>
                      <Badge variant="secondary" className="shadow-sm mt-1">
                        {userRole || 'User'}
                      </Badge>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-sm font-bold text-eeu-orange">Online</div>
                      <div className="text-xs text-gray-500">Status</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-eeu-green">{format(currentTime, 'HH:mm')}</div>
                      <div className="text-xs text-gray-500">Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-blue-600">{notifications}</div>
                      <div className="text-xs text-gray-500">Alerts</div>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-eeu-orange/10 transition-colors duration-200 rounded-lg mx-1">
                <User className="mr-3 h-4 w-4 text-eeu-orange" />
                <span className="font-medium">{t('nav.profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-eeu-green/10 transition-colors duration-200 rounded-lg mx-1">
                <Settings className="mr-3 h-4 w-4 text-eeu-green" />
                <span className="font-medium">{t('nav.settings')}</span>
              </DropdownMenuItem>

              {/* Quick Actions */}
              <DropdownMenuSeparator />
              <div className="px-2 py-1">
                <div className="text-xs font-semibold text-gray-500 mb-2">Quick Actions</div>
                <div className="grid grid-cols-2 gap-2">
                  <DropdownMenuItem className="hover:bg-blue-50 transition-colors duration-200 rounded-lg p-2 h-auto">
                    <div className="flex flex-col items-center space-y-1">
                      <Bell className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium">Alerts</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-green-50 transition-colors duration-200 rounded-lg p-2 h-auto">
                    <div className="flex flex-col items-center space-y-1">
                      <Search className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium">Search</span>
                    </div>
                  </DropdownMenuItem>
                </div>
              </div>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600 hover:bg-red-50 transition-colors duration-200 rounded-lg mx-1 font-medium">
                <LogOut className="mr-3 h-4 w-4" />
                <span>{t('nav.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
