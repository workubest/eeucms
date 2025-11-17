import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseAvailable } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, User, Phone, Mail, Calendar, Clock, FileText, Paperclip, Trash2, Edit2, Check, X } from 'lucide-react';
import type { Complaint, ComplaintStatus, ComplaintCategory, ComplaintPriority, User as UserType } from '@/types';
import FileUpload from '@/components/FileUpload';
import AttachmentsList from '@/components/AttachmentsList';
import { PageLoading } from '@/components/ui/loading';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const isMobile = useIsMobile();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notes, setNotes] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    notes: ''
  });

  const canEdit = userRole && ['admin', 'manager', 'staff'].includes(userRole);
  const canDelete = userRole && ['admin', 'manager'].includes(userRole);

  useEffect(() => {
    fetchComplaintDetails();
    fetchHistory();
    if (canEdit) {
      fetchStaffList();
    }

    // Real-time subscription (only if Supabase is available)
    let channel = null;
    if (isSupabaseAvailable) {
      channel = supabase
        .channel(`complaint-${id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'complaints',
            filter: `id=eq.${id}`
          },
          () => {
            fetchComplaintDetails();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'complaint_history',
            filter: `complaint_id=eq.${id}`
          },
          () => {
            fetchHistory();
          }
        )
        .subscribe();
    }

    return () => {
      if (channel && isSupabaseAvailable) {
        supabase.removeChannel(channel);
      }
    };
  }, [id]);

  const fetchComplaintDetails = async () => {
    if (!isSupabaseAvailable) {
      // If Supabase is not available, fetch from API instead
      try {
        const response = await fetch(`/api/complaints/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.success && data.data) {
          const complaintData: Complaint = {
            id: data.data.id || data.data.ID,
            ticketNumber: data.data.ticketNumber || data.data['Ticket Number'] || data.data.ticket_number,
            customerId: data.data.customerId || data.data['Customer ID'] || data.data.customer_id,
            customerName: data.data.customerName || data.data['Customer Name'] || data.data.customer_name,
            customerPhone: data.data.customerPhone || data.data['Customer Phone'] || data.data.customer_phone,
            customerEmail: data.data.customerEmail || data.data['Customer Email'] || data.data.customer_email,
            category: data.data.category || data.data.Category,
            priority: data.data.priority || data.data.Priority,
            status: data.data.status || data.data.Status,
            title: data.data.title || data.data.Title,
            description: data.data.description || data.data.Description,
            region: data.data.region || data.data.Region,
            serviceCenter: data.data.serviceCenter || data.data['Service Center'] || data.data.service_center,
            assignedTo: data.data.assignedTo || data.data['Assigned To'] || data.data.assigned_to,
            assignedToName: data.data.assignedToName || data.data.AssignedToName || data.data.assigned_to_name || 'Unassigned',
            createdAt: data.data.createdAt || data.data['Created At'] || data.data.created_at,
            updatedAt: data.data.updatedAt || data.data['Updated At'] || data.data.updated_at,
            resolvedAt: data.data.resolvedAt || data.data['Resolved At'] || data.data.resolved_at,
            notes: data.data.notes
          };

          setComplaint(complaintData);
        } else {
          throw new Error(data.error || 'Failed to fetch complaint');
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          assigned_profile:profiles!complaints_assigned_to_fkey(name),
          customer_profile:profiles!complaints_customer_id_fkey(name, email, region, service_center)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const complaintData: Complaint = {
        id: data.id,
        ticketNumber: data.ticket_number,
        customerId: data.customer_id,
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        customerEmail: data.customer_email,
        category: data.category as ComplaintCategory,
        priority: data.priority as ComplaintPriority,
        status: data.status as ComplaintStatus,
        title: data.title,
        description: data.description,
        region: data.region,
        serviceCenter: data.service_center,
        assignedTo: data.assigned_to,
        assignedToName: (data as any).assigned_profile?.name || 'Unassigned',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        resolvedAt: data.resolved_at,
        notes: data.notes
      };

      setComplaint(complaintData);

      // Initialize edit values
      if (complaintData) {
        setEditValues({
          title: complaintData.title,
          description: complaintData.description,
          category: complaintData.category,
          priority: complaintData.priority,
          notes: complaintData.notes || ''
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!isSupabaseAvailable) {
      console.log('Supabase not available, skipping history fetch');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('complaint_history')
        .select(`
          *,
          changed_by_profile:profiles!complaint_history_changed_by_fkey(name)
        `)
        .eq('complaint_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error('Error fetching history:', error);
    }
  };

  const fetchStaffList = async () => {
    if (!isSupabaseAvailable) {
      console.log('Supabase not available, skipping staff list fetch');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner(role)
        `)
        .in('user_roles.role', ['staff', 'manager'])
        .eq('active', true);

      if (error) throw error;

      const users: UserType[] = (data || []).map(p => ({
        id: p.id,
        email: p.email,
        name: p.name,
        role: 'staff',
        region: p.region,
        serviceCenter: p.service_center,
        active: p.active,
        createdAt: p.created_at
      }));

      setStaffList(users);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
    }
  };

  const updateField = async (field: string, value: string) => {
    if (!complaint || !user || !isSupabaseAvailable) return;

    setUpdating(true);
    try {
      const updates: any = { [field]: value };

      const { error: updateError } = await supabase
        .from('complaints')
        .update(updates)
        .eq('id', complaint.id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('complaint_history')
        .insert([{
          complaint_id: complaint.id,
          user_id: user.id,
          user_name: user.name,
          action: `Field updated: ${field}`,
          old_value: complaint[field as keyof Complaint] || '',
          new_value: value,
          notes: `Updated ${field} field`
        }]);

      if (historyError) throw historyError;

      toast({
        title: 'Success',
        description: `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`
      });

      setEditingField(null);
      fetchComplaintDetails();
      fetchHistory();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const updateStatus = async (newStatus: ComplaintStatus) => {
    if (!complaint || !user || !isSupabaseAvailable) return;

    setUpdating(true);
    try {
      const updates: any = { status: newStatus };

      // Fix status logic: clear resolved_at when reopening
      if (newStatus === 'resolved' || newStatus === 'closed') {
        updates.resolved_at = new Date().toISOString();
      } else if (newStatus === 'open' || newStatus === 'in_progress' || newStatus === 'pending') {
        updates.resolved_at = null;
      }

      const { error: updateError } = await supabase
        .from('complaints')
        .update(updates)
        .eq('id', complaint.id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('complaint_history')
        .insert([{
          complaint_id: complaint.id,
          user_id: user.id,
          user_name: user.name,
          action: 'Status changed',
          old_value: complaint.status,
          new_value: newStatus,
          notes: notes || null
        }]);

      if (historyError) throw historyError;

      toast({
        title: 'Success',
        description: 'Complaint status updated successfully'
      });

      setNotes('');
      fetchComplaintDetails();
      fetchHistory();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const assignStaff = async (staffId: string) => {
    if (!complaint || !isSupabaseAvailable) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ assigned_to: staffId })
        .eq('id', complaint.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Staff assigned successfully'
      });

      fetchComplaintDetails();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!complaint || !isSupabaseAvailable) return;

    setDeleting(true);
    try {
      // Delete complaint history first
      const { error: historyError } = await supabase
        .from('complaint_history')
        .delete()
        .eq('complaint_id', complaint.id);

      if (historyError) throw historyError;

      // Delete complaint attachments
      const { error: attachmentsError } = await supabase
        .from('complaint_attachments')
        .delete()
        .eq('complaint_id', complaint.id);

      if (attachmentsError) throw attachmentsError;

      // Delete complaint
      const { error: complaintError } = await supabase
        .from('complaints')
        .delete()
        .eq('id', complaint.id);

      if (complaintError) throw complaintError;

      toast({
        title: 'Success',
        description: 'Complaint deleted successfully'
      });

      navigate('/complaints');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: 'default',
      in_progress: 'secondary',
      pending: 'outline',
      resolved: 'default',
      closed: 'secondary'
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      low: 'secondary',
      medium: 'default',
      high: 'default',
      critical: 'destructive'
    };
    return <Badge variant={variants[priority] || 'default'}>{priority.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <PageLoading
        variant="form"
        title="Loading Complaint Details"
        subtitle="Fetching complaint information from the server..."
      />
    );
  }

  if (!complaint) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <p className="text-center text-muted-foreground">Complaint not found</p>
          <Button onClick={() => navigate('/complaints')} className="mt-4 mx-auto block">
            Back to Complaints
          </Button>
        </Card>
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
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size={isMobile ? "sm" : "icon"}
            onClick={() => navigate('/complaints')}
            className={cn(
              'transition-all duration-200 active:scale-95',
              isMobile && 'h-9 px-3'
            )}
          >
            <ArrowLeft className={cn(
              'transition-transform duration-200',
              isMobile ? 'h-4 w-4 mr-2' : 'h-5 w-5'
            )} />
            {isMobile && 'Back'}
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className={cn(
              'font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent',
              isMobile ? 'text-2xl' : 'text-3xl'
            )}>
              Complaint Details
            </h1>
            <p className={cn(
              'text-muted-foreground',
              isMobile ? 'text-sm' : 'text-base'
            )}>
              Ticket #{complaint.ticketNumber}
            </p>
          </div>
        </div>
        <div className={cn(
          'flex items-center gap-2',
          isMobile && 'justify-center'
        )}>
          {getStatusBadge(complaint.status)}
          {getPriorityBadge(complaint.priority)}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size={isMobile ? "sm" : "sm"}
                  className={cn(
                    'gap-2 transition-all duration-200 active:scale-95',
                    isMobile && 'flex-1'
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                  {isMobile ? 'Delete' : 'Delete'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Complaint</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete complaint #{complaint.ticketNumber}?
                    This action cannot be undone and will permanently delete all complaint data,
                    history, and attachments.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {deleting ? 'Deleting...' : 'Delete Complaint'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className={cn(
        'grid gap-6',
        isMobile ? 'grid-cols-1' : 'md:grid-cols-3'
      )}>
        <div className={cn(
          'space-y-6',
          isMobile ? '' : 'md:col-span-2'
        )}>
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
                {editingField === 'title' ? (
                  <div className={cn(
                    'flex items-center gap-2',
                    isMobile && 'flex-col gap-3'
                  )}>
                    <Input
                      value={editValues.title}
                      onChange={(e) => setEditValues(prev => ({ ...prev, title: e.target.value }))}
                      className={cn(
                        'font-semibold transition-all duration-200',
                        isMobile ? 'text-base h-10' : 'text-xl'
                      )}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateField('title', editValues.title)}
                        disabled={updating}
                        className="transition-all duration-200 active:scale-95"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingField(null);
                          setEditValues(prev => ({ ...prev, title: complaint.title }));
                        }}
                        className="transition-all duration-200 active:scale-95"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 min-w-0">{complaint.title}</span>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingField('title')}
                        className="h-6 w-6 p-0 transition-all duration-200 active:scale-95"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(
              'transition-all duration-200',
              isMobile && 'p-4'
            )}>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  {canEdit && editingField !== 'description' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingField('description')}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {editingField === 'description' ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editValues.description}
                      onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateField('description', editValues.description)}
                        disabled={updating}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingField(null);
                          setEditValues(prev => ({ ...prev, description: complaint.description }));
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1">{complaint.description}</p>
                )}
              </div>

              <div className={cn(
                'grid gap-4',
                isMobile ? 'grid-cols-1' : 'grid-cols-2'
              )}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    {canEdit && editingField !== 'category' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingField('category')}
                        className="h-6 w-6 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {editingField === 'category' ? (
                    <div className="space-y-2">
                      <Select
                        value={editValues.category}
                        onValueChange={(value) => setEditValues(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="power_outage">Power Outage</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="connection">Connection</SelectItem>
                          <SelectItem value="meter">Meter</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateField('category', editValues.category)}
                          disabled={updating}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingField(null);
                            setEditValues(prev => ({ ...prev, category: complaint.category }));
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 capitalize">{complaint.category.replace('_', ' ')}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                    {canEdit && editingField !== 'priority' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingField('priority')}
                        className="h-6 w-6 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {editingField === 'priority' ? (
                    <div className="space-y-2">
                      <Select
                        value={editValues.priority}
                        onValueChange={(value) => setEditValues(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateField('priority', editValues.priority)}
                          disabled={updating}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingField(null);
                            setEditValues(prev => ({ ...prev, priority: complaint.priority }));
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 capitalize">{complaint.priority}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Region</label>
                  <p className="mt-1">{complaint.region}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Service Center</label>
                  <p className="mt-1">{complaint.serviceCenter}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="mt-1">{new Date(complaint.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="mt-1">{new Date(complaint.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-muted-foreground">Internal Notes</label>
                  {canEdit && editingField !== 'notes' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingField('notes')}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {editingField === 'notes' ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editValues.notes}
                      onChange={(e) => setEditValues(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add internal notes..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateField('notes', editValues.notes)}
                        disabled={updating}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingField(null);
                          setEditValues(prev => ({ ...prev, notes: complaint.notes || '' }));
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1">{complaint.notes || 'No internal notes'}</p>
                )}
              </div>
            </div>
            </CardContent>
          </Card>

          {canEdit && (
            <Card className={cn(
              'transition-all duration-200',
              isMobile && 'shadow-lg'
            )}>
              <CardHeader className={cn(
                'transition-all duration-200',
                isMobile && 'pb-3'
              )}>
                <CardTitle className={cn(
                  isMobile ? 'text-lg' : 'text-lg'
                )}>
                  Update Status
                </CardTitle>
              </CardHeader>
              <CardContent className={cn(
                'transition-all duration-200',
                isMobile && 'p-4'
              )}>
                <div className="space-y-4">
                  <div className={cn(
                    'flex gap-2',
                    isMobile && 'flex-wrap'
                  )}>
                    <Button
                      onClick={() => updateStatus('in_progress')}
                      disabled={updating || complaint.status === 'in_progress'}
                      variant={complaint.status === 'in_progress' ? 'default' : 'outline'}
                      className={cn(
                        'transition-all duration-200 active:scale-95',
                        isMobile && 'flex-1 min-w-0'
                      )}
                    >
                      In Progress
                    </Button>
                    <Button
                      onClick={() => updateStatus('pending')}
                      disabled={updating || complaint.status === 'pending'}
                      variant={complaint.status === 'pending' ? 'default' : 'outline'}
                      className={cn(
                        'transition-all duration-200 active:scale-95',
                        isMobile && 'flex-1 min-w-0'
                      )}
                    >
                      Pending
                    </Button>
                    <Button
                      onClick={() => updateStatus('resolved')}
                      disabled={updating || complaint.status === 'resolved'}
                      variant={complaint.status === 'resolved' ? 'default' : 'outline'}
                      className={cn(
                        'transition-all duration-200 active:scale-95',
                        isMobile && 'flex-1 min-w-0'
                      )}
                    >
                      Resolved
                    </Button>
                    <Button
                      onClick={() => updateStatus('closed')}
                      disabled={updating || complaint.status === 'closed'}
                      variant={complaint.status === 'closed' ? 'default' : 'outline'}
                      className={cn(
                        'transition-all duration-200 active:scale-95',
                        isMobile && 'flex-1 min-w-0'
                      )}
                    >
                      Closed
                    </Button>
                  </div>
                
                <Textarea
                  placeholder="Add notes about this status change..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
          )}

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-muted-foreground text-sm">No activity yet</p>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="relative pl-6 pb-3 border-l-2 border-primary">
                    <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background"></div>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">
                        {entry.action === 'Status changed'
                          ? `Status changed to ${entry.new_value.replace('_', ' ')}`
                          : entry.action === 'Field updated: title'
                          ? `Title updated to "${entry.new_value}"`
                          : entry.action === 'Field updated: description'
                          ? `Description updated`
                          : entry.action === 'Field updated: category'
                          ? `Category changed to ${entry.new_value.replace('_', ' ')}`
                          : entry.action === 'Field updated: priority'
                          ? `Priority changed to ${entry.new_value}`
                          : entry.action === 'Field updated: notes'
                          ? `Internal notes updated`
                          : entry.action
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {entry.changed_by_profile?.name || 'Unknown'} • {new Date(entry.created_at).toLocaleString()}
                      </p>
                      {entry.notes && entry.notes !== 'Updated title field' && entry.notes !== 'Updated description field' && entry.notes !== 'Updated category field' && entry.notes !== 'Updated priority field' && entry.notes !== 'Updated notes field' && (
                        <p className="mt-2 text-sm bg-muted p-2 rounded italic">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Paperclip className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Attachments</h3>
            </div>
            <AttachmentsList complaintId={id!} canDelete={canEdit} />
          </Card>

          {canEdit && (
            <FileUpload 
              complaintId={id!} 
              onUploadComplete={fetchComplaintDetails}
            />
          )}
        </div>

        <div className="space-y-6">
          <Card className={cn(
            'transition-all duration-200',
            isMobile && 'shadow-lg'
          )}>
            <CardHeader className={cn(
              'transition-all duration-200',
              isMobile && 'pb-3'
            )}>
              <CardTitle className={cn(
                isMobile ? 'text-lg' : 'text-lg'
              )}>
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(
              'transition-all duration-200',
              isMobile && 'p-4'
            )}>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className={cn(
                    'text-muted-foreground mt-0.5',
                    isMobile ? 'h-5 w-5' : 'h-5 w-5'
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{complaint.customerName}</p>
                    <p className="text-sm text-muted-foreground">Customer</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className={cn(
                    'text-muted-foreground mt-0.5',
                    isMobile ? 'h-5 w-5' : 'h-5 w-5'
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{complaint.customerPhone}</p>
                    <p className="text-sm text-muted-foreground">Phone</p>
                  </div>
                </div>
                {complaint.customerEmail && (
                  <div className="flex items-start gap-3">
                    <Mail className={cn(
                      'text-muted-foreground mt-0.5',
                      isMobile ? 'h-5 w-5' : 'h-5 w-5'
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{complaint.customerEmail}</p>
                      <p className="text-sm text-muted-foreground">Email</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {canEdit && (
            <Card className={cn(
              'transition-all duration-200',
              isMobile && 'shadow-lg'
            )}>
              <CardHeader className={cn(
                'transition-all duration-200',
                isMobile && 'pb-3'
              )}>
                <CardTitle className={cn(
                  isMobile ? 'text-lg' : 'text-lg'
                )}>
                  Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className={cn(
                'transition-all duration-200',
                isMobile && 'p-4'
              )}>
                <Select
                  value={complaint.assignedTo || ''}
                  onValueChange={assignStaff}
                  disabled={updating}
                >
                  <SelectTrigger className="transition-all duration-200 active:scale-95">
                    <SelectValue placeholder="Assign to staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} - {staff.region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {complaint.assignedToName && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Currently assigned to: {complaint.assignedToName}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className={cn(
            'transition-all duration-200',
            isMobile && 'shadow-lg'
          )}>
            <CardHeader className={cn(
              'transition-all duration-200',
              isMobile && 'pb-3'
            )}>
              <CardTitle className={cn(
                isMobile ? 'text-lg' : 'text-lg'
              )}>
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(
              'transition-all duration-200',
              isMobile && 'p-4'
            )}>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className={cn(
                    'text-muted-foreground mt-0.5',
                    isMobile ? 'h-5 w-5' : 'h-4 w-4'
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Created</p>
                    <p className="text-muted-foreground truncate">
                      {new Date(complaint.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className={cn(
                    'text-muted-foreground mt-0.5',
                    isMobile ? 'h-5 w-5' : 'h-4 w-4'
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Last Updated</p>
                    <p className="text-muted-foreground truncate">
                      {new Date(complaint.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {complaint.resolvedAt && (
                  <div className="flex items-start gap-3">
                    <FileText className={cn(
                      'text-muted-foreground mt-0.5',
                      isMobile ? 'h-5 w-5' : 'h-4 w-4'
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">Resolved</p>
                      <p className="text-muted-foreground truncate">
                        {new Date(complaint.resolvedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
