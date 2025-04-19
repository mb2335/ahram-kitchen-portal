
import { useEffect, useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useVendorId() {
  const session = useSession();
  const [vendorId, setVendorId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["vendor-id", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from("vendors")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching vendor:", error);
        throw error;
      }

      return data?.id || null;
    },
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    setVendorId(data || null);
  }, [data]);

  return { vendorId };
}
