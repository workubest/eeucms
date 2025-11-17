import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, User, FileText, Activity } from 'lucide-react';

interface Activity {
  id: string;
  action: string;
  userName: string;
  createdAt: string;
  ticketNumber?: string;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetchActivities();

    // For now, we'll poll for updates every 30 seconds since we don't have real-time from GAS
    const interval = setInterval(fetchActivities, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activities');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.success && data.data) {
        const activities: Activity[] = (data.data || []).map((item: any) => ({
          id: item.id,
          action: item.action,
          userName: item.userName || item.user_name,
          createdAt: item.createdAt || item.created_at,
          ticketNumber: item.ticketNumber || item.ticket_number
        }));
        setActivities(activities);
      } else {
        throw new Error(data.error || 'Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]); // Clear activities on error
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('created')) return 'default';
    if (action.includes('updated')) return 'secondary';
    if (action.includes('resolved')) return 'outline';
    return 'default';
  };

  return (
    <Card className="card-modern">
      <CardHeader className="border-b">
        <CardTitle className="text-xl flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ScrollArea className="h-96">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="rounded-full bg-primary/10 p-2.5">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{activity.userName}</p>
                      <Badge variant={getActionColor(activity.action)} className="text-xs">
                        {activity.action}
                      </Badge>
                    </div>
                    {activity.ticketNumber && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span className="font-mono">{activity.ticketNumber}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
