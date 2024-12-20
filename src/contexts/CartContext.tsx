import React, { createContext, useContext, useState } from 'react';
import { toast } from '@/components/ui/use-toast';

export interface MenuItem {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  price: number;
  image: string;
  remainingQuantity?: number | null;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  total: number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: MenuItem) => {
    if (item.remainingQuantity !== null && item.remainingQuantity <= 0) {
      toast({
        title: "Error",
        description: "This item is sold out.",
        variant: "destructive",
      });
      return;
    }

    // Validate that the item.id is a UUID
    if (!item.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)) {
      console.error('Invalid menu item ID format:', item.id);
      toast({
        title: "Error",
        description: "Invalid menu item format. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setItems((currentItems) => {
      const existingItem = currentItems.find((i) => i.id === item.id);
      
      // Check if adding one more would exceed the remaining quantity
      if (existingItem && item.remainingQuantity !== null) {
        if (existingItem.quantity + 1 > item.remainingQuantity) {
          toast({
            title: "Error",
            description: "Cannot add more of this item - quantity limit reached.",
            variant: "destructive",
          });
          return currentItems;
        }
      }
      
      if (existingItem) {
        return currentItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...currentItems, { ...item, quantity: 1 }];
    });
    
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    });
  };

  const removeItem = (itemId: string) => {
    setItems((currentItems) => currentItems.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(itemId);
      return;
    }
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, total, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}