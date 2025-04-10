import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { MenuItem as MenuItemType } from "@/contexts/CartContext";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
interface MenuItemProps {
  item: MenuItemType;
  onAddToCart: (item: MenuItemType) => void;
}
export function MenuItem({
  item,
  onAddToCart
}: MenuItemProps) {
  const {
    language,
    t
  } = useLanguage();
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
  const discountedPrice = getDiscountedPrice();
  return <Card className="group relative flex flex-col h-full overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg animate-fade-in">
      <div className="relative overflow-hidden bg-muted">
        <AspectRatio ratio={4 / 3}>
          {item.image ? <img src={item.image} alt={displayName} className="h-full w-full object-contain" /> : <div className="absolute inset-0 flex items-center justify-center bg-accent/10">
              <span className="text-muted-foreground">No image</span>
            </div>}
          {item.discount_percentage && <Badge variant="destructive" className="absolute top-2 right-2 z-10 bg-red-500 text-white whitespace-nowrap">
              {item.discount_percentage}% OFF
            </Badge>}
        </AspectRatio>
      </div>

      <div className="flex flex-col flex-grow p-4 space-y-3">
        <div>
          <h3 className="font-medium text-lg leading-tight mb-1 line-clamp-2">
            {displayName}
          </h3>
          {displayDescription && <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
              {displayDescription}
            </p>}
        </div>

        <div className="flex flex-col gap-2 mt-auto pt-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {discountedPrice ? <>
                  <span className="text-sm line-through text-muted-foreground">
                    ${item.price.toFixed(2)}
                  </span>
                  <span className="text-lg font-bold text-red-500">
                    ${discountedPrice.toFixed(2)}
                  </span>
                </> : <span className="text-lg font-bold">
                  ${item.price.toFixed(2)}
                </span>}
            </div>
            <Badge variant={item.remaining_quantity === 0 ? "destructive" : "secondary"} className="text-xs whitespace-nowrap">
              {getQuantityDisplay()}
            </Badge>
          </div>

          <Button onClick={() => onAddToCart(item)} className="w-full bg-primary hover:bg-primary/90 text-white" disabled={item.remaining_quantity === 0}>
            <Plus className="w-4 h-4 mr-2" />
            {t('item.add')}
          </Button>
        </div>
      </div>
    </Card>;
}