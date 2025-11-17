import { useEffect, useState } from 'react';
import { supabase, isSupabaseAvailable } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { toast } from '@/hooks/use-toast';
import { TrendingUp, Filter, BarChart3, AlertCircle, Clock, Eye, EyeOff } from 'lucide-react';
import FilterPanel from '@/components/FilterPanel';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { Complaint } from '@/types';

export default function Reports() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = useState('all');
  const [statusData, setStatusData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [priorityData, setPriorityData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [totalInTimeRange, setTotalInTimeRange] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const COLORS = ['#ea580c', '#16a34a', '#2563eb', '#ca8a04', '#dc2626', '#9333ea'];

  useEffect(() => {
    fetchData();

    // Real-time subscription - only if Supabase is available
    if (!isSupabaseAvailable) return;

    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [timeRange, searchQuery, statusFilter, priorityFilter, categoryFilter, dateFrom, dateTo]);

  const fetchData = async () => {
    try {
      if (isSupabaseAvailable) {
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mappedComplaints: Complaint[] = (data || []).map((c: any) => ({
          id: c.id,
          ticketNumber: c.ticket_number,
          customerId: c.customer_id || '',
          customerName: c.customer_name,
          customerPhone: c.customer_phone,
          customerEmail: c.customer_email,
          category: c.category,
          priority: c.priority,
          status: c.status,
          title: c.title,
          description: c.description,
          region: c.region || '',
          serviceCenter: c.service_center || '',
          assignedTo: c.assigned_to,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          resolvedAt: c.resolved_at,
          notes: c.notes
        }));

        setComplaints(mappedComplaints);
      } else {
        // Fallback to API endpoint
        const response = await fetch('/api/complaints');
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Failed to fetch complaints');

        if (data.success && data.data) {
          const mappedComplaints: Complaint[] = (data.data || []).map((c: any) => ({
            id: c.id || c.ID,
            ticketNumber: c.ticketNumber || c['Ticket Number'] || c.ticket_number,
            customerId: c.customerId || c['Customer ID'] || c.customer_id || '',
            customerName: c.customerName || c['Customer Name'] || c.customer_name,
            customerPhone: c.customerPhone || c['Customer Phone'] || c.customer_phone,
            customerEmail: c.customerEmail || c['Customer Email'] || c.customer_email,
            category: c.category || c.Category,
            priority: c.priority || c.Priority,
            status: c.status || c.Status,
            title: c.title || c.Title,
            description: c.description || c.Description,
            region: c.region || c.Region || '',
            serviceCenter: c.serviceCenter || c['Service Center'] || c.service_center || '',
            assignedTo: c.assignedTo || c['Assigned To'] || c.assigned_to,
            createdAt: c.createdAt || c['Created At'] || c.created_at,
            updatedAt: c.updatedAt || c['Updated At'] || c.updated_at,
            resolvedAt: c.resolvedAt || c['Resolved At'] || c.resolved_at,
            notes: c.notes
          }));

          setComplaints(mappedComplaints);
        } else {
          throw new Error(data.error || 'Failed to fetch complaints');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error fetching data',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReportData = async () => {
    try {
      let complaints: any[] = [];

      if (isSupabaseAvailable) {
        let query = supabase
          .from('complaints')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply time range filter if not 'all'
        if (timeRange !== 'all') {
          const daysAgo = new Date();
          daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));
          query = query.gte('created_at', daysAgo.toISOString());
        }

        // Fetch complaints based on time range
        const { data, error } = await query;

        if (error) throw error;
        complaints = data || [];
      } else {
        // Fallback to API endpoint - fetch all and filter client-side
        const response = await fetch('/api/complaints');
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Failed to fetch complaints');

        if (data.success && data.data) {
          complaints = (data.data || []).map((c: any) => ({
            id: c.id || c.ID,
            ticket_number: c.ticketNumber || c['Ticket Number'] || c.ticket_number,
            customer_id: c.customerId || c['Customer ID'] || c.customer_id || '',
            customer_name: c.customerName || c['Customer Name'] || c.customer_name,
            customer_phone: c.customerPhone || c['Customer Phone'] || c.customer_phone,
            customer_email: c.customerEmail || c['Customer Email'] || c.customer_email,
            category: c.category || c.Category,
            priority: c.priority || c.Priority,
            status: c.status || c.Status,
            title: c.title || c.Title,
            description: c.description || c.Description,
            region: c.region || c.Region || '',
            service_center: c.serviceCenter || c['Service Center'] || c.service_center || '',
            assigned_to: c.assignedTo || c['Assigned To'] || c.assigned_to,
            created_at: c.createdAt || c['Created At'] || c.created_at,
            updated_at: c.updatedAt || c['Updated At'] || c.updated_at,
            resolved_at: c.resolvedAt || c['Resolved At'] || c.resolved_at,
            notes: c.notes
          }));

          // Apply time range filter client-side if not 'all'
          if (timeRange !== 'all') {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));
            complaints = complaints.filter(c => new Date(c.created_at) >= daysAgo);
          }
        } else {
          throw new Error(data.error || 'Failed to fetch complaints');
        }
      }

      // Apply filters to the complaints data
      const filteredComplaints = (complaints || []).filter(complaint => {
        const matchesSearch = complaint.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          complaint.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          complaint.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || complaint.priority === priorityFilter;
        const matchesCategory = categoryFilter === 'all' || complaint.category === categoryFilter;

        const matchesDateFrom = !dateFrom || new Date(complaint.created_at) >= new Date(dateFrom);
        const matchesDateTo = !dateTo || new Date(complaint.created_at) <= new Date(dateTo + 'T23:59:59');

        return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesDateFrom && matchesDateTo;
      });

      // Calculate stats from filtered data
      const total = filteredComplaints.length;
      const open = filteredComplaints.filter(c => c.status === 'open').length;
      const resolved = filteredComplaints.filter(c => c.status === 'resolved' || c.status === 'closed').length;
      const inProgress = filteredComplaints.filter(c => c.status === 'in_progress').length;
      const critical = filteredComplaints.filter(c => c.priority === 'critical').length;

      // Store total count from time range for display
      setTotalInTimeRange((complaints || []).length);

      // Calculate average resolution time
      const resolvedComplaints = filteredComplaints.filter(c => c.resolved_at);
      const avgResolutionTime = resolvedComplaints.length > 0
        ? resolvedComplaints.reduce((acc, c) => {
            const created = new Date(c.created_at).getTime();
            const resolved = new Date(c.resolved_at).getTime();
            return acc + (resolved - created);
          }, 0) / resolvedComplaints.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      // Status distribution
      const statusCounts = filteredComplaints.reduce((acc: any, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {});
      setStatusData(Object.entries(statusCounts).map(([name, value]) => ({
        name: name.replace('_', ' ').toUpperCase(),
        value
      })));

      // Category distribution
      const categoryCounts = filteredComplaints.reduce((acc: any, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      }, {});
      setCategoryData(Object.entries(categoryCounts).map(([name, value]) => ({
        name: name.replace('_', ' ').toUpperCase(),
        value
      })));

      // Priority distribution
      const priorityCounts = filteredComplaints.reduce((acc: any, c) => {
        acc[c.priority] = (acc[c.priority] || 0) + 1;
        return acc;
      }, {});
      setPriorityData(Object.entries(priorityCounts).map(([name, value]) => ({
        name: name.toUpperCase(),
        value
      })));

      // Trend data (daily counts) - only show if time range is not 'all'
      if (timeRange !== 'all') {
        const trendMap = new Map();
        const days = parseInt(timeRange);
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          trendMap.set(dateStr, { date: dateStr, count: 0 });
        }

        filteredComplaints.forEach(c => {
          const dateStr = c.created_at.split('T')[0];
          if (trendMap.has(dateStr)) {
            trendMap.get(dateStr).count++;
          }
        });

        setTrendData(Array.from(trendMap.values()));
      } else {
        // For 'all time', show monthly trend for the last 12 months
        const trendMap = new Map();
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStr = date.toISOString().slice(0, 7); // YYYY-MM format
          trendMap.set(monthStr, { date: monthStr, count: 0 });
        }

        filteredComplaints.forEach(c => {
          const monthStr = c.created_at.slice(0, 7);
          if (trendMap.has(monthStr)) {
            trendMap.get(monthStr).count++;
          }
        });

        setTrendData(Array.from(trendMap.values()));
      }

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
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

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const stats = {
    total: filteredComplaints.length,
    open: filteredComplaints.filter(c => c.status === 'open').length,
    inProgress: filteredComplaints.filter(c => c.status === 'in_progress').length,
    resolved: filteredComplaints.filter(c => c.status === 'resolved').length,
    critical: filteredComplaints.filter(c => c.priority === 'critical').length,
    resolutionRate: filteredComplaints.length > 0
      ? Math.round((filteredComplaints.filter(c => c.status === 'resolved').length / filteredComplaints.length) * 100)
      : 0,
    avgResolutionTime: '2.4h' // Placeholder for now
  };

  if (loading) {
    return (
      <div className={cn('space-y-6', isMobile && 'space-y-4')}>
        <div>
          <h1 className={cn(
            'font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent',
            isMobile ? 'text-2xl' : 'text-3xl'
          )}>
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">Loading reports and analytics...</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', isMobile && 'space-y-4')}>
      {/* Header */}
      <div className={cn(
        'flex items-start justify-between gap-4',
        isMobile && 'flex-col items-stretch gap-3'
      )}>
        <div className="space-y-1 flex-1 min-w-0">
          <h1 className={cn(
            'font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent',
            isMobile ? 'text-2xl' : 'text-4xl'
          )}>
            Reports & Analytics
          </h1>
          <p className={cn(
            'text-muted-foreground',
            isMobile ? 'text-sm' : 'text-lg'
          )}>
            Comprehensive complaint insights and statistics
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className={cn(
            'transition-all duration-200 active:scale-95',
            isMobile ? 'w-full h-10' : 'w-48 h-12'
          )}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
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

      {/* Filters */}
      {showFilters && (
        <FilterPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={{
            status: statusFilter,
            priority: priorityFilter,
            category: categoryFilter,
          }}
          onFilterChange={(key, value) => {
            if (key === 'status') setStatusFilter(value);
            if (key === 'priority') setPriorityFilter(value);
            if (key === 'category') setCategoryFilter(value);
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
            {
              key: 'category',
              label: 'Category',
              options: [
                { value: 'power_outage', label: 'Power Outage' },
                { value: 'billing', label: 'Billing' },
                { value: 'connection', label: 'Connection' },
                { value: 'meter', label: 'Meter' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'other', label: 'Other' },
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
          totalCount={complaints.length}
        />
      )}

      {/* KPI Cards */}
      <div className={cn(
        'grid gap-4',
        isMobile ? 'grid-cols-2' : 'grid-cols-2'
      )}>
        <Card className={cn(
          'transition-all duration-200',
          isMobile && 'shadow-lg active:scale-95'
        )}>
          <CardContent className={cn(
            'transition-all duration-200',
            isMobile ? 'p-4' : 'pt-6'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Total Complaints</p>
                <p className={cn(
                  'font-bold',
                  isMobile ? 'text-xl' : 'text-2xl'
                )}>
                  {stats.total}
                </p>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </div>
              <BarChart3 className={cn(
                'text-muted-foreground',
                isMobile ? 'h-6 w-6' : 'h-8 w-8'
              )} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          'transition-all duration-200',
          isMobile && 'shadow-lg active:scale-95'
        )}>
          <CardContent className={cn(
            'transition-all duration-200',
            isMobile ? 'p-4' : 'pt-6'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Resolution Rate</p>
                <p className={cn(
                  'font-bold',
                  isMobile ? 'text-xl' : 'text-2xl'
                )}>
                  {stats.resolutionRate}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">{stats.resolved} resolved</p>
              </div>
              <TrendingUp className={cn(
                'text-muted-foreground',
                isMobile ? 'h-6 w-6' : 'h-8 w-8'
              )} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          'transition-all duration-200',
          isMobile && 'shadow-lg active:scale-95'
        )}>
          <CardContent className={cn(
            'transition-all duration-200',
            isMobile ? 'p-4' : 'pt-6'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className={cn(
                  'font-bold',
                  isMobile ? 'text-xl' : 'text-2xl'
                )}>
                  {stats.inProgress}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Being handled</p>
              </div>
              <Clock className={cn(
                'text-muted-foreground',
                isMobile ? 'h-6 w-6' : 'h-8 w-8'
              )} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          'transition-all duration-200',
          isMobile && 'shadow-lg active:scale-95'
        )}>
          <CardContent className={cn(
            'transition-all duration-200',
            isMobile ? 'p-4' : 'pt-6'
          )}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
              <p className={cn(
                'font-bold',
                isMobile ? 'text-xl' : 'text-2xl'
              )}>
                {stats.critical}
              </p>
              <p className="text-xs text-destructive flex items-center mt-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                {stats.critical > 0 ? 'Requires attention' : 'All clear'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Complaints by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Open</Badge>
                  <span className="text-sm text-muted-foreground">New complaints</span>
                </div>
                <span className="text-2xl font-bold">{stats.open}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">In Progress</Badge>
                  <span className="text-sm text-muted-foreground">Being handled</span>
                </div>
                <span className="text-2xl font-bold">{stats.inProgress}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Resolved</Badge>
                  <span className="text-sm text-muted-foreground">Completed</span>
                </div>
                <span className="text-2xl font-bold">{stats.resolved}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Critical</Badge>
                  <span className="text-sm text-muted-foreground">Urgent</span>
                </div>
                <span className="text-2xl font-bold">{filteredComplaints.filter(c => c.priority === 'critical').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default">High</Badge>
                  <span className="text-sm text-muted-foreground">Important</span>
                </div>
                <span className="text-2xl font-bold">{filteredComplaints.filter(c => c.priority === 'high').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Medium</Badge>
                  <span className="text-sm text-muted-foreground">Normal</span>
                </div>
                <span className="text-2xl font-bold">{filteredComplaints.filter(c => c.priority === 'medium').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Low</Badge>
                  <span className="text-sm text-muted-foreground">Minor</span>
                </div>
                <span className="text-2xl font-bold">{filteredComplaints.filter(c => c.priority === 'low').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className={cn(
        'grid gap-6',
        isMobile ? 'grid-cols-1' : 'md:grid-cols-2'
      )}>
        <Card className={cn(
          'card-modern transition-all duration-200',
          isMobile && 'shadow-lg'
        )}>
          <CardHeader className={cn(
            'transition-all duration-200',
            isMobile && 'pb-3'
          )}>
            <CardTitle className={cn(
              isMobile ? 'text-lg' : 'text-xl'
            )}>
              Complaints Trend
            </CardTitle>
            <p className="text-sm text-muted-foreground">Daily complaint submissions over time</p>
          </CardHeader>
          <CardContent className={cn(
            'transition-all duration-200',
            isMobile && 'p-4'
          )}>
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Complaints"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className={cn(
          'card-modern transition-all duration-200',
          isMobile && 'shadow-lg'
        )}>
          <CardHeader className={cn(
            'transition-all duration-200',
            isMobile && 'pb-3'
          )}>
            <CardTitle className={cn(
              isMobile ? 'text-lg' : 'text-xl'
            )}>
              Status Distribution
            </CardTitle>
            <p className="text-sm text-muted-foreground">Breakdown by complaint status</p>
          </CardHeader>
          <CardContent className={cn(
            'transition-all duration-200',
            isMobile && 'p-4'
          )}>
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={isMobile ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className={cn(
          'card-modern transition-all duration-200',
          isMobile && 'shadow-lg'
        )}>
          <CardHeader className={cn(
            'transition-all duration-200',
            isMobile && 'pb-3'
          )}>
            <CardTitle className={cn(
              isMobile ? 'text-lg' : 'text-xl'
            )}>
              By Category
            </CardTitle>
            <p className="text-sm text-muted-foreground">Most common complaint types</p>
          </CardHeader>
          <CardContent className={cn(
            'transition-all duration-200',
            isMobile && 'p-4'
          )}>
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: isMobile ? 8 : 10 }}
                  angle={isMobile ? -90 : -45}
                  textAnchor="end"
                  height={isMobile ? 80 : 100}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className={cn(
          'card-modern transition-all duration-200',
          isMobile && 'shadow-lg'
        )}>
          <CardHeader className={cn(
            'transition-all duration-200',
            isMobile && 'pb-3'
          )}>
            <CardTitle className={cn(
              isMobile ? 'text-lg' : 'text-xl'
            )}>
              By Priority
            </CardTitle>
            <p className="text-sm text-muted-foreground">Priority level distribution</p>
          </CardHeader>
          <CardContent className={cn(
            'transition-all duration-200',
            isMobile && 'p-4'
          )}>
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
