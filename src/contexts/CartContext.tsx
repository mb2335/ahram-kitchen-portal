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

    setItems((currentItems) => {
      const existingItem = currentItems.find((i) => i.id === item.id);
      
      if (existingItem) {
        // Check if adding one more would exceed the remaining quantity
        if (item.remainingQuantity !== null) {
          const newQuantity = existingItem.quantity + 1;
          if (newQuantity > item.remainingQuantity) {
            toast({
              title: "Error",
              description: `Only ${item.remainingQuantity} items remaining.`,
              variant: "destructive",
            });
            return currentItems;
          }
        }
        
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

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    setItems((currentItems) => {
      const item = currentItems.find((i) => i.id === itemId);
      if (!item) return currentItems;

      // Check if the new quantity would exceed the remaining quantity
      if (item.remainingQuantity !== null && newQuantity > item.remainingQuantity) {
        toast({
          title: "Error",
          description: `Cannot add more than ${item.remainingQuantity} items.`,
          variant: "destructive",
        });
        return currentItems;
      }

      return currentItems.map((i) =>
        i.id === itemId ? { ...i, quantity: newQuantity } : i
      );
    });
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