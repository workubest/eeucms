import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, User, Phone, Mail } from 'lucide-react';
import type { Complaint } from '@/types';

interface ModernComplaintCardProps {
  complaint: Complaint;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
}

export default function ModernComplaintCard({ 
  complaint, 
  isSelected, 
  onSelect, 
  onClick 
}: ModernComplaintCardProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-destructive/10 text-destructive border-destructive/20',
      in_progress: 'bg-primary/10 text-primary border-primary/20',
      pending: 'bg-warning/10 text-warning border-warning/20',
      resolved: 'bg-success/10 text-success border-success/20',
      closed: 'bg-muted text-muted-foreground border-border'
    };
    return colors[status] || colors.open;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-destructive text-destructive-foreground',
      high: 'bg-warning text-warning-foreground',
      medium: 'bg-primary text-primary-foreground',
      low: 'bg-secondary text-secondary-foreground'
    };
    return colors[priority] || colors.medium;
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-l-4 border-l-primary">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="mt-1"
          />
          
          <div className="flex-1 space-y-4 cursor-pointer" onClick={onClick}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-semibold text-primary">
                    {complaint.ticketNumber}
                  </span>
                  <Badge className={getStatusColor(complaint.status)}>
                    {complaint.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(complaint.priority)}>
                    {complaint.priority}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {complaint.title}
                </h3>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(complaint.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {complaint.description}
            </p>

            {/* Footer Info */}
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{complaint.customerName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{complaint.customerPhone}</span>
              </div>
              {complaint.customerEmail && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{complaint.customerEmail}</span>
                </div>
              )}
            </div>

            {complaint.assignedToName && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground">Assigned to:</span>
                <span className="text-xs font-medium">{complaint.assignedToName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
