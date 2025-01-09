import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { MenuItem as MenuItemType } from "@/contexts/CartContext";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MenuItemProps {
  item: MenuItemType;
  onAddToCart: (item: MenuItemType) => void;
}

export function MenuItem({ item, onAddToCart }: MenuItemProps) {
  const { language, t } = useLanguage();
  const displayName = language === 'en' ? item.name : item.name_ko;
  const displayDescription = language === 'en' ? item.description : item.description_ko;

  const getQuantityDisplay = () => {
    if (item.remaining_quantity === 0) {
      return t('item.soldOut');
    }
    if (item.remaining_quantity === null) {
      return t('item.inStock');
    }
    return `${t('item.remainingStock')}: ${item.remaining_quantity}`;
  };

  const getDiscountedPrice = () => {
    if (!item.discount_percentage) return null;
    const discountMultiplier = (100 - item.discount_percentage) / 100;
    return item.price * discountMultiplier;
  };

  return (
    <Card className="group overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg animate-fade-in">
      <div className="aspect-w-16 aspect-h-9 relative overflow-hidden">
        {item.image && (
          <img
            src={item.image}
            alt={displayName}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium mb-1">
          {displayName}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {displayDescription}
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            {item.discount_percentage ? (
              <div className="flex items-center gap-2">
                <span className="text-lg line-through text-gray-400">${item.price.toFixed(2)}</span>
                <span className="text-lg font-bold text-red-500">
                  ${getDiscountedPrice()?.toFixed(2)}
                </span>
                <Badge variant="destructive" className="text-xs">
                  {item.discount_percentage}% OFF
                </Badge>
              </div>
            ) : (
              <span className="text-lg font-bold">${item.price.toFixed(2)}</span>
            )}
            <Badge 
              variant="secondary" 
              className="text-xs"
            >
              {getQuantityDisplay()}
            </Badge>
          </div>
          <Button 
            onClick={() => onAddToCart(item)}
            className="w-full bg-primary hover:bg-primary/90 text-white"
            disabled={item.remaining_quantity === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('item.add')}
          </Button>
        </div>
      </div>
    </Card>
  );
}