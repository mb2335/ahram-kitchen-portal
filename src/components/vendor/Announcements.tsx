import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Announcement } from './types';

export function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const session = useSession();
  const { toast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session?.user?.id)
        .single();

      if (vendorError) throw vendorError;

      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('vendor_id', vendorData.id);

      if (error) throw error;
      setAnnouncements(data as Announcement[]);
    } catch (error: any) {
      toast({
        title: 'Error fetching announcements',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const createAnnouncement = async (announcement: Omit<Announcement, 'id' | 'created_at'>) => {
    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session?.user?.id)
        .single();

      if (vendorError) throw vendorError;

      const { error } = await supabase
        .from('announcements')
        .insert([{ ...announcement, vendor_id: vendorData.id }]);

      if (error) throw error;
      fetchAnnouncements();
    } catch (error: any) {
      toast({
        title: 'Error creating announcement',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAnnouncements();
    } catch (error: any) {
      toast({
        title: 'Error deleting announcement',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">Announcements</h2>
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="border rounded p-4">
            <h3 className="font-semibold">{announcement.title}</h3>
            <p>{announcement.content}</p>
            <div className="flex justify-between">
              <Button variant="destructive" onClick={() => deleteAnnouncement(announcement.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button onClick={() => createAnnouncement({ title: 'New Announcement', content: 'Content here', vendor_id: '', is_active: true, start_date: null, end_date: null, created_at: null })}>
        Add Announcement
      </Button>
    </div>
  );
}
