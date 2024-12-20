import { createContext, useContext, useState } from "react";

export interface MenuItem {
  id: string;
  vendor_id: string | null;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  price: number;
  image: string;
  quantity: number | null;
  remainingQuantity: number | null;
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
      if (existingItem) {
        // Check quantity limit if it exists
        if (item.quantity !== null) {
          const currentTotal = existingItem.quantity;
          const remaining = item.quantity - (item.remainingQuantity || 0);
          if (currentTotal >= remaining) {
            return prevItems; // Don't add more if limit reached
          }
        }
        return prevItems.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + 1 }
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
          const maxQuantity = item.quantity || Infinity;
          const newQuantity = Math.max(0, Math.min(quantity, maxQuantity));
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