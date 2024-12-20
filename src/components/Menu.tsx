import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { MenuGrid } from "./menu/MenuGrid";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useOrderQuantities } from "@/hooks/useOrderQuantities";
import { useMenuRealtime } from "@/hooks/useMenuRealtime";
import { toast } from "@/hooks/use-toast";
import { LoadingState } from "./shared/LoadingState";
import { ErrorState } from "./shared/ErrorState";
import { MenuHeader } from "./menu/MenuHeader";

export function Menu() {
  const { addItem } = useCart();
  
  const { data: menuItems = [], isLoading, error } = useMenuItems();
  const { data: orderQuantities = {}, refetch: refetchOrderQuantities } = useOrderQuantities();

  // Set up real-time subscriptions
  useMenuRealtime(refetchOrderQuantities);

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

  // Process menu items with remaining quantities
  const processedMenuItems = menuItems.map(item => {
    const orderedQuantity = orderQuantities[item.id] || 0;
    const remainingQuantity = item.quantity_limit 
      ? Math.max(0, item.quantity_limit - orderedQuantity)
      : null;

    return {
      ...item,
      remaining_quantity: remainingQuantity,
      quantity_limit: remainingQuantity
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MenuHeader />
        <MenuGrid items={processedMenuItems} onAddToCart={addItem} />
      </div>
    </div>
  );
}