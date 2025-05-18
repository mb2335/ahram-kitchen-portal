
import { Menu } from "@/components/Menu";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const Index = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to menu categories changes for real-time updates
    const categoryChannel = supabase
      .channel('public-categories-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'menu_categories' 
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
        }
      )
      .subscribe();

    // Subscribe to menu items changes for real-time updates
    const menuChannel = supabase
      .channel('public-menu-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'menu_items' 
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['menu-items'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(categoryChannel);
      supabase.removeChannel(menuChannel);
    };
  }, [queryClient]);

  return <Menu />;
};

export default Index;
