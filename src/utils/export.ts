import type { Complaint } from '@/types';

export const exportToCSV = (complaints: Complaint[], filename: string = 'complaints') => {
  const headers = [
    'Ticket Number',
    'Title',
    'Status',
    'Priority',
    'Category',
    'Customer Name',
    'Customer Phone',
    'Customer Email',
    'Region',
    'Service Center',
    'Assigned To',
    'Created Date',
    'Updated Date',
    'Resolved Date',
    'Description'
  ];

  const rows = complaints.map(c => [
    c.ticketNumber,
    c.title,
    c.status,
    c.priority,
    c.category,
    c.customerName,
    c.customerPhone,
    c.customerEmail || '',
    c.region,
    c.serviceCenter,
    c.assignedToName || 'Unassigned',
    new Date(c.createdAt).toLocaleString(),
    new Date(c.updatedAt).toLocaleString(),
    c.resolvedAt ? new Date(c.resolvedAt).toLocaleString() : '',
    `"${c.description.replace(/"/g, '""')}"`
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (complaints: Complaint[], filename: string = 'complaints') => {
  const jsonContent = JSON.stringify(complaints, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};