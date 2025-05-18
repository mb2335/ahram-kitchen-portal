
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { LoadingState } from "./shared/LoadingState";
import { ErrorState } from "./shared/ErrorState";
import { MenuHeader } from "./menu/MenuHeader";
import { CategorySection } from "./menu/CategorySection";
import { useMenuCategories } from "@/hooks/menu/useMenuCategories";
import { useRealtimeMenuUpdates } from "@/hooks/menu/useRealtimeMenuUpdates";

export function Menu() {
  const { addItem } = useCart();
  const { data: menuItems = [], isLoading: menuLoading, error: menuError } = useMenuItems();
  const { categories, itemsByCategory, isLoading: categoriesLoading } = useMenuCategories(menuItems);
  
  // Set up realtime subscriptions
  useRealtimeMenuUpdates();

  useEffect(() => {
    if (menuError) {
      toast({
        title: "Error",
        description: "Failed to load menu items. Please try again later.",
        variant: "destructive"
      });
    }
  }, [menuError]);

  if (menuError) {
    return <ErrorState message="Failed to load menu items. Please try again later." />;
  }

  if (menuLoading || categoriesLoading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MenuHeader />
        <div className="space-y-12">
          {categories.map((category) => (
            itemsByCategory[category.id] && (
              <CategorySection
                key={category.id}
                category={category}
                items={itemsByCategory[category.id]}
                onAddToCart={addItem}
              />
            )
          ))}
          {itemsByCategory['uncategorized'] && (
            <CategorySection
              category={{ id: 'uncategorized', name: 'Menu', name_ko: '메뉴' }}
              items={itemsByCategory['uncategorized']}
              onAddToCart={addItem}
            />
          )}
        </div>
      </div>
    </div>
  );
}
