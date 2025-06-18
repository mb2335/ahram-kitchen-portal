
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { MenuItem as MenuItemType } from "@/contexts/CartContext";
import { Plus, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { calculateDiscountedPrice, formatPrice } from "@/utils/priceUtils";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  
  // Use the utility function for consistent discount calculation
  const discountedPrice = calculateDiscountedPrice(item.price, item.discount_percentage);
  
  return (
    <Card className="group relative flex flex-col h-full min-h-[350px] overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg animate-fade-in">
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

          {/* Info button for modal trigger */}
          {displayDescription && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-3 left-3 z-10 h-8 w-8 bg-white/90 hover:bg-white"
                >
                  <Info className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    {displayName}
                  </DialogTitle>
                  <DialogDescription className="text-left text-base mt-3 leading-relaxed">
                    {displayDescription}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-3">
                  {/* Price display in modal */}
                  <div className="flex items-center justify-between">
                    <div>
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
                    <Badge 
                      variant={item.remaining_quantity === 0 ? "destructive" : "secondary"} 
                      className="text-xs"
                    >
                      {getQuantityDisplay()}
                    </Badge>
                  </div>
                  
                  {/* Add to cart button in modal */}
                  <Button 
                    onClick={() => onAddToCart(item)} 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium" 
                    disabled={item.remaining_quantity === 0}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('item.add')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AspectRatio>
      </div>

      <div className="flex flex-col flex-grow p-4">
        {/* Title Section - Fixed Height */}
        <div className="h-12 flex items-center justify-center mb-3">
          <h3 className="font-semibold text-lg leading-tight text-center line-clamp-2">
            {displayName}
          </h3>
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
