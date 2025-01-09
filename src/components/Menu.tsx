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
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function Menu() {
  const { addItem } = useCart();
  const queryClient = useQueryClient();
  const { data: menuItems = [], isLoading: menuLoading, error: menuError } = useMenuItems();
  const { categories, itemsByCategory, isLoading: categoriesLoading } = useMenuCategories(menuItems);

  useEffect(() => {
    if (menuError) {
      toast({
        title: "Error",
        description: "Failed to load menu items. Please try again later.",
        variant: "destructive"
      });
    }
  }, [menuError]);

  useEffect(() => {
    // Subscribe to menu items changes
    const menuChannel = supabase
      .channel('menu-items-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'menu_items' 
        },
        (payload) => {
          console.log('Menu item updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['menu-items'] });
        }
      )
      .subscribe();

    // Subscribe to order items changes to update quantities
    const orderChannel = supabase
      .channel('order-items-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'order_items' 
        },
        () => {
          console.log('Order items changed, refreshing menu items');
          queryClient.invalidateQueries({ queryKey: ['menu-items'] });
        }
      )
      .subscribe();

    // Subscribe to category changes
    const categoryChannel = supabase
      .channel('menu-categories-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'menu_categories' 
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(categoryChannel);
    };
  }, [queryClient]);

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