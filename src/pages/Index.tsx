
import { Menu } from "@/components/Menu";
import { useRealtimeMenuUpdates } from "@/hooks/useRealtimeMenuUpdates";

const Index = () => {
  // Use our centralized real-time updates hook
  useRealtimeMenuUpdates();

  return <Menu />;
};

export default Index;
