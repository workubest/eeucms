import type { User, Complaint } from '@/types';

export const demoUsers: User[] = [
  {
    id: 'admin-001',
    email: 'admin@eeu.gov.et',
    name: 'System Administrator',
    role: 'admin',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'staff-001',
    email: 'staff.addis@eeu.gov.et',
    name: 'Addis Staff Member',
    role: 'staff',
    region: 'Addis Ababa',
    serviceCenter: 'Bole Service Center',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'manager-001',
    email: 'manager.oromia@eeu.gov.et',
    name: 'Oromia Manager',
    role: 'manager',
    region: 'Oromia',
    serviceCenter: 'Adama Service Center',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const demoComplaints: Complaint[] = [
  {
    id: 'cmp-001',
    ticketNumber: 'EEU-2025-001',
    customerId: 'cust-001',
    customerName: 'Abebe Kebede',
    customerPhone: '+251911234567',
    customerEmail: 'abebe.k@email.com',
    category: 'power_outage',
    priority: 'high',
    status: 'in_progress',
    title: 'Power outage in Bole area',
    description: 'No electricity for the past 6 hours in Bole sub-city, near Atlas area.',
    region: 'Addis Ababa',
    serviceCenter: 'Bole Service Center',
    assignedTo: 'staff-001',
    assignedToName: 'Addis Staff Member',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cmp-002',
    ticketNumber: 'EEU-2025-002',
    customerId: 'cust-002',
    customerName: 'Tigist Alemu',
    customerPhone: '+251922345678',
    category: 'billing',
    priority: 'medium',
    status: 'open',
    title: 'Incorrect billing amount',
    description: 'My electricity bill for this month is unusually high. Need clarification.',
    region: 'Addis Ababa',
    serviceCenter: 'Bole Service Center',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cmp-003',
    ticketNumber: 'EEU-2025-003',
    customerId: 'cust-003',
    customerName: 'Mulugeta Tesfaye',
    customerPhone: '+251933456789',
    category: 'meter',
    priority: 'critical',
    status: 'open',
    title: 'Faulty electricity meter',
    description: 'Meter is making unusual sounds and displaying incorrect readings.',
    region: 'Oromia',
    serviceCenter: 'Adama Service Center',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cmp-004',
    ticketNumber: 'EEU-2025-004',
    customerId: 'cust-004',
    customerName: 'Hanna Bekele',
    customerPhone: '+251944567890',
    customerEmail: 'hanna.b@email.com',
    category: 'connection',
    priority: 'low',
    status: 'resolved',
    title: 'New connection request',
    description: 'Request for new electricity connection for newly built house.',
    region: 'Addis Ababa',
    serviceCenter: 'Bole Service Center',
    assignedTo: 'staff-001',
    assignedToName: 'Addis Staff Member',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const demoActivities = [
  {
    id: 'act-001',
    action: 'Complaint created',
    userName: 'System Administrator',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ticketNumber: 'EEU-2025-001'
  },
  {
    id: 'act-002',
    action: 'Complaint assigned',
    userName: 'Addis Staff Member',
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    ticketNumber: 'EEU-2025-002'
  },
  {
    id: 'act-003',
    action: 'Status updated',
    userName: 'Addis Staff Member',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    ticketNumber: 'EEU-2025-003'
  },
  {
    id: 'act-004',
    action: 'Complaint resolved',
    userName: 'Addis Staff Member',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    ticketNumber: 'EEU-2025-004'
  },
];

export const demoCredentials = {
  admin: { email: 'admin@eeu.gov.et', password: '12345678' },
  staff: { email: 'staff.addis@eeu.gov.et', password: '12345678' },
  manager: { email: 'manager.oromia@eeu.gov.et', password: '12345678' },
};
