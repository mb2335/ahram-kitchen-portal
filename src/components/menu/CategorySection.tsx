import { useLanguage } from "@/contexts/LanguageContext";
import { MenuGrid } from "./MenuGrid";
import { MenuItem } from "@/contexts/CartContext";

interface CategorySectionProps {
  category: {
    id: string;
    name: string;
    name_ko: string;
  };
  items: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}

export function CategorySection({ category, items, onAddToCart }: CategorySectionProps) {
  const { language } = useLanguage();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">
        {language === 'en' ? category.name : category.name_ko}
      </h2>
      <MenuGrid items={items} onAddToCart={onAddToCart} />
    </div>
  );
}