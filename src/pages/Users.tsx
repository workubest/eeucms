import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase, isSupabaseAvailable } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Filter, Users as UsersIcon, Edit, Trash2, Download, Eye, EyeOff, RefreshCw, MoreVertical } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useFilter } from '@/contexts/FilterContext';
import UserDialog from '@/components/UserDialog';
import FilterPanel from '@/components/FilterPanel';
import { PageLoading } from '@/components/ui/loading';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

export default function Users() {
  const { user: currentUser } = useAuth();
  const { isFilterEnabled } = useFilter();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchUsers();

    // Real-time subscription (only if Supabase is available)
    let channel = null;
    if (isSupabaseAvailable) {
      channel = supabase
        .channel('users-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles'
          },
          () => {
            fetchUsers();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_roles'
          },
          () => {
            fetchUsers();
          }
        )
        .subscribe();
    }

    return () => {
      if (channel && isSupabaseAvailable) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fetchUsers = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      }

      const response = await fetch('/api/users');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch users');

      if (data.success && data.data) {
        const usersData: User[] = (data.data || []).map((p: any) => ({
          id: p.id,
          email: p.email,
          name: p.name || p.full_name || p.email,
          role: p.role || 'staff',
          region: p.region,
          serviceCenter: p.service_center || p.serviceCenter,
          active: p.active,
          createdAt: p.created_at || p.createdAt
        }));

        setUsers(usersData);
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (error: any) {
      toast({
        title: 'Error fetching users',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleAddUser = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch('/api/users/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          data: {
            userId: userToDelete.id
          }
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to delete user');
      if (!data.success) throw new Error('Failed to delete user');

      toast({
        title: 'Success',
        description: 'User deleted successfully'
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const response = await fetch('/api/users/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          data: {
            userId: user.id,
            active: !user.active
          }
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to update user status');
      if (!data.success) throw new Error('Failed to update user status');

      toast({
        title: 'Success',
        description: `User ${!user.active ? 'activated' : 'deactivated'} successfully`
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleExportUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to export users');
      if (!data?.success) throw new Error('Failed to export users');

      // Convert data to CSV
      const csvData = data.data;
      if (csvData.length === 0) {
        toast({
          title: "No Data",
          description: "No users to export",
          variant: "destructive",
        });
        return;
      }

      // Create CSV content
      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map((row: any) =>
        Object.values(row).map(val =>
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');

      // Create and download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: `Exported ${data.count} users successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtered users for performance
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && user.active) ||
        (statusFilter === 'inactive' && !user.active);

      const matchesDateFrom = !dateFrom || new Date(user.createdAt) >= new Date(dateFrom);
      const matchesDateTo = !dateTo || new Date(user.createdAt) <= new Date(dateTo + 'T23:59:59');

      return matchesSearch && matchesRole && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [users, searchQuery, roleFilter, statusFilter, dateFrom, dateTo]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  // Memoized stats calculation for performance
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.active).length,
    inactive: users.filter(u => !u.active).length,
    admins: users.filter(u => u.role === 'admin').length
  }), [users]);

  if (loading) {
    return (
      <PageLoading
        variant="list"
        title="Loading Users"
        subtitle="Fetching user data and permissions..."
      />
    );
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      admin: "destructive",
      manager: "default",
      staff: "secondary",
      technician: "outline",
      customer: "outline"
    };
    return <Badge variant={variants[role] || "default"}>{role}</Badge>;
  };

  // Only admins can manage users
  const canManageUsers = currentUser?.role === 'admin';

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
            Users Management
          </h1>
          <p className={cn(
            'text-muted-foreground',
            isMobile ? 'text-sm' : 'text-base'
          )}>
            Manage system users, roles, and permissions
          </p>
        </div>
        {canManageUsers && (
          <div className={cn(
            'flex gap-2',
            isMobile ? 'flex-wrap justify-center' : 'flex gap-2'
          )}>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "icon"}
              onClick={() => fetchUsers(true)}
              disabled={isRefreshing}
              className={cn(
                'transition-all duration-200 active:scale-95',
                isMobile && 'h-9 px-3'
              )}
              title="Refresh users data"
            >
              <RefreshCw className={cn(
                'transition-transform duration-200',
                isRefreshing ? 'animate-spin' : '',
                isMobile ? 'h-4 w-4 mr-2' : 'h-4 w-4'
              )} />
              {isMobile && 'Refresh'}
            </Button>
            {!isMobile && (
              <Button variant="outline" onClick={handleExportUsers}>
                <Download className="mr-2 h-4 w-4" />
                Export Users
              </Button>
            )}
            <Button
              onClick={handleAddUser}
              className={cn(
                'transition-all duration-200 active:scale-95',
                isMobile ? 'flex-1 justify-center' : ''
              )}
            >
              <Plus className="mr-2 h-4 w-4" />
              {isMobile ? 'Add User' : 'Add User'}
            </Button>
          </div>
        )}
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
                  Total Users
                </p>
                <p className={cn(
                  'font-bold',
                  isMobile ? 'text-xl' : 'text-2xl'
                )}>
                  {stats.total}
                </p>
              </div>
              <UsersIcon className={cn(
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
                  Active
                </p>
                <p className={cn(
                  'font-bold text-green-600',
                  isMobile ? 'text-xl' : 'text-2xl'
                )}>
                  {stats.active}
                </p>
              </div>
              <div className="h-3 w-3 rounded-full bg-green-600" />
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
                  Inactive
                </p>
                <p className={cn(
                  'font-bold text-gray-600',
                  isMobile ? 'text-xl' : 'text-2xl'
                )}>
                  {stats.inactive}
                </p>
              </div>
              <div className="h-3 w-3 rounded-full bg-gray-600" />
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
                  Administrators
                </p>
                <p className={cn(
                  'font-bold text-red-600',
                  isMobile ? 'text-xl' : 'text-2xl'
                )}>
                  {stats.admins}
                </p>
              </div>
              <div className="h-3 w-3 rounded-full bg-red-600" />
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
            role: roleFilter,
            status: statusFilter,
          }}
          onFilterChange={(key, value) => {
            if (key === 'role') setRoleFilter(value);
            if (key === 'status') setStatusFilter(value);
          }}
          filterOptions={[
            {
              key: 'role',
              label: 'Role',
              options: [
                { value: 'admin', label: 'Admin' },
                { value: 'manager', label: 'Manager' },
                { value: 'staff', label: 'Staff' },
                { value: 'technician', label: 'Technician' },
                { value: 'customer', label: 'Customer' },
              ],
            },
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
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
          resultCount={filteredUsers.length}
          totalCount={users.length}
        />
      )}

      {/* Users List */}
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
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(
          'transition-all duration-200',
          isMobile && 'p-4'
        )}>
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <Card
                  key={user.id}
                  className={cn(
                    'transition-all duration-200 hover:shadow-md',
                    isMobile && 'active:scale-[0.98] shadow-sm'
                  )}
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
                          <h3 className={cn(
                            'font-semibold truncate',
                            isMobile ? 'text-base' : 'text-lg'
                          )}>
                            {user.name}
                          </h3>
                          {getRoleBadge(user.role)}
                          {user.active ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                              Inactive
                            </Badge>
                          )}
                          {user.id === currentUser?.id && (
                            <Badge variant="secondary" className="text-xs">You</Badge>
                          )}
                        </div>
                        <p className={cn(
                          'text-muted-foreground truncate',
                          isMobile ? 'text-sm' : 'text-sm'
                        )}>
                          {user.email}
                        </p>
                        <div className={cn(
                          'flex items-center gap-2 text-muted-foreground',
                          isMobile ? 'text-xs flex-wrap' : 'text-sm'
                        )}>
                          {user.region && <span>Region: {user.region}</span>}
                          {user.region && user.serviceCenter && <span>•</span>}
                          {user.serviceCenter && <span>Service Center: {user.serviceCenter}</span>}
                        </div>
                      </div>
                      {canManageUsers && user.id !== currentUser?.id && (
                        <div className={cn(
                          'flex gap-1',
                          isMobile ? 'w-full justify-end' : 'flex gap-2'
                        )}>
                          <Button
                            variant="outline"
                            size={isMobile ? "sm" : "sm"}
                            onClick={() => handleEditUser(user)}
                            className="transition-all duration-200 active:scale-95"
                          >
                            <Edit className={cn(
                              'mr-1',
                              isMobile ? 'h-3 w-3' : 'h-3 w-3'
                            )} />
                            {isMobile ? '' : 'Edit'}
                          </Button>
                          <Button
                            variant="outline"
                            size={isMobile ? "sm" : "sm"}
                            onClick={() => handleToggleStatus(user)}
                            className={cn(
                              'transition-all duration-200 active:scale-95',
                              user.active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                            )}
                          >
                            {user.active ? (isMobile ? 'Deactivate' : 'Deactivate') : (isMobile ? 'Activate' : 'Activate')}
                          </Button>
                          <Button
                            variant="outline"
                            size={isMobile ? "sm" : "sm"}
                            onClick={() => handleDeleteClick(user)}
                            className="text-red-600 hover:text-red-700 transition-all duration-200 active:scale-95"
                          >
                            <Trash2 className={cn(
                              isMobile ? 'h-3 w-3' : 'h-3 w-3'
                            )} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Dialog */}
      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
        onSuccess={fetchUsers}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user <strong>{userToDelete?.name}</strong> and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
