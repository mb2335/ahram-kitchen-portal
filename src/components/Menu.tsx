import { useLanguage } from "@/contexts/LanguageContext";
import { useCart, MenuItem } from "@/contexts/CartContext";
import { MenuGrid } from "./menu/MenuGrid";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export function Menu() {
  const { t } = useLanguage();
  const { addItem } = useCart();

  const { data: menuItems = [], isLoading, error } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      console.log('Fetching menu items...');
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true);

      if (error) {
        console.error('Error fetching menu items:', error);
        throw error;
      }

      console.log('Fetched menu items:', data);

      if (!data || data.length === 0) {
        console.log('No menu items found');
        return [];
      }

      return data.map(item => ({
        id: item.id,
        name: item.name,
        nameKo: item.name_ko,
        description: item.description || '',
        descriptionKo: item.description_ko || '',
        price: Number(item.price),
        image: item.image || '/placeholder.svg',
        category: item.category
      }));
    }
  });

  if (error) {
    console.error('Error in menu component:', error);
    toast({
      title: "Error",
      description: "Failed to load menu items. Please try again later.",
      variant: "destructive",
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

  if (!menuItems || menuItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">{t('menu.title')}</h1>
        <div className="text-center">No menu items available.</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">{t('menu.title')}</h1>
      <MenuGrid items={menuItems} onAddToCart={addItem} />
    </div>
  );
}