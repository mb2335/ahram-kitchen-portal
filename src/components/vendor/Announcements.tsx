import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface Announcement {
  id: string;
  title: string;
  title_ko?: string;
  content: string;
  content_ko?: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
}

export function Announcements() {
  const session = useSession();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    title_ko: '',
    content: '',
    content_ko: '',
    is_active: true,
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    try {
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session?.user?.id)
        .single();

      if (vendorData) {
        const { data } = await supabase
          .from('announcements')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .order('created_at', { ascending: false });
        setAnnouncements(data || []);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load announcements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session?.user?.id)
        .single();

      if (!vendorData) throw new Error('Vendor not found');

      const announcementData = {
        vendor_id: vendorData.id,
        title: formData.title,
        title_ko: formData.title_ko || null,
        content: formData.content,
        content_ko: formData.content_ko || null,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      let error;
      if (editingAnnouncement) {
        ({ error } = await supabase
          .from('announcements')
          .update(announcementData)
          .eq('id', editingAnnouncement.id));
      } else {
        ({ error } = await supabase
          .from('announcements')
          .insert([announcementData]));
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Announcement ${editingAnnouncement ? 'updated' : 'added'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingAnnouncement(null);
      resetForm();
      loadAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to save announcement',
        variant: 'destructive',
      });
    }
  }

  async function handleDelete(announcementId: string) {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Announcement deleted successfully',
      });

      loadAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete announcement',
        variant: 'destructive',
      });
    }
  }

  function handleEdit(announcement: Announcement) {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      title_ko: announcement.title_ko || '',
      content: announcement.content,
      content_ko: announcement.content_ko || '',
      is_active: announcement.is_active,
      start_date: announcement.start_date || '',
      end_date: announcement.end_date || '',
    });
    setIsDialogOpen(true);
  }

  function resetForm() {
    setFormData({
      title: '',
      title_ko: '',
      content: '',
      content_ko: '',
      is_active: true,
      start_date: '',
      end_date: '',
    });
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Announcements</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingAnnouncement(null);
              resetForm();
            }}>
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title (English)</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title_ko">Title (Korean)</Label>
                <Input
                  id="title_ko"
                  value={formData.title_ko}
                  onChange={(e) => setFormData({ ...formData, title_ko: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content (English)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content_ko">Content (Korean)</Label>
                <Textarea
                  id="content_ko"
                  value={formData.content_ko}
                  onChange={(e) => setFormData({ ...formData, content_ko: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingAnnouncement ? 'Update' : 'Create'} Announcement
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{announcement.title}</h3>
                {announcement.title_ko && (
                  <p className="text-sm text-gray-600">{announcement.title_ko}</p>
                )}
                <p className="mt-2">{announcement.content}</p>
                {announcement.content_ko && (
                  <p className="text-sm text-gray-600 mt-1">{announcement.content_ko}</p>
                )}
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  {announcement.start_date && (
                    <p>Starts: {new Date(announcement.start_date).toLocaleString()}</p>
                  )}
                  {announcement.end_date && (
                    <p>Ends: {new Date(announcement.end_date).toLocaleString()}</p>
                  )}
                </div>
                <Badge variant={announcement.is_active ? 'default' : 'secondary'} className="mt-2">
                  {announcement.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(announcement)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(announcement.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
