import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { MenuGrid } from "./menu/MenuGrid";
import { useMenuItems } from "@/hooks/useMenuItems";
import { toast } from "@/hooks/use-toast";
import { LoadingState } from "./shared/LoadingState";
import { ErrorState } from "./shared/ErrorState";
import { MenuHeader } from "./menu/MenuHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function Menu() {
  const { addItem } = useCart();
  const { language } = useLanguage();
  const { data: menuItems = [], isLoading: menuLoading, error: menuError } = useMenuItems();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      return data;
    },
  });

  if (menuError) {
    console.error('Error in menu component:', menuError);
    toast({
      title: "Error",
      description: "Failed to load menu items. Please try again later.",
      variant: "destructive"
    });
    return <ErrorState message="Failed to load menu items. Please try again later." />;
  }

  if (menuLoading || categoriesLoading) {
    return <LoadingState />;
  }

  // Group items by category
  const itemsByCategory = menuItems.reduce((acc, item) => {
    const categoryId = item.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MenuHeader />
        <div className="space-y-12">
          {categories.map((category) => (
            itemsByCategory[category.id] && (
              <div key={category.id} className="space-y-4">
                <h2 className="text-2xl font-semibold">
                  {language === 'en' ? category.name : category.name_ko}
                </h2>
                <MenuGrid items={itemsByCategory[category.id]} onAddToCart={addItem} />
              </div>
            )
          ))}
          {itemsByCategory['uncategorized'] && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Menu</h2>
              <MenuGrid items={itemsByCategory['uncategorized']} onAddToCart={addItem} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}