import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useFilter } from '@/contexts/FilterContext';
import { gasApi } from '@/lib/gas-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Download, Calendar, Filter, Eye, EyeOff, RefreshCw, MoreVertical } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { exportToCSV, exportToJSON } from '@/utils/export';
import BulkActions from '@/components/BulkActions';
import ModernComplaintCard from '@/components/ModernComplaintCard';
import { PageLoading } from '@/components/ui/loading';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '@/types';

export default function Complaints() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { isFilterEnabled } = useFilter();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchComplaints();

    // Poll for updates every 30 seconds since we don't have real-time from GAS
    const interval = setInterval(fetchComplaints, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [userRole, user]);

  const fetchComplaints = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      }

      console.log('📋 COMPLAINTS: Fetching complaints with optimized GAS client');

      // Use optimized GAS client with caching and performance features
      const response = await gasApi.getComplaints({
        limit: 1000, // Fetch more data for better performance and caching
        sort: 'created_at',
        order: 'desc'
      });

      if (response.success && response.data) {
        console.log('📋 COMPLAINTS: Successfully fetched', response.data.length, 'complaints');

        // Filter complaints if user is a customer
        let complaintsData = response.data;
        if (userRole === 'customer' && user) {
          complaintsData = complaintsData.filter((c: any) => c.customerId === user.id || c.customer_id === user.id);
        }

        const formattedComplaints: Complaint[] = (complaintsData || []).map((c: any) => ({
          id: c.id || c.ID,
          ticketNumber: c.ticketNumber || c['Ticket Number'] || c.ticket_number,
          customerId: c.customerId || c['Customer ID'] || c.customer_id,
          customerName: c.customerName || c['Customer Name'] || c.customer_name,
          customerPhone: c.customerPhone || c['Customer Phone'] || c.customer_phone,
          customerEmail: c.customerEmail || c['Customer Email'] || c.customer_email,
          category: c.category || c.Category,
          priority: c.priority || c.Priority,
          status: c.status || c.Status,
          title: c.title || c.Title,
          description: c.description || c.Description,
          region: c.region || c.Region,
          serviceCenter: c.serviceCenter || c['Service Center'] || c.service_center,
          assignedTo: c.assignedTo || c['Assigned To'] || c.assigned_to,
          assignedToName: c.assignedToName || c.AssignedToName || c.assigned_to_name || 'Unassigned',
          createdAt: c.createdAt || c['Created At'] || c.created_at,
          updatedAt: c.updatedAt || c['Updated At'] || c.updated_at,
          resolvedAt: c.resolvedAt || c['Resolved At'] || c.resolved_at,
          notes: c.notes
        }));

        setComplaints(formattedComplaints);

        // Show cache status for better UX
        if (response.cached) {
          console.log('📋 COMPLAINTS: Data served from cache - ultra fast!');
        }
      } else {
        throw new Error(response.error || 'Failed to fetch complaints');
      }
    } catch (error: any) {
      console.error('📋 COMPLAINTS: Error fetching complaints:', error);

      // Enhanced error handling with offline support
      if (error.message.includes('Network')) {
        toast({
          title: 'Offline Mode',
          description: 'Working offline. Data will sync when connection is restored.',
        });
      } else {
        toast({
          title: 'Error fetching complaints',
          description: 'Unable to load complaints. Data will retry automatically.',
          variant: 'destructive'
        });
      }

      // Don't clear complaints on network errors to maintain offline functionality
      if (!error.message.includes('Network')) {
        setComplaints([]);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [userRole, user]);

  // Memoized filtered complaints for performance
  const filteredComplaints = useMemo(() => {
    return complaints.filter(complaint => {
      const matchesSearch = complaint.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || complaint.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || complaint.category === categoryFilter;

      const matchesDateFrom = !dateFrom || new Date(complaint.createdAt) >= new Date(dateFrom);
      const matchesDateTo = !dateTo || new Date(complaint.createdAt) <= new Date(dateTo + 'T23:59:59');

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesDateFrom && matchesDateTo;
    });
  }, [complaints, searchQuery, statusFilter, priorityFilter, categoryFilter, dateFrom, dateTo]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredComplaints.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredComplaints.map(c => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "destructive",
      in_progress: "default",
      pending: "outline",
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

  if (loading) {
    return (
      <PageLoading
        variant="list"
        title="Loading Complaints"
        subtitle="Fetching complaint data from the server..."
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
            Complaints Management
          </h1>
          <p className={cn(
            'text-muted-foreground',
            isMobile ? 'text-sm' : 'text-base'
          )}>
            Manage and track customer complaints
          </p>
        </div>
        <div className={cn(
          'flex gap-2',
          isMobile ? 'flex-wrap justify-center' : 'flex gap-2'
        )}>
          <Button
            variant="outline"
            size={isMobile ? "sm" : "icon"}
            onClick={() => fetchComplaints(true)}
            disabled={isRefreshing}
            className={cn(
              'transition-all duration-200 active:scale-95',
              isMobile && 'h-9 px-3'
            )}
            title="Refresh complaints data"
          >
            <RefreshCw className={cn(
              'transition-transform duration-200',
              isRefreshing ? 'animate-spin' : '',
              isMobile ? 'h-4 w-4 mr-2' : 'h-4 w-4'
            )} />
            {isMobile && 'Refresh'}
          </Button>
          {!isMobile && (
            <>
              <BulkActions
                selectedIds={selectedIds}
                onComplete={() => {
                  setSelectedIds([]);
                  fetchComplaints();
                }}
              />
              <Button
                variant="outline"
                onClick={() => exportToCSV(filteredComplaints)}
                disabled={filteredComplaints.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => exportToJSON(filteredComplaints)}
                disabled={filteredComplaints.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                JSON
              </Button>
            </>
          )}
          <Button
            onClick={() => navigate('/complaints/new')}
            className={cn(
              'gap-2 gradient-primary text-white transition-all duration-200 active:scale-95',
              isMobile ? 'flex-1 justify-center' : ''
            )}
          >
            <Plus className="h-4 w-4" />
            {isMobile ? 'New Complaint' : 'New Complaint'}
          </Button>
        </div>
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
                  {complaints.length}
                </p>
              </div>
              <Search className={cn(
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
                  {complaints.filter(c => c.status === 'open').length}
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
                  {complaints.filter(c => c.status === 'in_progress').length}
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
                  {complaints.filter(c => c.status === 'resolved').length}
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
        <Card className="card-modern">
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Filters & Search</h2>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by ticket number, title, customer, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-base"
                  />
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setCategoryFilter('all');
                    setDateFrom('');
                    setDateTo('');
                  }}
                >
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="power_outage">Power Outage</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="connection">Connection</SelectItem>
                    <SelectItem value="meter">Meter</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    placeholder="From Date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    placeholder="To Date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complaints List */}
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
            Complaints ({filteredComplaints.length})
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(
          'transition-all duration-200',
          isMobile && 'p-4'
        )}>
          <div className="space-y-3">
            {filteredComplaints.length === 0 ? (
              <div className="text-center py-8">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No complaints found</p>
              </div>
            ) : (
              filteredComplaints.map((complaint) => (
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
                            {complaint.ticketNumber}
                          </span>
                          {getStatusBadge(complaint.status)}
                          {getPriorityBadge(complaint.priority)}
                        </div>
                        <p className="text-sm font-medium truncate">
                          {complaint.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">{complaint.customerName}</span>
                          <span>•</span>
                          <span className="whitespace-nowrap">
                            {new Date(complaint.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
