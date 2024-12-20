import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { MenuGrid } from "./menu/MenuGrid";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useOrderQuantities } from "@/hooks/useOrderQuantities";
import { useMenuRealtime } from "@/hooks/useMenuRealtime";
import { toast } from "@/components/ui/use-toast";

export function Menu() {
  const { t } = useLanguage();
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
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-600">
          Failed to load menu items. Please try again later.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading menu items...</div>
      </div>
    );
  }

  // Process menu items with remaining quantities
  const processedMenuItems = menuItems.map(item => {
    const orderedQuantity = orderQuantities[item.id] || 0;
    const remainingQuantity = item.quantity_limit 
      ? Math.max(0, item.quantity_limit - orderedQuantity)
      : null;

    return {
      ...item,
      remaining_quantity: remainingQuantity
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('menu.title')}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('menu.description')}
          </p>
        </div>
        <MenuGrid items={processedMenuItems} onAddToCart={addItem} />
      </div>
    </div>
  );
}