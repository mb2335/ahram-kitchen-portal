
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRealtimeMenuUpdates } from '@/hooks/useRealtimeMenuUpdates';

export const useMenuChannel = () => {
  const queryClient = useQueryClient();
  
  // Use our centralized real-time updates hook
  useRealtimeMenuUpdates();
};
