import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, File, Image as ImageIcon, FileText, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
  uploaded_by_name?: string;
}

interface AttachmentsListProps {
  complaintId: string;
  canDelete?: boolean;
  onUpdate?: () => void;
}

export default function AttachmentsList({ complaintId, canDelete = false, onUpdate }: AttachmentsListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttachments();
  }, [complaintId]);

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`/api/complaints/${complaintId}/attachments`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Error fetching attachments:', data.error);
        return;
      }

      if (data.success && data.data) {
        const attachmentsData = (data.data || []).map((a: any) => ({
          id: a.id,
          file_name: a.fileName || a.file_name,
          file_path: a.filePath || a.file_path,
          file_size: a.fileSize || a.file_size,
          file_type: a.fileType || a.file_type,
          created_at: a.createdAt || a.uploadedAt || a.created_at,
          uploaded_by_name: a.uploadedByName || a.uploaded_by_name || 'Unknown'
        }));

        setAttachments(attachmentsData);
      }
    } catch (error: any) {
      console.error('Error fetching attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (attachment: Attachment) => {
    try {
      const response = await fetch(`/api/attachments/${attachment.id}/download`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: 'Download failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const deleteFile = async (attachment: Attachment) => {
    try {
      const response = await fetch(`/api/attachments/${attachment.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Delete failed');
      if (!data.success) throw new Error('Delete failed');

      toast({
        title: 'Success',
        description: 'File deleted successfully'
      });

      fetchAttachments();
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading attachments...</div>;
  }

  if (attachments.length === 0) {
    return <p className="text-sm text-muted-foreground">No attachments</p>;
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          {getFileIcon(attachment.file_type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{attachment.file_name}</p>
            <p className="text-xs text-muted-foreground">
              {(attachment.file_size / 1024).toFixed(1)} KB • {new Date(attachment.created_at).toLocaleDateString()}
              {attachment.uploaded_by_name && ` • by ${attachment.uploaded_by_name}`}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => downloadFile(attachment)}
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteFile(attachment)}
                className="h-8 w-8 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}