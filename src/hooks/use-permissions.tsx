import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

interface Permission {
  resource: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

const defaultPermissions = {
  admin: [
    { resource: 'Complaints', view: true, create: true, edit: true, delete: true },
    { resource: 'Users', view: true, create: true, edit: true, delete: true },
    { resource: 'Reports', view: true, create: true, edit: true, delete: true },
    { resource: 'Settings', view: true, create: true, edit: true, delete: true },
    { resource: 'Analytics', view: true, create: true, edit: true, delete: true },
    { resource: 'Permissions', view: true, create: true, edit: true, delete: true },
  ],
  manager: [
    { resource: 'Complaints', view: true, create: true, edit: true, delete: false },
    { resource: 'Users', view: true, create: false, edit: false, delete: false },
    { resource: 'Reports', view: true, create: true, edit: true, delete: false },
    { resource: 'Settings', view: false, create: false, edit: false, delete: false },
    { resource: 'Analytics', view: true, create: false, edit: false, delete: false },
    { resource: 'Permissions', view: false, create: false, edit: false, delete: false },
  ],
  staff: [
    { resource: 'Complaints', view: true, create: true, edit: true, delete: false },
    { resource: 'Users', view: false, create: false, edit: false, delete: false },
    { resource: 'Reports', view: true, create: false, edit: false, delete: false },
    { resource: 'Settings', view: false, create: false, edit: false, delete: false },
    { resource: 'Analytics', view: false, create: false, edit: false, delete: false },
    { resource: 'Permissions', view: false, create: false, edit: false, delete: false },
  ],
  customer: [
    { resource: 'Complaints', view: true, create: true, edit: false, delete: false },
    { resource: 'Users', view: false, create: false, edit: false, delete: false },
    { resource: 'Reports', view: false, create: false, edit: false, delete: false },
    { resource: 'Settings', view: false, create: false, edit: false, delete: false },
    { resource: 'Analytics', view: false, create: false, edit: false, delete: false },
    { resource: 'Permissions', view: false, create: false, edit: false, delete: false },
  ],
};

export function usePermissions() {
  const { userRole } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, [userRole]);

  const loadPermissions = async () => {
    if (!userRole) {
      setLoading(false);
      return;
    }

    // Use default permissions directly
    // TODO: Implement /api/system-settings endpoint if dynamic permissions are needed
    setPermissions(defaultPermissions[userRole as keyof typeof defaultPermissions] || []);
    setLoading(false);
  };

  const canView = (resource: string) => {
    const permission = permissions.find(p => p.resource.toLowerCase() === resource.toLowerCase());
    return permission?.view || false;
  };

  const canCreate = (resource: string) => {
    const permission = permissions.find(p => p.resource.toLowerCase() === resource.toLowerCase());
    return permission?.create || false;
  };

  const canEdit = (resource: string) => {
    const permission = permissions.find(p => p.resource.toLowerCase() === resource.toLowerCase());
    return permission?.edit || false;
  };

  const canDelete = (resource: string) => {
    const permission = permissions.find(p => p.resource.toLowerCase() === resource.toLowerCase());
    return permission?.delete || false;
  };

  return {
    permissions,
    loading,
    canView,
    canCreate,
    canEdit,
    canDelete
  };
}
