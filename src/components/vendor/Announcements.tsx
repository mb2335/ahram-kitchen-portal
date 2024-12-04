import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export function Announcements() {
  const session = useSession();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Announcements</h2>
        <Button>New Announcement</Button>
      </div>
      <div className="grid gap-4">
        {announcements.map((announcement: any) => (
          <div
            key={announcement.id}
            className="p-4 border rounded-lg bg-white shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{announcement.title}</h3>
                <p className="text-gray-600">{announcement.content}</p>
                {announcement.title_ko && (
                  <div className="mt-2">
                    <h4 className="font-semibold">{announcement.title_ko}</h4>
                    <p className="text-gray-600">{announcement.content_ko}</p>
                  </div>
                )}
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}