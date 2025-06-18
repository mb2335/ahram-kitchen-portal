
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { MenuItem as MenuItemType } from "@/contexts/CartContext";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { calculateDiscountedPrice, formatPrice } from "@/utils/priceUtils";
import { useState } from "react";

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
  const [isExpanded, setIsExpanded] = useState(false);
  
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
  
  // Use the utility function for consistent discount calculation
  const discountedPrice = calculateDiscountedPrice(item.price, item.discount_percentage);
  
  // Check if description is long enough to need expansion
  const needsExpansion = displayDescription && displayDescription.length > 60;
  
  return (
    <Card className="group relative flex flex-col h-full min-h-[400px] overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg animate-fade-in">
      <div className="relative overflow-hidden bg-muted">
        <AspectRatio ratio={4 / 3}>
          {item.image ? (
            <img 
              src={item.image} 
              alt={displayName} 
              className="h-full w-full object-cover" 
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-accent/10">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}
          
          {item.discount_percentage && item.discount_percentage > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute top-3 right-3 z-10 bg-red-500 text-white font-semibold"
            >
              {item.discount_percentage}% OFF
            </Badge>
          )}
        </AspectRatio>
      </div>

      <div className="flex flex-col flex-grow p-4">
        {/* Title Section - Fixed Height */}
        <div className="h-12 flex items-center justify-center mb-2">
          <h3 className="font-semibold text-lg leading-tight text-center line-clamp-2">
            {displayName}
          </h3>
        </div>

        {/* Description Section - Dynamic Height */}
        <div className="mb-3">
          {displayDescription ? (
            <div className="space-y-2">
              <p className={`text-sm text-muted-foreground leading-relaxed text-center transition-all duration-300 ${
                isExpanded ? '' : 'line-clamp-1'
              }`}>
                {displayDescription}
              </p>
              {needsExpansion && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 mx-auto"
                >
                  {isExpanded ? (
                    <>
                      Show less <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      Read more <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="h-4"></div>
          )}
        </div>

        {/* Footer Section - Push to bottom with consistent alignment */}
        <div className="mt-auto space-y-3">
          {/* Price and Quantity Section - Horizontal Layout */}
          <div className="flex items-center justify-between gap-3">
            {/* Price Section */}
            <div className="flex-1">
              {discountedPrice ? (
                <div className="space-y-1">
                  <div className="text-sm line-through text-muted-foreground">
                    ${item.price.toFixed(2)}
                  </div>
                  <div className="text-xl font-bold text-red-500">
                    ${discountedPrice.toFixed(2)}
                  </div>
                </div>
              ) : (
                <div className="text-xl font-bold">
                  ${item.price.toFixed(2)}
                </div>
              )}
            </div>

            {/* Stock Badge */}
            <div className="flex-shrink-0">
              <Badge 
                variant={item.remaining_quantity === 0 ? "destructive" : "secondary"} 
                className="text-xs px-3 py-1"
              >
                {getQuantityDisplay()}
              </Badge>
            </div>
          </div>

          {/* Add to Cart Button - Fixed Height */}
          <div className="h-10">
            <Button 
              onClick={() => onAddToCart(item)} 
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium h-full" 
              disabled={item.remaining_quantity === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('item.add')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
