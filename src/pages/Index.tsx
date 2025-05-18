
import { Menu } from "@/components/Menu";
import { useMenuChannel } from "@/hooks/menu/useMenuChannel";

const Index = () => {
  // Use the centralized menu channel hook for realtime updates
  useMenuChannel();

  return <Menu />;
};

export default Index;
