
import { useEffect, useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSharedAdminAccess() {
  const session = useSession();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Check if user is a vendor (which now grants admin access)
  const { data: vendorData } = useQuery({
    queryKey: ["admin-access", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from("vendors")
        .select("id, business_name, email")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking admin access:", error);
        throw error;
      }

      return data;
    },
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    // All vendors now have shared admin access
    setIsAdmin(!!vendorData);
  }, [vendorData]);

  return { 
    isAdmin, 
    adminData: vendorData,
    currentUserId: session?.user?.id 
  };
}
