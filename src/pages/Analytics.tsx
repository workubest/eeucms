import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, isSupabaseAvailable } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, AlertCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { useFilter } from '@/contexts/FilterContext';
import FilterPanel from '@/components/FilterPanel';
import { PageLoading } from '@/components/ui/loading';
import type { Complaint } from '@/types';

export default function Analytics() {
  const { isFilterEnabled } = useFilter();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Real-time subscription - only if Supabase is available
    if (!isSupabaseAvailable) return;

    const channel = supabase
      .channel('analytics-changes')
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
    avgResponseTime: '2.4h' // Placeholder for now
  };

  if (loading) {
    return (
      <PageLoading
        variant="dashboard"
        title="Loading Analytics"
        subtitle="Calculating performance metrics and generating insights..."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Comprehensive insights and performance metrics</p>
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
      <div className="grid gap-4 grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Complaints</p>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolution Rate</p>
                <p className="text-2xl font-bold">{stats.resolutionRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.resolved} resolved</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground mt-1">Being handled</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
                <p className="text-2xl font-bold">{stats.critical}</p>
                <p className="text-xs text-destructive flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {stats.critical > 0 ? 'Requires attention' : 'All clear'}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive" />
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

    </div>
  );
}
