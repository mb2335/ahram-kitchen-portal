import React, { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { RealtimeChannel } from "@supabase/supabase-js";

type TableName = "menu_items" | "menu_categories" | "order_items" | "orders";
type QueryKey = string[];

type SubscriptionInfo = {
  refCount: number;
  queryKeys: Set<string>;
  refetchCallbacks: Map<string, () => void>;
};

interface RealtimeContextType {
  subscribe: (
    table: TableName,
    queryKey: QueryKey,
    refetchCallback?: () => void
  ) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
};

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const [channels, setChannels] = useState<{ [key: string]: RealtimeChannel }>(
    {}
  );
  const [subscriptions, setSubscriptions] = useState<{
    [key: string]: SubscriptionInfo;
  }>({});

  // Clean up all channels on unmount
  useEffect(() => {
    return () => {
      Object.values(channels).forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [channels]);

  const createChannelIfNeeded = (table: TableName) => {
    if (channels[table]) {
      return channels[table];
    }

    console.log(`Creating new channel for ${table}`);
    
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
          console.log(`Change detected in ${table}:`, payload);
          
          // Get subscription info for this table
          const subInfo = subscriptions[table];
          
          if (subInfo) {
            // Invalidate all related query keys
            subInfo.queryKeys.forEach((queryKeyString) => {
              const queryKey = JSON.parse(queryKeyString);
              queryClient.invalidateQueries({ queryKey });
            });
            
            // Trigger any refetch callbacks
            subInfo.refetchCallbacks.forEach((callback) => {
              callback();
            });
          }
        }
      )
      .on("system", { event: "error" }, () => {
        toast({
          title: "Connection Error",
          description: `Having trouble receiving ${table} updates. Please refresh the page.`,
          variant: "destructive",
        });
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`Successfully subscribed to ${table} updates`);
        } else if (status === "CHANNEL_ERROR") {
          console.error(`Failed to connect to ${table} updates`);
          toast({
            title: "Connection Error",
            description: `Failed to connect to ${table} updates. Please refresh the page.`,
            variant: "destructive",
          });
        }
      });

    setChannels((prev) => ({ ...prev, [table]: channel }));
    return channel;
  };

  const subscribe = (
    table: TableName,
    queryKey: QueryKey,
    refetchCallback?: () => void
  ) => {
    const queryKeyString = JSON.stringify(queryKey);
    const callbackId = refetchCallback ? Math.random().toString(36).substring(7) : "";

    setSubscriptions((prev) => {
      const existing = prev[table] || {
        refCount: 0,
        queryKeys: new Set(),
        refetchCallbacks: new Map(),
      };

      // Add query key to the set
      existing.queryKeys.add(queryKeyString);

      // Add refetch callback if provided
      if (refetchCallback) {
        existing.refetchCallbacks.set(callbackId, refetchCallback);
      }

      return {
        ...prev,
        [table]: {
          ...existing,
          refCount: existing.refCount + 1,
        },
      };
    });

    // Create channel if needed
    createChannelIfNeeded(table);

    // Return unsubscribe function
    return () => {
      setSubscriptions((prev) => {
        const existing = prev[table];
        if (!existing) return prev;

        const newRefCount = existing.refCount - 1;

        // If this was the last subscriber, remove query key and callback
        if (newRefCount === 0) {
          existing.queryKeys.delete(queryKeyString);
          if (refetchCallback) {
            existing.refetchCallbacks.delete(callbackId);
          }

          // Clean up channel if no more subscribers
          if (existing.queryKeys.size === 0) {
            const channel = channels[table];
            if (channel) {
              console.log(`Removing channel for ${table}`);
              supabase.removeChannel(channel);
              setChannels((prev) => {
                const { [table]: _, ...rest } = prev;
                return rest;
              });
            }
            
            // Remove subscription info
            const { [table]: _, ...rest } = prev;
            return rest;
          }
        }

        // Otherwise just decrement the ref count
        return {
          ...prev,
          [table]: {
            ...existing,
            refCount: newRefCount,
          },
        };
      });
    };
  };

  return (
    <RealtimeContext.Provider value={{ subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
};
