import { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import type { Announcement } from '../vendor/types';

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

  const { data: vendorData } = useQuery({
    queryKey: ['vendor'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', session?.user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('vendor_id', vendorData?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!vendorData?.id,
  });

  const createAnnouncement = useMutation({
    mutationFn: async (newAnnouncement: Omit<Announcement, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('announcements')
        .insert([{ ...newAnnouncement, vendor_id: vendorData?.id }])
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
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAnnouncement.mutate(newAnnouncement as Omit<Announcement, 'id' | 'created_at'>);
  };

  if (!announcements) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Create New Announcement</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Title (English)"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Input
              placeholder="Title (Korean)"
              value={newAnnouncement.title_ko}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title_ko: e.target.value })}
            />
          </div>
          <div>
            <Textarea
              placeholder="Content (English)"
              value={newAnnouncement.content}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
              required
            />
          </div>
          <div>
            <Textarea
              placeholder="Content (Korean)"
              value={newAnnouncement.content_ko}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content_ko: e.target.value })}
            />
          </div>
          <Button type="submit" disabled={createAnnouncement.isPending}>
            {createAnnouncement.isPending ? 'Creating...' : 'Create Announcement'}
          </Button>
        </form>
      </Card>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="p-6">
            <h3 className="font-semibold">{announcement.title}</h3>
            {announcement.title_ko && (
              <h4 className="text-gray-600">{announcement.title_ko}</h4>
            )}
            <p className="mt-2">{announcement.content}</p>
            {announcement.content_ko && (
              <p className="text-gray-600 mt-1">{announcement.content_ko}</p>
            )}
            <div className="mt-4 text-sm text-gray-500">
              Created: {new Date(announcement.created_at!).toLocaleDateString()}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}