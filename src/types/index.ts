export type UserRole = 'admin' | 'manager' | 'staff' | 'customer';

export type ComplaintStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical';

export type ComplaintCategory = 'power_outage' | 'billing' | 'connection' | 'meter' | 'maintenance' | 'other';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  region?: string;
  serviceCenter?: string;
  active: boolean;
  createdAt: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  title: string;
  description: string;
  region: string;
  serviceCenter: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  notes?: string;
}

export interface DashboardStats {
  totalComplaints: number;
  openComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  avgResolutionTime: number;
  criticalComplaints: number;
}

declare module 'express' {
  const value: any;
  export default value;
}

declare module 'cors' {
  const value: any;
  export default value;
}

declare module 'compression' {
  const value: any;
  export default value;
}
