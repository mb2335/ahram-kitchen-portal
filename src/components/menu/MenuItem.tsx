
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { MenuItem as MenuItemType } from "@/contexts/CartContext";
import { Plus, Info, Minus, Eye } from "lucide-react";
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
  
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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
  
  const discountedPrice = calculateDiscountedPrice(item.price, item.discount_percentage);
  
  const maxQuantity = item.remaining_quantity || 99;
  
  const handleQuantityChange = (change: number) => {
    const newQuantity = selectedQuantity + change;
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setSelectedQuantity(newQuantity);
    }
  };
  
  const handleAddToCart = () => {
    for (let i = 0; i < selectedQuantity; i++) {
      onAddToCart(item);
    }
    setSelectedQuantity(1); // Reset to 1 after adding
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only open dialog if description exists and click wasn't on interactive elements
    if (displayDescription && !e.defaultPrevented) {
      const target = e.target as HTMLElement;
      const isInteractiveElement = target.closest('button') || target.tagName === 'BUTTON';
      if (!isInteractiveElement) {
        setIsDialogOpen(true);
      }
    }
  };
  
  return (
    <Card 
      className={`group relative flex flex-col h-full min-h-[350px] overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg animate-fade-in ${
        displayDescription ? 'cursor-pointer hover:ring-2 hover:ring-primary/20' : ''
      }`}
      onClick={handleCardClick}
      role={displayDescription ? "button" : undefined}
      tabIndex={displayDescription ? 0 : undefined}
      onKeyDown={(e) => {
        if (displayDescription && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          setIsDialogOpen(true);
        }
      }}
      aria-label={displayDescription ? `View details for ${displayName}` : undefined}
    >
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

          {/* Description available indicator */}
          {displayDescription && (
            <div className="absolute bottom-3 left-3 z-10">
              <Badge variant="secondary" className="bg-white/90 text-xs flex items-center gap-1">
                <Eye className="w-3 h-3" />
                View Details
              </Badge>
            </div>
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

        {/* Description hint for accessibility */}
        {displayDescription && (
          <div className="text-center mb-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-primary p-1 h-auto"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDialogOpen(true);
              }}
            >
              <Info className="w-3 h-3 mr-1" />
              Tap for details
            </Button>
          </div>
        )}

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

          {/* Quantity Selector */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleQuantityChange(-1);
                }}
                disabled={selectedQuantity <= 1}
                className="h-8 w-8"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{selectedQuantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleQuantityChange(1);
                }}
                disabled={selectedQuantity >= maxQuantity}
                className="h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Add to Cart Button - Fixed Height */}
          <div className="h-10">
            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToCart();
              }} 
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium h-full" 
              disabled={item.remaining_quantity === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('item.add')} {selectedQuantity > 1 && `(${selectedQuantity})`}
            </Button>
          </div>
        </div>
      </div>

      {/* Details Dialog */}
      {displayDescription && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
              
              {/* Quantity selector in modal */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={selectedQuantity <= 1}
                    className="h-8 w-8"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{selectedQuantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={selectedQuantity >= maxQuantity}
                    className="h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Add to cart button in modal */}
              <Button 
                onClick={handleAddToCart} 
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium" 
                disabled={item.remaining_quantity === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('item.add')} {selectedQuantity > 1 && `(${selectedQuantity})`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
