import { createContext, useContext, useState } from "react";
import { toast } from "@/hooks/use-toast";

export interface MenuItem {
  id: string;
  vendor_id: string | null;
  name: string;
  name_ko: string;
  description: string | null;
  description_ko: string | null;
  price: number;
  image: string | null;
  is_available: boolean | null;
  created_at: string | null;
  order_index: number;
  remaining_quantity: number | null;
  category_id: string | null;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: MenuItem) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      
      // Check if item is out of stock
      if (item.remaining_quantity === 0) {
        toast({
          title: "Item Out of Stock",
          description: "This item is currently unavailable",
          variant: "destructive",
        });
        return prevItems;
      }

      if (existingItem) {
        // Check if adding one more would exceed the remaining quantity
        if (item.remaining_quantity && existingItem.quantity >= item.remaining_quantity) {
          toast({
            title: "Quantity Limit Reached",
            description: `Only ${item.remaining_quantity} items available`,
            variant: "destructive",
          });
          return prevItems;
        }

        return prevItems.map((i) =>
          i.id === item.id
            ? { 
                ...i, 
                quantity: item.remaining_quantity 
                  ? Math.min(i.quantity + 1, item.remaining_quantity)
                  : i.quantity + 1 
              }
            : i
        );
      }

      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const maxQuantity = item.remaining_quantity || Infinity;
          const newQuantity = Math.max(0, Math.min(quantity, maxQuantity));
          
          if (quantity > maxQuantity) {
            toast({
              title: "Quantity Limit Reached",
              description: `Only ${maxQuantity} items available`,
              variant: "destructive",
            });
          }
          
          return newQuantity === 0
            ? item // Will be filtered out below
            : { ...item, quantity: newQuantity };
        }
        return item;
      }).filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};