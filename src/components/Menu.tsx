import { useLanguage } from "@/contexts/LanguageContext";
import { useCart, MenuItem } from "@/contexts/CartContext";
import { MenuGrid } from "./menu/MenuGrid";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function Menu() {
  const { t } = useLanguage();
  const { addItem } = useCart();

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true);

      if (error) throw error;

      return data.map(item => ({
        id: item.id, // This is now a proper UUID from the database
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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading menu items...</div>
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