
import { Menu } from "@/components/Menu";
import { useMenuRealtime } from "@/hooks/useMenuRealtime";

const Index = () => {
  // Use our centralized hook for real-time updates
  useMenuRealtime();

  return <Menu />;
};

export default Index;
