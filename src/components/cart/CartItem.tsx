import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { MenuItem } from "@/contexts/CartContext";

interface CartItemProps {
  item: MenuItem & { quantity: number };
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const { language } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in">
      <div className="flex items-center space-x-4">
        <img
          src={item.image}
          alt={language === 'en' ? item.name : item.name_ko}
          className="w-20 h-20 object-cover rounded-lg"
        />
        <div>
          <h3 className="font-medium text-lg">
            {language === 'en' ? item.name : item.name_ko}
          </h3>
          <p className="text-primary font-bold">${item.price}</p>
        </div>
      </div>
      <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="h-8 w-8"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.id)}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}