import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { MenuItem as MenuItemType } from "@/contexts/CartContext";
import { Plus } from "lucide-react";
import { useCallback } from "react";

interface MenuItemProps {
  item: MenuItemType;
  onAddToCart: (item: MenuItemType) => void;
}

export function MenuItem({ item, onAddToCart }: MenuItemProps) {
  const { language, t } = useLanguage();
  
  const displayName = useCallback(() => {
    return language === 'en' ? item.name : item.nameKo;
  }, [language, item.name, item.nameKo]);

  const displayDescription = useCallback(() => {
    return language === 'en' ? item.description : item.descriptionKo;
  }, [language, item.description, item.descriptionKo]);

  return (
    <Card className="group overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg animate-fade-in">
      <div className="aspect-w-16 aspect-h-9 relative overflow-hidden">
        {item.image && (
          <img
            src={item.image}
            alt={displayName()}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-4">
        <div className="mb-2">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded">
            {item.category}
          </span>
        </div>
        <h3 className="text-lg font-medium mb-1">
          {displayName()}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {displayDescription()}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-primary">${item.price}</span>
          <Button 
            onClick={() => onAddToCart(item)}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('item.add')}
          </Button>
        </div>
      </div>
    </Card>
  );
}