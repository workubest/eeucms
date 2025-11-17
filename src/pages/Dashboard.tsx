import { useAuth } from '@/lib/auth-context';
import { useFilter } from '@/contexts/FilterContext';
import { gasApi } from '@/lib/gas-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  FileText,
  Activity,
  Search,
  Filter,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import ActivityFeed from '@/components/ActivityFeed';
import StatCard from '@/components/StatCard';
import FilterPanel from '@/components/FilterPanel';
import { PageLoading } from '@/components/ui/loading';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const { isFilterEnabled } = useFilter();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [allComplaints, setAllComplaints] = useState<any[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDashboardData();

    // Poll for updates every 30 seconds since we don't have real-time from GAS
    const interval = setInterval(fetchDashboardData, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      }

      console.log('📊 DASHBOARD: Fetching dashboard data with optimized GAS client');

      // Use optimized GAS client with caching
      const response = await gasApi.getComplaints({
        limit: 100, // Fetch more data for better caching
        sort: 'created_at',
        order: 'desc'
      });

      if (response.success && response.data) {
        console.log('📊 DASHBOARD: Successfully fetched', response.data.length, 'complaints');

        const complaints = response.data.map((c: any) => ({
          id: c.id || c.ID,
          ticket_number: c.ticketNumber || c['Ticket Number'] || c.ticket_number,
          customer_name: c.customerName || c['Customer Name'] || c.customer_name,
          title: c.title || c.Title,
          status: c.status || c.Status,
          priority: c.priority || c.Priority,
          created_at: c.createdAt || c['Created At'] || c.created_at
        }));

        setAllComplaints(complaints);
        setRecentComplaints(complaints.slice(0, 5));

        // Cache was automatically handled by gasApi
        if (response.cached) {
          console.log('📊 DASHBOARD: Data served from cache');
        }
      } else {
        console.error('📊 DASHBOARD: Failed to fetch data:', response.error);
        throw new Error(response.error || 'Failed to fetch dashboard data');
      }
    } catch (error: any) {
      console.error('📊 DASHBOARD: Error fetching dashboard data:', error);

      // Show user-friendly error message
      if (error.message.includes('Network')) {
        console.log('📊 DASHBOARD: Network error - data will sync when online');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Memoized filtered complaints for performance
  const filteredComplaints = useMemo(() => {
    return allComplaints.filter(complaint => {
      const matchesSearch = complaint.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.customer_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || complaint.priority === priorityFilter;

      const matchesDateFrom = !dateFrom || new Date(complaint.created_at) >= new Date(dateFrom);
      const matchesDateTo = !dateTo || new Date(complaint.created_at) <= new Date(dateTo + 'T23:59:59');

      return matchesSearch && matchesStatus && matchesPriority && matchesDateFrom && matchesDateTo;
    });
  }, [allComplaints, searchQuery, statusFilter, priorityFilter, dateFrom, dateTo]);

  // Memoized stats calculation for performance
  const stats = useMemo(() => ({
    total: filteredComplaints.length,
    open: filteredComplaints.filter(c => c.status === 'open').length,
    inProgress: filteredComplaints.filter(c => c.status === 'in_progress').length,
    resolved: filteredComplaints.filter(c => c.status === 'resolved').length,
    critical: filteredComplaints.filter(c => c.priority === 'critical').length,
  }), [filteredComplaints]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "destructive",
      in_progress: "default",
      resolved: "secondary",
      closed: "outline"
    };
    return <Badge variant={variants[status] || "default"}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      critical: "destructive",
      high: "default",
      medium: "secondary",
      low: "outline"
    };
    return <Badge variant={variants[priority] || "default"}>{priority}</Badge>;
  };

  if (isLoading) {
    return (
      <PageLoading
        variant="dashboard"
        title="Loading Dashboard"
        subtitle="Fetching your complaint statistics and recent activity..."
      />
    );
  }

  return (
    <div className={cn('space-y-6', isMobile && 'space-y-4')}>
      {/* Header */}
      <div className={cn(
        'flex items-start justify-between gap-4',
        isMobile && 'flex-col items-stretch gap-3'
      )}>
        <div className="flex-1 min-w-0">
          <h1 className={cn(
            'font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent',
            isMobile ? 'text-2xl' : 'text-3xl'
          )}>
            Dashboard
          </h1>
          <p className={cn(
            'text-muted-foreground',
            isMobile ? 'text-sm' : 'text-base'
          )}>
            Overview of complaints and system activity
          </p>
        </div>
        <Button
          variant="outline"
          size={isMobile ? "sm" : "icon"}
          onClick={() => fetchDashboardData(true)}
          disabled={isRefreshing}
          className={cn(
            'transition-all duration-200 active:scale-95',
            isMobile && 'h-9 px-3'
          )}
          title="Refresh dashboard data"
        >
          <RefreshCw className={cn(
            'transition-transform duration-200',
            isRefreshing ? 'animate-spin' : '',
            isMobile ? 'h-4 w-4 mr-2' : 'h-4 w-4'
          )} />
          {isMobile && 'Refresh'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className={cn(
        'grid gap-4',
        isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'
      )}>
        <Card className={cn(
          'transition-all duration-200 active:scale-95',
          isMobile && 'shadow-lg hover:shadow-xl'
        )}>
          <CardContent className={cn(
            'transition-all duration-200',
            isMobile ? 'p-4' : 'pt-6'
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  'font-medium text-muted-foreground',
                  isMobile ? 'text-xs' : 'text-sm'
                )}>
                  Total Complaints
                </p>
                <p className={cn(
                  'font-bold',
                  isMobile ? 'text-xl' : 'text-2xl'
                )}>
                  {stats.total}
                </p>
              </div>
              <FileText className={cn(
                'text-muted-foreground',
                isMobile ? 'h-6 w-6' : 'h-8 w-8'
              )} />
            </div>
          </CardContent>
        </Card>
        <Card className={cn(
          'transition-all duration-200 active:scale-95',
          isMobile && 'shadow-lg hover:shadow-xl'
        )}>
          <CardContent className={cn(
            'transition-all duration-200',
            isMobile ? 'p-4' : 'pt-6'
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  'font-medium text-muted-foreground',
                  isMobile ? 'text-xs' : 'text-sm'
                )}>
                  Open
                </p>
                <p className={cn(
                  'font-bold text-orange-600',
                  isMobile ? 'text-xl' : 'text-2xl'
                )}>
                  {stats.open}
                </p>
              </div>
              <div className="h-3 w-3 rounded-full bg-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className={cn(
          'transition-all duration-200 active:scale-95',
          isMobile && 'shadow-lg hover:shadow-xl'
        )}>
          <CardContent className={cn(
            'transition-all duration-200',
            isMobile ? 'p-4' : 'pt-6'
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  'font-medium text-muted-foreground',
                  isMobile ? 'text-xs' : 'text-sm'
                )}>
                  In Progress
                </p>
                <p className={cn(
                  'font-bold text-blue-600',
                  isMobile ? 'text-xl' : 'text-2xl'
                )}>
                  {stats.inProgress}
                </p>
              </div>
              <div className="h-3 w-3 rounded-full bg-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className={cn(
          'transition-all duration-200 active:scale-95',
          isMobile && 'shadow-lg hover:shadow-xl'
        )}>
          <CardContent className={cn(
            'transition-all duration-200',
            isMobile ? 'p-4' : 'pt-6'
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  'font-medium text-muted-foreground',
                  isMobile ? 'text-xs' : 'text-sm'
                )}>
                  Resolved
                </p>
                <p className={cn(
                  'font-bold text-green-600',
                  isMobile ? 'text-xl' : 'text-2xl'
                )}>
                  {stats.resolved}
                </p>
              </div>
              <div className="h-3 w-3 rounded-full bg-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toggle Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          {showFilters ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {/* Filters - Conditionally rendered based on local toggle */}
      {showFilters && (
        <FilterPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={{
            status: statusFilter,
            priority: priorityFilter,
          }}
          onFilterChange={(key, value) => {
            if (key === 'status') setStatusFilter(value);
            if (key === 'priority') setPriorityFilter(value);
          }}
          filterOptions={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'open', label: 'Open' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'pending', label: 'Pending' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
              ],
            },
            {
              key: 'priority',
              label: 'Priority',
              options: [
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ],
            },
          ]}
          dateFilters={{
            from: dateFrom,
            to: dateTo,
            onFromChange: setDateFrom,
            onToChange: setDateTo,
          }}
          onClearAll={handleClearFilters}
          resultCount={filteredComplaints.length}
          totalCount={allComplaints.length}
        />
      )}

      {/* Recent Complaints List */}
      <Card className={cn(
        'transition-all duration-200',
        isMobile && 'shadow-lg'
      )}>
        <CardHeader className={cn(
          'transition-all duration-200',
          isMobile && 'pb-3'
        )}>
          <CardTitle className={cn(
            isMobile ? 'text-lg' : 'text-xl'
          )}>
            Recent Complaints ({filteredComplaints.length})
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(
          'transition-all duration-200',
          isMobile && 'p-4'
        )}>
          <div className="space-y-3">
            {filteredComplaints.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No complaints found</p>
              </div>
            ) : (
              filteredComplaints.slice(0, isMobile ? 5 : 10).map((complaint) => (
                <Card
                  key={complaint.id}
                  className={cn(
                    'transition-all duration-200 hover:shadow-md cursor-pointer',
                    isMobile && 'active:scale-[0.98] shadow-sm'
                  )}
                  onClick={() => navigate(`/complaints/${complaint.id}`)}
                >
                  <CardContent className={cn(
                    'transition-all duration-200',
                    isMobile ? 'p-4' : 'pt-6'
                  )}>
                    <div className={cn(
                      'flex items-start justify-between gap-3',
                      isMobile && 'flex-col gap-2'
                    )}>
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-semibold text-primary truncate">
                            {complaint.ticket_number}
                          </span>
                          {getStatusBadge(complaint.status)}
                          {getPriorityBadge(complaint.priority)}
                        </div>
                        <p className="text-sm font-medium truncate">
                          {complaint.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">{complaint.customer_name}</span>
                          <span>•</span>
                          <span className="whitespace-nowrap">
                            {new Date(complaint.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          {filteredComplaints.length > (isMobile ? 5 : 10) && (
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/complaints')}
              >
                View all complaints
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Critical Alert */}
      {stats.critical > 0 && (
        <Card className={cn(
          'border-l-4 border-l-destructive bg-gradient-to-r from-destructive/5 to-destructive/10',
          'shadow-lg hover:shadow-xl transition-all duration-300',
          isMobile && 'mx-2'
        )}>
          <CardContent className={cn(
            'transition-all duration-200',
            isMobile ? 'p-4' : 'p-6'
          )}>
            <div className={cn(
              'flex items-start gap-4',
              isMobile && 'gap-3'
            )}>
              <div className={cn(
                'rounded-full bg-destructive/10 shadow-sm',
                'animate-pulse',
                isMobile ? 'p-2' : 'p-3'
              )}>
                <AlertCircle className={cn(
                  'text-destructive',
                  isMobile ? 'h-5 w-5' : 'h-6 w-6'
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  'font-semibold mb-1 text-destructive',
                  isMobile ? 'text-base' : 'text-lg'
                )}>
                  Critical Complaints Alert
                </h3>
                <p className={cn(
                  'text-muted-foreground',
                  isMobile ? 'text-sm' : 'text-sm'
                )}>
                  There are <strong className="text-foreground">{stats.critical}</strong> critical complaints that need immediate attention.
                </p>
                <Button
                  variant="destructive"
                  size={isMobile ? "sm" : "sm"}
                  className={cn(
                    'mt-3 transition-all duration-200 active:scale-95',
                    isMobile && 'w-full'
                  )}
                  onClick={() => navigate('/complaints?priority=critical')}
                >
                  View Critical Complaints
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
