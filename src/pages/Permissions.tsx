import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Shield, Users, FileText, BarChart3, Settings as SettingsIcon, Check, X, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Permission {
  resource: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

interface RolePermissions {
  [key: string]: Permission[];
}

export default function Permissions() {
  const { userRole } = useAuth();
  const [permissions, setPermissions] = useState<RolePermissions>({
    admin: [
      { resource: 'Complaints', view: true, create: true, edit: true, delete: true },
      { resource: 'Users', view: true, create: true, edit: true, delete: true },
      { resource: 'Reports', view: true, create: true, edit: true, delete: true },
      { resource: 'Settings', view: true, create: true, edit: true, delete: true },
      { resource: 'Analytics', view: true, create: true, edit: true, delete: true },
    ],
    manager: [
      { resource: 'Complaints', view: true, create: true, edit: true, delete: false },
      { resource: 'Users', view: true, create: false, edit: false, delete: false },
      { resource: 'Reports', view: true, create: true, edit: true, delete: false },
      { resource: 'Settings', view: false, create: false, edit: false, delete: false },
      { resource: 'Analytics', view: true, create: false, edit: false, delete: false },
    ],
    staff: [
      { resource: 'Complaints', view: true, create: true, edit: true, delete: false },
      { resource: 'Users', view: false, create: false, edit: false, delete: false },
      { resource: 'Reports', view: true, create: false, edit: false, delete: false },
      { resource: 'Settings', view: false, create: false, edit: false, delete: false },
      { resource: 'Analytics', view: false, create: false, edit: false, delete: false },
    ],
    customer: [
      { resource: 'Complaints', view: true, create: true, edit: false, delete: false },
      { resource: 'Users', view: false, create: false, edit: false, delete: false },
      { resource: 'Reports', view: false, create: false, edit: false, delete: false },
      { resource: 'Settings', view: false, create: false, edit: false, delete: false },
      { resource: 'Analytics', view: false, create: false, edit: false, delete: false },
    ],
  });

  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load permissions from backend, fallback to defaults if not found
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      console.log('Loading permissions from backend...');
      const response = await fetch('/api/permissions');
      const data = await response.json();

      console.log('Permissions API response:', data);

      if (!response.ok) {
        console.error('Error loading permissions:', data.error);
        return;
      }

      if (data.success && data.data) {
        const permissionsData = data.data;
        console.log('Permissions data:', permissionsData);

        if (typeof permissionsData === 'object' && permissionsData !== null) {
          setPermissions(permissionsData as any);
          console.log('Permissions loaded successfully');
        } else {
          console.warn('Invalid permissions data format, using defaults');
        }
      } else {
        console.log('No permissions data found, using defaults');
      }
    } catch (error: any) {
      console.error('Error loading permissions:', error);
    }
  };

  const togglePermission = (resource: string, action: keyof Omit<Permission, 'resource'>) => {
    setPermissions(prev => ({
      ...prev,
      [selectedRole]: prev[selectedRole].map(p =>
        p.resource === resource ? { ...p, [action]: !p[action] } : p
      )
    }));
  };

  const canManagePermissions = userRole === 'admin';

  const savePermissions = async () => {
    if (!canManagePermissions) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can modify permissions',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: permissions,
          updated_by: 'admin'
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to save permissions');
      if (!data.success) throw new Error('Failed to save permissions');

      toast({
        title: 'Permissions saved',
        description: `Permissions for ${selectedRole} role have been updated`
      });
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

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      admin: "destructive",
      manager: "default",
      staff: "secondary",
      customer: "outline",
    };
    return <Badge variant={variants[role]}>{role}</Badge>;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-5 w-5" />;
      case 'manager':
        return <BarChart3 className="h-5 w-5" />;
      case 'staff':
        return <FileText className="h-5 w-5" />;
      case 'customer':
        return <Users className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full system access and management capabilities';
      case 'manager':
        return 'Can manage complaints and view reports in their region';
      case 'staff':
        return 'Can handle and resolve customer complaints';
      case 'customer':
        return 'Can create and view their own complaints';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permission Management</h1>
        <p className="text-muted-foreground">Manage role-based access control and permissions</p>
      </div>

      {!canManagePermissions && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You are viewing permissions in read-only mode. Only administrators can modify permission settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Role Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.keys(permissions).map((role) => (
          <Card
            key={role}
            className={`cursor-pointer transition-all ${
              selectedRole === role ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedRole(role)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                {getRoleIcon(role)}
                {getRoleBadge(role)}
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold capitalize mb-1">{role}</h3>
              <p className="text-xs text-muted-foreground">{getRoleDescription(role)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Permission Matrix - {getRoleBadge(selectedRole)}
              </CardTitle>
              <CardDescription>
                Configure access permissions for the {selectedRole} role
              </CardDescription>
            </div>
            <Button onClick={savePermissions} disabled={loading || !canManagePermissions}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead className="text-center">View</TableHead>
                <TableHead className="text-center">Create</TableHead>
                <TableHead className="text-center">Edit</TableHead>
                <TableHead className="text-center">Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions[selectedRole].map((permission) => (
                <TableRow key={permission.resource}>
                  <TableCell className="font-medium">{permission.resource}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={permission.view}
                      onCheckedChange={() => togglePermission(permission.resource, 'view')}
                      disabled={!canManagePermissions}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={permission.create}
                      onCheckedChange={() => togglePermission(permission.resource, 'create')}
                      disabled={!permission.view || !canManagePermissions}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={permission.edit}
                      onCheckedChange={() => togglePermission(permission.resource, 'edit')}
                      disabled={!permission.view || !canManagePermissions}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={permission.delete}
                      onCheckedChange={() => togglePermission(permission.resource, 'delete')}
                      disabled={!permission.view || !canManagePermissions}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Permission Details */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Capabilities</CardTitle>
          <CardDescription>Role-specific features and restrictions</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="admin" value={selectedRole} onValueChange={setSelectedRole}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="admin">Admin</TabsTrigger>
              <TabsTrigger value="manager">Manager</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="customer">Customer</TabsTrigger>
            </TabsList>

            <TabsContent value="admin" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Full system administration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">User and role management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">System configuration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Access to all reports and analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Audit log access</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="manager" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Regional complaint management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Team performance monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Generate regional reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Cannot modify system settings</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Cannot delete complaints</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="staff" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Handle assigned complaints</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Update complaint status</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Add notes and attachments</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Cannot access user management</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Limited report access</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="customer" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Submit new complaints</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">View own complaint history</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Track complaint status</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Cannot view other customers' complaints</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-sm">No access to system features</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
