import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase, isSupabaseAvailable } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { toast } from '@/hooks/use-toast';
import { Bell, Check, Trash2, AlertCircle, Info, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  related_id?: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (user) {
      loadNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!isSupabaseAvailable) {
      // If Supabase is not available, show empty notifications
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedNotifications: Notification[] = (data || []).map(n => ({
        ...n,
        type: n.type as 'info' | 'success' | 'warning' | 'error'
      }));
      setNotifications(typedNotifications);
    } catch (error: any) {
      toast({
        title: 'Error loading notifications',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    if (!isSupabaseAvailable) return () => {};

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (id: string) => {
    if (!isSupabaseAvailable) {
      toast({
        title: 'Error',
        description: 'Notifications are not available without Supabase',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );

      toast({
        title: 'Marked as read',
        description: 'Notification marked as read'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const markAllAsRead = async () => {
    if (!isSupabaseAvailable) {
      toast({
        title: 'Error',
        description: 'Notifications are not available without Supabase',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));

      toast({
        title: 'Success',
        description: 'All notifications marked as read'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const deleteNotification = async (id: string) => {
    if (!isSupabaseAvailable) {
      toast({
        title: 'Error',
        description: 'Notifications are not available without Supabase',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== id));

      toast({
        title: 'Deleted',
        description: 'Notification deleted'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const filteredNotifications = notifications.filter(n =>
    filter === 'all' ? true : !n.read
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      success: 'default',
      warning: 'secondary',
      error: 'destructive',
      info: 'outline'
    };
    return <Badge variant={variants[type]}>{type}</Badge>;
  };

  if (loading) {
    return (
      <div className={cn('space-y-6', isMobile && 'space-y-4')}>
        <div>
          <h1 className={cn(
            'font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent',
            isMobile ? 'text-2xl' : 'text-3xl'
          )}>
            Notifications
          </h1>
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', isMobile && 'space-y-4')}>
      <div className={cn(
        'flex items-start justify-between gap-4',
        isMobile && 'flex-col items-stretch gap-3'
      )}>
        <div className="flex-1 min-w-0">
          <h1 className={cn(
            'font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent flex items-center gap-2',
            isMobile ? 'text-2xl' : 'text-3xl'
          )}>
            <Bell className={cn(
              isMobile ? 'h-6 w-6' : 'h-8 w-8'
            )} />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 animate-pulse">
                {unreadCount} new
              </Badge>
            )}
          </h1>
          <p className={cn(
            'text-muted-foreground',
            isMobile ? 'text-sm' : 'text-base'
          )}>
            Stay updated with system notifications
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={markAllAsRead}
            variant="outline"
            className={cn(
              'transition-all duration-200 active:scale-95',
              isMobile ? 'w-full h-9' : ''
            )}
          >
            <Check className="mr-2 h-4 w-4" />
            {isMobile ? 'Mark all read' : 'Mark all as read'}
          </Button>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList className={cn(
          'transition-all duration-200',
          isMobile && 'w-full h-12'
        )}>
          <TabsTrigger
            value="all"
            className={cn(
              'transition-all duration-200',
              isMobile && 'flex-1'
            )}
          >
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger
            value="unread"
            className={cn(
              'transition-all duration-200',
              isMobile && 'flex-1'
            )}
          >
            Unread ({unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className={cn(
          'space-y-4',
          isMobile ? 'mt-4' : 'mt-6'
        )}>
          {filteredNotifications.length === 0 ? (
            <Card className={cn(
              'transition-all duration-200',
              isMobile && 'shadow-lg'
            )}>
              <CardContent className={cn(
                'flex flex-col items-center justify-center',
                isMobile ? 'py-8' : 'py-12'
              )}>
                <Bell className={cn(
                  'text-muted-foreground mb-4',
                  isMobile ? 'h-10 w-10' : 'h-12 w-12'
                )} />
                <p className={cn(
                  'font-medium mb-2',
                  isMobile ? 'text-base' : 'text-lg'
                )}>
                  No notifications
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  {filter === 'unread' ? "You're all caught up!" : 'No notifications to display'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={cn(
                  'transition-all duration-200',
                  !notification.read ? 'border-l-4 border-l-primary shadow-md' : '',
                  isMobile && 'shadow-lg active:scale-[0.98]'
                )}
              >
                <CardContent className={cn(
                  'transition-all duration-200',
                  isMobile ? 'p-4' : 'pt-6'
                )}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {getIcon(notification.type)}
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={cn(
                            'font-semibold',
                            isMobile ? 'text-base' : 'text-lg'
                          )}>
                            {notification.title}
                          </h3>
                          {getTypeBadge(notification.type)}
                          {!notification.read && (
                            <Badge variant="outline" className="ml-auto animate-pulse">
                              Unread
                            </Badge>
                          )}
                        </div>
                        <p className={cn(
                          'text-muted-foreground',
                          isMobile ? 'text-sm' : 'text-sm'
                        )}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      'flex gap-2',
                      isMobile ? 'ml-2' : 'ml-4'
                    )}>
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                          className="transition-all duration-200 active:scale-95"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-destructive hover:text-destructive transition-all duration-200 active:scale-95"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
