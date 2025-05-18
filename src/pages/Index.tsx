
import { Menu } from "@/components/Menu";
import { useRealtimeMenuUpdates } from "@/hooks/useRealtimeMenuUpdates";

const Index = () => {
  // Use the centralized real-time updates hook
  // This will establish a single shared connection, not a new one per component
  useRealtimeMenuUpdates();

  return <Menu />;
};

export default Index;
