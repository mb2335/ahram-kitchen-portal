import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { MenuItem as MenuItemType } from "@/contexts/CartContext";

interface MenuItemProps {
  item: MenuItemType;
  onAddToCart: (item: MenuItemType) => void;
}

export function MenuItem({ item, onAddToCart }: MenuItemProps) {
  const { language, t } = useLanguage();

  return (
    <Card className="overflow-hidden animate-fade-in">
      {item.image && (
        <img
          src={item.image}
          alt={language === 'en' ? item.name : item.nameKo}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold">
          {language === 'en' ? item.name : item.nameKo}
        </h3>
        <p className="text-gray-600 mt-2">
          {language === 'en' ? item.description : item.descriptionKo}
        </p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-lg font-bold">${item.price}</span>
          <Button onClick={() => onAddToCart(item)}>{t('item.add')}</Button>
        </div>
      </div>
    </Card>
  );
}