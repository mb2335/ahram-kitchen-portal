import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { MenuGrid } from "./menu/MenuGrid";
import { useMenuItems } from "@/hooks/useMenuItems";
import { toast } from "@/hooks/use-toast";
import { LoadingState } from "./shared/LoadingState";
import { ErrorState } from "./shared/ErrorState";
import { MenuHeader } from "./menu/MenuHeader";

export function Menu() {
  const { addItem } = useCart();
  const { data: menuItems = [], isLoading, error } = useMenuItems();

  if (error) {
    console.error('Error in menu component:', error);
    toast({
      title: "Error",
      description: "Failed to load menu items. Please try again later.",
      variant: "destructive"
    });
    return <ErrorState message="Failed to load menu items. Please try again later." />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MenuHeader />
        <MenuGrid items={menuItems} onAddToCart={addItem} />
      </div>
    </div>
  );
}