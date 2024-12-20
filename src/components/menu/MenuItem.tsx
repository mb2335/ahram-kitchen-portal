import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { MenuItem as MenuItemType } from "@/contexts/CartContext";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MenuItemProps {
  item: MenuItemType & { remainingQuantity?: number | null };
  onAddToCart: (item: MenuItemType) => void;
}

export function MenuItem({ item, onAddToCart }: MenuItemProps) {
  const { language, t } = useLanguage();
  const displayName = language === 'en' ? item.name : item.nameKo;
  const displayDescription = language === 'en' ? item.description : item.descriptionKo;

  const isOutOfStock = item.remainingQuantity !== null && item.remainingQuantity <= 0;

  const getRemainingLabel = () => {
    if (item.remainingQuantity === null) return "No Limit";
    if (item.remainingQuantity <= 0) return "0 remaining";
    return `${item.remainingQuantity} remaining`;
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
        <div className="mb-2 flex justify-between items-start">
          <h3 className="text-lg font-medium">
            {displayName}
          </h3>
          <Badge variant="secondary">
            {getRemainingLabel()}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {displayDescription}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-primary">${item.price}</span>
          <Button 
            onClick={() => onAddToCart(item)}
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={isOutOfStock}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('item.add')}
          </Button>
        </div>
      </div>
    </Card>
  );
}