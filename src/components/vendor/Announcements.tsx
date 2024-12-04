import { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Announcement } from './types';
import { format } from 'date-fns';

export function Announcements() {
  const session = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    title_ko: '',
    content: '',
    content_ko: '',
    is_active: true,
    start_date: null,
    end_date: null,
  });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session?.user.id)
        .single();

      if (vendorError) throw vendorError;

      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user.id,
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (announcement: Omit<Announcement, 'id' | 'created_at'>) => {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session?.user.id)
        .single();

      if (vendorError) throw vendorError;

      const { data, error } = await supabase
        .from('announcements')
        .insert([{ ...announcement, vendor_id: vendorData.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setNewAnnouncement({
        title: '',
        title_ko: '',
        content: '',
        content_ko: '',
        is_active: true,
        start_date: null,
        end_date: null,
      });
      toast({
        title: 'Success',
        description: 'Announcement created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAnnouncementMutation.mutate(newAnnouncement);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              placeholder="Title (English)"
              value={newAnnouncement.title}
              onChange={(e) =>
                setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Input
              placeholder="Title (Korean)"
              value={newAnnouncement.title_ko}
              onChange={(e) =>
                setNewAnnouncement({ ...newAnnouncement, title_ko: e.target.value })
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Textarea
              placeholder="Content (English)"
              value={newAnnouncement.content}
              onChange={(e) =>
                setNewAnnouncement({ ...newAnnouncement, content: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Textarea
              placeholder="Content (Korean)"
              value={newAnnouncement.content_ko}
              onChange={(e) =>
                setNewAnnouncement({ ...newAnnouncement, content_ko: e.target.value })
              }
            />
          </div>
        </div>
        <Button type="submit" disabled={createAnnouncementMutation.isPending}>
          Create Announcement
        </Button>
      </form>

      <div className="space-y-4">
        {announcements?.map((announcement) => (
          <div
            key={announcement.id}
            className="border rounded-lg p-4 space-y-2"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{announcement.title}</h3>
                {announcement.title_ko && (
                  <h4 className="text-sm text-gray-600">{announcement.title_ko}</h4>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {format(new Date(announcement.created_at!), 'PPP')}
              </span>
            </div>
            <p>{announcement.content}</p>
            {announcement.content_ko && (
              <p className="text-sm text-gray-600">{announcement.content_ko}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}